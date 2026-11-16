# Pane Rename

A dialog that names the focused pane's terminal, or the terminal in `props().terminal`. It writes `shared("pane-named.names")`, an object `{ <terminal id>: name }`; an empty name deletes the entry.

## Install

1. Copy `mods/pane-rename/` to `~/.config/herdr-app/mods/pane-rename/` (or run `sync.sh`).
2. Merge `keys.json` into the person's `~/.config/herdr-app/keys.json`, only where a key is free; ask before moving a key in use (Herdr setups often bind `f2` or `alt-r` to `tab.rename`). On macOS, offer `cmd-r` in place of `alt-r`.
3. Install Pane Named too (`../pane-named/RECIPE.md`), so the name shows in the pane header.
4. Check with `herdr-app check ~/.config/herdr-app/mods/pane-rename` and `herdr-app status` (field `errors`).

## Built from

`mods/pane-rename/`: `main.js` (the dialog, drawn like Herdr's shipped `prompt` mod), `mod.json` (`place: none`, opens as a 420px dialog, no settings), `mod.schema.json`. Beside it: `keys.json`, `tests/pane-rename.test.cjs`, `sync.sh`. It imports `View`, `div`, `v_flex`, `h_flex`, `InputState`, `Input`, and from Herdr `props`, `focused`, `closeOverlay`, `theme`, `shared`, `setShared`. It runs no programs and makes no network calls.

## Watch out

Herdr has no pane name of its own yet (herdrdev/herdr-app#322 asks for `terminal.rename`). If it adds one, move to it and drop the shared key.
