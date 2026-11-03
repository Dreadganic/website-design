/* The Island Route on every phone size: once a spot is brought into view (where the map is taller than the window), every place you
   tap at the harbour (the boat and the second boat, the pier's gap, the board, the office, Captain Ama, the shed, the lighthouse,
   the bottle), Miss Pearl at Blue Mountain, Uncle Kimo at Kona and Réunion's beds, shed, cistern, sack and Tante Lise sit clear of the HUD, the corner buttons and the guide bar.
   node islands_layout.js <test.html from mktest.py> [shots dir] */
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
    await p.evaluate(() => { const T = window.__T, S = T.S, d = new Date(); S.checkin.last = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); S.name = S.nameOk = 'Tess'; S.guide = T.GUIDE.length; S.prestige = 6; S.pwalkDone = true; Object.keys(S.tabs).forEach((k) => { S.tabs[k] = true; }); S.nav = null; S.navSeen = new Proxy({}, { get: () => true });
      T.bmTick(); S.bm.seen = true; S.route = T.routeFresh(); S.route.seen = true; S.route.mig = 1; ['pier', 'hold', 'porch', 'lanai', 'isle_re'].forEach((id) => { S.route.bd[id] = 1; }); S.route.bottle = true; T.konaTick(); S.kona.seen = true; S.re = T.reFresh(); S.re.seen = true; T.goHb(); });
    const views = [['hb', () => window.__T.goHb()], ['bm', () => window.__T.goBm()], ['kona', () => window.__T.goKona()], ['re', () => window.__T.goIsle('re')]];
    for (const [sc, go] of views) {
      await p.evaluate(go); await p.waitForTimeout(400);
      await p.evaluate(() => { const T = window.__T; for (let i = 0; i < 8; i++) T.closeModal(); document.getElementById('modal').hidden = true; document.getElementById('toast').hidden = true; });
      const spots = await p.evaluate((sc) => {
        const T = window.__T, out = [];
        if (sc === 'hb') {
          for (const k of [0, 1]) { const m = T.HB_BOAT(k); out.push(['boat ' + (k + 1), m.x + 20, m.y + 14]); out.push(['boat ' + (k + 1) + ' tag', m.x + 20, m.y - 1]); }
          out.push(['the pier\'s gap', T.HB_PIER.x + 8, T.HB_PIER.gap0 + 8]);
          out.push(['the board', T.HB_BOARD.x + 18, T.HB_BOARD.y + 16]); out.push(['the office', T.HB_OFFICE.x + 24, T.HB_OFFICE.y + 30]); out.push(['the shed', T.HB_SHED.x + 22, T.HB_SHED.y + 24]);
          out.push(['Captain Ama', T.IN.hb.ama ? T.IN.hb.ama.x : 100, (T.IN.hb.ama ? T.IN.hb.ama.y : 252) - 10]);
          out.push(['the lighthouse', T.HB_TOWER.x + 14, T.HB_TOWER.y + 60]); out.push(['the bottle', T.HB_BOTTLE.x, T.HB_BOTTLE.y]);
        } else if (sc === 'bm') out.push(['Miss Pearl', T.PEARL_AT.x, T.PEARL_AT.y - 10]);
        else if (sc === 'kona') out.push(['Uncle Kimo', T.KIMO_AT.x, T.KIMO_AT.y - 10]);
        else { for (let i = 0; i < T.RE_BEDS; i++) { const a = T.RE_BED(i); out.push(['bed ' + (i + 1), a.x + 19, a.y + 12]); out.push(['bed ' + (i + 1) + ' tag', a.x + 19, a.y + 4]); } out.push(['the shed', T.RE_SHED.x + 25, T.RE_SHED.y + 20]); out.push(['the cistern', T.RE_CIST.x + 17, T.RE_CIST.y + 16]); out.push(['the cistern tag', T.RE_CIST.x + 17, T.RE_CIST.y - 2]); out.push(['the sack', T.RE_SACK.x + 15, T.RE_SACK.y + 14]); out.push(['Tante Lise', T.RE_LISE.x, T.RE_LISE.y - 10]); out.push(['the shift tag', 96, 112]); }
        return out;
      }, sc);
      for (const [label, x, y] of spots) {
        n++;
        const r = await p.evaluate(([x, y]) => {
          const sc = document.getElementById('scroller'), cv = document.getElementById('cv'), k = cv.getBoundingClientRect().width / 192;
          const room = sc.scrollHeight - sc.clientHeight; if (room > 0) sc.scrollTop = Math.max(0, Math.min(room, cv.offsetTop + y * k - sc.clientHeight / 2));
          const rr = cv.getBoundingClientRect(), px = rr.left + x * k, py = rr.top + y * k, el = document.elementFromPoint(px, py);
          return { ok: el === cv, what: el ? (el.id || el.className || el.tagName) : 'off screen', px: Math.round(px), py: Math.round(py) };
        }, [x, y]);
        if (!r.ok) { bad++; console.log('COVERED', w + 'x' + h, sc, label, 'by', r.what, '@', r.px, r.py); }
      }
      if (shots) { await p.evaluate(() => { document.getElementById('scroller').scrollTop = 0; }); await p.screenshot({ path: shots + '/' + sc + '-' + w + 'x' + h + '-top.png' }); await p.evaluate(() => { const s = document.getElementById('scroller'); s.scrollTop = s.scrollHeight; }); await p.screenshot({ path: shots + '/' + sc + '-' + w + 'x' + h + '-bottom.png' }); }
    }
    await p.close();
  }
  console.log(n + ' spots checked, ' + bad + ' covered' + (errs.length ? '; page errors: ' + errs.slice(0, 3).join(' | ') : ''));
  await b.close(); process.exit(bad || errs.length ? 1 : 0);
})();
