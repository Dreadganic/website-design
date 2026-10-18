const { chromium } = require('/opt/node-tools/node_modules/playwright');
const mode = process.argv[2] || 'active';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); const p = await b.newPage({ viewport: { width: 420, height: 900 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { window.__SIM = true; try { localStorage.clear(); } catch (e) {} const RD = Date; let off = Date.parse('2026-10-17T09:00:00+09:00') - RD.now(); window.__clock = (s) => { off += s * 1000; }; class FD extends RD { constructor(...a) { if (a.length) super(...a); else super(RD.now() + off); } static now() { return RD.now() + off; } } window.Date = FD; });
  await p.goto('file://' + __dirname + '/real.html'); await p.waitForTimeout(400); await p.addScriptTag({ path: __dirname + '/policy.js' });
  await p.evaluate((m) => { BOT.cfg.maxBuild = 5; BOT.cfg.active = true; BOT.cfg.mode = m; }, mode);
  const got = []; let away = 0, play = 0;
  while (play < 30 * 3600 && got.length < 5) {
    await p.evaluate(() => BOT.run(600)); play += 600;
    if (mode === 'casual') { await p.evaluate(() => BOT.away(7.8)); away += 7.8 * 3600; }
    const r = await p.evaluate(() => BOT.G.S.rewards.map((x) => x.from));
    r.slice(0, r.length - got.length).reverse().forEach((from) => got.push({ from: from.split(',')[0], playH: (play / 3600).toFixed(1), calendarDays: ((play + away) / 86400).toFixed(1) }));
  }
  console.log(mode, JSON.stringify(got), errs.slice(0, 2)); await b.close();
})();
