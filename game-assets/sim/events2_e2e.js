/* The other seven random events end to end, in the real game: leaf rust, cherry monkeys, the crow flock, storehouse rats, the power cut,
   the roaster fire and the typhoon. Each one's harm, stopping it with real taps on the map, its keepsakes, and a companion.
   node events2_e2e.js <test.html from mktest.py> [shots dir] */
const { chromium } = require(process.env.PW_MODULE || '/opt/node-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
const file = path.resolve(process.argv[2]), shots = process.argv[3] || ''; if (shots) fs.mkdirSync(shots, { recursive: true });
const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + file); await p.waitForTimeout(800);
  const clean = () => p.evaluate(() => { const T = window.__T; for (let i = 0; i < 8; i++) T.closeModal(); document.getElementById('modal').hidden = true; });
  await p.evaluate(() => { const T = window.__T, S = T.S; S.name = S.nameOk = 'Tess'; S.guide = T.GUIDE.length; S.prestige = 1; S.lv.racks = 4; S.goldenTip = true; Object.keys(S.tabs).forEach((k) => { S.tabs[k] = true; }); S.nav = null; S.navSeen = new Proxy({}, { get: () => true }); S.pwalkDone = true; T.revSess = -1e9; });   /* no events of their own during the test */
  for (let k = 0; k < 3; k++) { await clean(); await p.waitForTimeout(150); }
  await p.mouse.click(5, 300);
  const E = () => p.evaluate(() => JSON.parse(JSON.stringify(window.__T.S.rev.cur)));
  const start = async (id, rare, map) => { await p.evaluate(([id, rare]) => { const T = window.__T; T.S.rev.cur = null; return T.revStart(id, { rare, force: true }); }, [id, rare]); await p.evaluate(() => window.__T.revGo()); await p.waitForTimeout(900); await clean(); };
  const tapMap = async (x, y) => { const r = await p.evaluate(([x, y]) => { const sc = document.getElementById('scroller'), cv = document.getElementById('cv'), k = cv.getBoundingClientRect().width / 192, c = cv.getBoundingClientRect(), s = sc.getBoundingClientRect(), cy = c.top + y * k; if (cy < s.top + 20 || cy > s.bottom - 60) sc.scrollTop += cy - (s.top + s.bottom) / 2; const c2 = cv.getBoundingClientRect(); return [c2.left + x * k, c2.top + y * k]; }, [x, y]); await p.mouse.click(r[0], r[1]); await p.waitForTimeout(140); };
  const shot = async (n) => { if (shots) await p.screenshot({ path: path.join(shots, n + '.png') }); };
  const stopped = (id) => p.evaluate((id) => (window.__T.S.rev.log[id] || {}).n || 0, id);

  // leaf rust: the farm grows slower, it spreads every 6 s, pruning every spotted bush clears it
  await start('rust', false);
  let e = await E();
  ok(e && e.sick.length === 4, 'leaf rust: 4 spotted bushes in a field at ' + (e && e.loc));
  ok(await p.evaluate(() => window.__T.revGrow(window.__T.S.farms[window.__T.S.rev.cur.loc]) === 0.6), 'the farm grows 40% slower');
  await p.waitForTimeout(6600);
  ok((await E()).sick.length === 5, 'six seconds later it has spread to a fifth bush');
  await shot('rust');
  for (let k = 0; k < 9 && await E(); k++) { const at = await p.evaluate(() => { const T = window.__T, E = T.S.rev.cur, s = T.S.farms[E.loc].shrubs[E.sick[0]]; return [s.x + 9, s.y + 11]; }); await tapMap(at[0], at[1]); }
  ok(!(await E()) && await stopped('rust') === 1, 'pruning each spotted bush clears it');
  ok(await p.evaluate(() => window.__T.revGrow(window.__T.S.farms.mogiana) === 1), 'and the farm grows at full speed again');

  // cherry monkeys: each armful that reaches the trees takes a little of the barn; tap only the loaded ones
  await p.evaluate(() => { window.__T.S.cherries.caturra = 80; });
  await start('monkeys', true);
  e = await E();
  ok(e && e.m.length === 3, 'monkeys: 3 at prestige 1 (with the baby capuchin, rare)');
  await p.waitForTimeout(9500);
  const lost = (await E()).lost; ok(lost > 0, 'armfuls reaching the trees take cherries from the barn (' + lost.toFixed(2) + ' kg so far)');
  await shot('monkeys');
  let misses = 0;
  for (let k = 0; k < 120 && await E(); k++) {
    const at = await p.evaluate(() => { const T = window.__T, E = T.S.rev.cur, D = T.REVS.monkeys; const m = E.m.map((x) => D.pos(E, x)).find((q) => q.show && q.x > 30 && q.x < 105); return m ? [m.x, m.y - 6, m.full] : null; });
    if (!at) { await p.waitForTimeout(150); continue; }
    if (!at[2] && misses++ > 0) { await p.waitForTimeout(150); continue; }   /* one tap on an empty-handed one, to hear it miss */
    await tapMap(at[0], at[1]);
  }
  ok(!(await E()) && await stopped('monkeys') === 1, 'tapping the loaded monkeys chases them off');
  ok(await p.evaluate(() => window.__T.S.rev.show.capuchin === true), 'the rare troop leaves the capuchin plush');

  // crow flock: crows keep the pickers off their bushes; wave the scarecrow, then shoo the ones that stay
  await p.evaluate(() => window.__T.S.farms.mogiana.shrubs.forEach((s) => { s.p = 1; }));
  await start('crows', false);
  e = await E();
  ok(e && e.c.length === 6, 'crows: 6 on the bushes at prestige 1');
  ok(await p.evaluate(() => { const T = window.__T, E = T.S.rev.cur, f = T.S.farms[E.loc]; return E.c.every((c) => T.revBlocked(f, c.i)); }), 'pickers keep off the bushes the crows are on');
  const c0 = await p.evaluate(() => { const T = window.__T, E = T.S.rev.cur, b = T.REVS.crows.cbox(E, E.c[0]); return [b[0] + 5, b[1] + 4]; });
  await tapMap(c0[0], c0[1]);
  ok((await E()).c.length === 6, 'shooing a crow before the scarecrow waves does nothing');
  await shot('crows');
  await tapMap(136, 118);
  e = await E();
  ok(e.waved && e.c.length === 2, 'waving the scarecrow scares off all but 2');
  for (let k = 0; k < 4 && await E(); k++) { const at = await p.evaluate(() => { const T = window.__T, E = T.S.rev.cur, b = T.REVS.crows.cbox(E, E.c[0]); return [b[0] + 5, b[1] + 4]; }); await tapMap(at[0], at[1]); }
  ok(!(await E()) && await stopped('crows') === 1, 'then shooing those two clears it');

  // storehouse rats: dried lots lose weight and nothing loads; trap the holes with tails (and the king, rare)
  await p.evaluate(() => { const T = window.__T, S = T.S; S.cherries.caturra = 400; S.lots = []; T.startLot('caturra', 'washed'); S.lots[0].left = 0; S.staff.foreman = true; });
  await start('rats', true);
  const w0 = await p.evaluate(() => window.__T.S.lots[0] && window.__T.S.lots[0].kg);
  await p.waitForTimeout(3000);
  ok(await p.evaluate((w0) => { const l = window.__T.S.lots[0]; return l && l.kg < w0; }, w0), 'rats: the dried lot loses weight, and the foreman won\'t load it');
  await shot('rats');
  const emptyHole = await p.evaluate(() => { const E = window.__T.S.rev.cur; return [0, 1, 2, 3, 4, 5].find((j) => !E.tails.includes(j)); });
  const H = [[82, 292], [100, 286], [118, 294], [136, 286], [154, 294], [172, 286]];
  await tapMap(H[emptyHole][0] + 5, H[emptyHole][1] + 2);
  ok((await E()).set.length === 0, 'an empty hole is a miss');
  for (const j of (await E()).tails) await tapMap(H[j][0] + 5, H[j][1] + 2);
  ok(!!(await E()), 'with the three traps set, the king rat is still loose');
  const kx = await p.evaluate(() => window.__T.REVS.rats.kx(window.__T.S.rev.cur));
  await tapMap(kx, 274);
  ok(!(await E()) && await stopped('rats') === 1, 'catching the king clears it');
  ok(await p.evaluate(() => window.__T.S.rev.show.crown === true), 'and his crown goes on the mill\'s patio sign');
  await p.evaluate(() => { window.__T.S.staff.foreman = false; window.__T.S.lots = []; });

  // power cut: roasters at two-thirds speed, no catching the crack; open the fuse box and flip in order
  await p.evaluate(() => { const T = window.__T, S = T.S; S.roastery.beans['caturra.washed'] = { kg: 400, coins: 4000, pts: 400, cup: 84 }; T.act('roast:caturra.washed|medium'); });
  await start('power', false);
  const s0 = await p.evaluate(() => window.__T.S.roastery.roasters[0].start);
  await p.waitForTimeout(3000);
  const s1 = await p.evaluate(() => window.__T.S.roastery.roasters[0].start);
  ok(s1 - s0 > 700 && s1 - s0 < 1300, 'power cut: the roaster runs at two-thirds speed (' + (s1 - s0) + ' ms of 3 s lost)');
  ok(await p.evaluate(() => { const T = window.__T; T.crackRoast(0); return !T.S.roastery.roasters[0].crack; }), 'and the crack can\'t be caught');
  await tapMap(14, 155);
  ok((await E()).open, 'tapping the fuse box opens it');
  await shot('power');
  const order = (await E()).order, sw = (k) => { const n = order.length, w = 64 / n; return [32 + k * w + w / 2, 157]; };
  const wrongK = order[1]; await tapMap(...sw(wrongK));
  ok((await E()).step === 0, 'a switch out of order starts it again');
  for (const k of order) await tapMap(...sw(k));
  ok(!(await E()) && await stopped('power') === 1, 'flipping them in order brings the lights back');

  // roaster fire: the roaster stops, the batch burns at 60 s; grab the extinguisher, then spray 4 times
  await start('fire', false);
  e = await E();
  ok(e && e.bay === 0 && e.left > 55, 'fire: roaster 1 is burning, 60 s on the clock');
  await tapMap(21, 80);
  ok((await E()).spray === 0, 'spraying needs the extinguisher first');
  await shot('fire');
  await tapMap(101, 72);
  ok((await E()).grab, 'tap the extinguisher to grab it');
  for (let k = 0; k < 4; k++) await tapMap(21, 80);
  ok(!(await E()) && await stopped('fire') === 1 && await p.evaluate(() => window.__T.S.roastery.roasters.length === 1), 'four sprays put it out, and the batch is saved');
  await start('fire', false);
  await p.evaluate(() => { window.__T.S.rev.cur.left = 0.3; }); await p.waitForTimeout(800);
  ok(await p.evaluate(() => window.__T.S.rev.cur.burnt && window.__T.S.roastery.roasters.length === 0), 'left to burn, the batch is lost at 0:00');
  await p.evaluate(() => { window.__T.act('roast:caturra.washed|medium'); });
  ok(await p.evaluate(() => window.__T.S.roastery.roasters.length === 0), 'and the burnt roaster takes no new batch until the fire is out');
  await p.evaluate(() => window.__T.revEnd(false));

  // typhoon: two minutes' warning, then a storm on every map not battened down; one task a map
  await p.evaluate(() => { window.__T.S.rev.streak = 3; });
  await start('typhoon', false);
  e = await E();
  ok(e && e.stakes.length === 2 && e.tarpN >= 3 && e.plants === false, 'typhoon: stake 2 bushes, tarp ' + (e && e.tarpN) + ' racks, bring in the plants');
  ok(await p.evaluate(() => !window.__T.revStorm('farm')), 'nothing is harmed during the warning');
  await p.evaluate(() => { window.__T.S.rev.cur.t = 125; });
  ok(await p.evaluate(() => window.__T.revStorm('farm') && window.__T.revStorm('mill') && window.__T.revStorm('roast')), 'once it hits, the storm stops each map not battened down');
  await shot('typhoon-farm');
  for (const i of e.stakes) { const at = await p.evaluate((i) => { const s = window.__T.S.farms[window.__T.S.rev.cur.loc].shrubs[i]; return [s.x + 9, s.y + 11]; }, i); await tapMap(at[0], at[1]); }
  ok(await p.evaluate(() => window.__T.tyDone(window.__T.S.rev.cur).farm && !window.__T.revStorm('farm')), 'staking the bushes battens down the farm');
  await p.click('#guide [data-act="revgo"]'); await p.waitForTimeout(800); await clean();
  ok(await p.evaluate(() => window.__T.scene === 'mill'), 'Go takes you on to the mill');
  await shot('typhoon-mill');
  for (let k = 0; k < e.tarpN; k++) { const at = await p.evaluate((k) => { const r = window.__T.rackAt(k); return [r.x + 20, r.y + 6]; }, k); await tapMap(at[0], at[1]); }
  await p.click('#guide [data-act="revgo"]'); await p.waitForTimeout(800); await clean();
  ok(await p.evaluate(() => window.__T.scene === 'roast'), 'and then to the roastery');
  await tapMap(177, 291);
  ok(!(await E()) && await stopped('typhoon') === 1 && await p.evaluate(() => window.__T.S.rev.show.shutters === true), 'all three done: the typhoon passes, and the storm shutters come on the first stop');

  // a companion: one stop in 100
  await p.evaluate(() => { const T = window.__T, r = Math.random; Math.random = () => 0.005; T.S.rev.cur = null; T.revStart('rust', { rare: false }); T.revEnd(true); Math.random = r; });
  ok(await p.evaluate(() => Object.keys(window.__T.S.rev.pets || {}).length === 1), 'one stop in 100 brings a companion: ' + await p.evaluate(() => Object.keys(window.__T.S.rev.pets).join()));
  await p.evaluate(() => { const S = window.__T.S; S.rev.pets = { piglet: true, capuchin: true, crow: true, millcat: true, dalmatian: true }; window.__T.setTab('farm', true); });
  await p.waitForTimeout(6000); await shot('pets-train');
  await p.evaluate(() => { window.__T.S.rankSub = 'records'; window.__T.setTab('ranks'); }); await p.waitForTimeout(500);
  await p.evaluate(() => document.querySelector('[data-act="revpet:crow"]').click()); await p.waitForTimeout(200);
  ok(await p.evaluate(() => window.__T.S.rev.petHide.crow === true), 'with five, they all follow in a line, and a chip leaves one at home');
  await p.evaluate(() => { document.querySelector('[data-act="revpet:crow"]').click(); window.__T.setTab('farm', true); });

  // every keepsake on its map
  await p.evaluate(() => { const S = window.__T.S; ['seedling', 'plush', 'capuchin', 'scarecrow', 'magpie', 'catflap', 'crown', 'oillamp', 'candles', 'firebell', 'scorch', 'shutters'].forEach((k) => { S.rev.show[k] = true; }); S.minutes = 20 * 60; S.lv.storage = 5; window.__T.setTab('farm', true); });
  await p.waitForTimeout(600); await shot('keep-farm');
  await p.evaluate(() => { window.__T.setTab('mill', true); document.getElementById('scroller').scrollTop = 0; }); await p.waitForTimeout(600); await shot('keep-mill');
  await p.evaluate(() => { window.__T.setTab('roast', true); }); await p.waitForTimeout(600); await shot('keep-roast');
  await p.evaluate(() => { document.getElementById('scroller').scrollTop = 1e4; }); await p.waitForTimeout(300); await shot('keep-roast-front');
  ok(!errs.length, 'no page errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await b.close();
})();
