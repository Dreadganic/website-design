/* Kona Ridge end to end, in the real game: locked before prestige 6, then reached by the farm arrows; harvesting, feeding and
   mixing fertiliser with real taps on the map; ash piles and an eruption; loading, venting and pulling tanks (gold, early,
   over-fermented while watching, stopped by itself while away); the co-op boat's order cards, loose sales and the full-boat bonus;
   spare lots shipped to the roastery and roasting into bags; old saves' patio lots;
   compost from the mainland mills; tools arriving with island levels (tanks, keeper, goose, title); fruit and plots; the tasks;
   prestige and a reload keeping the island; and the island page with no errors.
   node kona_e2e.js <test.html from mktest.py> [shots dir] */
const { chromium } = require(process.env.PW_MODULE || '/opt/node-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
const file = path.resolve(process.argv[2]), shots = process.argv[3] || ''; if (shots) fs.mkdirSync(shots, { recursive: true });
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m); } };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });
  const g = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true }); const errs = []; g.on('pageerror', (e) => errs.push(e.message));
  /* a fresh browser starts with empty storage; no wipe-on-load script, which could miss its flag on a reload and wipe the save */
  await g.goto('file://' + file); await g.waitForTimeout(800);
  const E = (f, a) => g.evaluate(f, a);
  const clean = () => E(() => { const T = window.__T; for (let i = 0; i < 8; i++) T.closeModal(); document.getElementById('modal').hidden = true; document.getElementById('toast').hidden = true; T.S.nav = null; T.S.navSeen = new Proxy({}, { get: () => true }); });
  const tapMap = async (x, y) => { await clean(); const p = await E(([x, y]) => { const r = document.getElementById('cv').getBoundingClientRect(), k = r.width / 192; return [r.left + x * k, r.top + y * k]; }, [x, y]); await g.mouse.click(p[0], p[1]); await g.waitForTimeout(120); };
  const K = (f, a) => E(f, a);
  const setup = (p) => E((p) => { /* today's check-in is done: its card would otherwise pop up 400 ms after the first tap, over the map */ const T = window.__T, S = T.S, d = new Date(); S.checkin.last = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); S.name = S.nameOk = 'Tess'; S.guide = T.GUIDE.length; S.prestige = p; S.pwalkDone = true; Object.keys(S.tabs).forEach((k) => { S.tabs[k] = true; }); S.rev.cur = null; T.revSess = 0; S.loc = 'osaka'; S.isle = false; T.setTab('farm', true); }, p);

  /* locked before prestige 6 */
  await setup(5); await clean();
  await E(() => { const T = window.__T; T.bmTick(); T.S.bm.seen = true; T.travel(1); }); await g.waitForTimeout(150);   /* the harbour, then Blue Mountain (prestige 5), come after Osaka */
  ok(await K(() => window.__T.scene === 'hb'), 'at prestige 5 the arrow after Osaka goes to the harbour');
  await E(() => window.__T.travel(1)); await g.waitForTimeout(150);
  ok(await K(() => window.__T.scene === 'bm'), 'then on to Blue Mountain');
  await E(() => window.__T.travel(1)); await g.waitForTimeout(150);
  ok(await K(() => window.__T.scene === 'farm' && window.__T.S.loc === 'mogiana'), 'before prestige 6 the next arrow goes from Blue Mountain back to Mogiana');
  ok(!(await K(() => /Kona Ridge/.test(document.getElementById('panel').innerHTML + document.body.innerText.slice(0, 0)))), 'no Kona Ridge before prestige 6');

  /* prestige 6: Kona Ridge closes the ring of farms and islands */
  await setup(6); await clean();
  await E(() => { const T = window.__T; T.S.loc = 'mogiana'; T.setTab('farm', true); document.getElementById('prevLoc').click(); }); await g.waitForTimeout(400);
  ok(await K(() => window.__T.scene === 'kona'), 'Kona Ridge comes last in the ring, after Blue Mountain: the arrow back from Mogiana');
  await E(() => window.__T.konaTick()); await g.waitForTimeout(700);
  ok(await K(() => !!window.__T.S.kona && window.__T.S.kona.plots.length === 8), 'the island starts with its eight plots');
  ok(await K(() => !document.getElementById('modal').hidden && /Kona Ridge/.test(document.getElementById('modalCard').innerText)), 'Rosa welcomes you to the island');
  await clean();
  ok(await K(() => document.getElementById('locName').textContent === 'Kona Ridge, Hawaiʻi' && /Lv 1/.test(document.getElementById('locLv').textContent)), 'the farm bar names the island and its level');
  ok(await K(() => window.__T.kPlots() === 4 && window.__T.kTanks() === 2), 'four plots and two tanks to start');

  /* harvesting coffee and fruit by tapping */
  await K(() => { const k = window.__T.S.kona; k.plots[0].p = 1; k.plots[1].p = 1; });
  const pt = (i, dx, dy) => K(([i, dx, dy]) => { const a = window.__T.KPLOT(i); return [a.x + dx, a.y + dy]; }, [i, dx, dy]);
  let p0 = await pt(0, 21, 30); await tapMap(p0[0], p0[1]);
  ok(await K(() => { const k = window.__T.S.kona, v = k.plots[0].v; return k.cherries[v] > 20 && k.plots[0].p < 0.2 && k.plots[0].f === 97; }), 'tapping a ripe coffee plot picks it (about 25 kg) and takes 3 from its soil');
  p0 = await pt(1, 21, 30); await tapMap(p0[0], p0[1]);
  ok(await K(() => { const k = window.__T.S.kona; return k.fruit.mango === 10 && k.plots[1].f === 95; }), 'a ripe mango tree gives 10 kg of fruit and takes 5 from its soil');

  /* soil and fertiliser */
  await K(() => { const k = window.__T.S.kona; k.plots[2].f = 50; k.plots[2].p = 0.3; k.bags = 1; });
  p0 = await pt(2, 21, 30); await tapMap(p0[0], p0[1]);
  ok(await K(() => { const k = window.__T.S.kona; return k.plots[2].f === 90 && k.bags === 0; }), 'tapping a plot whose soil is low spreads a bag of fertiliser: +40');
  await K(() => { const k = window.__T.S.kona; k.plots[2].f = 5; k.plots[2].p = 0.5; k.last = Date.now() - 1000; window.__T.konaTick(); });
  ok(await K(() => window.__T.S.kona.plots[2].p === 0.5), 'under 10 soil nothing grows');
  await K(() => { const k = window.__T.S.kona; k.ash = 2; k.compost = 1; k.bags = 0; });
  await K(() => { const s = window.__T.KSHED; window.__shed = [s.x + 20, s.y + 30]; });
  let sh = await K(() => window.__shed); await tapMap(sh[0], sh[1]);
  ok(await K(() => { const k = window.__T.S.kona; return k.bags === 1 && k.ash === 0 && k.compost === 0; }), 'the shed mixes 2 ash and 1 compost into a bag');
  await tapMap(sh[0], sh[1]);
  ok(await K(() => window.__T.S.kona.bags === 1), 'without enough ash the shed mixes nothing');

  /* ash piles and an eruption */
  await K(() => { const T = window.__T; T.kPuffNow(false); T.kPiles.forEach((p) => { p.t = 0.1; }); });
  const pile = await K(() => { const p = window.__T.kPiles[0]; return [p.x + 4, p.y + 3]; });
  const ash0 = await K(() => window.__T.S.kona.ash);
  await tapMap(pile[0], pile[1]);
  ok(await K((a) => window.__T.S.kona.ash === a + 1, ash0), 'tapping an ash pile gathers 1 ash');
  await K(() => { const T = window.__T, k = T.S.kona; k.plots[3].k = 'mango'; T.kPuffNow(true); });
  ok(await K(() => window.__T.kPiles.length >= 8 && window.__T.S.kona.plots.filter((p) => p.ash).length >= 1), 'an eruption drops 8 piles and covers fruit trees in ash');
  ok(await K(() => window.__T.S.kona.plots.filter((p) => p.ash).every((p) => p.k !== 'coffee')), 'only fruit trees get covered, never coffee');
  const ashed = await K(() => window.__T.S.kona.plots.map((p, i) => (p.ash ? i : -1)).filter((i) => i > -1));
  const ash1 = await K(() => window.__T.S.kona.ash);
  for (const i of ashed) { p0 = await pt(i, 21, 20); await tapMap(p0[0], p0[1]); }
  ok(await K(([a, n]) => window.__T.S.kona.ash === a + 2 * n && !window.__T.S.kona.plots.some((p) => p.ash), [ash1, ashed.length]), 'tapping a covered tree clears it for 2 ash');
  ok(await K(() => window.__T.S.kona.log.erupt === 1), 'clearing every tree with no tarps goes in the log');

  /* tanks and the co-op boat */
  const boat = () => K(() => { const k = window.__T.S.kona; k.boat = { at: Date.now() + 300e3, v2: true, paid: 0, cards: [{ fr: 'mango', v: null, gold: false, pay: 1.5, xp: 6, done: false }, { fr: 'mango', v: null, gold: true, pay: 2, xp: 10, done: false }, { fr: 'mango', v: 'caturra', gold: false, pay: 2.5, xp: 14, done: false }] }; });
  ok(await K(() => { const b = window.__T.S.kona.boat; return !!b && b.cards.length === 3 && b.at > Date.now(); }), 'the co-op boat is at the dock with three order cards');
  await boat();
  await K(() => { const k = window.__T.S.kona, v = k.plots[0].v; k.cherries = { [v]: 260 }; k.fruit.mango = 40; });
  const tx = (i) => K((i) => window.__T.KTANK_X(i) + 13, i), TY = await K(() => window.__T.KTANK_Y);
  await tapMap(await tx(0), TY + 20);
  ok(await K(() => { const t = window.__T.S.kona.tanks[0]; return !!t && t.kg === 100 && t.fr === 'mango' && window.__T.S.kona.fruit.mango === 30; }), 'one tap on an empty tank loads 100 kg with 10 kg of mango');
  ok(await K(() => window.__T.S.kona.tanks[0].dur === 60e3), 'a mango tank ferments in a minute');
  await K(() => { const t = window.__T.S.kona.tanks[0]; t.at = Date.now() - t.dur / 2 - 1000; });
  ok(await K(() => window.__T.kVentDue(window.__T.S.kona.tanks[0])), 'halfway through, the mango tank needs venting');
  await tapMap(await tx(0), TY + 20);
  ok(await K(() => window.__T.S.kona.tanks[0].vj === 1), 'tapping the tank vents it');
  await tapMap(await tx(0), TY + 20);
  ok(await K(() => !!window.__T.S.kona.tanks[0]), 'one tap past halfway doesn\'t pull it');
  let sh0 = await K(() => window.__T.S.coins);
  await tapMap(await tx(0), TY + 20);
  ok(await K((s0) => { const k = window.__T.S.kona; return !k.tanks[0] && k.boat.cards[2].done && k.boat.paid > 0 && window.__T.S.coins - s0 >= k.boat.paid; }, sh0), 'a second tap pulls it early, and the lot fills the best card it fits (×2.5), paid in coins');
  ok(await K(() => !window.__T.S.kona.boat.cards[1].done), 'an early pull can\'t fill a gold-window card');

  await K(() => { const k = window.__T.S.kona, v = k.plots[0].v; k.cherries[v] = 400; k.fruit.mango = 60; window.__T.kLoad(1, 'mango'); const t = k.tanks[1]; t.at = Date.now() - t.dur - 2000; t.vj = 1; });
  sh0 = await K(() => window.__T.S.coins);
  await tapMap(await tx(1), TY + 20);
  ok(await K((s0) => { const k = window.__T.S.kona; return k.boat.cards[1].done && window.__T.S.coins > s0 && Object.keys(k.log.perfect).length === 1; }, sh0), 'a pull in the gold window fills the gold card and goes in the collection log');
  ok(await K(() => { const T = window.__T, S = T.S, k = S.kona, o = Math.round(T.saleFor('caturra', 'cof_mango', 20, { raked: 1 }).coins * 1.5), s0 = S.coins; T.kDeliver({ v: 'caturra', fr: 'mango', kg: 20, adj: 1, pay: 1, q: 'early' }); return k.boat.full && S.coins - s0 === o + Math.round(k.boat.paid * 0.25) && k.boat.at <= Date.now() + 3000; }), 'filling the last card pays ×1.5, then a quarter of the boat\'s takings as a bonus, and the boat sails');
  await K(() => { const k = window.__T.S.kona; k.boat.at = Date.now() - 10; k.last = Date.now() - 100; window.__T.konaTick(); });
  ok(await K(() => { const b = window.__T.S.kona.boat; return !b.full && b.cards.length === 3 && b.cards.every((c) => !c.done); }), 'a new boat docks with fresh cards');
  await boat();
  const loose = await K(() => { const T = window.__T, S = T.S, l = Math.round(T.saleFor('caturra', 'cof_lemon', 20, { raked: 1 }).coins), s0 = S.coins, w = T.kDeliver({ v: 'caturra', fr: 'lemon', kg: 20, adj: 1, pay: 1, q: 'early' }); return { w, got: S.coins - s0, l }; });
  ok(loose.w === 'coop', 'a lot no card wants sells loose');
  ok(loose.got === loose.l, 'loose lots sell at their green price, less than any order');
  const cardPt = await K(() => { const p = window.__T.KCARD(0, 3); return [p.x + 13, p.y + 16]; });
  await tapMap(cardPt[0], cardPt[1]); await g.waitForTimeout(150);
  ok(await K(() => !document.getElementById('modal').hidden && /Pays/.test(document.getElementById('modalCard').innerText) && /Mango co-ferment/.test(document.getElementById('modalCard').innerText)), 'tapping an order card says what it wants and how to fill it');
  await clean();

  await K(() => { const T = window.__T, k = T.S.kona; k.cherries[k.plots[0].v] = 300; k.fruit.mango = 40; T.kLoad(0, 'mango'); const t = k.tanks[0]; t.vj = 1; t.at = Date.now() - t.dur - t.win - 500; k.last = Date.now() - 100; T.konaTick(); });
  ok(await K(() => window.__T.S.kona.tanks[0].end === 'late'), 'missing the window while watching over-ferments the tank');
  await K(() => { const T = window.__T, k = T.S.kona; k.tanks[0] = null; k.cherries[k.plots[0].v] = 300; k.fruit.mango = 40; T.kLoad(0, 'mango'); const t = k.tanks[0]; t.at = Date.now() - t.dur - t.win - 3600e3; k.last = Date.now() - 3600e3; T.konaTick(); });
  ok(await K(() => window.__T.S.kona.tanks[0].end === 'half' && window.__T.S.kona.tanks[0].miss === 0), 'away, a tank stops by itself at the end of its window, and missed vents cost nothing');
  await K(() => { const T = window.__T, k = T.S.kona; k.tanks[0] = null; k.cherries[k.plots[0].v] = 300; k.fruit.mango = 40; T.kLoad(0, 'mango'); const t = k.tanks[0]; t.at = Date.now() - t.dur / 2 - 9000; k.last = Date.now() - 100; T.konaTick(); });
  ok(await K(() => window.__T.S.kona.tanks[0].miss === 1), 'a vent missed while watching costs half a cup point');
  await K(() => { window.__T.S.kona.tanks[0] = null; });

  /* spare lots to the roastery, and old saves */
  await K(() => { const T = window.__T; T.S.roastery.beans = {}; T.S.roastery.want = {}; T.S.kona.spare = 'osaka'; });
  ok(await K(() => window.__T.kDeliver({ v: 'caturra', fr: 'lemon', kg: 20, adj: 1.5, pay: 1, q: 'early' }) === 'osaka'), 'with "ship to the roastery" chosen, spare lots go to Osaka');
  ok(await K(() => { const b = window.__T.S.roastery.beans['caturra.cof_lemon']; return !!b && b.kg >= 20 && b.coins > 0; }), 'they arrive as a co-ferment bin');
  await K(() => { window.__T.S.kona.spare = 'coop'; });
  await E(() => { const T = window.__T, k = Object.keys(T.S.roastery.beans)[0]; T.S.roastery.roasters = []; T.startRoast(k, 'medium'); const r = T.S.roastery.roasters[0]; if (r) r.start -= 1e7; T.roasteryTick && T.roasteryTick(1); });
  await E(() => window.__T.setTab('roast')); await g.waitForTimeout(500);
  ok(await K(() => window.__T.S.roastery.bags.some((x) => String(x.key).includes('cof_lemon') && x.coins > 0)), 'the co-ferment bin roasts into bags that pay');
  ok(!(await K(() => Object.keys(window.__T.S.methods).some((m) => m.startsWith('cof_')))), 'co-ferments never join the mainland\'s processes');
  await K(() => { const k = window.__T.S.kona; k.patio = [{ v: 'caturra', fr: 'mango', kg: 20, adj: 2, pay: 1.15, q: 'gold', at: Date.now(), dry: 180e3 }]; k.shop.patio2 = true; k.last = Date.now() - 100; window.__T.konaTick(); });
  ok(await K(() => { const k = window.__T.S.kona; return !k.patio && !k.shop.patio2 && k.shells === undefined; }, sh0), 'old saves: lots on the patio go to the boat, the Second patio goes, and there are no shells');

  /* compost from the mainland mills */
  const c0 = await K(() => window.__T.S.kona.compost);
  await E(() => { const T = window.__T; T.S.cherries.caturra = 500; T.S.lots = []; T.S.lv.racks = 6; T.startLot('caturra', 'washed', true); });
  ok(await K((c) => window.__T.S.kona.compost > c, c0), 'milling cherries on the mainland sends compost to Kona');

  /* levels, the tools and the keeper */
  await K(() => { const T = window.__T; T.S.kona.lv = 1; T.S.kona.xp = 0; for (let i = 0; i < 7; i++) T.kXp(T.kNeed(T.S.kona.lv) - T.S.kona.xp); });
  ok(await K(() => window.__T.S.kona.lv === 8 && window.__T.kPlots() === 6), 'level 8: two more plots open');
  await E(() => window.__T.goKona()); await E(() => { window.__T.S.konaSub = 'island'; window.__T.setTab('farm'); }); await g.waitForTimeout(400); await clean();
  await E(() => window.__T.act('k_plantcard:4')); await g.waitForTimeout(150);
  ok(await K(() => !document.querySelector('#modalCard [data-act="k_plant:4.pineapple"]').disabled && document.querySelector('#modalCard [data-act="k_plant:4.lemon"]').disabled), 'pineapple opens at level 8, lemon waits for 15');
  await E(() => document.querySelector('#modalCard [data-act="k_plant:4.pineapple"]').click()); await g.waitForTimeout(120);
  ok(await K(() => window.__T.S.kona.plots[4].k === 'pineapple'), 'planting a pineapple');
  ok(await K(() => window.__T.kTanks() === 3 && window.__T.S.kona.shop.tarps && window.__T.S.kona.shop.spreader && !window.__T.S.kona.shop.keeper), 'tools arrive with island levels: at level 8 the tarps, a third tank and the spreader, not yet the keeper');
  await K(() => { window.__T.S.konaSub = 'log'; window.__T.renderPanel(); }); await g.waitForTimeout(200);
  ok(await K(() => /Tank keeper/.test(document.getElementById('panel').innerText) && /Level 20/.test(document.getElementById('panel').innerText)), 'the Log lists the tools and the level each arrives at');
  await K(() => { const T = window.__T, k = T.S.kona; for (let i = 0; i < 40; i++) T.kXp(T.kNeed(k.lv) - k.xp); });
  ok(await K(() => { const S = window.__T.S; return S.kona.shop.keeper && S.rev.pets.nene && S.sitems.title['kona:master'] && S.kona.fin === 'copper'; }), 'by level 45: the keeper, the goose, the title and the copper finish');
  ok(await K(() => [5, 10, 15, 20, 25, 30, 35, 40, 45].every((l) => window.__T.S.route.got['k_l' + l])), 'every fifth level found a cowrie for the harbour');
  await K(() => { const T = window.__T, k = T.S.kona, v = k.plots[0].v; k.tanks = []; k.cherries = { [v]: 900 }; k.fruit.mango = 90; T.S.roastery.beans = {}; k.last = Date.now() - 100; T.konaTick(); });
  ok(await K(() => window.__T.S.kona.tanks.filter(Boolean).length >= 3), 'the keeper loads every empty tank');
  sh0 = await K(() => window.__T.S.coins);
  await K(() => { const T = window.__T, k = T.S.kona; k.tanks.forEach((t) => { if (t) { t.at = Date.now() - t.dur - 100; t.vj = t.n; } }); k.last = Date.now() - 100; T.konaTick(); });
  ok(await K((s0) => { const k = window.__T.S.kona; return window.__T.S.coins > s0 && (k.stats.orders || 0) > 0; }, sh0), 'the keeper pulls in the window, and the lots fill the boat\'s orders');

  /* tasks */
  ok(await K(() => { const T = window.__T; return T.TASK_KINDS.ktank.ok() && /Kona/.test(T.TASK_KINDS.ktank.text); }), 'the daily perfect-tank task can come up once the island is open');

  /* the island's pages render, and prestige and a reload keep the island */
  for (const sub of ['island', 'book', 'log']) { await K((s) => { window.__T.S.konaSub = s; window.__T.renderPanel(); }, sub); await g.waitForTimeout(100); }
  ok(await K(() => /Collection log/.test(document.getElementById('panel').innerText)), 'the collection log page');
  if (shots) await g.screenshot({ path: shots + '/kona-log.png' });
  const lv = await K(() => window.__T.S.kona.lv);
  await E(() => { const T = window.__T, S = T.S; S.xp = T.XP_AT(T.prestigeNeed()); T.prestige(); });
  ok(await K((l) => window.__T.S.kona.lv === l && window.__T.S.prestige === 7, lv), 'prestige keeps the island');
  await E(() => { window.__T.goKona(); });
  await g.evaluate(() => { const ev = new Event('visibilitychange'); Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(ev); });
  await E(() => window.__T.save()); await g.waitForTimeout(400); await g.reload(); await g.waitForTimeout(1200);
  ok(await K((l) => !!window.__T.S.kona && window.__T.S.kona.lv === l && !!window.__T.S.kona.boat && window.__T.S.route && window.__T.S.route.got.k_l45, lv), 'a reload keeps the island, its boat and its finds');
  ok(await K(() => window.__T.S.roastery && Object.keys(window.__T.S.roastery.beans).some((x) => x.includes('cof_')) || window.__T.S.roastery.bags.some((x) => String(x.key).includes('cof_'))), 'co-ferment coffee survives the reload');
  await E(() => window.__T.setTab('roast')); await g.waitForTimeout(400);
  ok(errs.length === 0, 'no page errors: ' + errs.slice(0, 3).join(' | '));
  console.log(pass + ' passed, ' + fail + ' failed');
  await b.close(); process.exit(fail ? 1 : 0);
})();
