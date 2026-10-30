const { chromium } = require(process.env.PW_MODULE || '/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' }); const p = await b.newPage({ viewport: { width: 420, height: 900 } });
  await p.addInitScript(() => { window.__SIM = true; try { localStorage.clear(); } catch (e) {} const RD = Date; let off = Date.parse('2026-10-17T09:00:00+09:00') - RD.now(); window.__clock = (s) => { off += s * 1000; }; class FD extends RD { constructor(...a) { if (a.length) super(...a); else super(RD.now() + off); } static now() { return RD.now() + off; } } window.Date = FD; });
  await p.goto('file://' + __dirname + '/kg.html'); await p.waitForTimeout(400); await p.addScriptTag({ path: __dirname + '/policy.js' });
  await p.evaluate(() => { BOT.cfg.maxBuild = 5; BOT.cfg.active = true; });
  for (let day = 1; day <= 28; day++) {
    for (let s = 0; s < 3; s++) { await p.evaluate(() => BOT.run(600)); await p.evaluate(() => BOT.away(7.8)); }
    if ([1, 3, 7, 14, 21, 28].includes(day)) console.log('day ' + day + ':', JSON.stringify(await p.evaluate(() => Object.fromEntries(BOT.G.LOCS.filter((l) => BOT.G.S.farms[l].unlocked).map((l) => [l, Math.round(BOT.G.S.farms[l].harvested)])))), 'prestige', await p.evaluate(() => BOT.G.S.prestige));
  }
  await b.close();
})();
