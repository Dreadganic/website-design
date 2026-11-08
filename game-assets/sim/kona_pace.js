/* Kona Ridge pacing: a bot plays a fresh island in real time, the way an attentive player would (pick what's ripe, gather ash,
   feed tired soil, mix fertiliser, load empty tanks, vent on red, pull in the gold window), and reports when the co-op first paid,
   what the boat paid each minute (coins, and the share of the farm's own income that is), the island level, the tools that
   arrived and the cowries found.
   node kona_pace.js <test.html from mktest.py> [minutes] */
const { chromium } = require(process.env.PW_MODULE || '/opt/node-tools/node_modules/playwright');
const path = require('path');
const file = path.resolve(process.argv[2]), mins = +(process.argv[3] || 6);
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });
  const g = await b.newPage({ viewport: { width: 390, height: 844 } }); const errs = []; g.on('pageerror', (e) => errs.push(e.message));
  await g.goto('file://' + file); await g.waitForTimeout(800);
  await g.evaluate(() => { const T = window.__T, S = T.S; S.name = S.nameOk = 'Tess'; S.guide = T.GUIDE.length; S.prestige = 6; S.pwalkDone = true; S.practiceTip = true; S.specTip = true; S.roastery.tip = true; Object.keys(S.tabs).forEach((k) => { S.tabs[k] = true; }); T.goKona(); T.konaTick(); S.kona.seen = true; for (let i = 0; i < 8; i++) T.closeModal(); });
  await g.evaluate(() => {
    const T = window.__T, t0 = Date.now(); window.__pace = { first: null, log: [], item: null };
    setInterval(() => {
      const K = T.S.kona; if (!K) return;
      K.plots.forEach((p, i) => { if (i >= T.kPlots() || !p.k) return; if (p.ash) { const a = T.KPLOT(i); T.konaClick(a.x + 21, a.y + 20); } else if (p.p >= 1 && p.f >= 10) T.kHarvest(i); else if (p.f <= 60 && K.bags > 0) T.kFeed(i); });
      T.kPiles.forEach((p) => { if (p.t >= 0) T.konaClick(p.x + 4, p.y + 3); });
      if (K.ash >= 2 && K.compost >= 1 && K.bags < 3) T.kMix();
      K.tanks.forEach((tk, i) => { if (!tk) return; if (T.kVentDue(tk)) T.kVent(i); else if (Date.now() - tk.at >= tk.dur || tk.end) T.kPull(i); });
      for (let i = 0; i < T.kTanks(); i++) if (!K.tanks[i]) { const p = T.kSmartPick(); if (p) T.kLoad(i, p.fr, false, p.v); }
      if (!window.__pace.first && (K.stats || {}).coins > 0) window.__pace.first = Math.round((Date.now() - t0) / 1000);
      if (!window.__pace.item && K.shop.tarps) window.__pace.item = Math.round((Date.now() - t0) / 1000);
    }, 400);
    setInterval(() => { const K = T.S.kona; window.__pace.log.push([Math.round((Date.now() - t0) / 60000), (K.stats || {}).coins || 0, K.lv, (K.stats || {}).orders || 0, (K.stats || {}).tanks || 0, K.ash, K.bags, Math.round(K.plots.slice(0, 4).reduce((a, p) => a + p.f, 0) / 4), Object.keys(K.shop).length, T.routeCw()]); }, 60000);
  });
  await g.waitForTimeout(mins * 60000 + 2000);
  const r = await g.evaluate(() => window.__pace);
  console.log('the co-op first paid after ' + r.first + ' s; the first tool (ash tarps, level 2) after ' + r.item + ' s');
  console.log('min coins-from-the-co-op level orders tanks ash bags soil tools cowries'); r.log.forEach((l) => console.log(l.join('  ')));
  console.log(errs.length ? 'page errors: ' + errs.slice(0, 3).join(' | ') : 'no page errors');
  await b.close();
})();
