# Prototype tools

Scripts that generate the redrawn boards and build the interactive prototype page. They were kept in a
temporary folder during the work and moved here so the work can be resumed. Running them from this folder
reproduces the published boards and page **byte for byte** (checked on 2026-11-18).

| File | Does |
|---|---|
| `lib.py` | The shared Studio-light template: real palette and type from `evidence/themes.json`, the rail, the tiles, the "copy" sentence row, the figure placeholder |
| `gen1.py` … `gen7.py` | Each writes boards into `../project/`. They import one another, so **running the last one (`gen7.py`) regenerates all 29 redrawn desktop boards**. Edit the content in the script, not the `.dc.html`, or the next run will overwrite your edit |
| `gen3.py` | The phone Today board (390 × 844) |
| `shell.html` | The interactive page's chrome, router and screen directory, with two placeholders for the boards' CSS and data |
| `build.py` | Reads `../project/*.dc.html`, scopes each board's CSS, rewrites links between boards into hash routes, and writes `dist/index.html` |

```bash
cd docs/product/shredpace/prototype/tools
python3 -I gen7.py     # regenerate the redrawn boards into ../project/
python3 -I build.py    # build dist/index.html (the interactive page)
```

Notes
- Python 3.9 is the version in use: **no backslashes inside f-string expressions**.
- `build.py` refuses a board whose CSS has an `@media` rule (it cannot scope those). The boards use none.
- The interactive page's screen list (49 screens) is in `build.py`; add a screen there when a board is added.
- After regenerating, the stored copy must be re-published and `../MANIFEST.txt` regenerated; see
  [../README.md](../README.md) and [../../review/handoff.md](../../review/handoff.md).
- `dist/` is build output and can be deleted.
