// A pane header that shows the pane's own name. A copy of the `pane` header mod
// Herdr ships (Apache-2.0, see NOTICE), with three changes:
//   - it shows the name given to the pane, if any (shared "pane-named.names",
//     keyed by terminal, written by pane-rename); otherwise what `pane` shows:
//     the agent's name or the terminal's title;
//   - a pencil among the hover buttons opens pane-rename for this pane;
//   - double-clicking the name opens it too.
// Use it as a layout's pane header: "header": { "content": { "mod": "pane-named" } }.
// Its icons are its own copies, so it reads no other mod's folder.

import { View, div, svg, image } from "gpui-kit";
import { h_flex } from "gpui-base";
import { panes, props, run, theme, home, layout, shared, openOverlay } from "herdr";

const NAMES = "pane-named.names";
const ICONS = "mods/pane-named";

// Match the first visible tab frame, including the active child of a stack.
function paneFrame(node) {
  if (!node || node.hidden) return null;
  if (node.content?.tab && node.content.pane) return node.content.pane;
  let children = node.children ?? [];
  if (node.type === "stack") {
    const visible = children.filter(child => !child.hidden);
    children = [visible.find(child => child.id === node.active) ?? visible[0]];
  }
  for (const child of children) {
    const frame = paneFrame(child);
    if (frame) return frame;
  }
  return null;
}

function icon(p, size, color) {
  if (!p?.icon) return null;
  return p.tint ? svg(p.icon).size(size).flex_none().text_color(color) : image(p.icon).w(size).h(size).flex_none();
}

function folder(cwd) {
  if (!cwd) return "";
  const h = home();
  return cwd === h ? "~" : cwd.startsWith(h + "/") ? "~" + cwd.slice(h.length) : cwd;
}

function customName(terminal) {
  const names = shared(NAMES);
  return terminal && names && typeof names === "object" ? names[terminal] || null : null;
}

function openRename(terminal) {
  openOverlay({ mod: "pane-rename", kind: "dialog", width: 420, props: { terminal } });
}

export default class PaneNamed extends View {
  init() { this.hovered = false; }

  me() {
    return panes().find((p) => p.pane === props()?.pane);
  }

  button(t, id, file, action) {
    return div()
      .id(id)
      .p(3)
      .rounded(4)
      .text_color(t.dim)
      .hover((s) => s.bg(t.hover).text_color(t.foreground))
      .on_click((_e, cx) => {
        cx.stop_propagation();
        action();
      })
      .child(svg(`${ICONS}/${file}.svg`).size(14));
  }

  render(cx) {
    const t = theme();
    const p = this.me();
    if (!p) return div();
    const auto = ((p.program?.agent || p.program?.shell) && p.program.name) || p.title || p.program?.name || "shell";
    const name = customName(p.terminal) || auto;
    const pic = icon(p.program, 14, t.dim);
    const st = p.status;
    const pane = p.pane;
    const bottom = paneFrame(layout())?.header?.position === "bottom";
    return h_flex()
      .id(`pane-head-${pane}`)
      .size_full()
      .px(10)
      .gap(8)
      .items_center()
      .bg(t.background)
      .when(bottom, el => el.border_t(1))
      .when(!bottom, el => el.border_b(1))
      .border_color(t.border)
      .text_size(12)
      .on_hover((hovered, cx) => { this.hovered = hovered; cx.notify(); })
      .on_click(() => run("pane.focus", { pane }))
      .when(Boolean(pic), (el) => el.child(pic))
      .child(div()
        .id(`pane-name-${pane}`)
        .flex_none().truncate().max_w(260).font_medium().text_color(t.foreground)
        // A single click goes on to the header, which focuses the pane.
        .when(Boolean(p.terminal), el => el.on_click((e, cx) => {
          if (e.click_count >= 2) { cx.stop_propagation(); openRename(p.terminal); }
        }))
        .child(name))
      .child(div().flex_1().truncate().text_color(t.dim).child(folder(p.cwd)))
      .when(st === "working", el => el.child(svg(`${ICONS}/spinner.svg`).size(12).flex_none().text_color(t.working).spin(900)))
      .when(st === "blocked", el => el.child(div().flex_none().px(6).h(18).flex().items_center().rounded(5).bg(t.blocked + "26").text_size(10.5).font_semibold().text_color(t.blocked).child("Needs you")))
      .when(st === "done", el => el.child(div().size(7).flex_none().rounded(4).bg(t.done)))
      .when(this.hovered, el => el
        .when(Boolean(p.terminal), el2 => el2.child(this.button(t, `ph-n-${pane}`, "rename", () => openRename(p.terminal))))
        .child(this.button(t, `ph-r-${pane}`, "split-right", () => run("pane.split", { direction: "right", pane })))
        .child(this.button(t, `ph-d-${pane}`, "split-down", () => run("pane.split", { direction: "down", pane })))
        .child(this.button(t, `ph-z-${pane}`, p.zoomed ? "unzoom" : "zoom", () => run("pane.zoom", { pane })))
        .child(this.button(t, `ph-x-${pane}`, "close", () => run("pane.close", { pane }))));
  }
}
