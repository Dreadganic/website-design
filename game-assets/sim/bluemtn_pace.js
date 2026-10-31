/* Blue Mountain pacing: a player who visits on a schedule, picks clean in the clearings for as long as their patience lasts and
   strips the rest blind, grades every rested batch by hand (all right) and ships every full barrel. Prints, per schedule, the
   certification day by day, what a visit costs in seconds, and the value next to two visits a day.
   node bluemtn_pace.js <test.html from mktest.py> [days] */
const { chromium } = require(process.env.PW_MODULE || '/opt/node-tools/node_modules/playwright');
const path = require('path');
const file = path.resolve(process.argv[2]), DAYS = +(process.argv[3] || 28);
const PLANS = { 'twice a day (8:00, 18:00)': [8, 18], 'once a day (19:00)': [19], 'three a day (8, 13, 21)': [8, 13, 21], 'twice, in a hurry (blind)': [8, 18] };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });
  const res = {};
  for (const [plan, hours] of Object.entries(PLANS)) {
    const g = await b.newPage({ viewport: { width: 390, height: 844 } }); const errs = []; g.on('pageerror', (e) => errs.push(e.message));
    await g.addInitScript(() => {   /* a fake clock the bot moves forward */
      const RD = Date; let off = Date.parse('2026-11-02T00:00:00+09:00') - RD.now();
      window.__clock = (s) => { off += s * 1000; };
      class FD extends RD { constructor(...a) { if (a.length) super(...a); else super(RD.now() + off); } static now() { return RD.now() + off; } }
      window.Date = FD;
    });
    await g.goto('file://' + file); await g.waitForTimeout(800);
    await g.evaluate(() => { const T = window.__T, S = T.S; S.name = S.nameOk = 'Tess'; S.guide = T.GUIDE.length; S.pwalkDone = true; Object.keys(S.tabs).forEach((k) => { S.tabs[k] = true; }); S.prestige = 5;
      T.LOCS.forEach((l) => { const f = S.farms[l]; f.unlocked = true; f.build = Object.assign(f.build || {}, { sorter: 5, wetmill: 5 }); });   /* a typical prestige 5 farm: every building at 5 */
      T.bmTick(); S.bm.seen = true; T.goBm(); for (let i = 0; i < 12; i++) T.closeModal(); document.getElementById('modal').hidden = true; });
    const hurry = /hurry/.test(plan);
    const rows = []; let t = 0;   /* hours since the start, on the farm clock of the plan */
    for (let d = 0; d < DAYS; d++) for (const h of hours) {
      const at = d * 24 + h; await g.evaluate((s) => window.__clock(s), (at - t) * 3600); t = at;
      const r = await g.evaluate(({ hurry }) => {   /* one visit, start to finish, in one go so the game loop can't step in */
        const T = window.__T, S = T.S, B = S.bm, step = (s) => window.__clock(s); let secs = 0, clean = 0, blind = 0;
        T.bmTick();
        const ripe = (i) => B.ter[i].pool + B.ter[i].over, open = [0, 1, 2, 3, 4, 5].filter((i) => i < (4 + (B.lv >= 4 ? 1 : 0) + (B.lv >= 8 ? 1 : 0)));
        if (!hurry) for (let pass = 0; pass < 2; pass++) for (const row of [0, 1, 2]) {   /* wait for each row's clearing, pick it clean basket by basket */
          const ts = open.filter((i) => Math.floor(i / 2) === row); if (!ts.some((i) => ripe(i) >= 0.5)) continue;
          if (pass && secs > 150) break;   /* patience: about two and a half minutes */
          T.bmFog = { row, at: Date.now() }; let k = 0;
          while (Date.now() - T.bmFog.at < T.BM_CLEAR - 900) { const i = ts.filter((x) => ripe(x) >= 0.5).sort((a, c) => ripe(c) - ripe(a))[0]; if (i === undefined) break; T.bmPick(i); clean++; step(0.95); secs += 0.95; k++; }
          step(8); secs += 8 + (row ? 0 : 5);   /* the fog closing between rows, and the first wait */
        }
        for (const i of open) if (ripe(i) >= 0.5) { T.bmFog = null; T.bmPick(i); T.bmPick(i); blind++; secs += 1.5; }   /* the rest, blind */
        T.bmFog = null; T.bmSeal();
        let graded = 0;
        for (let guard = 0; guard < 6; guard++) { const j = B.bbq.findIndex((x) => Date.now() - x.at >= T.bmRestMs()); if (j < 0) break; T.bmGradeStart(j); while (T.bmG) { T.bmGradeBean(T.bmG.beans[T.bmG.k].g); secs += 1.6; } graded++; }
        T.closeModal(); document.getElementById('modal').hidden = true;
        let shipped = 0, coins = 0; for (const gr of ['n1', 'n2', 'n3', 'pb', 'sel']) while (B.bar[gr] >= (gr === 'sel' ? 60 : 30)) { S.roastery.beans = {}; if (!T.bmShip(gr)) break; shipped++; coins += Object.values(S.roastery.beans).reduce((a, x) => a + x.coins, 0); }
        let cert = B.xp; for (let l = 1; l < B.lv; l++) cert += T.bmNeed(l);
        return { cert, lv: B.lv, xp: B.xp, secs: Math.round(secs), clean, blind, graded, shipped, coins, trays: B.trays };
      }, { hurry });
      rows.push(Object.assign({ day: d + 1, h }, r));
    }
    /* total certification earned: levels plus xp */
    const total = await g.evaluate(() => { const T = window.__T, B = T.S.bm; let x = B.xp; for (let l = 1; l < B.lv; l++) x += T.bmNeed(l); return x; });
    const byDay = (n) => { const r = rows.filter((x) => x.day === n).slice(-1)[0]; return r ? r.lv : '-'; };
    const at14 = rows.filter((x) => x.day === 14).slice(-1)[0].cert, coins = rows.reduce((a, x) => a + x.coins, 0);
    res[plan] = { total, rows, errs, lv: [7, 14, 21, 28].map(byDay), at14, coins };
    const v = rows.length, secs = rows.reduce((a, x) => a + x.secs, 0) / v, cl = rows.reduce((a, x) => a + x.clean, 0), bl = rows.reduce((a, x) => a + x.blind, 0);
    console.log(plan.padEnd(28) + ' cert by day 7/14/21/28: ' + res[plan].lv.join('/').padEnd(12) + ' certification earned ' + Math.round(total) + '  visit ~' + Math.round(secs) + ' s  baskets clean ' + cl + ', terraces blind ' + bl + '  shipped ' + rows.reduce((a, x) => a + x.shipped, 0) + (errs.length ? '  ERR ' + errs[0] : ''));
    await g.close();
  }
  const base = res['twice a day (8:00, 18:00)'];
  Object.keys(res).forEach((p) => console.log('  ' + p.padEnd(28) + 'certification by day 14: ' + Math.round(res[p].at14 / base.at14 * 100) + '% · coins shipped over ' + DAYS + ' days: ' + Math.round(res[p].coins / base.coins * 100) + '% of twice a day (' + Math.round(res[p].coins).toLocaleString() + ' coins green, ' + Math.round(res[p].coins / Math.max(1, res[p].rows.reduce((a, x) => a + x.shipped, 0))).toLocaleString() + ' a barrel)'));
  const first = res['twice a day (8:00, 18:00)'].rows.find((x) => x.lv >= 12); console.log('  twice a day reaches certification 12 on day ' + (first ? first.day : '>' + DAYS));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
