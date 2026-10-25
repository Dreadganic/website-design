/* The roastery counter on every phone size: once the map shows the counter (opening it centres it), the sign, each customer at the
   counter and their order bubble sit clear of the HUD, the corner buttons and the guide bar, and on screen.
   node counter_layout.js <test.html from mktest.py> [shots dir] */
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
const file = path.resolve(process.argv[2]), shots = process.argv[3] || ''; if (shots) fs.mkdirSync(shots, { recursive: true });
const SIZES = [[320, 568], [360, 640], [375, 667], [390, 844], [414, 896], [430, 932]];
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  let bad = 0, n = 0; const errs = [];
  for (const [w, h] of SIZES) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true }); p.on('pageerror', (e) => errs.push(e.message));
    await p.goto('file://' + file); await p.waitForTimeout(700);
    const clean = () => p.evaluate(() => { const T = window.__T; (T.modalQueue || []).length = 0; for (let i = 0; i < 8; i++) T.closeModal(); document.getElementById('modal').hidden = true; document.getElementById('toast').hidden = true; T.S.nav = null; T.S.navSeen = new Proxy({}, { get: () => true }); });
    await p.evaluate(() => { const T = window.__T, S = T.S; S.name = S.nameOk = 'Tess'; S.guide = T.GUIDE.length; S.prestige = 2; S.pwalkDone = true; Object.keys(S.tabs).forEach((k) => { S.tabs[k] = true; }); S.roastery.tip = true; S.roastery.rep = T.REP_AT(7);
      S.roastery.beans = { 'caturra.washed': { kg: 600, coins: 90000, pts: 3000, cup: 86 } }; S.counter.pre = null; S.counter.rating = 3; });
    for (let k = 0; k < 3; k++) { await clean(); await p.waitForTimeout(150); }
    for (const phase of ['ready', 'open']) {
      await p.evaluate((phase) => { const T = window.__T, S = T.S; T.counterTick(0.1); if (phase === 'open') { T.ctOpenNow(); const s = S.counter.sess; s.walkT = 999; s.karenT = 9999; for (let i = 0; i < 6; i++) T.ctWalkIn(); s.q.forEach((c, k) => { c.n = k % 2 ? 3 : 1; }); } T.setTab('farm', true); T.setTab('roast', true); }, phase);
      await p.waitForTimeout(phase === 'open' ? 11000 : 900); await clean(); await p.waitForTimeout(200);
      const res = await p.evaluate(() => { const T = window.__T, S = T.S, s = S.counter.sess, boxes = [['sign', [T.CT_SIGN[0], T.CT_SIGN[1], 20, 18]]];
        if (s) s.q.slice(0, 3).forEach((c, i) => { const wk = T.IN.roast.ct[c.id]; boxes.push(['customer ' + (i + 1), [wk.x - 8, wk.y - 23, 16, 24]]); boxes.push(['bubble ' + (i + 1), [T.ctBubX(i, c) - 9, T.CT_BUB_Y[i], 18, 26]]); });
        const sc = document.getElementById('scroller').getBoundingClientRect(), cv = document.getElementById('cv').getBoundingClientRect(), k = cv.width / 192;
        return boxes.filter(([, b]) => T.revCovered(b) || cv.top + b[1] * k < sc.top || cv.top + (b[1] + b[3]) * k > sc.bottom || b[0] < 0 || b[0] + b[2] > 192).map(([nm]) => nm); });
      n++;
      if (res.length) { bad++; console.log(w + 'x' + h, phase, 'COVERED: ' + res.join(', ')); }
      if (shots) await p.screenshot({ path: path.join(shots, w + '_' + phase + '.png') });
    }
    await p.close();
  }
  console.log(n + ' views on ' + SIZES.length + ' sizes: ' + (bad ? bad + ' with something covered' : 'all clear') + (errs.length ? ' · page errors: ' + errs.slice(0, 3).join(' | ') : ''));
  if (bad || errs.length) process.exitCode = 1;
  await b.close();
})();
