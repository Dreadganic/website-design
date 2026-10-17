"""Beju Farm art: cozy modern pixel art (warm olive greens, ochre earth, fluffy shaded trees).

Writes, into game-assets/:
  farm-bg.png       the painted Huila farm (192 x 240), everything that doesn't move
  sprites.json      the moving pieces (coffee shrubs, workers, the shiba, props) as palette grids
  sheet.png / @4x   all moving sprites on one sheet
  farm-preview.png  the background with sample shrubs, workers and the dog, at 3x
Run:  python3 game-assets/build_sprites.py
"""
import json, math, os, random
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 192, 240


def hx(h, a=255):
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), int(h[6:8], 16) if len(h) == 8 else a)


OUT = "#3E2A1C"
GRASS = ["#C4CC74", "#A8B858", "#8FA445", "#789038", "#5E7A2C", "#46601F"]
DIRT = ["#E2BE86", "#D0A46C", "#B88A54", "#946C40", "#74522E"]
SOIL = ["#8E5C38", "#76492C", "#5E3822", "#482A18", "#36200F"]
WOOD = ["#E0B070", "#C08C50", "#9C6C3C", "#76502A", "#4A2E18"]
THATCH = ["#E2CC94", "#CCB07A", "#B29462", "#94784C", "#76603A", "#544428"]
STONE = ["#DCD8CC", "#BCB8AC", "#98948A", "#726E66"]
SAKURA = ["#FFF0F4", "#FAD2DF", "#F2B0C6", "#E68EAC", "#C86C8E", "#9C4C6E"]
MAPLE = ["#F88A6C", "#E45C4C", "#C23C3C", "#962A32", "#6A1C26"]
LEAF = ["#C6D26A", "#A2B84C", "#7E9A3A", "#607E2E", "#466022", "#2E4218"]
OCHRE = ["#E6C46E", "#CCA052", "#AC8040", "#866030", "#5E4222"]
COFFEE = ["#8CB860", "#5E9A44", "#3E7C34", "#2A5E28", "#1C4020"]
WATER = ["#B4E4E8", "#86CCD8", "#5CB0C4", "#3E8EA8"]

# ---------------- painting helpers ----------------
img = Image.new("RGBA", (W, H), hx(GRASS[2]))
px = img.load()


def put(x, y, c, a=None):
    x, y = int(x), int(y)
    if not (0 <= x < W and 0 <= y < H):
        return
    col = hx(c) if isinstance(c, str) else c
    if a is None and col[3] == 255:
        px[x, y] = col
        return
    al = (a if a is not None else col[3]) / 255
    b = px[x, y]
    px[x, y] = (int(b[0] * (1 - al) + col[0] * al), int(b[1] * (1 - al) + col[1] * al), int(b[2] * (1 - al) + col[2] * al), 255)


def noise(seed):
    rnd = random.Random(seed)
    pts = [(rnd.uniform(0, W), rnd.uniform(0, H), rnd.uniform(10, 26)) for _ in range(40)]
    def f(x, y):
        return sum(math.exp(-((x - a) ** 2 + (y - b) ** 2) / (2 * r * r)) for a, b, r in pts)
    return f


def shadow_ellipse(cx, cy, rx, ry, a=70):
    for y in range(int(cy - ry), int(cy + ry) + 1):
        for x in range(int(cx - rx), int(cx + rx) + 1):
            if ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1:
                put(x, y, "#2A2A08", a)


def cluster(cx, cy, rx, ry, ramp, seed, blobs=18, br=(4, 7), outline=None, target=None, speck=True):
    """Fluffy canopy: shaded leaf clusters with dark rims under each one and light rims on top."""
    rnd = random.Random(seed)
    layer, owner, low = {}, {}, {}
    pts = []
    for _ in range(blobs):
        a = rnd.uniform(0, math.tau); d = math.sqrt(rnd.random())
        pts.append((cx + math.cos(a) * d * (rx - br[1] * 0.55), cy + math.sin(a) * d * (ry - br[1] * 0.55), rnd.uniform(*br)))
    pts.sort(key=lambda p: p[1])
    for i, (bx, by, r) in enumerate(pts):
        for y in range(int(by - r), int(by + r) + 1):
            for x in range(int(bx - r), int(bx + r) + 1):
                dx, dy = (x + 0.5 - bx) / r, (y + 0.5 - by) / (r * 0.9)
                dd = dx * dx + dy * dy
                if dd > 1:
                    continue
                lum = -(dx * -0.55 + dy * -0.85) * 0.8 + math.sqrt(1 - dd) * 0.35 - ((y - cy) / ry) * 0.25
                k = int((1 - (lum + 0.5) / 1.4) * (len(ramp) - 2))
                layer[(x, y)] = ramp[max(0, min(len(ramp) - 3, k))]
                owner[(x, y)] = i
                low[(x, y)] = dy
    for (x, y), c in list(layer.items()):
        below, above = owner.get((x, y + 1)), owner.get((x, y - 1))
        if below is not None and below != owner[(x, y)] and below > owner[(x, y)] and low[(x, y)] > 0.45:
            layer[(x, y)] = ramp[-2]
        elif above is not None and above != owner[(x, y)] and above < owner[(x, y)] and low[(x, y)] < -0.55 and layer[(x, y)] in ramp[:3]:
            layer[(x, y)] = ramp[0]
    edge = outline or ramp[-1]
    for (x, y), c in layer.items():
        if any((x + ddx, y + ddy) not in layer for ddx, ddy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
            c = edge
        (target or put)(x, y, c)
    if speck:
        keys = list(layer)
        for _ in range(len(keys) // 24):
            x, y = rnd.choice(keys)
            if (x, y - 1) in layer and (x, y + 1) in layer and layer[(x, y)] in ramp[:2]:
                (target or put)(x, y, ramp[0])
    return layer


# ---------------- ground: grass with organic dirt patches ----------------
n1, n2 = noise(1), noise(2)
rnd = random.Random(3)
for y in range(H):
    for x in range(W):
        v = n1(x, y) + rnd.uniform(-0.05, 0.05)
        c = GRASS[2] if v < 0.55 else GRASS[1] if v < 0.95 else GRASS[3] if v > 1.6 else GRASS[2]
        if rnd.random() < 0.06:
            c = rnd.choice(GRASS[1:4])
        px[x, y] = hx(c)
vals = sorted(n2(x, y) for y in range(0, H, 4) for x in range(0, W, 4))
DIRT_T = vals[int(len(vals) * 0.84)]
dirt = set()
for y in range(H):
    for x in range(W):
        if n2(x, y) + 0.08 * math.sin(x * 0.7 + y * 0.3) > DIRT_T:
            dirt.add((x, y))
# the path: from the farmhouse door down to the fields
for y in range(70, 206):
    cxp = 150 - (y - 70) * 0.36 + math.sin(y * 0.09) * 4
    for x in range(int(cxp - 8), int(cxp + 9)):
        dirt.add((x, y))
for y in range(96, 106):
    for x in range(4, 188):
        if abs(math.sin(x * 0.13)) * 3 + 6 > abs(y - 101) * 1.6:
            dirt.add((x, y))
for (x, y) in dirt:
    if 0 <= x < W and 0 <= y < H:
        edge = any((x + a, y + b) not in dirt for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)))
        put(x, y, DIRT[3] if edge and (x + y) % 2 else DIRT[2] if edge else rnd.choice([DIRT[1]] * 14 + [DIRT[0], DIRT[2]]))
for _ in range(120):   # grass tufts
    x, y = rnd.randrange(W), rnd.randrange(H)
    if (x, y) in dirt:
        continue
    for k, (a, b) in enumerate([(0, 0), (-1, -1), (1, -1), (0, -2), (-2, -2), (2, -2)]):
        put(x + a, y + b, GRASS[4] if k == 0 else GRASS[0] if b == -2 else GRASS[3])
for _ in range(26):   # little flowers
    x, y = rnd.randrange(W), rnd.randrange(H)
    if (x, y) in dirt:
        continue
    col = rnd.choice(["#FFF4E0", "#F8D050", "#F0A0B8"])
    for a, b in ((0, -1), (-1, 0), (1, 0), (0, 1)):
        put(x + a, y + b, col)
    put(x, y, "#E08030")
for _ in range(10):   # fallen sticks
    x, y = rnd.randrange(10, W - 10), rnd.randrange(80, 200)
    for k in range(rnd.randint(4, 7)):
        put(x + k, y + (k // 3) * (1 if x % 2 else -1), WOOD[3]); put(x + k, y + 1 + (k // 3) * (1 if x % 2 else -1), WOOD[4])
for _ in range(12):   # pebbles
    x, y = rnd.randrange(W), rnd.randrange(70, 200)
    put(x, y, STONE[1]); put(x + 1, y, STONE[2]); put(x, y - 1, STONE[0])

# ---------------- raised coffee beds ----------------
BEDS = [(10, 112), (104, 112), (10, 160), (104, 160)]   # each 78 x 40; the last one is still overgrown


def bed(x0, y0, locked):
    w, h = 78, 40
    shadow_ellipse(x0 + w / 2 + 3, y0 + h + 1, w / 2, 3, 60)
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            border = x < x0 + 3 or x >= x0 + w - 3 or y < y0 + 3 or y >= y0 + h - 3
            if border:
                c = WOOD[4] if x in (x0, x0 + w - 1) or y in (y0, y0 + h - 1) else WOOD[1] if y < y0 + 2 or x < x0 + 2 else WOOD[2]
                if (x - x0) % 13 == 0 and not (y < y0 + 3 or y >= y0 + h - 3):
                    c = WOOD[3]
                put(x, y, c)
            elif locked:
                put(x, y, rnd.choice(GRASS[1:5]))
            else:
                row = (y - y0 - 3) % 9
                put(x, y, SOIL[0] if row == 0 else SOIL[1] if row < 3 else SOIL[2] if row < 7 else SOIL[3])
    if locked:
        for _ in range(16):
            sx, sy = rnd.randrange(x0 + 6, x0 + w - 8), rnd.randrange(y0 + 6, y0 + h - 8)
            for (a, b) in [(0, 0), (-1, -1), (1, -1), (0, -2), (-2, -3), (2, -3)]:
                put(sx + a, sy + b, rnd.choice([GRASS[0], GRASS[4], LEAF[2]]))
        for (sx, sy) in [(x0 + 14, y0 + 26), (x0 + 58, y0 + 12)]:
            for a in range(-3, 4):
                for b in range(-2, 2):
                    if a * a / 9 + b * b / 4 <= 1:
                        put(sx + a, sy + b, STONE[2] if b > 0 else STONE[1])


for i, (bx, by) in enumerate(BEDS):
    bed(bx, by, i == 3)

# ---------------- drying beds (coffee cherries drying on raised mesh) ----------------
def drying(x0, y0):
    w, h = 40, 16
    shadow_ellipse(x0 + w / 2 + 3, y0 + h + 3, w / 2, 3, 70)
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            if x in (x0, x0 + w - 1) or y in (y0, y0 + h - 1):
                put(x, y, WOOD[4])
            elif y == y0 + 1 or x == x0 + 1:
                put(x, y, WOOD[0])
            elif y == y0 + h - 2 or x == x0 + w - 2:
                put(x, y, WOOD[3])
            else:
                put(x, y, rnd.choice(["#C64034", "#A82E2C", "#8A2426", "#D86048", "#6E2A20"]))
    for lx in (x0 + 2, x0 + w - 4):
        for y in range(y0 + h, y0 + h + 4):
            put(lx, y, WOOD[4]); put(lx + 1, y, WOOD[3])


drying(56, 52); drying(56, 74)

# ---------------- koi pond ----------------
pcx, pcy = 24, 86
for y in range(pcy - 12, pcy + 13):
    for x in range(pcx - 20, pcx + 21):
        d = ((x - pcx) / 19) ** 2 + ((y - pcy) / 11) ** 2
        if d <= 1:
            put(x, y, WATER[3] if d > 0.7 and y < pcy else WATER[2] if d > 0.45 else WATER[1] if d > 0.12 else WATER[0])
for k in range(26):
    a = k / 26 * math.tau
    sx, sy = pcx + math.cos(a) * 20, pcy + math.sin(a) * 12
    for b in range(-2, 2):
        for c in range(-2, 3):
            if b * b / 4 + c * c / 6 <= 1:
                put(sx + c, sy + b, STONE[0] if b < 0 else STONE[2] if b > 0 else STONE[1])
for (x, y, n) in [(16, 82, 5), (26, 90, 4)]:
    for k in range(n):
        put(x + k, y, "#FFFFFF")

# ---------------- farmhouse: big thatched roof seen from above ----------------
def house(x0, y0):
    w = 80
    shadow_ellipse(x0 + w / 2 + 6, y0 + 74, w / 2 + 4, 6, 80)
    # facade
    fy = y0 + 50
    for y in range(fy, fy + 20):
        for x in range(x0 + 8, x0 + w - 8):
            if y >= fy + 16:
                put(x, y, STONE[1] if (x + y) % 5 else STONE[2])
            elif (x - x0 - 8) % 12 in (0, 1):
                put(x, y, WOOD[3] if (x - x0) % 12 == 8 else WOOD[4])
            elif y == fy + 15:
                put(x, y, WOOD[2])
            else:
                put(x, y, "#F4ECDA" if y < fy + 7 else "#E6DAC2")
                if y == fy + 7 or (x - x0) % 12 == 2 + 6:
                    put(x, y, "#BCA888")
    dx0 = x0 + w // 2 - 7
    for y in range(fy, fy + 16):
        for x in range(dx0, dx0 + 14):
            put(x, y, "#3A4C9C" if y < fy + 8 and x < dx0 + 7 else "#2C3A80" if y < fy + 8 else WOOD[3] if x < dx0 + 7 else WOOD[4])
    for (a, b) in [(6, 2), (7, 2), (5, 3), (8, 3), (6, 4), (7, 4), (6, 5), (7, 6)]:
        put(dx0 + a, fy + b, "#F8F4EC")
    for x in range(dx0 - 2, dx0 + 16):
        put(x, fy + 20, STONE[0]); put(x, fy + 21, STONE[2])
    # roof
    rnd2 = random.Random(21)
    for y in range(y0, y0 + 54):
        t = (y - y0) / 54
        inset = int(10 * (1 - t) ** 1.6) if y < y0 + 22 else 0
        for x in range(x0 + inset, x0 + w - inset):
            edge = x in (x0 + inset, x0 + w - inset - 1) or y == y0 or y == y0 + 53
            if edge:
                put(x, y, THATCH[5]); continue
            if y < y0 + 22:    # back slope, catching the light
                c = THATCH[0] if (x + y * 2) % 7 else THATCH[1]
            elif y < y0 + 26:  # ridge
                c = WOOD[4] if y in (y0 + 22, y0 + 25) else WOOD[2] if y == y0 + 23 else WOOD[3]
            elif y < y0 + 47:  # front slope with straw strands
                c = THATCH[2] if (x * 3 + y) % 9 else THATCH[3]
                if rnd2.random() < 0.08:
                    c = THATCH[1]
            else:              # thick cut eave
                c = THATCH[4] if y < y0 + 50 else THATCH[3] if x % 2 else THATCH[4]
            if x > x0 + w * 0.78 and y >= y0 + 26:
                c = THATCH[min(5, THATCH.index(c) + 1)] if c in THATCH else c
            put(x, y, c)
    for k in range(4):   # ridge caps
        cx = x0 + 16 + k * 16
        for y in range(y0 + 20, y0 + 28):
            put(cx, y, WOOD[4]); put(cx + 1, y, WOOD[1])


house(108, -6)

# ---------------- trees ----------------
def tree(cx, cy, r, ramp, seed, trunk=True):
    shadow_ellipse(cx + r * 0.35, cy + r * 0.95, r * 1.0, r * 0.38, 75)
    if trunk:
        for y in range(int(cy + r * 0.3), int(cy + r * 1.05)):
            for x in range(int(cx - 2), int(cx + 3)):
                put(x, y, WOOD[4] if x in (int(cx - 2), int(cx + 2)) else WOOD[2] if x < cx else WOOD[3])
    cluster(cx, cy, r, r * 0.85, ramp, seed, blobs=int(r * 0.75) + 4, br=(r * 0.36, r * 0.55))


tree(18, 12, 20, SAKURA, 1)
tree(48, 40, 16, SAKURA, 2)
tree(176, 88, 14, LEAF, 3)
tree(92, 26, 13, MAPLE, 4)
tree(4, 132, 12, LEAF, 5)
tree(190, 140, 12, MAPLE, 6)

# ---------------- hedgerow, dirt bank with stakes, and a bench ----------------
for k, x in enumerate(range(-6, W + 12, 15)):
    ramp = [LEAF, OCHRE, LEAF, COFFEE][k % 4]
    cluster(x, 214 + (k % 2) * 2, 10, 8, ramp, 40 + k, blobs=6, br=(4.5, 6.5))
for y in range(224, H):
    for x in range(W):
        if y < 226:
            put(x, y, DIRT[4])
        elif y < 236:
            put(x, y, DIRT[2] if (x * 7 + y) % 11 else DIRT[3])
        else:
            put(x, y, DIRT[1] if (x + y) % 4 else DIRT[0])
for x in range(4, W, 11):
    for y in range(225, 238):
        put(x, y, WOOD[4]); put(x + 1, y, WOOD[1] if y < 227 else WOOD[2]); put(x + 2, y, WOOD[3]); put(x + 3, y, WOOD[4])
for y in range(198, 206):   # fence beside the path gap
    pass

bg = img.copy()
bg.save(os.path.join(HERE, "farm-bg.png"))

# ---------------- moving sprites ----------------
S = {}


def add_layer(name, w, h, layer_fn):
    canvas = {}
    layer_fn(lambda x, y, c: canvas.__setitem__((int(x), int(y)), c))
    cols = sorted(set(canvas.values()))
    keys = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    pal = {keys[i]: c for i, c in enumerate(cols)}
    inv = {c: k for k, c in pal.items()}
    rows = ["".join(inv.get(canvas.get((x, y)), ".") for x in range(w)) for y in range(h)]
    S[name] = {"w": w, "h": h, "rows": rows, "pal": pal}


def add_grid(name, rows, pal):
    assert all(len(r) == len(rows[0]) for r in rows), name
    S[name] = {"w": len(rows[0]), "h": len(rows), "rows": rows, "pal": pal}


def shrub(stage):
    def draw(p):
        rnd = random.Random(7)
        # soil mound
        for x in range(3, 15):
            p(x, 19, SOIL[3]); p(x, 18, SOIL[1] if 4 < x < 14 else SOIL[3])
        if stage == 0:
            for (x, y, c) in [(8, 17, COFFEE[3]), (8, 16, COFFEE[2]), (7, 15, COFFEE[1]), (6, 14, COFFEE[1]), (9, 15, COFFEE[1]), (10, 14, COFFEE[0]), (7, 14, COFFEE[0]), (11, 14, COFFEE[2]), (5, 14, COFFEE[2])]:
                p(x, y, c)
            return
        size = 0.62 if stage == 1 else 1.0
        cluster(9, 17 - 8 * size, 7 * size, 8 * size, COFFEE, 11 + stage, blobs=int(12 * size) + 4, br=(2.2, 3.4), target=p)
        if stage >= 2:
            spots = [(6, 6), (11, 5), (8, 9), (5, 11), (12, 10), (9, 13), (7, 3), (13, 7)]
            for (x, y) in spots:
                if stage == 2:
                    p(x, y, "#FFFFFF"); p(x + 1, y, "#F8F0D8"); p(x, y + 1, "#F8F0D8")
                elif stage == 3:
                    p(x, y, "#D8E890"); p(x + 1, y, "#A8C850"); p(x, y + 1, "#A8C850"); p(x + 1, y + 1, "#6E8A30")
                else:
                    p(x, y, "#FFB4A0"); p(x + 1, y, "#E83A30"); p(x, y + 1, "#E83A30"); p(x + 1, y + 1, "#9A1C20")
    return draw


for i, n in enumerate(["sprout", "bush_young", "bush_flower", "bush_green", "bush_ripe"]):
    add_layer(n, 18, 20, shrub(i))

WORK = {"O": OUT, "h": "#F4DE9C", "H": "#D8B868", "k": "#A88440", "r": "#4A3428", "s": "#F8D2B0", "S": "#E2A882",
        "e": "#2E1E18", "c": "#7890E0", "C": "#4860C0", "D": "#304090", "p": "#5A6A86", "P": "#3E4A64", "b": "#6A4A30"}
HAT = ["................", ".....OOOOOO.....", "....OhhhhhhO....", "...OhhhhhhHHO...", "...OhhhhHHHkO...", ".OOOkkkkkkkkOOO.", "OhhhhhhhhhHHHHkO", ".OOOOOOOOOOOOOO."]
FACE_DOWN = ["...OrSssssSrO...", "...OSseSSesSO...", "...OSssssssSO...", "....OSSssSSO...."]
FACE_UP = ["...OrrrrrrrrO...", "...OrrrrrrrrO...", "...OSrrrrrrSO...", "....OSSssSSO...."]
BODY = ["...OOccccccOO...", "..OsOcCccCcOsO..", "..OsOCcccCCOsO..", "..OSOCCCCCCOSO..", "...OODDDDDDOO...", "....OppppppO....", "....OpPppPpO...."]
LEGS = [["....OpPOOPpO....", "....OPPOOPPO....", "....ObbOObbO....", ".....OO..OO.....", "................"],
        ["....OpPOOPpO....", "....OPPOOObO....", "....ObbO.OO.....", ".....OO.........", "................"],
        ["....OpPOOPpO....", "....ObOOOPPO....", ".....OO.ObbO....", ".........OO.....", "................"]]
for f in range(3):
    add_grid("worker_down_%d" % f, HAT + FACE_DOWN + BODY + LEGS[f], WORK)
    add_grid("worker_up_%d" % f, HAT + FACE_UP + BODY + LEGS[f], WORK)
SIDE_HAT = ["................", "......OOOOOO....", ".....OhhhhhhO...", "....OhhhhhhHHO..", "....OhhhhHHHkO..", "..OOOkkkkkkkkOO.", ".OhhhhhhhhhHHHkO", "..OOOOOOOOOOOOO."]
SIDE_FACE = ["....OrrSssssSO..", "....OrSsssseSO..", "....OrSssssssO..", ".....OSSsssSO..."]
SIDE_BODY = [".....OOcccOO....", "....OcCccOsO....", "....OCcccOsO....", "....OCCCCOSO....", ".....ODDDDO.....", ".....OppppO.....", ".....OpPpPO....."]
SIDE_LEGS = [[".....OpPOPO.....", ".....OPPOPO.....", ".....ObbObO.....", "......OO.O......", "................"],
             ["....OpPO.OPO....", "...OPPO...OPO...", "...ObbO...ObO...", "....OO.....O....", "................"]]
for f in range(2):
    add_grid("worker_side_%d" % f, SIDE_HAT + SIDE_FACE + SIDE_BODY + SIDE_LEGS[f], WORK)

SHIBA = {"O": OUT, "o": "#E89048", "q": "#C86C30", "w": "#FFF4E4", "n": "#2E1E18", "t": "#F8B070"}
add_grid("shiba_0", [
    "................",
    "..O.O...........",
    ".OoOoO..........",
    ".OooooO......O..",
    "OwnoowO.....OtO.",
    ".OwwwoOOOOOOoO..",
    "..OOOoooooooqO..",
    "....OwwwwooqqO..",
    "....OwwOOOOwqO..",
    "....OqO....OqO..",
    "....OO.....OO...",
    "................"], SHIBA)
add_grid("shiba_1", [
    "................",
    "..O.O...........",
    ".OoOoO..........",
    ".OooooO.....O...",
    "OwnoowO....OtO..",
    ".OwwwoOOOOOOoO..",
    "..OOOoooooooqO..",
    "....OwwwwooqqO..",
    "....OwwOOOOwqO..",
    "...OqO......OqO.",
    "...OO.......OO..",
    "................"], SHIBA)

add_grid("sparkle", ["...a....", "...a....", "..aba...", "aabwbaa.", "..aba...", "...a....", "...a....", "........"],
         {"a": "#F8D040", "b": "#FFF0A0", "w": "#FFFFFF"})
add_grid("basket", [
    "..oooooooooooo..",
    ".oaaaaaaaaaaaao.",
    ".obbbbbbbbbbbbo.",
    ".oooooooooooooo.",
    ".obcbcbcbcbcbco.",
    ".ocbcbcbcbcbcdo.",
    ".obcbcbcbcbcbdo.",
    "..ocdcdcdcdcdo..",
    "..oooooooooooo.."], {"a": "#F4D490", "b": "#DCB468", "c": "#BC8C48", "d": "#906830", "o": OUT})
add_grid("cherrypile", [
    "....oo.ooo.o....",
    "..oohroohrrhoo..",
    ".orhrqrhrqrhrqo.",
    ".orrqrrrqrrrqro."], {"h": "#FFB4A0", "r": "#E83A30", "q": "#A01C20", "o": "#5A1410"})
add_grid("sack", ["...oo...", "..oddo..", ".oabbco.", "oabhrbco", "obbrrbco", "obbbbcco", ".occcco.", "..oooo.."],
         {"a": "#F4D490", "b": "#DCB468", "c": "#BC8C48", "d": "#906830", "o": OUT, "h": "#FFB4A0", "r": "#E83A30"})
add_grid("bubble_full", [
    ".oooooooooooooo.",
    "owwwwwwwwwwwwwwo",
    "owrrrwrwrwrwwrwo",
    "owrwwwrwrwrwwrwo",
    "owrrwwrwrwrwwrwo",
    "owrwwwrwrwrwwrwo",
    "owrwwwwrwwrrwrro",
    "owwwwwwwwwwwwwwo",
    ".oooooooowoooooo",
    ".......owo......",
    "........o.......",
    "................"], {"o": OUT, "w": "#FFF8EC", "r": "#D8402C"})
add_grid("sign", [
    ".oooooooooooooo.",
    "oaaaaaaaaaaaaabo",
    "oabbbbbbbbbbbbco",
    "oabbbbbbbbbbbbco",
    "obcccccccccccccо".replace("о", "o"),
    ".oooooooooooooo.",
    "......obco......",
    "......obco......",
    "......obdo......"], {"a": WOOD[0], "b": WOOD[1], "c": WOOD[2], "d": WOOD[3], "o": OUT})

SHIRTS = [["#7890E0", "#4860C0", "#304090"], ["#F07888", "#D04058", "#902838"], ["#90C070", "#5A9848", "#386830"],
          ["#F8C860", "#D89830", "#A06818"], ["#B898E8", "#8060C0", "#584090"], ["#70D0D8", "#30A0B0", "#207078"],
          ["#E0A878", "#B07040", "#7A4A24"], ["#F8A0C0", "#E06890", "#A84068"]]


def render(s, shirt=None):
    pal = dict(s["pal"])
    if shirt:
        pal.update(c=shirt[0], C=shirt[1], D=shirt[2])
    im = Image.new("RGBA", (s["w"], s["h"]), (0, 0, 0, 0))
    for y, r in enumerate(s["rows"]):
        for x, ch in enumerate(r):
            if ch != ".":
                im.putpixel((x, y), hx(pal[ch]))
    return im


x = y = rowh = 0
place = {}
for n, s in S.items():
    if x + s["w"] > 160:
        x, y, rowh = 0, y + rowh + 3, 0
    place[n] = (x, y); x += s["w"] + 3; rowh = max(rowh, s["h"])
sheet = Image.new("RGBA", (160, y + rowh), (0, 0, 0, 0))
for n, (sx, sy) in place.items():
    sheet.alpha_composite(render(S[n]), (sx, sy))
sheet.save(os.path.join(HERE, "sheet.png"))
sheet.resize((sheet.width * 4, sheet.height * 4), Image.NEAREST).save(os.path.join(HERE, "sheet@4x.png"))

# shrub positions inside the open beds: 4 across, 2 down
SHRUBS = [(bx + 6 + c * 18, by + 2 + r * 17) for (bx, by) in BEDS[:3] for r in range(2) for c in range(4)]
with open(os.path.join(HERE, "sprites.json"), "w") as f:
    json.dump({"sprites": S, "shirts": SHIRTS, "shrubs": SHRUBS, "beds": BEDS}, f, separators=(",", ":"))

# preview
prev = bg.copy()
rnd = random.Random(4)
for (sx, sy) in SHRUBS:
    p = rnd.random() * 1.2
    n = "sprout" if p < .3 else "bush_young" if p < .55 else "bush_flower" if p < .8 else "bush_green" if p < 1 else "bush_ripe"
    prev.alpha_composite(render(S[n]), (sx, sy))
prev.alpha_composite(render(S["cherrypile"]), (120, 78)); prev.alpha_composite(render(S["basket"]), (120, 80))
prev.alpha_composite(render(S["worker_down_0"], SHIRTS[0]), (140, 66))
prev.alpha_composite(render(S["worker_up_1"], SHIRTS[1]), (40, 130))
prev.alpha_composite(render(S["worker_side_1"], SHIRTS[2]), (120, 150))
prev.alpha_composite(render(S["shiba_0"]), (70, 100))
prev.resize((W * 3, H * 3), Image.NEAREST).save(os.path.join(HERE, "farm-preview.png"))
print(len(S), "sprites;", len(SHRUBS), "shrubs")
