"""Every event tap target against everything the interface draws over the map, on each measured screen size.
The game scrolls a taller-than-screen map so the event sits mid-window (when it isn't clear already); this checks that scroll.
python3 check.py <cover.json from measure.js> [targets.json]   (exits 1 if any target is covered)"""
import json, sys, os
R = json.load(open(sys.argv[1])); T = json.load(open(sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.abspath(__file__)), 'targets.json')))
PAD = 2
def hit(a, b): return a[0] < b[0] + b[2] and b[0] < a[0] + a[2] and a[1] < b[1] + b[3] and b[1] < a[1] + a[3]
def problems(r, tg, s):
    out = []
    for name, x, y, w, h in tg:
        box = (x - PAD, y - PAD, w + 2 * PAD, h + 2 * PAD)
        if y < s or y + h > s + r['win']['h']: out.append((name, 'off screen')); continue
        for o in r['over']:
            if o['name'] == 'sheet': continue
            if hit(box, (o['x'], o['y'] + s, o['w'], o['h'])): out.append((name, o['name'])); break
    return out
bad = 0
for ev, E in T.items():
    tg = E['t']; ys = [t[2] for t in tg] + [t[2] + t[4] for t in tg]; mid = (min(ys) + max(ys)) / 2
    for r in R:
        if r['scene'] != E['map'] or r['sheet']: continue
        s0 = {'farm': 0.3, 'mill': 0.2, 'roast': 0}[E['map']] * r['room']   # where the map opens
        p0 = problems(r, tg, s0)
        s = s0 if not p0 else max(0, min(r['room'], mid - r['win']['h'] / 2))   # scroll the event to mid-window if it isn't clear
        p = problems(r, tg, s)
        if p: bad += 1; print('COVERED', ev, '%dx%d' % (r['w'], r['h']), 'scroll %.0f' % s, sorted(set(p)))
        elif p0: print('  scrolls', ev, '%dx%d' % (r['w'], r['h']), 'from %.0f to %.0f' % (s0, s))
    half = [r for r in R if r['scene'] == E['map'] and r['sheet'] and r['w'] == 390][0]
    sh = [o for o in half['over'] if o['name'] == 'sheet'][0]
    under = sum(1 for t in tg if t[2] + t[4] > sh['y'])
    print(ev, '- under a half-open sheet on a 390 phone:', under, 'of', len(tg), '(the guide bar line brings it into view)')
print('targets covered:', bad)
sys.exit(1 if bad else 0)
