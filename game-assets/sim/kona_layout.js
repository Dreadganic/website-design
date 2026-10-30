/* Kona Ridge on every phone size: once the island is on screen (scrolled to, where the map is taller than the window), every
   spot you tap (ash piles anywhere on the field, the shed, all eight plots, all six tanks and their labels, the co-op boat's order cards, three or four)
   sits clear of the HUD, the corner buttons and the guide bar.
   node kona_layout.js <test.html from mktest.py> [shots dir] */
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
    await p.evaluate(() => { const T = window.__T, S = T.S; S.name = S.nameOk = 'Tess'; S.guide = T.GUIDE.length; S.prestige = 6; S.pwalkDone = true; Object.keys(S.tabs).forEach((k) => { S.tabs[k] = true; }); S.nav = null; S.navSeen = new Proxy({}, { get: () => true }); T.goKona(); T.konaTick(); S.kona.seen = true; });
    await p.waitForTimeout(400);
    await p.evaluate(() => { const T = window.__T; for (let i = 0; i < 8; i++) T.closeModal(); document.getElementById('modal').hidden = true; document.getElementById('toast').hidden = true; });
    /* every spot: [label, map x, map y] */
    const spots = await p.evaluate(() => {
      const T = window.__T, out = [];
      for (let x = 12; x <= 120; x += 27) for (const y of [72, 86, 100]) out.push(['ash pile ' + x + ',' + y, x + 4, y + 3]);
      out.push(['shed', T.KSHED.x + 23, T.KSHED.y + 24]);
      for (let i = 0; i < 8; i++) { const a = T.KPLOT(i); out.push(['plot ' + (i + 1), a.x + 21, a.y + 30]); out.push(['plot ' + (i + 1) + ' top', a.x + 21, a.y + 14]); }
      for (let i = 0; i < 6; i++) { out.push(['tank ' + (i + 1), T.KTANK_X(i) + 13, T.KTANK_Y + 20]); out.push(['tank ' + (i + 1) + ' label', T.KTANK_X(i) + 13, T.KTANK_Y - 8]); }
      for (const n of [3, 4]) for (let j = 0; j < n; j++) { const c = T.KCARD(j, n); out.push(['order card ' + (j + 1) + ' of ' + n, c.x + 13, c.y + 16]); out.push(['order card ' + (j + 1) + ' of ' + n + ' top', c.x + 13, c.y + 3]); }
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
    if (shots) await p.screenshot({ path: shots + '/kona-' + w + 'x' + h + '.png' });
    await p.close();
  }
  console.log(n + ' spots checked, ' + bad + ' covered' + (errs.length ? ', page errors: ' + errs.slice(0, 3).join(' | ') : ''));
  await b.close(); process.exit(bad || errs.length ? 1 : 0);
})();
