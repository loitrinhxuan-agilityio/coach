#!/bin/sh
# Compare this folder against MANIFEST.txt and against the canvas index.
# Reports local drift. It cannot see the published artifact — fetching a new
# version is Claude's job (see README.md, "Keeping the two in step").
set -eu
cd "$(dirname "$0")"

echo "== manifest =="
sed -n 's/^# version:  *//p;s/^# captured: *//p' MANIFEST.txt | sed 's/^/  /'

echo "== checksums =="
if (cd project && grep -v '^#' ../MANIFEST.txt | grep -v '^$' | shasum -a 256 -c --status -); then
  echo "  OK - all $(grep -vc "^#\|^$" MANIFEST.txt) files match the captured version"
else
  (cd project && grep -v '^#' ../MANIFEST.txt | grep -v '^$' | shasum -a 256 -c - 2>&1) \
    | grep -v ': OK$' | sed 's/^/  /'
  echo "  ^ drifted since capture"
fi

echo "== index vs disk =="
python3 -I -c '
import json, os
d = json.load(open("project/canvas.json"))
boards, order = set(d["boards"]), list(d["order"])
disk = {f for f in os.listdir("project") if f.endswith(".dc.html")}
missing, extra = sorted(boards - disk), sorted(disk - boards)
print(f"  boards {len(boards)}  order {len(order)}  on disk {len(disk)}")
print("  listed but missing:", missing or "none")
print("  on disk, unlisted: ", extra or "none")
print("  order covers index:", set(order) == boards)
if missing or extra or set(order) != boards:
    raise SystemExit(1)
'
