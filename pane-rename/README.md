# Pane Rename

A dialog that names a pane in [Herdr Desktop](https://herdr.dev/). Herdr can rename spaces and tabs, but not a pane, so a tab with several agents can't tell them apart. The name shows in the [Pane Named](../pane-named/README.md) header and in this fork's [Better Sidebar](../better-sidebar/README.md) agent rows.

- **Drawn like Herdr's own prompt:** "Rename pane", a Name field with the current name selected, Cancel and Save. Enter saves, Esc cancels.
- **An empty name** brings back the automatic title.
- **Opens from a key** for the focused pane, or from the Pane Named pencil for that pane.

Names are kept per Herdr app, in its `shared.json`, keyed by terminal, so they survive restarts. A name given on one computer doesn't show in Herdr on another.

## Keys

`keys.json` suggests `alt-r` and `f2` for the focused pane:

```json
{ "global": { "alt-r": "mod.open:pane-rename", "f2": "mod.open:pane-rename" } }
```

Herdr binds `f2` and `alt-r` to `tab.rename` in some setups; move those first. One arrangement: the plain key renames the pane, with `shift` the tab, with `ctrl` the space (`cmd` in place of `alt` on macOS).

## Install

Copy this prompt into your Herdr agent:

> Read ~/.config/herdr-app/AGENTS.md, then add this mod: https://github.com/djalmajr/herdr-mods/tree/main/pane-rename

[RECIPE.md](RECIPE.md) guides the install. There are no settings.

## Development

```sh
node --test pane-rename/tests/
./pane-rename/sync.sh   # copies mods/pane-rename/ into Herdr, which reloads it
```
