/* The event art drawn into the real game's map canvas, screenshotted with the real interface on top: the proof that no tap target
   sits under the HUD, the corner buttons or the guide bar, checked live against the real boxes as each shot is taken.
   node gameshots.js <test page from sim/mktest.py> <run.js output with a late-game save> <outdir> */
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
const [test, stateFile, out] = process.argv.slice(2);
const SP = JSON.parse(fs.readFileSync(path.join(__dirname, 'event-sprites.json'), 'utf8')), game = JSON.parse(fs.readFileSync(path.join(__dirname, '../sprites.json'), 'utf8')).sprites;
// hooks on the test page: the event art draws after the map, the guide bar takes the event's line, the tutorial arrow and pick-up floats stay out of the way
let html = fs.readFileSync(test, 'utf8');
[["drawHint('farm', time);", "drawHint('farm', time); if (window.__evDraw) window.__evDraw(ctx, 'farm', time);"], ['  drawHint(sc, time);', '  drawHint(sc, time); if (window.__evDraw) window.__evDraw(ctx, sc, time);'],
 ["function guideBar() {\n  const el = $('guide'), arrow = $('garrow');", "function guideBar() {\n  const el = $('guide'), arrow = $('garrow'); if (window.__guide) { el.hidden = false; setHTML(el, window.__guide); arrow.hidden = true; return; }"],
 ['function drawHint(sc, time) {\n  const h = hintAt(sc); if (!h) return;', 'function drawHint(sc, time) {\n  if (window.__noHint) return; const h = hintAt(sc); if (!h) return;'], ['window.__T = { toast,', 'window.__T = { get floats() { return floats; }, toast,']].forEach(([a, b]) => { if (html.split(a).length !== 2) throw new Error('hook not found: ' + a.slice(0, 40)); html = html.replace(a, b); });
fs.mkdirSync(out, { recursive: true }); const page = path.join(out, 'shot.html'); fs.writeFileSync(page, html);
['worker_down_0', 'worker_down_1', 'worker_down_2', 'bush_catuai_green', 'sparkle', 'i_coin', 'green_sack'].forEach((k) => { SP[k] = game[k]; });
const scenes = fs.readFileSync(path.join(__dirname, 'scenes.js'), 'utf8').replace('/*TARGETS*/{}', fs.readFileSync(path.join(__dirname, 'targets.json'), 'utf8'));
const T = JSON.parse(fs.readFileSync(path.join(__dirname, 'targets.json'), 'utf8'));
const SHOTS = [   // [scene, map, farm, warning, targets key]
  ['pigs', 'farm', 'huila', 'Pigs in the Huila field!', 'pigs'], ['rust', 'farm', 'mogiana', 'Leaf rust in the Mogiana field!', 'rust'], ['monkeys', 'farm', 'mogiana', 'Monkeys in the Mogiana barn!', 'monkeys'],
  ['crows', 'farm', 'huila', 'Crows on the Huila bushes!', 'crows'], ['hornets', 'mill', null, 'Hornets at the mill!', 'hornets'], ['rats', 'mill', null, 'Rats in the green coffee!', 'rats'],
  ['karen', 'roast', null, 'A complaint at the counter!', 'karen'], ['power', 'roast', null, 'The roastery lights are out!', 'power'], ['fire', 'roast', null, 'Fire in roaster 2!', 'fire'],
  ['typhoon', 'farm', 'mogiana', 'Typhoon in 1:42: stake the bushes', 'typhoon farm'], ['typhoonMill', 'mill', null, 'Typhoon in 1:20: tarp the racks', 'typhoon mill'], ['typhoonRoast', 'roast', null, 'Typhoon in 0:55: bring in the plants', 'typhoon roastery']];
// each rare variant too: its own model, in the same spots
['pigs', 'rust', 'monkeys', 'crows', 'hornets', 'rats', 'karen', 'power', 'fire'].forEach((k) => { const s = SHOTS.find((x) => x[0] === k); SHOTS.push([k, s[1], s[2], 'Rare! ' + s[3], T[s[4] + ' (rare)'] ? s[4] + ' (rare)' : s[4], true]); });
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const d = JSON.parse(fs.readFileSync(stateFile, 'utf8')); const st = d.final || d; st.last = Date.now(); st.name = st.name || 'Mock'; st.nameOk = st.name;
  for (const [w, h] of [[360, 640], [390, 844]]) {
    const g = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true });
    const errs = []; g.on('pageerror', (e) => errs.push(e.message));
    await g.addInitScript((st) => { localStorage.clear(); localStorage.setItem('beju-farm-save-v3', JSON.stringify(st)); }, st);
    await g.goto('file://' + path.resolve(page)); await g.evaluate(() => { window.__noHint = true; }); await g.waitForTimeout(1200);
    await g.evaluate((src) => { (0, eval)(src); }, 'var SP = ' + JSON.stringify(SP) + ';\n' + scenes.replace(/^const |^let /gm, 'var ') + '\nSCENES.typhoonMill = { draw: (c, t) => SCENES.typhoon.mini(c, t, 0) }; SCENES.typhoonRoast = { draw: (c, t) => SCENES.typhoon.mini(c, t, 1) };\nwindow.__evDraw = (c, sc, t) => { const S = window.__ev && SCENES[window.__ev]; if (S && sc === window.__evMap) { c.save(); c.imageSmoothingEnabled = false; S.draw(c, t, window.__evRare); c.restore(); } };');
    const clean = () => g.evaluate(() => { const T = window.__T; for (let i = 0; i < 8; i++) T.closeModal(); document.getElementById('modal').hidden = true; document.getElementById('pcer').hidden = true; T.S.nav = null; T.S.navSeen = new Proxy({}, { get: () => true }); });
    for (let k = 0; k < 3; k++) { await g.waitForTimeout(250); await clean(); }
    await g.evaluate(() => { const F = window.__T.floats; F.length = 0; F.push = () => 0; });   /* no pick-up floats drifting over the HUD */
    for (const [key, map, farm, warn, tk, rare] of SHOTS) {
      const tg = T[tk].t;
      await g.evaluate(([key, map, farm, warn, rare]) => { const X = window.__T; if (farm) X.S.loc = farm; X.setTab(map, true); window.__ev = key; window.__evMap = map; window.__evRare = !!rare;
        window.__guide = '<span class="gstep">Event</span><span class="gtext">' + warn + '</span>'; }, [key, map, farm, warn, rare]);
      await g.waitForTimeout(500); await clean();
      // where the game would scroll: open as usual; if a target isn't clear there, centre the event in the window
      await g.evaluate(([map, tg]) => { const sc = document.getElementById('scroller'), cv = document.getElementById('cv'), k = cv.getBoundingClientRect().width / 192, room = (sc.scrollHeight - sc.clientHeight) / k, win = sc.clientHeight / k;
        const ys = tg.map((t) => t[2]).concat(tg.map((t) => t[2] + t[4])), mid = (Math.min(...ys) + Math.max(...ys)) / 2, s0 = { farm: 0.3, mill: 0.2, roast: 0 }[map] * room;
        const fits = (s) => tg.every((t) => t[2] >= s + 6 && t[2] + t[4] <= s + win - 40);
        const s = fits(s0) ? s0 : Math.max(0, Math.min(room, mid - win / 2));
        sc.scrollTop = Math.round(s * k); }, [map, tg]);
      await g.waitForTimeout(150); await g.evaluate(() => { document.dispatchEvent(new Event('noop')); });
      await g.waitForTimeout(450);
      // the same check as check.py, live: every target box against every interface element's box
      const bad = await g.evaluate((tg) => { const cv = document.getElementById('cv').getBoundingClientRect(), k = cv.width / 192, sr = document.getElementById('scroller').getBoundingClientRect();
        const els = [...document.querySelectorAll('#hearts, #hudLevel, .hud-r .clock > *, #hudCoins, #hudCranes, #hudStore, #sfxBtn, #musicBtn, #gearBtn, #guide')].filter((e) => !e.hidden && e.getClientRects().length).map((e) => [e.id || e.className, e.getBoundingClientRect()]);
        const out = []; tg.forEach(([n, x, y, w, h]) => { const L = cv.left + (x - 2) * k, T = cv.top + (y - 2) * k, R = cv.left + (x + w + 2) * k, B = cv.top + (y + h + 2) * k;
          if (T < sr.top || B > sr.bottom) out.push(n + ': off screen');
          els.forEach(([id, q]) => { if (L < q.right && q.left < R && T < q.bottom && q.top < B) out.push(n + ' under ' + id); }); }); return out; }, tg);
      await g.screenshot({ path: path.join(out, 'g' + w + '_' + key + (rare ? '_rare' : '') + '.png') });
      console.log(w + 'x' + h, key + (rare ? ' (rare)' : ''), bad.length ? 'COVERED: ' + bad.join('; ') : 'clear'); if (bad.length) process.exitCode = 1;
    }
    if (errs.length) console.log('page errors', errs.slice(0, 3));
    await g.close();
  }
  await b.close();
})();
