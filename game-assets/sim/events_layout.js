/* Random events on every phone size: once the game brings an event into view (the guide's Go, then its own scroll), nothing
   you have to tap sits under the HUD, the corner buttons or the guide bar. Every spot an event can use is tried: each field
   for the pigs, each rack the nest can hang under, Karen and her replies. Usual and rare.
   node events_layout.js <test.html from mktest.py> [shots dir] */
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
    const clean = () => p.evaluate(() => { const T = window.__T; for (let i = 0; i < 8; i++) T.closeModal(); document.getElementById('modal').hidden = true; });
    await p.evaluate(() => { const T = window.__T, S = T.S; S.name = S.nameOk = 'Tess'; S.guide = T.GUIDE.length; S.prestige = 4; S.pwalkDone = true; Object.keys(S.tabs).forEach((k) => { S.tabs[k] = true; }); S.nav = null; S.navSeen = new Proxy({}, { get: () => true }); S.lv.racks = 99; S.farms.mogiana.build.drybeds = 60; S.goldenTip = true;   /* 28 racks: every row the nest can use */
      const f = S.farms.mogiana; f.field = true; const pos = T.S.farms.mogiana.shrubs.slice(0, 24); for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) pos.push({ x: 110 + c * 18, y: 160 + r * 17, v: 'caturra', p: 0.5, g: 20 }); f.shrubs = pos; });
    for (let k = 0; k < 3; k++) { await clean(); await p.waitForTimeout(150); }
    // every spot: [event, rare, tweak to the event, label]
    const spots = [];
    for (const rare of [false, true]) {
      for (let bed = 0; bed < 4; bed++) spots.push(['pigs', rare, { bed }, 'pigs field ' + (bed + 1)]);
      for (let i = 0; i < 20; i++) spots.push(['hornets', rare, { rack: i }, 'nest under rack ' + (i + 1)]);   /* rows 2-5, and the top row for a mill with fewer than 5 racks */
      spots.push(['karen', rare, {}, 'Karen']);
    }
    for (const [id, rare, tw, label] of spots) {
      await p.evaluate(([id, rare, tw]) => { const T = window.__T, S = T.S; S.rev.cur = null; T.revStart(id, { rare }); const E = S.rev.cur;
        if (id === 'pigs') { const b = [[10, 110, 80, 42], [104, 110, 80, 42], [10, 158, 80, 42], [104, 158, 80, 42]][tw.bed], off = [[6, 26], [32, 10], [56, 28], [60, 2], [8, 4], [34, 30]]; E.loc = 'mogiana'; E.bed = tw.bed; E.pigs.forEach((q, i) => { q.x = b[0] + off[i][0]; q.y = b[1] + off[i][1]; }); }
        if (id === 'hornets') { const r = T.rackAt(tw.rack); E.nest = [r.x + 14, r.y + 12]; }
        if (id === 'karen') E.open = true;
        T.setTab('farm', true); T.S.loc = 'huila'; }, [id, rare, tw]);
      await p.waitForTimeout(250); await clean();
      await p.click('#guide [data-act="revgo"]').catch(() => {});   /* the guide bar's Go, like a player */
      await p.waitForTimeout(900); await clean(); await p.waitForTimeout(150);
      const res = await p.evaluate((id) => { const T = window.__T, E = T.S.rev.cur, D = T.REVS[id], boxes = [['target', D.box(E)]];
        if (id === 'pigs') E.pigs.forEach((q, i) => boxes.push(['pig ' + (i + 1), [q.x - 6, q.y, 28, 12]]));
        if (id === 'hornets') boxes.push(['nest', [E.nest[0], E.nest[1], 12, 14]]);
        if (id === 'karen') T.revChips.forEach((c, i) => boxes.push(['reply ' + (i + 1), c.box]));
        const sc = document.getElementById('scroller').getBoundingClientRect(), cv = document.getElementById('cv').getBoundingClientRect(), k = cv.width / 192;
        return { here: T.revIsHere(), out: boxes.filter(([, b]) => T.revCovered(b) || cv.top + b[1] * k < sc.top || cv.top + (b[1] + b[3]) * k > sc.bottom).map(([nm]) => nm) }; }, id);
      n++;
      if (!res.here || res.out.length) { bad++; console.log(w + 'x' + h, label + (rare ? ' (rare)' : ''), !res.here ? 'NOT ON SCREEN' : 'COVERED: ' + res.out.join(', ')); if (shots) await p.screenshot({ path: path.join(shots, w + '_' + label.replace(/ /g, '_') + (rare ? '_rare' : '') + '.png') }); }
    }
    await p.close();
  }
  console.log(n + ' spots checked on ' + SIZES.length + ' sizes: ' + (bad ? bad + ' covered' : 'all clear') + (errs.length ? ' · page errors: ' + errs.slice(0, 3).join(' | ') : ''));
  if (bad || errs.length) process.exitCode = 1;
  await b.close();
})();
