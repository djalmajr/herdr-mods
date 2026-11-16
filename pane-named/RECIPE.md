# Pane Named

A pane header that shows a pane's own name, kept by Pane Rename in `shared("pane-named.names")` as `{ <terminal id>: name }`. Without a name it shows what Herdr's shipped `pane` header shows.

## Install

1. Copy `mods/pane-named/` to `~/.config/herdr-app/mods/pane-named/` (or run `sync.sh`). Copy the folder, don't symlink it: Herdr loads code through a symlink but not the icons.
2. In each layout that frames its panes, set the pane header to this mod: `"pane": { "header": { "content": { "mod": "pane-named" } } }`. Keep the layout's other header fields (`height`, `position`, `reveal`). Ask before changing a header that isn't Herdr's `pane`.
3. Install Pane Rename too (`../pane-rename/RECIPE.md`); the header's pencil opens it.
4. Check with `herdr-app check ~/.config/herdr-app/mods/pane-named` and `herdr-app status` (field `errors`).

## Built from

`mods/pane-named/`: `main.js` (a copy of Herdr's shipped `pane` header with the name lookup, a rename button and double-click to rename), the icons it draws (`close`, `split-right`, `split-down`, `zoom`, `unzoom`, `spinner`, adapted from Herdr Desktop, and `rename`), `mod.json` (`place: none`, no settings), `mod.schema.json`. It imports `View`, `div`, `svg`, `image`, `h_flex`, and from Herdr `panes`, `props`, `run`, `theme`, `home`, `layout`, `shared`, `openOverlay`. It runs no programs and makes no network calls.

## Watch out

The shared key `pane-named.names` is read by Pane Rename and by this fork's Better Sidebar. Rename it in all three or none.
