/* Blue Mountain end to end: when it opens, the ripe pool and what time away does, the clearings, clean and blind picks, resting,
   grading (right, wrong, Select), certification and what each level opens, shipping to the roastery, the Counter, the imports from
   the mainland, saving and prestige.   node bluemtn_e2e.js <test.html from mktest.py> [shots dir] */
const { chromium } = require(process.env.PW_MODULE || '/opt/node-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
const file = path.resolve(process.argv[2]), shots = process.argv[3] || ''; if (shots) fs.mkdirSync(shots, { recursive: true });
let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) pass++; else { fail++; console.log('FAIL ' + msg); } };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const g = await ctx.newPage(); const errs = []; g.on('pageerror', (e) => errs.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')));
  await g.goto('file://' + file); await g.waitForTimeout(800);
  const E = (f, a) => g.evaluate(f, a);
  const clean = () => E(() => { const T = window.__T; for (let i = 0; i < 12; i++) T.closeModal(); document.getElementById('modal').hidden = true; T.S.nav = null; T.S.navSeen = new Proxy({}, { get: () => true }); });
  const toastHas = async (re) => { for (let k = 0; k < 40; k++) { if (re.test(await E(() => document.getElementById('toast').hidden ? '' : document.getElementById('toast').innerText))) return true; await g.waitForTimeout(150); } return false; };   /* notices queue up, one at a time */
  const near = (a, b2) => Math.abs(a - b2) < 0.05;   /* the terraces keep ripening a little every frame */
  const modal = () => E(() => document.getElementById('modal').hidden ? '' : document.getElementById('modalCard').innerText.replace(/\s+/g, ' '));
  await E(() => { const T = window.__T, S = T.S; S.name = S.nameOk = 'Tess'; S.guide = T.GUIDE.length; S.pwalkDone = true; Object.keys(S.tabs).forEach((k) => { S.tabs[k] = true; }); S.prestige = 4; });
  await g.waitForTimeout(300); await clean();

  /* before prestige 5: closed, and a letter halfway through prestige 4 */
  ok(await E(() => !window.__T.bmOpen() && !window.__T.S.bm), 'closed before prestige 5, no island state');
  await E(() => { const T = window.__T, S = T.S; S.loc = 'osaka'; S.isle = false; T.travel(1); });
  ok(await E(() => window.__T.S.loc === 'mogiana' && !window.__T.S.isle), 'the arrows skip the island before prestige 5');
  await E(() => { const T = window.__T, S = T.S; S.xp = T.XP_AT(Math.ceil(T.prestigeNeed() / 2)); });
  let letter = false;   /* the game's own loop sends it once the screen is free: clear whatever else arrives first (the level-ups) */
  for (let k = 0; k < 30 && !letter; k++) { const m = await modal(); if (/a letter from jamaica/i.test(m)) letter = /prestige 5/.test(m); else { if (m) await E(() => window.__T.closeModal()); await g.waitForTimeout(250); } }
  ok(letter, 'halfway through prestige 4 a letter teases the island');
  await clean(); await E(() => window.__T.bmTease());
  ok(!(await modal()), 'the letter comes once');

  /* prestige 5: it opens */
  await E(() => { const T = window.__T, S = T.S; S.prestige = 5; S.xp = 0; T.bmTick(); });
  ok(await E(() => window.__T.bmOpen() && !!window.__T.S.bm && window.__T.S.bm.lv === 1), 'opens at prestige 5 with certification 1');
  ok(await E(() => !Object.keys(window.__T.S).includes('kona') || !window.__T.S.kona), 'Kona Ridge still waits for prestige 6');
  await E(() => { const T = window.__T, S = T.S; S.loc = 'osaka'; S.isle = false; T.travel(1); });
  ok(await E(() => window.__T.scene === 'bm'), 'from Osaka the next arrow is Blue Mountain');
  await E(() => window.__T.travel(1));
  ok(await E(() => window.__T.scene === 'farm' && window.__T.S.loc === 'mogiana'), 'and then round to Mogiana (no Kona yet)');
  await E(() => window.__T.goBm()); await g.waitForTimeout(900);
  ok(/Blue Mountain/.test(await modal()) && /fog parts/.test(await modal()), 'the first visit opens with Rosa\'s card');
  ok(await E(() => window.__T.BEACON.qlen() > 0 && JSON.stringify(window.__T.S.bm.seen) === 'true'), 'the intro is shown once');
  if (shots) await g.screenshot({ path: path.join(shots, '1-intro.png') });
  await clean();
  ok(await E(() => document.getElementById('locName').textContent === 'Blue Mountains, Jamaica' && document.getElementById('hudStore').style.display === 'none'), 'the bar names the island and the mainland storage pill steps aside');
  ok(await E(() => !!window.__T.VAR.typica && !Object.keys(window.__T.VAR).includes('typica')), 'Typica exists but stays out of the mainland lists');

  /* the ripe pool: 18 hours at most, then overripe, never lost */
  const pool = await E(() => { const T = window.__T, B = T.S.bm; B.ter.forEach((t) => { t.pool = 0; t.over = 0; }); B.last = Date.now() - 24 * 3600e3; T.bmTick(); return B.ter.slice(0, 4).map((t) => [Math.round(t.pool * 10) / 10, Math.round(t.over * 10) / 10]); });
  ok(pool.every(([p, o]) => p === 18 && o === 6), 'a day away: 18 kg ripe and 6 overripe on each terrace ' + JSON.stringify(pool[0]));
  ok(await E(() => window.__T.S.bm.ter[4].pool === 0), 'locked terraces don\'t ripen');
  const week = await E(() => { const T = window.__T, B = T.S.bm; B.last = Date.now() - 7 * 86400e3; T.bmTick(); return [B.ter[0].pool, B.ter[0].over]; });
  ok(week[0] === 18 && week[1] === 18, 'a week away is capped, nothing goes to zero');

  /* clearings */
  await E(() => { const T = window.__T; T.bmFog = null; T.S.bm.fogSeen = false; T.bmTick(); });
  const fog0 = await E(() => { const f = window.__T.bmFog; return f && { row: f.row, wait: f.at - Date.now() }; });
  ok(fog0 && fog0.wait <= 2600 && fog0.wait > 0, 'the first clearing comes within 3 seconds of arriving (' + (fog0 && fog0.wait) + ' ms)');
  await E(() => { const T = window.__T; T.bmFog = { row: 0, at: Date.now() - 1 }; });
  ok(await E(() => window.__T.bmClear(0) && window.__T.bmClear(1) && !window.__T.bmClear(2) && !window.__T.bmClear(4)), 'one row clears at a time, both its terraces');
  await E(() => { const T = window.__T; T.bmFog = { row: 0, at: Date.now() - T.BM_CLEAR - 8100 }; T.bmTick(); });
  ok(await E(() => window.__T.bmFog.row !== 0), 'then the fog moves on to another row');
  if (shots) { await E(() => { const T = window.__T; T.bmFog = { row: 0, at: Date.now() - 2000 }; }); await g.waitForTimeout(200); await g.screenshot({ path: path.join(shots, '2-clearing.png') }); }

  /* clean picking in a clearing: a basket a tap, as fast as hands go */
  await E(() => { const T = window.__T, B = T.S.bm; B.ter.slice(0, 4).forEach((t) => { t.pool = 12; t.over = 0; }); B.wash = null; T.bmFog = { row: 0, at: Date.now() - 1000 }; });
  await E(() => window.__T.bmPick(0)); await E(() => window.__T.bmPick(0));
  let w = await E(() => window.__T.S.bm.wash);
  ok(w && w.kg === 2 && w.u === 0, 'a tap in a clearing picks one 2 kg basket, all ripe; a second tap too soon picks nothing');
  await g.waitForTimeout(950); await E(() => window.__T.bmPick(0));
  w = await E(() => window.__T.S.bm.wash);
  ok(w.kg === 4 && near(await E(() => window.__T.S.bm.ter[0].pool), 8), 'the next basket after the hand-pick time');
  /* blind in the fog: a confirm, then all at once */
  await E(() => window.__T.bmPick(2));
  ok(near(await E(() => window.__T.S.bm.ter[2].pool), 12), 'a first tap in the fog only warns');
  await E(() => window.__T.bmPick(2));
  w = await E(() => window.__T.S.bm.wash);
  ok(near(await E(() => window.__T.S.bm.ter[2].pool), 0) && near(w.kg, 16) && near(w.u, 4.8), 'a second tap strips it blind: all 12 kg, 40% underripe');
  ok(await E(() => window.__T.S.bm.picks.clean === 2 && window.__T.S.bm.picks.blind === 1), 'clean baskets and blind strips are counted');
  /* leaving rests the visit's picking */
  const bays0 = await E(() => window.__T.S.bm.bbq.length);
  await E(() => { const T = window.__T; T.travel(-1); T.bmTick(); });
  ok(await E(() => !window.__T.S.bm.wash) && (await E(() => window.__T.S.bm.bbq.length)) === bays0 + 1, 'leaving the island puts the picking to rest on the barbecue');
  ok(await E(() => { const q = window.__T.BEACON.last(); return q && q.e === 'bm_pick' && q.m === 2 && q.out === 1; }), 'bm_pick says how many baskets were clean and how many terraces went blind');
  await E(() => window.__T.goBm()); await clean();

  /* resting and grading at certification 1: six beans, two barrels */
  const last = await E(() => window.__T.S.bm.bbq.length - 1);
  await E((j) => window.__T.bmGradeStart(j), last);
  ok(await E((j) => !window.__T.bmG && !!window.__T.S.bm.bbq[j] && document.getElementById('modal').hidden, last), 'a batch can\'t be graded before it has rested');
  ok(await E(() => window.__T.bmRestMs() === 8 * 3600e3), 'resting takes 8 hours with no wet mills');
  await E(() => window.__T.bmGradeStart(0));
  let G = await E(() => window.__T.bmG && { n: window.__T.bmG.beans.length, k: window.__T.bmG.k });
  ok(G && G.n === 6 && G.k === 0, 'certification 1: a tray of 6 beans, all by hand');
  ok(await E(() => [...document.querySelectorAll('#modalCard [data-act^="bm_g:"]')].map((x) => x.dataset.act).join() === 'bm_g:n1,bm_g:n2'), 'two barrels to choose from: No. 1 and No. 2');
  if (shots) await g.screenshot({ path: path.join(shots, '3-grading.png') });
  const before = await E(() => ({ xp: window.__T.S.bm.xp, n1: window.__T.S.bm.bar.n1, n2: window.__T.S.bm.bar.n2, bays: window.__T.S.bm.bbq.length }));
  for (let k = 0; k < 6; k++) await E(() => { const T = window.__T, x = T.bmG.beans[T.bmG.k]; document.querySelector('#modalCard [data-act="bm_g:' + x.g + '"]').click(); });
  const after = await E(() => ({ xp: window.__T.S.bm.xp, lv: window.__T.S.bm.lv, n1: window.__T.S.bm.bar.n1, n2: window.__T.S.bm.bar.n2, bays: window.__T.S.bm.bbq.length, clean: window.__T.S.bm.clean, trays: window.__T.S.bm.trays }));
  ok(after.bays === before.bays - 1 && after.trays === 1, 'the graded batch leaves the barbecue');
  ok(Math.abs((after.n1 + after.n2) - (before.n1 + before.n2) - 24) < 0.01, 'all 24 kg of the seeded batch went into the barrels');
  ok(after.clean === 1 && (after.xp > before.xp || after.lv > 1), 'a tray sorted by hand without a slip is a clean tray, and earns certification');
  ok(/Tray graded/.test(await modal()) && /clean tray/.test(await modal()), 'the summary says what went where');
  ok(await E(() => { const q = window.__T.BEACON.last(); return q && q.e === 'bm_grade' && q.m === 6 && q.served === 6 && q.out === 0; }), 'bm_grade counts beans by hand, right and wrong');
  await clean();

  /* a wrong flick lowers that barrel's grade, nothing is lost */
  await E(() => { const B = window.__T.S.bm; B.bbq = [{ kg: 60, u: 0, o: 0, at: Date.now() - 9 * 3600e3 }]; B.bar.n1 = 0; B.bad.n1 = 0; B.bar.n2 = 0; B.bad.n2 = 0; });
  await E(() => window.__T.bmGradeStart(0));
  const wrongTo = await E(() => { const T = window.__T, x = T.bmG.beans[0], to = x.g === 'n1' ? 'n2' : 'n1'; document.querySelector('#modalCard [data-act="bm_g:' + to + '"]').click(); return to; });
  ok(/That one was/.test(await modal()), 'a wrong flick says what it was');
  await E(() => { document.querySelector('#modalCard [data-act="bm_gsel"]').click(); });
  const wr = await E((to) => ({ bad: window.__T.S.bm.bad[to], bar: window.__T.S.bm.bar[to], sel: window.__T.S.bm.bar.sel, clean: window.__T.S.bm.clean }), wrongTo);
  ok(wr.bad === 10 && wr.bar === 10, 'the wrong bean went in anyway and counts against that barrel (' + wr.bad + ' kg)');
  ok(wr.sel === 50 && wr.clean === 1, 'Send the rest as Select: the other 50 kg into the Select sack, and no clean tray');
  await clean();
  await E(() => { const T = window.__T; T.setTab('farm'); T.renderPanel(); }); await g.waitForTimeout(200);
  ok(/% true to grade/.test(await E(() => document.getElementById('panel').innerText)), 'the barrel store shows how true to grade a barrel is');

  /* certification: what each level opens */
  const lvl = async (n) => { for (let k = 0; k < n; k++) await E(() => { const T = window.__T, B = T.S.bm; T.bmXp(T.bmNeed(B.lv) - B.xp); }); };
  await E(() => { const B = window.__T.S.bm; B.lv = 1; B.xp = 0; });
  await lvl(1);
  await E(() => { const T = window.__T; T.S.bmSub = 'island'; T.setTab('farm'); T.renderPanel(); });
  ok(await E(() => window.__T.S.bm.lv === 2 && /Next: certification 3 brings the Peaberry barrel/.test(document.getElementById('panel').innerText)), 'certification 2 reached, and the page always shows what the next one brings');
  await lvl(1);
  await E(() => { const B = window.__T.S.bm; B.bbq = [{ kg: 50, u: 0, o: 0, at: Date.now() - 9 * 3600e3 }]; window.__T.bmGradeStart(0); });
  ok(await E(() => window.__T.bmG.beans.length === 10 && document.querySelectorAll('#modalCard [data-act^="bm_g:"]').length === 4), 'certification 3: trays of 10 and the Peaberry barrel too');
  await clean(); await E(() => { window.__T.bmG && window.__T.bmGradeSelect(); }); await clean();
  await lvl(1);
  ok(await E(() => window.__T.S.bm.lv === 4 && window.__T.S.bm.ter[4].pool < 0.05), 'certification 4 opens a fifth terrace');
  await E(() => { const T = window.__T, B = T.S.bm; B.last = Date.now() - 3600e3; T.bmTick(); });
  ok(await E(() => window.__T.S.bm.ter[4].pool > 0.9), 'and it starts ripening');
  ok(await E(() => window.__T.bmAuto() === 0), 'no grader before certification 5');
  await lvl(1);
  const auto5 = await E(() => window.__T.bmAuto());
  await E(() => { window.__T.LOCS.forEach((l) => { const f = window.__T.S.farms[l]; f.build = f.build || {}; f.build.sorter = 5; }); });
  const auto5s = await E(() => window.__T.bmAuto());
  ok(auto5 >= 0.19 && auto5s > auto5, 'certification 5: the grader sorts part of each tray, more with mainland sorters (' + auto5.toFixed(2) + ' → ' + auto5s.toFixed(2) + ')');
  await E(() => { const B = window.__T.S.bm; B.bbq = [{ kg: 50, u: 0, o: 0, at: Date.now() - 9 * 3600e3 }]; window.__T.bmGradeStart(0); });
  ok(await E(() => window.__T.bmG.k > 0 && window.__T.bmG.beans.slice(0, window.__T.bmG.k).every((x) => x.put === x.g)), 'the grader\'s beans are already in their barrels, and right');
  await clean(); await E(() => window.__T.bmG && window.__T.bmGradeSelect()); await clean();
  await E(() => { window.__T.LOCS.forEach((l) => { const f = window.__T.S.farms[l]; f.build.wetmill = 5; }); });
  ok(await E(() => window.__T.bmRestMs() < 8 * 3600e3 && window.__T.bmRestMs() >= 0.7 * 8 * 3600e3), 'mainland wet mills shorten the rest, by 30% at most');
  await lvl(2);
  ok(await E(() => window.__T.S.bm.lv === 7 && window.__T.S.bm.bbq.length <= 4), 'certification 7: a fourth barbecue bay');
  await lvl(3);
  ok(await E(() => window.__T.S.bm.lv === 10 && window.__T.S.rev.pets.doctorbird === true), 'certification 10: the doctor bird follows your farmer');
  await lvl(2);
  ok(await E(() => window.__T.S.bm.lv === 12 && window.__T.S.sitems.title['bm:grader'] === true), 'certification 12: the Blue Mountain grader title');
  await lvl(1);
  ok(await E(() => window.__T.S.bm.lv === 12), 'and 12 is the top');

  /* shipping to the roastery, and the Counter */
  await E(() => { const B = window.__T.S.bm; B.bar.n1 = 20; B.bad.n1 = 0; });
  ok(!(await E(() => window.__T.bmShip('n1'))), 'a barrel ships only when it is full');
  await E(() => { const T = window.__T, S = T.S, B = S.bm; B.bar.n1 = 31; B.bad.n1 = 0; S.roastery.beans = {}; S.roastery.want = {}; });
  ok(await E(() => window.__T.bmShip('n1')), 'a full No. 1 barrel ships');
  const bean = await E(() => window.__T.S.roastery.beans['typica.bm_n1']);
  ok(bean && bean.kg === 30 && bean.cup > 88 && bean.coins > 0, 'it lands in an Osaka bin: 30 kg, cup ' + (bean && bean.cup.toFixed(1)) + ', worth ' + (bean && Math.round(bean.coins)) + ' coins green');
  ok(await E(() => window.__T.S.bm.bar.n1 === 1 && window.__T.S.bm.ship.n1 === 1), 'what\'s left stays for the next barrel');
  ok(await E(() => { const q = window.__T.BEACON.last(); return q && q.e === 'bm_ship' && q.key === 'n1'; }), 'bm_ship says which grade');
  await E(() => { const S = window.__T.S; ['a.washed', 'b.washed', 'c.washed', 'd.washed'].forEach((k) => { S.roastery.beans[k] = { kg: 5, coins: 1, pts: 0, cup: 84 }; }); S.bm.bar.n2 = 30; });
  ok(!(await E(() => window.__T.bmShip('n2'))) && await E(() => window.__T.S.bm.bar.n2 === 30 && !window.__T.S.roastery.beans['typica.bm_n2']), 'with the bins full the barrel waits, nothing lost');
  ok(/Blue Mtn/.test(await E(() => { const S = window.__T.S; S.roastery.beans = {}; return window.__T.ctAction({ key: 'typica.bm_n1', n: 2, got: 0, profile: 'medium' }, false); })), 'a Counter order for Blue Mountain coffee points to the island');

  /* the panel, the log, the perks list */
  await E(() => { const T = window.__T; T.S.bmSub = 'island'; T.setTab('farm'); T.renderPanel(); }); await g.waitForTimeout(200);
  let txt = await E(() => document.getElementById('panel').innerText);
  ok(/certification 12/.test(txt) && /Barrel store/.test(txt) && /From the mainland/.test(txt) && !/undefined|NaN/.test(txt), 'the island page: certification, barrels, the mainland\'s help, no undefined');
  if (shots) await g.screenshot({ path: path.join(shots, '4-panel.png') });
  await E(() => { const T = window.__T; T.S.bmSub = 'log'; T.renderPanel(); }); await g.waitForTimeout(200);
  txt = await E(() => document.getElementById('panel').innerText);
  ok(/Trays graded/.test(txt) && /Certification 12/.test(txt) && !/undefined|NaN/.test(txt), 'the log: trays, picking, every certification');
  await E(() => { const T = window.__T, S = T.S; S.rankSub = 'prestige'; S.perksOpen = true; T.setTab('ranks'); T.renderPanel(); }); await g.waitForTimeout(200);
  ok(/Blue Mountain · prestige 5/.test(await E(() => document.getElementById('panel').innerText)), 'Ranks › Prestige lists the island at prestige 5');

  /* saving, reloading, prestige */
  await E(() => { const T = window.__T; T.S.bm.trays = 42; T.save(); });
  await g.reload(); await g.waitForTimeout(1200);
  ok(await E(() => window.__T.S.bm && window.__T.S.bm.trays === 42 && window.__T.S.bm.lv === 12), 'the island is saved and comes back');
  ok(await E(() => window.__T.S.rev.pets.doctorbird === true), 'so does the doctor bird');
  ok(await E(() => window.__T.titleText('bm:grader') === 'Blue Mountain grader'), 'the title has its name');
  ok(!errs.length, 'no page errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  console.log(pass + ' passed, ' + fail + ' failed');
  await b.close(); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
