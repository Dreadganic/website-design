"""Build the farm artboard: inline sprites.json and the uploaded scene urls (bg-assets.json) into the template.
Usage: python3 game-assets/inject.py <output.dc.html>"""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
d = json.load(open(os.path.join(HERE, "sprites.json")))
art = {k: d[k] for k in ("sprites", "shirts", "shrubs", "locations", "varieties")}
bgs = json.load(open(os.path.join(HERE, "bg-assets.json")))
t = open(os.path.join(HERE, "GameFarm.template.html")).read()
t = t.replace("__SPRITES__", json.dumps(art, separators=(",", ":"))).replace("__BGS__", json.dumps(bgs, separators=(",", ":")))
open(sys.argv[1], "w").write(t)
