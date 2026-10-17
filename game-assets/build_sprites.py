"""Beju Farm sprite set: Game Boy Advance style (think Pokemon FireRed / Harvest Moon: Mineral Town).

Each sprite is a grid of characters; each character maps to a colour in that sprite's palette
('.' = transparent). Up to 15 colours per sprite, shading lit from the top-left, warm dark
outlines instead of black, and soft shadows (palette colours may carry alpha).
Run:  python3 game-assets/build_sprites.py
Writes sprites.json (used by the game), sheet.png and sheet@4x.png.
"""
import json, math, os, random
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
S = {}


def grid(w, h, ch="."):
    return [[ch] * w for _ in range(h)]


def add(name, g, pal):
    rws = ["".join(r) for r in g] if isinstance(g[0], list) else list(g)
    assert all(len(r) == len(rws[0]) for r in rws), (name, [len(r) for r in rws])
    used = set("".join(rws)) - {"."}
    assert used <= set(pal), (name, used - set(pal))
    S[name] = {"w": len(rws[0]), "h": len(rws), "rows": rws, "pal": pal}


def setp(g, x, y, ch):
    if 0 <= y < len(g) and 0 <= x < len(g[0]):
        g[y][x] = ch


def blob(g, cx, cy, r, ramp, outline=None, light=(-0.6, -0.8), squash=1.0):
    """A shaded ball: ramp runs light -> dark; pixels on the rim get the outline."""
    for y in range(int(cy - r - 1), int(cy + r + 2)):
        for x in range(int(cx - r - 1), int(cx + r + 2)):
            dx, dy = (x + 0.5 - cx) / r, (y + 0.5 - cy) / (r * squash)
            d = dx * dx + dy * dy
            if d > 1:
                continue
            if outline and d > 0.78:
                setp(g, x, y, outline); continue
            nz = math.sqrt(max(0, 1 - d))
            lum = -(dx * light[0] + dy * light[1]) * 0.8 + nz * 0.5
            i = int((1 - (lum + 0.35) / 1.3) * len(ramp))
            setp(g, x, y, ramp[max(0, min(len(ramp) - 1, i))])


def ellipse(g, cx, cy, rx, ry, ch):
    for y in range(int(cy - ry), int(cy + ry) + 1):
        for x in range(int(cx - rx), int(cx + rx) + 1):
            if ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1:
                setp(g, x, y, ch)


SHADOW = "#2A1A1050"

# ---------------- ground tiles ----------------
GRASS = {"a": "#A8E078", "b": "#90D068", "c": "#78C058", "d": "#60A848", "e": "#489038"}


def grass_tile(seed, extra=None):
    rnd = random.Random(seed)
    g = grid(16, 16, "b")
    for _ in range(26):
        x, y = rnd.randrange(16), rnd.randrange(16)
        g[y][x] = rnd.choice("ac")
    for (x, y) in [(3, 5), (11, 3), (7, 12), (13, 11)][: rnd.randint(2, 4)]:
        setp(g, x, y, "e"); setp(g, x - 1, y - 1, "d"); setp(g, x + 1, y - 1, "d"); setp(g, x, y - 1, "c"); setp(g, x - 1, y - 2, "a"); setp(g, x + 1, y - 2, "a")
    return g


add("grass", grass_tile(1), GRASS)
add("grass_b", grass_tile(7), GRASS)

g = grass_tile(3)
FLOW = dict(GRASS, w="#F8F8F8", r="#F06070", y="#F8D040", o="#C04050")
for (x, y, petal, center) in [(4, 4, "w", "y"), (11, 9, "r", "y"), (5, 12, "y", "o")]:
    for ddx, ddy in [(0, -1), (0, 1), (-1, 0), (1, 0)]:
        setp(g, x + ddx, y + ddy, petal)
    setp(g, x, y, center); setp(g, x + 1, y + 2, "e")
add("grass_flower", g, FLOW)

TALL = dict(GRASS, o="#285828", f="#C8F098")
TUFT = [
    "...o....",
    "..ofo.o.",
    ".ofcoofo",
    ".ocfofco",
    "ocfcocfo",
    "occdcdco",
    "oddddddo",
    ".oooooo.",
]
g = grid(16, 16, "b")
for (ox, oy) in [(0, 0), (8, 0), (4, 8), (-4, 8), (12, 8)]:
    for y, r in enumerate(TUFT):
        for x, ch in enumerate(r):
            if ch != ".":
                setp(g, ox + x, oy + y, ch)
add("tallgrass", g, TALL)

PATH = {"a": "#F8E8C0", "b": "#E8D4A0", "c": "#D8C088", "d": "#B89860", "e": "#987848"}
rnd = random.Random(4)
g = grid(16, 16, "b")
for _ in range(30):
    g[rnd.randrange(16)][rnd.randrange(16)] = rnd.choice("ac")
for (x, y) in [(3, 3), (10, 6), (6, 11), (13, 13)]:
    setp(g, x, y, "d"); setp(g, x + 1, y, "c"); setp(g, x, y - 1, "a"); setp(g, x + 1, y + 1, "e")
add("path", g, PATH)

SOIL = {"a": "#C89068", "b": "#B07850", "c": "#986040", "d": "#7A4830", "e": "#5A3420", "f": "#D8A880"}
g = grid(16, 16, "c")
for y in range(16):
    band = y % 8
    for x in range(16):
        g[y][x] = "f" if band == 0 else "a" if band == 1 else "b" if band in (2, 3) else "c" if band == 4 else "d" if band == 5 else "e" if band == 6 else "c"
rnd = random.Random(9)
for _ in range(14):
    g[rnd.randrange(16)][rnd.randrange(16)] = rnd.choice("ad")
add("soil", g, SOIL)

# ---------------- coffee shrubs ----------------
LEAF = {"a": "#A8E070", "b": "#80C850", "c": "#58A838", "d": "#3C8828", "e": "#286820", "o": "#1A4018", "s": SHADOW}


def bush(seed, size):
    rnd = random.Random(seed)
    g = grid(16, 16)
    ellipse(g, 8, 14.2, 5.5 * size + 1, 1.6, "s")
    if size < 0.5:
        for (cx, cy, r) in [(6.5, 11.5, 2.4), (9.5, 11, 2.4), (8, 9.5, 2.2)]:
            blob(g, cx, cy, r, "abcde", "o")
        return g
    k = size
    for (cx, cy, r) in [(8, 9, 5.2 * k), (4.8, 10.5, 3.6 * k), (11.2, 10.5, 3.6 * k), (8, 5.6, 3.8 * k)]:
        blob(g, cx, cy + (1 - k) * 4, r, "abcde", "o")
    for _ in range(6):
        x, y = rnd.randrange(3, 13), rnd.randrange(4, 12)
        if g[y][x] in "bc":
            g[y][x] = "d"
    return g


g = bush(1, 0.3); add("sprout", g, LEAF)
g = bush(2, 0.75); add("bush_young", g, LEAF)
BASE = bush(3, 1.0)
SPOTS = [(5, 7), (10, 6), (8, 9), (4, 11), (12, 10), (7, 12), (10, 12), (6, 4)]


def berries(spots, light, mid, dark, big):
    g = [r[:] for r in BASE]
    for (x, y) in spots:
        setp(g, x, y, mid); setp(g, x + 1, y + 1, dark)
        if big:
            setp(g, x + 1, y, mid); setp(g, x, y + 1, mid)
        setp(g, x, y, light) if big else None
        if big:
            setp(g, x + 1, y, mid)
    return g


add("bush_flower", berries(SPOTS, "w", "w", "y", False), dict(LEAF, w="#FFFFFF", y="#F0D040"))
add("bush_green", berries(SPOTS, "h", "g", "k", True), dict(LEAF, h="#E8F8A0", g="#B8D850", k="#789828"))
add("bush_ripe", berries(SPOTS, "h", "r", "q", True), dict(LEAF, h="#FFB0A0", r="#E83030", q="#901820"))

add("sparkle", [
    "...a....",
    "...a....",
    "..aba...",
    "aabwbaa.",
    "..aba...",
    "...a....",
    "...a....",
    "........"], {"a": "#F8D040", "b": "#FFF0A0", "w": "#FFFFFF"})

# ---------------- trees ----------------
TREE = {"a": "#B8E880", "b": "#90D060", "c": "#68B048", "d": "#489038", "e": "#2E7028", "o": "#1A4018",
        "t": "#A87048", "u": "#805030", "v": "#5A3820", "s": SHADOW}


def tree(size, seed):
    rnd = random.Random(seed)
    W = H = size
    g = grid(W, H)
    ellipse(g, W / 2, H - 2.5, W * 0.38, 2.2, "s")
    tw = max(2, W // 8)
    for y in range(H - int(H * 0.32), H - 2):
        for x in range(W // 2 - tw, W // 2 + tw):
            setp(g, x, y, "o" if x in (W // 2 - tw, W // 2 + tw - 1) else ("t" if x < W // 2 - tw // 2 else "u" if x < W // 2 + tw // 2 else "v"))
    r = W * 0.27
    for (fx, fy, fr) in [(0.5, 0.42, 1.25), (0.28, 0.5, 0.95), (0.72, 0.5, 0.95), (0.5, 0.25, 0.95), (0.36, 0.3, 0.75), (0.64, 0.3, 0.75)]:
        blob(g, W * fx, H * fy, r * fr, "abcde", "o")
    for _ in range(W):
        x, y = rnd.randrange(W), rnd.randrange(int(H * 0.7))
        if g[y][x] in "bc" and g[y - 1][x] in "abc":
            g[y][x] = "d"; setp(g, x, y - 1, "a")
    return g


add("tree", tree(24, 1), TREE)
add("bigtree", tree(36, 2), TREE)
g = tree(24, 3)
for (x, y) in [(7, 7), (14, 6), (10, 11), (16, 12), (6, 13)]:
    setp(g, x, y, "f"); setp(g, x + 1, y, "g"); setp(g, x, y + 1, "g")
add("fruittree", g, dict(TREE, f="#F8C060", g="#E08830"))

# ---------------- farmhouse ----------------
ROOF = {"a": "#F8E0A0", "b": "#E8C878", "c": "#D0A858", "d": "#B08840", "e": "#8A6830", "o": "#4A3020",
        "r": "#6A4428", "q": "#8A5A38"}
W = 72
g = grid(W, 30)
for y in range(30):
    inset = max(0, 12 - (y * 12) // 22)
    for x in range(inset, W - inset):
        if y < 3:
            g[y][x] = "o" if y == 0 or x in (inset, W - inset - 1) else ("q" if y == 1 else "r")
            continue
        if x in (inset, W - inset - 1) or y == 29:
            g[y][x] = "o"; continue
        shade = "abcde"[min(4, max(0, (y - 3) // 5 + (1 if x > W * 0.7 else 0)))]
        if (x * 3 + y * 7) % 13 == 0:
            shade = "d" if shade in "abc" else "e"
        if y % 6 == 2:
            shade = "e"
        g[y][x] = shade
rnd = random.Random(12)
for _ in range(220):
    x, y = rnd.randrange(W), rnd.randrange(4, 24)
    if g[y][x] in "abc" and g[y + 1][x] in "abcd":
        g[y][x] = "c" if g[y][x] in "ab" else "d"
        g[y + 1][x] = "b" if g[y + 1][x] == "a" else g[y + 1][x]
for y in (25, 26, 27, 28):
    for x in range(1, W - 1):
        if g[y][x] != "o" and g[y][x] != ".":
            g[y][x] = ("b" if (x + y) % 3 else "c") if y == 25 else ("c" if x % 2 else "d") if y == 26 else "e" if y == 27 else "o"
add("roof", g, ROOF)

WALL = {"p": "#F8F4E8", "q": "#E8DCC8", "l": "#B8A488", "w": "#B07848", "x": "#8A5A30", "y": "#603C20",
        "n": "#5868B0", "m": "#384890", "k": "#202858", "h": "#F8F8F8", "o": "#3A2418", "g": "#A8A8A0", "f": "#787870"}
g = grid(W, 28)
door = W // 2 - 7
for y in range(28):
    for x in range(W):
        if y >= 22:
            g[y][x] = "o" if y in (22, 27) else ("w" if y == 23 else "x" if x % 9 else "y")
        elif x in (0, W - 1):
            g[y][x] = "o"
        elif x % 12 in (0, 1, 2):
            g[y][x] = "w" if x % 12 == 0 else "x" if x % 12 == 1 else "y"
        else:
            g[y][x] = "l" if y in (7, 14) or x % 12 == 7 else ("p" if y < 7 else "q")
for y in range(0, 22):
    for x in range(door, door + 14):
        if x in (door, door + 13):
            g[y][x] = "o"
        elif y < 11:
            g[y][x] = "n" if x < door + 5 else "m" if x < door + 10 else "k"
            if y == 10 and (x - door) % 4 == 0:
                g[y][x] = "k"
        else:
            g[y][x] = "y" if y < 13 else "x" if x < door + 7 else "y"
for (x, y) in [(6, 3), (7, 3), (5, 4), (8, 4), (6, 5), (7, 5), (6, 6), (7, 7)]:
    g[y][door + x - 1] = "h"
add("walls", g, WALL)
add("step", [
    "..oooooooooo..",
    ".oggggggggggo.",
    "ogggggggggffgo",
    ".offffffffffo."], {"o": "#3A2418", "g": "#C0C0B8", "f": "#909088"})

# ---------------- drying bed ----------------
BED = {"w": "#C08850", "x": "#906038", "y": "#603C20", "o": "#3A2418", "r": "#D04838", "R": "#A82828", "q": "#782020", "s": "#E87858", "S": SHADOW}
rnd = random.Random(5)
g = grid(34, 20)
ellipse(g, 17, 17.5, 15, 2, "S")
for y in range(13):
    for x in range(34):
        if y in (0, 12) or x in (0, 33):
            g[y][x] = "o"
        elif y == 1 or x == 1:
            g[y][x] = "w"
        elif y == 11 or x == 32:
            g[y][x] = "y"
        else:
            g[y][x] = rnd.choice("rRRqs")
for x in (3, 4, 29, 30):
    for y in range(13, 18):
        g[y][x] = "o" if x in (3, 30) else "x"
add("drybed", g, BED)

# ---------------- koi pond ----------------
POND = {"g": "#D8D8D0", "h": "#B0B0A8", "i": "#888880", "j": "#5E5E58", "w": "#78C0F8", "v": "#58A0E8", "u": "#4080D0",
        "t": "#3068B0", "z": "#D0ECFF", "l": "#58A838", "L": "#3C8828", "p": "#F890B0"}
g = grid(52, 36)
cx, cy, rx, ry = 25.5, 17.5, 24, 16
rnd = random.Random(8)
for y in range(36):
    for x in range(52):
        d = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2
        if d <= 1:
            if d > 0.74:
                g[y][x] = rnd.choice("ghhi") if y < cy else rnd.choice("hiij")
            else:
                g[y][x] = "t" if d > 0.64 and y < cy else "u" if d > 0.5 else "v" if d > 0.2 else "w"
for (x, y, n) in [(16, 11, 6), (30, 20, 5), (22, 25, 4)]:
    for k in range(n):
        setp(g, x + k, y, "z")
blob(g, 36, 12, 3, "lL")
setp(g, 36, 11, "p"); setp(g, 37, 11, "p"); setp(g, 36, 12, "p")
add("pond", g, POND)

# ---------------- props ----------------
WOOD = {"a": "#E8C088", "b": "#C89860", "c": "#A07040", "d": "#785028", "o": "#3A2418", "s": SHADOW}
add("fence", [
    "................",
    "................",
    "......oooo......",
    ".....oabbco.....",
    ".....oabcco.....",
    "oooooobccdoooooo",
    "aaaaaabcccaaaaaa",
    "ccccccbccdcccccc",
    "oooooobccdoooooo",
    ".....oabccco....",
    "oooooobccdoooooo",
    "aaaaaabcccaaaaaa",
    "ccccccbccdcccccc",
    "oooooobccdoooooo",
    ".....oddddo.....",
    "......ssss......"], WOOD)
add("sign", [
    "................",
    ".oooooooooooooo.",
    "oaaaaaaaaaaaaabo",
    "oabbbbbbbbbbbbco",
    "oabbbbbbbbbbbbco",
    "oabbbbbbbbbbbbco",
    "obcccccccccccccо".replace("о", "o"),
    ".oooooooooooooo.",
    "......obco......",
    "......obco......",
    "......obco......",
    "......obco......",
    "......obdo......",
    ".....ssssss.....",
    "................",
    "................"], WOOD)
BASK = {"a": "#F8D890", "b": "#E0B868", "c": "#C09048", "d": "#906830", "o": "#4A3020", "s": SHADOW}
add("basket", [
    "................",
    "................",
    "................",
    "................",
    "................",
    "..oooooooooooo..",
    ".oaaaaaaaaaaaao.",
    ".obbbbbbbbbbbbo.",
    ".oooooooooooooo.",
    ".obcbcbcbcbcbco.",
    ".ocbcbcbcbcbcdo.",
    ".obcbcbcbcbcbdo.",
    "..ocdcdcdcdcdo..",
    "..oooooooooooo..",
    "..ssssssssssss..",
    "................"], BASK)
CHER = {"h": "#FFB0A0", "r": "#E83030", "q": "#A01820", "o": "#5A1010"}
add("cherrypile", [
    "................",
    "................",
    "....oo.ooo.o....",
    "..oohroohrrhoo..",
    ".orhrqrhrqrhrqo.",
    ".orrqrrrqrrrqro.",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................"], CHER)
add("sack", [
    "...oo...",
    "..oddo..",
    ".oabbco.",
    "oabhrbco",
    "obbrrbco",
    "obbbbcco",
    ".occcco.",
    "..oooo.."], {"a": "#F8D890", "b": "#E0B868", "c": "#C09048", "d": "#906830", "o": "#4A3020", "h": "#FFB0A0", "r": "#E83030"})
add("bubble_full", [
    ".oooooooooooooo.",
    "owwwwwwwwwwwwwwo",
    "owrrrwrwrwrwwrwo",
    "owrwwwrwrwrwwrwo",
    "owrrwwrwrwrwwrwo",
    "owrwwwrwrwrwwrwo",
    "owrwwwwrwwrrrrro".replace("rrrrro", "rrwrro"),
    "owwwwwwwwwwwwwwo",
    ".ooooooowwoooooo".replace("wwoooooo", "owoooooo"),
    ".......owo......",
    "........o.......",
    "................"], {"o": "#3A2418", "w": "#FFFFFF", "r": "#E03030"})

# ---------------- workers: 16 x 24, GBA overworld proportions ----------------
WORK = {"O": "#3A2820", "h": "#F8E0A0", "H": "#E0B860", "k": "#A07838", "r": "#4A3428", "s": "#F8D0B0", "S": "#E0A880",
        "e": "#302020", "c": "#7890E0", "C": "#4860C0", "D": "#304090", "p": "#486088", "P": "#304060", "b": "#6A4A30"}
HAT = [
    "................",
    ".....OOOOOO.....",
    "....OhhhhhhO....",
    "...OhhhhhhHHO...",
    "...OhhhhHHHkO...",
    ".OOOkkkkkkkkOOO.",
    "OhhhhhhhhhHHHHkO",
    ".OOOOOOOOOOOOOO.",
]
FACE_DOWN = ["...OrSssssSrO...", "...OSseSSesSO...", "...OSssssssSO...", "....OSSssSSO...."]
FACE_UP = ["...OrrrrrrrrO...", "...OrrrrrrrrO...", "...OSrrrrrrSO...", "....OSSssSSO...."]
BODY = ["...OOccccccOO...", "..OsOcCccCcOsO..", "..OsOCcccCCOsO..", "..OSOCCCCCCOSO..", "...OODDDDDDOO...", "....OppppppO....", "....OpPppPpO...."]
LEGS = [
    ["....OpPOOPpO....", "....OPPOOPPO....", "....ObbOObbO....", ".....OO..OO.....", "................"],
    ["....OpPOOPpO....", "....OPPOOObO....", "....ObbO.OO.....", ".....OO.........", "................"],
    ["....OpPOOPpO....", "....ObOOOPPO....", ".....OO.ObbO....", ".........OO.....", "................"],
]
for f in range(3):
    add("worker_down_%d" % f, HAT + FACE_DOWN + BODY + LEGS[f], WORK)
    add("worker_up_%d" % f, HAT + FACE_UP + BODY + LEGS[f], WORK)
SIDE_HAT = [
    "................",
    "......OOOOOO....",
    ".....OhhhhhhO...",
    "....OhhhhhhHHO..",
    "....OhhhhHHHkO..",
    "..OOOkkkkkkkkOO.",
    ".OhhhhhhhhhHHHkO",
    "..OOOOOOOOOOOOO.",
]
SIDE_FACE = ["....OrrSssssSO..", "....OrSsssseSO..", "....OrSssssssO..", ".....OSSsssSO..."]
SIDE_BODY = [".....OOcccOO....", "....OcCccOsO....", "....OCcccOsO....", "....OCCCCOSO....", ".....ODDDDO.....", ".....OppppO.....", ".....OpPpPO....."]
SIDE_LEGS = [
    [".....OpPOPO.....", ".....OPPOPO.....", ".....ObbObO.....", "......OO.O......", "................"],
    ["....OpPO.OPO....", "...OPPO...OPO...", "...ObbO...ObO...", "....OO.....O....", "................"],
]
for f in range(2):
    add("worker_side_%d" % f, SIDE_HAT + SIDE_FACE + SIDE_BODY + SIDE_LEGS[f], WORK)

SHIRTS = [["#7890E0", "#4860C0", "#304090"], ["#F07888", "#D04058", "#902838"], ["#78C878", "#409850", "#286838"],
          ["#F8C860", "#D89830", "#A06818"], ["#B898E8", "#8060C0", "#584090"], ["#70D0D8", "#30A0B0", "#207078"],
          ["#D8A070", "#A86838", "#784820"], ["#F8A0C0", "#E06890", "#A84068"]]


# ---------------- outputs ----------------
def rgba(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + ((int(h[6:8], 16),) if len(h) == 8 else (255,))


def render(s):
    im = Image.new("RGBA", (s["w"], s["h"]), (0, 0, 0, 0))
    for y, r in enumerate(s["rows"]):
        for x, ch in enumerate(r):
            if ch != ".":
                im.putpixel((x, y), rgba(s["pal"][ch]))
    return im


x = y = rowh = 0
place = {}
for n, s in S.items():
    if x + s["w"] > 192:
        x, y, rowh = 0, y + rowh + 3, 0
    place[n] = (x, y)
    x += s["w"] + 3
    rowh = max(rowh, s["h"])
sheet = Image.new("RGBA", (192, y + rowh), (0, 0, 0, 0))
for n, (px, py) in place.items():
    sheet.alpha_composite(render(S[n]), (px, py))
sheet.save(os.path.join(HERE, "sheet.png"))
sheet.resize((sheet.width * 4, sheet.height * 4), Image.NEAREST).save(os.path.join(HERE, "sheet@4x.png"))
with open(os.path.join(HERE, "sprites.json"), "w") as f:
    json.dump({"sprites": S, "shirts": SHIRTS, "sheet": place}, f, separators=(",", ":"))
for old in ("sheet-color.png", "sheet-color@4x.png", "sheet-classic.png", "sheet-classic@4x.png", "farm-preview-classic.png"):
    p = os.path.join(HERE, old)
    if os.path.exists(p):
        os.remove(p)
print(len(S), "sprites")
