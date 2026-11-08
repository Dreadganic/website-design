/* Bali, the Monsoon, end to end in the real game: closed until prestige 6, a first voyage there and the harbour board's project;
   Wayan's welcome; the barometer banking a storm every 40 minutes (three, four from level 10); a storm from the barn: picking into
   the basket (its size from your pickers' gear), spreading on the raised beds (more of them from your farms' drying beds), turning
   as they dry, bagging, the barn; a gust held on the rope or a bed blown over; a leak spoiling the barn until patched; the storm
   waiting while you're away; the break with its glinting cherries; the score and the draws from the co-op pool; being rained
   off; the rare draws and their guarantees (the duck, the golden rake, the outfit); tools; levels (the warning, the bank, the
   fifth roastery bin, the break, the thatch, the title); the daily task; the page; "Where to?"; a reload; and a pacing bot that
   plays whole storms by tapping wherever the arrow points.
   node bali_e2e.js <test.html from mktest.py> [shots dir] */
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
  const tapMap = async (x, y) => { await clean(); const p = await E(([x, y]) => { const sc = document.getElementById('scroller'), cv = document.getElementById('cv'), k = cv.getBoundingClientRect().width / 192, room = sc.scrollHeight - sc.clientHeight; if (room > 0) sc.scrollTop = Math.max(0, Math.min(room, cv.offsetTop + y * k - sc.clientHeight / 2)); const r = cv.getBoundingClientRect(); return [r.left + x * k, r.top + y * k]; }, [x, y]); await g.mouse.click(p[0], p[1]); await g.waitForTimeout(120); };
  const modal = () => E(() => document.getElementById('modal').hidden ? '' : document.getElementById('modalCard').innerText);
  const bush = (i) => E((i) => { const p = window.__T.BA_BUSH(i); return [p.x, p.y - 10]; }, i);
  const bed = (j) => E((j) => { const a = window.__T.BA_BED(j); return [a.x + 19, a.y + 11]; }, j);
  const barn = [96, 294], rope = [96, 240];
  const calm = () => E(() => { const st = window.__T.S.ba.st; if (st) { st.gust.next = 1e9; st.gust.warn = 0; st.leakNext = 1e9; } });   /* no surprise gusts or leaks while a check runs */
  await E(() => { const T = window.__T, S = T.S, d = new Date(); S.checkin.last = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); S.name = S.nameOk = 'Tess'; S.guide = T.GUIDE.length; S.prestige = 5; S.pwalkDone = true; S.practiceTip = true; S.specTip = true; S.roastery.tip = true; Object.keys(S.tabs).forEach((k) => { S.tabs[k] = true; }); S.rev.cur = null; T.revSess = 0; S.loc = 'osaka'; S.isle = false; T.setTab('farm', true); T.bmTick(); S.bm.seen = true; T.routeTick(); S.route.seen = true; S.lv.carry = 1; for (const l of Object.keys(S.farms)) S.farms[l].build = Object.assign({}, S.farms[l].build, { drybeds: 0 }); });
  await clean();

  /* opening: prestige 6, a first voyage to Bali, then the board's project */
  const proj = () => E(() => window.__T.bdState(window.__T.BOARD.find((x) => x.id === 'isle_ba')));
  ok(await proj() === 'Opens at prestige 6', 'the co-op waits for prestige 6');
  await E(() => { window.__T.S.prestige = 6; });
  ok(await proj() === 'Sail to Bali first', 'then for a first voyage to Bali');
  await E(() => { const R = window.__T.S.route; R.vdone.bali = 1; R.cw = 0; });
  ok(await proj() === 'cowries', 'then for its 9 cowries');
  await E(() => { const T = window.__T; T.S.route.cw = 9; T.act('hb_build:isle_ba'); });
  ok(await E(() => window.__T.isleOpen('ba') && !!window.__T.S.ba && window.__T.S.route.cw === 0), 'building "Join the Kintamani co-op" opens Bali');
  await clean();
  await E(() => { const T = window.__T, S = T.S; S.loc = 'mogiana'; S.isle = false; T.setTab('farm', true); document.getElementById('prevLoc').click(); }); await g.waitForTimeout(250);
  ok(await E(() => window.__T.scene === 'ba'), 'Bali comes last in the arrows: the arrow back from Mogiana');
  await g.waitForTimeout(800);
  ok(/Wayan/i.test(await modal()) && /barn/i.test(await modal()), 'Wayan welcomes you and explains a storm');
  await clean();
  ok(await E(() => document.getElementById('locName').textContent.startsWith('Bali') && /Lv 1/.test(document.getElementById('locLv').textContent)), 'the farm bar names the co-op and its level');
  ok(await E(() => window.__T.S.ba.charge === 1 && /1 storm banked/.test(document.getElementById('locBeds').textContent)), 'one storm is banked to start with, and the bar says so');
  ok(await E(() => { const h = window.__T.hintAt('ba'); return h && h[0] === 96 && h[1] === window.__T.BA_BARN.y + 2; }), 'the map arrow points at the barn');

  /* the barometer */
  ok(await E(() => { const T = window.__T, B = T.S.ba; B.charge = 0; B.chargeAt = Date.now() - 41 * 60e3; T.baBank(); return B.charge === 1 && Date.now() - B.chargeAt < 2 * 60e3; }), 'the barometer banks a storm every 40 minutes');
  ok(await E(() => { const T = window.__T, B = T.S.ba; B.chargeAt = Date.now() - 10 * 3600e3; T.baBank(); return B.charge === 3; }), 'up to three while you\'re away');
  await E(() => { window.__T.S.ba.charge = 1; });

  /* a storm: pick, spread, turn, bag, carry in */
  await tapMap(barn[0], barn[1]); await calm();
  ok(await E(() => { const B = window.__T.S.ba; return B.st && B.charge === 0 && B.st.target === 60 && B.st.barn === 0; }), 'tapping the barn starts a banked storm: fill the barn to 60 at level 1');
  ok(await E(() => window.__T.baBasket() === 4 && window.__T.baBeds() === 2), 'with a cloth sack the basket holds 4 kg; with no drying beds at home, 2 raised beds are open');
  let p = await bush(0); await tapMap(p[0], p[1]);
  ok(await E(() => window.__T.S.ba.st.basket === 2 && window.__T.S.ba.st.bush[0].kg === 0), 'tapping a ripe bush picks 2 kg into the basket');
  await tapMap(p[0], p[1]);
  ok(await E(() => window.__T.S.ba.st.basket === 2), 'a picked bush has to ripen again');
  p = await bush(1); await tapMap(p[0], p[1]); p = await bush(2); await tapMap(p[0], p[1]);
  ok(await E(() => window.__T.S.ba.st.basket === 4 && window.__T.S.ba.st.bush[2].kg === 2), 'the basket is full at 4 kg: the next bush keeps its cherries');
  p = await bed(3); await tapMap(p[0], p[1]);
  ok(await E(() => window.__T.S.ba.st.beds[3].kg === 0 && window.__T.S.ba.st.basket === 4), 'a bed your farms haven\'t opened takes nothing');
  p = await bed(0); await tapMap(p[0], p[1]);
  ok(await E(() => window.__T.S.ba.st.beds[0].kg === 4 && window.__T.S.ba.st.basket === 0), 'tapping an open bed spreads the basket on it');
  await E(() => { const T = window.__T; T.S.ba.st.bush.forEach((b) => { b.kg = 2; }); }); p = await bush(3); await tapMap(p[0], p[1]); p = await bush(4); await tapMap(p[0], p[1]);
  p = await bed(0); await E(() => window.__T.baStep(3000)); await tapMap(p[0], p[1]);
  ok(await E(() => { const b = window.__T.S.ba.st.beds[0]; return b.kg === 8 && b.dry < 1000 && b.turns === 0; }), 'topping a bed up to 8 kg starts its drying again');
  const D = await E(() => window.__T.baDryMs());
  ok(D === 20000, 'a bed dries in 20 seconds');
  await tapMap(p[0], p[1]);
  ok(await E(() => window.__T.S.ba.st.beds[0].turns === 0), 'it can\'t be turned straight away');
  for (let t = 0; t < 3; t++) { await E((D) => window.__T.baStep(D / 4), D); await tapMap(p[0], p[1]); }
  ok(await E(() => window.__T.S.ba.st.beds[0].turns === 3), 'a turn comes due every quarter of the drying: three turns');
  await E((D) => window.__T.baStep(D), D); await tapMap(p[0], p[1]);
  ok(await E(() => { const st = window.__T.S.ba.st; return st.beds[0].kg === 0 && st.carry === 7 && st.sacks === 1; }), 'a dry bed bags up: 8 kg turned three times is worth 7');
  await tapMap(barn[0], barn[1]);
  ok(await E(() => { const st = window.__T.S.ba.st; return st.barn === 7 && st.carry === 0; }), 'carried into the barn: 7 of 60');

  /* gusts */
  await E(() => { const st = window.__T.S.ba.st; st.gust.next = 1; window.__T.baStep(100); });
  ok(await E(() => window.__T.S.ba.st.gust.warn > 2500 && window.__T.S.ba.st.gust.warn <= 3000), 'a gust comes with 3 seconds\' warning at level 1');
  ok(await E(() => { const h = window.__T.hintAt('ba'); return h && h[0] === 96 && h[1] === 230; }), 'the arrow points at the rope post');
  await tapMap(rope[0], rope[1]);
  ok(await E(() => window.__T.S.ba.st.gust.hold && window.__T.S.ba.st.busy > 0), 'tapping the rope post holds the cover');
  p = await bush(5); await tapMap(p[0], p[1]);
  ok(await E(() => window.__T.S.ba.st.basket === 0), 'while you hold the rope you can\'t do anything else');
  await E(() => window.__T.baStep(3500)); await calm();
  ok(await E(() => { const st = window.__T.S.ba.st; return st.held === 1 && !st.gust.warn && !st.busy; }), 'the gust passes: held');
  await E(() => { const st = window.__T.S.ba.st; Object.assign(st.beds[0], { kg: 8, dry: 9000, turns: 2, since: 0 }); Object.assign(st.beds[1], { kg: 6, dry: 2000, turns: 0, since: 0 }); st.gust.next = 1; window.__T.baStep(100); window.__T.baStep(3100); });
  await calm();
  ok(await E(() => { const st = window.__T.S.ba.st; return st.lost === 1 && st.beds[1].kg === 0 && st.beds[0].kg === 8; }), 'an unheld gust blows the wettest bed over, and only that one');

  /* leaks */
  await E(() => { const st = window.__T.S.ba.st; st.leakNext = 1; window.__T.baStep(100); st.leakNext = 1e9; });
  ok(await E(() => window.__T.S.ba.st.leaks.length === 1), 'a leak opens in the roof once there\'s coffee in the barn');
  await E(() => window.__T.baStep(6100));
  ok(await E(() => window.__T.S.ba.st.barn === 6 && window.__T.S.ba.st.spoiled === 1), 'it spoils a barn point every 6 seconds');
  const lk = await E(() => { const l = window.__T.BA_LEAKS[window.__T.S.ba.st.leaks[0].i]; return [l.x, l.y]; });
  await tapMap(lk[0], lk[1]);
  ok(await E(() => window.__T.S.ba.st.leaks.length === 0 && window.__T.S.ba.st.patched === 1), 'tapping the roof patches it');

  /* the storm waits while you're away */
  const t0 = await E(() => window.__T.S.ba.st.t);
  await E(() => { window.__T.travel(-1); }); await g.waitForTimeout(600);
  ok(await E((t0) => window.__T.S.ba.st.t - t0 < 300, t0), 'leaving the island pauses the storm');
  await E(() => { window.__T.goIsle('ba'); }); await g.waitForTimeout(400); await clean(); await calm();
  ok(await E((t0) => window.__T.S.ba.st.t > t0, t0), 'and it carries on when you come back');

  /* the break: fill the barn and the rain falls */
  await E(() => { const st = window.__T.S.ba.st; st.barn = st.target - 2; st.carry = 4; st.sacks = 1; st.leaks = [{ i: 0, next: 5000 }]; });
  await tapMap(barn[0], barn[1]);
  ok(await E(() => { const st = window.__T.S.ba.st; return st.brk && st.brk.left > 19000 && !st.leaks.length; }), 'filling the barn brings the break: 20 seconds, no more leaks');
  await E(() => window.__T.baStep(400));
  const gi = await E(() => window.__T.S.ba.st.brk.gl[0].i);
  p = await bush(gi); await tapMap(p[0], p[1]);
  ok(await E(() => window.__T.S.ba.st.brk.taps === 1), 'tapping a glinting bush scores it');
  const ex = await E(() => { const st = window.__T.S.ba.st; return Math.floor(st.barn) + 3 * st.held + 2 * st.patched + 3 * st.brk.taps; });
  const before = await E(() => ({ coins: window.__T.S.coins, pts: window.__T.S.points, lv: window.__T.S.ba.lv, xp: window.__T.S.ba.xp, draws: window.__T.S.ba.draws }));
  await E(() => { const T = window.__T; T.S.roastery.beans = {}; T.S.roastery.want = {}; T.baStep(21000); });
  ok(await E(() => !window.__T.S.ba.st), 'the storm ends when the rain eases');
  ok(/Storm weathered/.test(await modal()) && new RegExp(ex + ' points').test(await modal()), 'the report adds it up: a point a barn point, 3 a held gust, 2 a patched leak, 3 a glint = ' + ex + ' points');
  ok(await E(([b, ex]) => { const B = window.__T.S.ba; return B.draws - b.draws === Math.min(6, 3 + Math.floor(ex / 75)) && B.storms === 1 && B.best === ex && (B.lv > b.lv || B.xp > b.xp); }, [before, ex]), 'it pays monsoon xp (half the score) and 3 draws from the co-op pool, plus one for every 75 points');
  ok(await E(() => { const g = window.__T.S.route.got; return g.ba_first && !g.ba_clean; }), 'finds: the first storm; not the clean one, since a bed blew over');
  ok(await E(() => window.__T.TASK_KINDS.bstorm.ok() && /Bali/.test(window.__T.TASK_KINDS.bstorm.text)), 'the daily task "Weather a storm on Bali" can come up');
  await clean();

  /* rained off */
  await E(() => { const T = window.__T, B = T.S.ba; B.charge = 1; T.baStart(); B.st.barn = 30; B.st.held = 2; B.st.gust.next = 1e9; B.st.leakNext = 1e9; T.baStep(241000); });
  ok(/Rained off/.test(await modal()) && /18 points/.test(await modal()), 'if the sky fills first you\'re rained off: half of 36 = 18 points');
  ok(await E(() => window.__T.S.ba.rained === 1 && window.__T.S.ba.streak === 0), 'it breaks your run of storms');
  await clean();
  await E(() => { const T = window.__T, B = T.S.ba; B.charge = 1; T.baStart(); T.act('ba_end'); });
  ok(/Rained off/.test(await modal()) && /nothing from the co-op pool/.test(await modal()), 'giving up straight away is rained off with nothing from the pool');
  await clean();

  /* a clean storm, three in a row */
  for (let k = 0; k < 3; k++) await E(() => { const T = window.__T, B = T.S.ba; B.charge = 1; T.baStart(); B.st.barn = B.st.target; T.baBreak(B.st); T.baStep(31000); });
  ok(await E(() => { const g = window.__T.S.route.got; return g.ba_clean && g.ba_three && window.__T.S.ba.streak === 3; }), 'finds: a storm with no bed lost, and three in a row');
  await clean();

  /* the co-op pool: tools, then the rare draws and their guarantees */
  const rolls = (r, f) => E(([r, f]) => { const T = window.__T, B = T.S.ba, mr = Math.random; Math.random = () => r; new Function('T', 'B', f)(T, B); B.charge = 1; T.baStart(); B.st.barn = B.st.target; T.baBreak(B.st); T.baStep(31000); Math.random = mr; return true; }, [r, f]);
  await rolls(0.05, 'B.tools = {};');   /* earlier storms drew at random: start these checks from a clean pool */
  ok(await E(() => window.__T.S.ba.tools.basket && window.__T.S.ba.tools.rake), 'storm tools: a bigger basket and a quicker rake, uncommon draws');
  ok(await E(() => window.__T.baBasket() === 6 && window.__T.baDryMs() === 15000), 'the bigger basket holds 2 kg more; with the quicker rake beds dry in 15 seconds');
  await clean();
  await rolls(0.99, 'B.fit = {}; B.fitDry = 99;');
  ok(await E(() => window.__T.baOutfit() === 1 && window.__T.S.ba.fitDry < 99), 'an outfit piece is sure by the 100th draw without one');
  await rolls(0.01, 'B.fitDry = 0;');
  ok(await E(() => window.__T.baOutfit() === 4 && window.__T.S.hats.ev_ba_bamboo && window.__T.S.route.got.ba_outfit), 'a 1-in-40 draw gives a piece you don\'t have: the full outfit, the bamboo hat in Looks, and a find');
  await clean();
  await rolls(0.99, 'B.rakeDry = 999;');
  ok(await E(() => window.__T.S.ba.tools.golden && window.__T.S.route.got.ba_rake && window.__T.baDryMs() === 12000), 'the golden rake is sure by the 1,000th draw: beds dry in 12 seconds');
  ok(await E(() => window.__T.baVal({ kg: 8, turns: 3 }) === 8), 'and every turn adds 35%: a full bed turned three times is worth 8');
  await clean();
  await rolls(0.99, 'B.duckDry = 599;');
  ok(await E(() => (window.__T.S.rev.pets || {}).duck && window.__T.S.route.got.ba_duck), 'the paddy duck is sure by the 600th draw: a companion and a find');
  await clean();
  ok(await E(() => { const T = window.__T, B = T.S.ba, S = T.S; delete S.rev.pets.duck; B.duckDry = 0; const mr = Math.random; Math.random = () => 0.003; const got = T.islePet(B, 'duck', 250, 600); Math.random = mr; return got; }), 'and 1 in 250 on any draw');
  ok(await E(() => { const T = window.__T, B = T.S.ba, mr = Math.random; Math.random = () => 0.5; B.charge = 1; T.baStart(); B.st.barn = B.st.target; T.baBreak(B.st); const b0 = T.S.coins; T.baStep(31000); Math.random = mr; return /Kona|coins|know-how|Kintamani/.test(document.getElementById('modalCard').innerText); }), 'commons: coins, know-how, Kintamani coffee and supplies for Kona');
  await clean();
  ok(await E(() => { const T = window.__T, B = T.S.ba, K = T.S.kona; if (!K) return true; const a0 = K.ash + K.compost + K.bags, mr = Math.random; Math.random = () => 0.85; B.charge = 1; T.baStart(); B.st.barn = B.st.target; T.baBreak(B.st); T.baStep(31000); Math.random = mr; return K.ash + K.compost + K.bags > a0; }), 'supplies for Kona arrive there');
  await clean();

  /* levels: the warning, the bank, the fifth bin, the break, the thatch, the title */
  const lvTo = (n) => E((n) => { const T = window.__T, B = T.S.ba; while (B.lv < n) T.isleXp('ba', T.isleNeed(B.lv) - B.xp); }, n);
  await lvTo(5);
  ok(await E(() => { const T = window.__T, B = T.S.ba; B.charge = 1; T.baStart(); B.st.gust.next = 1; T.baStep(50); const w = B.st.gust.warn; B.st = null; return w > 3500; }), 'level 5: a gust gives 4 seconds\' warning');
  await lvTo(10);
  ok(await E(() => { const T = window.__T, B = T.S.ba; B.charge = 0; B.chargeAt = Date.now() - 10 * 3600e3; T.baBank(); return B.charge === 4 && T.S.route.got.ba_l10; }), 'level 10: the barometer banks up to four storms; a find for the level');
  ok(await E(() => window.__T.roastBins() === 4), 'four roastery bins before level 15');
  await lvTo(15);
  ok(await E(() => window.__T.roastBins() === 5), 'level 15: a fifth roastery bin in Osaka');
  ok(await E(() => { const T = window.__T, R = T.S.roastery; R.beans = {}; R.want = {}; ['caturra.washed', 'castillo.washed', 'geisha.washed', 'typica.washed'].forEach((k) => { R.beans[k] = { kg: 5 }; }); return T.canBin('catuai.washed'); }), 'and it takes a fifth coffee');
  await E(() => { window.__T.S.roastery.beans = {}; });
  await lvTo(20);
  ok(await E(() => { const T = window.__T, B = T.S.ba; B.charge = 1; T.baStart(); B.st.barn = B.st.target; T.baBreak(B.st); const l = B.st.brk.left; T.baStep(31000); return l === 30000; }), 'level 20: the break lasts 30 seconds');
  await clean();
  await lvTo(25);
  ok(await E(() => { const T = window.__T, B = T.S.ba; B.charge = 1; T.baStart(); const st = B.st; st.barn = 10; st.leaks = [{ i: 1, next: 12000 }]; st.leakNext = 1e9; st.gust.next = 1e9; T.baStep(7000); const a = st.barn; T.baStep(5500); const r = a === 10 && st.barn === 9; B.st = null; return r; }), 'level 25: leaks spoil every 12 seconds');
  await lvTo(30);
  ok(await E(() => window.__T.S.sitems.title['ba:rain'] && window.__T.titleText('ba:rain') === 'Rain-tamer' && window.__T.S.route.got.ba_l30), 'level 30: the "Rain-tamer" title, and the level find');
  ok(await E(() => window.__T.baTarget() === 75), 'the barn asks for a little more at higher levels: 75 at level 30');
  /* from your farms */
  ok(await E(() => { const T = window.__T, S = T.S; S.farms.mogiana.build = Object.assign({}, S.farms.mogiana.build, { drybeds: 12 }); const three = T.baBeds() === 3; S.farms.mogiana.build.drybeds = 30; return three && T.baBeds() === 4; }), 'your farms\' drying beds open a third raised bed at 12 levels and a fourth at 24');
  ok(await E(() => { const T = window.__T, S = T.S; S.lv.carry = 3; return T.baBasket() === 10; }), 'pickers with wheelbarrows make the basket 8 kg, 10 with the bigger basket');

  /* the page, "Where to?", a reload */
  await E(() => { const T = window.__T; T.goIsle('ba'); T.setTab('farm'); });
  for (const sub of ['storm', 'log']) { await E((s) => { window.__T.S.baSub = s; window.__T.renderPanel(); }, sub); await g.waitForTimeout(80); ok(await E(() => { const t = document.getElementById('panel').innerText; return t.length > 200 && !/undefined|NaN/.test(t); }), 'the Bali page, ' + sub + ' tab, reads cleanly'); }
  await clean(); await E(() => window.__T.setTab('farm', true)); await g.waitForTimeout(150);
  await g.click('#locTap'); await g.waitForTimeout(200);
  ok(await E(() => !!document.querySelector('#modalCard [data-act="goplace:ba"]')), '"Where to?" lists Bali');
  await clean();
  await E(() => { const T = window.__T, B = T.S.ba; B.charge = 1; T.baStart(); T.baPick(0); T.save(); });
  if (shots) { await E(() => { const st = window.__T.S.ba.st; Object.assign(st.beds[0], { kg: 8, dry: 6000, turns: 1, since: 5000 }); Object.assign(st.beds[1], { kg: 6, dry: 16000, turns: 3, since: 0 }); st.gust.warn = 2500; st.leaks = [{ i: 2, next: 4000 }]; st.barn = 40; st.t = 150000; }); await g.waitForTimeout(300); await g.screenshot({ path: shots + '/bali.png' }); }
  await g.reload(); await g.waitForTimeout(1200);
  ok(await E(() => { const B = window.__T.S.ba; return B && B.lv === 30 && B.st && B.st.basket >= 2; }), 'a reload keeps the co-op and a storm in progress');

  /* pacing: a bot plays whole storms by tapping wherever the arrow points, one tap every `gap` ms of storm time */
  const bot = (o) => E((o) => {
    const T = window.__T, S = T.S, B = S.ba; Object.assign(B, { lv: o.lv, tools: o.tools || {}, st: null, charge: 1 }); S.lv.carry = o.carry;
    S.farms.mogiana.build = Object.assign({}, S.farms.mogiana.build, { drybeds: o.drybeds }); S.isle = false;   /* off the island, so only the bot moves the storm */
    T.baStart(); const st = B.st; let t = 0;
    while (B.st === st && t < 400000) {
      const h = !st.brk || o.glints ? T.baHint() : null;
      if (h && !(st.busy > 0)) { if (st.gust.warn > 0 && !st.gust.hold && st.gust.warn > o.lateRope) { T.baStep(Math.min(o.gap, st.gust.warn - o.lateRope)); t += o.gap; continue; } T.baClick(h[0], h[1]); }
      T.baStep(o.gap); t += o.gap;
      if (!st.brk) st.fill = st.t;
    }
    for (let i = 0; i < 8; i++) T.closeModal();
    return { filled: st.brk ? Math.round(st.fill / 1000) : null, held: st.held, lost: st.lost, spoiled: st.spoiled, barn: Math.floor(st.barn), glints: st.brk ? st.brk.taps : 0 };
  }, o);
  const runs = [];
  for (const [name, o] of [['level 1, 2 beds, a cloth sack, a tap every 0.9 s', { lv: 1, carry: 1, drybeds: 0, gap: 900, lateRope: 1000, glints: true }],
    ['level 1, 4 beds, a wheelbarrow, a tap every 0.9 s', { lv: 1, carry: 3, drybeds: 30, gap: 900, lateRope: 1000, glints: true }],
    ['level 30, 4 beds, every tool, a tap every 0.9 s', { lv: 30, carry: 3, drybeds: 30, gap: 900, lateRope: 1000, glints: true, tools: { basket: true, golden: true } }],
    ['level 1, 2 beds, a cloth sack, a tap every 2.5 s', { lv: 1, carry: 1, drybeds: 0, gap: 2500, lateRope: 2600, glints: true }],
    ['level 30, 4 beds, every tool, a tap every 1.5 s', { lv: 30, carry: 3, drybeds: 30, gap: 1500, lateRope: 1600, glints: true, tools: { basket: true, golden: true } }]]) {
    const r = await bot(o); runs.push([name, r]); console.log('  bot:', name, '→', r.filled ? 'barn full at ' + r.filled + ' s' : 'rained off', '· barn', r.barn, '· held', r.held, '· lost', r.lost, '· spoiled', r.spoiled, '· glints', r.glints);
  }
  ok(runs[0][1].filled && runs[0][1].filled >= 90 && runs[0][1].filled <= 200, 'a quick player at level 1 with 2 beds fills the barn in 1½ to 3⅓ minutes (' + runs[0][1].filled + ' s)');
  ok(runs[1][1].filled && runs[1][1].filled < runs[0][1].filled, 'more raised beds and a bigger basket from your farms make it quicker');
  ok(runs[2][1].filled && runs[2][1].filled <= 200, 'at level 30, with its bigger barn, a quick player still makes it easily (' + runs[2][1].filled + ' s)');
  ok(!runs[3][1].filled, 'a player tapping every 2.5 seconds at level 1 is rained off');
  ok(runs[4][1].filled && runs[4][1].filled <= 215, 'a relaxed player, a tap every 1.5 seconds, weathers a level-30 storm with time to spare (' + runs[4][1].filled + ' s)');
  await clean();
  ok(!errs.length, 'no page errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  console.log(pass + ' passed, ' + fail + ' failed');
  await b.close(); process.exit(fail ? 1 : 0);
})();
