const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); const p = await b.newPage({ viewport: { width: 420, height: 900 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { window.__SIM = true; try { localStorage.clear(); } catch (e) {} const RD = Date; let off = 0; window.__clock = (s) => { off += s * 1000; }; class FD extends RD { constructor(...a) { if (a.length) super(...a); else super(RD.now() + off); } static now() { return RD.now() + off; } } window.Date = FD; });
  await p.goto('file://' + __dirname + '/real.html'); await p.waitForTimeout(400); await p.addScriptTag({ path: __dirname + '/policy.js' });
  const watch = (label, minutes) => p.evaluate(([label, minutes]) => {   /* staff only: no player actions, sample every second */
    const G = BOT.G, S = G.S, st = { label, secs: 0, busy: 0, racks: G.racks(), cap: G.cap(), stuck: 0, maxStuck: 0, waitDry: 0, idleWithStock: 0 };
    const s0 = { coins: S.coins, xp: S.xp, sold: S.stats.lotsSold, done: S.stats.contracts || 0 };
    let expired = 0, run = 0;
    for (let sec = 0; sec < minutes * 60; sec++) {
      const ids = S.contracts.map((c) => [c.id, c.have, c.due]), d0 = S.stats.contracts || 0;
      for (let k = 0; k < 4; k++) { G.tick(0.25); window.__clock(0.25); }
      if ((S.stats.contracts || 0) === d0) ids.forEach(([id, have, due]) => { if (!S.contracts.find((c) => c.id === id) && due <= S.minutesTotal && have > 0) expired++; });
      st.secs++; st.busy += S.lots.length / G.racks();
      if (S.lots.some((l) => l.left <= 0)) st.waitDry++;
      const big = Object.values(S.cherries).some((kg) => kg >= G.cap() * 0.25);
      if (S.lots.length < G.racks() && big) { run++; st.maxStuck = Math.max(st.maxStuck, run); st.stuck++; } else run = 0;
      if (S.lots.length === 0 && G.stored() >= 10) st.idleWithStock++;
    }
    st.rackUse = Math.round(st.busy / st.secs * 100) + '%'; delete st.busy;
    st.coinsPerMin = Math.round((S.coins - s0.coins) / minutes); st.khPerMin = Math.round((S.xp - s0.xp) / minutes);
    st.lots = S.stats.lotsSold - s0.sold; st.contractsDone = (S.stats.contracts || 0) - s0.done; st.expiredWithCoffee = expired;
    st.staff = (S.staff.foreman ? 'foreman ' : '') + (S.staff.agent ? 'agent ' : '') + 'managers ' + G.LOCS.filter((l) => S.farms[l].manager).length; st.level = G.level(); st.prestige = S.prestige;
    return st;
  }, [label, minutes]);
  // early game: play until the foreman is hired, then let staff run alone
  for (let i = 0; i < 40; i++) { await p.evaluate(() => BOT.run(120)); if (await p.evaluate(() => BOT.G.S.staff.foreman)) break; }
  console.log(JSON.stringify(await watch('early: foreman just hired', 20)));
  for (let i = 0; i < 60; i++) { await p.evaluate(() => BOT.run(120)); if (await p.evaluate(() => BOT.G.S.staff.agent)) break; }
  console.log(JSON.stringify(await watch('mid: agent just hired', 30)));
  await p.evaluate(() => { BOT.cfg.maxP = 3; }); for (let i = 0; i < 60; i++) { await p.evaluate(() => BOT.run(600)); if (await p.evaluate(() => BOT.G.S.prestige >= 3 && BOT.G.level() >= 20)) break; }
  console.log(JSON.stringify(await watch('late: prestige 3, level 20+', 30)));
  // offline: 8 hours away with staff
  const before = await p.evaluate(() => ({ c: BOT.G.S.coins, x: BOT.G.S.xp }));
  await p.evaluate(() => { window.__clock(8 * 3600); BOT.G.away(8); BOT.G.closeModal(); });
  console.log('away 8h:', JSON.stringify(await p.evaluate((b0) => ({ coins: Math.round(BOT.G.S.coins - b0.c), kh: Math.round(BOT.G.S.xp - b0.x), lotsDrying: BOT.G.S.lots.length, stored: Math.round(BOT.G.stored()), cap: BOT.G.cap() }), before)));
  console.log('ERRORS:', errs); await b.close();
})();
