// Names a pane (the terminal in it). The name shows in the pane-named header and
// in Better Sidebar's agent rows. It lives in shared "pane-named.names", keyed by
// terminal, so it survives app restarts. Enter saves, Esc cancels; an empty name
// brings back the automatic title.
// It opens from a key (keys.json: "mod.open:pane-rename", for the focused pane) or
// from the pane-named pencil (props: { terminal }). Drawn like Herdr's own prompt.

import { View, div } from "gpui-kit";
import { v_flex, h_flex, InputState, Input } from "gpui-base";
import { props, focused, terminals, closeOverlay, theme, shared, setShared } from "herdr";

const NAMES = "pane-named.names";

function names() {
  const value = shared(NAMES);
  return value && typeof value === "object" ? value : {};
}

// Drops the names of terminals that ended, as Better Sidebar's pins do: a name is
// kept while its terminal is live, or while its machine hasn't been heard from.
function pruned(saved) {
  const all = terminals();
  const machine = (address) => (address.includes("/") ? address.split("/")[0] : "");
  const heard = new Set(all.map((t) => machine(t.address)));
  const live = new Set(all.filter((t) => t.state === "live").map((t) => t.address));
  return Object.fromEntries(Object.entries(saved).filter(([address]) => !heard.has(machine(address)) || live.has(address)));
}

export default class PaneRename extends View {
  init(_props, cx) {
    this.terminal = props()?.terminal ?? focused()?.terminal ?? null;
    this.text = (this.terminal && names()[this.terminal]) || "";
    this.input = InputState.new({ value: this.text });
    if (this.text) this.input.set_selected_range({ start: 0, end: this.text.length });
    this.input.on("change", (_e, cx) => { this.text = this.input.value(); cx.notify(); });
    this.input.on("submit", () => this.submit());
    this.inputFocused = true;
    this.input.on("focus", (_e, cx) => { this.inputFocused = true; cx.notify(); });
    this.input.on("blur", (_e, cx) => { this.inputFocused = false; cx.notify(); });
    this.input.focus();
    cx.timer.after(600, () => this.input.focus());
    this.handle = cx.focus_handle();
  }

  close() {
    closeOverlay(props()?.overlay);
  }

  submit() {
    if (this.terminal) {
      const next = pruned(names());
      const name = this.text.trim();
      if (name) next[this.terminal] = name;
      else delete next[this.terminal];
      setShared(NAMES, next);
    }
    this.close();
  }

  key(e, cx) {
    if (e.key === "escape") { this.close(); cx.stop_propagation(); }
  }

  render() {
    const t = theme();
    const label = (text) => div().pt(16).pb(7).text_size(11.5).text_color(t.dim).child(text);
    const button = (id, text, primary, action) => h_flex().id(id).h(32).px(14).items_center().rounded(8)
      .border_1().border_color(primary ? t.solid : t.input).bg(primary ? t.solid : t.raised)
      .text_color(primary ? t.solid_foreground : t.foreground).text_size(12.5).font_medium().cursor_pointer()
      .hover(s => s.opacity(0.88)).on_click(action).child(text);
    const hint = this.terminal
      ? "empty: its title"
      : "not a terminal pane: nothing to save";
    return v_flex().id("pane-rename").track_focus(this.handle).on_key_down((e, cx) => this.key(e, cx))
      .w_full().min_h(0).p(18).bg(t.popover).text_color(t.foreground)
      .child(h_flex().items_center()
        .child(div().flex_1().text_size(15).font_semibold().child("Rename pane"))
        .child(div().text_size(11).text_color(t.dim).child("Esc")))
      .child(label("Name"))
      .child(Input.new(this.input).h(36).px(10).rounded(9).border_1()
        .border_color(this.inputFocused ? t.accent : t.input).bg(t.background)
        .text_size(12.8).text_color(t.foreground))
      .child(div().pt(6).text_size(11.5).text_color(t.dim).child(hint))
      .child(h_flex().pt(20).gap(8).justify_end()
        .child(button("pr-cancel", "Cancel", false, () => this.close()))
        .child(button("pr-save", "Save", true, () => this.submit())));
  }
}
