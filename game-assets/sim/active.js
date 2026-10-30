const { chromium } = require(process.env.PW_MODULE || '/opt/node-tools/node_modules/playwright');
const page = process.argv[2] || 'real.html';
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' }); const p = await b.newPage({ viewport: { width: 420, height: 900 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { window.__SIM = true; try { localStorage.clear(); } catch (e) {} const RD = Date; let off = 0; window.__clock = (s) => { off += s * 1000; }; class FD extends RD { constructor(...a) { if (a.length) super(...a); else super(RD.now() + off); } static now() { return RD.now() + off; } } window.Date = FD; });
  await p.goto('file://' + __dirname + '/' + page); await p.waitForTimeout(400); await p.addScriptTag({ path: __dirname + '/policy.js' });
  const compare = (label) => p.evaluate((label) => {
    const G = BOT.G, cv = document.getElementById('cv');
    const snap = JSON.stringify(G.S, (k, v) => (k === 'target' || k === 'claim' || k === 'path') ? undefined : v);
    const act = (s) => { const b = document.createElement('button'); b.dataset.act = s; document.body.appendChild(b); b.click(); b.remove(); };
    const tapAt = (s) => { const r = cv.getBoundingClientRect(); cv.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + (s.x + 9) / G.W * r.width, clientY: r.top + (s.y + 11) / G.H * r.height })); };
    const run = (active) => {
      G.S = JSON.parse(snap); const S = G.S; G.LOCS.forEach((l) => S.farms[l].workers.forEach((w) => { w.state = 'seek'; w.path = []; w.target = null; }));
      const c0 = S.coins, x0 = S.xp; let golds = 0, cups = 0;
      for (let sec = 0; sec < 20 * 60; sec++) {
        for (let k = 0; k < 4; k++) { G.tick(0.25); window.__clock(0.25); }
        if (!active || sec % 2) continue;
        document.getElementById('modal').hidden = true;
        S.lots.forEach((l, i) => { if (!l.cupped) { act('cup:' + i); cups++; } });
        const g = G.golden; if (g) { if (S.loc !== g.loc) act('go:' + g.loc); tapAt(S.farms[S.loc].shrubs[g.i]); if (!G.golden) golds++; }
        if (S.hearts > 0) S.farms[S.loc].shrubs.filter((s) => s.p >= 1).slice(0, 2).forEach(tapAt);
      }
      return { coinsPerMin: Math.round((G.S.coins - c0) / 20), khPerMin: Math.round((G.S.xp - x0) / 20), golds, cups };
    };
    const idle = run(false), act2 = run(true);
    G.S = JSON.parse(snap); G.LOCS.forEach((l) => G.S.farms[l].workers.forEach((w) => { w.state = 'seek'; w.path = []; w.target = null; }));
    return label + ' | staff only: ' + JSON.stringify(idle) + ' | active: ' + JSON.stringify(act2) + ' | active/staff coins ×' + (act2.coinsPerMin / Math.max(1, idle.coinsPerMin)).toFixed(2) + ', know-how ×' + (act2.khPerMin / Math.max(1, idle.khPerMin)).toFixed(2);
  }, label);
  for (let i = 0; i < 40; i++) { await p.evaluate(() => BOT.run(120)); if (await p.evaluate(() => BOT.G.S.staff.foreman)) break; }
  console.log(await compare('early (foreman)'));
  for (let i = 0; i < 60; i++) { await p.evaluate(() => BOT.run(120)); if (await p.evaluate(() => BOT.G.S.staff.agent)) break; }
  console.log(await compare('mid (agent)'));
  await p.evaluate(() => { BOT.cfg.maxP = 3; }); for (let i = 0; i < 60; i++) { await p.evaluate(() => BOT.run(600)); if (await p.evaluate(() => BOT.G.S.prestige >= 3 && BOT.G.level() >= 20)) break; }
  console.log(await compare('late (P3, lv20+)'));
  console.log('ERRORS:', errs); await b.close();
})();
