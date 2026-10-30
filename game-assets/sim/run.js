const { chromium } = require(process.env.PW_MODULE || '/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const mode = process.argv[2] || 'active', target = +(process.argv[3] || 5), out = process.argv[4] || ('run-' + mode + '.json'), html = process.argv[5] || 'sim.html', maxBuild = +(process.argv[6] || 3);
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 420, height: 900 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => {
    window.__SIM = true; try { localStorage.clear(); } catch (e) {}
    const RD = Date; let off = Date.parse('2026-10-17T09:00:00+09:00') - RD.now();   /* a fake clock the bot moves forward */
    window.__clock = (s) => { off += s * 1000; };
    class FD extends RD { constructor(...a) { if (a.length) super(...a); else super(RD.now() + off); } static now() { return RD.now() + off; } }
    window.Date = FD;
  });
  await p.goto('file://' + __dirname + '/' + html); await p.waitForTimeout(400);
  await p.addScriptTag({ path: __dirname + '/policy.js' });
  await p.evaluate((m) => { BOT.cfg.mode = m.mode; BOT.cfg.maxBuild = m.maxBuild; BOT.cfg.active = !!m.active; BOT.G.S.sfx = false; BOT.G.S.music = false; }, { mode, maxBuild, active: process.argv[7] === 'active' });
  const t0 = Date.now(); let hours = 0;
  while (true) {
    let r;
    if (mode === 'active') r = await p.evaluate(() => BOT.run(600));
    else { r = await p.evaluate(() => BOT.run(600)); await p.evaluate(() => BOT.away(7.8)); }   /* casual: three 10-minute sessions a day */
    hours = r.t / 3600;
    process.stdout.write(`\r${mode} played ${hours.toFixed(2)} h  lv ${r.lv}  prestige ${r.p}   `);
    if (r.p >= target || hours > 60 || errs.length > 5) break;
  }
  const data = await p.evaluate(() => ({ events: BOT.events, snaps: BOT.snaps, buys: BOT.buys.length, gaps: BOT.gaps, awayH: BOT.awayH || 0, final: JSON.parse(JSON.stringify(BOT.G.S, (k, v) => (k === 'target' || k === 'claim' || k === 'path') ? undefined : v)) }));
  data.errs = errs; data.realSec = (Date.now() - t0) / 1000; data.mode = mode;
  fs.writeFileSync(out, JSON.stringify(data));
  console.log('\nreal seconds', data.realSec, 'errors', errs.slice(0, 3));
  await b.close();
})();
