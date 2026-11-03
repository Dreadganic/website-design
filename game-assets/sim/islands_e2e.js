/* The Island Route end to end, in the real game: the harbour opening with Blue Mountain at prestige 5 and its place in the farm
   arrows; Captain Ama's welcome and the first cowrie; old saves (Kona shells into cowries, tools at their levels, certifications
   and levels already reached); the ledger (56 finds, each once) and its hooks on Blue Mountain, Kona Ridge and the farm; the
   harbour board (costs, order, every project's effect); voyages (bags as trade, real hours, the lighthouse, the second hold,
   the cargo into a bin or the shed, the first trip's cowrie, the bottle); Miss Pearl and Uncle Kimo; the Counter's island
   shelf; taps on the harbour map; the harbour page; and a reload keeping it all.
   node islands_e2e.js <test.html from mktest.py> [shots dir] */
const { chromium } = require(process.env.PW_MODULE || '/opt/node-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
const file = path.resolve(process.argv[2]), shots = process.argv[3] || ''; if (shots) fs.mkdirSync(shots, { recursive: true });
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m); } };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });
  const g = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true }); const errs = []; g.on('pageerror', (e) => errs.push(e.message));
  g.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) errs.push(m.text()); });
  await g.goto('file://' + file); await g.waitForTimeout(800);
  const E = (f, a) => g.evaluate(f, a);
  const clean = () => E(() => { const T = window.__T; for (let i = 0; i < 8; i++) T.closeModal(); document.getElementById('modal').hidden = true; document.getElementById('toast').hidden = true; T.S.nav = null; T.S.navSeen = new Proxy({}, { get: () => true }); });
  const tapMap = async (x, y) => { await clean(); const p = await E(([x, y]) => { const sc = document.getElementById('scroller'), cv = document.getElementById('cv'), k = cv.getBoundingClientRect().width / 192, room = sc.scrollHeight - sc.clientHeight; if (room > 0) sc.scrollTop = Math.max(0, Math.min(room, cv.offsetTop + y * k - sc.clientHeight / 2)); const r = cv.getBoundingClientRect(); return [r.left + x * k, r.top + y * k]; }, [x, y]); await g.mouse.click(p[0], p[1]); await g.waitForTimeout(150); };
  const modal = () => E(() => document.getElementById('modal').hidden ? '' : document.getElementById('modalCard').innerText);
  const setup = (p) => E((p) => { const T = window.__T, S = T.S, d = new Date(); S.checkin.last = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); S.name = S.nameOk = 'Tess'; S.guide = T.GUIDE.length; S.prestige = p; S.pwalkDone = true; S.practiceTip = true; S.roastery.tip = true; Object.keys(S.tabs).forEach((k) => { S.tabs[k] = true; }); S.rev.cur = null; T.revSess = 0; S.loc = 'osaka'; S.isle = false; T.setTab('farm', true); }, p);
  const bags = (n) => E((n) => { const S = window.__T.S; S.roastery.bags = Array.from({ length: n }, (_, i) => ({ key: 'caturra.washed', profile: 'medium', kg: 1, coins: 100 + i, pts: 10, q: 70, cup: 85 })); }, n);

  /* the ledger and the board, as data */
  ok(await E(() => window.__T.LEDGER.length === 56 && new Set(window.__T.LEDGER.map((e) => e.id)).size === 56), 'the ledger holds 56 different finds');
  ok(await E(() => { const L = window.__T.LEDGER; return ['hb', 'bm', 'kona', 'farm'].map((i) => L.filter((e) => e.isle === i).length).join() === '8,22,22,4'; }), 'eight at the harbour, 22 on each island, four on the farm');
  ok(await E(() => window.__T.BOARD.reduce((a, b) => a + b.cost, 0) === 53 && window.__T.BOARD.length === 12), 'twelve projects cost 53 cowries in all, so a few finds can be missed');

  /* closed before prestige 5, then the harbour sits between Osaka and Blue Mountain */
  await setup(4); await clean();
  ok(await E(() => !window.__T.hbOpen()), 'no harbour before prestige 5');
  await setup(5); await clean();
  await E(() => { const T = window.__T; T.bmTick(); T.S.bm.seen = true; T.travel(1); }); await g.waitForTimeout(200);
  ok(await E(() => window.__T.scene === 'hb'), 'at prestige 5 the arrow after Osaka goes to the harbour');
  await E(() => window.__T.routeTick()); await g.waitForTimeout(800);
  ok(/Captain Ama/i.test(await modal()) && /cowrie/.test(await modal()), 'Captain Ama welcomes you and explains cowries');
  ok(await E(() => window.__T.S.route.got.hb_first && window.__T.routeCw() === 1), 'the first visit is a find: one cowrie');
  await clean();
  ok(await E(() => document.getElementById('locName').textContent === 'The harbour' && /1 cowries/.test(document.getElementById('locBeds').textContent)), 'the farm bar names the harbour and counts cowries');
  ok(await E(() => /Cowr|cowr/.test(document.getElementById('locLv').textContent + document.getElementById('locBeds').textContent)), 'the bar shows the cowrie count');
  await E(() => window.__T.travel(1)); await g.waitForTimeout(150);
  ok(await E(() => window.__T.scene === 'bm'), 'the next arrow goes on to Blue Mountain');
  await E(() => window.__T.travel(-1)); await g.waitForTimeout(150);
  ok(await E(() => window.__T.scene === 'hb'), 'and back to the harbour');
  ok(await E(() => window.__T.hintAt('hb') && window.__T.hintAt('hb')[0] === window.__T.HB_BOARD.x + 18), 'with a cowrie to spend, the map arrow points at the board');

  /* the board: the pier first, Kona projects wait for Kona, need and cost */
  ok(await E(() => window.__T.bdState(window.__T.BOARD.find((b) => b.id === 'obs')) === 'Chart the passage to Kona first'), 'Kona\'s projects wait until Kona is charted');
  ok(await E(() => window.__T.bdState(window.__T.BOARD.find((b) => b.id === 'hold')) === 'Mend the pier first'), 'the second hold needs the pier first');
  await E(() => window.__T.act('hb_build:pier')); await g.waitForTimeout(150);
  ok(await E(() => window.__T.bdOn('pier') && window.__T.routeCw() === 0), 'mending the pier spends the cowrie');
  ok(/Mend the pier/i.test(await modal()), 'a card says what the project did');
  await clean();
  await E(() => window.__T.act('hb_build:light')); await g.waitForTimeout(100);
  ok(await E(() => !window.__T.bdOn('light')), 'a project you can\'t afford stays unbuilt');

  /* voyages: bags as trade, real hours, one hold */
  await bags(1);
  await E(() => window.__T.voySail('reunion'));
  ok(await E(() => window.__T.S.route.voy.length === 0), 'a voyage needs its bags: one bag is not enough for Réunion');
  await bags(5);
  await E(() => { const S = window.__T.S; S.counter = S.counter || {}; });
  await E(() => window.__T.voySail('reunion'));
  ok(await E(() => { const R = window.__T.S.route; return R.voy.length === 1 && R.voy[0].to === 'reunion' && Math.abs(R.voy[0].end - R.voy[0].at - 3600e3) < 2000; }), 'the boat sails for Réunion, an hour away');
  ok(await E(() => window.__T.S.roastery.bags.length === 3 && window.__T.S.roastery.bags.every((b) => b.coins >= 102)), 'it took the two cheapest bags');
  await E(() => window.__T.voySail('bali'));
  ok(await E(() => window.__T.S.route.voy.length === 1), 'one hold: a second voyage waits');
  await E(() => { const T = window.__T, S = T.S; S.roastery.beans = {}; S.roastery.want = {}; S.route.voy[0].end = Date.now() - 1; T.routeTick(); });
  ok(await E(() => window.__T.S.route.voy[0].home), 'when the hours are up the boat is home');
  ok(await E(() => { const h = window.__T.hintAt('hb'), m = window.__T.HB_BOAT(0); return h && h[0] === m.x + 20; }), 'the map arrow points at the boat');
  let m0 = await E(() => window.__T.HB_BOAT(0)); await tapMap(m0.x + 20, m0.y + 14);
  ok(/Home from Réunion/.test(await modal()) && /Bourbon Pointu/.test(await modal()), 'tapping the boat unloads it: the Réunion card names its coffee');
  ok(await E(() => { const S = window.__T.S, k = 'yellowbourbon.isl_reunion'; return S.roastery.beans[k] && S.roastery.beans[k].kg >= 36 && S.route.got.v_reunion && S.route.vdone.reunion === 1; }), 'about 40 kg of Bourbon Pointu went into an Osaka bin, and the first trip found a cowrie');
  ok(await E(() => window.__T.beanName('yellowbourbon.isl_reunion') === 'Bourbon Pointu, Réunion' && window.__T.isleKey('yellowbourbon.isl_reunion')), 'the voyage coffee goes by its own name and counts as island coffee');
  await clean();
  /* the shed, when the bins are full */
  await E(() => { const T = window.__T, S = T.S; ['caturra.washed', 'catuai.washed', 'castillo.washed', 'geisha.washed'].forEach((k) => { S.roastery.beans[k] = { kg: 10, coins: 1, pts: 1, cup: 85 }; }); delete S.roastery.beans['yellowbourbon.isl_reunion']; S.route.voy = [{ to: 'bali', at: Date.now() - 10, end: Date.now() - 1, home: true }]; T.voyCollect(0); });
  ok(await E(() => window.__T.S.route.shed.length === 1 && window.__T.S.route.shed[0].key === 'catimor.isl_bali'), 'with every bin full the lot waits in the harbour shed');
  ok(/harbour shed/.test(await modal()), 'and the card says so');
  await clean();
  const coins0 = await E(() => window.__T.S.coins);
  await E(() => window.__T.hbShed(0, true));
  ok(await E((c) => window.__T.S.route.shed.length === 0 && window.__T.S.coins > c, coins0), 'a lot in the shed can be sold green');

  /* the bottle */
  await E(() => { window.__T.S.route.bottle = true; });
  await tapMap(await E(() => window.__T.HB_BOTTLE.x), await E(() => window.__T.HB_BOTTLE.y));
  ok(await E(() => window.__T.S.route.got.hb_bottle && !window.__T.S.route.bottle), 'tapping the bottle on the slipway reads it: a find');
  ok(/message in a bottle/i.test(await modal()), 'its note shows');
  await clean();

  /* the lighthouse and the second hold */
  await E(() => window.__T.routeGive(20));
  await E(() => { window.__T.act('hb_build:light'); window.__T.act('hb_build:hold'); });
  ok(await E(() => window.__T.bdOn('light') && window.__T.bdOn('hold')), 'the lighthouse and the second hold are built');
  ok(await E(() => window.__T.voyMs('helena') === 3 * 3600e3), 'with the lighthouse lit, St Helena\'s 4 hours take 3');
  await bags(12);
  await E(() => { const T = window.__T; T.S.route.voy = []; T.voySail('helena'); T.voySail('bali'); });
  ok(await E(() => window.__T.S.route.voy.length === 2), 'two holds, two voyages at once');
  await clean();

  /* Kona: charted early from the board, and its projects */
  ok(await E(() => !window.__T.S.route.bd.kona && window.__T.scene !== 'kona'), 'at prestige 5 Kona is still uncharted');
  await E(() => window.__T.act('hb_build:kona'));
  ok(await E(() => window.__T.bdOn('kona')), 'charting the passage opens Kona Ridge at prestige 5');
  await clean();
  await E(() => { const T = window.__T; T.konaTick(); T.S.kona.seen = true; T.travel(1); T.travel(1); }); await g.waitForTimeout(150);
  ok(await E(() => window.__T.scene === 'kona'), 'Kona Ridge follows Blue Mountain in the arrows');
  await E(() => { const T = window.__T; T.routeGive(40); ['obs', 'library', 'lanai', 'shelf', 'flag', 'porch', 'roof', 'cupping'].forEach((id) => T.act('hb_build:' + id)); });
  ok(await E(() => ['obs', 'library', 'lanai', 'shelf', 'flag', 'porch', 'roof', 'cupping'].every((id) => window.__T.bdOn(id))), 'every other project builds with enough cowries');
  ok(await E(() => window.__T.S.sitems.title['route:islander'] && window.__T.titleText('route:islander') === 'Islander'), 'the flag gives the "Islander" title');
  await clean();

  /* Kona's boat pays coins and know-how, at multiples of the green price */
  const pay = await E(() => {
    const T = window.__T, S = T.S, K = S.kona, v = K.plots[0].v; T.kNewBoat(); const c = K.boat.cards[0]; c.fr = 'mango'; c.v = null; c.gold = false; c.done = false; c.pay = 1.5;
    K.boat.cards.slice(1).forEach((x) => { x.fr = 'pineapple'; });
    const lot = { v, fr: 'mango', kg: 20, adj: 2, pay: 1, q: 'gold' }, r = T.saleFor(v, 'cof_mango', 20, { raked: 2 });
    const c0 = S.coins, p0 = S.points; T.kDeliver(lot, true);
    return { got: S.coins - c0, pts: S.points - p0, base: r.coins, bp: r.points, mult: c.pay, lanai: T.bdOn('lanai'), paid: K.boat.paid };
  });
  ok(pay.mult === 1.5 && pay.paid === Math.round(pay.base * 1.5 * 1.25) && pay.got >= pay.paid, 'the easiest order pays ×1.5 the lot\'s green price, a quarter more with Uncle Kimo (' + pay.got + ' coins, base ' + pay.base + ', lanai ' + pay.lanai + ', paid ' + pay.paid + ')');
  ok(pay.pts > 0 && Math.abs(pay.pts - Math.round(pay.bp * 1.5 * 1.25)) <= 1, 'and know-how at the same rate');
  ok(await E(() => window.__T.S.kona.boat.cards.every((c) => [1.5, 2, 2.5, 3, 3.5].includes(c.pay))), 'order cards pay ×1.5 to ×3.5');
  const full = await E(() => { const T = window.__T, S = T.S, K = S.kona; T.kNewBoat(); K.boat.cards.forEach((c) => { c.fr = 'mango'; c.v = 'geisha'; c.gold = true; }); const c0 = S.coins; for (let i = 0; i < K.boat.cards.length; i++) T.kDeliver({ v: 'geisha', fr: 'mango', kg: 20, adj: 2, pay: 1.15, q: 'gold' }, true); return { full: K.boat.full, got: S.coins - c0, paid: K.boat.paid, hard: !!S.route.got.k_hard }; });
  ok(full.full && full.got > full.paid, 'a full boat pays a quarter on top of what it paid');
  ok(full.hard, 'a gold order on a named coffee is a find');
  ok(await E(() => window.__T.S.kona.shells === undefined), 'no shells anywhere on Kona');

  /* Kona finds: signatures in the Ferment Book, the gold streak, every five levels */
  await clean();
  const sig = await E(() => { const T = window.__T, K = T.S.kona; K.tanks[0] = { v: 'yellowbourbon', fr: 'mango', kg: 100, at: Date.now() - 70e3, dur: 60e3, win: 15e3, n: 1, vj: 1, miss: 0 }; T.kPull(0); return !!T.S.route.got.k_sig_sunrise; });
  ok(sig, 'mango on Yellow Bourbon pulled in the gold window finds "Sunrise" for the Ferment Book');
  ok(/Ferment Book: Sunrise/i.test(await modal()), 'its page opens');
  await clean();
  ok(await E(() => window.__T.kBonus('mango', 'yellowbourbon') === 3 && window.__T.kBonus('mango', 'caturra') === 2), 'a found signature adds +1 cup to its pairing, and only to its pairing');
  await E(() => { const T = window.__T, K = T.S.kona; K.streak = 9; K.tanks[0] = { v: 'caturra', fr: 'mango', kg: 100, at: Date.now() - 70e3, dur: 60e3, win: 15e3, n: 1, vj: 1, miss: 0 }; T.kPull(0); });
  ok(await E(() => !!window.__T.S.route.got.k_streak), 'the tenth gold pull in a row is a find');
  await clean();
  await E(() => { const T = window.__T, K = T.S.kona; K.lv = 4; K.xp = 0; T.kXp(T.kNeed(4)); });
  ok(await E(() => !!window.__T.S.route.got.k_l5 && window.__T.S.kona.shop.tank3), 'island level 5 brings the third tank and a cowrie');
  /* the observatory: a forecast, and a big eruption's piles worth two ash; gathering them all is a find */
  await E(() => { const T = window.__T; T.goKona(); T.kNextBig = true; T.kPuffT = 6; });
  await g.waitForTimeout(300);
  await E(() => { const T = window.__T; T.kPuffNow(true); T.kPiles.forEach((p) => { p.t = 0.1; }); });
  const ash = await E(() => { const T = window.__T, K = T.S.kona, a0 = K.ash; T.kPiles.slice().forEach((p) => T.konaClick(p.x + 4, p.y + 3)); return { got: K.ash - a0, find: !!T.S.route.got.k_ash }; });
  ok(ash.got === 16 && ash.find, 'with the observatory each pile of a big eruption gives two ash, and gathering all eight is a find (' + ash.got + ')');
  /* Uncle Kimo */
  const kimo = await E(() => window.__T.KIMO_AT); await tapMap(kimo.x, kimo.y - 10);
  ok(/Uncle Kimo/i.test(await modal()), 'Uncle Kimo, by the dock, says which order to fill');
  await clean();

  /* Blue Mountain: certifications, the roof, the cupping house, Miss Pearl and her lost things, selling when the bins are full */
  await E(() => { const T = window.__T; T.goBm(); T.bmTick(); T.S.bm.seen = true; });
  await clean();
  await E(() => { const T = window.__T, B = T.S.bm; B.lv = 1; B.xp = 0; T.bmXp(T.bmNeed(1)); });
  ok(await E(() => !!window.__T.S.route.got.bm_c2), 'certification 2 is a find');
  ok(await E(() => Math.abs(window.__T.bmRestMs() - 8 * 3600e3 * 0.75 * (1 - 0.5 * 0)) < 8 * 3600e3), 'the roof rests batches a quarter quicker');
  const rest = await E(() => { const T = window.__T, S = T.S; S.route.bd.roof = 0; const a = T.bmRestMs(); S.route.bd.roof = Date.now(); return T.bmRestMs() / a; });
  ok(Math.abs(rest - 0.75) < 0.001, 'exactly a quarter quicker');
  const pearl = await E(() => window.__T.PEARL_AT); await tapMap(pearl.x, pearl.y - 10);
  ok(/Miss Pearl/i.test(await modal()) && /Row \d clears next/.test(await modal()), 'Miss Pearl, from her porch, says which row clears next');
  await clean();
  const lost = await E(() => { const T = window.__T, B = T.S.bm, rnd = Math.random; B.lostAt = 0; Math.random = () => 0.001; T.bmPickFind(0, T.BTER(0)); Math.random = rnd; return !!T.S.route.got.bm_lost1; });
  ok(lost, 'picking in a clearing can turn up Grandmother\'s tin scoop');
  ok(await E(() => { const T = window.__T, B = T.S.bm, rnd = Math.random; Math.random = () => 0.001; T.bmPickFind(0, T.BTER(0)); Math.random = rnd; return !T.S.route.got.bm_lost2; }), 'but only one lost thing a day');
  await E(() => { const T = window.__T, S = T.S; S.minutes = 6 * 60; T.bmPickFind(0, T.BTER(0)); });
  ok(await E(() => !!window.__T.S.route.got.bm_dawn), 'picking at sunrise is a find');
  const cup = await E(() => { const T = window.__T, S = T.S, B = S.bm; S.roastery.beans = {}; S.roastery.want = {}; B.bar.n1 = 30; B.bad.n1 = 0; S.route.bd.cupping = 0; const base = T.saleFor('typica', 'bm_n1', 30, { raked: 0 }).cup; S.route.bd.cupping = Date.now(); T.bmShip('n1'); return { bin: S.roastery.beans['typica.bm_n1'].cup, base, find: !!S.route.got.bm_true }; });
  ok(Math.abs(cup.bin - Math.min(95, cup.base + 2)) < 0.01 || cup.bin > cup.base, 'with the cupping house a barrel ships at +2 cup (' + cup.base.toFixed(1) + ' to ' + cup.bin.toFixed(1) + ')');
  ok(cup.find, 'a No. 1 barrel with no wrong beans is a find');
  const sold = await E(() => { const T = window.__T, S = T.S, B = S.bm; ['caturra.washed', 'catuai.washed', 'castillo.washed', 'geisha.washed'].forEach((k) => { S.roastery.beans[k] = { kg: 10, coins: 1, pts: 1, cup: 85 }; }); B.bar.pb = 30; B.bad.pb = 0; const c0 = S.coins; T.bmShip('pb'); return { coins: S.coins - c0, left: B.bar.pb, find: !!S.route.got.bm_pb }; });
  ok(sold.coins > 0 && sold.left === 0, 'with every bin full the island boat buys the barrel instead');
  ok(sold.find, 'a Peaberry barrel is a find');

  /* the farm: the island shelf at the Counter, island bags sold, a pre-order */
  const shelf = await E(() => { const T = window.__T, S = T.S, b = { key: 'typica.bm_n1', profile: 'medium', kg: 1, coins: 1000, pts: 10, q: 80, cup: 90 }, o = { kind: 'walk' }; S.route.bd.shelf = 0; const a = T.ctPrice(o, b); S.route.bd.shelf = Date.now(); return T.ctPrice(o, b) / a; });
  ok(Math.abs(shelf - 1.25) < 0.01, 'the island shelf: island coffee sells for a quarter more at the Counter');
  ok(await E(() => { const T = window.__T, S = T.S; S.counter.pre = []; S.roastery.beans['typica.bm_n1'] = { kg: 30, coins: 1, pts: 1, cup: 90 }; for (let i = 0; i < 5; i++) { T.ctBoard(); if (!S.counter.pre.some((p) => T.isleKey(p.key))) return false; } return true; }), 'and every pre-order board asks for island coffee you have');

  /* the harbour page and map */
  await E(() => { const T = window.__T; T.goHb(); T.setTab('farm'); T.S.hbSub = 'harbour'; T.renderPanel(); });
  await g.waitForTimeout(200); await clean();
  for (const sub of ['harbour', 'board', 'ledger']) {
    await E((s) => { window.__T.S.hbSub = s; window.__T.renderPanel(); }, sub); await g.waitForTimeout(80);
    const h = await E(() => document.getElementById('panel').innerText);
    ok(!/undefined|NaN/.test(h) && h.length > 200, 'the harbour page\'s ' + sub + ' tab reads cleanly');
  }
  ok(await E(() => /found/.test(document.getElementById('panel').innerText) && /Sail to Gran Canaria/.test(document.getElementById('panel').innerText) && /Home from Réunion/.test(document.getElementById('panel').innerText)), 'the ledger lists finds made and hints for the rest');
  await E(() => window.__T.goHb()); await g.waitForTimeout(150);
  const off = await E(() => window.__T.HB_OFFICE); await tapMap(off.x + 24, off.y + 30);
  ok(/The ledger/.test(await modal()), 'tapping the office opens the ledger');
  const bd = await E(() => window.__T.HB_BOARD); await tapMap(bd.x + 18, bd.y + 16);
  ok(/Harbour board/.test(await modal()), 'tapping the board opens the projects');
  await tapMap(await E(() => window.__T.IN.hb.ama.x), await E(() => window.__T.IN.hb.ama.y - 10));
  ok(/Captain Ama/i.test(await modal()), 'tapping Captain Ama: a tip');
  await clean();
  if (shots) await g.screenshot({ path: shots + '/harbour.png' });

  /* old saves: Kona shells become cowries, tools arrive at their level, finds already made count */
  await E(() => { const T = window.__T, S = T.S; S.isle = false; S.loc = 'mogiana'; T.setTab('farm', true); delete S.route; S.prestige = 6; S.kona = T.konaFresh(); S.kona.shells = 2500; S.kona.lv = 23; S.kona.shop = { tarps: true, tank3: true }; S.kona.boat = { at: Date.now() + 60e3, cards: [{ fr: 'mango', v: null, gold: false, pay: 40, xp: 6, done: false }] }; S.bm.lv = 6; S.bm.ship = { n1: 1, n2: 1, n3: 1, pb: 1, sel: 0 }; T.routeTick(); T.konaTick(); });
  const mig = await E(() => { const S = window.__T.S; return { cw: S.route.cw, shells: S.kona.shells, shop: Object.keys(S.kona.shop).length, boat: S.kona.boat.v2, p6: S.route.bd.kona }; });
  ok(mig.shells === undefined && mig.cw === 6 + 5 + 4 + 2, 'an old save: 2,500 shells make 6 cowries, certifications 2-6 make 5, levels 5-20 make 4, shipped grades 2 (' + mig.cw + ')');
  ok(mig.shop === 9, 'every tool up to level 23 is yours (' + mig.shop + ')');
  ok(mig.boat, 'a boat from the shell days gets fresh orders');
  ok(mig.p6 === 'p6', 'at prestige 6 the passage counts as charted');

  /* a reload keeps the route */
  await E(() => { const T = window.__T, R = T.S.route; R.cw = 7; R.bd.pier = 1; R.voy = [{ to: 'galapagos', at: Date.now(), end: Date.now() + 8 * 3600e3 }]; T.save(); });
  await g.reload(); await g.waitForTimeout(1200);
  ok(await E(() => { const R = window.__T.S.route; return R && R.cw === 7 && R.bd.pier && R.voy.length === 1 && R.voy[0].to === 'galapagos'; }), 'a reload keeps cowries, projects and the boat at sea');
  ok(!errs.length, 'no page errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  console.log(pass + ' passed, ' + fail + ' failed');
  await b.close(); process.exit(fail ? 1 : 0);
})();
