/* A human-like playthrough: uneven sessions with breaks, sporadic spending, some missed golden bushes and few hand cups.
   node human.js <page.html> <out.json> [target prestige] [seed] */
const { chromium } = require(process.env.PW_MODULE || '/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const [html, out, target, seed] = [process.argv[2], process.argv[3], +(process.argv[4] || 4), +(process.argv[5] || 7)];
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' }); const p = await b.newPage({ viewport: { width: 420, height: 900 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { window.__SIM = true; try { localStorage.clear(); } catch (e) {} const RD = Date; let off = Date.parse('2026-11-02T19:00:00+09:00') - RD.now(); window.__clock = (s) => { off += s * 1000; }; class FD extends RD { constructor(...a) { if (a.length) super(...a); else super(RD.now() + off); } static now() { return RD.now() + off; } } window.Date = FD; });
  await p.goto('file://' + __dirname + '/' + html); await p.waitForTimeout(400); await p.addScriptTag({ path: __dirname + '/policy.js' });
  await p.evaluate((nc) => { BOT.cfg.human = true; BOT.cfg.active = true; if (nc) BOT.cfg.noCos = true; BOT.cfg.maxBuild = 10; BOT.G.S.sfx = false; BOT.G.S.music = false; }, process.argv[6] === 'nocos');
  let r = { p: 0 }, s = seed; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const farms = [], sessions = []; let playH = 0, day = 0;
  while (r.p < target && playH < 80 && errs.length < 5) {
    const mins = 20 + Math.floor(rnd() * 26);
    for (let m = 0; m < mins; m += 5) {
      r = await p.evaluate(() => BOT.run(300, 6));
      farms.push(await p.evaluate(() => { const G = BOT.G, S = G.S; return { t: Math.round(BOT.t), p: S.prestige, lv: G.level(), coins: Math.round(S.coins), kh: Math.round(S.points), racks: G.racks(), cap: G.cap(), rep: S.roastery ? Math.round(S.roastery.rep || 0) : 0, repLv: G.repLevel ? G.repLevel() : 0, roastCoins: Math.round(BOT.roastCoins || 0), roastSold: BOT.roastSold || 0, rcos: G.rCount ? G.rCount() : 0, charm: G.shopCharm ? G.shopCharm() : 0, nb: G.nbTotal ? G.nbTotal() : 0, research: S.research || 0, req: (S.stats || {}).requests || 0, titles: Object.keys((S.sitems || {}).title || {}).length,
        f: G.LOCS.filter((l) => S.farms[l].unlocked).map((l) => { const f = S.farms[l]; return { l, fl: G.farmLevel ? G.farmLevel(f) : 0, asleep: !!S.dormant[l], w: f.workers.length, max: G.maxPickers(f), b: Object.values(f.build).reduce((a, x) => a + x, 0), mgr: !!f.manager, m: f.mastery || 0, field: !!f.field }; }) }; }));
      if (r.p >= target) break;
    }
    playH += mins / 60;
    const h = 2 + Math.floor(rnd() * 8), cap = await p.evaluate(() => (BOT.G.S.prestige >= 3 ? 18 : 12));
    sessions.push({ mins, away: Math.min(h, cap) });
    await p.evaluate((x) => BOT.away(x), Math.min(h, cap));
  }
  const data = await p.evaluate(() => ({ events: BOT.events, buys: BOT.buys, snaps: BOT.snaps, tabs: BOT.tabs }));
  Object.assign(data, { farms, sessions, playH, errs });
  fs.writeFileSync(out, JSON.stringify(data)); console.log('played', playH.toFixed(1), 'h over', sessions.length, 'sessions, prestige', r.p, 'errors', errs.slice(0, 3));
  await b.close();
})();
