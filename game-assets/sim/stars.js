/* how prestiges and know-how land per calendar month for different players, over three months */
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const [mode, sessions, mins] = [process.argv[2], +process.argv[3], +process.argv[4]];
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); const p = await b.newPage({ viewport: { width: 420, height: 900 } });
  await p.addInitScript(() => { window.__SIM = true; try { localStorage.clear(); } catch (e) {} const RD = Date; let off = Date.parse('2026-11-01T09:00:00+09:00') - RD.now(); window.__clock = (s) => { off += s * 1000; }; class FD extends RD { constructor(...a) { if (a.length) super(...a); else super(RD.now() + off); } static now() { return RD.now() + off; } } window.Date = FD; });
  await p.goto('file://' + __dirname + '/real.html'); await p.waitForTimeout(400); await p.addScriptTag({ path: __dirname + '/policy.js' });
  await p.evaluate(() => { BOT.cfg.maxBuild = 5; BOT.cfg.active = true; });
  const months = {}; let lastP = 0, lastKey = '';
  for (let day = 0; day < +process.argv[5]; day++) {
    for (let s = 0; s < sessions; s++) { await p.evaluate((sec) => BOT.run(sec), mins * 60); await p.evaluate((h) => BOT.away(h), (24 - sessions * mins / 60) / sessions); }
    const st = await p.evaluate(() => ({ stars: BOT.G.S.season.stars, caps: JSON.stringify(BOT.G.S.season.caps), key: BOT.G.S.season.key, p: BOT.G.S.prestige, sp: BOT.G.S.season.prestige, kh: Math.round(BOT.G.S.season.kh || 0), lv: BOT.G.level() }));
    months[st.key] = st; console.log(mode, "day", day + 1, JSON.stringify(st));
  }
  console.log(mode.padEnd(8), Object.entries(months).map(([k, v]) => k + ': ' + v.sp + ' prestiges this month (P' + v.p + ' total, lv ' + v.lv + '), ' + (v.kh / 1e6).toFixed(2) + 'M kh').join(' | '));
  await b.close();
})();
