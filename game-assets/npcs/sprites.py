"""Beju Farm's cast: every named character drawn as themselves, not as a recoloured farmer.
Map sprites are 16x24 like the farmer (feet on row 22, the game draws the shadow), in the game's own format: w, h, rows of
palette letters, pal. Each character has a front view (stand and two steps), a side view facing right (stand and a stride;
the game mirrors it), a blink, and two frames of their own action. Portraits are 32x32, one per mood.
Pieces are drawn by hand as 16-wide rows and stacked: a head (face, hair, hat) on rows 0-11, a top on rows 12-18, and what
they wear below on rows 19-22. '.' leaves a pixel as it is, '_' clears it.
python3 game-assets/npcs/sprites.py  ->  npc-sprites.json and sheet.png beside this file"""
import json, os, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
O = '#3E2A1C'
W, H = 16, 24
S = {}


class Canvas:
    def __init__(self, w=W, h=H):
        self.w, self.h, self.px = w, h, {}

    def put(self, x, y, k):
        if 0 <= x < self.w and 0 <= y < self.h:
            if k == '_':
                self.px.pop((x, y), None)
            else:
                self.px[(x, y)] = k

    def stamp(self, rows, y0=0, x0=0):
        for j, r in enumerate(rows):
            for i, k in enumerate(r):
                if k not in '. ':
                    self.put(x0 + i, y0 + j, k)
        return self

    def copy(self):
        c = Canvas(self.w, self.h)
        c.px = dict(self.px)
        return c

    def swap(self, a, b, rows=None):   # recolours one letter, on some rows or all
        for (x, y), k in list(self.px.items()):
            if k == a and (rows is None or y in rows):
                self.px[(x, y)] = b
        return self

    def outline(self):   # closes the silhouette: an empty pixel touching a coloured one becomes outline
        add = set()
        for (x, y), k in self.px.items():
            if k == 'O':
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                q = (x + dx, y + dy)
                if 0 <= q[0] < self.w and 0 <= q[1] < self.h and q not in self.px:
                    add.add(q)
        for q in add:
            self.px[q] = 'O'
        return self

    def rows(self):
        return [''.join(self.px.get((x, y), '.') for x in range(self.w)) for y in range(self.h)]


def check(name, rows, pal):
    w = len(rows[0])
    bad = [i for i, r in enumerate(rows) if len(r) != w]
    if bad:
        sys.exit('ragged %s rows %s' % (name, bad))
    for r in rows:
        for ch in r:
            if ch != '.' and ch not in pal:
                sys.exit('no colour for %r in %s' % (ch, name))


def add(name, canvas, pal):
    rows = canvas.rows()
    used = set(''.join(rows)) - {'.'}
    p = {k: v for k, v in pal.items() if k in used}
    check(name, rows, p)
    S[name] = {'w': canvas.w, 'h': canvas.h, 'rows': rows, 'pal': p}


def piece(rows, n=None):   # a block of rows, every one 16 wide
    for r in rows:
        if len(r) != W:
            sys.exit('piece row is %d wide, not 16: %r' % (len(r), r))
    return rows


# ---------------- shared pieces ----------------
# faces: rows 4-11, the farmer's face (8 wide, eyes on row 9 at x 6 and 9)
FACE = piece([
    '....OOOOOOOO....',
    '...OssssssssO...',
    '...OssssssssO...',
    '...OssssssssO...',
    '...OSssssssSO...',
    '...OSseSSesSO...',
    '...OSssssssSO...',
    '....OSSssSSO....'])
FACE_SIDE = piece([   # facing right: the eye on x 11, the back of the head on the left
    '.....OOOOOOO....',
    '....OssssssssO..',
    '....OssssssssO..',
    '....OssssssssO..',
    '....OSssssssSO..',
    '....OSssssesSO..',
    '....OSssssssssO.',
    '.....OSSsssSOO..'])

# tops, rows 12-18 (with the hips), front and side; arms hang at x 3 and 12
TOP = {
    'shirt': (piece([
        '...OOccccccOO...',
        '..OcOcCccCcOcO..',
        '..OCOCcccCCOCO..',
        '..OsOCCCCCCOsO..',
        '...OODDDDDDOO...',
        '....OppppppO....',
        '....OpPppPpO....']), piece([
        '.....OOcccOO....',
        '....OcCccOcO....',
        '....OCcccOCO....',
        '....OCCCCOsO....',
        '.....ODDDDO.....',
        '.....OppppO.....',
        '.....OpPpPO.....'])),
    'broad': (piece([
        '..OOccccccccOO..',
        '.OcOcCccccCcOcO.',
        '.OCOCccccccCOCO.',
        '.OsOCCCCCCCCOsO.',
        '..OODDDDDDDDOO..',
        '...OppppppppO...',
        '...OpPppppPpO...']), piece([
        '....OOccccOO....',
        '...OcCcccOcO....',
        '...OCccccOCO....',
        '...OCCCCCOsO....',
        '....ODDDDDO.....',
        '....OpppppO.....',
        '....OpPppPO.....'])),
}
# below the hips, rows 19-22: three front frames (stand, left step, right step) and two side frames (stand, stride)
LEGS = {
    'trousers': ([piece(['....OpPOOPpO....', '....OPPOOPPO....', '....ObbOObbO....', '.....OO..OO.....']),
                  piece(['....OpPOOPpO....', '....OPPOOObO....', '....ObbO.OO.....', '.....OO.........']),
                  piece(['....OpPOOPpO....', '....ObOOOPPO....', '.....OO.ObbO....', '.........OO.....'])],
                 [piece(['.....OpPOPO.....', '.....OPPOPO.....', '.....ObbObO.....', '......OO.O......']),
                  piece(['....OpPO.OPO....', '...OPPO...OPO...', '...ObbO...ObO...', '....OO.....O....'])]),
    'broad': ([piece(['...OpPPOOPPpO...', '...OPPPOOPPPO...', '...ObbbOObbbO...', '....OOO..OOO....']),
               piece(['...OpPPOOPPpO...', '...OPPPOOOObO...', '...ObbbO.OOO....', '....OOO.........']),
               piece(['...OpPPOOPPpO...', '...ObOOOOPPPO...', '....OOO.ObbbO...', '.........OOO....'])],
              [piece(['....OpPPOPO.....', '....OPPPOPO.....', '....ObbbObO.....', '.....OOO.O......']),
               piece(['...OpPPO.OPO....', '..OPPPO...OPO...', '..ObbbO...ObO...', '...OOO.....O....'])]),
}


def figure(head, top, legs, frame=0, side=False):
    c = Canvas()
    c.stamp(head, 0)
    c.stamp(top, 12)
    c.stamp(legs[1 if side else 0][frame], 19)
    return c


def blink(c):   # eyes shut for a moment: the eye pixels take the skin's shade
    b = c.copy()
    b.swap('e', 'S', rows=range(0, 12))
    return b


# ---------------- the cast ----------------
CAST = {}


def cast(cid, pal, front, side, act, top='shirt', legs='trousers', back=None):
    """front/side: (head rows 0-11, top rows 12-18, legs key); act: two lists of (row, text) patches on the front stand frame;
    back: what the back of the head shows where the face was (hair by default; a headwrap or shawl for some)"""
    CAST[cid] = dict(pal=dict(pal, O=O), front=front, side=side, act=act, legs=legs, back=back)


FACE_KEYS = set('sSegwmk')


def back_view(c, key):   # seen from behind: the face becomes the back of the head, the chin row the nape
    b = c.copy()
    rows = [y for y in range(4, 12) if any(b.px.get((x, y)) in ('s', 'S') for x in range(4, 12))]
    for y in rows:
        for x in range(4, 12):
            k = b.px.get((x, y))
            inner = k == 'O' and b.px.get((x - 1, y), '.') != '.' and b.px.get((x + 1, y), '.') != '.' and y != rows[-1]
            if k in FACE_KEYS or inner:
                b.px[(x, y)] = 'S' if y == rows[-1] else key
    return b


SKIN = {   # light to deep: base, shade
    'light': ('#F8D2B0', '#E2A882'), 'fair': ('#F4CCA8', '#DCA47E'), 'tan': ('#E0A87C', '#C08458'), 'golden': ('#D49A68', '#B47A4A'),
    'medium': ('#C08458', '#9E663C'), 'brown': ('#A06A44', '#80502E'), 'deep': ('#7E4C30', '#62381E'), 'umber': ('#6A3E26', '#502C18')}


def skin(k):
    return {'s': SKIN[k][0], 'S': SKIN[k][1], 'e': '#1A0E0A'}


# Captain Ama, harbourmaster: tall, a white peaked cap with a gold badge, a navy double-breasted coat, a brass spyglass
cast('ama', dict(skin('deep'), r='#C8C4BC', R='#9A968E', h='#F8F4EC', H='#D8D0BC', k='#1E2A44', v='#141418', g='#F2C04A', G='#B88A20',
                 c='#2A4A7A', C='#20385E', D='#16284A', l='#F4F0E4', p='#E8E0CC', P='#C8BEA4', b='#1E1E22'),
     front=(piece([
         '................',
         '...OOOOOOOOOO...',
         '..OhhhhhhhhhhO..',
         '..OHhhhhhhhhHO..',
         '...OkkkgGkkkO...',
         '...OkkkkkkkkO...',
         '...OvvvvvvvvO...',
         '....OvvvvvvO....',
         '...OrSssssSrO...',
         '...OSseSSesSO...',
         '...gSssssssSg...',
         '....OSSssSSO....']), piece([
         '...OOcllllcOO...',
         '..OcOcglgccOcO..',
         '..OCOCcccgCOCO..',
         '..OsOCgcccCOsO..',
         '...OOCcccgCOO...',
         '....OCcODcCO....',
         '....OpPppPpO....'])),
     side=(piece([
         '................',
         '....OOOOOOOO....',
         '...OhhhhhhhhO...',
         '...OHhhhhhhhhO..',
         '....OkkkkkkgGO..',
         '....OkkkkkkkkOO.',
         '....OkkkkkkvvvvO',
         '.....OOOOOOOOOO.',
         '....OrrSssssSO..',
         '....OrSssssesSO.',
         '....grSssssssO..',
         '.....OSSsssSOO..']), piece([
         '.....OOcllOO....',
         '....OcCcgOcO....',
         '....OCcccOCO....',
         '....OCcgcOsO....',
         '.....OcccO......',
         '.....OCDcO......',
         '.....OpPpPO.....'])),
     act=[[(12, '...OOcllllcOOgG.'), (13, '..OcOcglgccOcGO.'), (14, '..OCOCcccgCOsO..'), (15, '..OsOCgcccCO....')],
          [(8, '...OrSssssSrOOOO'), (9, '...OSseSSeggGGGG'), (10, '...gSssssssSgOOO'), (12, '...OOcllllcOOO..'), (13, '..OcOcglgccOcsO.'), (14, '..OCOCcccgCO.O..'), (15, '..OsOCgcccCO....')]])

# Miss Pearl, Blue Mountain: an elder in a wide straw sun hat with a pink ribbon, a long pink dress, half-moon glasses
cast('pearl', dict(skin('brown'), r='#E8E4DC', R='#BEB8AE', h='#F2DC9C', H='#D8BC6C', k='#E87AA0', n='#FFF4F8', g='#C8D8E8',
                   c='#E87AA0', C='#C85A80', D='#A04066', l='#FFF4F8', a='#FFF4F8', b='#5A3A2A', t='#D8B068', T='#A88040'),
     front=(piece([
         '................',
         '................',
         '.....OOOOOO.....',
         '....OhhhhhhO....',
         '...OhhhhhhHHO...',
         '..OkkknkkkkkkO..',
         '.OhhhhhhhhhhhhO.',
         'OhHHHHHHHHHHHHhO',
         'OHOOrSssssSrOOHO',
         '.O.OSgeggegSO.O.',
         '...OSssssssSO...',
         '....OSSssSSO....']), piece([
         '...OOcllllcOO...',
         '..OcOcaccacOcO..',
         '..OCOcccaccOCO..',
         '..OsOCcaccCOsO..',
         '...OcCcccacCO...',
         '...OcaccccacO...',
         '..OCcccacccCCO..'])),
     side=(piece([
         '................',
         '................',
         '......OOOOOO....',
         '.....OhhhhhhO...',
         '....OhhhhhhHHO..',
         '...OkkkkkkknkO..',
         '..OhhhhhhhhhhhO.',
         '.OhHHHHHHHHHHHhO',
         '.OHOrrSsssSOOOHO',
         '..O.OrSssgegSO..',
         '....OrSssssssO..',
         '.....OSSsssSOO..']), piece([
         '.....OOcllOO....',
         '....OcCacOcO....',
         '....OCcccOCO....',
         '....OCaccOsO....',
         '....OcccacO.....',
         '....OcaccccO....',
         '...OCcccaccCO...'])),
     act=[[(9, '.O.OSgeggegSO.O.'), (12, '...OOcllllcOOtO.'), (13, '..OcOcaccacOtTtO'), (14, '..OCOcccaccOsTO.'), (15, '..OsOCcaccCOOO..')],
          [(9, '.O.OSgeggegSOtO.'), (10, '...OSssssssSOtTO'), (11, '....OSSssSSOsTtO'), (12, '...OOcllllcOOsOO'), (13, '..OcOcaccacOcO..'), (14, '..OCOcccaccOCO..'), (15, '..OsOCcaccCOOO..')]],
     legs='dress')

# Uncle Kimo, Kona: broad, a lauhala porkpie hat, a white moustache, a green aloha shirt, a ukulele
cast('kimo', dict(skin('medium'), r='#B8B4AC', w='#F4F0E8', h='#E2CC94', H='#B29462', k='#3E2A1C', c='#3E9A6A', C='#2E7A52', D='#1E5A3A', a='#F2D838',
                  p='#C8B48A', P='#A89468', b='#3E2A1C', t='#C88A48', T='#9A6230', u='#3E2A1C'),
     front=(piece([
         '................',
         '................',
         '....OOOOOOOO....',
         '...OhHhhhhHhO...',
         '...OhhhHhhhhO...',
         '...OkkkkkkkkO...',
         '..OhhhhhhhhhhO..',
         '...OOOOOOOOOO...',
         '...OrSssssSrO...',
         '...OSseSSesSO...',
         '...OSwwwwwwSO...',
         '....OSSssSSO....']), piece([
         '..OOccaccccaOO..',
         '.OcOcaccccTtOcO.',
         '.OCOCccacTtCOCO.',
         '.OsOtTTtTtCCOsO.',
         '..OOtuTtDDDDOO..',
         '...OTttTppppO...',
         '...OpPppppPpO...'])),
     side=(piece([
         '................',
         '................',
         '.....OOOOOOOO...',
         '....OhHhhhhHhO..',
         '....OhhhHhhhhO..',
         '....OkkkkkkkkO..',
         '...OhhhhhhhhhhO.',
         '....OOOOOOOOOO..',
         '....OrrSssssSO..',
         '....OrSssssesSO.',
         '....OrSsssswwwO.',
         '.....OSSsssSOO..']), piece([
         '....OOcacaOO....',
         '...OcCcctTtO....',
         '...OCacctTsO....',
         '...OCCCCtTOO....',
         '....ODDDDDO.....',
         '....OpppppO.....',
         '....OpPppPO.....'])),
     act=[[(15, '.OsOtTTtTsCCOsO.'), (16, '..OOtuTtDDDDOO..')],
          [(15, '.OsOtTTtTtCCOsO.'), (16, '..OOtuTsDDDDOO..')]],
     top='broad', legs='shorts')

# a dress or long skirt and the shorts: their own lower rows
LEGS['dress'] = ([piece(['..OCcccccacCCO..', '..OCCCCCCCCCCO..', '...ObbO..ObbO...', '....OO....OO....']),
                  piece(['..OCcccccacCCO..', '..OCCCCCCCCCCO..', '...ObbO...OO....', '....OO..........']),
                  piece(['..OCcccccacCCO..', '..OCCCCCCCCCCO..', '....OO...ObbO...', '..........OO....'])],
                 [piece(['...OCccacccCO...', '...OCCCCCCCCO...', '.....ObbObO.....', '......OO.O......']),
                  piece(['..OCccacccccCO..', '..OCCCCCCCCCCO..', '...ObbO...ObO...', '....OO.....O....'])])
LEGS['shorts'] = ([piece(['...OsSOOOOSsO...', '...OsSO..OSsO...', '...ObbbO.ObbbO..', '....OOO...OOO...']),
                   piece(['...OsSOOOOSsO...', '...OsSO..OObO...', '...ObbbO..OO....', '....OOO.........']),
                   piece(['...OsSOOOOSsO...', '...ObOO..OSsO...', '....OO...ObbbO..', '..........OOO...'])],
                  [piece(['....OsSOOsO.....', '....OsSOOsO.....', '....ObbbObO.....', '.....OOO.O......']),
                   piece(['...OsSO..OsO....', '..OsSO....OsO...', '..ObbbO...ObO...', '...OOO.....O....'])])

LEGS['skirt'] = ([piece(['..OPpxpppppxPO..', '..OPPPPPPPPPPO..', '...ObbO..ObbO...', '....OO....OO....']),
                  piece(['..OPpxpppppxPO..', '..OPPPPPPPPPPO..', '...ObbO...OO....', '....OO..........']),
                  piece(['..OPpxpppppxPO..', '..OPPPPPPPPPPO..', '....OO...ObbO...', '..........OO....'])],
                 [piece(['....OPpxppPO....', '....OPPPPPPO....', '.....ObbObO.....', '......OO.O......']),
                  piece(['...OPpxpppPPO...', '...OPPPPPPPPO...', '...ObbO...ObO...', '....OO.....O....'])])
LEGS['sarong'] = ([piece(['....OpPxpPpO....', '....OPPPPPPO....', '....OsSOOSsO....', '.....OO..OO.....']),
                   piece(['....OpPxpPpO....', '....OPPPPPPO....', '....OsSO.OO.....', '.....OO.........']),
                   piece(['....OpPxpPpO....', '....OPPPPPPO....', '.....OO.OSsO....', '.........OO.....'])],
                  [piece(['.....OpxpPO.....', '.....OPPPPO.....', '.....OsSOsO.....', '......OO.O......']),
                   piece(['....OpPxpPPO....', '....OPPPPPPO....', '...OsSO..OsO....', '....OO....O.....'])])
LEGS['kemis'] = ([piece(['..OLlllllllLLO..', '..OxyxyxyxyxyO..', '...ObbO..ObbO...', '....OO....OO....']),
                  piece(['..OLlllllllLLO..', '..OxyxyxyxyxyO..', '...ObbO...OO....', '....OO..........']),
                  piece(['..OLlllllllLLO..', '..OxyxyxyxyxyO..', '....OO...ObbO...', '..........OO....'])],
                 [piece(['....OLllllLO....', '....OxyxyxyO....', '.....ObbObO.....', '......OO.O......']),
                  piece(['...OLlllllLLO...', '...OxyxyxyxyO...', '...ObbO...ObO...', '....OO.....O....'])])
LEGS['boots'] = ([piece(['....OpPOOPpO....', '....ObBOOBbO....', '....ObbOObbO....', '.....OO..OO.....']),
                  piece(['....OpPOOPpO....', '....ObBOOObO....', '....ObbO.OO.....', '.....OO.........']),
                  piece(['....OpPOOPpO....', '....ObOOOBbO....', '.....OO.ObbO....', '.........OO.....'])],
                 [piece(['.....OpPOPO.....', '.....ObBObO.....', '.....ObbObO.....', '......OO.O......']),
                  piece(['....OpPO.OPO....', '...ObBO...ObO...', '...ObbO...ObO...', '....OO.....O....'])])

# Tante Lise, Réunion: a tall madras headwrap, gold earrings, a pale yellow blouse, a long red skirt, a green watering can
cast('lise', dict(skin('medium'), h='#F2D838', k='#C8402C', H='#A8302A', g='#F2C04A', c='#F8E8A0', C='#E0C870', D='#B8A050',
                  p='#C8402C', P='#9A2E20', x='#F2D838', b='#5A3A2A', t='#4E9A5A', T='#2E7A42', u='#8CC8E8'),
     front=(piece([
         '................',
         '......OOOO......',
         '.....OhkkhO.....',
         '....OkkkkkkO....',
         '...OhhkhhkhhO...',
         '..OkkkkkkkkkkO..',
         '..OhhkhhkhhkhO..',
         '...OHHHHHHHHO...',
         '...OSssssssSO...',
         '...OSseSSesSO...',
         '...gSssssssSg...',
         '....OSSssSSO....']), piece([
         '...OOccccccOO...',
         '..OcOcCccCcOcO..',
         '..OsOCcccCCOsO..',
         '..OsOCCCCCCOsO..',
         '...OppppppppOtO.',
         '...OppxpppxpTtTO',
         '..OPppppxpppOTO.'])),
     side=(piece([
         '................',
         '.....OOOO.......',
         '....OhkkhO......',
         '...OkkkkkkO.....',
         '...OhhkhhkhhO...',
         '..OkkkkkkkkkkO..',
         '..OhhkhhkhhkhO..',
         '...OHHHHHHHHO...',
         '....OSsssssSO...',
         '....OSssssesSO..',
         '....gSsssssssO..',
         '.....OSSsssSOO..']), piece([
         '.....OOcccOO....',
         '....OcCccOcO....',
         '....OCcccOsO....',
         '....OCCCCOsOtO..',
         '....OppppppTtTO.',
         '....OpxpppPOTO..',
         '....OppppxPO....'])),
     act=[[(13, '..OcOcCccCcOcO..'), (14, '..OsOCcccCCOsOO.'), (15, '..OsOCCCCCCOTtTO'), (16, '...OppppppppOOTu'), (17, '...OppxpppxpO..u'), (18, '..OPppppxpppPO..')],
          [(13, '..OcOcCccCcOcO..'), (14, '..OsOCcccCCOsOO.'), (15, '..OsOCCCCCCOTtTO'), (16, '...OppppppppOOTO'), (17, '...OppxpppxpO.u.'), (18, '..OPppppxpppPOu.')]],
     legs='skirt', back='h')

# Wayan, Bali: a white udeng with its folded peak, a white shirt, a gold sash and a green sarong, bare feet; he reads the sky
cast('wayan', dict(skin('golden'), l='#F4F0E4', L='#D8D0BC', a='#C8402C', r='#1E1A18', R='#3A3430',
                   c='#F4F0E4', C='#D8D0BC', D='#D8B048', p='#3E6A3A', P='#2E5230', x='#D8B048'),
     front=(piece([
         '................',
         '................',
         '.......OO.......',
         '......OlLO......',
         '....OOlLLlOO....',
         '...OllllllllO...',
         '...OaLllllLaO...',
         '...OrrrrrrrrO...',
         '...OrSssssSrO...',
         '...OSseSSesSO...',
         '...OSssssssSO...',
         '....OSSssSSO....']), piece([
         '...OOccccccOO...',
         '..OcOcCccCcOcO..',
         '..OCOCcccCCOCO..',
         '..OsOCCCCCCOsO..',
         '...OODDDDDDOO...',
         '....OpPxpPpO....',
         '....OppPxppO....'])),
     side=(piece([
         '................',
         '................',
         '.........OO.....',
         '........OlLO....',
         '.....OOOlLlO....',
         '....OllllllllO..',
         '....OaLllllllaO.',
         '....OrrrrrrrrO..',
         '....OrrSssssSO..',
         '....OrSssssesSO.',
         '....OrSssssssO..',
         '.....OSSsssSO...']), piece([
         '.....OOcccOO....',
         '....OcCccOcO....',
         '....OCcccOCO....',
         '....OCCCCOsO....',
         '.....ODDDDO.....',
         '.....OpxpPO.....',
         '.....OppxPO.....'])),
     act=[[(6, '...OaLllllLaOsO.'), (7, '...OrrrrrrrrOsO.'), (8, '...OrSssssSrOcO.'), (9, '...OSseSSesSOcO.'), (10, '...OSssssssSOcO.'), (11, '....OSSssSSO.O..'),
           (12, '...OOccccccOO...'), (13, '..OcOcCccCcOO...'), (14, '..OCOCcccCCO....'), (15, '..OsOCCCCCCO....')],
          [(4, '....OOlLLlOOOsO.'), (5, '...OllllllllOsO.'), (6, '...OaLllllLaOcO.'), (7, '...OrrrrrrrrOcO.'), (8, '...OrSssssSrOcO.'), (9, '...OSseSSesSOcO.'), (10, '...OSssssssSOcO.'), (11, '....OSSssSSO.O..'),
           (12, '...OOccccccOO...'), (13, '..OcOcCccCcOO...'), (14, '..OCOCcccCCO....'), (15, '..OsOCCCCCCO....')]],
     legs='sarong')

# Dr. Inés, Galápagos: a khaki field hat with a chin strap, a long braid over one shoulder, glasses, a field vest and binoculars
cast('ines', dict(skin('tan'), r='#2E1E18', R='#4A3428', h='#D8CCA4', H='#B8A878', k='#6A5038', g='#C8E0F0',
                  c='#B8A878', C='#98885A', D='#786A44', l='#4E7E3A', L='#3E6A2E', p='#8A7A5A', P='#6A5A3E', b='#5A3A2A',
                  v='#2A2A2E', V='#6A6A74', t='#C8402C', T='#F4F0E4'),
     front=(piece([
         '................',
         '................',
         '.....OOOOOO.....',
         '....OhhhhhhO....',
         '....OHhhhhHO....',
         '...OkkkkkkkkO...',
         '..OhhhhhhhhhhO..',
         '.OHHHHHHHHHHHHO.',
         '..OOrSssssSrOO..',
         '..OrSgeggegSO...',
         '..ORSssssssSO...',
         '..OrOSSssSSO....']), piece([
         '..OROcllllcOO...',
         '..OrOcCllCcOlO..',
         '..OROCcvVcCOlO..',
         '..OkOCcccCCOsO..',
         '..OsODDDDDDOO...',
         '....OppppppO....',
         '....OpPppPpO....'])),
     side=(piece([
         '................',
         '................',
         '......OOOOOO....',
         '.....OhhhhhhO...',
         '.....OHhhhhHO...',
         '....OkkkkkkkkO..',
         '...OhhhhhhhhhhO.',
         '..OHHHHHHHHHHHHO',
         '...OOrSssssSOO..',
         '....OrSsssgegSO.',
         '...ORrSsssksssO.',
         '...OrOSSssSkOO..']), piece([
         '...ORrOcllOO....',
         '...OrOcvVOlO....',
         '...ORcCvvOlO....',
         '...OrCCCCOsO....',
         '...OkODDDDO.....',
         '.....OppppO.....',
         '.....OpPpPO.....'])),
     act=[[(9, '..OrSvvSSvvSO...'), (10, '..OsvVVssVVvsO..'), (11, '..OsOSSssSSOsO..'), (12, '..OROcllllcOcO..'), (13, '..OrOcCllCcOO...'), (14, '..OROCcccCCO....'), (15, '..OkOCcccCCO....'), (16, '...OODDDDDDOO...')],
          [(13, '..OrOcCllCcOlO..'), (14, '..OROtTTTtCOsO..'), (15, '..OkOtTTTtsOO...'), (16, '..OsODtttDDOO...')]],
     legs='trousers')
CAST['ines']['pal']['N'] = '#98885A'

# Zé, Mogiana's terreiro foreman: a battered straw hat with its brim curled up, a grey moustache and stubble, rolled sleeves, a wooden rake
cast('ze', dict(skin('tan'), r='#8A8278', R='#6A645C', h='#F2D060', H='#E0B030', k='#A88A1A', c='#F4F0E4', C='#D8D0BC', D='#A89C84',
                p='#6A4A30', P='#4E3420', b='#2E2018', t='#B88A50', T='#8A6234', u='#8A8A8A'),
     front=(piece([
         '................',
         '......OOOO......',
         '.....OhHHhO.....',
         '....OhhHHhhO....',
         '....OhhhhhhO....',
         '.OO.OkkkkkkO.OO.',
         'OhhOhhhhhhhhOhhO',
         '.OhhhhhhhhhhhhO.',
         '..OOrSssssSrOO..',
         '...OSseSSesSO...',
         '...OSrrrrrrSO...',
         '....OSrRRrSO....']), piece([
         '...OOccccccOO...',
         '..OcOcCccCcOcO..',
         '..OsOCcccCCOsO..',
         '..OsOCCCCCCOsO..',
         '...OODDDDDDOO...',
         '....OppppppO....',
         '....OpPppPpO....'])),
     side=(piece([
         '................',
         '.......OOOO.....',
         '......OhHHhO....',
         '.....OhhHHhhO...',
         '.....OhhhhhhO...',
         '..OO.OkkkkkkO.OO',
         '.OhhOhhhhhhhhOhO',
         '..OhhhhhhhhhhhO.',
         '...OOrrSssssSO..',
         '....OrSsssseSO..',
         '....OrSsssrrrO..',
         '.....OSSrrrSO...']), piece([
         '.....OOcccOO....',
         '....OcCccOcO....',
         '....OCcccOsO....',
         '....OCCCCOsO....',
         '.....ODDDDO.....',
         '.....OppppO.....',
         '.....OpPpPO.....'])),
     act=[[(15, '..OsOCCCCCCOstO.'), (16, '...OODDDDDDOOtO.'), (17, '....OppppppO.OtO'), (18, '....OpPppPpO.OtO'), (19, '....OpPOOPpO..tO'), (20, '....OPPOOPPO.OtO'), (21, '....ObbOObbOOuuu'), (22, '.....OO..OO..OOO')],
          [(15, '..OsOCCCCCCOstO.'), (16, '...OODDDDDDOOtO.'), (17, '....OppppppO.tO.'), (18, '....OpPppPpO.tO.'), (19, '....OpPOOPpOOtO.'), (20, '....OPPOOPPOOtO.'), (21, '....ObbOObbOuuuO'), (22, '.....OO..OO.OOO.')]])

# Almaz, Gedeo's ceremony host: a white netela with a woven yellow and green border over her hair and shoulders, a long kemis, a black jebena
cast('almaz', dict(skin('deep'), r='#1E1410', l='#FBF6EA', L='#E0D6C0', x='#F2C42C', y='#3E8A3A', b='#5A3A2A', v='#2A2220', V='#5A4E48', u='#E8E0D8', t='#8A5A34'),
     front=(piece([
         '................',
         '................',
         '................',
         '.....OOOOOO.....',
         '....OllllllO....',
         '...OllllllllO...',
         '..OlllLLLLlllO..',
         '..OlLrrrrrrLlO..',
         '..OlOSssssSOlO..',
         '..OlOseSSesOlO..',
         '..OlOSssssSOlO..',
         '..OlLOSSSSOLlO..']), piece([
         '..OlLLllllLLlO..',
         '.OlxyLllllLyxlO.',
         '.OsOlLllllLlOsO.',
         '..OOlLlyxlLlOO..',
         '...OlLlyxlLlO...',
         '...OlllyxlllO...',
         '..OLlllyxlllLO..'])),
     side=(piece([
         '................',
         '................',
         '................',
         '......OOOOOO....',
         '.....OllllllO...',
         '....OllllllllO..',
         '...OlllLLLLlllO.',
         '...OllLrrrrSSO..',
         '...OllOSsssseSO.',
         '...OllOSssssssO.',
         '...OlLOSsssssO..',
         '...OlLLOSSSSO...']), piece([
         '...OlLLlllLO....',
         '...OxylllOsO....',
         '...OyxlLlOsO....',
         '....OlLyxlOO....',
         '....OlLyxlO.....',
         '....OlllyxO.....',
         '...OLlllyxLO....'])),
     act=[[(10, '..OlOSssssSOlOOO'), (11, '..OlLOSSSSOLOvvO'), (12, '..OlLLllllLOvVvO'), (13, '.OlxyLllllLOsvvO'), (14, '.OsOlLllllLlOOO.')],
          [(11, '..OlLOSSSSOLlOO.'), (12, '..OlLLllllLLOvvO'), (13, '.OlxyLllllLyOvVv'), (14, '.OsOlLllllOsOvvO'), (15, '..OOlLlyxlOutOO.'), (16, '...OlLlyxlOttO..')]],
     legs='kemis', back='l')

# Tigor, Lake Toba's harbour master: a black peci, a white shirt with an ulos cloth across it, waving from the jetty
cast('tigor', dict(skin('medium'), r='#1E1A18', k='#2A2220', K='#5E524A', c='#F4F0E4', C='#D8D0BC', D='#B8B0A0',
                   x='#B8302A', y='#2A2220', z='#F2ECDC', p='#3A3A44', P='#2A2A34', b='#2E2018'),
     front=(piece([
         '................',
         '................',
         '................',
         '....OOOOOOOO....',
         '...OKKKKKKKKO...',
         '...OkkkkkkkkO...',
         '...OkkkkkkkkO...',
         '...OOOOOOOOOO...',
         '...OrSssssSrO...',
         '...OSseSSesSO...',
         '...OSssssssSO...',
         '....OSSssSSO....']), piece([
         '...OOccccxyOO...',
         '..OcOcCcxyzOcO..',
         '..OCOCcxyzCOCO..',
         '..OsOCxyzCCOsO..',
         '...OOxyzDDDOO...',
         '....OyzppppO....',
         '....OpPppPpO....'])),
     side=(piece([
         '................',
         '................',
         '................',
         '.....OOOOOOO....',
         '....OKKKKKKKO...',
         '....OkkkkkkkO...',
         '....OkkkkkkkO...',
         '....OOOOOOOOOO..',
         '....OrrSssssSO..',
         '....OrSsssseSO..',
         '....OrSssssssO..',
         '.....OSSsssSO...']), piece([
         '.....OOcxyOO....',
         '....OcCxyzOcO...',
         '....OCxyzcOCO...',
         '....OxyzCCOsO...',
         '.....OyzDDO.....',
         '.....OppppO.....',
         '.....OpPpPO.....'])),
     act=[[(9, '...OSseSSesSOsO.'), (10, '...OSssssssSOsO.'), (11, '....OSSssSSOOcO.'), (12, '...OOccccxyOOcO.'), (13, '..OcOcCcxyzOO...'), (14, '..OCOCcxyzCO....'), (15, '..OsOCxyzCCO....')],
          [(8, '...OrSssssSrO.sO'), (9, '...OSseSSesSO.sO'), (10, '...OSssssssSOcO.'), (11, '....OSSssSSOOcO.'), (12, '...OOccccxyOOO..'), (13, '..OcOcCcxyzOO...'), (14, '..OCOCcxyzCO....'), (15, '..OsOCxyzCCO....')]])

# Mario, Turrialba's cellar master: a red flat cap, a white handlebar moustache wider than his face, a leather apron, a mallet for the barrels
cast('mario', dict(skin('fair'), r='#F4F0E8', R='#D8D0C4', k='#C8302C', K='#8A2420', w='#F4F0E8', c='#F4E8C8', C='#DCCCA4', D='#B8A47C',
                   a='#8A5A34', A='#6A4228', p='#3E3A36', P='#2E2A26', b='#2E2018', t='#B88A50', T='#8A6234'),
     front=(piece([
         '................',
         '................',
         '................',
         '....OOOOOOOO....',
         '...OkkkkkkkkO...',
         '..OkkkkkkkkKkO..',
         '..OKKKKKKKKKKO..',
         '...OrSssssSrO...',
         '...OSssssssSO...',
         '...OSseSSesSO...',
         '..OwwwwwwwwwwO..',
         '..OwOSSssSSOwO..']), piece([
         '...OOcaaaacOO...',
         '..OcOcaAAacOcO..',
         '..OsOcaaaacOsO..',
         '..OsOCaaaaCOsO..',
         '...OOAaaaaAOO...',
         '....OaaaaaaO....',
         '....OAaaaaAO....'])),
     side=(piece([
         '................',
         '................',
         '................',
         '.....OOOOOOO....',
         '....OkkkkkkkO...',
         '....OkkkkkkkKO..',
         '....OKKKKKKKKKO.',
         '....OrrSssssSO..',
         '....OrSssssssO..',
         '....OrSsssseSO..',
         '....OrSsswwwwwO.',
         '.....OSSsssSOwO.']), piece([
         '.....OOcaaOO....',
         '....OcCcaOcO....',
         '....OCcaaOsO....',
         '....OCCaaOsO....',
         '.....OAaaaO.....',
         '.....OaaaaO.....',
         '.....OAaaAO.....'])),
     act=[[(8, '...OSssssssSOtO.'), (9, '...OSseSSesSOTtO'), (10, '..OwwwwwwwwwwOsO'), (11, '..OwOSSssSSOwOsO'), (12, '...OOcaaaacOOOcO'), (13, '..OcOcaAAacOOO..'), (14, '..OsOcaaaacO....'), (15, '..OsOCaaaaCO....')],
          [(13, '..OcOcaAAacOcO..'), (14, '..OsOcaaaacOsO..'), (15, '..OsOCaaaaCOsOO.'), (16, '...OOAaaaaAOtTtO'), (17, '....OaaaaaaOTtTO'), (18, '....OAaaaaAOOOO.')]],
     legs='trousers')

# Yuki, keeper of the Osaka garden's koi: short black hair under a white hachimaki, a navy happi coat, white tabi, a bowl of koi food
cast('yuki', dict(skin('light'), r='#1E1E22', R='#3A3A44', w='#F8F4EC', W='#D8D0C8', z='#C8302C', c='#2C3A80', C='#22306A', D='#182250', l='#F8F4EC',
                  p='#2A2A34', P='#1E1E26', b='#F4F0E8', t='#B8784A', T='#8A5430', u='#E8B060'),
     front=(piece([
         '................',
         '................',
         '................',
         '....OOOOOOOO....',
         '...OrrRrrRrrO...',
         '..OrrrrrrrrrrO..',
         '..OwwwwwwwwwwO..',
         '...OrRrrrrRrO...',
         '...OrSssssSrO...',
         '...OSseSSesSO...',
         '...OSssssssSO...',
         '....OSSssSSO....']), piece([
         '...OOccllccOO...',
         '..OcOcClCccOcO..',
         '..OCOCcClcCOCO..',
         '.OtOOCCClCCOsO..',
         '.OTtODDDDDDOO...',
         '..OOOcCccCcO....',
         '....OpPppPpO....'])),
     side=(piece([
         '................',
         '................',
         '................',
         '.....OOOOOOO....',
         '....OrrRrrRrO...',
         '...OrrrrrrrrrO..',
         '.OzOwwwwwwwwwO..',
         'OzOOrrrrrrrRrO..',
         '.O..OrrSssssSO..',
         '....OrSsssseSO..',
         '....OrSssssssO..',
         '.....OSSsssSO...']), piece([
         '.....OOcllOO....',
         '....OcClcOcO....',
         '....OCcClOCO....',
         '....OCCCCOsO....',
         '.....ODDDDO.....',
         '.....OcCccO.....',
         '.....OpPpPO.....'])),
     act=[[(11, '....OSSssSSO.u..'), (12, '...OOccllccOOOu.'), (13, '..OcOcClCccOcsOu'), (14, '..OCOCcClcCOO.O.'), (15, '.OtOOCCClCCO....')],
          [(10, '...OSssssssSO..u'), (11, '....OSSssSSO.u..'), (12, '...OOccllccOOOOu'), (13, '..OcOcClCccOccsO'), (14, '..OCOCcClcCOOOO.'), (15, '.OtOOCCClCCO....')]],
     legs='trousers')

# Rosa, the farm's mentor: a red bandana with white dots over a cloud of dark curls, an orange check shirt, denim overalls, a clipboard
cast('rosa', dict(skin('golden'), r='#3A2418', R='#5A3A28', k='#3E9A8A', K='#2A7466', n='#6CC0B0', c='#E8603A', C='#C0402C', D='#8A2A20', a='#F4B090',
                  p='#4A6A9A', P='#34507A', b='#5A3A2A', t='#B88A50', T='#F4F0E4', u='#3E2A1C'),
     front=(piece([
         '................',
         '................',
         '................',
         '.....OOOOOO.....',
         '....OknkkkkO.OO.',
         '..OOkkkkkkkkOkkO',
         '.OrKKKKKKKKKKOKO',
         'OrrRrrrrrrrrRrrO',
         'OrrOSssssssSOrrO',
         'OrrOSseSSesSOrrO',
         '.OrOSssssssSOrO.',
         '..OrOSSssSSOrO..']), piece([
         '...OOcppppcOO...',
         '..OcOcpPPpcOcO..',
         '.OtTOCppppCOaO..',
         '.OTtOCppppCOsO..',
         '.OsOOppppppOO...',
         '....OppppppO....',
         '....OpPppPpO....'])),
     side=(piece([
         '................',
         '................',
         '................',
         '......OOOOOO....',
         '.OO.OkkknkkkO...',
         'OkkOOkkkkkkkkO..',
         '.OKrKKKKKKKKKO..',
         'OrrrrRrrrrrrO...',
         'OrRrOrSssssSO...',
         '.OrrOrSsssseSO..',
         '..OOOrSssssssO..',
         '.....OSSsssSO...']), piece([
         '.....OOcppOO....',
         '....OcCppOcO....',
         '....OaCppOsO....',
         '....OCCppOsO....',
         '.....OppppO.....',
         '.....OppppO.....',
         '.....OpPpPO.....'])),
     act=[[(4, '....OknkkkkOOOsO'), (5, '..OOkkkkkkkkOOsO'), (6, '.OrKKKKKKKKKKOcO'), (7, 'OrrRrrrrrrrrRrcO'), (8, 'OrrOSssssssSOOcO'), (9, 'OrrOSseSSesSOOcO'), (12, '...OOcppppcOOcO.'), (13, '..OcOcpPPpcOO...'), (14, '.OtTOCppppCO....'), (15, '.OTtOCppppCO....')],
          [(13, '..OcOcpPPpcOcO..'), (14, '.OtTTTTtpCOsO...'), (15, '.OTttTTtOCOsuO..'), (16, '.OsOOppppppOOO..')]],
     legs='trousers')

# the regulars at the Osaka counter
# Kenji: neat grey hair, the indigo work jacket his gift cup is glazed to match, the chipped cup he swears by
cast('kenji', dict(skin('fair'), r='#A8A49C', R='#7E7A72', c='#2C3A80', C='#202C64', D='#141C44', l='#F4F0E4', p='#4A4A52', P='#36363E', b='#1E1E22',
                   t='#E8E0D0', T='#3E5A8A'),
     front=(piece([
         '................',
         '................',
         '................',
         '....OOOOOOOO....',
         '...OrrrrrRRrO...',
         '..OrrrrrRrrrrO..',
         '..OrrrrRrrrrrO..',
         '...OrRSSsssrO...',
         '...OrSssssSrO...',
         '...OSseSSesSO...',
         '...OSssssssSO...',
         '....OSSssSSO....']), piece([
         '...OOcllllcOO...',
         '..OcOcCllCcOcO..',
         '..OCOCcccCCOCO..',
         '..OsOCcccCCOsO..',
         '...OOcDDDDcOO...',
         '....OppppppO....',
         '....OpPppPpO....'])),
     side=(piece([
         '................',
         '................',
         '................',
         '.....OOOOOOO....',
         '....OrrrrrRRO...',
         '...OrrrrrRrrrO..',
         '...OrrrrRrrrrO..',
         '....OrrrRSsssO..',
         '....OrrSssssSO..',
         '....OrSsssseSO..',
         '....OrSssssssO..',
         '.....OSSsssSO...']), piece([
         '.....OOcllOO....',
         '....OcCclOcO....',
         '....OCcccOCO....',
         '....OCcccOsO....',
         '.....OcDDO......',
         '.....OppppO.....',
         '.....OpPpPO.....'])),
     act=[[(10, '...OSssssssSOO..'), (11, '....OSSssSSOtTO.'), (12, '...OOcllllcOtTO.'), (13, '..OcOcCllCcOsOO.'), (14, '..OCOCcccCCOcO..'), (15, '..OsOCcccCCOO...')],
          [(9, '...OSseSSesSO...'), (10, '...OSssssOtTO...'), (11, '....OSSssOtTsO..'), (12, '...OOcllllcOsOO.'), (13, '..OcOcCllCcOcO..'), (14, '..OCOCcccCCOO...'), (15, '..OsOCcccCCO....')]])

# Aya: a white beret on long dark hair, a lavender cardigan, a camera for every cup
cast('aya', dict(skin('light'), r='#3A2A24', R='#5A4034', h='#F8F4EC', H='#D8D0C8', c='#C8A8E8', C='#A888C8', D='#7E64A0', l='#F8F4EC',
                 p='#E8DCC0', P='#C8BC9C', x='#C8A8E8', b='#5A3A2A', v='#2A2A2E', V='#8A8A94', u='#FFFFFF'),
     front=(piece([
         '................',
         '................',
         '......OOOOO.....',
         '....OOhhhhhOO...',
         '...OhhhhhhhhHO..',
         '...OOHHHHHHHOO..',
         '..OrrrrrrrrrrO..',
         '..OrrRrrrrRrrO..',
         '..OrrSssssSrrO..',
         '..OrSseSSesSrO..',
         '..OrSssssssSrO..',
         '..ORrSSssSSrRO..']), piece([
         '..ORrOllllOrRO..',
         '..OrOcCllCcOrO..',
         '..OcOCcllcCOcO..',
         '..OsOCcllcCOsO..',
         '...OOCcllcCOO...',
         '...OppppppppO...',
         '..OPppPppPppPO..'])),
     side=(piece([
         '................',
         '................',
         '.......OOOOO....',
         '.....OOhhhhhOO..',
         '....OhhhhhhhhHO.',
         '....OOHHHHHHHO..',
         '...OrrrrrrrrrO..',
         '...OrrrrrrRrrO..',
         '...OrrrrSssssO..',
         '...OrRrSsssseSO.',
         '...ORrrSssssssO.',
         '...ORrROSSsssO..']), piece([
         '...ORrROclOO....',
         '...OrROcCOcO....',
         '....OCcclOCO....',
         '....OCcclOsO....',
         '.....OCclO......',
         '....OppppppO....',
         '....OpPppPPO....'])),
     act=[[(8, '..OrrSssssSrrO..'), (9, '..OrSOvvvvOSrO..'), (10, '..OrSvVvvVvSrO..'), (11, '..ORsOvvvvOsRO..'), (12, '..ORrOllllOrRO..'), (13, '..OrOcCllCcOrO..'), (14, '..OcOCcllcCOcO..'), (15, '..OOOCcllcCOOO..')],
          [(7, '..OrrRrrrrRrrOuO'), (8, '..OrrSssssSrrO.u'), (9, '..OrSOvvvvOSrO..'), (10, '..OrSvVvvVvSrO..'), (11, '..ORsOvvvvOsRO..'), (12, '..ORrOllllOrRO..'), (13, '..OrOcCllCcOrO..'), (14, '..OcOCcllcCOcO..'), (15, '..OOOCcllcCOOO..')]],
     legs='skirt')

# Mr Tanaka: a brown fedora, round glasses, a grey suit and a red tie, the notebook from his private tastings
cast('tanaka', dict(skin('fair'), r='#B8B4AC', h='#6A4A2C', H='#4E3420', k='#2E1E14', g='#C8E0F0', c='#8A8E96', C='#6A6E76', D='#4A4E56', l='#F4F0E4', x='#A82C28',
                    p='#6A6E76', P='#4A4E56', b='#1E1E22', t='#2E3A2E', T='#F4F0E4'),
     front=(piece([
         '................',
         '................',
         '.....OOOOOO.....',
         '....OhhHHhhO....',
         '....OhhhhhhO....',
         '....OkkkkkkO....',
         '..OOhhhhhhhhOO..',
         '.OhhhhhhhhhhhhO.',
         '..OOrSssssSrOO..',
         '...OSgeggegSO...',
         '...OSssssssSO...',
         '....OSSssSSO....']), piece([
         '...OOclxxlcOO...',
         '..OcOcCxxCcOcO..',
         '..OCOCcxxcCOCO..',
         '..OsOCcCxCcOsO..',
         '...OODDDDDDOO...',
         '....OppppppO....',
         '....OpPppPpO....'])),
     side=(piece([
         '................',
         '................',
         '......OOOOOO....',
         '.....OhhHHhhO...',
         '.....OhhhhhhO...',
         '.....OkkkkkkO...',
         '...OOhhhhhhhhOO.',
         '..OhhhhhhhhhhhhO',
         '...OOrrSssssSO..',
         '....OrSssgegSO..',
         '....OrSssssssO..',
         '.....OSSsssSO...']), piece([
         '.....OOclxOO....',
         '....OcCcxOcO....',
         '....OCcccOCO....',
         '....OCcccOsO....',
         '.....ODDDDO.....',
         '.....OppppO.....',
         '.....OpPpPO.....'])),
     act=[[(13, '..OcOcCxxCcOcO..'), (14, '..OCOtTTTtCOsO..'), (15, '..OsOtTTTtsOO...'), (16, '...OODtttDDOO...')],
          [(13, '..OcOcCxxCcOcO..'), (14, '..OCOtTTTtCOsO..'), (15, '..OsOtTTTtCOsO..'), (16, '...OODtttDsOO...')]],
     legs='trousers')

# Mika: a fisherman's daughter in a yellow raincoat, a red knit beanie with a white pompom, green rubber boots, waving big
cast('mika', dict(skin('tan'), r='#5A3A28', R='#7A5238', k='#D84A36', K='#A8302A', n='#F4F0E8', c='#F8D870', C='#D8B048', D='#8A6820',
                  p='#3A4A5A', P='#2A3644', b='#2E5A3A', B='#1E4028'),
     front=(piece([
         '................',
         '................',
         '.......OO.......',
         '......OnnO......',
         '....OOkkkkOO....',
         '...OkKkKkKkkO...',
         '...OnnnnnnnnO...',
         '..OrrrrrrrrrrO..',
         '..OrrSssssSrrO..',
         '..OrSseSSesSrO..',
         '..OrSssssssSrO..',
         '..ORrSSssSSrRO..']), piece([
         '...OOccccccOO...',
         '..OcOccDDccOcO..',
         '..OCOcccccCOCO..',
         '..OsOccDDccOsO..',
         '...OOcccccCOO...',
         '....OcCccCcO....',
         '....OCCCCCCO....'])),
     side=(piece([
         '................',
         '................',
         '........OO......',
         '.......OnnO.....',
         '.....OOkkkkOO...',
         '....OkKkKkKkkO..',
         '....OnnnnnnnnO..',
         '...OrrrrrrrrrO..',
         '...OrrrrSssssO..',
         '...OrRrSsssseSO.',
         '...ORrrSssssssO.',
         '....ORrOSSsssO..']), piece([
         '.....OOcccOO....',
         '....OcCDcOcO....',
         '....OCcccOCO....',
         '....OCcDcOsO....',
         '.....OcccO......',
         '....OcCccCO.....',
         '....OCCCCCO.....'])),
     act=[[(5, '...OkKkKkKkkOOsO'), (6, '...OnnnnnnnnOsO.'), (7, '..OrrrrrrrrrrOcO'), (8, '..OrrSssssSrrOcO'), (9, '..OrSseSSesSrOcO'), (10, '..OrSssssssSrOcO'), (11, '..ORrSSssSSrROcO'), (12, '...OOccccccOOOO.'), (13, '..OcOccDDccOO...'), (14, '..OCOcccccCO....'), (15, '..OsOccDDccO....')],
          [(4, '....OOkkkkOO.OsO'), (5, '...OkKkKkKkkOOcO'), (6, '...OnnnnnnnnOcO.'), (7, '..OrrrrrrrrrrOcO'), (8, '..OrrSssssSrrOcO'), (9, '..OrSseSSesSrOcO'), (10, '..OrSssssssSrOcO'), (11, '..ORrSSssSSrROcO'), (12, '...OOccccccOOOO.'), (13, '..OcOccDDccOO...'), (14, '..OCOcccccCO....'), (15, '..OsOccDDccO....')]],
     legs='boots')

# Sora: a gardener in a blue bucket hat and a green work jacket, gloves on, carrying a seedling she grew from your cherries
cast('sora', dict(skin('medium'), r='#2E1E18', R='#4A3428', h='#4A8AB8', H='#306898', k='#1E4A70', c='#6CB86A', C='#4A9848', D='#2E6A2E', x='#E8D8A8',
                  p='#8A7A5A', P='#6A5A3E', b='#5A3A2A', t='#C8784A', T='#9A5430', u='#7ED05A', U='#3E8A2E'),
     front=(piece([
         '................',
         '................',
         '................',
         '.....OOOOOO.....',
         '....OhhhhhhO....',
         '...OhhhhhhhhO...',
         '..OHHHHHHHHHHO..',
         '.OHHkkkkkkkkHHO.',
         '..OOrSssssSrOO..',
         '...OSseSSesSO...',
         '...OSssssssSO...',
         '....OSSssSSO....']), piece([
         '...OOccDDccOO...',
         '..OcOcCDDCcOcO..',
         '..OCOCcDDcCOCO..',
         '..OxOCCDDCCOxO..',
         '...OODDDDDDOO...',
         '....OppppppO....',
         '....OpPppPpO....'])),
     side=(piece([
         '................',
         '................',
         '................',
         '......OOOOOO....',
         '.....OhhhhhhO...',
         '....OhhhhhhhhO..',
         '...OHHHHHHHHHHO.',
         '..OHHkkkkkkkkHHO',
         '..OrOOrSssssSO..',
         '.OrRO.OrSsseSO..',
         '..OO..OrSssssO..',
         '......OSSsssSO..']), piece([
         '.....OOcDcOO....',
         '....OcCDcOcO....',
         '....OCcDcOCO....',
         '....OCCDCOxO....',
         '.....ODDDDO.....',
         '.....OppppO.....',
         '.....OpPpPO.....'])),
     act=[[(11, '....OSSssSSO....'), (12, '...OOcOuUOcOO...'), (13, '..OcOcOUuOcOcO..'), (14, '..OCOOtTTtOOCO..'), (15, '..OxOxtttTxOxO..'), (16, '...OODOttODOO...')],
          [(9, '...OSseSSesSO...'), (10, '...OSsOuUOsSO...'), (11, '....OSOUuOSO....'), (12, '...OOcxtTTxcOO...'[:16]), (13, '..OcOcOttOcOcO..'), (14, '..OCOCcDDcCOCO..'), (15, '..OcOCCDDCCOcO..')]],
     legs='trousers')

# ---------------- staff and customers ----------------
# The barista and the till wear the aprons you buy in the Shop: their apron is c/C/D, the game recolours it.
# The head roaster: a brown headband, a short beard, rolled sleeves, a leather apron, a towel on his shoulder; he sniffs a sample
cast('roaster', dict(skin('fair'), r='#3A2A20', R='#5A4434', h='#8A5A34', H='#6A4228', l='#F4F0E4', L='#D8D0BC', w='#FFFFFF',
                     a='#7A5030', A='#5A3820', p='#3A3632', P='#2A2622', b='#2E2018', t='#C8C8C8', T='#8A6A4A'),
     front=(piece([
         '................',
         '................',
         '................',
         '....OOOOOOOO....',
         '...OrrrrrrrrO...',
         '..OrrRrrrrRrrO..',
         '..OhhhhhhhhhhO..',
         '...OrHrrrrHrO...',
         '...OrSssssSrO...',
         '...OSseSSesSO...',
         '...OrSssssSrO...',
         '....OrrRRrrO....']), piece([
         '...OwlaaaalOO...',
         '..OlOwaAAalOlO..',
         '..OsOlaaaalOsO..',
         '..OsOLaaaaLOsO..',
         '...OOAaaaaAOO...',
         '....OaaaaaaO....',
         '....OAaaaaAO....'])),
     side=(piece([
         '................',
         '................',
         '................',
         '.....OOOOOOO....',
         '....OrrrrrrrO...',
         '...OrrrrrrRrrO..',
         '..OhhhhhhhhhhO..',
         '.OhOrrrrrrHrO...',
         '..O.OrrSssssSO..',
         '....OrSsssseSO..',
         '....OrrSssssSO..',
         '.....OrrrrrrO...']), piece([
         '.....OOwaaOO....',
         '....OlLwaOlO....',
         '....OLlaaOsO....',
         '....OLLaaOsO....',
         '.....OAaaaO.....',
         '.....OaaaaO.....',
         '.....OAaaAO.....'])),
     act=[[(9, '...OSseSSesSOtO.'), (10, '...OrSssssSrOTO.'), (11, '....OrrRRrrOsO..'), (12, '...OwlaaaalOOlO.'), (13, '..OlOwaAAalOO...'), (14, '..OsOlaaaalO....'), (15, '..OsOLaaaaLO....')],
          [(9, '...OSsSSSSsSOtO.'), (10, '...OrSssssSrOTO.'), (11, '....OrrRRrrOsO..'), (12, '...OwlaaaalOOlO.'), (13, '..OlOwaAAalOO...'), (14, '..OsOlaaaalO....'), (15, '..OsOLaaaaLO....')]])

# the barista: a black bob under a white bandana, a white shirt, the house apron
cast('barista', dict(skin('light'), r='#1E1E22', R='#3A3A44', h='#F8F4EC', H='#D8D0C8', k='#A89C84', l='#F4F0E4', L='#D8D0BC',
                     c='#5A5A5A', C='#3E3E3E', D='#2A2A2A', p='#2A2A30', P='#1E1E24', b='#1E1E22', t='#E8E0D0', T='#6A4A2C'),
     front=(piece([
         '................',
         '................',
         '................',
         '....OOOOOOOO....',
         '...OhhhhhhhhO...',
         '..OhhHhhhhHhhO..',
         '..OrrrrrrrrrrO..',
         '..OrRrrrrrrRrO..',
         '..OrrSssssSrrO..',
         '..OrSseSSesSrO..',
         '..OrSssssssSrO..',
         '..ORrSSssSSrRO..']), piece([
         '...OOlcccclOO...',
         '..OlOlcCCclOlO..',
         '..OsOlccccLOsO..',
         '..OsOLccccLOsO..',
         '...OODccccDOO...',
         '....OccccccO....',
         '....OCccccCO....'])),
     side=(piece([
         '................',
         '................',
         '................',
         '.....OOOOOOO....',
         '....OhhhhhhhO...',
         '...OhhhhhhHhhO..',
         '...OrrrrrrrrrO..',
         '...OrrrrrrRrrO..',
         '...OrrrrSssssO..',
         '...OrRrSsssseSO.',
         '...ORrrSssssssO.',
         '....ORrOSSsssO..']), piece([
         '.....OOlccOO....',
         '....OlLccOlO....',
         '....OLlccOsO....',
         '....OLLccOsO....',
         '.....ODccO......',
         '.....OccccO.....',
         '.....OCccCO.....'])),
     act=[[(13, '..OlOlcCCclOlO..'), (14, '..OsOlccccLOsOO.'), (15, '..OsOLccccLOtTTO'), (16, '...OODccccDOOtO.')],
          [(13, '..OlOlcCCclOlOO.'), (14, '..OsOlccccLOsTTO'), (15, '..OsOLccccLOOtO.'), (16, '...OODccccDOO...')]])

# the till: a lanky lad in a cap with glasses, a white shirt and the house apron
cast('till', dict(skin('tan'), r='#2E1E18', R='#4A3428', h='#3E2A1C', H='#2E1E14', k='#1E140C', g='#C8E0F0', l='#F4F0E4', L='#D8D0BC',
                  c='#4A8E66', C='#2D6A46', D='#1E4A30', p='#3A3A44', P='#2A2A34', b='#1E1E22'),
     front=(piece([
         '................',
         '................',
         '................',
         '....OOOOOOOO....',
         '...OhhhhhhhhO...',
         '...OhHhhhhHhO...',
         '..OkkkkkkkkkkO..',
         '...OrSssssSrO...',
         '...OSssssssSO...',
         '...OSgeggegSO...',
         '...OSssssssSO...',
         '....OSSssSSO....']), piece([
         '...OOlcccclOO...',
         '..OlOlcCCclOlO..',
         '..OsOlccccLOsO..',
         '..OsOLccccLOsO..',
         '...OODccccDOO...',
         '....OccccccO....',
         '....OCccccCO....'])),
     side=(piece([
         '................',
         '................',
         '................',
         '.....OOOOOOO....',
         '....OhhhhhhhO...',
         '....OhHhhhhhhO..',
         '....OhhhhkkkkkkO',
         '....OrrSssssSOO.',
         '....OrSssssssO..',
         '....OrSssgegSO..',
         '....OrSssssssO..',
         '.....OSSsssSO...']), piece([
         '.....OOlccOO....',
         '....OlLccOlO....',
         '....OLlccOsO....',
         '....OLLccOsO....',
         '.....ODccO......',
         '.....OccccO.....',
         '.....OCccCO.....'])),
     act=[])

# the foreman: a green cap, a moustache, a white shirt, a clipboard for the day's picking
cast('foreman', dict(skin('medium'), r='#2E1E18', h='#3E5A48', H='#2D4A3A', k='#1E3428', c='#F4F0E4', C='#D8D0BC', D='#A89C84',
                     p='#8A7A5A', P='#6A5A3E', b='#3E2A1C', t='#3E2A1C', T='#F8F4EC'),
     front=(piece([
         '................',
         '................',
         '................',
         '....OOOOOOOO....',
         '...OhhhhhhhhO...',
         '...OhHhhhhHhO...',
         '..OkkkkkkkkkkO..',
         '...OrSssssSrO...',
         '...OSssssssSO...',
         '...OSseSSesSO...',
         '...OSrrrrrrSO...',
         '....OSSssSSO....']), piece([
         '...OOccccccOO...',
         '..OcOcCccCcOcO..',
         '..OCOCcccCCOtTO.',
         '..OsOCCCCCCOTsO.',
         '...OODDDDDDOOOO.',
         '....OppppppO....',
         '....OpPppPpO....'])),
     side=(piece([
         '................',
         '................',
         '................',
         '.....OOOOOOO....',
         '....OhhhhhhhO...',
         '....OhHhhhhhhO..',
         '....OhhhhkkkkkkO',
         '....OrrSssssSOO.',
         '....OrSssssssO..',
         '....OrSsssseSO..',
         '....OrSssrrrrO..',
         '.....OSSsssSO...']), piece([
         '.....OOcccOO....',
         '....OcCccOtTO...',
         '....OCcccOTsO...',
         '....OCCCCOOO....',
         '.....ODDDDO.....',
         '.....OppppO.....',
         '.....OpPpPO.....'])),
     act=[])

# the roastery's buyers, one look for each kind of shop
cast('g_cafe', dict(skin('fair'), r='#7A4A2A', R='#5A3420', h='#5A4A8A', H='#463A70', k='#2E2650', c='#F2C04A', C='#D8A030', D='#A87818',
                    l='#E8DCC0', L='#C8BC9C', p='#4A5A7A', P='#36445E', b='#F4F0E8'),
     front=(piece([
         '................',
         '................',
         '.....OOOOOO.....',
         '....OhhkhhhO....',
         '...OhhhhkhhhO...',
         '...OHHHHHHHHO...',
         '..OrrrrrrrrrrO..',
         '..OrrRrrrrRrrO..',
         '..OrrSssssSrrO..',
         '...OSseSSesSO...',
         '...OSssssssSO...',
         '....OSSssSSO....']), piece([
         '...OOcCCCCcOO...',
         '..OcOcccccCOlO..',
         '..OCOcccccCOLO..',
         '..OsOCCCCCCOlLO.',
         '...OODDDDDDOLLO.',
         '....OppppppOOO..',
         '....OpPppPpO....'])),
     side=(piece([
         '................',
         '................',
         '......OOOOOO....',
         '.....OhhkhhhO...',
         '....OhhhhkhhhO..',
         '....OHHHHHHHHO..',
         '...OrrrrrrrrrO..',
         '...OrrrrrrRrrO..',
         '...OrrrrSssssO..',
         '....OrSsssseSO..',
         '....OrSssssssO..',
         '.....OSSsssSO...']), piece([
         '.....OOcCCOO....',
         '...OlOccCOcO....',
         '...OLOcccOCO....',
         '...OlLCCCOsO....',
         '...OLLDDDO......',
         '....OOppppO.....',
         '.....OpPpPO.....'])),
     act=[])
cast('g_kissa', dict(skin('fair'), r='#C8C4BC', R='#9A968E', h='#3E2A1C', H='#2E1E14', k='#1E140C', c='#F4F0E4', C='#D8D0BC', D='#A89C84',
                     v='#2A2A2E', V='#3E3E44', x='#8A2420', p='#2A2A30', P='#1E1E24', b='#1E1E22'),
     front=(piece([
         '................',
         '................',
         '................',
         '....OOOOOOOO....',
         '...OhhhhhhhhO...',
         '..OhhHhhhhHhhO..',
         '..OkkkkkkkkkkO..',
         '...OrSssssSrO...',
         '...OSssssssSO...',
         '...OSseSSesSO...',
         '...OSssssssSO...',
         '....OSSssSSO....']), piece([
         '...OOvcxxcvOO...',
         '..OcOvVccVvOcO..',
         '..OCOvVccVvOCO..',
         '..OsOvVVVVvOsO..',
         '...OOvvvvvvOO...',
         '....OppppppO....',
         '....OpPppPpO....'])),
     side=(piece([
         '................',
         '................',
         '................',
         '.....OOOOOOO....',
         '....OhhhhhhhO...',
         '...OhhHhhhhhhO..',
         '...OkkkkkkkkkkO.',
         '....OrrSssssSO..',
         '....OrSssssssO..',
         '....OrSsssseSO..',
         '....OrSssssssO..',
         '.....OSSsssSO...']), piece([
         '.....OOvcxOO....',
         '....OcVvcOcO....',
         '....OCVvvOCO....',
         '....OCVvvOsO....',
         '.....OvvvO......',
         '.....OppppO.....',
         '.....OpPpPO.....'])),
     act=[])
cast('g_konbini', dict(skin('golden'), r='#2E1E18', h='#4878C8', H='#305898', k='#203C68', c='#78A8E8', C='#4878C8', D='#305898', l='#F4F0E4',
                       p='#2A2A34', P='#1E1E26', b='#F4F0E8'),
     front=(piece([
         '................',
         '................',
         '................',
         '....OOOOOOOO....',
         '...OhhhhhhhhO...',
         '...OhHhhhhHhO...',
         '..OkkkkkkkkkkO..',
         '...OrSssssSrO...',
         '...OSssssssSO...',
         '...OSseSSesSO...',
         '...OSssssssSO...',
         '....OSSssSSO....']), piece([
         '...OOclllclOO...',
         '..OcOcClCClOcO..',
         '..OlOlCClClOlO..',
         '..OsOClClCCOsO..',
         '...OODDDDDDOO...',
         '....OppppppO....',
         '....OpPppPpO....'])),
     side=(piece([
         '................',
         '................',
         '................',
         '.....OOOOOOO....',
         '....OhhhhhhhO...',
         '....OhHhhhhhhO..',
         '....OhhhhkkkkkkO',
         '....OrrSssssSOO.',
         '....OrSssssssO..',
         '....OrSsssseSO..',
         '....OrSssssssO..',
         '.....OSSsssSO...']), piece([
         '.....OOclcOO....',
         '....OcClCOcO....',
         '....OlClCOlO....',
         '....OClCCOsO....',
         '.....ODDDDO.....',
         '.....OppppO.....',
         '.....OpPpPO.....'])),
     act=[])
cast('g_guest', dict(skin('fair'), r='#C89058', R='#A87038', h='#F4DE9C', H='#D8BC70', k='#A88C48', v='#2A2A2E', c='#E86A3A', C='#C84E28', D='#963A1C', a='#F8D870',
                     p='#C8B48A', P='#A89468', b='#5A3A2A', t='#3E5A8A', T='#2A3E66'),
     front=(piece([
         '................',
         '................',
         '.....OOOOOO.....',
         '....OhhhhhhO....',
         '....OhhHhhhO....',
         '...OkkkkkkkkO...',
         '.OOhhhhhhhhhhOO.',
         'OhhhhHHHHHHhhhhO',
         '.OOOrSssssSrOOO.',
         '...OvvvSSvvvO...',
         '...OSssssssSO...',
         '....OSSssSSO....']), piece([
         '...OOccaaccOO...',
         '..OcOtcccctOcO..',
         '..OCOtcaccTOCO..',
         '..OsOTCCCCTOsO..',
         '...OODDDDDDOO...',
         '...OppppppppO...',
         '...OpPppppPpO...'])),
     side=(piece([
         '................',
         '................',
         '......OOOOOO....',
         '.....OhhhhhhO...',
         '.....OhhHhhhO...',
         '....OkkkkkkkkO..',
         '..OOhhhhhhhhhhOO',
         '.OhhhhHHHHHHhhhO',
         '..OOOrrSssssSOO.',
         '....OrSssvvvSO..',
         '....OrSssssssO..',
         '.....OSSsssSO...']), piece([
         '....OOccaaOO....',
         '...OtTcccOcO....',
         '...OTtcacOCO....',
         '...OTtCCCOsO....',
         '....OODDDDO.....',
         '....OpppppO.....',
         '....OpPppPO.....'])),
     act=[], legs='shorts')


def build(cid):
    d = CAST[cid]
    pal, legs = d['pal'], LEGS[d['legs']]
    fh, ft = d['front']
    sh, st = d['side']
    for f in range(3):
        add('%s_down_%d' % (cid, f), figure(fh, ft, legs, f), pal)
    for f in range(2):
        add('%s_side_%d' % (cid, f), figure(sh, st, legs, f, side=True), pal)
    bk = d['back'] or ('r' if 'r' in pal else 'S')
    for f in range(3):
        add('%s_up_%d' % (cid, f), back_view(figure(fh, ft, legs, f), bk), pal)
    stand = figure(fh, ft, legs, 0)
    add('%s_blink' % cid, blink(stand), pal)
    for i, patch in enumerate(d['act']):
        a = stand.copy()
        for (y, row) in patch:
            for x, k in enumerate(row):
                a.put(x, y, k) if k != '.' else a.px.pop((x, y), None)
        add('%s_act_%d' % (cid, i), a, pal)


for cid in CAST:
    build(cid)


# ---------------- portraits: 32x32 busts for the cards, one per mood ----------------
PW = 32
MOODS = ['idle', 'happy', 'surprised', 'worried']
PT = {}   # cid -> (paint function, extra palette)


def ell(c, cx, cy, rx, ry, k, keep=None):
    for y in range(c.h):
        for x in range(c.w):
            if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 and (keep is None or c.px.get((x, y)) in keep):
                c.put(x, y, k)


def box(c, x0, y0, w, h, k):
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            c.put(x, y, k)


def face_shape(x, y):   # the head: an oval with a soft jaw, centred between x 15 and 16
    if y < 5 or y > 23:
        return False
    rx = 8.4 if y < 17 else 8.4 - (y - 17) * 0.95
    return ((x - 15.5) / rx) ** 2 + ((y - 14.5) / 9.6) ** 2 <= 1 if y < 17 else abs(x - 15.5) <= rx


def bust(c, neckline='round'):   # shoulders in the top's colours, the neck, the face with a shaded right side, ears
    for y in range(25, 32):
        half = 6 + min(y - 25, 3) * 3 + max(0, y - 28)
        for x in range(32):
            if abs(x - 15.5) <= half + 0.5:
                c.put(x, y, 'C' if x > 15.5 + half - 3 else 'c')
    for y in range(21, 27):
        for x in range(13, 19):
            c.put(x, y, 'S' if y < 24 else 's')
    if neckline == 'v':
        for i, y in enumerate(range(25, 30)):
            for x in range(13 + i // 2, 19 - i // 2):
                c.put(x, y, 's')
    for y in range(5, 24):
        for x in range(32):
            if face_shape(x, y):
                c.put(x, y, 's')
    for (x, y), k in list(c.px.items()):   # shade: the right edge and under the jaw
        if k == 's' and 5 <= y <= 23 and (not face_shape(x + 1, y) or not face_shape(x, y + 2)):
            c.put(x, y, 'S')
    for ex in (6, 25):   # ears
        for y in range(14, 18):
            c.put(ex, y, 's' if ex == 6 else 'S')
    c.put(7, 15, 'S'); c.put(24, 15, 'S')


def features(c, mood, eye_y=15, mouth_y=20, brow=None, glasses=False, lashes=False):
    L, R = (11, 19)
    brow = brow or 'B'
    if mood == 'happy':
        for x0 in (L, R):
            c.put(x0 - 1, eye_y + 1, 'e'); c.put(x0, eye_y, 'e'); c.put(x0 + 1, eye_y, 'e'); c.put(x0 + 2, eye_y + 1, 'e')
    else:
        tall = 3 if mood == 'surprised' else 2
        for x0 in (L, R):
            for dy in range(tall):
                c.put(x0, eye_y - (1 if mood == 'surprised' else 0) + dy, 'e'); c.put(x0 + 1, eye_y - (1 if mood == 'surprised' else 0) + dy, 'e')
            c.put(x0, eye_y - (1 if mood == 'surprised' else 0), 'y')
    if lashes:
        c.put(L - 1, eye_y - 1, 'e'); c.put(R + 2, eye_y - 1, 'e')
    by = eye_y - 3 - (1 if mood == 'surprised' else 0)
    if mood == 'worried':
        for (x, y) in ((L - 1, by + 1), (L, by + 1), (L + 1, by), (L + 2, by - 1), (R - 1, by - 1), (R, by), (R + 1, by + 1), (R + 2, by + 1)):
            c.put(x, y, brow)
    else:
        for x in range(L - 1, L + 3):
            c.put(x, by, brow)
        for x in range(R - 1, R + 3):
            c.put(x, by, brow)
    c.put(15, eye_y + 3, 'S'); c.put(16, eye_y + 3, 'S')   # the nose
    if glasses == 'half':   # half-moon reading glasses, low on the nose
        for x0 in (L - 2, R - 2):
            for x in range(x0 + 1, x0 + 5):
                c.put(x, eye_y + 2, 'v')
            c.put(x0, eye_y + 1, 'v'); c.put(x0 + 5, eye_y + 1, 'v')
        c.put(14, eye_y + 1, 'v'); c.put(17, eye_y + 1, 'v'); c.put(15, eye_y, 'v'); c.put(16, eye_y, 'v')
    elif glasses:   # round frames
        for x0 in (L - 2, R - 2):
            for x in range(x0 + 1, x0 + 5):
                c.put(x, eye_y - 2, 'v'); c.put(x, eye_y + 2, 'v')
            for y in range(eye_y - 1, eye_y + 2):
                c.put(x0, y, 'v'); c.put(x0 + 5, y, 'v')
        c.put(14, eye_y - 1, 'v'); c.put(15, eye_y - 1, 'v'); c.put(16, eye_y - 1, 'v'); c.put(17, eye_y - 1, 'v')
    m = mouth_y
    if mood == 'idle':
        c.put(13, m, 'm'); c.put(18, m, 'm')
        for x in range(14, 18):
            c.put(x, m + 1, 'm')
    elif mood == 'happy':
        for x in range(13, 19):
            c.put(x, m, 'm')
        for x in range(14, 18):
            c.put(x, m + 1, 'M')
        c.put(14, m + 1, 'T'); c.put(15, m + 1, 'T'); c.put(16, m + 1, 'T')
        c.put(14, m + 2, 'm'); c.put(15, m + 2, 'm'); c.put(16, m + 2, 'm'); c.put(17, m + 2, 'm')
    elif mood == 'surprised':
        for (x, y) in ((15, m), (16, m), (14, m + 1), (17, m + 1), (15, m + 2), (16, m + 2)):
            c.put(x, y, 'm')
        c.put(15, m + 1, 'M'); c.put(16, m + 1, 'M')
    else:
        c.put(13, m + 1, 'm'); c.put(14, m, 'm'); c.put(15, m, 'm'); c.put(16, m, 'm'); c.put(17, m, 'm'); c.put(18, m + 1, 'm')
    if mood in ('idle', 'happy'):
        for x in (9, 10, 21, 22):
            c.put(x, eye_y + 3, 'q')


FACE_PAL = {'y': '#FFFFFF', 'm': '#8A3A2E', 'M': '#5A1E18', 'T': '#FFFFFF'}


def portrait(cid, mood):
    paint, pal = PT[cid]
    c = Canvas(PW, PW)
    paint(c, mood)
    c.outline()
    return c, dict(CAST[cid]['pal'], **FACE_PAL, **pal)


def blush(sk):   # a warmer tint of the skin for the cheeks
    v = [int(sk[i:i + 2], 16) for i in (1, 3, 5)]
    return '#%02X%02X%02X' % (min(255, v[0] + 18), max(0, v[1] - 14), max(0, v[2] - 10))


def pt(cid, **pal):
    def deco(fn):
        sk = CAST[cid]['pal']['s']
        PT[cid] = (fn, dict({'q': blush(sk), 'B': '#2E1E18'}, **pal))
        return fn
    return deco


@pt('ama', B='#2A1A14')
def _(c, mood):
    bust(c, 'v')
    for y in range(25, 32):   # the coat's lapels and the white shirt
        for x in range(32):
            if (x, y) in c.px and c.px[(x, y)] in 'cC' and abs(x - 15.5) < 2 + (y - 25) * 0.6:
                c.put(x, y, 'l')
    for (x, y) in ((11, 28), (20, 28), (11, 30), (20, 30)):
        c.put(x, y, 'g')
    for y in (26, 27):
        for x in list(range(3, 8)) + list(range(24, 29)):
            c.put(x, y, 'g')
    for y in range(9, 14):   # grey hair at the temples
        for x in (7, 8, 23, 24):
            c.put(x, y, 'r' if x in (8, 23) else 'R')
    ell(c, 15.5, 4.5, 11, 4.6, 'h')   # the cap: a white crown, wider than the head
    for x in range(5, 27):
        for y in range(4, 7):
            if (x, y) in c.px and c.px[(x, y)] == 'h' and x > 21:
                c.put(x, y, 'H')
    box(c, 7, 6, 18, 3, 'k')
    box(c, 14, 6, 4, 3, 'g'); c.put(15, 7, 'G'); c.put(16, 7, 'G')
    for x in range(8, 24):
        c.put(x, 9, 'v')
    for x in range(10, 22):
        c.put(x, 10, 'v')
    features(c, mood, eye_y=15)
    for y in (18, 19, 20):   # gold hoops
        c.put(5, y, 'g'); c.put(26, y, 'g')
    c.put(6, 21, 'g'); c.put(25, 21, 'g')


@pt('pearl', B='#6A6660', v='#B8903A')
def _(c, mood):
    bust(c)
    for y in range(25, 28):   # a white Peter Pan collar
        for x in range(9, 23):
            if (x, y) in c.px and c.px[(x, y)] in 'cC' and (y < 27 or abs(x - 15.5) > 2):
                c.put(x, y, 'l')
    for (x, y) in ((5, 29), (9, 30), (24, 29), (27, 31), (12, 31), (20, 30)):
        c.put(x, y, 'a')
    for y in range(10, 19):   # silver hair, swept back under the hat
        for x in (6, 7, 24, 25):
            c.put(x, y, 'r' if x in (7, 24) else 'R')
    ell(c, 15.5, 5, 7.5, 5, 'h')   # the crown
    for x in range(0, 32):   # the wide brim, drooping at the ends
        y = 9 + (1 if abs(x - 15.5) > 11 else 0) + (1 if abs(x - 15.5) > 14 else 0)
        c.put(x, y, 'h'); c.put(x, y - 1, 'h' if abs(x - 15.5) < 15 else 'H'); c.put(x, y + 1, 'H')
    box(c, 9, 6, 14, 2, 'k')
    for (x, y) in ((20, 5), (22, 5), (21, 4), (21, 6)):
        c.put(x, y, 'n')
    c.put(21, 5, 'a')
    features(c, mood, eye_y=15, glasses='half')


@pt('kimo', B='#E8E4DC')
def _(c, mood):
    bust(c, 'v')
    for (x, y) in ((6, 27), (9, 29), (5, 31), (22, 28), (26, 30), (24, 26), (11, 31)):   # hibiscus on the aloha shirt
        c.put(x, y, 'a'); c.put(x + 1, y, 'a'); c.put(x, y + 1, 'a')
    for y in range(10, 15):
        for x in (7, 24):
            c.put(x, y, 'r')
    ell(c, 15.5, 6.0, 8.0, 4.5, 'h')   # the lauhala crown and its woven rows
    for y in range(2, 9):
        for x in range(32):
            if c.px.get((x, y)) == 'h' and (x + y) % 3 == 0:
                c.put(x, y, 'H')
    box(c, 8, 7, 16, 2, 'k')
    for x in range(4, 28):
        c.put(x, 9, 'h' if abs(x - 15.5) < 11 else 'H')
    features(c, mood, eye_y=15, mouth_y=21, brow='w')
    for x in range(10, 22):   # a white walrus moustache over the mouth
        c.put(x, 19, 'w')
        if 11 < x < 20:
            c.put(x, 20, 'w')


@pt('rosa', B='#2A1810')
def _(c, mood):
    for (cx, cy, r) in ((5, 12, 4), (4, 18, 4), (6, 23, 3), (26, 12, 4), (27, 18, 4), (25, 23, 3), (8, 7, 4), (23, 7, 4), (15.5, 5, 6)):   # a cloud of curls behind
        ell(c, cx, cy, r, r, 'r')
    for (cx, cy) in ((4, 11), (27, 17), (6, 22), (24, 8), (9, 6)):
        c.put(cx, cy, 'R'); c.put(cx + 1, cy, 'R')
    bust(c, 'v')
    for y in range(25, 32):   # denim straps over the check shirt
        for x in (10, 11, 20, 21):
            c.put(x, y, 'p')
        c.put(11, y, 'P'); c.put(21, y, 'P')
    for (x, y) in ((5, 28), (7, 30), (25, 28), (27, 30), (14, 30), (17, 30)):
        c.put(x, y, 'a')
    ell(c, 15.5, 6.5, 9, 3.6, 'k')   # the teal bandana and its knot
    for x in range(7, 25):
        c.put(x, 9, 'K')
    for (x, y) in ((26, 7), (27, 6), (28, 7), (27, 8), (28, 9), (29, 10)):
        c.put(x, y, 'k')
    for x in range(8, 24):   # curls on the forehead
        if x % 3 != 0:
            c.put(x, 10, 'r')
    for (x, y) in ((25, 12), (25, 13), (25, 14)):   # the pencil behind her ear
        c.put(x, y, 't')
    c.put(25, 11, 'T')
    features(c, mood, eye_y=15)


@pt('lise', B='#3A2418')
def _(c, mood):
    bust(c)
    for (x, y) in ((8, 27), (22, 27)):
        c.put(x, y, 'C')
    for y in range(0, 11):   # the madras headwrap, tall, in red and yellow check
        for x in range(32):
            if ((x - 15.5) / (9.5 if y > 4 else 7.5)) ** 2 + ((y - 7.5) / 8.5) ** 2 <= 1:
                c.put(x, y, 'k' if (y % 3 == 0 or x % 4 == 1) else 'h')
    for x in range(7, 25):
        c.put(x, 10, 'H')
    for (x, y) in ((14, 0), (15, 0), (16, 0), (17, 0), (13, 1), (18, 1)):
        c.put(x, y, 'k')
    features(c, mood, eye_y=15)
    for (x, y) in ((5, 18), (5, 19), (26, 18), (26, 19)):
        c.put(x, y, 'g')


@pt('wayan', B='#1E1A18', n='#FFF8E0', a='#F2C838')
def _(c, mood):
    bust(c)
    for y in range(25, 28):
        for x in range(12, 20):
            c.put(x, y, 'l')
    box(c, 10, 25, 1, 7, 'D'); box(c, 21, 25, 1, 7, 'D')
    for y in range(8, 15):
        for x in (7, 24):
            c.put(x, y, 'r')
    ell(c, 15.5, 7.5, 9.5, 3.4, 'l')   # the udeng, wound round, its folded peak at the front
    for x in range(6, 26):
        c.put(x, 9, 'L')
    for y in range(1, 7):
        for x in range(32):
            if abs(x - 15.5) <= (y - 1) * 0.9 + 0.5:
                c.put(x, y, 'l')
    for y in range(2, 7):
        c.put(15, y, 'L')
    c.put(7, 8, 'a'); c.put(24, 8, 'a')
    for (x, y) in ((24, 11), (25, 10), (25, 12), (26, 11)):   # a frangipani behind his ear
        c.put(x, y, 'n')
    c.put(25, 11, 'a')
    features(c, mood, eye_y=15)


@pt('ines', B='#2A1810', v='#3E2A1C')
def _(c, mood):
    for y in range(12, 31):   # the braid, forward over her right shoulder
        for x in (6, 7, 8):
            c.put(x, y, 'r' if (y + x) % 3 else 'R')
    bust(c, 'v')
    for y in range(25, 32):   # the khaki vest over a green shirt, a pocket each side
        for x in range(32):
            if c.px.get((x, y)) in ('c', 'C') and abs(x - 15.5) < 3.5:
                c.put(x, y, 'l')
    box(c, 7, 28, 3, 2, 'C'); box(c, 22, 28, 3, 2, 'C')
    for y in range(12, 31):
        for x in (6, 7, 8):
            if y > 24 or x < 8:
                c.put(x, y, 'r' if (y + x) % 3 else 'R')
    c.put(7, 31, 'k'); c.put(8, 31, 'k')
    for y in range(9, 14):
        c.put(7, y, 'r'); c.put(24, y, 'r')
    ell(c, 15.5, 5.0, 7.0, 4.2, 'h')   # the field hat
    box(c, 9, 6, 14, 2, 'k')
    for x in range(1, 31):
        c.put(x, 9, 'h' if abs(x - 15.5) < 13 else 'H')
        if abs(x - 15.5) < 14:
            c.put(x, 8, 'h')
    for y in range(10, 20):   # the chin strap
        c.put(7 + (y - 10) // 4, y, 'k'); c.put(24 - (y - 10) // 4, y, 'k')
    features(c, mood, eye_y=15, glasses=True)


@pt('ze', B='#6A645C')
def _(c, mood):
    bust(c, 'v')
    for y in range(25, 28):
        for x in range(32):
            if c.px.get((x, y)) in ('c', 'C') and 10 < x < 21:
                c.put(x, y, 'D' if y == 27 else c.px[(x, y)])
    for y in range(10, 15):
        c.put(7, y, 'r'); c.put(24, y, 'r')
    ell(c, 15.5, 4.5, 6.5, 4.0, 'h')   # a battered straw hat, the brim curled up at the sides
    for x in range(10, 22):
        c.put(x, 2, 'H' if 14 <= x <= 17 else 'h')
    box(c, 9, 6, 14, 2, 'k')
    for x in range(0, 32):
        d = abs(x - 15.5)
        y = 9 - (1 if d > 11 else 0) - (1 if d > 13 else 0) - (1 if d > 14.5 else 0)
        c.put(x, y, 'h'); c.put(x, y + 1, 'H' if d < 12 else 'h')
    features(c, mood, eye_y=15, mouth_y=21)
    for x in range(11, 21):   # a grey moustache and three days' stubble
        c.put(x, 19, 'r')
    for (x, y) in ((10, 21), (12, 22), (19, 22), (21, 21), (14, 23), (17, 23), (11, 20), (20, 20)):
        c.put(x, y, 'R')


@pt('almaz', B='#1E1410', c='#FBF6EA', C='#E0D6C0')
def _(c, mood):
    bust(c)
    for y in range(3, 32):   # the white netela: over her hair, framing her face, down over the shoulders
        for x in range(32):
            d = abs(x - 15.5)
            if (y < 26 and ((x - 15.5) / 11.5) ** 2 + ((y - 13) / 10.5) ** 2 <= 1 and not (face_shape(x, y) and y > 8 and d < 7.5)) or (y >= 20 and d >= 6.5 and d < 15):
                c.put(x, y, 'l' if d < 10 or y < 22 else 'L')
    for y in range(4, 32):   # its woven border, yellow and green, along the edge
        for x in range(32):
            d = abs(x - 15.5)
            v = ((x - 15.5) / 11.5) ** 2 + ((y - 13) / 10.5) ** 2
            if c.px.get((x, y)) in ('l', 'L') and ((y < 26 and abs(v - 0.84) < 0.1) or (y >= 26 and abs(d - 7.5) < 1.1)):
                c.put(x, y, 'x' if (v > 0.84 if y < 26 else d > 7.5) else 'y')
    for x in range(10, 22):
        c.put(x, 8, 'r')
    for y in range(26, 32):   # the kemis neckline, a woven cross down the front
        c.put(15, y, 'y'); c.put(16, y, 'x')
    features(c, mood, eye_y=15)


@pt('tigor', B='#1E1A18')
def _(c, mood):
    bust(c, 'v')
    for y in range(25, 32):   # the ulos over his left shoulder, across his chest
        for x in range(32):
            if c.px.get((x, y)) in ('c', 'C') and 0 <= (x - 15.5) - (y - 25) * -1.2 + 4 < 5:
                c.put(x, y, 'xyzxy'[int((x + y) % 5)])
    for y in range(9, 14):
        c.put(7, y, 'r'); c.put(24, y, 'r')
    box(c, 8, 2, 16, 7, 'k')   # the black peci, its top catching the light
    box(c, 8, 2, 16, 1, 'K')
    for x in range(9, 23):
        c.put(x, 3, 'K' if x % 4 == 0 else 'k')
    for x in range(8, 24):
        c.put(x, 9, 'r')
    features(c, mood, eye_y=15)


@pt('mario', B='#E8E4DC')
def _(c, mood):
    bust(c)
    for y in range(25, 32):   # leather apron straps over the cream shirt
        for x in (11, 12, 19, 20):
            c.put(x, y, 'a')
    for y in range(9, 17):
        for x in (6, 7, 24, 25):
            c.put(x, y, 'r' if x in (7, 24) else 'R')
    ell(c, 15.5, 6.0, 9.0, 4.0, 'k')   # a red flat cap, the peak at the front
    for x in range(7, 25):
        c.put(x, 9, 'K')
    for x in range(9, 23):
        c.put(x, 10, 'K' if x in (9, 22) else 'k')
    features(c, mood, eye_y=15, mouth_y=22)
    for x in range(7, 25):   # the handlebar moustache, wider than his face
        d = abs(x - 15.5)
        c.put(x, 19 + (1 if d > 6 else 0) - (1 if d > 8 else 0), 'w')
        if d < 7:
            c.put(x, 20, 'w')
    c.put(6, 18, 'w'); c.put(25, 18, 'w')


@pt('yuki', B='#1E1E22')
def _(c, mood):
    bust(c, 'v')
    for y in range(25, 32):   # the happi's white collar band
        for x in range(32):
            if c.px.get((x, y)) in ('c', 'C') and abs(abs(x - 15.5) - (2 + (y - 25) * 0.5)) < 1:
                c.put(x, y, 'l')
    ell(c, 15.5, 8.0, 9.5, 6.0, 'r')   # short black hair
    for x in range(7, 25):
        c.put(x, 12, 'r' if x % 3 else 'R')
    for x in range(6, 26):   # the hachimaki
        c.put(x, 8, 'w'); c.put(x, 9, 'W')
    for (x, y) in ((26, 9), (27, 10), (28, 11), (27, 8)):
        c.put(x, y, 'w')
    features(c, mood, eye_y=16, mouth_y=21)


@pt('kenji', B='#6A6660')
def _(c, mood):
    bust(c)
    for y in range(25, 28):
        for x in range(12, 20):
            c.put(x, y, 'l')
    ell(c, 15.5, 8.5, 9.0, 5.5, 'r')   # neat grey hair with a side parting
    for y in range(5, 12):
        c.put(12, y, 'R')
    for x in range(8, 24):
        if x > 12:
            c.put(x, 12, 'r')
    for y in range(10, 16):
        c.put(7, y, 'r'); c.put(24, y, 'r')
    features(c, mood, eye_y=16, mouth_y=21)
    c.put(9, 17, 'S'); c.put(22, 17, 'S'); c.put(13, 20, 'S'); c.put(18, 20, 'S')   # the lines of a face that has smiled a lot


@pt('aya', B='#3A2A24')
def _(c, mood):
    for y in range(8, 31):   # long dark hair behind
        for x in range(32):
            if abs(x - 15.5) < 11 - max(0, y - 26):
                c.put(x, y, 'r' if abs(x - 15.5) < 10 else 'R')
    bust(c, 'v')
    for y in range(25, 32):   # the cardigan open over a white blouse, and her hair over it
        for x in range(32):
            if c.px.get((x, y)) in ('c', 'C') and abs(x - 15.5) < 3 + (y - 25) * 0.3:
                c.put(x, y, 'l')
    for y in range(18, 30):
        for x in (5, 6, 25, 26):
            c.put(x, y, 'r' if x in (6, 25) else 'R')
    ell(c, 15.5, 10.0, 9.0, 4.5, 'r')
    ell(c, 15.0, 4.5, 9.5, 3.5, 'h')   # the beret, worn a little to one side
    for x in range(7, 24):
        c.put(x, 7, 'H')
    c.put(15, 0, 'h'); c.put(16, 0, 'h')
    features(c, mood, eye_y=16, mouth_y=21, lashes=True)


@pt('tanaka', B='#8A8680', v='#2E1E14')
def _(c, mood):
    bust(c, 'v')
    for y in range(25, 32):   # white shirt, red tie, grey lapels
        for x in range(32):
            if c.px.get((x, y)) in ('c', 'C', 's') and abs(x - 15.5) < 2.5 + (y - 25) * 0.4:
                c.put(x, y, 'l')
        c.put(15, y, 'x'); c.put(16, y, 'x')
    for y in range(10, 16):
        c.put(7, y, 'r'); c.put(24, y, 'r')
    ell(c, 15.5, 4.5, 6.5, 3.6, 'h')   # the fedora: a pinched crown, a band, a narrow brim
    c.put(15, 1, 'H'); c.put(16, 1, 'H'); c.put(15, 2, 'H'); c.put(16, 2, 'H')
    box(c, 9, 6, 14, 2, 'k')
    for x in range(3, 29):
        c.put(x, 8, 'h'); c.put(x, 9, 'H' if abs(x - 15.5) > 9 else 'h')
    features(c, mood, eye_y=15, glasses=True)


@pt('mika', B='#4A3020')
def _(c, mood):
    for y in range(9, 26):   # a brown bob
        for x in range(32):
            if abs(x - 15.5) < 11:
                c.put(x, y, 'r' if abs(x - 15.5) < 10 else 'R')
    bust(c)
    for y in range(25, 32):   # the yellow raincoat's collar and toggles
        for x in range(32):
            if c.px.get((x, y)) in ('c', 'C') and abs(abs(x - 15.5) - 4) < 1:
                c.put(x, y, 'D')
    c.put(15, 29, 'D'); c.put(16, 29, 'D'); c.put(15, 31, 'D'); c.put(16, 31, 'D')
    ell(c, 15.5, 7.0, 10.0, 5.0, 'k')   # the knit beanie, its ribbed cuff and white pompom
    for y in range(3, 9):
        for x in range(32):
            if c.px.get((x, y)) == 'k' and x % 2:
                c.put(x, y, 'K')
    for x in range(6, 26):
        c.put(x, 9, 'n'); c.put(x, 10, 'n' if x % 2 else 'K')
    ell(c, 15.5, 1.5, 2.5, 1.6, 'n')
    for x in range(8, 24):
        if x % 3:
            c.put(x, 11, 'r')
    features(c, mood, eye_y=16, mouth_y=21)


@pt('sora', B='#2A1810', d='#7A5A3A')
def _(c, mood):
    for y in range(10, 22):   # her ponytail behind
        c.put(26, y, 'r'); c.put(27, y + 1, 'R')
    bust(c, 'v')
    for y in range(25, 32):   # the work jacket's zip
        c.put(15, y, 'D'); c.put(16, y, 'D')
    for y in range(10, 14):
        c.put(7, y, 'r'); c.put(24, y, 'r')
    ell(c, 15.5, 5.0, 7.5, 4.5, 'h')   # the bucket hat, its brim sloping down all round
    for x in range(3, 29):
        d = abs(x - 15.5)
        c.put(x, 9 + (1 if d > 9 else 0), 'H'); c.put(x, 8 + (1 if d > 9 else 0), 'H' if d > 9 else 'h')
    box(c, 9, 6, 14, 1, 'k')
    features(c, mood, eye_y=15)
    c.put(21, 19, 'd'); c.put(22, 19, 'd'); c.put(22, 20, 'd')   # a smudge of garden soil


for cid in [k for k in PT]:
    for mood in MOODS:
        cv, pal = portrait(cid, mood)
        add('pt_%s_%s' % (cid, mood), cv, pal)


# ---------------- outputs ----------------
def render(s, scale=1):
    im = Image.new('RGBA', (s['w'], s['h']), (0, 0, 0, 0))
    for y, r in enumerate(s['rows']):
        for x, ch in enumerate(r):
            if ch != '.':
                v = s['pal'][ch]
                im.putpixel((x, y), tuple(int(v[i:i + 2], 16) for i in (1, 3, 5)) + ((int(v[7:9], 16),) if len(v) > 7 else (255,)))
    return im.resize((s['w'] * scale, s['h'] * scale), Image.NEAREST) if scale > 1 else im


def cast_sheet():   # the cast on one page, named, for looking over: portraits, the map sprite walking and at their thing
    from PIL import ImageDraw, ImageFont
    NAMED = [('ama', 'Captain Ama', 'Harbourmaster'), ('pearl', 'Miss Pearl', 'Blue Mountain'), ('kimo', 'Uncle Kimo', 'Kona Ridge'),
            ('lise', 'Tante Lise', 'Réunion'), ('wayan', 'Wayan', 'Bali'), ('ines', 'Dr. Inés', 'Galápagos'),
            ('rosa', 'Rosa', 'Your mentor'), ('ze', 'Zé', 'Mogiana foreman'), ('almaz', 'Almaz', 'Gedeo ceremony host'),
            ('tigor', 'Tigor', 'Lake Toba harbour'), ('mario', 'Mario', 'Turrialba cellar'), ('yuki', 'Yuki', 'Osaka koi keeper'),
            ('kenji', 'Kenji', 'Counter regular'), ('aya', 'Aya', 'Counter regular'), ('tanaka', 'Mr Tanaka', 'Counter regular'),
            ('mika', 'Mika', 'Counter regular'), ('sora', 'Sora', 'Counter regular')]
    EXTRA = [('roaster', 'Head roaster'), ('barista', 'Barista'), ('till', 'Till'), ('foreman', 'Foreman'), ('g_cafe', 'Café buyer'), ('g_kissa', 'Kissaten master'), ('g_konbini', 'Konbini buyer'), ('g_guest', 'Lakeside guest')]
    def render_at(s, sc):
        im = Image.new('RGBA', (s['w'], s['h']), (0, 0, 0, 0))
        for y, r in enumerate(s['rows']):
            for x, ch in enumerate(r):
                if ch != '.':
                    v = s['pal'][ch]
                    im.putpixel((x, y), tuple(int(v[i:i + 2], 16) for i in (1, 3, 5)) + (255,))
        return im.resize((s['w'] * sc, s['h'] * sc), Image.NEAREST)
    F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22)
    f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 17)
    T = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 34)
    cols, cw, ch = 3, 520, 230
    rows = (len(NAMED) + cols - 1) // cols
    W = cols * cw + 40
    H = 110 + rows * ch + 80 + 2 * 150 + 30
    im = Image.new('RGBA', (W, H), (251, 241, 220, 255))
    d = ImageDraw.Draw(im)
    d.text((30, 30), 'Beju Farm: the cast', font=T, fill=(62, 42, 28))
    d.text((30, 74), 'Portraits show four moods; on the map each walks, blinks and does their own thing.', font=f, fill=(110, 88, 64))
    for i, (cid, name, role) in enumerate(NAMED):
        x0, y0 = 20 + (i % cols) * cw, 110 + (i // cols) * ch
        d.rounded_rectangle((x0, y0, x0 + cw - 20, y0 + ch - 16), 14, fill=(244, 230, 198), outline=(62, 42, 28), width=3)
        im.alpha_composite(render_at(S['pt_%s_idle' % cid], 5), (x0 + 12, y0 + 22))
        d.text((x0 + 188, y0 + 16), name, font=F, fill=(62, 42, 28))
        d.text((x0 + 188, y0 + 46), role, font=f, fill=(110, 88, 64))
        im.alpha_composite(render_at(S['pt_%s_happy' % cid], 2), (x0 + 188, y0 + 80))
        im.alpha_composite(render_at(S['pt_%s_worried' % cid], 2), (x0 + 188, y0 + 146))
        for j, fr in enumerate(['down_0', 'side_1', 'act_1']):
            if '%s_%s' % (cid, fr) in S:
                im.alpha_composite(render_at(S['%s_%s' % (cid, fr)], 4), (x0 + 268 + j * 70, y0 + 92))
    y0 = 110 + rows * ch + 20
    d.text((30, y0), 'Staff and customers', font=F, fill=(62, 42, 28))
    for i, (cid, name) in enumerate(EXTRA):
        x0, yy = 30 + (i % 4) * 390, y0 + 40 + (i // 4) * 150
        im.alpha_composite(render_at(S['%s_down_0' % cid], 4), (x0, yy))
        im.alpha_composite(render_at(S['%s_side_1' % cid], 4), (x0 + 70, yy))
        d.text((x0 + 150, yy + 36), name, font=f, fill=(62, 42, 28))
    im.convert('RGB').save(os.path.join(HERE, 'cast-sheet.png'))

if __name__ == '__main__':
    json.dump(S, open(os.path.join(HERE, 'npc-sprites.json'), 'w'), separators=(',', ':'))
    frames = ['down_0', 'down_1', 'down_2', 'blink', 'side_0', 'side_1', 'act_0', 'act_1']
    sc, pad = 6, 6
    sheet = Image.new('RGBA', (len(frames) * (W * sc + pad) + pad, len(CAST) * (H * sc + pad) + pad), (244, 230, 198, 255))
    for r, cid in enumerate(CAST):
        for c, f in enumerate(frames):
            if '%s_%s' % (cid, f) in S:   # staff and customers have no action of their own
                sheet.alpha_composite(render(S['%s_%s' % (cid, f)], sc), (pad + c * (W * sc + pad), pad + r * (H * sc + pad)))
    sheet.save(os.path.join(HERE, 'sheet.png'))
    ps = [c for c in CAST if c in PT]
    psc = 5
    psheet = Image.new('RGBA', (len(MOODS) * (PW * psc + pad) + pad, max(1, len(ps)) * (PW * psc + pad) + pad), (251, 241, 220, 255))
    for r, cid in enumerate(ps):
        for c, m in enumerate(MOODS):
            psheet.alpha_composite(render(S['pt_%s_%s' % (cid, m)], psc), (pad + c * (PW * psc + pad), pad + r * (PW * psc + pad)))
    psheet.save(os.path.join(HERE, 'portraits.png'))
    try:
        cast_sheet()
    except OSError:   # no DejaVu fonts on this machine: the unlabelled sheets are enough
        pass
    print(len(CAST), 'characters,', len(S), 'sprites')
