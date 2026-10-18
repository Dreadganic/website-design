"""Build the playable game page: inline the sprites and every farm scene (as data urls) into play/template.html.
Usage: python3 game-assets/play/build.py <output.html> [--site] [--launch]\n   --site wraps it as a full web page for bejucoffee.com/farm/ (hidden from search); --launch drops that noindex."""
import base64, json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
d = json.load(open(os.path.join(ROOT, "sprites.json")))
art = {k: d[k] for k in ("sprites", "shirts", "shrubs", "locations", "varieties", "storage", "carry", "hats", "buildings", "chars", "bskins", "seasons", "estbg")}
bgs = {}
for f in sorted(os.listdir(os.path.join(ROOT, "bg"))):
    if f.endswith(".png"):
        bgs[f[:-4]] = "data:image/png;base64," + base64.b64encode(open(os.path.join(ROOT, "bg", f), "rb").read()).decode()
t = open(os.path.join(HERE, "template.html")).read()
sfx = open(os.path.join(ROOT, "audio", "sfx.js")).read()
music = open(os.path.join(ROOT, "audio", "music.js")).read()
cozy = open(os.path.join(ROOT, "audio", "cozy.js")).read()
if "--launch" in sys.argv:   # the public game: no Test tab cheats
    assert "const TEST_TOOLS = true;" in t
    t = t.replace("const TEST_TOOLS = true;", "const TEST_TOOLS = false;")
t = t.replace("__SFX__", sfx).replace("__MUSIC__", music).replace("__COZY__", cozy).replace("__ART__", json.dumps(art, separators=(",", ":"))).replace("__BGS__", json.dumps(bgs, separators=(",", ":")))
if "--site" in sys.argv:   # a full page for bejucoffee.com/farm/, kept out of search results
    title = t[:t.index("</title>") + 8] if t.startswith("<title>") else ""
    t = t[len(title):]
    t = ('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
         + ('' if "--launch" in sys.argv else '<meta name="robots" content="noindex, nofollow">') + title + '<meta name="theme-color" content="#3A2A1C"><link rel="icon" href="/favicon.svg">'
         '</head><body style="margin:0">' + t + '</body></html>')
open(sys.argv[1], "w").write(t)
print(sys.argv[1], len(t) // 1024, "KB")
