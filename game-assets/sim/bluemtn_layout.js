/* Blue Mountain on every phone size: once the island is on screen (scrolled to, where the map is taller than the window), every
   spot you tap (all six terraces, the four barbecue bays, the grading table, all five barrels and their labels) sits clear of the
   HUD, the corner buttons and the guide bar.
   node bluemtn_layout.js <test.html from mktest.py> [shots dir] */
const { chromium } = require(process.env.PW_MODULE || '/opt/node-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
const file = path.resolve(process.argv[2]), shots = process.argv[3] || ''; if (shots) fs.mkdirSync(shots, { recursive: true });
const SIZES = [[320, 568], [360, 640], [375, 667], [390, 844], [414, 896], [430, 932]];
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });
  let bad = 0, n = 0; const errs = [];
  for (const [w, h] of SIZES) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true }); p.on('pageerror', (e) => errs.push(e.message));
    await p.goto('file://' + file); await p.waitForTimeout(700);
    await p.evaluate(() => { const T = window.__T, S = T.S; S.name = S.nameOk = 'Tess'; S.guide = T.GUIDE.length; S.prestige = 5; S.pwalkDone = true; Object.keys(S.tabs).forEach((k) => { S.tabs[k] = true; }); S.nav = null; S.navSeen = new Proxy({}, { get: () => true }); T.bmTick(); S.bm.seen = true; S.bm.lv = 12; T.goBm(); });
    await p.waitForTimeout(400);
    await p.evaluate(() => { const T = window.__T; for (let i = 0; i < 8; i++) T.closeModal(); document.getElementById('modal').hidden = true; document.getElementById('toast').hidden = true; });
    /* every spot: [label, map x, map y] */
    const spots = await p.evaluate(() => {
      const T = window.__T, out = [];
      for (let i = 0; i < 6; i++) { const a = T.BTER(i); out.push(['terrace ' + (i + 1), a.x + 43, a.y + 26]); out.push(['terrace ' + (i + 1) + ' top', a.x + 43, a.y + 8]); out.push(['terrace ' + (i + 1) + ' left end', a.x + 6, a.y + 26]); out.push(['terrace ' + (i + 1) + ' right end', a.x + 80, a.y + 26]); }
      for (let j = 0; j < 4; j++) { const a = T.BBQ(j); out.push(['bay ' + (j + 1), a.x + 19, a.y + 14]); out.push(['bay ' + (j + 1) + ' label', a.x + 19, a.y + 1]); }
      out.push(['grading table', T.BGTABLE.x + 19, T.BGTABLE.y + 12]);
      for (const g of ['n1', 'n2', 'n3', 'pb', 'sel']) { const a = T.BBARREL(g); out.push(['barrel ' + g, a.x + 6, a.y + 12]); out.push(['barrel ' + g + ' label', a.x + 6, a.y - 3]); }
      return out;
    });
    for (const [label, x, y] of spots) {
      n++;
      const r = await p.evaluate(([x, y]) => {   /* scroll it into view as the game would, then ask what's on top there */
        const sc = document.getElementById('scroller'), cv = document.getElementById('cv'), k = cv.getBoundingClientRect().width / 192;
        const room = sc.scrollHeight - sc.clientHeight; if (room > 0) sc.scrollTop = Math.max(0, Math.min(room, cv.offsetTop + y * k - sc.clientHeight / 2));
        const rr = cv.getBoundingClientRect(), px = rr.left + x * k, py = rr.top + y * k, el = document.elementFromPoint(px, py);
        return { ok: el === cv, what: el ? (el.id || el.className || el.tagName) : 'off screen', px: Math.round(px), py: Math.round(py) };
      }, [x, y]);
      if (!r.ok) { bad++; console.log('COVERED', w + 'x' + h, label, 'by', r.what, '@', r.px, r.py); }
    }
    if (shots) await p.screenshot({ path: shots + '/bluemtn-' + w + 'x' + h + '.png' });
    await p.close();
  }
  console.log(n + ' spots checked, ' + bad + ' covered' + (errs.length ? ', page errors: ' + errs.slice(0, 3).join(' | ') : ''));
  await b.close(); process.exit(bad || errs.length ? 1 : 0);
})();
