"""The random-event sprites (a proposal, not in the game yet), in the game's own format: w, h, rows of palette letters, pal.
Same outline (#3E2A1C) and shadow row (#2A2A0850) as sprites.json, so each entry can be copied into its "sprites" map.
The mockups: https://claude.ai/artifact/2Wtf5cMTLmjZQdjdwJ2GQH
python3 game-assets/events/sprites.py  ->  event-sprites.json and sheet.png beside this file"""
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

# ---- Pig raid
PIG = {'O': O, 'p': '#F4A8B0', 'P': '#D87C8C', 'n': '#C05C70', 'e': '#2E1E18', 'w': '#FFE4E8', 'a': SH}
spr('pig_0', PIG, [
 '................',
 '...OO...........',
 '..OpPO..........',
 '.OpppOOOOOOOO...',
 'OOppwwppppppPO..',
 'nnpeppppppppPPO.',
 'nnppppppppppPPOO',
 'OOpppppppppPPPOO',
 '..OPPPPPPPPPPO..',
 '..OPO.OPO.OPO...',
 '..OO..OO..OO....',
 '..aaaaaaaaaaa...'])
spr('pig_1', PIG, [
 '................',
 '...OO...........',
 '..OpPO..........',
 '.OpppOOOOOOOO...',
 'OOppwwppppppPO..',
 'nnpeppppppppPPO.',
 'nnppppppppppPPOO',
 'OOpppppppppPPPOO',
 '..OPPPPPPPPPPO..',
 '.OPO.OPO..OPO...',
 '.OO..OO...OO....',
 '..aaaaaaaaaaa...'])
GOLD = dict(PIG, p='#F8D870', P='#D8A838', n='#B07820', w='#FFF6C8')
spr('pig_gold', GOLD, S['pig_0']['rows'])
spr('dirt', {'O': O, 'd': '#7A4A28', 'D': '#5A3418', 'l': '#9A6438'}, [
 '....OO.....OO.......',
 '..OOddO..OOldO..OO..',
 '.OdlDdDOOdDddOOOldO.',
 'ODdddlDdDddlDdDdddDO',
 '.ODDdDDdlDDdDDldDDO.',
 '..OOOOOOOOOOOOOOOO..'])

# ---- Leaf rust (laid over a ripe bush)
spr('rust', {'r': '#E8802A', 'R': '#B85818', 'y': '#F8B848'}, [
 '..................',
 '..................',
 '..................',
 '..................',
 '.........rr.......',
 '....rR...Ry.......',
 '..........r.......',
 '...yr.........rR..',
 '...Rr.........y...',
 '........rr........',
 '....r...yR....r...',
 '..............R...',
 '..rR..............',
 '..........ry......',
 '.......r..Rr......',
 '..................',
 '...........rR.....',
 '..................',
 '..................',
 '..................',
 '..................',
 '..................'])
spr('leaf_drop', {'g': '#8CB04A', 'G': '#5E7E2C', 'r': '#E8802A'}, [
 '.g...G..',
 'gG..rG..',
 '.G....g.',
 '...gG...',
 '..G..r..'])

# ---- Cherry monkeys
MON = {'O': O, 'b': '#8A5A34', 'B': '#6A4024', 'f': '#F4D2A8', 'e': '#2E1E18', 'c': '#E83A30', 'C': '#9A1C20', 'k': '#FFB4A0', 'a': SH}
spr('monkey_0', MON, [
 '..OOOO........',
 '.ObbbbO.......',
 'ObffffbO......',
 'ObfefefO......',
 'ObffffbO..OOO.',
 '.OObbOkcOcO..O',
 '..ObbOcCcCO.O.',
 '..OBbOckcCO.O.',
 '..ObbbOCCO.O..',
 '..OBBbbOObO...',
 '..OBO.OBBO....',
 '.OBO...OBO....',
 '.OO.....OO....',
 '..aaaaaaa.....'])
spr('monkey_1', MON, [
 '..OOOO........',
 '.ObbbbO.......',
 'ObffffbO......',
 'ObfefefO......',
 'ObffffbO...OO.',
 '.OObbOkcOcO..O',
 '..ObbOcCcCO..O',
 '..OBbOckcCO.O.',
 '..ObbbOCCO.O..',
 '..OBBbbOObO...',
 '...OBOBBO.....',
 '...OBOOBO.....',
 '...OO.OO......',
 '..aaaaaaa.....'])
spr('monkey_e', MON, [
 '..OOOO........',
 '.ObbbbO.......',
 'ObffffbO......',
 'ObfefefO......',
 'ObffffbO..OOO.',
 '.OObbbbOOO...O',
 '..ObbbbbbO..O.',
 '..OBbbbbO..O..',
 '..ObbbbbO.O...',
 '..OBBbbbbO....',
 '..OBO.OBBO....',
 '.OBO...OBO....',
 '.OO.....OO....',
 '..aaaaaaa.....'])

# ---- Crow flock
CROW = {'O': '#1E1A22', 'k': '#3A3448', 'K': '#2A2634', 'y': '#F2C04A', 'e': '#FFFFFF', 'a': SH}
spr('crow_sit', CROW, [
 '...OOO....',
 '..OkekO...',
 '.yOkkkO...',
 '..OkkkKO..',
 '..OkkkKKO.',
 '...OkKKKOO',
 '....OOOO..',
 '....y.y...',
 '...aaaaa..'])
spr('crow_fly0', CROW, [
 'O..........O',
 'OkO......OkO',
 '.OkO.OO.OkO.',
 '..OkOkeOkO..',
 '...OkkkkOy..',
 '....OKKO....',
 '.....OO.....',
 '............'])
spr('crow_fly1', CROW, [
 '............',
 '............',
 '.....OO.....',
 '...OOkeOO...',
 '.OOkkkkkkOy.',
 'OkKO.KK.OKkO',
 'OO..OOOO..OO',
 '............'])
SC = {'O': O, 's': '#F4DE9C', 'S': '#D8B868', 'h': '#C89850', 'H': '#A07030', 'r': '#D84A36', 'R': '#A8302A', 'b': '#4878C8', 'B': '#305898', 'w': '#76502A', 'f': '#F8F0DC', 'e': '#2E1E18', 'a': SH}
spr('scarecrow_0', SC, [
 '.....OOOOOO.....',
 '....OhhhhhhO....',
 '...OhhhhhhHHO...',
 '.OOOHHHHHHHHOOO.',
 'OhhhhhhhhhhhhhHO',
 '.OOOOOOOOOOOOOO.',
 '....OffffffO....',
 '....OfeffefO....',
 '....OffffffO....',
 '.OOOOOrrrrOOOOO.',
 'OsSOrrRbbrrROSsO',
 'OSsOrrrbbrrrOsSO',
 '.OOOrrRrrRrrOOO.',
 '....OrrrrrrO....',
 '....OOOwwOOO....',
 '.......ww.......',
 '.......ww.......',
 '.......ww.......',
 '.......ww.......',
 '.......ww.......',
 '.......ww.......',
 '......aaaa......'])
spr('scarecrow_1', SC, [
 '.....OOOOOO.....',
 '....OhhhhhhO....',
 '...OhhhhhhHHO...',
 '.OOOHHHHHHHHOOO.',
 'OhhhhhhhhhhhhhHO',
 '.OOOOOOOOOOOOOO.',
 'OsO.OffffffO.OsO',
 '.OrOOfeffefOOrO.',
 '..OrOffffffOrO..',
 '..OOrrrrrrrrOO..',
 '...OrrRbbrrRO...',
 '...OrrrbbrrrO...',
 '...OrrRrrRrrO...',
 '....OrrrrrrO....',
 '....OOOwwOOO....',
 '.......ww.......',
 '.......ww.......',
 '.......ww.......',
 '.......ww.......',
 '.......ww.......',
 '.......ww.......',
 '......aaaa......'])

# ---- Hornet attack
NEST = {'O': O, 'g': '#C8BCA4', 'G': '#A89C84', 'd': '#7A6E5A', 'h': '#2E1E18', 'w': '#5A4630'}
spr('nest', NEST, [
 '.....ww.....',
 '.....ww.....',
 '...OOOOOO...',
 '..OggGggGO..',
 '.OgGGggGGgO.',
 '.OddddddddO.',
 'OggGggGggGgO',
 'OGGggGGggGGO',
 'OddddddddddO',
 '.OgGggGgGgO.',
 '.OGGggGGggO.',
 '..OdddhddO..',
 '...OgghgO...',
 '....OOOO....'])
HOR = {'O': '#1E1A22', 'y': '#F8C830', 'w': '#E8F4FF'}
spr('hornet_0', HOR, ['.ww.', 'wwww', 'OyOy', '.yO.'])
spr('hornet_1', HOR, ['....', 'w..w', 'OyOy', 'wyOw'])
spr('smoke', {'w': '#F4F0E8', 'g': '#C8C4BC', 'G': '#A8A49C'}, [
 '...wwww...',
 '..wwwwgw..',
 '.wwwgwwgw.',
 'wwgwwwwggw',
 'wwwwwggwgw',
 '.wggwwwgG.',
 '..wGgggG..',
 '....GG....'])

# ---- Storehouse rats
RAT = {'O': O, 'r': '#8A8478', 'R': '#6A6458', 'p': '#E8A0A8', 'e': '#2E1E18', 'a': SH}
spr('rat_0', RAT, [
 '...OO.......',
 '..OpRO......',
 '.OrrrrOOOO..',
 'eerrrrrrrRO.',
 '.OOrrrrrRROpp',
 '...OROOROO..',
 '....aaaaa...'][:0] or [
 '...OO........',
 '..OpRO.......',
 '.OrrrrOOOO...',
 'perrrrrrrRO..',
 '.OOrrrrrRROpp',
 '...OROOROO...',
 '....aaaaa....'])
spr('rat_1', RAT, [
 '...OO........',
 '..OpRO.......',
 '.OrrrrOOOO...',
 'perrrrrrrROpp',
 '.OOrrrrrRRO..',
 '..ORO..ORO...',
 '....aaaaa....'])
HOLE = {'O': O, 'k': '#1E140C', 'K': '#3A2818', 'p': '#E8A0A8', 'P': '#C07880'}
spr('hole', HOLE, [
 '..OOOOOO..',
 '.OkkkkkkO.',
 'OkkkkkkkkO',
 'OKkkkkkkKO',
 '.OOOOOOOO.'])
spr('hole_tail', HOLE, [
 '..OOOOOO..',
 '.OkkkkkkO.',
 'OkkkkkkkkO',
 'OKkkkkkkPp',
 '.OOOOOOOOp',
 '........pP',
 '.......pp.'])
spr('trap', {'O': O, 'w': '#C8A060', 'W': '#A07838', 'm': '#B8B8B8', 'y': '#F8D040', 'Y': '#D8A020'}, [
 '..........',
 '.OOOOOOO..',
 'OmmmmmmmO.',
 'OwwwwwyYO.',
 'OWWWWWYYO.',
 '.OOOOOOO..'])

# ---- Karen at the counter: a walker (16x24) with a bob, in the game's guest style
KAR = {'O': O, 'h': '#F8E08C', 'H': '#E0BC5C', 'k': '#B88E38', 's': '#F8D2B0', 'S': '#E2A882', 'e': '#2E1E18', 'm': '#C8485A',
       'c': '#E888B0', 'C': '#C8608C', 'D': '#98406A', 'p': '#5A6A86', 'P': '#3E4A64', 'b': '#2E1E18', 'g': '#F2C04A', 'a': SH}
spr('karen', KAR, [
 '................',
 '.....OOOOOOO....',
 '....OhhhhhhhOO..',
 '...OhhhhhhHHkO..',
 '...OhHHhhhhHkO..',
 '..OhHkOOOOOhkkO.',
 '..OhkOsSssSOhkO.',
 '..OhkOseSSeOhkO.',
 '..OhkOsssssOkO..',
 '..OkkOSmmmSOkO..',
 '...OO.OSSSO.O...',
 '...OOccccccOO...',
 '..OsOcCccCcOgO..',
 '..OsOCcccCCOgO..',
 '..OSOCCCCCCOgO..',
 '...OODDDDDDOO...',
 '....OppppppO....',
 '....OpPppPpO....',
 '....OpPOOPpO....',
 '....OPPOOPPO....',
 '....ObbOObbO....',
 '.....OO..OO.....',
 '................',
 '....aaaaaaaa....'])
spr('bubble_angry', {'O': O, 'w': '#FFFFFF', 'r': '#D84A36'}, [
 '.OOOOOOOOOOOOO.',
 'OwwwwwwwwwwwwwO',
 'OwwrrwwwrwrwwwO',
 'OwwrrwwrrwrrwwO',
 'OwwrrwwwwwwwwwO',
 'OwwwwwwrrwrrwwO',
 'OwwrrwwwrwrwwwO',
 'OwwwwwwwwwwwwwO',
 '.OOOwwOOOOOOOO.',
 '...OwO.........',
 '...OO..........'])
spr('bell', {'O': O, 'g': '#F2C04A', 'G': '#C89028', 'w': '#FFF0A0', 'm': '#5A4630'}, [
 '....OO....',
 '...OggO...',
 '..OgwggO..',
 '.OgwgggGO.',
 '.OggggGGO.',
 'OggggGGGGO',
 'OOOOOOOOOO',
 'OmmmmmmmmO',
 '.OOOOOOOO.'])

# ---- Power cut
FB = {'O': O, 'm': '#9AA0A4', 'M': '#6E7478', 'd': '#3A3E42', 'g': '#5AC85A', 'r': '#E84A3A', 'y': '#F8E070', 'w': '#E8ECEE', 'Y': '#2E1E18'}
spr('fusebox', FB, [
 '.OOOOOOOOOOOOOO.',
 'OwmmmmmmmmmmmmMO',
 'OmddddddddddddMO',
 'OmdOOOdOOOdOOOMO',
 'OmdOgOdOrOdOgOMO',
 'OmdOgOdOrOdOgOMO',
 'OmdOdOdOrOdOdOMO',
 'OmdOdOdOdOdOdOMO',
 'OmdOOOdOOOdOOOMO',
 'OmddddddddddddMO',
 'OmdyYYyyyYYYydMO',
 'OmddddddddddddMO',
 'OmmmmmmmmmmmmmMO',
 'OMMMMMMMMMMMMMMO',
 '.OOOOOOOOOOOOOO.'])
spr('lantern_oil', {'O': O, 'b': '#C89028', 'B': '#906018', 'g': '#FFF4C0', 'y': '#F8C870', 'f': '#F87830', 'a': SH}, [
 '...OO...',
 '..O..O..',
 '..OOOO..',
 '.ObbbbO.',
 'OgyyygO.',
 'OgyfygO.',
 'OgyfygO.',
 'OgyyygO.',
 '.ObbbbO.',
 'OBBBBBBO',
 '.OOOOOO.',
 '.aaaaaa.'][:11] + ['........'])

# ---- Roaster fire
FL = {'r': '#E83A30', 'o': '#F87830', 'y': '#F8D040', 'w': '#FFF4C0'}
spr('flame_0', FL, [
 '.....r......',
 '....rr...r..',
 '...roor..r..',
 '..roor..ror.',
 '..royor.ror.',
 '.royyorroor.',
 '.roywyoroyr.',
 'rroywwyooyor',
 'royywwyyyyor',
 'roywwwwwyyor',
 '.royywwyyor.',
 '..rroooorr..'])
spr('flame_1', FL, [
 '......r.....',
 '..r...rr....',
 '..rr.roor...',
 '.ror..roor..',
 '.ror.royor..',
 '.roorroyyor.',
 '.ryoroywyor.',
 'royooywwyorr',
 'royyyywwyyor',
 'royywwwwwyor',
 '.royywwyyor.',
 '..rroooorr..'])
spr('smoke_dark', {'g': '#6A6660', 'G': '#4A4640', 'k': '#8A867E'}, [
 '...kkgg...',
 '..kggggk..',
 '.kgGggGgk.',
 'kggggGGggk',
 'gGgkggggGg',
 '.gggGGggg.',
 '..GGggGG..',
 '...gGGg...'])
spr('extinguisher', {'O': O, 'r': '#D84A36', 'R': '#A8302A', 'm': '#B8B8B8', 'k': '#2E1E18', 'w': '#F8F0DC'}, [
 '..OOO.',
 '.OmmmO',
 '..OkO.',
 '.OrrrO',
 'OrwrrR',
 'OrwrrR',
 'OrrrrR',
 'OrrrrR',
 'OrrrRR',
 'ORRRRR',
 '.OOOO.'])
spr('foam', {'w': '#FFFFFF', 'g': '#DCE8F0'}, [
 '....ww.ww....',
 '.ww.wgwwgw.w.',
 'wgwwwwwgwwwgw',
 '.wwgwwgwwgww.',
 '..ww.ww..ww..'])
spr('firebell', {'O': O, 'g': '#E8B848', 'G': '#B88428', 'w': '#FFF0A0', 'r': '#D84A36', 'm': '#5A4630'}, [
 'OOOOOOOO....',
 'OmmmmmmO....',
 'OOOOmOOO....',
 '...OmO......',
 '..OOOOO.....',
 '.OgwgggO....',
 'OgwggggGO...',
 'OgwggggGO...',
 'OggggGGGO...',
 'OggggGGGGO..',
 'OOOOOOOOOO..',
 '....OrO.....',
 '.....O......'])

# ---- Typhoon warning
spr('tarp', {'O': '#203C68', 'b': '#4878C8', 'B': '#305898', 'r': '#E8E8E8'}, [
 'OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO',
 'ObbBbbBbbBbbBbbBbbBbbBbbBbbBbbBbbBbbBbbO',
 'OBbbBbbBbbBbbBbbBbbBbbBbbBbbBbbBbbBbbBBO',
 'OrbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbrO',
 '.OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO.'])
spr('stake', {'O': O, 'w': '#C8A060', 'W': '#A07838', 's': '#F8F0DC'}, [
 '.O.',
 'OwO',
 'OwO',
 'OsO',
 'OwO',
 'OWO',
 'OWO',
 '.O.'])
SHUT = {'O': O, 'g': '#4A8E66', 'G': '#2D6A46', 'w': '#C8A060', 'W': '#A07838', 'n': '#B8B8B8'}
spr('shutters', SHUT, [
 'OOOOOOOOOOOOOOOOOOOOOO',
 'OgGgGgGgGgOOgGgGgGgGgO',
 'OgGgGgGgGgOOgGgGgGgGgO',
 'OWWWWWWWWWWWWWWWWWWWWO',
 'OgGgGgGgGgOOgGgGgGgGgO',
 'OgGgGgGgGgOOgGgGgGgGgO',
 'OgGgGgGgGgOOgGgGgGgGgO',
 'OWWWWWWWWWWWWWWWWWWWWO',
 'OgGgGgGgGgOOgGgGgGgGgO',
 'OgGgGgGgGgOOgGgGgGgGgO',
 'OOOOOOOOOOOOOOOOOOOOOO'])
spr('cloud_storm', {'O': '#2A3040', 'g': '#8A94A8', 'G': '#6A7488', 'd': '#4A5468', 'y': '#F8E070'}, [
 '.....OOOO.......',
 '...OOggggOOO....',
 '..OggggggggOO...',
 '.OgggGGggggggO..',
 'OggGGGGGggGGggO.',
 'OGGGddGGGGGGdGO.',
 '.OddOOyOOOddddO.',
 '..OO.yy...OOOO..',
 '.....yyy........',
 '.......y........'])

# ---- Cosmetics
VANE = {'O': O, 'g': '#E8B848', 'G': '#B88428'}
spr('weathervane', VANE, [''.join('g' if c in 'pwe' else 'G' if c in 'Pn' else c for c in r) for r in S['pig_0']['rows'][1:11]] + [
 '.......OO.......',
 '...O...OO...O...',
 '..OGOOOOOOOOGGO.',
 '...O...OO...O...',
 '.......OO.......',
 '.......OO.......',
 '.......OO.......',
 '......OOOO......'])
spr('lens', {'O': O, 'g': '#F2C04A', 'G': '#B88428', 'b': '#A8D8F0', 'B': '#78B0D8', 'w': '#FFFFFF', 'r': '#E8802A', 'l': '#8CB04A'}, [
 '..OOOOO...',
 '.OgggggO..',
 'OgbwbbbgO.',
 'OgwbblbgO.',
 'OgbblrBgO.',
 'OgbbBBBgO.',
 '.OgggggOO.',
 '..OOOOOOGO',
 '.......OGO',
 '........O.'])
spr('plush', {'O': O, 'b': '#B88A60', 'B': '#8A6440', 'f': '#F8E0C0', 'e': '#2E1E18', 'r': '#D84A36', 'a': SH}, [
 '..OO..OO....',
 '.ObbOObbO...',
 '.ObfbbfbO...',
 'ObffffffbO..',
 'ObfeffefbO..',
 'ObffrrffbO..',
 '.ObbffbbO...',
 'ObbbbbbbbO.O',
 'ObfbbbbfbOOb',
 'ObbbbbbbbOb.',
 '.ObOOOObO...',
 '..aaaaaa....'])
spr('beehat', {'O': O, 's': '#F8F4EC', 'S': '#D8D0BC', 'v': '#E8E8E0', 'V': '#B8B8B0', 'y': '#F8C830'}, [
 '....OOOOOO....',
 '...OssssssO...',
 '..OssssssSSO..',
 '.OOySSSSSSyOO.',
 'OssssssssssssO',
 '.OOOOOOOOOOOO.',
 '.OvVvVvVvVvVO.',
 '.OVvVvVvVvVvO.',
 '.OvVvVvVvVvVO.',
 '..OOOOOOOOOO..'])
spr('catflap', {'O': O, 'w': '#A07838', 'W': '#76502A', 'g': '#9AA0A4', 'G': '#6E7478', 'k': '#2E1E18'}, [
 'OOOOOOOOOOOOOO',
 'OwwwwwwwwwwwWO',
 'OwwwwwwwwwwwWO',
 'OwwwwwwwwwwwWO',
 'OwwwwwwwwwwwWO',
 'OwwwOOOOOOwwWO',
 'OwwOggggggOwWO',
 'OwwOgkgkggOwWO',
 'OwwOggggggOwWO',
 'OwwOgGGGGGOwWO',
 'OwwOOOOOOOOwWO',
 'OWWWWWWWWWWWWO',
 'OOOOOOOOOOOOOO'])
# ---- Companions
spr('piglet', PIG, [
 '..OO......',
 '.OpPOOOO..',
 'nnwppppPO.',
 'nnepppPPOO',
 '.OpppPPPO.',
 '.OPO.OPO..',
 '.OO..OO...',
 '..aaaaa...'])
spr('capuchin', MON, [
 '..OOOO......',
 '.ObbbbO.....',
 'ObffffbO....',
 'ObfefefO....',
 'ObffffbO....',
 '.OObbbOO....',
 '.ObfffbO.OO.',
 'ObbfffbbOObO',
 'OBbbbbbBO.bO',
 '.OBBBBBO.bO.',
 '.OBO.OBOOO..',
 '..aaaaaa....'])
spr('millcat', {'O': O, 'g': '#9A9AA0', 'G': '#6E6E78', 'w': '#F4F4F0', 'e': '#78C850', 'p': '#E8A0A8', 'a': SH}, [
 '.O..O.......',
 'OgOOgO......',
 'OgggggO.....',
 'OeggegO...O.',
 'OgwpwgO..OgO',
 '.OwwwOOOOOgO',
 '..OggggggGO.',
 '..OwgggGGGO.',
 '..OwOOOOwGO.',
 '..OO....OO..',
 '...aaaaaa...'])
DAL = {'O': O, 'o': '#F8F8F4', 'q': '#D8D8D0', 'w': '#FFFFFF', 'n': '#2E1E18', 't': '#F8F8F4', 's': '#2E1E18', 'r': '#D84A36'}
spr('dalmatian', DAL, [
 '................',
 '..O.O...........',
 '.OsOoO..........',
 '.OoooosO....O...',
 'OonoosO....OtO..',
 '.OoooorOOOOOoO..',
 '..OOOrosoooqO...',
 '....OoooooqsqO..',
 '....OoooOOOoqO..',
 '....OsO....OqO..',
 '....OO.....OO...',
 '................'])

# ---- Rare variants: each one a model of its own, not just a recolour of the usual trouble
GS = json.load(open(os.path.join(HERE, '..', 'sprites.json')))['sprites']
spr('truffle', {'O': O, 'k': '#3A2A22', 'K': '#5A4436', 'w': '#C8B49A', 'a': SH}, [
 '.OOOO.',
 'OkKkkO',
 'OkkwKO',
 'OKkkkO',
 '.OOOO.',
 '.aaaa.'])
SILVER = dict(GS['bush_caturra_ripe']['pal'], a='#24343C', b='#4A6470', c='#6E8C98', d='#8CAAB4', f='#B4CCD2', h='#DCEAEE', i='#A87818', j='#F2C04A', k='#FFF4B0')
spr('bush_silver', SILVER, GS['bush_caturra_ripe']['rows'])
BABY = {'O': O, 'l': '#E8C89A', 'L': '#C89A6A', 'w': '#FFF4E4', 'K': '#2E1E18', 'p': '#E8A0A8', 'r': '#E83A30', 'a': SH}
spr('capuchin_baby_0', BABY, [
 '..OOOO....',
 '.OllllO...',
 'OlwwwwlO..',
 'OwKwwKwO..',
 'OlwpwwlO..',
 '.OllllO.O.',
 '..OLlO.OlO',
 '.OlrlO..O.',
 '.OlLlO.O..',
 '.OlOlO....',
 '..aaa.....'])
spr('capuchin_baby_1', BABY, [
 '..OOOO....',
 '.OllllO...',
 'OlwwwwlO..',
 'OwKwwKwO..',
 'OlwpwwlO..',
 '.OllllO..O',
 '..OLlO..OO',
 '.OlrlO.Ol.',
 '.OlLlOO...',
 '..OlOlO...',
 '..aaa.....'])
MAG = {'O': '#1E1A22', 'k': '#2A2632', 'K': '#3A3448', 'w': '#F4F4F0', 'B': '#2A8A9A', 'e': '#FFFFFF', 'g': '#F2C04A', 'y': '#F2C04A', 'a': SH}
spr('magpie_sit', MAG, [
 '...OOO......',
 '..OkekO.....',
 '.gOkkkO.....',
 '..OkwwKO....',
 '..OkwwBBO...',
 '...OwBBBOOO.',
 '....OOOOBBBO',
 '....y.y..OO.',
 '...aaaaa....'])
spr('magpie_fly0', MAG, [
 'O..........O',
 'OwO......OwO',
 '.OBO.OO.OBO.',
 '..OBOkeOBO..',
 '...OkwwkOg..',
 '....OBBO....',
 '.....OOO....',
 '......OO....'])
spr('magpie_fly1', MAG, [
 '............',
 '............',
 '.....OO.....',
 '...OOkeOO...',
 '.OOwkwwkwOg.',
 'OBBO.BB.OBBO',
 'OO..OOOO..OO',
 '......OO....'])
spr('hive_gold', {'O': O, 'g': '#F8D060', 'G': '#E0A830', 'd': '#A87018', 'h': '#5A3410', 'w': '#5A4630', 'y': '#F2B830'}, S['nest']['rows'][:-1] + [
 '....OyyO....',
 '.....Oy.....',
 '.....y......'])
BEE = {'O': '#1E1A22', 'y': '#F8C830', 'K': '#2E1E18', 'w': '#E8F4FF'}
spr('bee_0', BEE, ['.ww..', 'OyKyK', '.yKyO'])
spr('bee_1', BEE, ['w..w.', 'OyKyK', 'wyKyO'])
KING = {'O': O, 'w': '#FFFFFF', 'r': '#8A7E70', 'R': '#665C50', 'p': '#E8A0A8', 'e': '#2E1E18', 'g': '#F2C04A', 'G': '#C89028', 'j': '#D84A36', 'c': '#B83040', 'C': '#8A2030', 'm': '#F8F4EC', 'k': '#2E1E18', 'a': SH}
KING_TOP = [
 '.....g.g.g............',
 '.....gjgjg............',
 '....OGGGGGO...........',
 '...OrrrrrrpO..OOOOO...',
 '..OrrrrrrrrrOOcccccO..',
 '.OrwerrrrrrRccCcccccO.',
 'pprrrrrrrrrRcCcCcCccO.',
 '.OrrrrrrrrRRmkmmkmmmO.',
 '..OOrrrrrRRRRRRRRRRROp',
 '....ORRRRRRRRRRRRRRO.p']
spr('rat_king_0', KING, KING_TOP + [
 '....OrRO.OrRO.OrRO.Opp',
 '....OOOO.OOOO.OOOO....',
 '.....aaaaaaaaaaaaaa...'])
spr('rat_king_1', KING, KING_TOP + [
 '...OrRO..OrRO.OrRO.Opp',
 '...OOOO..OOOO.OOOO....',
 '.....aaaaaaaaaaaaaa...'])
KH = {'O': O, 'h': '#F8E08C', 'H': '#E0BC5C', 'k': '#B88E38', 's': '#F8D2B0', 'S': '#E2A882', 'm': '#C8485A', 'v': '#B898E8', 'V': '#8060C0', 'r': '#F2C04A',
      'g': '#2E1E18', 'w': '#FFFFFF', 'c': '#6AA8D8', 'C': '#4A88B8', 'D': '#305898', 'p': '#F4F0E4', 'P': '#D8D0BC', 'b': '#2E1E18', 'B': '#C8402E', 'd': '#FFF4E4', 'n': '#2E1E18', 'a': SH}
spr('karen_hat', KH, [
 '.......OOOOOO.......',
 '......OvvvvvvO......',
 '......OvVVVVvO......',
 '.....OrrrrrrrrO.....',
 '.OOOOOOOOOOOOOOOOOO.',
 'OvvvvvvvvvvvvvvvvvVO',
 '.OOOOOOOOOOOOOOOOOO.',
 '....OhkOsSssSOhkO...',
 '....OhkOgggggOhkO...',
 '....OhkOsssssOkO....',
 '....OkkOSmmmSOkO....',
 '.....OO.OSSSO.O.O.O.',
 '.....OOcwwwwcOOOdddO',
 '....OsOcCccCcOsOdndO',
 '....OsOCcccCCOsOBBBO',
 '....OSOCCCCCCOSOBBBO',
 '.....OODDDDDDOOOOOO.',
 '......OppppppO......',
 '......OpPppPpO......',
 '......OpPOOPpO......',
 '......OPPOOPPO......',
 '......ObbOObbO......',
 '.......OO..OO.......',
 '....................',
 '......aaaaaaaa......'])
spr('fusebox_brass', dict(S['fusebox']['pal'], m='#D8A040', M='#A07020', w='#F8E0A0', d='#4A3020', g='#F4F0E4', r='#F4F0E4', y='#F2C04A', Y='#6E4624'), S['fusebox']['rows'])
CAN = {'O': O, 'y': '#F8D040', 'o': '#F87830', 'w': '#FFF4E4', 'W': '#E8D8B8', 'm': '#C89028'}
spr('candle_0', CAN, ['..y..', '.yoy.', '..o..', '.OwO.', '.OwO.', '.OWO.', 'OmmmO', 'OOOOO'])
spr('candle_1', CAN, ['.y...', '.yo..', '..oy.', '.OwO.', '.OwO.', '.OWO.', 'OmmmO', 'OOOOO'])
BLUE = {'r': '#2A5AC8', 'o': '#4AA0F0', 'y': '#A8E4FF', 'w': '#FFFFFF'}
spr('flame_blue_0', BLUE, S['flame_0']['rows'])
spr('flame_blue_1', BLUE, S['flame_1']['rows'])

# ---- Cosmetics that needed their own art in the game
spr('weathervane_iron', dict(VANE, g='#9A948A', G='#6A645A'), S['weathervane']['rows'])
spr('review', {'O': O, 'w': '#C89028', 'W': '#906018', 'p': '#FFF8EC', 'y': '#F2C04A', 'k': '#3E2A1C'}, [
 'OOOOOOOOOOOO',
 'OwwwwwwwwwwO',
 'OwppppppppWO',
 'OwpyypyypyWO',
 'OwppppppppWO',
 'OwpkkkkkkpWO',
 'OwpkkkkpppWO',
 'OwppppppppWO',
 'OWWWWWWWWWWO',
 'OOOOOOOOOOOO'])
spr('hivelamp', {'O': O, 'm': '#5A4630', 'g': '#F8D060', 'G': '#E0A830', 'd': '#A87018', 'y': '#FFF4C0', 'a': SH}, [
 '...OO...',
 '...Om...',
 '..OOOO..',
 '.OgGgGO.',
 'OgdydygO',
 'OGygyGGO',
 'OgdydygO',
 '.OGgGgO.',
 '..OddO..',
 '...OO...'])

spr('crown', {'O': O, 'g': '#F2C04A', 'G': '#B88428', 'r': '#D84A36', 'w': '#FFF4B0'}, [   # the king rat's crown, kept on the mill blackboard
 'O.O.O.O',
 'OgOwOgO',
 'OgggggO',
 'OgrgrGO',
 'OOOOOOO'])

spr('scorch', {'O': O, 'k': '#2A1A12', 'K': '#4A2A1A', 'f': '#E8602A', 'y': '#F8B848'}, [   # the fire-roast drum plate, for its chip
 '.OOOOOOOOOO.',
 'OfyffyffyffO',
 'OkKkkKkkKkkO',
 'OkkKkkKkkKkO',
 'OkKkkKkkKkkO',
 '.OOOOOOOOOO.'])

json.dump(S, open(os.path.join(HERE, 'event-sprites.json'), 'w'), indent=1)

# contact sheet at 4x on the game's cream
Z = 4; pad = 10; cols = 7
def tile(s):
    im = Image.new('RGBA', (s['w'], s['h']), (0, 0, 0, 0)); px = im.load()
    for y, r in enumerate(s['rows']):
        for x, ch in enumerate(r):
            if ch == '.': continue
            c = s['pal'][ch].lstrip('#'); a = int(c[6:8], 16) if len(c) == 8 else 255
            px[x, y] = (int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16), a)
    return im.resize((s['w'] * Z, s['h'] * Z), Image.NEAREST)
names = list(S); cw = 48 * Z // 2 + pad; ch = 30 * Z + 24
rows = (len(names) + cols - 1) // cols
sheet = Image.new('RGBA', (cols * (cw + pad) + pad, rows * ch + pad), (246, 238, 220, 255)); dr = ImageDraw.Draw(sheet)
for i, n in enumerate(names):
    t = tile(S[n]); x = pad + (i % cols) * (cw + pad); y = pad + (i // cols) * ch
    sheet.alpha_composite(t, (x, y)); dr.text((x, y + t.height + 2), n, fill=(62, 42, 28, 255))
sheet.save(os.path.join(HERE, 'sheet.png')); print(len(S), 'sprites')
