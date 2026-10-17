"""Build the playable game page: inline the sprites and every farm scene (as data urls) into play/template.html.
Usage: python3 game-assets/play/build.py <output.html>"""
import base64, json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
d = json.load(open(os.path.join(ROOT, "sprites.json")))
art = {k: d[k] for k in ("sprites", "shirts", "shrubs", "locations", "varieties", "storage", "carry", "hats", "buildings")}
bgs = {}
for f in sorted(os.listdir(os.path.join(ROOT, "bg"))):
    if f.endswith(".png"):
        bgs[f[:-4]] = "data:image/png;base64," + base64.b64encode(open(os.path.join(ROOT, "bg", f), "rb").read()).decode()
t = open(os.path.join(HERE, "template.html")).read()
sfx = open(os.path.join(ROOT, "audio", "sfx.js")).read()
t = t.replace("__SFX__", sfx).replace("__ART__", json.dumps(art, separators=(",", ":"))).replace("__BGS__", json.dumps(bgs, separators=(",", ":")))
open(sys.argv[1], "w").write(t)
print(sys.argv[1], len(t) // 1024, "KB")
