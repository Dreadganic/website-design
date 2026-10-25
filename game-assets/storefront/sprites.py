"""The roastery storefront sprites (a proposal, not in the game yet), in the game's own format: w, h, rows of palette letters, pal.
Same outline (#3E2A1C) and shadow row as sprites.json, so each entry can be copied into its "sprites" map.
python3 game-assets/storefront/sprites.py  ->  shop-sprites.json and sheet.png beside this file"""
import json, sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
from PIL import Image, ImageDraw
O = '#3E2A1C'; SH = '#2A2A0850'
S = {}
def spr(name, pal, rows):
    w = max(len(r) for r in rows)
    bad = [i for i, r in enumerate(rows) if len(r) != w]
    if bad: print('ragged', name, bad, [len(rows[i]) for i in bad], 'w', w); sys.exit(1)
    for r in rows:
        for ch in r:
            if ch != '.' and ch not in pal: print('no colour', name, repr(ch)); sys.exit(1)
    S[name] = {'w': w, 'h': len(rows), 'rows': rows, 'pal': pal}

# ---- the A-frame sign in front of the counter: tap it to open the shop
SIGN = {'O': O, 'w': '#C89060', 'W': '#9A6A3C', 'b': '#2E3A2E', 'g': '#8CE07A', 'r': '#F07A64', 'y': '#F8E8C8', 'k': '#5A3A1C', 'a': SH}
spr('sign_open', SIGN, [
 '.OOOOOOOOOOOOOOOOOO.',
 'OwwwwwwwwwwwwwwwwwWO',
 'OwbbbbbbbbbbbbbbbbWO',
 'OwgggbgggbgggbgbbgWO',
 'OwgbgbgbgbgbbbggbgWO',
 'OwgbgbgggbggbbgbggWO',
 'OwgbgbgbbbgbbbgbbgWO',
 'OwgggbgbbbgggbgbbgWO',
 'OwbbbbbbbbbbbbbbbbWO',
 'OwbbbbbyyyyybbbbbbWO',
 'OwbbbbbyyyyyyybbbbWO',
 'OwbbbbbyyyyybbbbbbWO',
 'OwbbbbbbyyybbbbbbbWO',
 'OwbbbbbbbbbbbbbbbbWO',
 'OWWWWWWWWWWWWWWWWWWO',
 '.OkO............OkO.',
 '.OkO............OkO.',
 '.aaa............aaa.'])
spr('sign_closed', SIGN, [
 '.OOOOOOOOOOOOOOOOOO.',
 'OwwwwwwwwwwwwwwwwwWO',
 'OwbbbbbbbbbbbbbbbbWO',
 'OwrrbbbrbbrrrbrbrbWO',
 'OwrbrbrbrbrbbbrbrbWO',
 'OwrrbbrrrbrbbbrrbbWO',
 'OwrbrbrbrbrbbbrbrbWO',
 'OwrrbbrbrbrrrbrbrbWO',
 'OwbbbbbbbbbbbbbbbbWO',
 'OwrrrbrrrbrrrbrbbrWO',
 'OwrbbbrbrbrbrbrrbrWO',
 'OwrrrbrbrbrbrbrbrrWO',
 'OwbbrbrbrbrbrbrbbrWO',
 'OwrrrbrrrbrrrbrbbrWO',
 'OwbbbbbbbbbbbbbbbbWO',
 'OWWWWWWWWWWWWWWWWWWO',
 '.OkO............OkO.',
 '.OkO............OkO.',
 '.aaa............aaa.'])

# ---- the shop's rating, on the sign and in the Shop page
spr('star_on', {'O': O, 'y': '#F2C04A', 'Y': '#B88428', 'w': '#FFF4B0'}, [
 '...O...',
 '..OyO..',
 'OOOwyOO',
 'OyyyyYO',
 '.OyyYO.',
 'OyYOOYO',
 'OO...OO'])
spr('star_off', {'O': O, 'y': '#7A6A50', 'Y': '#5A4A38', 'w': '#9A8A70'}, [
 '...O...',
 '..OyO..',
 'OOOwyOO',
 'OyyyyYO',
 '.OyyYO.',
 'OyYOOYO',
 'OO...OO'])

# ---- a regular's mug, at their place on the café's long table once they've come 10 times
spr('mug', {'O': O, 'm': '#E8DCC0', 'M': '#B8A888', 'c': '#D84A36'}, [
 'OOOOO.',
 'OmcmOO',
 'OmmmOM',
 'OmmmOO',
 '.OOO..'])

# ---- the Shop page: an order card, a regular's stamp card, the day's ledger
spr('order_card', {'O': O, 'p': '#FFF8EC', 'P': '#E8DCC0', 'r': '#D84A36', 'k': '#7A5A3A'}, [
 '.....OO.....',
 '....OrrO....',
 'OOOOOrrOOOOO',
 'OppppOOppppO',
 'OpkkkkkkkkpO',
 'OppppppppppO',
 'OpkkkkkkppPO',
 'OppppppppppO',
 'OpkkkkkkkkPO',
 'OppppppppppO',
 'OpkkkkppppPO',
 'OPPPPPPPPPPO',
 'OOOOOOOOOOOO'])
spr('stamp_card', {'O': O, 'p': '#FFF8EC', 'r': '#D84A36', 'g': '#2D6A46', 'k': '#C8B898'}, [
 'OOOOOOOOOOOOOO',
 'OgggggggggggggO'[:14],
 'OpppppppppppppO'[:14],
 'OprpprpprppkpO',
 'OppppppppppppO',
 'OpkppkppkppkpO',
 'OppppppppppppO',
 'OOOOOOOOOOOOOO'])
spr('ledger', {'O': O, 'g': '#2D6A46', 'G': '#1E4A30', 'p': '#FFF8EC', 'y': '#F2C04A'}, [
 '.OOOOOOOOOO.',
 'OgggggggggGO',
 'OgyyyyyyygGO',
 'OgggggggggGO',
 'OgggyyyggggO',
 'OgggggggggGO',
 'OgggggggggGO',
 'OGGGGGGGGGGO',
 'OppppppppppO',
 '.OOOOOOOOOO.'])

json.dump(S, open(os.path.join(HERE, 'shop-sprites.json'), 'w'), indent=1)
Z = 4; pad = 10; cols = 6
def tile(s):
    im = Image.new('RGBA', (s['w'], s['h']), (0, 0, 0, 0)); px = im.load()
    for y, r in enumerate(s['rows']):
        for x, ch in enumerate(r):
            if ch == '.': continue
            c = s['pal'][ch].lstrip('#'); a = int(c[6:8], 16) if len(c) == 8 else 255
            px[x, y] = (int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16), a)
    return im.resize((s['w'] * Z, s['h'] * Z), Image.NEAREST)
names = list(S); cw = 32 * Z + pad; ch = 20 * Z + 24
rows = (len(names) + cols - 1) // cols
sheet = Image.new('RGBA', (cols * (cw + pad) + pad, rows * ch + pad), (246, 238, 220, 255)); dr = ImageDraw.Draw(sheet)
for i, n in enumerate(names):
    t = tile(S[n]); x = pad + (i % cols) * (cw + pad); y = pad + (i // cols) * ch
    sheet.alpha_composite(t, (x, y)); dr.text((x, y + t.height + 2), n, fill=(62, 42, 28, 255))
sheet.save(os.path.join(HERE, 'sheet.png')); print(len(S), 'sprites')
