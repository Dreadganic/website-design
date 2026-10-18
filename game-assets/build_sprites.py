"""Beju Farm art: cozy modern pixel art, drawn in code.

Writes, into game-assets/:
  bg/<location>-<season>.png   a painted farm scene (192 x 240) for each location and season
  sprites.json                 moving pieces as palette grids: coffee shrubs for every variety and
                               stage, workers, the shiba and props; plus shrub positions and the
                               location / season / variety tables the game reads
  sheet.png / sheet@4x.png     every moving sprite on one sheet
  scenes.png                   every farm scene side by side
  varieties.png                every variety at every growth stage, at 4x
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
SOIL = ["#8E5C38", "#76492C", "#5E3822", "#482A18", "#36200F"]
WOOD = ["#E0B070", "#C08C50", "#9C6C3C", "#76502A", "#4A2E18"]
THATCH = ["#E2CC94", "#CCB07A", "#B29462", "#94784C", "#76603A", "#544428"]
STONE = ["#DCD8CC", "#BCB8AC", "#98948A", "#726E66"]
CONCRETE = ["#DAD6CC", "#C6C2B8", "#B0ACA2", "#96928A"]
WATER = ["#B4E4E8", "#86CCD8", "#5CB0C4", "#3E8EA8"]
TILE = ["#F2A878", "#DA7C54", "#C0603E", "#9E4630", "#76321F"]

SAKURA = ["#FFF0F4", "#FAD2DF", "#F2B0C6", "#E68EAC", "#C86C8E", "#9C4C6E"]
MAPLE = ["#F88A6C", "#E45C4C", "#C23C3C", "#962A32", "#6A1C26"]
AUTUMN = ["#F8C860", "#EE9A3C", "#D2702C", "#A84E22", "#7A3418"]
LEAF = ["#C6D26A", "#A2B84C", "#7E9A3A", "#607E2E", "#466022", "#2E4218"]
LUSH = ["#A8D068", "#7EB84C", "#5A9C3C", "#427E30", "#2E6024", "#1E4418"]
OCHRE = ["#E6C46E", "#CCA052", "#AC8040", "#866030", "#5E4222"]
IPE = ["#FFF2A0", "#F8DC48", "#E8B820", "#C48E18", "#8E6414"]
PORO = ["#FFC890", "#F89C48", "#E07428", "#B4521C", "#7E3614"]
SNOWY = ["#FFFFFF", "#EEF4FA", "#DCE6F0", "#C4D2E2", "#A8B8CC"]
COFFEE = ["#7CB056", "#5A9842", "#3E8036", "#2C662C", "#1E4C22", "#143418"]

GRASS = {
    "green":  ["#C4CC74", "#A8B858", "#8FA445", "#789038", "#5E7A2C", "#46601F"],
    "lush":   ["#A6D070", "#88BC54", "#6CA442", "#568C36", "#40702A", "#2C5420"],
    "dry":    ["#DCD288", "#C8BE6C", "#B0A856", "#969046", "#7A7638", "#5C5A2A"],
    "autumn": ["#DCC478", "#C8AC5C", "#AE9248", "#92783A", "#74602E", "#564622"],
    "snow":   ["#FFFFFF", "#F2F6FA", "#E2EAF2", "#CCD8E6", "#B0C0D4", "#90A2BA"],
}
DIRT = {
    "ochre":    ["#E2BE86", "#D0A46C", "#B88A54", "#946C40", "#74522E"],
    "red":      ["#DE8E62", "#C87048", "#AC5636", "#8A4228", "#6A301C"],
    "rust":     ["#D69A6A", "#BE7E50", "#A2643E", "#824C2E", "#623622"],
    "volcanic": ["#A89A86", "#8E806C", "#766856", "#5E5244", "#463C32"],
    "wet":      ["#B89A6E", "#9E8058", "#846846", "#6A5236", "#503C28"],
}

# ---------------- painting on the current scene ----------------
img = None
px = None


def new_scene(ground):
    global img, px
    img = Image.new("RGBA", (W, H), hx(ground))
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


def fill(x0, y0, w, h, c):
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            put(x, y, c)


def noise(seed):
    rnd = random.Random(seed)
    pts = [(rnd.uniform(0, W), rnd.uniform(0, H), rnd.uniform(10, 26)) for _ in range(40)]
    return lambda x, y: sum(math.exp(-((x - a) ** 2 + (y - b) ** 2) / (2 * r * r)) for a, b, r in pts)


def shadow_ellipse(cx, cy, rx, ry, a=70):
    for y in range(int(cy - ry), int(cy + ry) + 1):
        for x in range(int(cx - rx), int(cx + rx) + 1):
            if ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1:
                put(x, y, "#2A2A08", a)


def ellipse(cx, cy, rx, ry, c):
    for y in range(int(cy - ry), int(cy + ry) + 1):
        for x in range(int(cx - rx), int(cx + rx) + 1):
            if ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1:
                put(x, y, c)


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
                owner[(x, y)] = i; low[(x, y)] = dy
    for (x, y), c in list(layer.items()):
        below, above = owner.get((x, y + 1)), owner.get((x, y - 1))
        if below is not None and below != owner[(x, y)] and below > owner[(x, y)] and low[(x, y)] > 0.45:
            layer[(x, y)] = ramp[-2]
        elif above is not None and above != owner[(x, y)] and above < owner[(x, y)] and low[(x, y)] < -0.55 and layer[(x, y)] in ramp[:3]:
            layer[(x, y)] = ramp[0]
    edge = outline or ramp[-1]
    for (x, y), c in layer.items():
        if any((x + a, y + b) not in layer for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1))):
            c = edge
        (target or put)(x, y, c)
    if speck:
        keys = list(layer)
        for _ in range(len(keys) // 24):
            x, y = rnd.choice(keys)
            if (x, y - 1) in layer and (x, y + 1) in layer and layer[(x, y)] in ramp[:2]:
                (target or put)(x, y, ramp[0])
    return layer


# ---------------- scenery pieces ----------------
def tree(cx, cy, r, ramp, seed):
    shadow_ellipse(cx + r * 0.35, cy + r * 0.95, r, r * 0.38, 75)
    for y in range(int(cy + r * 0.3), int(cy + r * 1.05)):
        for x in range(int(cx - 2), int(cx + 3)):
            put(x, y, WOOD[4] if x in (int(cx - 2), int(cx + 2)) else WOOD[2] if x < cx else WOOD[3])
    cluster(cx, cy, r, r * 0.85, ramp, seed, blobs=int(r * 0.75) + 4, br=(r * 0.36, r * 0.55))


def snowcap(layer):
    """Snow settles on the upper edge of a canopy or roof."""
    for (x, y) in layer:
        if (x, y - 1) not in layer or (x, y - 2) not in layer:
            put(x, y, SNOWY[0] if (x, y - 1) not in layer else SNOWY[2])


def bare_tree(cx, cy, r, seed, snow=True):
    rnd = random.Random(seed)
    shadow_ellipse(cx + r * 0.3, cy + r * 0.95, r * 0.8, r * 0.3, 55)
    for y in range(int(cy - r * 0.1), int(cy + r * 1.05)):
        put(cx - 1, y, WOOD[4]); put(cx, y, WOOD[2]); put(cx + 1, y, WOOD[3])
    for k in range(9):
        a = -math.pi / 2 + rnd.uniform(-1.3, 1.3); L = rnd.uniform(r * 0.5, r)
        sx, sy = cx, cy + rnd.uniform(-r * 0.1, r * 0.4)
        for t in range(int(L)):
            x, y = sx + math.cos(a) * t, sy + math.sin(a) * t
            put(x, y, WOOD[3]); put(x + 1, y, WOOD[4])
            if snow and t % 2 == 0:
                put(x, y - 1, SNOWY[0])
            if t > L * 0.5 and t % 3 == 0:
                b = a + rnd.choice((-0.7, 0.7))
                for u in range(4):
                    put(x + math.cos(b) * u, y + math.sin(b) * u, WOOD[3])


def palm(cx, cy, r, seed, ramp=LEAF):
    rnd = random.Random(seed)
    shadow_ellipse(cx + r * 0.6, cy + r * 1.2, r * 0.9, r * 0.32, 60)
    for k, y in enumerate(range(int(cy), int(cy + r * 1.25))):
        sway = int(math.sin(k * 0.12) * 2)
        put(cx + sway - 1, y, WOOD[4]); put(cx + sway, y, WOOD[1] if k % 3 else WOOD[3]); put(cx + sway + 1, y, WOOD[3]); put(cx + sway + 2, y, WOOD[4])
    for k in range(8):
        a = k / 8 * math.tau + rnd.uniform(-0.2, 0.2)
        L = r * rnd.uniform(0.85, 1.05)
        for t in range(int(L)):
            droop = (t / L) ** 2 * r * 0.35
            x, y = cx + math.cos(a) * t, cy + math.sin(a) * t * 0.7 + droop
            put(x, y, ramp[3]); put(x, y - 1, ramp[1] if t < L * 0.7 else ramp[2])
            if t % 2 == 0 and t > 2:
                for s in (-1, 1):
                    put(x + math.cos(a + s * 1.4) * 2, y + math.sin(a + s * 1.4) * 2 + 1, ramp[2] if s < 0 else ramp[4])
    ellipse(cx + 0.5, cy, 2, 1.5, ramp[4])


def paddle_plant(cx, cy, r, seed, ramp=LUSH, midrib=None):
    """Banana / enset: big paddle leaves fanning out of a short stem."""
    rnd = random.Random(seed)
    shadow_ellipse(cx + r * 0.4, cy + r * 0.9, r * 0.9, r * 0.3, 60)
    for y in range(int(cy), int(cy + r * 0.9)):
        put(cx - 1, y, ramp[4]); put(cx, y, ramp[2]); put(cx + 1, y, ramp[3])
    for k in range(6):
        a = -math.pi / 2 + (k - 2.5) * 0.55 + rnd.uniform(-0.12, 0.12)
        L = r * rnd.uniform(0.8, 1.05)
        for t in range(int(L)):
            wdt = math.sin(t / L * math.pi) * r * 0.22 + 0.5
            x0, y0 = cx + math.cos(a) * t, cy + math.sin(a) * t * 0.85
            for s in range(-int(wdt), int(wdt) + 1):
                nx, ny = -math.sin(a), math.cos(a)
                edge = abs(s) >= int(wdt)
                tear = (t * 3 + s * 7 + k) % 11 == 0
                if tear and edge:
                    continue
                put(x0 + nx * s, y0 + ny * s * 0.85, ramp[5] if edge else ramp[1] if s < 0 else ramp[3])
            put(x0, y0, midrib or ramp[0])


def acacia(cx, cy, r, seed, ramp):
    shadow_ellipse(cx + r * 0.3, cy + r * 0.7, r * 1.05, r * 0.3, 70)
    for y in range(int(cy), int(cy + r * 0.75)):
        put(cx, y, WOOD[3]); put(cx + 1, y, WOOD[4])
    for s in (-1, 1):
        for t in range(int(r * 0.5)):
            put(cx + s * t * 0.8, cy + r * 0.2 - t * 0.4, WOOD[3])
    cluster(cx, cy - r * 0.15, r * 1.1, r * 0.42, ramp, seed, blobs=10, br=(r * 0.22, r * 0.34))


def pine(cx, cy, r, seed, snow=False):
    shadow_ellipse(cx + r * 0.3, cy + r * 1.05, r * 0.7, r * 0.28, 70)
    for y in range(int(cy + r * 0.6), int(cy + r * 1.05)):
        put(cx, y, WOOD[3]); put(cx + 1, y, WOOD[4])
    for tier in range(3):
        ty = cy - r * 0.6 + tier * r * 0.45
        tw = r * (0.45 + tier * 0.25)
        lay = {}
        for y in range(int(ty), int(ty + r * 0.55)):
            half = (y - ty) / (r * 0.55) * tw
            for x in range(int(cx - half), int(cx + half) + 1):
                lay[(x, y)] = LEAF[4] if x > cx + half * 0.3 else LEAF[3] if x > cx - half * 0.3 else LEAF[2]
        for (x, y), c in lay.items():
            put(x, y, LEAF[5] if (x + 1, y) not in lay or (x - 1, y) not in lay or (x, y + 1) not in lay else c)
        if snow:
            snowcap(lay)


def stone_lantern(x, y):
    shadow_ellipse(x + 3, y + 12, 5, 1.6, 70)
    fill(x - 3, y, 7, 2, STONE[1]); fill(x - 2, y + 2, 5, 4, STONE[2]); fill(x - 1, y + 3, 3, 2, "#F8D870")
    fill(x - 4, y - 2, 9, 2, STONE[0]); fill(x - 1, y + 6, 3, 5, STONE[2]); fill(x - 3, y + 10, 7, 2, STONE[3])


def drying_bed(x0, y0, w=40, h=16, state="full"):
    rnd = random.Random(x0 * 7 + y0)
    shadow_ellipse(x0 + w / 2 + 3, y0 + h + 3, w / 2, 3, 70)
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            if x in (x0, x0 + w - 1) or y in (y0, y0 + h - 1):
                put(x, y, WOOD[4])
            elif y == y0 + 1 or x == x0 + 1:
                put(x, y, WOOD[0])
            elif y == y0 + h - 2 or x == x0 + w - 2:
                put(x, y, WOOD[3])
            elif state == "full":
                put(x, y, rnd.choice(["#C64034", "#A82E2C", "#8A2426", "#D86048", "#6E2A20"]))
            elif state == "tarp":
                put(x, y, "#5C8CB4" if (x + y) % 9 else "#4A7AA2")
            elif state == "snow":
                put(x, y, SNOWY[1] if (x * 3 + y) % 7 else SNOWY[3])
            else:
                put(x, y, "#9C8064" if (x + y) % 2 else "#866A50")
    for lx in (x0 + 2, x0 + w - 4):
        for y in range(y0 + h, y0 + h + 4):
            put(lx, y, WOOD[4]); put(lx + 1, y, WOOD[3])


def pond(cx, cy, rx, ry, frozen=False):
    wat = ["#E8F4FA", "#D4E8F4", "#BCD8EC", "#A4C4E0"] if frozen else WATER
    for y in range(int(cy - ry), int(cy + ry) + 1):
        for x in range(int(cx - rx), int(cx + rx) + 1):
            d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
            if d <= 1:
                put(x, y, wat[3] if d > 0.7 and y < cy else wat[2] if d > 0.45 else wat[1] if d > 0.12 else wat[0])
    for k in range(int(rx + ry)):
        a = k / (rx + ry) * math.tau
        sx, sy = cx + math.cos(a) * rx, cy + math.sin(a) * ry
        for b in range(-2, 2):
            for c in range(-2, 3):
                if b * b / 4 + c * c / 6 <= 1:
                    put(sx + c, sy + b, (SNOWY[0] if frozen and b < 0 else STONE[0]) if b < 0 else STONE[2] if b > 0 else STONE[1])
    if not frozen:
        for (x, y, n) in [(cx - 8, cy - 4, 5), (cx + 2, cy + 4, 4)]:
            for k in range(n):
                put(x + k, y, "#FFFFFF")


# ---------------- buildings (all with the door near x=148, front edge near y=66) ----------------
def house_japan(x0, y0, snow):
    w = 80
    shadow_ellipse(x0 + w / 2 + 6, y0 + 74, w / 2 + 4, 6, 80)
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
                put(x, y, "#BCA888" if y == fy + 7 or (x - x0) % 12 == 8 else ("#F4ECDA" if y < fy + 7 else "#E6DAC2"))
    dx0 = x0 + w // 2 - 7
    for y in range(fy, fy + 16):
        for x in range(dx0, dx0 + 14):
            put(x, y, "#3A4C9C" if y < fy + 8 and x < dx0 + 7 else "#2C3A80" if y < fy + 8 else WOOD[3] if x < dx0 + 7 else WOOD[4])
    for (a, b) in [(6, 2), (7, 2), (5, 3), (8, 3), (6, 4), (7, 4), (6, 5), (7, 6)]:
        put(dx0 + a, fy + b, "#F8F4EC")
    for x in range(dx0 - 2, dx0 + 16):
        put(x, fy + 20, STONE[0]); put(x, fy + 21, STONE[2])
    rnd = random.Random(21)
    lay = {}
    for y in range(y0, y0 + 54):
        t = (y - y0) / 54
        inset = int(10 * (1 - t) ** 1.6) if y < y0 + 22 else 0
        for x in range(x0 + inset, x0 + w - inset):
            lay[(x, y)] = 1
            edge = x in (x0 + inset, x0 + w - inset - 1) or y == y0 or y == y0 + 53
            if edge:
                put(x, y, THATCH[5]); continue
            if y < y0 + 22:
                c = (THATCH[0] if (x + y * 2) % 7 else THATCH[1])
                if snow:
                    c = SNOWY[0] if (x + y) % 9 else SNOWY[2]
            elif y < y0 + 26:
                c = WOOD[4] if y in (y0 + 22, y0 + 25) else WOOD[2] if y == y0 + 23 else WOOD[3]
                if snow and y == y0 + 23:
                    c = SNOWY[1]
            elif y < y0 + 47:
                c = THATCH[2] if (x * 3 + y) % 9 else THATCH[3]
                if rnd.random() < 0.08:
                    c = THATCH[1]
                if snow and (y - y0 - 26) < 8 + ((x * 7) % 5):
                    c = SNOWY[1] if (x + y) % 6 else SNOWY[3]
            else:
                c = THATCH[4] if y < y0 + 50 else THATCH[3] if x % 2 else THATCH[4]
                if snow and y == y0 + 47:
                    c = SNOWY[0]
            if x > x0 + w * 0.78 and y >= y0 + 26 and c in THATCH:
                c = THATCH[min(5, THATCH.index(c) + 1)]
            put(x, y, c)


def tile_roof(x0, y0, w, h, ridge, ramp, outline):
    """Clay tile roof seen from above: rows of scalloped tiles either side of a ridge."""
    for y in range(y0, y0 + h):
        inset = max(0, int((ridge - (y - y0)) * 0.5)) if y - y0 < ridge else 0
        for x in range(x0 + inset, x0 + w - inset):
            if x in (x0 + inset, x0 + w - inset - 1) or y in (y0, y0 + h - 1):
                put(x, y, outline); continue
            if abs(y - y0 - ridge) <= 1:
                put(x, y, ramp[3] if y - y0 == ridge else ramp[1]); continue
            row = (y - y0) % 4
            scallop = (x + ((y - y0) // 4) * 3) % 6
            back = y - y0 < ridge
            base = ramp[0] if back else ramp[2]
            c = base if row else (ramp[3] if not back else ramp[2])
            if scallop == 0 and row:
                c = ramp[3] if not back else ramp[1]
            if x > x0 + w * 0.8 and not back:
                c = ramp[min(4, ramp.index(c) + 1)] if c in ramp else c
            put(x, y, c)


def house_finca(x0, y0):
    w = 80
    shadow_ellipse(x0 + w / 2 + 6, y0 + 74, w / 2 + 4, 6, 80)
    fy = y0 + 46
    for y in range(fy, fy + 24):
        for x in range(x0 + 6, x0 + w - 6):
            if y >= fy + 20:
                put(x, y, STONE[1] if (x + y) % 5 else STONE[2])
            else:
                put(x, y, "#FAF6EE" if y < fy + 12 else "#ECE4D6")
    for wx, col in [(x0 + 12, "#3C78C8"), (x0 + 26, "#3CA070"), (x0 + 52, "#3CA070"), (x0 + 64, "#3C78C8")]:
        fill(wx, fy + 4, 8, 9, OUT); fill(wx + 1, fy + 5, 6, 7, col); fill(wx + 3, fy + 5, 2, 7, "#F4E8C8")
        fill(wx - 1, fy + 13, 10, 2, "#D04838"); put(wx + 2, fy + 12, "#58A040"); put(wx + 5, fy + 12, "#E84868")
    dx0 = x0 + w // 2 - 6
    fill(dx0, fy + 2, 12, 18, OUT); fill(dx0 + 1, fy + 3, 10, 17, "#E0A030"); fill(dx0 + 5, fy + 3, 2, 17, "#B07820")
    for x in range(dx0 - 2, dx0 + 14):
        put(x, fy + 24, STONE[0]); put(x, fy + 25, STONE[2])
    tile_roof(x0, y0, w, 48, 18, TILE, "#5A2418")


def house_fazenda(x0, y0):
    w = 84
    shadow_ellipse(x0 + w / 2 + 6, y0 + 72, w / 2 + 4, 6, 80)
    fy = y0 + 44
    for y in range(fy, fy + 24):
        for x in range(x0 + 2, x0 + w - 2):
            if y >= fy + 20:
                put(x, y, "#C8B8A0" if (x + y) % 4 else "#B0A088")
            elif y < fy + 4:
                put(x, y, "#8A5A38" if y == fy else "#C89868")
            else:
                put(x, y, "#FBF8F2" if y < fy + 12 else "#EEE8DC")
    for k in range(7):
        cx = x0 + 6 + k * 12
        fill(cx, fy + 4, 3, 16, "#FFFFFF"); put(cx + 2, fy + 4, "#D8D0C4")
        if k < 6:
            fill(cx + 5, fy + 7, 4, 8, "#2E6AB0"); fill(cx + 6, fy + 8, 2, 6, "#4E8ED0")
    tile_roof(x0, y0, w, 46, 14, ["#E89068", "#CC6C48", "#B05436", "#8E3E28", "#6A2C1C"], "#4E1E14")


def tukul(cx, cy, r):
    shadow_ellipse(cx + 6, cy + r + 6, r + 4, 5, 85)
    for y in range(int(cy + r * 0.3), int(cy + r + 6)):
        for x in range(int(cx - r * 0.85), int(cx + r * 0.85) + 1):
            if abs(x - cx) <= r * 0.85:
                put(x, y, "#B07A4A" if (x + y) % 5 else "#9A6638")
    fill(int(cx - 4), int(cy + r - 4), 9, 10, "#3A2418"); fill(int(cx - 3), int(cy + r - 3), 7, 9, "#5A3A22")
    lay = {}
    for y in range(int(cy - r), int(cy + r) + 1):
        for x in range(int(cx - r), int(cx + r) + 1):
            d = math.hypot(x - cx, (y - cy) * 1.15)
            if d <= r:
                lay[(x, y)] = d
    for (x, y), d in lay.items():
        ring = int(d) % 4
        light = (x - cx) + (y - cy) < 0
        c = THATCH[0 if light else 2] if ring else THATCH[2 if light else 4]
        if (x, y + 1) not in lay or (x + 1, y) not in lay or (x - 1, y) not in lay or (x, y - 1) not in lay:
            c = THATCH[5]
        put(x, y, c)
    ellipse(cx, cy - 1, 2, 2, WOOD[3]); put(cx, cy - 3, WOOD[4]); put(cx, cy - 4, WOOD[4])


def house_batak(x0, y0):
    w = 84
    shadow_ellipse(x0 + w / 2 + 6, y0 + 74, w / 2 + 2, 6, 85)
    fy = y0 + 44
    for x in range(x0 + 12, x0 + w - 12, 9):     # stilts
        fill(x, fy + 16, 3, 10, WOOD[3]); put(x, fy + 16, WOOD[4])
    for y in range(fy, fy + 16):                  # carved facade: red, white and black triangles
        for x in range(x0 + 10, x0 + w - 10):
            k = (x + (y // 4) * 4) % 8
            c = "#B8302A" if k < 3 else "#F2ECDC" if k < 5 else "#2A2220"
            if y in (fy, fy + 15) or x in (x0 + 10, x0 + w - 11):
                c = OUT
            put(x, y, c)
    fill(x0 + w // 2 - 6, fy + 4, 12, 12, "#3A2418")
    roof = ["#7A6E62", "#5E544A", "#4A4038", "#383028", "#26201A"]
    for y in range(y0, y0 + 46):
        t = (y - y0) / 46
        lift = int(14 * (1 - t) ** 2.2)            # both ends sweep up and out
        mid = int(8 * math.sin(t * math.pi))
        left, right = x0 - lift // 2, x0 + w + lift // 2
        for x in range(left, right):
            dip = abs((x - (x0 + w / 2)) / (w / 2 + lift / 2))
            if y < y0 + int((1 - dip ** 2) * 10) - 2:
                continue
            edge = x in (left, right - 1) or y == y0 + 45
            c = roof[4] if edge else roof[1 if y < y0 + 18 else 2] if (x + y * 3) % 7 else roof[3]
            if x > x0 + w * 0.78 and y > y0 + 18:
                c = roof[min(4, roof.index(c) + 1)]
            put(x, y, c)
    for (a, b) in [(x0 - 6, y0 + 2), (x0 + w + 4, y0 + 2)]:
        fill(a, b, 3, 3, "#F2ECDC"); put(a + 1, b + 1, "#B8302A")


def house_tico(x0, y0):
    w = 78
    shadow_ellipse(x0 + w / 2 + 6, y0 + 74, w / 2 + 4, 6, 80)
    fy = y0 + 44
    for y in range(fy, fy + 24):
        for x in range(x0 + 6, x0 + w - 6):
            if y >= fy + 20:
                put(x, y, WOOD[2] if (x + y) % 5 else WOOD[3])
            elif (x - x0) % 4 == 0:
                put(x, y, "#2E8888")
            else:
                put(x, y, "#4AB0AC" if y < fy + 12 else "#3E9C98")
    for wx in (x0 + 14, x0 + 54):
        fill(wx, fy + 4, 10, 9, "#FFFFFF"); fill(wx + 1, fy + 5, 8, 7, "#F4D488"); fill(wx + 4, fy + 5, 2, 7, "#FFFFFF")
    dx0 = x0 + w // 2 - 6
    fill(dx0, fy + 2, 12, 18, "#FFFFFF"); fill(dx0 + 1, fy + 3, 10, 17, "#D85A40")
    zinc = ["#E6EAEE", "#CED4DA", "#B4BCC4", "#98A2AC", "#6E7882"]
    for y in range(y0, y0 + 46):
        for x in range(x0, x0 + w):
            if x in (x0, x0 + w - 1) or y in (y0, y0 + 45):
                put(x, y, zinc[4]); continue
            back = y < y0 + 16
            rib = (x - x0) % 4
            c = zinc[0 if back else 1] if rib else zinc[2 if back else 3]
            if y == y0 + 16:
                c = zinc[4]
            if (x * 13 + y * 7) % 97 == 0:
                c = "#B86A3A"   # a few rust spots
            put(x, y, c)


# ---------------- location features (top-left area) ----------------
def marquesina(x0, y0, w, h, state):
    """Colombian drying tunnel: cherries on raised beds under a clear arched plastic cover."""
    drying_bed(x0, y0 + 4, w, h - 4, "full" if state == "full" else "empty")
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            if (x - x0) % 10 == 0:
                put(x, y, "#F4F8FA", 150)
            else:
                put(x, y, "#E8F4FA", 70)
    for x in range(x0, x0 + w):
        put(x, y0, "#FFFFFF", 200)


def terreiro(x0, y0, w, h, state):
    """Brazilian drying patio: coffee raked into long rows on concrete."""
    shadow_ellipse(x0 + w / 2 + 3, y0 + h + 1, w / 2, 3, 50)
    rnd = random.Random(3)
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            edge = x in (x0, x0 + w - 1) or y in (y0, y0 + h - 1)
            c = CONCRETE[3] if edge else CONCRETE[2] if (x - x0) % 16 == 0 or (y - y0) % 16 == 0 else (CONCRETE[1] if (x * 7 + y * 3) % 11 == 0 else CONCRETE[0])
            if not edge and state == "full" and (y - y0) % 10 < 7 and x0 + 3 < x < x0 + w - 4:
                c = rnd.choice(["#8A4A2C", "#6E3822", "#A8603A", "#7A3E26"]) if (y - y0) % 10 < 6 else "#5A2E1C"
            if not edge and state == "wet" and ((x - x0 - 20) ** 2 / 90 + (y - y0 - 14) ** 2 / 20 < 1 or (x - x0 - 60) ** 2 / 60 + (y - y0 - 34) ** 2 / 16 < 1):
                c = WATER[1] if (x + y) % 5 else WATER[0]
            put(x, y, c)
    if state == "full":   # a wooden rake left on the patio
        for k in range(14):
            put(x0 + 8 + k, y0 + h - 6, WOOD[2])
        fill(x0 + 21, y0 + h - 9, 2, 7, WOOD[3])


def african_beds(x0, y0, n, state):
    for k in range(n):
        drying_bed(x0, y0 + k * 22, 86, 12, "full" if state == "full" else "tarp" if state == "tarp" else "empty")


def lake(x0, y0, w, h):
    """Lake Toba's shore: deep water fading to sand, with a little wooden jetty."""
    for y in range(y0, y0 + h):
        shore = int(w * 0.75 + math.sin(y * 0.15) * 6 - (y - y0) * 0.35)
        for x in range(x0, x0 + w):
            if x < x0 + shore - 6:
                d = (x0 + shore - 6 - x)
                put(x, y, WATER[3] if d > 26 else WATER[2] if d > 12 else WATER[1] if d > 3 else WATER[0])
            elif x < x0 + shore:
                put(x, y, "#E8D8A8" if (x + y) % 4 else "#D8C490")
    rnd = random.Random(5)
    for _ in range(14):
        x, y = rnd.randrange(x0, x0 + int(w * 0.5)), rnd.randrange(y0, y0 + h)
        for k in range(rnd.randint(3, 6)):
            put(x + k, y, "#E4F6F8")
    for y in range(y0 + 40, y0 + 48):
        for x in range(x0 + int(w * 0.35), x0 + int(w * 0.72)):
            put(x, y, WOOD[1] if y < y0 + 46 else WOOD[3]) if (x % 5) else put(x, y, WOOD[3])


def wet_mill(x0, y0, state):
    """Costa Rican wet mill: concrete channels with running water and fermentation tanks."""
    shadow_ellipse(x0 + 44, y0 + 46, 42, 4, 55)
    fill(x0, y0, 88, 44, CONCRETE[3]); fill(x0 + 1, y0 + 1, 86, 42, CONCRETE[1])
    for k in range(2):      # fermentation tanks
        tx = x0 + 4 + k * 26
        fill(tx, y0 + 4, 22, 22, CONCRETE[3]); fill(tx + 2, y0 + 6, 18, 18, "#C8A060" if state == "full" else WATER[2])
        if state == "full":
            for i in range(30):
                put(tx + 3 + (i * 7) % 16, y0 + 7 + (i * 5) % 16, "#E8C890")
    for y in range(y0 + 30, y0 + 38):   # the long washing channel
        for x in range(x0 + 4, x0 + 84):
            put(x, y, WATER[1] if (x + y * 2) % 7 else "#FFFFFF")
    fill(x0 + 58, y0 + 4, 26, 22, CONCRETE[3]); fill(x0 + 60, y0 + 6, 22, 18, "#9A2A26" if state == "full" else CONCRETE[2])


# ---------------- shared ground, beds, hedgerow ----------------
BEDS = [(10, 112), (104, 112), (10, 160), (104, 160)]


def ground(grass, dirt, seed=1, dirt_q=0.84, flowers=26, puddles=False, leaves=None, snow=False):
    n1, n2 = noise(seed), noise(seed + 1)
    rnd = random.Random(seed + 2)
    for y in range(H):
        for x in range(W):
            v = n1(x, y) + rnd.uniform(-0.05, 0.05)
            c = grass[2] if v < 0.55 else grass[1] if v < 0.95 else grass[3] if v > 1.6 else grass[2]
            if rnd.random() < 0.06:
                c = rnd.choice(grass[1:4])
            px[x, y] = hx(c)
    vals = sorted(n2(x, y) for y in range(0, H, 4) for x in range(0, W, 4))
    T = vals[int(len(vals) * dirt_q)]
    patch = {(x, y) for y in range(H) for x in range(W) if n2(x, y) + 0.08 * math.sin(x * 0.7 + y * 0.3) > T}
    for y in range(70, 206):
        cxp = 150 - (y - 70) * 0.36 + math.sin(y * 0.09) * 4
        for x in range(int(cxp - 8), int(cxp + 9)):
            patch.add((x, y))
    for y in range(96, 106):
        for x in range(4, 188):
            if abs(math.sin(x * 0.13)) * 3 + 6 > abs(y - 101) * 1.6:
                patch.add((x, y))
    for (x, y) in patch:
        if 0 <= x < W and 0 <= y < H:
            edge = any((x + a, y + b) not in patch for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)))
            if snow:
                put(x, y, "#D8C8B0" if edge else rnd.choice(["#E8DCC8"] * 6 + ["#F4EEE2"]))
            else:
                put(x, y, dirt[3] if edge and (x + y) % 2 else dirt[2] if edge else rnd.choice([dirt[1]] * 14 + [dirt[0], dirt[2]]))
    if puddles:
        for (cx, cy, rx, ry) in [(150, 120, 4, 2), (96, 101, 6, 2.5), (130, 190, 5, 2), (60, 100, 4, 1.8), (118, 160, 3, 1.5)]:
            for y in range(int(cy - ry), int(cy + ry) + 1):
                for x in range(int(cx - rx), int(cx + rx) + 1):
                    if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1:
                        put(x, y, WATER[0] if y < cy - ry * 0.3 else WATER[1])
    for _ in range(120):
        x, y = rnd.randrange(W), rnd.randrange(H)
        if (x, y) in patch:
            continue
        for k, (a, b) in enumerate([(0, 0), (-1, -1), (1, -1), (0, -2), (-2, -2), (2, -2)]):
            put(x + a, y + b, grass[4] if k == 0 else grass[0] if b == -2 else grass[3])
    for _ in range(flowers):
        x, y = rnd.randrange(W), rnd.randrange(H)
        if (x, y) in patch:
            continue
        col = rnd.choice(["#FFF4E0", "#F8D050", "#F0A0B8", "#B8A0F0"])
        for a, b in ((0, -1), (-1, 0), (1, 0), (0, 1)):
            put(x + a, y + b, col)
        put(x, y, "#E08030")
    if leaves:
        for _ in range(90):
            x, y = rnd.randrange(W), rnd.randrange(H)
            c = rnd.choice(leaves)
            put(x, y, c); put(x + 1, y, c)
    for _ in range(10):
        x, y = rnd.randrange(10, W - 10), rnd.randrange(80, 200)
        for k in range(rnd.randint(4, 7)):
            put(x + k, y + (k // 3), WOOD[3]); put(x + k, y + 1 + (k // 3), WOOD[4])
    return patch


def beds(snow=False):
    rnd = random.Random(11)
    for i, (x0, y0) in enumerate(BEDS):
        locked, w, h = i == 3, 78, 40
        shadow_ellipse(x0 + w / 2 + 3, y0 + h + 1, w / 2, 3, 60)
        for y in range(y0, y0 + h):
            for x in range(x0, x0 + w):
                border = x < x0 + 3 or x >= x0 + w - 3 or y < y0 + 3 or y >= y0 + h - 3
                if border:
                    c = WOOD[4] if x in (x0, x0 + w - 1) or y in (y0, y0 + h - 1) else WOOD[1] if y < y0 + 2 or x < x0 + 2 else WOOD[2]
                    if snow and y in (y0 + 1, y0 + 2):
                        c = SNOWY[0]
                    put(x, y, c)
                elif locked:
                    put(x, y, rnd.choice(SNOWY[1:4]) if snow else rnd.choice(["#A2B84C", "#7E9A3A", "#607E2E", "#C6D26A"]))
                else:
                    row = (y - y0 - 3) % 9
                    put(x, y, SOIL[0] if row == 0 else SOIL[1] if row < 3 else SOIL[2] if row < 7 else SOIL[3])
                    if snow and row == 0:
                        put(x, y, SNOWY[1])
        if locked and not snow:
            for _ in range(16):
                sx, sy = rnd.randrange(x0 + 6, x0 + w - 8), rnd.randrange(y0 + 6, y0 + h - 8)
                for (a, b) in [(0, 0), (-1, -1), (1, -1), (0, -2), (-2, -3), (2, -3)]:
                    put(sx + a, sy + b, rnd.choice(["#C6D26A", "#466022", "#7E9A3A"]))
        if locked:
            for (sx, sy) in [(x0 + 14, y0 + 26), (x0 + 58, y0 + 12)]:
                ellipse(sx, sy, 3, 2, STONE[2]); ellipse(sx, sy - 0.6, 3, 1.2, SNOWY[0] if snow else STONE[1])


def hedgerow_and_bank(ramps, dirt, snow=False):
    for k, x in enumerate(range(-6, W + 12, 15)):
        lay = cluster(x, 214 + (k % 2) * 2, 10, 8, ramps[k % len(ramps)], 40 + k, blobs=6, br=(4.5, 6.5))
        if snow:
            snowcap(lay)
    for y in range(224, H):
        for x in range(W):
            if y < 226:
                put(x, y, dirt[4])
            elif y < 236:
                put(x, y, dirt[2] if (x * 7 + y) % 11 else dirt[3])
            else:
                put(x, y, (SNOWY[1] if snow else dirt[1]) if (x + y) % 4 else (SNOWY[2] if snow else dirt[0]))
    for x in range(4, W, 11):
        for y in range(225, 238):
            put(x, y, WOOD[4]); put(x + 1, y, WOOD[1] if y < 227 else WOOD[2]); put(x + 2, y, WOOD[3]); put(x + 3, y, WOOD[4])
        if snow:
            put(x + 1, 224, SNOWY[0]); put(x + 2, 224, SNOWY[0])


# ---------------- the scenes ----------------
def scene_osaka(season):
    snow = season == "winter"
    grass = GRASS["snow" if snow else "autumn" if season == "autumn" else "lush" if season == "summer" else "green"]
    new_scene(grass[2])
    ground(grass, DIRT["ochre"], 1, leaves=["#E45C4C", "#EE9A3C", "#F8C860"] if season == "autumn" else ["#FAD2DF", "#F2B0C6"] if season == "spring" else None,
           snow=snow, flowers=0 if snow else 40 if season == "spring" else 20)
    beds(snow)
    drying_bed(56, 52, state="snow" if snow else "full"); drying_bed(56, 74, state="snow" if snow else "full")
    pond(24, 86, 19, 11, frozen=snow)
    house_japan(108, -6, snow)
    stone_lantern(100, 70)
    if season == "spring":
        tree(18, 12, 20, SAKURA, 1); tree(48, 40, 16, SAKURA, 2); tree(92, 26, 13, LEAF, 4)
        tree(176, 88, 14, LEAF, 3); tree(4, 132, 12, SAKURA, 5); tree(190, 140, 12, LEAF, 6)
    elif season == "summer":
        tree(18, 12, 20, LUSH, 1); tree(48, 40, 16, LUSH, 2); tree(92, 26, 13, LEAF, 4)
        tree(176, 88, 14, LUSH, 3); tree(4, 132, 12, LEAF, 5); tree(190, 140, 12, LUSH, 6)
    elif season == "autumn":
        tree(18, 12, 20, AUTUMN, 1); tree(48, 40, 16, MAPLE, 2); tree(92, 26, 13, MAPLE, 4)
        tree(176, 88, 14, AUTUMN, 3); tree(4, 132, 12, MAPLE, 5); tree(190, 140, 12, AUTUMN, 6)
    else:
        bare_tree(18, 12, 18, 1); bare_tree(48, 40, 15, 2); pine(92, 22, 13, 4, snow=True)
        pine(176, 84, 14, 3, snow=True); bare_tree(4, 132, 11, 5); pine(190, 136, 12, 6, snow=True)
    hedge = [[SNOWY[1], SNOWY[2], LEAF[3], LEAF[4], LEAF[5]]] if False else ([LEAF, OCHRE, LEAF, COFFEE] if season != "autumn" else [AUTUMN, OCHRE, MAPLE, LEAF])
    hedgerow_and_bank(hedge, DIRT["ochre"], snow)


def scene_huila(season):
    harvest = season == "harvest"
    grass = GRASS["green" if harvest else "lush"]
    new_scene(grass[2])
    ground(grass, DIRT["ochre"] if harvest else DIRT["wet"], 3, puddles=not harvest, flowers=24 if harvest else 40)
    beds()
    marquesina(4, 38, 92, 40, "full" if harvest else "empty")
    house_finca(108, -4)
    paddle_plant(14, 18, 18, 1); paddle_plant(44, 10, 14, 2); paddle_plant(90, 18, 12, 3)
    tree(176, 92, 14, LUSH if not harvest else LEAF, 3); paddle_plant(6, 136, 13, 5); tree(190, 140, 12, LEAF, 6)
    hedgerow_and_bank([LEAF, COFFEE, LUSH, OCHRE], DIRT["ochre"])


def scene_mogiana(season):
    harvest = season == "harvest"
    grass = GRASS["dry" if harvest else "lush"]
    new_scene(grass[2])
    ground(grass, DIRT["red"], 5, dirt_q=0.78, puddles=not harvest, flowers=12 if harvest else 30)
    beds()
    terreiro(4, 30, 96, 62, "full" if harvest else "wet")
    house_fazenda(106, -6)
    tree(14, 12, 16, IPE if harvest else LUSH, 1); tree(84, 12, 12, IPE if harvest else LEAF, 2)
    palm(178, 86, 14, 3); tree(4, 136, 12, IPE if harvest else LEAF, 5); palm(188, 132, 12, 6)
    hedgerow_and_bank([OCHRE, LEAF, OCHRE, COFFEE], DIRT["red"])


def scene_gedeo(season):
    harvest = season == "harvest"
    grass = GRASS["dry" if harvest else "lush"]
    new_scene(grass[2])
    ground(grass, DIRT["rust"], 7, puddles=not harvest, flowers=10 if harvest else 34)
    beds()
    african_beds(6, 26, 3, "full" if harvest else "tarp")
    tukul(150, 32, 30)
    paddle_plant(102, 18, 14, 1, midrib="#B8402C"); paddle_plant(186, 88, 13, 2, midrib="#B8402C")
    acacia(18, 10, 18, 3, LEAF if harvest else LUSH); acacia(4, 140, 12, 4, LEAF); paddle_plant(190, 140, 11, 5, midrib="#B8402C")
    hedgerow_and_bank([OCHRE, LEAF, COFFEE, OCHRE], DIRT["rust"])


def scene_toba(season):
    harvest = season == "harvest"
    grass = GRASS["green" if harvest else "lush"]
    new_scene(grass[2])
    ground(grass, DIRT["volcanic"], 9, puddles=not harvest, flowers=20 if harvest else 36)
    lake(0, 0, 100, 96)
    beds()
    drying_bed(62, 74, 34, 14, "full" if harvest else "tarp")
    house_batak(106, -4)
    palm(98, 30, 14, 1); palm(178, 90, 14, 2); palm(6, 136, 12, 3); tree(190, 140, 12, LUSH, 4)
    hedgerow_and_bank([LUSH, COFFEE, LEAF, LUSH], DIRT["volcanic"])


def scene_turrialba(season):
    harvest = season == "harvest"
    grass = GRASS["lush"]
    new_scene(grass[2])
    ground(grass, DIRT["volcanic"] if not harvest else DIRT["ochre"], 11, puddles=not harvest, flowers=30)
    beds()
    wet_mill(6, 40, "full" if harvest else "empty")
    house_tico(110, -6)
    tree(16, 12, 16, PORO if harvest else LUSH, 1); paddle_plant(60, 14, 14, 2); tree(96, 22, 11, PORO if harvest else LEAF, 3)
    tree(178, 90, 14, PORO if harvest else LUSH, 4); paddle_plant(6, 136, 13, 5); tree(190, 140, 12, LUSH, 6)
    hedgerow_and_bank([LUSH, COFFEE, LEAF, LUSH], DIRT["ochre"])


SCENES = {
    "osaka": (scene_osaka, ["spring", "summer", "autumn", "winter"]),
    "huila": (scene_huila, ["harvest", "rainy"]),
    "mogiana": (scene_mogiana, ["harvest", "rainy"]),
    "gedeo": (scene_gedeo, ["harvest", "rainy"]),
    "toba": (scene_toba, ["harvest", "rainy"]),
    "turrialba": (scene_turrialba, ["harvest", "rainy"]),
}
os.makedirs(os.path.join(HERE, "bg"), exist_ok=True)
rendered = {}
for loc, (fn, seasons) in SCENES.items():
    for s in seasons:
        fn(s)
        img.save(os.path.join(HERE, "bg", "%s-%s.png" % (loc, s)))
        rendered[(loc, s)] = img.copy()
for old in ("farm-bg.png",):
    p = os.path.join(HERE, old)
    if os.path.exists(p):
        os.remove(p)

# ---------------- coffee varieties ----------------
VARIETIES = {
    #  name                 ripe [highlight, colour, shade]          unripe                                leaf ramp  shape (w, h, compactness)
    "caturra":        ("Caturra",        ["#FFB4A0", "#E83A30", "#9A1C20"], ["#D8E890", "#A8C850", "#6E8A30"], COFFEE, (1.0, 1.0, 1.0)),
    "castillo":       ("Castillo",       ["#F49484", "#C8282C", "#741418"], ["#D0E488", "#9CC048", "#64822C"], COFFEE, (1.05, 1.05, 1.0)),
    "pinkbourbon":    ("Pink Bourbon",   ["#FFD0E0", "#F06A98", "#A83A66"], ["#E0EC98", "#B4CC58", "#748E34"], COFFEE, (1.0, 1.08, 1.0)),
    "yellowbourbon":  ("Yellow Bourbon", ["#FFF4B0", "#F2C42C", "#A88010"], ["#E0EC98", "#B4CC58", "#748E34"], COFFEE, (1.0, 1.08, 1.0)),
    "mundonovo":      ("Mundo Novo",     ["#F6A0A0", "#D03440", "#82161E"], ["#D0E488", "#9CC048", "#64822C"], COFFEE, (1.1, 1.1, 0.95)),
    "catuai":         ("Yellow Catuai",  ["#FFF8C0", "#E6CC3A", "#9C8418"], ["#D8E890", "#A8C850", "#6E8A30"], COFFEE, (1.0, 0.92, 1.1)),
    "catimor":        ("Catimor",        ["#FFB89C", "#F04838", "#A02418"], ["#D8E890", "#A8C850", "#6E8A30"], ["#8CC05A", "#62A244", "#448838", "#2E6C2E", "#1E5024", "#143618"], (0.95, 0.82, 1.2)),
    "heirloom":       ("Ethiopian heirloom", ["#E888A0", "#9E2040", "#561028"], ["#C8DC80", "#94B444", "#5E7A28"], ["#6A9C50", "#4A823C", "#346A30", "#245226", "#183C1C", "#10281A"], (0.95, 1.0, 0.85)),
    "geisha":         ("Geisha",         ["#F0A0B8", "#B02854", "#64102E"], ["#D8E890", "#A8C850", "#6E8A30"], ["#A8C070", "#7EA856", "#5A9040", "#3E7434", "#2A5426", "#1A381A"], (0.8, 1.22, 0.9)),
}
S = {}


def add_layer(name, w, h, layer_fn):
    canvas = {}
    layer_fn(lambda x, y, c: canvas.__setitem__((int(x), int(y)), c) if 0 <= int(x) < w and 0 <= int(y) < h else None)
    cols = sorted(set(canvas.values()))
    keys = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    pal = {keys[i]: c for i, c in enumerate(cols)}
    inv = {c: k for k, c in pal.items()}
    S[name] = {"w": w, "h": h, "rows": ["".join(inv.get(canvas.get((x, y)), ".") for x in range(w)) for y in range(h)], "pal": pal}


def add_grid(name, rows, pal):
    assert all(len(r) == len(rows[0]) for r in rows), name
    S[name] = {"w": len(rows[0]), "h": len(rows), "rows": rows, "pal": pal}


def shrub(stage, vid):
    _, ripe, unripe, leaf, (sw, sh, dense) = VARIETIES[vid]
    def draw(p):
        for x in range(3, 15):
            p(x, 21, SOIL[3]); p(x, 20, SOIL[1] if 4 < x < 14 else SOIL[3])
        if stage == 0:
            for (x, y, c) in [(8, 19, leaf[3]), (8, 18, leaf[2]), (7, 17, leaf[1]), (6, 16, leaf[1]), (9, 17, leaf[1]), (10, 16, leaf[0]), (7, 16, leaf[0]), (11, 16, leaf[2]), (5, 16, leaf[2])]:
                p(x, y, c)
            return
        size = 0.62 if stage == 1 else 1.0
        rx, ry = 7 * size * sw, 8 * size * sh
        cluster(9, 19 - ry, rx, ry, leaf, 11 + stage + len(vid), blobs=int(12 * size * dense) + 4, br=(2.2, 3.4), target=p)
        if vid == "geisha" and stage >= 1:   # bronze new growth at the tips
            for (x, y) in [(8, int(19 - 2 * ry)), (11, int(20 - 2 * ry))]:
                p(x, y + 1, "#B07A44")
        if stage >= 2:
            top = 19 - 2 * ry
            small = vid == "heirloom"
            spots = [(4, 0.34), (10, 0.2), (7, 0.52), (12, 0.56), (5, 0.72), (10, 0.78)] if not small else \
                    [(5, 0.3), (9, 0.2), (12, 0.35), (7, 0.5), (11, 0.58), (4, 0.62), (8, 0.74), (13, 0.75)]
            for (x, f) in spots:
                y = int(top + f * 2 * ry)
                if stage == 2:
                    for (a, b) in ((0, 0), (2, 0), (1, 1), (1, -1)):
                        p(x + a, y + b, "#FFFFFF")
                    p(x + 1, y, "#F8E8A0")
                    continue
                c = unripe if stage == 3 else ripe
                berries = [(0, 0)] if small else [(0, 0), (2, 0), (1, 2)]
                for (a, b) in berries:
                    bx, by = x + a, y + b
                    if vid == "geisha":
                        p(bx, by, c[0]); p(bx, by + 1, c[1]); p(bx, by + 2, c[2])
                    else:
                        p(bx, by, c[0]); p(bx + 1, by, c[1]); p(bx, by + 1, c[1]); p(bx + 1, by + 1, c[2])
    return draw


STAGES = ["sprout", "young", "flower", "green", "ripe"]
for vid in VARIETIES:
    for i, st in enumerate(STAGES):
        add_layer("bush_%s_%s" % (vid, st), 18, 22, shrub(i, vid))

# ---------------- workers, the shiba, props ----------------
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
SHIBA_TOP = ["................", "..O.O...........", ".OoOoO..........", ".OooooO......O..", "OwnoowO.....OtO.", ".OwwwoOOOOOOoO..", "..OOOoooooooqO..", "....OwwwwooqqO..", "....OwwOOOOwqO.."]
add_grid("shiba_0", SHIBA_TOP + ["....OqO....OqO..", "....OO.....OO...", "................"], SHIBA)
add_grid("shiba_1", SHIBA_TOP + ["...OqO......OqO.", "...OO.......OO..", "................"], SHIBA)
add_grid("sparkle", ["...a....", "...a....", "..aba...", "aabwbaa.", "..aba...", "...a....", "...a....", "........"], {"a": "#F8D040", "b": "#FFF0A0", "w": "#FFFFFF"})
add_grid("basket", ["..oooooooooooo..", ".oaaaaaaaaaaaao.", ".obbbbbbbbbbbbo.", ".oooooooooooooo.", ".obcbcbcbcbcbco.", ".ocbcbcbcbcbcdo.", ".obcbcbcbcbcbdo.", "..ocdcdcdcdcdo..", "..oooooooooooo.."],
         {"a": "#F4D490", "b": "#DCB468", "c": "#BC8C48", "d": "#906830", "o": OUT})
add_grid("cherrypile", ["....oo.ooo.o....", "..oohroohrrhoo..", ".orhrqrhrqrhrqo.", ".orrqrrrqrrrqro."], {"h": "#FFB4A0", "r": "#E83A30", "q": "#A01C20", "o": "#5A1410"})
add_grid("sack", ["...oo...", "..oddo..", ".oabbco.", "oabhrbco", "obbrrbco", "obbbbcco", ".occcco.", "..oooo.."],
         {"a": "#F4D490", "b": "#DCB468", "c": "#BC8C48", "d": "#906830", "o": OUT, "h": "#FFB4A0", "r": "#E83A30"})
add_grid("bubble_full", [".oooooooooooooo.", "owwwwwwwwwwwwwwo", "owrrrwrwrwrwwrwo", "owrwwwrwrwrwwrwo", "owrrwwrwrwrwwrwo", "owrwwwrwrwrwwrwo", "owrwwwwrwwrrwrro", "owwwwwwwwwwwwwwo",
                         ".oooooooowoooooo", ".......owo......", "........o.......", "................"], {"o": OUT, "w": "#FFF8EC", "r": "#D8402C"})
add_grid("sign", [".oooooooooooooo.", "oaaaaaaaaaaaaabo", "oabbbbbbbbbbbbco", "oabbbbbbbbbbbbco", "obccccccccccccco", ".oooooooooooooo.", "......obco......", "......obco......", "......obdo......"],
         {"a": WOOD[0], "b": WOOD[1], "c": WOOD[2], "d": WOOD[3], "o": OUT})

# ---------------- upgrade, processing and interface art ----------------
def rect(p, x0, y0, w, h, c):
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            p(x, y, c)


def frame(p, x0, y0, w, h, fillc, out=OUT):
    rect(p, x0, y0, w, h, out); rect(p, x0 + 1, y0 + 1, w - 2, h - 2, fillc)


def basket_at(p, x0, y0, full=True):
    rows = ["..oooooooooooo..", ".oaaaaaaaaaaaao.", ".obbbbbbbbbbbbo.", ".oooooooooooooo.", ".obcbcbcbcbcbco.", ".ocbcbcbcbcbcdo.", ".obcbcbcbcbcbdo.", "..ocdcdcdcdcdo..", "..oooooooooooo.."]
    pal = {"a": "#F4D490", "b": "#DCB468", "c": "#BC8C48", "d": "#906830", "o": OUT}
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            if ch != ".":
                p(x0 + x, y0 + y, pal[ch])
    if full:
        for (x, y) in [(3, -1), (5, -2), (7, -1), (9, -2), (11, -1), (4, 0), (6, -1), (8, 0), (10, -1), (12, 0)]:
            p(x0 + x, y0 + y, "#E83A30"); p(x0 + x, y0 + y - 1, "#FFB4A0")


def crate_at(p, x0, y0, w=16, h=12, full=True):
    frame(p, x0, y0, w, h, WOOD[1])
    for x in range(x0 + 1, x0 + w - 1):
        p(x, y0 + h // 2, WOOD[3]); p(x, y0 + 1, WOOD[0])
    for y in range(y0 + 1, y0 + h - 1):
        p(x0 + 3, y, WOOD[2]); p(x0 + w - 4, y, WOOD[2])
    if full:
        for x in range(x0 + 2, x0 + w - 2, 2):
            p(x, y0 - 1, "#E83A30"); p(x + 1, y0 - 1, "#B02820"); p(x, y0 - 2, "#FFB4A0")


def storage(level):
    def draw(p):
        for y in range(34, 38):
            for x in range(2, 38):
                if ((x - 20) / 18) ** 2 + ((y - 36) / 2.2) ** 2 <= 1:
                    p(x, y, "#2A2A0840")
        if level == 1:
            basket_at(p, 12, 26)
        elif level == 2:
            basket_at(p, 4, 26); basket_at(p, 20, 26); basket_at(p, 12, 16)
        elif level == 3:
            crate_at(p, 3, 24); crate_at(p, 21, 24); crate_at(p, 12, 13); basket_at(p, 23, 14)
        elif level == 4:   # wooden shed with sacks inside
            rect(p, 4, 16, 32, 20, OUT); rect(p, 5, 17, 30, 18, WOOD[2])
            for x in range(5, 35, 4):
                for y in range(17, 35):
                    p(x, y, WOOD[3])
            rect(p, 12, 22, 16, 13, "#3A2418")
            for (sx, sy) in [(13, 27), (20, 28), (16, 23)]:
                rect(p, sx, sy, 7, 7, "#C8A870"); rect(p, sx + 1, sy + 1, 5, 2, "#E0C890"); p(sx + 3, sy + 3, "#2D6A46")
            for y in range(4, 17):
                inset = (16 - y) // 2
                for x in range(1 + inset, 39 - inset):
                    p(x, y, OUT if x in (1 + inset, 38 - inset) or y == 16 else WOOD[0] if (x + y) % 6 else WOOD[1])
        else:              # the barn, with the Beju crane on the gable
            rect(p, 1, 14, 38, 22, OUT); rect(p, 2, 15, 36, 20, "#B8483A")
            for x in range(2, 38, 3):
                for y in range(15, 35):
                    p(x, y, "#9A3A2E")
            rect(p, 12, 20, 16, 15, "#F4ECDC"); rect(p, 13, 21, 14, 14, "#7A4A2A")
            for k in range(14):
                p(13 + k, 21 + k * 13 // 14, "#F4ECDC"); p(26 - k, 21 + k * 13 // 14, "#F4ECDC")
            rect(p, 19, 21, 2, 14, "#F4ECDC")
            for y in range(0, 15):
                half = 4 + y * 1.25
                for x in range(int(20 - half), int(20 + half) + 1):
                    p(x, y, OUT if abs(x - 20) >= int(half) or y == 14 else "#7A3A30" if (x + y) % 5 else "#6A3028")
            for (x, y) in [(19, 6), (20, 6), (18, 7), (21, 7), (16, 8), (23, 8), (19, 8), (20, 8), (19, 9), (20, 10)]:
                p(x, y, "#F8F4EC")
    return draw


for lv in range(1, 6):
    add_layer("storage_%d" % lv, 40, 38, storage(lv))
STORAGE = [{"name": "Basket", "cap": 100}, {"name": "Basket stack", "cap": 250}, {"name": "Crate pile", "cap": 500},
           {"name": "Storage shed", "cap": 1200}, {"name": "Beju barn", "cap": 3000}]


def backbasket(p):
    rect(p, 1, 1, 8, 8, OUT); rect(p, 2, 2, 6, 6, "#DCB468")
    for y in range(2, 8):
        for x in range(2, 8):
            if (x + y) % 2:
                p(x, y, "#BC8C48")
    for x in range(2, 8, 2):
        p(x, 1, "#E83A30"); p(x + 1, 1, "#FFB4A0")


def wheelbarrow(p):
    for x in range(2, 16):
        p(x, 2, OUT)
    for y in range(3, 7):
        for x in range(2 + (y - 3), 16 - (y - 3)):
            p(x, y, "#7A8A96" if x in (2 + (y - 3), 15 - (y - 3)) else "#A8B8C4")
    for x in range(4, 14, 2):
        p(x, 1, "#E83A30"); p(x + 1, 1, "#B02820"); p(x, 0, "#FFB4A0")
    rect(p, 7, 7, 4, 3, OUT); rect(p, 8, 8, 2, 1, "#4A4A4A")
    for x in range(14, 18):
        p(x, 1, WOOD[3])


add_layer("carry_backbasket", 10, 10, backbasket)
add_layer("carry_wheelbarrow", 18, 10, wheelbarrow)
CARRY = [{"name": "Cloth sack", "kg": 9, "sprite": "sack"}, {"name": "Back basket", "kg": 15, "sprite": "carry_backbasket"},
         {"name": "Wheelbarrow", "kg": 30, "sprite": "carry_wheelbarrow"}]


def bed_open(p):
    w, h = 78, 40
    for y in range(h):
        for x in range(w):
            border = x < 3 or x >= w - 3 or y < 3 or y >= h - 3
            if border:
                p(x, y, WOOD[4] if x in (0, w - 1) or y in (0, h - 1) else WOOD[1] if y < 2 or x < 2 else WOOD[2])
            else:
                row = (y - 3) % 9
                p(x, y, SOIL[0] if row == 0 else SOIL[1] if row < 3 else SOIL[2] if row < 7 else SOIL[3])


add_layer("bed_open", 78, 40, bed_open)


def icon(name, draw, size=24):
    add_layer(name, size, size, draw)


def proc_washed(p):
    frame(p, 2, 8, 20, 14, CONCRETE[1], "#5E5A54")
    rect(p, 4, 10, 16, 10, WATER[2])
    for x in range(5, 19, 3):
        p(x, 11, "#FFFFFF")
    for (x, y) in [(7, 15), (11, 17), (15, 14), (9, 18), (14, 18)]:
        p(x, y, "#E8D8A0"); p(x + 1, y, "#C8B070")
    for (x, y) in [(10, 3), (11, 4), (12, 5), (13, 4), (14, 3)]:
        p(x, y, WATER[1])


def proc_natural(p):
    for k in range(8):
        a = k / 8 * math.tau
        p(18 + math.cos(a) * 4, 6 + math.sin(a) * 4, "#F8C030")
    rect(p, 16, 4, 5, 5, "#FFE070")
    frame(p, 1, 13, 22, 7, WOOD[2])
    for x in range(2, 22):
        p(x, 14, "#C64034" if x % 3 else "#8A2426"); p(x, 15, "#A82E2C" if x % 2 else "#D86048"); p(x, 16, "#C64034")
    for x in (3, 19):
        for y in range(20, 23):
            p(x, y, WOOD[4])


def proc_honey(p):
    for (cx, cy) in [(8, 14), (14, 12), (12, 18), (17, 17)]:
        for y in range(-3, 4):
            for x in range(-2, 3):
                if x * x / 6 + y * y / 10 <= 1:
                    p(cx + x, cy + y, "#E8A830" if x < 0 else "#C88420")
        for y in range(-2, 3):
            p(cx, cy + y, "#8A5A18")
    for y in range(2, 9):
        p(12, y, "#F8C040"); p(13, y, "#E0A028")
    rect(p, 11, 9, 4, 2, "#F8C040")


def barrel(dark):
    def draw(p):
        body = ["#B07A44", "#8E5E34", "#6E4626"] if not dark else ["#7A4A2E", "#5E3822", "#422614"]
        for y in range(3, 22):
            bulge = int(2.5 * math.sin((y - 3) / 18 * math.pi))
            for x in range(5 - bulge, 19 + bulge):
                c = body[0] if x < 9 else body[1] if x < 15 else body[2]
                if x in (5 - bulge, 18 + bulge):
                    c = OUT
                p(x, y, c)
        for y in (6, 18):
            for x in range(4, 20):
                p(x, y, "#5A5A60"); p(x, y + 1, "#8A8A92")
        for x in range(6, 18):
            p(x, 3, OUT)
        if dark:
            rect(p, 9, 10, 6, 5, "#E8D0A0"); p(11, 12, "#7A2A20"); p(12, 12, "#7A2A20")
    return draw


def proc_strawberry(p):
    frame(p, 5, 5, 14, 17, "#DDEEF2", "#7A9AA8")
    rect(p, 6, 3, 12, 3, "#C8A870"); rect(p, 6, 3, 12, 1, "#E0C890")
    rect(p, 6, 12, 12, 9, "#E8C0C8")
    for (x, y) in [(8, 15), (12, 14), (10, 18), (14, 18), (15, 13)]:
        rect(p, x, y, 3, 3, "#E83A40"); p(x + 1, y + 1, "#FFD860"); p(x + 1, y - 1, "#3E8A3A")


icon("proc_washed", proc_washed); icon("proc_natural", proc_natural); icon("proc_honey", proc_honey)
icon("proc_whiskey", barrel(False)); icon("proc_rum", barrel(True)); icon("proc_strawberry", proc_strawberry)


def bean_sack(p):
    for y in range(4, 22):
        half = 6 + min(3, (y - 4) // 3)
        for x in range(12 - half, 12 + half):
            p(x, y, OUT if x in (12 - half, 11 + half) or y == 21 else "#C8A870" if (x + y) % 3 else "#B49058")
    rect(p, 9, 1, 6, 4, "#B49058"); rect(p, 8, 4, 8, 1, OUT)
    for (x, y) in [(11, 10), (12, 10), (10, 11), (13, 11), (11, 12), (12, 12), (11, 13), (12, 14)]:
        p(x, y, "#2D6A46")


icon("green_sack", bean_sack)


def mk_icon(fn):
    def draw(p):
        fn(p)
    return draw


def i_coin(p):
    for y in range(12):
        for x in range(12):
            d = (x - 5.5) ** 2 + (y - 5.5) ** 2
            if d <= 30:
                p(x, y, OUT if d > 22 else "#FFE080" if x + y < 9 else "#F2C04A" if d < 12 else "#D09A30")
    rect(p, 5, 3, 2, 6, "#B07A20")


def i_crane(p):
    for y in range(12):
        for x in range(12):
            if (x - 5.5) ** 2 + (y - 5.5) ** 2 <= 30:
                p(x, y, OUT if (x - 5.5) ** 2 + (y - 5.5) ** 2 > 22 else "#2D6A46")
    for (x, y) in [(2, 4), (3, 5), (4, 6), (5, 6), (6, 6), (7, 6), (8, 5), (9, 4), (5, 3), (5, 4), (6, 5), (5, 7), (6, 8)]:
        p(x, y, "#F8F4EC")


def i_points(p):
    pts = [(5.5, 0), (7, 4), (11.5, 4.5), (8, 7.2), (9.5, 11.5), (5.5, 9), (1.5, 11.5), (3, 7.2), (-0.5, 4.5), (4, 4)]
    for y in range(12):
        for x in range(12):
            inside = False
            j = len(pts) - 1
            for i in range(len(pts)):
                xi, yi = pts[i]; xj, yj = pts[j]
                if ((yi > y + 0.5) != (yj > y + 0.5)) and (x + 0.5 < (xj - xi) * (y + 0.5 - yi) / (yj - yi + 1e-9) + xi):
                    inside = not inside
                j = i
            if inside:
                p(x, y, "#9CC860" if y < 6 else "#6E9A3A")


def i_cherry(p):
    for (cx, cy) in [(3.5, 7.5), (8, 8)]:
        for y in range(12):
            for x in range(12):
                d = (x - cx) ** 2 + (y - cy) ** 2
                if d <= 7:
                    p(x, y, OUT if d > 5 else "#FFB4A0" if x < cx and y < cy else "#E83A30")
    for (x, y) in [(4, 4), (5, 3), (6, 2), (7, 3), (8, 4), (8, 5), (6, 1), (7, 1)]:
        p(x, y, "#3E7C34")


def i_bean(p):
    for y in range(12):
        for x in range(12):
            d = ((x - 5.5) / 4.5) ** 2 + ((y - 5.5) / 5.5) ** 2
            if d <= 1:
                p(x, y, OUT if d > 0.75 else "#B8C878" if x < 5 else "#94A85A")
    for y in range(2, 10):
        p(5 + (1 if y in (4, 5, 6) else 0), y, "#6A7A3A")


def i_heart(p):
    rows = [".oo.oo.", "ohhoffo", "ohfffffo"[:7], "offfffo", ".offfo.", "..ofo..", "...o..."]
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            if ch != ".":
                p(x + 2, y + 3, {"o": OUT, "h": "#FFD0A0", "f": "#F07A3A"}[ch])


def i_cup(p):
    rect(p, 1, 4, 8, 7, OUT); rect(p, 2, 5, 6, 5, "#F8F4EC"); rect(p, 2, 5, 6, 1, "#6A3A20")
    for y in range(6, 9):
        p(9, y, OUT)
    p(10, 6, OUT); p(10, 8, OUT)
    for (x, y) in [(3, 1), (4, 2), (6, 1), (7, 2)]:
        p(x, y, "#C8C0B8")


def i_box(p):
    rect(p, 1, 3, 10, 8, OUT); rect(p, 2, 4, 8, 6, WOOD[1]); rect(p, 2, 6, 8, 1, WOOD[3]); rect(p, 5, 4, 2, 6, WOOD[2])


def i_worker(p):
    rect(p, 2, 2, 8, 2, "#F4DE9C"); rect(p, 0, 4, 12, 1, "#A88440"); rect(p, 3, 5, 6, 3, "#F8D2B0"); p(4, 6, OUT); p(7, 6, OUT); rect(p, 2, 8, 8, 4, "#4860C0")


for nm, fn in [("i_coin", i_coin), ("i_crane", i_crane), ("i_points", i_points), ("i_cherry", i_cherry), ("i_bean", i_bean),
               ("i_heart", i_heart), ("i_cup", i_cup), ("i_box", i_box), ("i_worker", i_worker)]:
    add_layer(nm, 12, 12, fn)

STAMP_COLORS = {"huila": "#B2455F", "mogiana": "#7A5230", "gedeo": "#6A4C9C", "toba": "#17788A", "turrialba": "#A5650F", "osaka": "#2D6A46"}


def stamp(col):
    def draw(p):
        for y in range(24):
            for x in range(24):
                d = math.hypot(x - 11.5, y - 11.5)
                if 9.5 <= d <= 11.5:
                    p(x, y, col)
                elif d <= 7.5 and (x + y) % 7 == 0:
                    p(x, y, col + "40")
        for (x, y) in [(7, 9), (8, 10), (9, 11), (10, 12), (11, 12), (12, 12), (13, 12), (14, 11), (15, 10), (16, 9), (11, 7), (11, 8), (11, 9), (12, 10), (11, 13), (11, 14), (12, 15)]:
            p(x, y, col)
        for x in range(6, 18):
            p(x, 18, col if x % 3 else col + "80")
    return draw


for loc, col in STAMP_COLORS.items():
    add_layer("stamp_" + loc, 24, 24, stamp(col))

HATS = {"straw": ["#F4DE9C", "#D8B868", "#A88440"], "beju": ["#6FB08A", "#2D6A46", "#1E4A30"], "sakura": ["#FAD2DF", "#E68EAC", "#C86C8E"],
        "indigo": ["#7088D0", "#3A4C9C", "#262F6A"], "harvest": ["#F8B860", "#E07830", "#A84E18"]}

SHIRTS = [["#7890E0", "#4860C0", "#304090"], ["#F07888", "#D04058", "#902838"], ["#90C070", "#5A9848", "#386830"],
          ["#F8C860", "#D89830", "#A06818"], ["#B898E8", "#8060C0", "#584090"], ["#70D0D8", "#30A0B0", "#207078"],
          ["#E0A878", "#B07040", "#7A4A24"], ["#F8A0C0", "#E06890", "#A84068"]]

# Locations: the varieties grown in each bed, real harvest months and the reward for finishing a harvest.
LOCATIONS = {
    "huila":     {"name": "Huila, Colombia", "beds": ["pinkbourbon", "caturra", "castillo"], "months": [3, 4, 5, 10, 11], "reward": "Colombia Pink Whiskey", "seasons": ["harvest", "rainy"]},
    "mogiana":   {"name": "Mogiana, Brazil", "beds": ["yellowbourbon", "mundonovo", "catuai"], "months": [5, 6, 7, 8], "reward": "Casablanca Blend", "seasons": ["harvest", "rainy"]},
    "gedeo":     {"name": "Gedeo, Ethiopia", "beds": ["heirloom", "heirloom", "heirloom"], "months": [10, 11, 12, 1], "reward": "Ethiopia Yirgacheffe", "seasons": ["harvest", "rainy"]},
    "toba":      {"name": "Lake Toba, Sumatra", "beds": ["catimor", "catimor", "catimor"], "months": [10, 11, 12, 1, 2], "reward": "Sumatra Strawberry", "seasons": ["harvest", "rainy"]},
    "turrialba": {"name": "Turrialba, Costa Rica", "beds": ["caturra", "catuai", "geisha"], "months": [10, 11, 12, 1, 2, 3], "reward": "Casablanca Blend", "seasons": ["harvest", "rainy"]},
    "osaka":     {"name": "Osaka roastery garden", "beds": ["geisha", "pinkbourbon", "yellowbourbon"], "months": [], "reward": "", "seasons": ["spring", "summer", "autumn", "winter"]},
}


# ---------------- farm buildings (28x26, standing on the hedge line), cosmetics, contracts board ----------------
def ground_shadow(p, w, h, cy=None):
    cy = h - 2 if cy is None else cy
    for y in range(h):
        for x in range(w):
            if ((x - w / 2 + 0.5) / (w / 2 - 1)) ** 2 + ((y - cy) / 2.0) ** 2 <= 1:
                p(x, y, "#2A2A0850")


def b_housing(p):
    ground_shadow(p, 28, 26)
    rect(p, 3, 12, 22, 13, OUT); rect(p, 4, 13, 20, 11, WOOD[1])
    for y in range(13, 24, 3):
        for x in range(4, 24):
            p(x, y, WOOD[2])
    rect(p, 11, 16, 6, 8, OUT); rect(p, 12, 17, 4, 7, WOOD[3]); p(15, 20, WOOD[0])
    for wx in (5, 19):
        rect(p, wx, 15, 4, 4, OUT); rect(p, wx + 1, 16, 2, 2, "#F8E8A0")
    for y in range(2, 13):
        half = 3 + (y - 2) * 1.25
        for x in range(int(14 - half), int(14 + half) + 1):
            edge = abs(x - 14) >= int(half) or y == 12
            p(x, y, OUT if edge else THATCH[1] if (x + y) % 4 else THATCH[3])
    for x in range(10, 19):
        p(x, 3, THATCH[0])
    rect(p, 18, 0, 3, 5, STONE[2]); p(19, 0, STONE[0])


def b_wetmill(p):
    ground_shadow(p, 28, 26)
    for x in (3, 24):
        rect(p, x, 6, 1, 12, WOOD[3])
    for y in range(3, 7):
        for x in range(1 + (6 - y), 27 - (6 - y)):
            p(x, y, OUT if y == 3 or x in (1 + (6 - y), 26 - (6 - y)) else "#A8B8C4" if x % 3 else "#7A8A96")
    rect(p, 2, 15, 24, 10, OUT); rect(p, 3, 16, 22, 8, CONCRETE[1])
    rect(p, 4, 17, 20, 5, WATER[2])
    for x in range(5, 23, 4):
        p(x, 18, "#FFFFFF"); p(x + 1, 20, WATER[0])
    for (x, y) in [(7, 20), (12, 19), (17, 21), (20, 19)]:
        p(x, y, "#E83A30")
    for k in range(6):
        p(20 + k % 2, 9 + k, WATER[1])
    rect(p, 18, 7, 6, 2, STONE[3])


def b_drybeds(p):
    ground_shadow(p, 28, 26)
    for (ty, cols) in [(9, ("#9A3A2E", "#C8483A", "#E8B060")), (16, ("#7A3A24", "#A85A34", "#C8A870"))]:
        for x in (3, 13, 24):
            rect(p, x, ty + 3, 1, 7, WOOD[3])
        rect(p, 1, ty, 26, 4, OUT); rect(p, 2, ty + 1, 24, 2, "#D8D2C4")
        for x in range(2, 26):
            p(x, ty + 1, cols[x % 3]); p(x, ty + 2, cols[(x + 1) % 3] if x % 2 else "#D8D2C4")


def b_compost(p):
    ground_shadow(p, 28, 26)
    for bx in (2, 15):
        rect(p, bx, 12, 11, 12, OUT); rect(p, bx + 1, 13, 9, 10, WOOD[2])
        for y in range(14, 23, 3):
            for x in range(bx + 1, bx + 10):
                p(x, y, WOOD[1])
        for y in range(9, 14):
            for x in range(bx + 1 + (13 - y) // 2, bx + 10 - (13 - y) // 2):
                p(x, y, SOIL[3] if (x * 3 + y) % 5 else SOIL[1])
    for (x, y) in [(5, 10), (8, 11), (18, 10), (21, 11), (19, 12)]:
        p(x, y, LEAF[1]); p(x + 1, y, LEAF[3])
    for y in range(4, 18):
        p(14, y, WOOD[3])
    for x in (12, 14, 16):
        p(x, 3, "#8A9AA6"); p(x, 4, "#8A9AA6")
    rect(p, 12, 4, 5, 1, "#8A9AA6")


def b_shade(p):
    ground_shadow(p, 28, 26)
    rect(p, 13, 14, 3, 11, WOOD[3]); p(13, 14, WOOD[2]); p(12, 24, WOOD[3]); p(16, 24, WOOD[3])
    cluster(14, 9, 13, 8, LUSH, 41, blobs=22, br=(3, 5), target=p)
    for (x, y) in [(6, 8), (20, 6), (12, 4), (17, 12)]:
        p(x, y, "#F4F0C8"); p(x + 1, y, "#E8D890")


def b_sorter(p):
    ground_shadow(p, 28, 26)
    for x in (3, 24):
        rect(p, x, 7, 1, 17, WOOD[3])
    for y in range(2, 7):
        for x in range(1, 27):
            p(x, y, OUT if y in (2, 6) and 0 < x < 27 else "#F4ECDC" if (x // 3) % 2 else "#2D6A46")
    for x in range(1, 27, 3):
        p(x, 7, "#2D6A46" if (x // 3) % 2 == 0 else "#F4ECDC")
    rect(p, 4, 15, 20, 4, OUT); rect(p, 5, 16, 18, 2, WOOD[1])
    for x in (6, 22):
        rect(p, x, 19, 1, 5, WOOD[3])
    for (tx, c) in [(6, "#C8A870"), (12, "#8A6A3A"), (18, "#5A3A22")]:
        rect(p, tx, 13, 5, 3, OUT); rect(p, tx + 1, 14, 3, 1, c)


BUILDINGS = {
    "housing": {"name": "Picker housing", "sprite": "build_housing"},
    "wetmill": {"name": "Wet mill", "sprite": "build_wetmill"},
    "drybeds": {"name": "Raised drying beds", "sprite": "build_drybeds"},
    "compost": {"name": "Compost shed", "sprite": "build_compost"},
    "shade": {"name": "Shade trees", "sprite": "build_shade"},
    "sorter": {"name": "Sorting table", "sprite": "build_sorter"},
}
for k, fn in [("housing", b_housing), ("wetmill", b_wetmill), ("drybeds", b_drybeds), ("compost", b_compost), ("shade", b_shade), ("sorter", b_sorter)]:
    add_layer("build_" + k, 28, 26, fn)

# building skins: the same six buildings redrawn in a themed palette, bought with cranes and chosen per farm
BUILD_SKINS = {
    "kyoto":   {"name": "Kyoto", "cost": 40, "note": "Cedar walls, slate tiles, maple shade and an indigo awning",
                "ramps": {"WOOD": ["#8A6448", "#6E4C36", "#563A28", "#3E2A1E", "#2A1C14"], "THATCH": ["#8A94A4", "#747E8E", "#5E6878", "#4C5462", "#3C424E", "#2C3038"],
                          "LUSH": ["#F6B070", "#E8823E", "#CC5A2C", "#A43C22", "#7A2A18", "#521A10"]},
                "map": {"#2D6A46": "#2A3A6A", "#A8B8C4": "#6E9A86", "#7A8A96": "#4E7666"}},
    "fazenda": {"name": "Fazenda", "cost": 30, "note": "Whitewashed walls, terracotta roofs and a green and gold awning",
                "ramps": {"WOOD": ["#FFFFFF", "#F2EEE4", "#DCD4C4", "#9C8A70", "#6A5A44"], "THATCH": ["#F2A878", "#DA7C54", "#C0603E", "#9E4630", "#76321F", "#5A2616"]},
                "map": {"#2D6A46": "#2D7A3A", "#F4ECDC": "#F2D23A", "#A8B8C4": "#DA7C54", "#7A8A96": "#9E4630"}},
    "bamboo":  {"name": "Bamboo", "cost": 30, "note": "Bamboo frames, palm thatch and a batik awning",
                "ramps": {"WOOD": ["#ECE4A4", "#CCC474", "#A4A452", "#7A823A", "#525A2A"], "THATCH": ["#DCCC7C", "#C0AC5C", "#A49046", "#867436", "#685A2A", "#4A4220"]},
                "map": {"#2D6A46": "#A8283A", "#F4ECDC": "#E8B830", "#A8B8C4": "#C0AC5C", "#7A8A96": "#867436"}},
    "snow":    {"name": "Snowfall", "cost": 50, "note": "Every roof under fresh snow", "snow": True, "ramps": {}, "map": {}},
    "gold":    {"name": "Beju gold", "cost": 80, "note": "Cream and gold trim, fit for the crane", "ramps": {
                "WOOD": ["#FFF6DA", "#F2DEA0", "#E2C070", "#B88E34", "#7A5C1C"], "THATCH": ["#FFF2A8", "#F4D466", "#E8BC34", "#CC9C22", "#A87C18", "#7A5A10"]},
                "map": {"#2D6A46": "#E8B830", "#F4ECDC": "#FFFFFF", "#A8B8C4": "#F4D466", "#7A8A96": "#CC9C22"}},
    # origin styles, earned at farm level 5 (Mogiana, Toba and Osaka earn Fazenda, Bamboo and Kyoto)
    "cafetero": {"name": "Cafetero", "cost": 35, "origin": "huila", "note": "Huila's whitewashed walls with bright yellow, blue and red doors",
                 "ramps": {"WOOD": ["#FFFFFF", "#F4F0E6", "#E0D8C8", "#A89878", "#6E604A"], "THATCH": ["#E88A5C", "#D06A40", "#B4502E", "#923C22", "#702C18", "#541E10"]},
                 "map": {"#2D6A46": "#2A5AA8", "#F4ECDC": "#F2D23A", "#A8B8C4": "#D8302C", "#7A8A96": "#A8241E"}},
    "highland": {"name": "Highland", "cost": 35, "origin": "gedeo", "note": "Gedeo's red-earth walls, grass thatch and a green, yellow and red awning",
                 "ramps": {"WOOD": ["#D8946A", "#C07850", "#A0603C", "#7C4A2C", "#56321E"], "THATCH": ["#E6D488", "#CCB86A", "#B09C52", "#928040", "#746430", "#564A24"]},
                 "map": {"#2D6A46": "#3E8A3A", "#F4ECDC": "#F2C42C", "#A8B8C4": "#C8302C", "#7A8A96": "#8A2420"}},
    "tico": {"name": "Tico", "cost": 35, "origin": "turrialba", "note": "Turrialba's pastel walls, green tin roofs and painted-cart trim",
             "ramps": {"WOOD": ["#F8E8F0", "#ECCCDC", "#D8A8C0", "#A87890", "#704E60"], "THATCH": ["#A8D8A0", "#84C07C", "#62A45C", "#4A8446", "#366434", "#264824"]},
             "map": {"#2D6A46": "#E8602A", "#F4ECDC": "#F8E070", "#A8B8C4": "#62A45C", "#7A8A96": "#366434"}},
}
# ---------------- monthly season themes: one palette and one motif each, drawn into a full set of season cosmetics ----------------
# Each theme gives: a picker and farmer hat colourway, a building style, a farm decoration, an 80 px character background and a nameplate charm.
def shade(h, f):
    r, g, b, _ = hx(h)
    if f >= 0:
        r, g, b = r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f
    else:
        r, g, b = r * (1 + f), g * (1 + f), b * (1 + f)
    return "#%02X%02X%02X" % (int(r), int(g), int(b))


def ramp(base, n):   # light to dark around a base colour
    steps = [0.45, 0.2, 0, -0.22, -0.42, -0.58][:n] if n == 6 else [0.4, 0.15, 0, -0.25, -0.48]
    return [shade(base, s) for s in steps]


MOTIFS = {   # 7x7: a main colour, b dark, c accent
    "maple":   ["...a...", ".a.a.a.", "aaaaaaa", ".aaaaa.", "..aaa..", "...b...", "...b..."],
    "light":   ["...b...", "..bab..", ".baaab.", ".bacab.", ".baaab.", "..bab..", "...b..."],
    "pine":    ["...a...", "..aaa..", ".aaaaa.", "..aaa..", ".aaaaa.", "aaaaaaa", "...b..."],
    "plum":    ["..a.a..", ".aaaaa.", "aaacaaa", ".aaaaa.", "..a.a..", ".......", "......."],
    "peach":   [".aa.aa.", "aaaaaaa", "aaacaaa", ".aaaaa.", "..aaa..", "...a...", "......."],
    "petal":   ["...a...", "..aaa..", ".aacaa.", "aaaaaaa", ".aa.aa.", ".a...a.", "......."],
    "carp":    [".......", "b.aaa..", "bbaaaa.", "baaacab", "bbaaaa.", "b.aaa..", "......."],
    "drop":    ["...a...", "..aaa..", "..aaa..", ".aaaca.", ".aaaaa.", "..aaa..", "......."],
    "star":    ["...a...", "...a...", "aaaaaaa", ".aaaaa.", "..aaa..", ".aa.aa.", ".a...a."],
    "burst":   ["a..a..a", ".a.a.a.", "..aca..", "aacccaa", "..aca..", ".a.a.a.", "a..a..a"],
    "moon":    ["..aaa..", ".aaa...", "aaa....", "aaa....", "aaa....", ".aaa...", "..aaa.."],
    "lantern": ["..bbb..", ".aaaaa.", "aacaaca", "aaaaaaa", "aacaaca", ".aaaaa.", "..bbb.."],
}
SEASON_THEMES = {   # month -> theme. main: the motif and canopy colour; deep: roofs and trim; sky: top and bottom of the background
    1:  {"id": "shogatsu", "name": "Shōgatsu", "title": "New Year Grower", "motif": "pine", "main": "#3E8A4A", "accent": "#E8B830", "deep": "#B8282E", "sky": ["#F8D8B0", "#FFF4E2"], "ground": "#DCC28E", "deco": "pole", "rule": "Daily tasks pay double coins."},
    2:  {"id": "ume", "name": "Ume", "title": "Plum Blossom Grower", "motif": "plum", "main": "#E05A86", "accent": "#F8E070", "deep": "#6A3A4E", "sky": ["#E6D8EC", "#FBF2F6"], "ground": "#B8B49A", "deco": "tree", "rule": "Natural lots sell for 15% more."},
    3:  {"id": "hina", "name": "Hina", "title": "Peach Festival Grower", "motif": "peach", "main": "#F49AB0", "accent": "#F8F0A0", "deep": "#8A3A58", "sky": ["#FCE0E6", "#FFF6F2"], "ground": "#BCC88A", "deco": "tree", "rule": "Supply contracts pay 10% more."},
    4:  {"id": "sakura", "name": "Sakura", "title": "Cherry Blossom Grower", "motif": "petal", "main": "#F6B4CA", "accent": "#FFF0F4", "deep": "#C86C8E", "sky": ["#CCE6F6", "#FCEEF4"], "ground": "#A8C878", "deco": "tree", "rule": "Every farm grows 10% faster."},
    5:  {"id": "koinobori", "name": "Koinobori", "title": "Carp Streamer Grower", "motif": "carp", "main": "#E8503A", "accent": "#FFFFFF", "deep": "#2A4C9C", "sky": ["#A8DAF4", "#E8F6FC"], "ground": "#8CC060", "deco": "pole", "rule": "Washed lots sell for 15% more."},
    6:  {"id": "tsuyu", "name": "Tsuyu", "title": "Rainy Season Grower", "motif": "drop", "main": "#6A8AE0", "accent": "#C8E0FF", "deep": "#4A3A8A", "sky": ["#A8B4C4", "#DCE4EC"], "ground": "#7AA05A", "deco": "tree", "rule": "Rainy weather no longer slows growth."},
    7:  {"id": "tanabata", "name": "Tanabata", "title": "Star Festival Grower", "motif": "star", "main": "#F2D24A", "accent": "#FFFFFF", "deep": "#2A3470", "sky": ["#1E2A5A", "#4A4A8A"], "ground": "#4A6A3A", "deco": "pole", "rule": "Golden bushes appear 25% more often."},
    8:  {"id": "hanabi", "name": "Hanabi", "title": "Fireworks Grower", "motif": "burst", "main": "#F27A4A", "accent": "#FFF0A0", "deep": "#3A2A5A", "sky": ["#141A3A", "#3A2A5A"], "ground": "#3E5A34", "deco": "pole", "rule": "Golden bushes pay 25% more."},
    9:  {"id": "tsukimi", "name": "Tsukimi", "title": "Moon Viewing Grower", "motif": "moon", "main": "#F8E8A0", "accent": "#FFFFFF", "deep": "#3A3A6A", "sky": ["#2A305A", "#6A6A9A"], "ground": "#A89A62", "deco": "pole", "rule": "Each lot you cup gives 2 season stars."},
    10: {"id": "akimatsuri", "name": "Aki matsuri", "title": "Autumn Festival Grower", "motif": "lantern", "main": "#E8602A", "accent": "#F8E070", "deep": "#6A2A1A", "sky": ["#F8C890", "#FCEAD2"], "ground": "#C8A45C", "deco": "pole", "rule": "Picking by hand brings in 20% more cherries."},
    11: {"id": "momiji", "name": "Momiji", "title": "Maple Harvester", "motif": "maple", "main": "#D8402E", "accent": "#F8B040", "deep": "#7A2A1E", "sky": ["#F6D2A8", "#FCEEDC"], "ground": "#C8A060", "deco": "tree", "rule": "Honey lots sell for 15% more."},
    12: {"id": "lights", "name": "Winter lights", "title": "Winter Lights Grower", "motif": "light", "main": "#F8D860", "accent": "#FFFFFF", "deep": "#2A4A6A", "sky": ["#1E2E4A", "#4A5E7A"], "ground": "#E2EAF2", "deco": "tree", "rule": "Golden bushes stay for 45 seconds."},
}
for _m, _t in SEASON_THEMES.items():
    HATS["s_" + _t["id"]] = [shade(_t["main"], 0.3), _t["main"], shade(_t["main"], -0.4)]
    BUILD_SKINS["s_" + _t["id"]] = {"name": _t["name"], "cost": 0, "season": _t["id"], "note": _t["name"] + " season style", "snow": _t["id"] in ("lights",),
                                    "ramps": {"THATCH": ramp(_t["deep"], 6)},
                                    "map": {"#2D6A46": _t["main"], "#F4ECDC": _t["accent"]}}


_SHADOW = "#2A2A0850"
for sk, spec in BUILD_SKINS.items():
    saved = {k: globals()[k] for k in spec["ramps"]}
    globals().update(spec["ramps"])
    for k, fn in [("housing", b_housing), ("wetmill", b_wetmill), ("drybeds", b_drybeds), ("compost", b_compost), ("shade", b_shade), ("sorter", b_sorter)]:
        canvas = {}
        fn(lambda x, y, c: canvas.__setitem__((int(x), int(y)), spec["map"].get(c, c)) if 0 <= int(x) < 28 and 0 <= int(y) < 26 else None)
        if spec.get("snow"):   # a white cap on the first solid pixel of each column
            for x in range(28):
                ys = [y for y in range(20) if canvas.get((x, y)) not in (None, _SHADOW)]
                if ys:
                    canvas[(x, ys[0])] = "#FFFFFF"
                    if (x, ys[0] + 1) in canvas and k != "drybeds":
                        canvas[(x, ys[0] + 1)] = "#E4EEF6"
        add_layer("build_%s_%s" % (k, sk), 28, 26, lambda p, cv=canvas: [p(x, y, c) for (x, y), c in cv.items()])
    globals().update(saved)
BSKIN_INFO = {k: {"name": v["name"], "cost": v["cost"], "note": v["note"], "season": v.get("season"), "origin": v.get("origin")} for k, v in BUILD_SKINS.items()}


def d_bench(p):
    for x in range(1, 15):
        p(x, 9, "#2A2A0850")
    rect(p, 1, 1, 14, 2, OUT); rect(p, 2, 1, 12, 1, WOOD[0])
    rect(p, 1, 4, 14, 3, OUT); rect(p, 2, 5, 12, 1, WOOD[1])
    for x in (2, 13):
        rect(p, x, 3, 1, 6, WOOD[4])


def d_lantern(p):
    p(3, 13, "#2A2A0850"); p(4, 13, "#2A2A0850"); p(2, 13, "#2A2A0850")
    rect(p, 3, 9, 1, 4, OUT)
    rect(p, 1, 1, 5, 1, OUT); rect(p, 0, 2, 7, 6, OUT); rect(p, 1, 3, 5, 4, "#E84A3A")
    rect(p, 2, 3, 3, 4, "#F8C870"); p(3, 4, "#FFF4C0")
    rect(p, 1, 8, 5, 1, OUT)


def d_flag(p):
    rect(p, 1, 0, 1, 22, OUT); p(1, 0, "#F2C04A")
    rect(p, 2, 2, 10, 8, OUT); rect(p, 2, 3, 9, 6, "#2D6A46")
    for (x, y) in [(5, 5), (6, 4), (7, 5), (8, 4), (6, 6), (7, 6), (6, 7)]:
        p(x, y, "#F8F4EC")
    for x in range(0, 4):
        p(x, 21, "#2A2A0850")


def d_bunting(p):
    cols = ["#D8302C", "#F2C04A", "#2D6A46", "#4A8AB8"]
    for x in range(24):
        p(x, 1 + (1 if 6 <= x % 12 < 12 else 0) * 0, OUT)
    for i in range(4):
        c = cols[i]
        for y in range(5):
            for x in range(i * 6 + y // 2 + 1, i * 6 + 6 - y // 2):
                p(x, 2 + y, c)


def d_planter(p):
    for x in range(2, 10):
        p(x, 11, "#2A2A0850")
    rect(p, 2, 6, 8, 5, OUT); rect(p, 3, 7, 6, 3, "#C8603A"); rect(p, 3, 7, 6, 1, "#E07C50")
    for (x, y, c) in [(3, 3, "#F06A98"), (6, 2, "#F2C42C"), (8, 4, "#F8F4EC"), (5, 4, "#E83A30")]:
        p(x, y, c); p(x + 1, y, c); p(x, y + 1, c)
    for (x, y) in [(4, 5), (6, 5), (7, 4), (8, 5), (5, 3)]:
        p(x, y, LUSH[2])


def d_cart(p):
    for x in range(1, 21):
        p(x, 15, "#2A2A0850")
    rect(p, 10, 2, 1, 7, OUT)
    for y in range(0, 3):
        for x in range(4 - y * 2 + 3, 17 + y * 2 - 3):
            p(x, y, OUT if y == 2 or x in (4 - y * 2 + 3, 16 + y * 2 - 3) else "#D8302C" if (x // 2) % 2 else "#F8F4EC")
    rect(p, 2, 7, 17, 6, OUT); rect(p, 3, 8, 15, 4, WOOD[1]); rect(p, 3, 8, 15, 1, "#2D6A46")
    for (x, c) in [(5, "#F8F4EC"), (8, "#F8F4EC"), (13, "#8A5A30")]:
        rect(p, x, 5, 2, 3, OUT); p(x, 6, c); p(x + 1, 6, c)
    for wx in (4, 15):
        rect(p, wx, 12, 3, 3, OUT); p(wx + 1, 13, "#8A9AA6")


def d_bandana(p):
    rect(p, 2, 3, 8, 3, OUT); rect(p, 3, 4, 6, 1, "#D8302C")
    for y in range(6, 9):
        for x in range(4 + (y - 6), 8 - (y - 6)):
            p(x, y, "#D8302C")
    p(5, 4, "#F8F4EC"); p(7, 4, "#F8F4EC")


for k, fn, w, h in [("bench", d_bench, 16, 10), ("lantern", d_lantern, 7, 14), ("flag", d_flag, 12, 22), ("bunting", d_bunting, 24, 8),
                    ("planter", d_planter, 12, 12), ("cart", d_cart, 22, 16), ("bandana", d_bandana, 12, 10)]:
    add_layer("deco_" + k, w, h, fn)


def motif_at(p, x0, y0, t, scale=1):
    cols = {"a": t["main"], "b": shade(t["deep"], -0.2), "c": t["accent"]}
    for y, row in enumerate(MOTIFS[t["motif"]]):
        for x, ch in enumerate(row):
            if ch in cols:
                for dy in range(scale):
                    for dx in range(scale):
                        p(x0 + x * scale + dx, y0 + y * scale + dy, cols[ch])


def season_deco(t):   # 16x20: a blossom or leaf tree, or a bamboo pole with a banner
    def draw(p):
        for x in range(3, 13):
            p(x, 19, "#2A2A0850")
        if t["deco"] == "tree":
            rect(p, 7, 11, 2, 8, OUT); rect(p, 7, 11, 1, 8, WOOD[3])
            rng = random.Random(t["id"])
            can = ramp(t["main"], 5)
            for y in range(1, 13):
                for x in range(1, 15):
                    d = ((x - 7.5) / 7) ** 2 + ((y - 6.5) / 6) ** 2
                    if d < 1:
                        p(x, y, OUT if d > 0.8 else can[min(4, int(d * 3 + (y > 8) + rng.random() * 0.8))])
            for _ in range(7):
                x, y = rng.randint(3, 12), rng.randint(2, 10)
                p(x, y, t["accent"])
        else:
            rect(p, 2, 0, 2, 19, OUT); rect(p, 2, 0, 1, 19, "#9CB860")
            for y in (5, 11, 16):
                p(2, y, "#5E7A2C"); p(3, y, "#5E7A2C")
            rect(p, 4, 1, 11, 11, OUT); rect(p, 5, 2, 9, 9, t["deep"])
            motif_at(p, 6, 3, t)
    return draw


def season_bg(t):   # 80x80 backdrop behind the farmer: sky, falling motifs, a hill and ground
    def draw(p):
        top, bot = hx(t["sky"][0]), hx(t["sky"][1])
        for y in range(80):
            f = min(7, y // 8) / 7   # eight bands, so the palette stays small
            c = "#%02X%02X%02X" % tuple(int(top[i] + (bot[i] - top[i]) * f) for i in range(3))
            for x in range(80):
                p(x, y, c)
        rng = random.Random("bg" + t["id"])
        for _ in range(9):
            motif_at(p, rng.randint(0, 72), rng.randint(0, 46), t)
        g = ramp(t["ground"], 5)
        for x in range(80):
            hill = int(56 + 5 * math.sin(x / 13 + len(t["id"])))
            for y in range(hill, 80):
                p(x, y, g[1] if y < hill + 2 else g[2] if y < 66 else g[3])
    return draw


def season_charm(t):   # 9x9 round tag pinned to the nameplate
    def draw(p):
        for y in range(9):
            for x in range(9):
                d = (x - 4) ** 2 + (y - 4) ** 2
                if d <= 20:
                    p(x, y, OUT if d > 13 else "#FFF8EC")
        motif_at(p, 1, 1, t)
    return draw


SEASON_INFO = {}
for _m, _t in SEASON_THEMES.items():
    add_layer("deco_s_" + _t["id"], 16, 20, season_deco(_t))
    add_layer("sbg_" + _t["id"], 80, 80, season_bg(_t))
    add_layer("charm_" + _t["id"], 9, 9, season_charm(_t))
    SEASON_INFO[_m] = {k: _t[k] for k in ("id", "name", "title", "main", "accent", "deep", "rule")}


# ---------------- the Golden Crane prestige perk: a gold Beju sign on every farm and a red-crowned crane flying over ----------------
def perk_sign(p):
    for x in range(4, 16):
        p(x, 19, "#2A2A0850")
    rect(p, 9, 10, 2, 9, OUT); rect(p, 9, 10, 1, 9, WOOD[2])
    rect(p, 1, 0, 18, 11, OUT); rect(p, 2, 1, 16, 9, "#E8B830"); rect(p, 2, 1, 16, 1, "#FFF2A8"); rect(p, 2, 9, 16, 1, "#A87818")
    for (x, y) in [(6, 4), (7, 3), (8, 4), (9, 5), (10, 5), (11, 4), (12, 3), (13, 4), (9, 6), (10, 6), (9, 7)]:
        p(x, y, "#FFFFFF")
    p(10, 4, "#D8302C")


def crane_fly(f):
    def draw(p):
        up = f == 0
        for x in range(2, 11):
            p(x, 3, "#FFFFFF")
        p(11, 2, "#FFFFFF"); p(12, 2, "#D8302C"); p(12, 1, "#2A2A2A"); p(1, 3, "#2A2A2A"); p(0, 4, "#2A2A2A")
        for i, x in enumerate(range(4, 9)):
            y = 2 - (i if i < 3 else 4 - i) if up else 4 + (i if i < 3 else 4 - i)
            p(x, y, "#FFFFFF"); p(x, y + (1 if up else -1), "#F2F2F2")
        p(4 if up else 4, 0 if up else 6, "#2A2A2A")
    return draw


add_layer("perk_sign", 20, 20, perk_sign)
for _f in (0, 1):
    add_layer("crane_fly_%d" % _f, 13, 7, crane_fly(_f))


def board(p):
    for x in (4, 19):
        rect(p, x, 14, 2, 9, WOOD[3])
    rect(p, 1, 2, 22, 14, OUT); rect(p, 2, 3, 20, 12, WOOD[1])
    for (x, y, c) in [(3, 4, "#F8F4EC"), (10, 5, "#FFF0B0"), (16, 4, "#F8F4EC")]:
        rect(p, x, y, 5, 7, OUT); rect(p, x + 1, y + 1, 3, 5, c); p(x + 2, y, "#D8302C")
        p(x + 1, y + 2, "#9A8A70"); p(x + 2, y + 2, "#9A8A70"); p(x + 1, y + 4, "#9A8A70")


icon("board", board)
add_grid("i_trophy", ["............", "..oooooooo..", "ooyyyyyyyyoo", "o.oyyyywyo.o", "o.oyyyyyyo.o", ".ooyyyyyyoo.", "...oyyyyo...", "....oyyo....", ".....oo.....", "....oyyo....", "...oooooo...", "...obbbbo..."],
         {"o": OUT, "y": "#F2C04A", "w": "#FFF4C0", "b": WOOD[2]})

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


# ---------------- character models: non-human farmers bought with cranes ----------------
# Each one is a drawn head on the farmer's body, so outfits (shirt and trousers colours) still apply on top.
# Head keys: f fur, F fur shade, l fur light, m muzzle/face, n nose, e eye, w shine, x/y/z accents. Body keys follow WORK.
def _outline(px, w, h):
    out = dict(px)
    for (x, y) in list(px):
        for (dx, dy) in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            q = (x + dx, y + dy)
            if 0 <= q[0] < w and 0 <= q[1] < h and q not in px:
                out[q] = "O"
    return out


def _ell(px, cx, cy, rx, ry, k, only=None):
    for y in range(12):
        for x in range(16):
            if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 and (only is None or (x, y) in only):
                px[(x, y)] = k


def char_head(sp, view):
    px = {}
    side = view == "side"
    cx = 7 if side else 7.5
    rx, ry = (4.3, 3.9) if side else (sp.get("rx", 4.6), 3.9)
    ears = sp.get("ears")
    # ears first, so the head paints over their base
    if ears in ("point", "tall"):
        tall = ears == "tall"
        for ex, d in ([(5, -1)] if side else [(3, 1), (12, -1)]):
            top = 0 if tall else 1
            for y in range(top, 4):
                span = (y - top) // (1 if tall else 2)
                for i in range(span + 1):
                    px[(ex + d * i, y)] = "f"
            px[(ex + d, 3)] = sp.get("inner", "m")
            if tall:
                px[(ex + d, 2)] = sp.get("inner", "m")
            if sp.get("tips"):
                px[(ex, top)] = sp["tips"]
    elif ears == "round":
        for (ex, ey) in ([(5, 3)] if side else [(3.6, 3.4), (11.4, 3.4)]):
            _ell(px, ex, ey, 1.6, 1.5, "F")
            px[(int(round(ex)), int(round(ey)))] = sp.get("inner", "F")
    elif ears == "tiny":
        for ex in ([5] if side else [4, 11]):
            px[(ex, 3)] = "F"; px[(ex, 2)] = "F"
    if sp.get("mane"):   # a ruff of fur framing the face
        _ell(px, cx, 7.4, rx + 1.4, 4.4, "F")
    _ell(px, cx, 7, rx, ry, "f")
    shape = sp.get("shape")
    if shape == "box":   # flatter, squarer head
        for y in range(4, 11):
            for x in range(int(cx - rx + 0.5), int(cx + rx + 0.5) + 1):
                px[(x, y)] = "f"
    if shape == "dome":   # robot: a rounded box with an antenna
        for y in range(3, 11):
            for x in range(3, 13) if not side else range(3, 12):
                px[(x, y)] = "f"
        ax = 7 if not side else 6
        px[(ax, 1)] = "y"; px[(ax, 2)] = "F"
    for (x, y) in list(px):   # shade the lower right of the head
        if px[(x, y)] == "f" and (x >= cx + rx - 1.2 or y >= 10):
            px[(x, y)] = "F"
    for (x, y) in [(int(cx - 2), 4), (int(cx - 1), 4)]:
        if px.get((x, y)) == "f":
            px[(x, y)] = "l"
    if sp.get("crown") and view != "up":
        for x in range(int(cx) - 1, int(cx) + 2):
            px[(x, 3)] = "y"; px[(x, 4)] = "y"
    if sp.get("crown") and view == "up":
        for x in range(int(cx) - 1, int(cx) + 2):
            px[(x, 3)] = "y"
    if view == "up":
        if sp.get("back"):
            sp["back"](px)
        return _rows(_outline(px, 16, 12))
    m = sp.get("muzzle")
    if side:
        e = (9, 7)
        if m in ("mid", "long", "blunt", "flat", "beak"):
            reach = {"long": 3, "mid": 2, "blunt": 2, "flat": 1, "beak": 3}[m]
            for x in range(10, 11 + reach):
                for y in range(8, 11 if m != "beak" else 10):
                    if m == "long" and y == 10 and x > 11:
                        continue
                    px[(x, y)] = "x" if m == "beak" else "m"
            if m != "beak":
                px[(10 + reach, 8)] = "n"
            if m == "blunt":
                for y in range(7, 11):
                    px[(12, y)] = "m"
                px[(12, 8)] = "n"
        if sp.get("face"):
            for y in range(6, 11):
                for x in range(8, 12):
                    if (x, y) in px and px[(x, y)] in "fFl":
                        px[(x, y)] = "m"
        if m == "visor":
            for x in range(8, 12):
                px[(x, 6)] = "x"; px[(x, 7)] = "x"
            px[(10, 7)] = "y"; e = None
        if e:
            px[e] = "e"
        if sp.get("mark") == "mask" and e:
            px[(8, 7)] = "z"; px[(8, 6)] = "z"
        if sp.get("mark") == "stripe" and e:
            px[(8, 8)] = "z"; px[(8, 7)] = "z"
        if sp.get("mark") == "spect" and e:
            px[(10, 6)] = "m"; px[(8, 7)] = "m"
        if sp.get("mark") == "flick":
            px[(10, 6)] = "x"; px[(11, 6)] = "x"
        if sp.get("cheeks"):
            for y in range(6, 10):
                px[(4, y)] = "F"
        return _rows(_outline(px, 16, 12))
    # facing the viewer
    eyes = [(5, 7), (10, 7)]
    if sp.get("face"):   # a lighter face disc (sloth, orangutan, gelada)
        _ell(px, 7.5, 7.6, 3.2, 2.9, "m", only=set(px))
    if m == "mid":
        _ell(px, 7.5, 9.4, 2.6, 1.5, "m")
        px[(7, 8)] = "n"; px[(8, 8)] = "n"
    elif m == "long":
        for (x, y) in [(6, 9), (7, 9), (8, 9), (9, 9), (7, 10), (8, 10)]:
            px[(x, y)] = "m"
        for x in (3, 4, 11, 12):
            px[(x, 9)] = "m"
        px[(7, 9)] = "n"; px[(8, 9)] = "n"
    elif m == "blunt":
        for y in (8, 9, 10):
            for x in range(5, 11):
                px[(x, y)] = "m"
        for x in (6, 9):
            px[(x, 8)] = "n"
    elif m == "flat":
        _ell(px, 7.5, 9.3, 1.8, 1.2, "m")
        px[(7, 9)] = "n"; px[(8, 9)] = "n"
    elif m == "beak":   # a short olive beak over a black throat
        for (x, y) in [(5, 10), (6, 10), (9, 10), (10, 10), (6, 9), (9, 9)]:
            px[(x, y)] = "z"
        for (x, y) in [(7, 8), (8, 8), (7, 9), (8, 9), (7, 10), (8, 10)]:
            px[(x, y)] = "x"
    elif m == "visor":
        for x in range(4, 12):
            px[(x, 6)] = "x"; px[(x, 7)] = "x"
        eyes = []
        px[(5, 7)] = "y"; px[(10, 7)] = "y"; px[(6, 7)] = "y"; px[(9, 7)] = "y"
        for x in (6, 7, 8, 9):
            px[(x, 9)] = "z"
    mk = sp.get("mark")
    if mk == "mask":
        for x in range(3, 13):
            if px.get((x, 7)) in ("f", "F", "l"):
                px[(x, 7)] = "z"
        for (x, y) in [(4, 8), (11, 8)]:
            px[(x, y)] = "z"
    if mk == "spect":   # cream rings arching over the eyes
        for (ex, ey) in eyes:
            for (dx, dy) in ((-1, -1), (0, -1), (1, -1), (-1, 0), (1, 0)):
                px[(ex + dx, ey + dy)] = "m"
    if mk == "stripe":
        for (ex, ey), d in zip(eyes, (-1, 1)):
            px[(ex + d, ey)] = "z"; px[(ex + d, ey + 1)] = "z"; px[(ex + 2 * d, ey + 1)] = "z"
    if mk == "flick":
        for (ex, ey), d in zip(eyes, (-1, 1)):
            px[(ex + d, ey - 1)] = "x"; px[(ex + 2 * d, ey - 1)] = "x"
    if sp.get("cheeks"):   # orangutan cheek pads
        for y in range(6, 10):
            px[(2, y)] = "F"; px[(13, y)] = "F"
    for (ex, ey) in eyes:
        px[(ex, ey)] = "e"
    if sp.get("blush"):
        px[(4, 9)] = sp["blush"]; px[(11, 9)] = sp["blush"]
    return _rows(_outline(px, 16, 12))


def _rows(px):
    return ["".join(px.get((x, y), ".") for x in range(16)) for y in range(12)]


def _tail(rows, kind):
    """Add a tail to a side-view frame (the farmer faces right, so it goes on the left)."""
    if not kind:
        return rows
    g = {(x, y): ch for y, r in enumerate(rows) for x, ch in enumerate(r) if ch != "."}
    add = {}
    shapes = {
        "curl": [(3, 14), (2, 14), (2, 13), (3, 12), (4, 12), (2, 15), (3, 15)],
        "bushy": [(3, 15), (2, 15), (3, 16), (2, 16), (1, 16), (2, 17), (1, 17), (0, 17), (1, 18), (2, 18), (0, 18), (1, 19)],
        "ring": [(3, 16), (2, 16), (2, 17), (1, 17), (1, 18), (2, 18), (1, 19)],
        "thin": [(3, 17), (2, 18), (2, 19), (1, 20), (1, 21)],
    }
    for i, q in enumerate(shapes[kind]):
        if q not in g:
            add[q] = "t" if not (kind == "ring" and i % 2) and not (kind == "bushy" and i >= 10) else "u"
    merged = dict(g); merged.update(add)
    for (x, y) in list(add):
        for (dx, dy) in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            q = (x + dx, y + dy)
            if 0 <= q[0] < 16 and 0 <= q[1] < len(rows) and q not in merged:
                merged[q] = "O"
    return ["".join(merged.get((x, y), ".") for x in range(16)) for y in range(len(rows))]


CHARS = {
    # id: name, home, crane price, head spec, palette (fur, shade, light, muzzle, nose, eye, accents), hands, feet, tail
    "shiba":    ("Shiba", "the farm", 40, {"ears": "point", "muzzle": "mid", "inner": "m", "blush": None},
                 {"f": "#E89048", "F": "#C46C30", "l": "#F8B070", "m": "#FFF4E4", "n": "#2E1E18", "e": "#2E1E18"}, ("#FFF4E4", "#E8D6BC"), "#C46C30", "curl", "#E89048", "#FFF4E4"),
    "capybara": ("Capybara", "Brazil", 40, {"ears": "tiny", "muzzle": "blunt", "shape": "box", "rx": 4.8},
                 {"f": "#B07A4C", "F": "#8A5A34", "l": "#C8966A", "m": "#9A6840", "n": "#3A2618", "e": "#2E1E18"}, ("#9A6840", "#8A5A34"), "#5A3A22", None, "#B07A4C", "#8A5A34"),
    "bear":     ("Spectacled bear", "Colombia", 50, {"ears": "round", "muzzle": "flat", "mark": "spect"},
                 {"f": "#3A2E2A", "F": "#241C1A", "l": "#54443E", "m": "#E8D2A0", "n": "#140E0C", "e": "#140E0C"}, ("#3A2E2A", "#241C1A"), "#241C1A", None, "#3A2E2A", "#241C1A"),
    "gelada":   ("Gelada", "Ethiopia", 50, {"ears": None, "muzzle": "flat", "mane": True, "face": True},
                 {"f": "#A87A4C", "F": "#7A5434", "l": "#C49A6A", "m": "#4A3428", "n": "#2A1C14", "e": "#F2C42C"}, ("#4A3428", "#3A281E"), "#3A281E", "thin", "#A87A4C", "#7A5434"),
    "orangutan": ("Orangutan", "Sumatra", 60, {"ears": None, "muzzle": "flat", "face": True, "cheeks": True},
                 {"f": "#D8662C", "F": "#A84A1C", "l": "#F08A44", "m": "#8A5A3A", "n": "#3A2216", "e": "#1E120C"}, ("#D8662C", "#A84A1C"), "#8A5A3A", None, "#D8662C", "#A84A1C"),
    "sloth":    ("Sloth", "Costa Rica", 60, {"ears": None, "muzzle": "flat", "face": True, "mark": "stripe"},
                 {"f": "#9A8466", "F": "#76644C", "l": "#B8A484", "m": "#EADCC0", "n": "#2E241C", "e": "#2E241C", "z": "#4A3A2C"}, ("#9A8466", "#76644C"), "#4A3A2C", None, "#9A8466", "#76644C"),
    "tanuki":   ("Tanuki", "Japan", 80, {"ears": "round", "muzzle": "mid", "mark": "mask"},
                 {"f": "#9A7A5A", "F": "#6E5440", "l": "#B8987A", "m": "#F2E6D2", "n": "#1E1612", "e": "#F8F0E0", "z": "#2E241E"}, ("#2E241E", "#1E1612"), "#2E241E", "ring", "#9A7A5A", "#2E241E"),
    "kitsune":  ("Kitsune", "Osaka", 100, {"ears": "tall", "muzzle": "long", "mark": "flick", "inner": "x", "tips": "x"},
                 {"f": "#FBF6EA", "F": "#DCD2BE", "l": "#FFFFFF", "m": "#FFFFFF", "n": "#2E1E18", "e": "#B8202C", "x": "#D8302C"}, ("#FBF6EA", "#DCD2BE"), "#D8302C", "bushy", "#FBF6EA", "#D8302C"),
    "robot":    ("Brew-bot", "the roastery", 120, {"ears": None, "muzzle": "visor", "shape": "dome"},
                 {"f": "#B8C4CC", "F": "#8A98A4", "l": "#E4ECF0", "m": "#B8C4CC", "n": "#2E3A44", "e": "#2E3A44", "x": "#2E3A44", "y": "#7AE8F0", "z": "#5A6874"}, ("#8A98A4", "#5A6874"), "#5A6874", None, "#B8C4CC", "#8A98A4"),
    "crane":    ("Tsuru", "Beju", 200, {"ears": None, "muzzle": "beak", "crown": True},
                 {"f": "#FFFFFF", "F": "#DCD8D0", "l": "#FFFFFF", "m": "#FFFFFF", "n": "#2E2A28", "e": "#1E1A18", "x": "#A8A878", "y": "#D8302C", "z": "#2E2A28"}, ("#2E2A28", "#1E1A18"), "#2E2A28", None, "#FFFFFF", "#DCD8D0"),
}
CHAR_INFO = {}
for cid, (name, home, cost, sp, hp, hands, feet, tail, tcol, tcol2) in CHARS.items():
    pal = dict(WORK)
    pal.update({"f": hp["f"], "F": hp["F"], "l": hp["l"], "m": hp["m"], "n": hp["n"], "e": hp["e"], "w": "#FFFFFF",
                "x": hp.get("x", hp["F"]), "y": hp.get("y", hp["F"]), "z": hp.get("z", hp["F"]), "t": tcol, "u": tcol2,
                "s": hands[0], "S": hands[1], "b": feet})
    down, up, sd = char_head(sp, "down"), char_head(sp, "up"), char_head(sp, "side")
    for f in range(3):
        add_grid("chr_%s_down_%d" % (cid, f), down + BODY + LEGS[f], pal)
        add_grid("chr_%s_up_%d" % (cid, f), up + BODY + LEGS[f], pal)
    for f in range(2):
        add_grid("chr_%s_side_%d" % (cid, f), _tail(sd + SIDE_BODY + SIDE_LEGS[f], tail), pal)
    CHAR_INFO[cid] = {"name": name, "from": home, "cost": cost, "aura": None}


SHRUBS = [(bx + 6 + c * 18, by + r * 17) for (bx, by) in BEDS[:3] for r in range(2) for c in range(4)]
with open(os.path.join(HERE, "sprites.json"), "w") as f:
    json.dump({"sprites": S, "shirts": SHIRTS, "shrubs": SHRUBS, "locations": LOCATIONS, "storage": STORAGE, "carry": CARRY, "hats": HATS, "buildings": BUILDINGS, "chars": CHAR_INFO, "bskins": BSKIN_INFO, "seasons": SEASON_INFO, "stampColors": STAMP_COLORS, "beds": BEDS,
               "varieties": {k: v[0] for k, v in VARIETIES.items()}}, f, separators=(",", ":"))

# sheet of non-shrub sprites
names = [n for n in S if not n.startswith("bush_") and n != "bed_open"]
x = y = rowh = 0
place = {}
for n in names:
    s = S[n]
    if x + s["w"] > 200:
        x, y, rowh = 0, y + rowh + 3, 0
    place[n] = (x, y); x += s["w"] + 3; rowh = max(rowh, s["h"])
sheet = Image.new("RGBA", (200, y + rowh), (0, 0, 0, 0))
for n, (sx, sy) in place.items():
    sheet.alpha_composite(render(S[n]), (sx, sy))
sheet.save(os.path.join(HERE, "sheet.png"))
sheet.resize((sheet.width * 4, sheet.height * 4), Image.NEAREST).save(os.path.join(HERE, "sheet@4x.png"))

# varieties chart: one row per variety, sprout -> ripe
vs = Image.new("RGBA", (5 * 22 + 4, len(VARIETIES) * 26 + 4), hx("#F4E6C6"))
for r, vid in enumerate(VARIETIES):
    for c, st in enumerate(STAGES):
        vs.alpha_composite(render(S["bush_%s_%s" % (vid, st)]), (4 + c * 22, 4 + r * 26))
vs.resize((vs.width * 4, vs.height * 4), Image.NEAREST).save(os.path.join(HERE, "varieties.png"))

# all scenes on one contact sheet, each with sample shrubs of its own varieties
order = [(l, s) for l, (_, ss) in SCENES.items() for s in ss]
cols = 4
cs = Image.new("RGBA", (cols * (W + 6) + 6, ((len(order) + cols - 1) // cols) * (H + 6) + 6), hx("#2A1E14"))
rnd = random.Random(9)
for i, (loc, s) in enumerate(order):
    sc = rendered[(loc, s)].copy()
    bedv = LOCATIONS[loc]["beds"]
    for k, (sx, sy) in enumerate(SHRUBS):
        st = "flower" if s in ("rainy", "spring") and rnd.random() < 0.5 else rnd.choice(["young", "green", "ripe", "ripe"])
        if s == "winter":
            st = rnd.choice(["sprout", "young"])
        sc.alpha_composite(render(S["bush_%s_%s" % (bedv[k // 8], st)]), (sx, sy))
    cs.alpha_composite(sc, (6 + (i % cols) * (W + 6), 6 + (i // cols) * (H + 6)))
cs.save(os.path.join(HERE, "scenes.png"))
print(len(order), "scenes,", len(S), "sprites")
