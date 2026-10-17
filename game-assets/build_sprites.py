"""Beju Farm sprite set: Game Boy style, 4 colours per sprite, 16 px tiles.

Every sprite is a grid of palette indices ('.' = transparent, '0'-'3' = colours), so the same
art renders in the colour palettes (Game Boy Color style) or the classic 4-shade green.
Run:  python3 game-assets/build_sprites.py
Writes sprites.json (grids + palettes, used by the game), sheet-color.png, sheet-classic.png
and 4x previews of both.
"""
import json, math, os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
DMG = ["#E0F8D0", "#88C070", "#346856", "#081820"]


def grid(w, h, ch="."):
    return [[ch] * w for _ in range(h)]


def rows(g):
    return ["".join(r) for r in g]


def hand(*lines):
    assert all(len(l) == len(lines[0]) for l in lines), [len(l) for l in lines]
    return list(lines)


S = {}  # name -> {"w","h","rows","pal"}


def add(name, rws, pal):
    S[name] = {"w": len(rws[0]), "h": len(rws), "rows": rws, "pal": pal}


# ---------- background tiles (no transparency) ----------
g = grid(16, 16, "0")
for (x, y) in [(3, 4), (11, 10), (6, 13)]:
    g[y][x] = "1"; g[y - 1][x - 1] = "1"; g[y - 1][x + 1] = "1"
add("grass", rows(g), "grass")

g = grid(16, 16, "0")
for (x, y) in [(4, 5), (11, 11)]:
    for dx, dy in [(0, -1), (0, 1), (-1, 0), (1, 0)]:
        g[y + dy][x + dx] = "1"
    g[y][x] = "3"
g[13][3] = "1"; g[12][2] = "1"; g[12][4] = "1"
add("grass_flower", rows(g), "grass")

add("tallgrass", hand(
    "0000000000000000",
    "0100010001000100",
    "1210121012101210",
    "2321232123212321",
    "3332333233323332",
    "0000000000000000",
    "0010001000100010",
    "0121012101210121",
    "1232123212321232",
    "2333233323332333",
    "0000000000000000",
    "0100010001000100",
    "1210121012101210",
    "2321232123212321",
    "3332333233323332",
    "0000000000000000"), "grass")

g = grid(16, 16, "0")
for (x, y) in [(2, 3), (9, 6), (13, 2), (5, 11), (12, 13), (1, 14)]:
    g[y][x] = "2"; g[y][x + 1] = "1"; g[y - 1][x] = "1"
add("path", rows(g), "path")

g = grid(16, 16, "1")
for y in (3, 4, 9, 10, 15):
    for x in range(16):
        g[y][x] = "2" if y not in (4, 10) else "3"
for y in (0, 6, 12):
    for x in range(0, 16, 3):
        g[y][x] = "0"
add("soil", rows(g), "soil")

# ---------- coffee shrubs: one shape per stage; palettes change flowers/cherries ----------
add("sprout", hand(
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "......3..3......",
    ".....323323.....",
    ".....322223.....",
    "......3223......",
    ".......33.......",
    "................",
    "................"), "leaf")

add("bush_young", hand(
    "................",
    "................",
    "................",
    "................",
    "................",
    "......3333......",
    "....33222233....",
    "...3222222223...",
    "..322232232223..",
    "..322222222223..",
    "...3222222223...",
    "....33222233....",
    "......3333......",
    ".......33.......",
    "................",
    "................"), "leaf")

add("bush_full", hand(
    "................",
    ".....333333.....",
    "...3322222233...",
    "..322212221223..",
    ".32222222122223.",
    ".32122222222123.",
    "3222221222222223",
    "3221222223221223",
    "3222222122222223",
    ".32212222222123.",
    ".32222232222223.",
    "..322212221223..",
    "...3322222233...",
    ".....333333.....",
    ".......33.......",
    "................"), "flower")

add("sparkle", hand(
    "...3....",
    "...1....",
    "31111113",
    "...1....",
    "...3....",
    "........",
    "........",
    "........"), "spark")

# ---------- trees ----------
add("tree", hand(
    ".....333333.....",
    "...3322222233...",
    "..322221122223..",
    ".32221111222323.",
    ".32211112222223.",
    "3222111222232223",
    "3222222222222223",
    "3232222223222223",
    "3222222222222323",
    ".32222322222223.",
    ".33222222222233.",
    "..332222222233..",
    "...3333333333...",
    "......3333......",
    "......3333......",
    ".......33......."), "tree")

g = grid(32, 32)
cx, cy, r = 15.5, 13.5, 13.5
for y in range(32):
    for x in range(32):
        d = math.hypot(x - cx, y - cy) + 0.9 * math.sin(math.atan2(y - cy, x - cx) * 7)
        if d <= r:
            edge = d > r - 1.3
            light = (x - cx) + (y - cy) < -9 and d < r - 3
            tex = (x * 7 + y * 13) % 23 == 0 and d < r - 2
            g[y][x] = "3" if edge or tex else ("1" if light else "2")
for y in range(26, 32):
    for x in range(13, 19):
        g[y][x] = "3"
add("bigtree", rows(g), "tree")

# ---------- farmhouse: thatched roof + wooden walls with shoji and an indigo noren ----------
W = 64
g = grid(W, 24)
for y in range(24):
    inset = max(0, 10 - y // 2)
    for x in range(inset, W - inset):
        edge = x in (inset, W - inset - 1) or y == 0 or y == 23
        if edge:
            g[y][x] = "3"
        elif y in (1, 2) and 20 < x < 44:
            g[y][x] = "3"
        else:
            g[y][x] = "2" if (y % 4 == 3 or (x + y * 3) % 11 == 0) else ("1" if y < 14 else "2")
for x in range(2, W - 2):
    g[22][x] = "3"
add("roof", rows(g), "roof")

g = grid(W, 24)
for y in range(24):
    for x in range(W):
        if y >= 19:
            g[y][x] = "3" if y in (19, 23) or x in (0, W - 1) or x % 8 == 0 else "2"
        elif x in (0, W - 1) or x % 10 in (0, 1):
            g[y][x] = "2"
        else:
            g[y][x] = "3" if y in (6, 12) or x % 10 == 5 else "1"
dx0 = W // 2 - 6
for y in range(1, 19):
    for x in range(dx0, dx0 + 12):
        g[y][x] = "3" if y < 9 or x in (dx0, dx0 + 11) else "2"
for (x, y) in [(dx0 + 5, 3), (dx0 + 6, 3), (dx0 + 4, 4), (dx0 + 7, 4), (dx0 + 5, 5), (dx0 + 6, 5), (dx0 + 5, 6)]:
    g[y][x] = "1"  # the crane mark on the noren
add("walls", rows(g), "wall")

# ---------- drying bed on legs (cherries drying in the sun) ----------
g = grid(32, 16)
for y in range(12):
    for x in range(32):
        if y in (0, 11) or x in (0, 31):
            g[y][x] = "3"
        elif y in (1, 10) or x in (1, 30):
            g[y][x] = "2"
        else:
            g[y][x] = "1" if (x * 5 + y * 3) % 4 else "3"
for x in (2, 3, 28, 29):
    for y in range(12, 16):
        g[y][x] = "3"
add("drybed", rows(g), "bed")

# ---------- koi pond ----------
g = grid(48, 32)
for y in range(32):
    for x in range(48):
        d = ((x - 23.5) / 23.5) ** 2 + ((y - 15.5) / 15.5) ** 2
        if d <= 1:
            if d > 0.78:
                g[y][x] = "3" if (x // 3 + y // 2) % 2 else "2"
            else:
                g[y][x] = "1" if (y in (8, 9) and 14 < x < 22) or (y == 18 and 26 < x < 32) else "2"
add("pond", rows(g), "pond")

# ---------- props ----------
add("basket", hand(
    "................",
    "................",
    "................",
    "................",
    "................",
    "...3333333333...",
    "..311111111113..",
    ".31222222222213.",
    ".33333333333333.",
    ".32121212121213.",
    ".31212121212123.",
    ".32121212121213.",
    "..322222222223..",
    "..333333333333..",
    "................",
    "................"), "basket")

add("cherrypile", hand(
    "................",
    "................",
    ".....33.333.....",
    "...3223321233...",
    "..322132232123..",
    "..322222222223..",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................"), "cherry")

add("sack", hand(
    "..3333..",
    ".322223.",
    "32212223",
    "32222223",
    "32222223",
    ".333333."), "cherry")

add("sign", hand(
    "................",
    "..333333333333..",
    ".31111111111113.",
    ".31333133313313.",
    ".31111111111113.",
    ".31333331333313.",
    ".31111111111113.",
    "..333333333333..",
    "......3223......",
    "......3223......",
    "......3223......",
    "......3223......",
    ".....332233.....",
    "................",
    "................",
    "................"), "wood")

g = grid(16, 16)
for x in range(16):
    for y in (6, 11):
        g[y][x] = "3"; g[y + 1][x] = "2"
for x in (6, 7, 8, 9):
    for y in range(3, 15):
        g[y][x] = "3" if x in (6, 9) or y in (3, 14) else "1"
add("fence", rows(g), "wood")

# ---------- workers (Pokemon-style overworld): down / up / side, 2 frames each ----------
HEAD_DOWN = [
    "................",
    ".....333333.....",
    "....31111113....",
    "...3111111113...",
    "..333333333333..",
    ".31111111111113.",
    "..333111111333..",
    "...3131111313...",
    "...3111111113...",
    "....33111133....",
]
HEAD_UP = HEAD_DOWN[:6] + [
    "..333333333333..",
    "...3333333333...",
    "...3333333333...",
    "....33111133....",
]
BODY = [
    "...3322222233...",
    "..312222222213..",
    "..312222222213..",
    "...3322222233...",
]
LEGS = [[".....33..33.....", ".....33..33....."], [".....33...33....", ".....3....33...."]]
for f in (0, 1):
    add("worker_down_%d" % f, HEAD_DOWN + BODY + LEGS[f], "worker")
    add("worker_up_%d" % f, HEAD_UP + BODY + LEGS[1 - f], "worker")
SIDE_HEAD = [
    "................",
    "......333333....",
    ".....31111113...",
    "....3111111113..",
    "...333333333333.",
    "..31111111111113",
    "....3311111133..",
    "....3111111313..",
    "....3111111113..",
    ".....33111133...",
]
SIDE_BODY = [
    ".....3222223....",
    "....32222213....",
    "....32222213....",
    ".....3322233....",
]
SIDE_LEGS = [["......3333......", "......3..3......"], [".....33..33.....", "....33....33...."]]
for f in (0, 1):
    add("worker_side_%d" % f, SIDE_HEAD + SIDE_BODY + SIDE_LEGS[f], "worker")

add("bubble_full", hand(
    "3333333333333333",
    "3111111111111113",
    "3133313131313313",
    "3131113131313313",
    "3133113131313313",
    "3131113131313113",
    "3131111331333113",
    "3111111111111113",
    "3333333333333333",
    "......3113......",
    ".......33.......",
    "................"), "bubble")

# ---------- palettes: colour (GBC-style) and classic (DMG greens) ----------
PAL = {
    "grass":  ["#E8F0B0", "#B8D878", "#6AA050", "#2C4C30"],
    "path":   ["#F4E4BC", "#DCC490", "#B0905C", "#5C4428"],
    "soil":   ["#B07848", "#8C5830", "#6A4020", "#3C2414"],
    "leaf":   [None, "#7CC060", "#3E8A3A", "#1E3A22"],
    "flower": [None, "#FFFFFF", "#3E8A3A", "#1E3A22"],
    "green":  [None, "#C8E060", "#3E8A3A", "#1E3A22"],
    "ripe":   [None, "#F03C3C", "#3E8A3A", "#1E3A22"],
    "spark":  [None, "#FFF8C8", None, "#F0A020"],
    "tree":   [None, "#A8D868", "#4E9440", "#1E3A22"],
    "roof":   [None, "#E8C878", "#B08A48", "#4A3420"],
    "wall":   [None, "#F8F0DC", "#8A5A30", "#262248"],
    "bed":    [None, "#D0583A", "#8A5A30", "#3A2018"],
    "pond":   [None, "#E8F8F8", "#58A8D0", "#24485E"],
    "basket": [None, "#F0C878", "#B07A3C", "#4A2C18"],
    "cherry": [None, "#FF9A8A", "#D8302C", "#5A1414"],
    "wood":   [None, "#E8C080", "#A06838", "#40281A"],
    "bubble": [None, "#F8F8F0", None, "#202020"],
    "worker": [None, "#F8D8A8", "#3E5AA8", "#2A2028"],
}
SHIRTS = ["#3E5AA8", "#C0405A", "#2E7A4A", "#C88A20", "#6A4C9C", "#1A8A9A", "#8A4E2B", "#D86A8A"]
# Classic: background tiles use the 4 shades in order; sprites map light / mid / outline like
# Game Boy object palettes, so props stay light against the ground with a dark outline.
SPR = [None, DMG[0], DMG[1], DMG[3]]
CLASSIC = {k: (list(DMG) if v[0] is not None else [None if c is None else SPR[i] for i, c in enumerate(v)]) for k, v in PAL.items()}
CLASSIC["soil"] = [DMG[1], DMG[2], DMG[3], DMG[3]]
CLASSIC["ripe"] = [None, DMG[3], DMG[1], DMG[3]]   # ripe cherries read as dark dots
CLASSIC["green"] = [None, DMG[2], DMG[1], DMG[3]]
CLASSIC["leaf"] = [None, DMG[0], DMG[1], DMG[3]]


def hexrgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) + (255,)


def render(spr, pal):
    im = Image.new("RGBA", (spr["w"], spr["h"]), (0, 0, 0, 0))
    for y, r in enumerate(spr["rows"]):
        for x, ch in enumerate(r):
            if ch != "." and pal[int(ch)]:
                im.putpixel((x, y), hexrgb(pal[int(ch)]))
    return im


def sheet(pals, path):
    names = list(S)
    x = y = rowh = 0
    place = {}
    for n in names:
        w, h = S[n]["w"], S[n]["h"]
        if x + w > 160:
            x, y, rowh = 0, y + rowh + 2, 0
        place[n] = (x, y)
        x += w + 2
        rowh = max(rowh, h)
    im = Image.new("RGBA", (160, y + rowh), (0, 0, 0, 0))
    for n, (px, py) in place.items():
        pal = pals[S[n]["pal"]]
        im.alpha_composite(render(S[n], pal), (px, py))
    im.save(path)
    im.resize((im.width * 4, im.height * 4), Image.NEAREST).save(path.replace(".png", "@4x.png"))
    return place


place = sheet(PAL, os.path.join(HERE, "sheet-color.png"))
sheet(CLASSIC, os.path.join(HERE, "sheet-classic.png"))
with open(os.path.join(HERE, "sprites.json"), "w") as f:
    json.dump({"sprites": S, "palettes": PAL, "classic": CLASSIC, "shirts": SHIRTS, "dmg": DMG, "sheet": place}, f, separators=(",", ":"))
print(len(S), "sprites")
