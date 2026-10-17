"""Build the farm artboard: inline sprites.json and the background asset url into the template.
Usage: python3 game-assets/inject.py <background-url> <output.dc.html>"""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
d = json.load(open(os.path.join(HERE, "sprites.json")))
art = {k: d[k] for k in ("sprites", "shirts", "shrubs")}
t = open(os.path.join(HERE, "GameFarm.template.html")).read()
open(sys.argv[2], "w").write(t.replace("__SPRITES__", json.dumps(art, separators=(",", ":"))).replace("__BG__", sys.argv[1]))
