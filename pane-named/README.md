# Pane Named

A pane header for [Herdr Desktop](https://herdr.dev/) that shows the name you gave the pane. Herdr names spaces and tabs, but not the panes inside a tab, so a tab with several agents shows the same name on each. With this header and [Pane Rename](../pane-rename/README.md), each pane keeps its own.

- **The name, or what Herdr shows.** A named pane shows its name; any other pane shows what Herdr's own header shows: the agent's name or the terminal's title, then its folder and the agent's status.
- **Rename from the header.** On hover, a pencil sits beside the split, zoom and close buttons. A double-click on the name opens the same dialog.
- **Herdr's own header otherwise.** It's a copy of the `pane` header Herdr ships, so it looks and behaves the same. Its icons are its own copies.

Names are kept per Herdr app, in its `shared.json`: a name given on one computer doesn't show in Herdr on another.

## Install

Copy this prompt into your Herdr agent:

> Read ~/.config/herdr-app/AGENTS.md, then add this mod: https://github.com/djalmajr/herdr-mods/tree/main/pane-named

[RECIPE.md](RECIPE.md) guides the install. Install [Pane Rename](../pane-rename/README.md) with it: the pencil opens its dialog. There are no settings.

## Use with Better Sidebar

This fork's [Better Sidebar](../better-sidebar/README.md) shows a named pane's name in its agent rows, in place of the tab's.

## Development

```sh
node --test pane-named/tests/
./pane-named/sync.sh   # copies mods/pane-named/ into Herdr, which reloads it
```
