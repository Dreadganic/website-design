"""Inline sprites.json into a .dc.html template (replaces __SPRITES__)."""
import json, sys
d = json.load(open(sys.argv[1]))
art = {k: d[k] for k in ("sprites", "palettes", "classic", "shirts", "dmg")}
open(sys.argv[3], "w").write(open(sys.argv[2]).read().replace("__SPRITES__", json.dumps(art, separators=(",", ":"))))
