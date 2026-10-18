const { chromium } = require('/opt/node-tools/node_modules/playwright');
const mode = process.argv[2] || 'casual';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); const p = await b.newPage({ viewport: { width: 420, height: 900 } });
  await p.addInitScript(() => { window.__SIM = true; try { localStorage.clear(); } catch (e) {} const RD = Date; let off = Date.parse('2026-10-17T09:00:00+09:00') - RD.now(); window.__clock = (s) => { off += s * 1000; }; class FD extends RD { constructor(...a) { if (a.length) super(...a); else super(RD.now() + off); } static now() { return RD.now() + off; } } window.Date = FD; });
  await p.goto('file://' + __dirname + '/real.html'); await p.waitForTimeout(400); await p.addScriptTag({ path: __dirname + '/policy.js' });
  await p.evaluate(() => { BOT.cfg.maxBuild = 5; BOT.cfg.active = true; BOT.cfg.noOsaka = true; });
  const weeks = [];
  for (let day = 1; day <= 14; day++) {
    for (let s = 0; s < (mode === 'casual' ? 3 : 12); s++) { await p.evaluate(() => BOT.run(600)); await p.evaluate((h) => BOT.away(h), mode === 'casual' ? 7.8 : 1.83); }
    if (day % 7 === 0) weeks.push(await p.evaluate(() => BOT.G.S.cranes));
  }
  console.log(mode, 'cranes from play only, end of week 1 / week 2:', weeks.join(' / '));
  await b.close();
})();
