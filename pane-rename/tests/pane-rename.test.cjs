const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const runtime = path.join(__dirname, "../mods/pane-rename");

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

function harness({ props = {}, focused = null, shared = {}, terminals = [] } = {}) {
  const live = { props, focused, shared, terminals, closed: [] };
  const input = { value: "", handlers: {}, selected: null };
  const context = {
    View: class {},
    div: element,
    v_flex: element,
    h_flex: element,
    Input: { new: element },
    InputState: {
      new: ({ value }) => {
        input.value = value;
        return {
          on: (event, handler) => (input.handlers[event] = handler),
          value: () => input.value,
          focus() {},
          set_selected_range: (range) => (input.selected = range),
        };
      },
    },
    props: () => live.props,
    focused: () => live.focused,
    terminals: () => live.terminals,
    closeOverlay: (id) => live.closed.push(id),
    theme: () => new Proxy({}, { get: (_t, k) => String(k) }),
    shared: (key) => live.shared[key],
    setShared: (key, value) => (live.shared[key] = value),
  };
  vm.createContext(context);
  const source = fs
    .readFileSync(path.join(runtime, "main.js"), "utf8")
    .replace(/^import\s+[\s\S]*?;\n/gm, "")
    .replace("export default class", "class");
  vm.runInContext(`${source}\nglobalThis.PaneRename = PaneRename;`, context);
  const mod = new context.PaneRename();
  mod.init({}, cx);
  // Typing replaces the field's text and fires its change event, as the input does.
  const type = (text) => {
    input.value = text;
    input.handlers.change({}, cx);
  };
  return { live, input, mod, type };
}

// Values built inside the vm have its prototypes; compare them as plain data.
const plain = (value) => JSON.parse(JSON.stringify(value));
const cx = { timer: { after() {} }, focus_handle: () => ({}), notify() {}, stop_propagation() {} };
const strings = (node) =>
  typeof node === "string" ? node : (node?.nodes ?? []).map(strings).join(" ");

test("opened from a key, the name goes to the focused terminal", () => {
  const { live, input, type } = harness({ props: { overlay: "o1" }, focused: { terminal: "t1" } });
  type("Tweaks");
  input.handlers.submit();
  assert.deepEqual(plain(live.shared["pane-named.names"]), { t1: "Tweaks" });
  assert.deepEqual(live.closed, ["o1"]);
});

test("opened from a header's pencil, that pane's terminal wins over the focused one", () => {
  const { live, input, type } = harness({ props: { overlay: "o1", terminal: "t2" }, focused: { terminal: "t1" } });
  type("Logs");
  input.handlers.submit();
  assert.deepEqual(plain(live.shared["pane-named.names"]), { t2: "Logs" });
});

test("it starts with the current name selected, and an empty name removes only that one", () => {
  const { live, input, type } = harness({
    props: { overlay: "o1", terminal: "t1" },
    shared: { "pane-named.names": { t1: "Old", t3: "Other" } },
    terminals: [{ address: "t1", state: "live" }, { address: "t3", state: "live" }],
  });
  assert.equal(input.value, "Old");
  assert.deepEqual(plain(input.selected), { start: 0, end: 3 });
  type("   ");
  input.handlers.submit();
  assert.deepEqual(plain(live.shared["pane-named.names"]), { t3: "Other" });
});

test("a pane without a terminal saves nothing, and says so", () => {
  const { live, input, mod, type } = harness({ props: { overlay: "o1" }, focused: { terminal: null } });
  assert.match(strings(mod.render()), /not a terminal pane/);
  type("Ignored");
  input.handlers.submit();
  assert.equal(live.shared["pane-named.names"], undefined);
  assert.deepEqual(live.closed, ["o1"]);
});

test("Esc closes without saving", () => {
  const { live, mod, type } = harness({ props: { overlay: "o1" }, focused: { terminal: "t1" } });
  type("Unsaved");
  mod.key({ key: "escape" }, cx);
  assert.deepEqual(live.closed, ["o1"]);
  assert.equal(live.shared["pane-named.names"], undefined);
});

test("it reads like Herdr's own prompt", () => {
  const { mod } = harness({ props: { overlay: "o1" }, focused: { terminal: "t1" } });
  const text = strings(mod.render());
  for (const word of ["Rename pane", "Name", "empty: its title", "Cancel", "Save"]) assert.match(text, new RegExp(word));
});

test("saving drops names of terminals that ended, but keeps those of machines not heard from", () => {
  const { live, input, type } = harness({
    props: { overlay: "o1", terminal: "t1" },
    shared: { "pane-named.names": { t2: "Ended", "mac/t9": "Remote" } },
    terminals: [{ address: "t1", state: "live" }, { address: "t2", state: "exited" }],
  });
  type("Tweaks");
  input.handlers.submit();
  assert.deepEqual(plain(live.shared["pane-named.names"]), { "mac/t9": "Remote", t1: "Tweaks" });
});
