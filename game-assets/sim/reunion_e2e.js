/* Réunion, the Pointu nursery, end to end in the real game: closed until prestige 6, a first voyage there and the harbour
   board's project; Tante Lise's welcome; a shift from the shed (the batch by level), planting, misting once a stage, wilting when
   a stage turns dry, fruiting after three stages, picking, the can and the cistern; the shift waiting while you're away; the
   score with its 50/75/100 bonuses and the outfit, paid in xp, coins, know-how and a Pointu lot for the bins; ending early; levels
   (bigger batches, the copper mister, the seed tray, the drip line, the hat, nursery-raised seedlings at home, Bourbon Pointu for
   your farms, the title); the tuit-tuit; compost from your farms; the daily task; the page; "Where to?"; and a reload.
   node reunion_e2e.js <test.html from mktest.py> [shots dir] */
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
  const bed = (i) => E((i) => { const a = window.__T.RE_BED(i); return [a.x + 19, a.y + 12]; }, i);
  await E(() => { const T = window.__T, S = T.S, d = new Date(); S.checkin.last = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); S.name = S.nameOk = 'Tess'; S.guide = T.GUIDE.length; S.prestige = 5; S.pwalkDone = true; S.practiceTip = true; S.roastery.tip = true; Object.keys(S.tabs).forEach((k) => { S.tabs[k] = true; }); S.rev.cur = null; T.revSess = 0; S.loc = 'osaka'; S.isle = false; T.setTab('farm', true); T.bmTick(); S.bm.seen = true; T.routeTick(); S.route.seen = true; });
  await clean();

  /* opening: prestige 6, a first voyage to Réunion, then the board's project */
  const proj = () => E(() => window.__T.bdState(window.__T.BOARD.find((x) => x.id === 'isle_re')));
  ok(await proj() === 'Opens at prestige 6', 'the nursery waits for prestige 6');
  await E(() => { window.__T.S.prestige = 6; });
  ok(await proj() === 'Sail to Réunion first', 'then for a first voyage to Réunion');
  await E(() => { const R = window.__T.S.route; R.vdone.reunion = 1; R.cw = 0; });
  ok(await proj() === 'cowries', 'then for its 6 cowries');
  await E(() => { const T = window.__T; T.S.route.cw = 6; T.act('hb_build:isle_re'); });
  ok(await E(() => window.__T.isleOpen('re') && !!window.__T.S.re && window.__T.S.route.cw === 0), 'building "Settle the Pointu nursery" opens Réunion');
  await clean();
  await E(() => { const T = window.__T, S = T.S; S.loc = 'mogiana'; S.isle = false; T.setTab('farm', true); document.getElementById('prevLoc').click(); }); await g.waitForTimeout(250);
  ok(await E(() => window.__T.scene === 're'), 'Réunion comes last in the arrows, after Kona: the arrow back from Mogiana');
  await g.waitForTimeout(800);
  ok(/Tante Lise/i.test(await modal()) && /mist/i.test(await modal()), 'Tante Lise welcomes you and explains a shift');
  await clean();
  ok(await E(() => document.getElementById('locName').textContent.startsWith('Réunion') && /Lv 1/.test(document.getElementById('locLv').textContent)), 'the farm bar names the nursery and its level');
  ok(await E(() => { const h = window.__T.hintAt('re'), s = window.__T.RE_SHED; return h && h[0] === s.x + 25; }), 'the map arrow points at the shed');

  /* a shift: the shed gives a batch of 8 at level 1 */
  await tapMap(await E(() => window.__T.RE_SHED.x + 25), await E(() => window.__T.RE_SHED.y + 20));
  ok(await E(() => { const sh = window.__T.S.re.sh; return sh && sh.n === 8 && sh.left === 8 && window.__T.S.re.can === 12; }), 'tapping the shed starts a shift: 8 seedlings, a can of 12 mists');
  let p = await bed(0); await tapMap(p[0], p[1]);
  ok(await E(() => { const sh = window.__T.S.re.sh; return sh.beds[0] && sh.beds[0].st === 0 && sh.left === 7; }), 'tapping an empty bed plants a seedling');
  await tapMap(p[0], p[1]);
  ok(await E(() => window.__T.S.re.sh.beds[0].wet && window.__T.S.re.can === 11), 'tapping it again mists it: one mist from the can');
  const sm = await E(() => window.__T.reStageMs());
  ok(sm === 20000, 'a stage lasts 20 seconds with no compost at home');
  await E((sm) => { const b = window.__T.S.re.sh.beds[0]; b.at -= sm + 10; window.__T.reTick(); }, sm);
  ok(await E(() => { const b = window.__T.S.re.sh.beds[0]; return b.st === 1 && !b.wet && !b.dead; }), 'when the stage turns, a misted seedling grows on and is dry again');
  await E((sm) => { const b = window.__T.S.re.sh.beds[0]; b.at -= sm; window.__T.reTick(); }, sm);
  ok(await E(() => window.__T.S.re.sh.beds[0].dead), 'a seedling still dry when its stage turns wilts');
  await tapMap(p[0], p[1]);
  ok(await E(() => window.__T.S.re.sh.beds[0] === null), 'tapping a wilted bed clears it');
  /* three stages, misted each time, then picking */
  p = await bed(1); await tapMap(p[0], p[1]); await tapMap(p[0], p[1]);
  for (let s = 0; s < 3; s++) { await E((sm) => { const b = window.__T.S.re.sh.beds[1]; b.at -= sm; window.__T.reTick(); }, sm); if (s < 2) await tapMap(p[0], p[1]); }
  ok(await E(() => window.__T.S.re.sh.beds[1].st === 3), 'misted in each of its three stages, it fruits');
  const t0 = await E(() => window.__T.S.tasks ? JSON.stringify(window.__T.S.tasks).length : 0);
  await tapMap(p[0], p[1]);
  ok(await E(() => window.__T.S.re.sh.cherries === 5 && window.__T.S.re.sh.beds[1] === null), 'picking a fruiting plant gives 5 cherries');
  /* the can and the cistern */
  await E(() => { window.__T.S.re.can = 0; });
  p = await bed(2); await tapMap(p[0], p[1]); await tapMap(p[0], p[1]);
  ok(await E(() => !window.__T.S.re.sh.beds[2].wet), 'with an empty can nothing gets misted');
  await tapMap(await E(() => window.__T.RE_CIST.x + 17), await E(() => window.__T.RE_CIST.y + 16));
  ok(await E(() => window.__T.S.re.can === 12), 'the cistern refills the can');
  /* the shift waits while you're away */
  const at0 = await E(() => window.__T.S.re.sh.beds[2].at);
  await E(() => { window.__T.travel(-1); }); await g.waitForTimeout(400);
  await E(() => { window.__T.goIsle('re'); }); await g.waitForTimeout(300);
  ok(await E((a) => { const b = window.__T.S.re.sh.beds[2]; return b.at > a && !b.dead; }, at0), 'leaving the island pauses the shift: the timers move on when you come back');
  await clean();
  /* ending: score, rewards, finds */
  const before = await E(() => ({ coins: window.__T.S.coins, xp: window.__T.S.re.xp, lv: window.__T.S.re.lv, cw: window.__T.routeCw() }));
  await E(() => { const T = window.__T, sh = T.S.re.sh; sh.cherries = 55; sh.left = 0; sh.beds = sh.beds.map(() => null); T.S.roastery.beans = {}; T.S.roastery.want = {}; T.reTick(); });
  ok(await E(() => !window.__T.S.re.sh), 'a shift with every seedling picked or lost ends by itself');
  ok(/55 cherries/.test(await modal()) && /65 points/.test(await modal()), 'the report: 55 cherries + the 10 bonus at 50 = 65 points');
  ok(await E((b) => { const S = window.__T.S; return S.coins > b.coins && (S.re.lv > b.lv || S.re.xp > b.xp) && S.roastery.beans['yellowbourbon.isl_reunion'] && S.roastery.beans['yellowbourbon.isl_reunion'].kg >= 27; }, before), 'it pays coins and nursery xp, and about 28 kg of Bourbon Pointu goes into an Osaka bin');
  ok(await E(() => window.__T.S.route.got.re_first && window.__T.S.route.got.re_50 && !window.__T.S.route.got.re_75), 'finds: the first shift and 50 cherries in one shift');
  ok(await E(() => window.__T.TASK_KINDS.rcherry.ok() && /Réunion/.test(window.__T.TASK_KINDS.rcherry.text)), 'the daily task "Pick 60 Pointu cherries on Réunion" can come up');
  await clean();
  /* the shed: a tray of seedlings every 30 minutes, three at most, banked while you're away */
  ok(await E(() => window.__T.S.re.trays === 0 && window.__T.reStart() === false && !window.__T.S.re.sh), 'the first tray is used: the shed is empty until it restocks');
  ok(await E(() => /restocks in/.test(window.__T.reHud()[1])), 'the island bar says when the next tray comes');
  await E(() => { const R = window.__T.S.re; R.trayAt -= window.__T.RE_TRAY + 1000; });
  ok(await E(() => window.__T.reTrays() === 1), 'thirty minutes on, a tray is ready');
  await E(() => { const R = window.__T.S.re; R.trayAt -= 10 * window.__T.RE_TRAY; });
  ok(await E(() => window.__T.reTrays() === window.__T.RE_TRAYS), 'a day away banks three, no more');
  ok(await E(() => { const T = window.__T, R = T.S.re; delete R.trays; delete R.trayAt; return T.reTrays() === T.RE_TRAYS; }), 'a save from before trays starts with a full shed');
  await E(() => { window.__T.S.re.trays = 99; });   /* the rest of the suite starts shifts freely */
  /* ending early picks what's fruiting */
  await E(() => { const T = window.__T, sm = T.reStageMs(); T.reStart(); const sh = T.S.re.sh; T.rePlant(0); T.rePlant(1); sh.beds[0].st = 3; T.act('re_end'); });
  ok(/5 cherries/.test(await modal()), 'End shift picks the plant that fruited; the seedling still growing is lost');
  await clean();

  /* levels: batches, tools, the hat, seedlings at home, Bourbon Pointu, the title */
  const lvTo = (n) => E((n) => { const T = window.__T, R = T.S.re; while (R.lv < n) T.isleXp('re', T.isleNeed(R.lv) - R.xp); }, n);
  await lvTo(5);
  ok(await E(() => window.__T.reBatch() === 12 && window.__T.reCanMax() === 24), 'level 5: batches of 12 and a copper mister that holds 24');
  await lvTo(6);
  ok(await E(() => window.__T.S.hats.ev_re_straw), 'level 6: the nursery straw hat, in Looks');
  await lvTo(10);
  ok(await E(() => { const T = window.__T, f = T.S.farms.mogiana; T.replantBed(f, 0, 'caturra'); return f.shrubs.filter((s, i) => Math.floor(i / 8) === 0).every((s) => s.p === 0.5); }), 'level 10: a field replanted at home starts half grown');   /* checked in the same step: a frame of growth in between would move it past 0.5 */
  await lvTo(15);
  await E(() => { const T = window.__T; T.reStart(); T.rePlant(3); });
  ok(await E(() => { const sh = window.__T.S.re.sh; return sh.n === 16 && sh.beds[3] && sh.beds[4] && sh.left === 14; }), 'level 15: batches of 16, and the seed tray plants two beds a tap');
  await E(() => { window.__T.S.re.sh = null; });
  await lvTo(20);
  ok(await E(() => window.__T.S.vars.pointu && window.__T.plantVars().includes('pointu') && window.__T.reBatch() === 20), 'level 20: batches of 20, and Bourbon Pointu for your farms');
  await E(() => { const T = window.__T; T.S.loc = 'mogiana'; T.S.isle = false; T.setTab('farm'); T.act('bed:1'); }); await g.waitForTimeout(150);
  ok(await E(() => !!document.querySelector('#modalCard [data-act="plant:1.pointu"]') && /half grown/.test(document.getElementById('modalCard').innerText)), 'replanting a field offers Bourbon Pointu, and says it starts half grown');
  await E(() => document.querySelector('#modalCard [data-act="plant:1.pointu"]').click()); await g.waitForTimeout(120);
  ok(await E(() => window.__T.S.farms.mogiana.beds[1] === 'pointu' && window.__T.S.route.got.re_pointu), 'Bourbon Pointu planted at home: a find for the ledger');
  await clean();
  await lvTo(25);
  await E(() => { const T = window.__T; T.goIsle('re'); T.reStart(); T.rePlant(0); });
  ok(await E(() => window.__T.S.re.sh.beds[0].wet), 'level 25: the drip line waters the first stage');
  await E(() => { window.__T.S.re.sh = null; });
  await lvTo(30);
  ok(await E(() => window.__T.S.sitems.title['re:keeper'] && window.__T.titleText('re:keeper') === 'Pointu keeper' && window.__T.S.route.got.re_outfit && window.__T.S.route.got.re_l30), 'level 30: the "Pointu keeper" title; the outfit and the level finds');
  await clean();
  /* the outfit's bonus and the tuit-tuit */
  const pet = await E(() => { const T = window.__T, S = T.S, rnd = Math.random; Math.random = () => 0.001; T.reStart(); const sh = S.re.sh; sh.cherries = 100; sh.left = 0; sh.beds = sh.beds.map(() => null); T.reTick(); Math.random = rnd; return { pet: !!S.rev.pets.tuittuit, find: !!S.route.got.re_pet, f100: !!S.route.got.re_100 }; });
  ok(pet.pet && pet.find, 'a good shift can bring the tuit-tuit home: a companion and a find');
  ok(pet.f100 && /204 points/.test(await modal()), 'a perfect 100: 100 + 85 bonus, +10% for the four outfit pieces = 204 points');
  await clean();
  ok(await E(() => { const T = window.__T, S = T.S; delete S.rev.pets.tuittuit; S.re.tuittuitDry = 149; T.reStart(); const sh = S.re.sh; sh.cherries = 50; sh.left = 0; sh.beds = sh.beds.map(() => null); const rnd = Math.random; Math.random = () => 0.99; T.reTick(); Math.random = rnd; return !!S.rev.pets.tuittuit; }), 'bad luck has a floor: the 150th good shift brings it for sure');
  await clean();
  /* compost at home makes seedlings grow faster */
  ok(await E(() => { const T = window.__T, S = T.S; S.farms.mogiana.build = Object.assign({}, S.farms.mogiana.build, { compost: 30 }); return T.reStageMs() === 15000; }), 'your farms\' compost heaps make seedlings grow a quarter faster');

  /* the page, "Where to?", a reload */
  await E(() => { const T = window.__T; T.goIsle('re'); T.setTab('farm'); });
  for (const sub of ['nursery', 'log']) { await E((s) => { window.__T.S.reSub = s; window.__T.renderPanel(); }, sub); await g.waitForTimeout(80); ok(await E(() => { const t = document.getElementById('panel').innerText; return t.length > 200 && !/undefined|NaN/.test(t); }), 'the nursery page\'s ' + sub + ' tab reads cleanly'); }
  await clean(); await E(() => window.__T.setTab('farm', true)); await g.waitForTimeout(150);
  await g.click('#locTap'); await g.waitForTimeout(200);
  ok(await E(() => !!document.querySelector('#modalCard [data-act="goplace:re"]')), '"Where to?" lists Réunion');
  await clean();
  if (shots) await g.screenshot({ path: shots + '/reunion.png' });
  await E(() => { const T = window.__T; T.reStart(); T.rePlant(0); T.save(); });
  await g.reload(); await g.waitForTimeout(1200);
  ok(await E(() => { const R = window.__T.S.re; return R && R.lv === 30 && R.sh && R.sh.beds[0]; }), 'a reload keeps the nursery and a shift in progress');
  ok(!errs.length, 'no page errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  console.log(pass + ' passed, ' + fail + ' failed');
  await b.close(); process.exit(fail ? 1 : 0);
})();
