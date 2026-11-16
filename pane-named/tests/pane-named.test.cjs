const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const runtime = path.join(__dirname, "../mods/pane-named");

function element() {
  const node = { nodes: [], handlers: {} };
  const proxy = new Proxy(node, {
    get(target, key) {
      if (key in target) return target[key];
      if (key === "child") return (c) => (target.nodes.push(c), proxy);
      if (key === "when") return (c, build) => (c && build(proxy), proxy);
      return (...args) => {
        if (key === "id") target.id = args[0];
        if (String(key).startsWith("on_")) target.handlers[key] = args[0];
        return proxy;
      };
    },
  });
  return proxy;
}

function harness({ pane, shared = {} }) {
  const live = { panes: [pane], shared, overlays: [], commands: [] };
  const context = {
    View: class {},
    div: element,
    svg: (file) => Object.assign(element(), { file }),
    image: element,
    h_flex: element,
    panes: () => live.panes,
    props: () => ({ pane: pane.pane, terminal: pane.terminal }),
    run: (name, args) => live.commands.push({ name, args }),
    theme: () => new Proxy({}, { get: (_t, k) => String(k) }),
    home: () => "/home/me",
    layout: () => null,
    shared: (key) => live.shared[key],
    openOverlay: (spec) => live.overlays.push(spec),
  };
  vm.createContext(context);
  const source = fs
    .readFileSync(path.join(runtime, "main.js"), "utf8")
    .replace(/^import\s+[\s\S]*?;\n/gm, "")
    .replace("export default class", "class");
  vm.runInContext(`${source}\nglobalThis.PaneNamed = PaneNamed;`, context);
  const mod = new context.PaneNamed();
  mod.init();
  return { live, mod };
}

// Values built inside the vm have its prototypes; compare them as plain data.
const plain = (value) => JSON.parse(JSON.stringify(value));
const cx = { notify() {}, stop_propagation() {} };
const find = (node, id) =>
  node?.id === id ? node : node?.nodes?.map((n) => find(n, id)).find(Boolean);
const strings = (node) =>
  typeof node === "string" ? node : (node?.nodes ?? []).map(strings).join(" ");
const agentPane = {
  pane: "p1",
  terminal: "t1",
  title: "✳ Claude Code",
  cwd: "/home/me/project",
  status: "idle",
  program: { name: "Claude Code", agent: true },
};

test("it shows the pane's own name, and the agent's name without one", () => {
  const named = harness({ pane: agentPane, shared: { "pane-named.names": { t1: "Tweaks" } } });
  assert.match(strings(find(named.mod.render(cx), "pane-name-p1")), /Tweaks/);
  const plain = harness({ pane: agentPane });
  assert.match(strings(find(plain.mod.render(cx), "pane-name-p1")), /Claude Code/);
  assert.match(strings(plain.mod.render(cx)), /~\/project/, "the folder, shortened, after the name");
});

test("on hover, the pencil opens the rename dialog for this pane's terminal", () => {
  const { live, mod } = harness({ pane: agentPane });
  assert.equal(find(mod.render(cx), "ph-n-p1"), undefined, "no buttons until hovered");
  find(mod.render(cx), "pane-head-p1").handlers.on_hover(true, cx);
  const pencil = find(mod.render(cx), "ph-n-p1");
  pencil.handlers.on_click({}, cx);
  assert.deepEqual(plain(live.overlays), [{ mod: "pane-rename", kind: "dialog", width: 420, props: { terminal: "t1" } }]);
  assert.equal(pencil.nodes[0].file, "mods/pane-named/rename.svg", "its icons are its own");
});

test("a double-click on the name opens the dialog; a single click is left to the header", () => {
  const { live, mod } = harness({ pane: agentPane });
  const tree = mod.render(cx);
  const name = find(tree, "pane-name-p1");
  name.handlers.on_click({ click_count: 1 }, cx);
  assert.deepEqual(plain(live.commands), [], "the name doesn't focus too, or the pane would be focused twice");
  assert.equal(live.overlays.length, 0);
  find(tree, "pane-head-p1").handlers.on_click({ click_count: 1 }, cx);
  assert.deepEqual(plain(live.commands), [{ name: "pane.focus", args: { pane: "p1" } }]);
  name.handlers.on_click({ click_count: 2 }, cx);
  assert.equal(live.overlays[0].props.terminal, "t1");
});

test("a mod pane has nothing to rename", () => {
  const { live, mod } = harness({ pane: { pane: "p2", terminal: null, title: "Changes", status: null, program: {} } });
  find(mod.render(cx), "pane-head-p2").handlers.on_hover(true, cx);
  const tree = mod.render(cx);
  assert.equal(find(tree, "ph-n-p2"), undefined);
  assert.equal(find(tree, "pane-name-p2").handlers.on_click, undefined);
  assert.equal(live.overlays.length, 0);
});
