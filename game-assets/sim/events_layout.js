/* Random events on every phone size: once the game brings an event into view (the guide's Go, then its own scroll), nothing
   you have to tap sits under the HUD, the corner buttons or the guide bar. Every spot an event can use is tried: each field
   for the pigs, each rack the nest can hang under, Karen and her replies. Usual and rare.
   node events_layout.js <test.html from mktest.py> [shots dir] */
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
      for (let bed = 0; bed < 4; bed++) spots.push(['rust', rare, { bed }, 'rust field ' + (bed + 1)]);
      spots.push(['monkeys', rare, {}, 'monkey route']);
      spots.push(['crows', rare, {}, 'scarecrow']); for (let bed = 0; bed < 4; bed++) spots.push(['crows', rare, { bed }, 'crows field ' + (bed + 1)]);
      spots.push(['rats', rare, {}, 'rat holes']);
      spots.push(['power', rare, {}, 'fuse box']); spots.push(['power', rare, { open: true }, 'switches']);
      for (let bay = 0; bay < 3; bay++) { spots.push(['fire', rare, { bay }, 'fire roaster ' + (bay + 1)]); spots.push(['fire', rare, { bay, grab: true }, 'spraying roaster ' + (bay + 1)]); }
    }
    for (const m of ['farm', 'mill', 'roast']) spots.push(['typhoon', false, { ty: m }, 'typhoon ' + m]);
    for (const [id, rare, tw, label] of spots.filter((x) => !process.env.ONLY || process.env.ONLY.split(',').includes(x[0]))) {   /* ONLY=rats,fire checks just those */
      await p.evaluate(([id, rare, tw]) => { const T = window.__T, S = T.S; S.rev.cur = null;
        if (id === 'fire' && !S.roastery.roasters.length) { S.roastery.beans['caturra.washed'] = { kg: 4000, coins: 4000, pts: 400, cup: 84 }; T.act('roast:caturra.washed|medium'); }
        T.revStart(id, { rare, force: true }); const E = S.rev.cur;
        if (id === 'rust') { E.loc = 'mogiana'; E.bed = tw.bed; E.sick = Array.from({ length: 8 }, (_, k) => tw.bed * 8 + k); delete E.silver; }
        if (id === 'monkeys' || id === 'crows') E.loc = 'mogiana';
        if (id === 'crows' && tw.bed !== undefined) { E.waved = true; E.c = Array.from({ length: 8 }, (_, k) => ({ i: tw.bed * 8 + k, t: 99 })).filter((c) => { const s = S.farms.mogiana.shrubs[c.i]; return !(s.x + 9 >= 124 && s.x + 9 < 148 && s.y + 6 >= 105 && s.y + 6 < 135); }); }
        if (id === 'power' && tw.open) E.open = true;
        if (id === 'fire') { E.bay = tw.bay; E.grab = !!tw.grab; E.fid = -1; }
        if (id === 'typhoon') { E.loc = 'mogiana'; if (tw.ty !== 'farm') E.staked = E.stakes.slice(); if (tw.ty === 'roast') E.tarped = Array.from({ length: E.tarpN }, (_, k) => k); }
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
        const f = T.S.farms.mogiana, sb = (i) => [f.shrubs[i].x, f.shrubs[i].y, 18, 22];
        if (id === 'rust') E.sick.forEach((i, k) => boxes.push(['bush ' + (k + 1), sb(i)]));
        if (id === 'crows') { if (E.waved) E.c.forEach((c, k) => boxes.push(['crow ' + (k + 1), D.cbox(E, c)])); else boxes.push(['scarecrow', [128, 109, 16, 22]]); }
        if (id === 'rats') [[82, 292], [100, 286], [118, 294], [136, 286], [154, 294], [172, 286]].forEach(([x, y], k) => boxes.push(['hole ' + (k + 1), [x, y - 2, 10, 9]])); if (id === 'rats' && E.king) boxes.push(['king', [D.kx(E) - 11, 267, 22, 15]]);
        if (id === 'power') { boxes.push(['fuse box', [6, 148, 16, 15]]); if (E.open) for (let k = 0; k < E.n; k++) boxes.push(['switch ' + (k + 1), D.sw(E, k)]); }
        if (id === 'fire') boxes.push(E.grab ? ['roaster', [D.bx(E), 62, 26, 30]] : ['extinguisher', [98, 66, 6, 11]]);
        if (id === 'typhoon') { const sc = T.scene; if (sc === 'farm') E.stakes.forEach((i, k) => boxes.push(['stake ' + (k + 1), sb(i)])); if (sc === 'mill') for (let k = 0; k < E.tarpN; k++) { const r = T.rackAt(k); boxes.push(['rack ' + (k + 1), [r.x, r.y, 40, 12]]); } if (sc === 'roast') boxes.push(['plants', [164, 280, 26, 22]]); }
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
