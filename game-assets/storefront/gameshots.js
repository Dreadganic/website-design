/* The storefront scenes drawn into the real game's roastery map and screenshotted with the real interface on top: the proof that the sign and
   every customer you tap sit clear of the HUD, the corner buttons and the guide bar, checked live against the real boxes as each shot is taken.
   node gameshots.js <test page from sim/mktest.py> <outdir> */
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
const [test, out] = process.argv.slice(2);
const SP = JSON.parse(fs.readFileSync(path.join(__dirname, 'shop-sprites.json'), 'utf8')), game = JSON.parse(fs.readFileSync(path.join(__dirname, '../sprites.json'), 'utf8')).sprites;
Object.keys(game).forEach((k) => { if (/^(worker_|bag_)/.test(k) || k === 'sparkle') SP[k] = game[k]; });
SP.karen = JSON.parse(fs.readFileSync(path.join(__dirname, '../events/event-sprites.json'), 'utf8')).karen;   /* Karen, from the random events */
let html = fs.readFileSync(test, 'utf8');
[['  drawHint(sc, time);', '  drawHint(sc, time); if (window.__sfDraw) window.__sfDraw(ctx, sc, time);'],
 ["function guideBar() {\n  const el = $('guide'), arrow = $('garrow');", "function guideBar() {\n  const el = $('guide'), arrow = $('garrow'); if (window.__guide) { el.hidden = false; setHTML(el, window.__guide); arrow.hidden = true; return; }"],
 ['function toast(msg) {', 'function toast(msg) { if (window.__noToast) return;'],
 ['function drawHint(sc, time) {\n  const h = hintAt(sc); if (!h) return;', 'function drawHint(sc, time) {\n  if (window.__noHint) return; const h = hintAt(sc); if (!h) return;'],
 ["  if (sc === 'roast') { $('locName').textContent = 'Roastery, Osaka';", "  if (sc === 'roast' && window.__bar) { $('locName').textContent = 'Roastery, Osaka'; $('locBeds').textContent = window.__bar; } else if (sc === 'roast') { $('locName').textContent = 'Roastery, Osaka';"]
].forEach(([a, b]) => { if (html.split(a).length !== 2) throw new Error('hook not found: ' + a.slice(0, 50)); html = html.replace(a, b); });
fs.mkdirSync(out, { recursive: true }); const page = path.join(out, 'shot.html'); fs.writeFileSync(page, html);
const scenes = fs.readFileSync(path.join(__dirname, 'scenes.js'), 'utf8').replace('/*TARGETS*/{}', fs.readFileSync(path.join(__dirname, 'targets.json'), 'utf8'));
const T = JSON.parse(fs.readFileSync(path.join(__dirname, 'targets.json'), 'utf8'));
const SHOTS = [   // [scene, guide line, header line, targets key]
  ['ready', '<span class="gstep">Counter</span><span class="gtext">3 pre-orders on the board. Tap the sign to open</span>', 'Reputation 6 · counter ready · ★★★', 'ready'],
  ['open', '<span class="gstep">Counter 4:12</span><span class="gtext">3 waiting · serve the café regular: light ×2 is on the shelf</span>', 'Counter open · 4:12 · ★★★', 'open'],
  ['serve', '<span class="gstep">Counter 3:40</span><span class="gtext">Served! 2 waiting</span>', 'Counter open · 3:40 · ★★★', 'open'],
  ['chain', '<span class="gstep">Counter 3:05</span><span class="gtext">Aya wants light ×2: roasting now, 68 s</span>', 'Counter open · 3:05 · ★★★★', 'open'],
  ['walkout', '<span class="gstep">Counter 2:10</span><span class="gtext">A walk-out (1 of 3). Watch their patience bars</span>', 'Counter open · 2:10 · ★★★', 'open'],
  ['regular', '<span class="gstep">Counter 1:30</span><span class="gtext">Kenji is in: medium ×2, his 9th visit</span>', 'Counter open · 1:30 · ★★★★', 'open'],
  ['karen', '<span class="gstep">Karen</span><span class="gtext">She\'s holding up the queue! Pick the reply that settles her</span>', 'Counter open · 2:40 · ★★★', 'karen'],
  ['cooldown', '<span class="gstep">Counter</span><span class="gtext">Closed: 14 served, +186,400 coins. Opens again in 24:10</span>', 'Reputation 6 · counter opens in 24:10', 'ready']];
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [w, h] of [[360, 640], [390, 844]]) {
    const g = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true });
    const errs = []; g.on('pageerror', (e) => errs.push(e.message));
    await g.goto('file://' + path.resolve(page)); await g.evaluate(() => { window.__noHint = true; window.__noToast = true; }); await g.waitForTimeout(800);
    await g.evaluate(() => { const T = window.__T, S = T.S; S.name = S.nameOk = 'Tess'; S.guide = T.GUIDE.length; S.prestige = 2; S.roastery.rep = 900; Object.keys(S.tabs).forEach((k) => { S.tabs[k] = true; }); S.nav = null; S.navSeen = new Proxy({}, { get: () => true }); S.pwalkDone = true; S.minutes = 11 * 60; T.revSess = -1e9;
      S.roastery.bags = []; ['light', 'medium', 'dark', 'medium', 'light', 'dark'].forEach((pr) => S.roastery.bags.push({ key: 'catuai.natural', profile: pr, kg: 80, coins: 6000, pts: 300, q: 80 })); });
    const clean = () => g.evaluate(() => { const T = window.__T; for (let i = 0; i < 8; i++) T.closeModal(); document.getElementById('modal').hidden = true; document.getElementById('pcer').hidden = true; T.IN.roast.guests.length = 0; });
    for (let k = 0; k < 3; k++) { await g.waitForTimeout(250); await clean(); }
    await g.evaluate((src) => { (0, eval)(src); }, 'var SP = ' + JSON.stringify(SP) + ';\n' + scenes.replace(/^const |^let /gm, 'var ') + '\nwindow.__sfDraw = (c, sc, t) => { const S = window.__sf && SCENES[window.__sf]; if (S && sc === "roast") { c.save(); c.imageSmoothingEnabled = false; S.draw(c, t); c.restore(); } };');
    for (const [key, guide, bar, tk] of SHOTS) {
      await g.evaluate(([key, guide, bar]) => { window.__sf = key; window.__guide = guide; window.__bar = bar; window.__T.setTab('roast', true); }, [key, guide, bar]);
      await g.waitForTimeout(500); await clean();
      await g.evaluate((tg) => { const sc = document.getElementById('scroller'), cv = document.getElementById('cv'), k = cv.getBoundingClientRect().width / 192, room = (sc.scrollHeight - sc.clientHeight) / k, win = sc.clientHeight / k;
        const ys = tg.map((t) => t[2]).concat(tg.map((t) => t[2] + t[4])), mid = (Math.min(...ys) + Math.max(...ys)) / 2; sc.scrollTop = Math.round(Math.max(0, Math.min(room, mid - win / 2)) * k); }, T[tk].t);   /* the game centres the counter when the shop opens */
      await g.waitForTimeout(600);
      const bad = await g.evaluate((tg) => { const cv = document.getElementById('cv').getBoundingClientRect(), k = cv.width / 192, sr = document.getElementById('scroller').getBoundingClientRect();
        const els = [...document.querySelectorAll('#hearts, #hudLevel, .hud-r .clock > *, #hudCoins, #hudCranes, #hudStore, #sfxBtn, #musicBtn, #gearBtn, #guide, #goldGo, #crackGo')].filter((e) => !e.hidden && e.getClientRects().length).map((e) => [e.id || e.className, e.getBoundingClientRect()]);
        const o = []; tg.forEach(([n, x, y, w, h]) => { const L = cv.left + (x - 2) * k, T = cv.top + (y - 2) * k, R = cv.left + (x + w + 2) * k, B = cv.top + (y + h + 2) * k;
          if (T < sr.top || B > sr.bottom) o.push(n + ': off screen'); els.forEach(([id, q]) => { if (L < q.right && q.left < R && T < q.bottom && q.top < B) o.push(n + ' under ' + id); }); }); return o; }, T[tk].t);
      await g.screenshot({ path: path.join(out, 'g' + w + '_' + key + '.png') });
      console.log(w + 'x' + h, key, bad.length ? 'COVERED: ' + bad.join('; ') : 'clear'); if (bad.length) process.exitCode = 1;
    }
    if (errs.length) console.log('page errors', errs.slice(0, 3));
    await g.close();
  }
  await b.close();
})();
