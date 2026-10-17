"""Render a still of the Huila farm layout with the current sprites (farm-preview.png)."""
import json, os, random, sys
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
d = json.load(open(os.path.join(HERE, "sprites.json")))


def rgba(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + ((int(h[6:8], 16),) if len(h) == 8 else (255,))


def spr(n, shirt=None, flip=False):
    s = d["sprites"][n]; pal = dict(s["pal"])
    if shirt:
        pal.update(c=shirt[0], C=shirt[1], D=shirt[2])
    im = Image.new("RGBA", (s["w"], s["h"]), (0, 0, 0, 0))
    for y, r in enumerate(s["rows"]):
        for x, ch in enumerate(r):
            if ch != ".":
                im.putpixel((x, y), rgba(pal[ch]))
    return im.transpose(Image.FLIP_LEFT_RIGHT) if flip else im


W, H = 192, 240
im = Image.new("RGBA", (W, H))
put = lambda n, x, y, **k: im.alpha_composite(spr(n, **k), (0, 0), (0, 0)) if False else im.paste(Image.alpha_composite(im.crop((x, y, x + d["sprites"][n]["w"], y + d["sprites"][n]["h"])) if x >= 0 and y >= 0 else Image.new("RGBA", (d["sprites"][n]["w"], d["sprites"][n]["h"])), spr(n, **k)) if x >= 0 and y >= 0 else spr(n, **k), (x, y), spr(n, **k))
def put(n, x, y, **k):
    s = spr(n, **k)
    layer = Image.new("RGBA", (W, H)); layer.paste(s, (x, y), s)
    im.alpha_composite(layer)
fields = [(1, 5, 0), (7, 5, 0), (1, 9, 0), (7, 9, 1)]
fl = [(1, 4), (3, 4), (8, 4), (10, 4), (2, 8), (9, 8), (3, 12), (8, 12), (0, 3), (11, 12)]
for r in range(15):
    for c in range(12):
        t = "grass_b" if (c + r * 3) % 4 == 0 else "grass"
        if r == 14 or any(l and f <= c < f + 4 and g <= r < g + 3 for f, g, l in fields): t = "tallgrass"
        elif c in (5, 6) and 3 <= r <= 13: t = "path"
        elif any(not l and f <= c < f + 4 and g <= r < g + 3 for f, g, l in fields): t = "soil"
        elif (c, r) in fl: t = "grass_flower"
        put(t, c * 16, r * 16)
put("pond", 138, 22); put("drybed", 18, 8); put("drybed", 18, 30); put("walls", 60, 26); put("roof", 60, 0); put("step", 89, 53); put("sign", 114, 52)
for c in range(12):
    if c not in (5, 6): put("fence", c * 16, 204)
put("sign", 136, 156)
for n, x, y in [("tree", 136, -8), ("tree", 162, -10), ("fruittree", 170, 56), ("bigtree", -16, 42), ("tree", 172, 74), ("fruittree", -8, 138), ("tree", 172, 138), ("tree", -8, 212), ("tree", 172, 212)]:
    put(n, x, y)
put("cherrypile", 64, 48); put("basket", 64, 48)
rnd = random.Random(3)
for f, g, l in fields:
    if l: continue
    for r in range(3):
        for c in range(4):
            p = rnd.random() * 1.15
            put("sprout" if p < .3 else "bush_young" if p < .55 else "bush_flower" if p < .8 else "bush_green" if p < 1 else "bush_ripe", (f + c) * 16, (g + r) * 16)
S = d["shirts"]
put("worker_down_0", 88, 40, shirt=S[0]); put("worker_side_1", 40, 92, shirt=S[1], flip=True); put("worker_up_1", 128, 118, shirt=S[2]); put("sack", 37, 104)
im.resize((W * 3, H * 3), Image.NEAREST).save(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "farm-preview.png"))
