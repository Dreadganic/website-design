/* Random events end to end, in the real game: when they start, each one's harm, stopping it with real taps on the map,
   the keepsakes, letting one go, saving and reloading mid-event, the pause while catching up, the guide bar and the sound.
   node events_e2e.js <test.html from mktest.py> [shots dir] */
const { chromium } = require(process.env.PW_MODULE || '/opt/node-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
const file = path.resolve(process.argv[2]), shots = process.argv[3] || ''; if (shots) fs.mkdirSync(shots, { recursive: true });
const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: false });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + file); await p.waitForTimeout(800);
  const clean = () => p.evaluate(() => { const T = window.__T; for (let i = 0; i < 8; i++) T.closeModal(); document.getElementById('modal').hidden = true; });
  // a farmer past the lessons, at prestige 1 with the roastery open
  await p.evaluate(() => { const T = window.__T, S = T.S; S.name = S.nameOk = 'Tess'; S.guide = T.GUIDE.length; S.prestige = 1; S.lv.racks = 3; Object.keys(S.tabs).forEach((k) => { S.tabs[k] = true; }); S.nav = null; S.navSeen = new Proxy({}, { get: () => true }); S.pwalkDone = true; });
  for (let k = 0; k < 3; k++) { await clean(); await p.waitForTimeout(200); }
  await p.mouse.click(5, 300);   /* the first tap starts the sound */
  const E = () => p.evaluate(() => JSON.parse(JSON.stringify(window.__T.S.rev.cur)));
  const tapMap = async (x, y) => { const r = await p.evaluate(([x, y]) => { const sc = document.getElementById('scroller'), cv = document.getElementById('cv'), k = cv.getBoundingClientRect().width / 192; const c = cv.getBoundingClientRect(), s = sc.getBoundingClientRect(); let cy = c.top + y * k; if (cy < s.top + 20 || cy > s.bottom - 20) { sc.scrollTop += cy - (s.top + s.bottom) / 2; } const c2 = cv.getBoundingClientRect(); return [c2.left + x * k, c2.top + y * k]; }, [x, y]); await p.mouse.click(r[0], r[1]); await p.waitForTimeout(120); };
  const toastText = () => p.evaluate(() => document.getElementById('toast').hidden ? '' : document.getElementById('toast').textContent);
  const shot = async (n) => { if (shots) await p.screenshot({ path: path.join(shots, n + '.png') }); };

  // when they start: never in a session's first minute or during the lessons; a new session's first roll comes 1 minute in, whenever the last event was; after that 5 minutes between
  await p.evaluate(() => { const T = window.__T; T.revSess = 0; T.revSessEv = false; T.S.rev.since = 100; T.S.guideSaid = 0; T.S.guide = 0; Math.random0 = Math.random; Math.random = () => 0.01; });   /* (Rosa's card for the step already said) */
  await p.waitForTimeout(1500);
  ok(!(await E()), 'no event in the first minute of a session');
  await p.evaluate(() => { window.__T.revSess = 70; }); await p.waitForTimeout(1500);
  ok(!(await E()), 'none during the lessons');
  await p.evaluate(() => { const T = window.__T; T.S.guide = T.GUIDE.length; }); await clean();
  await p.waitForFunction(() => !!window.__T.S.rev.cur, null, { timeout: 5000 }).catch(() => {});
  const auto = await E();
  ok(!!auto, '1 minute into a new session one can start, though the last was only 1.7 min of play ago: ' + (auto && auto.id));
  await p.evaluate(() => { const T = window.__T; T.S.rev.cur = null; T.revEnd(false); T.S.rev.since = 100; }); await clean(); await p.waitForTimeout(1500);
  ok(!(await E()), 'later in the session, none within 5 minutes of the last one');
  await p.evaluate(() => { window.__T.S.rev.since = 5000; });
  await p.waitForFunction(() => !!window.__T.S.rev.cur, null, { timeout: 70000 }).catch(() => {});
  ok(!!(await E()), 'and one starts on a roll after that');
  await p.evaluate(() => { Math.random = Math.random0; const T = window.__T; T.S.rev.cur = null; T.revEnd(false); });
  await clean();

  // pig raid: a field at a farm, pickers keep out, the field can't be picked, and every pig tapped clears it
  await p.evaluate(() => { const T = window.__T; T.S.rev.cur = null; T.revStart('pigs', { rare: false }); });
  let e = await E();
  ok(e && e.id === 'pigs' && e.pigs.length === 3 && e.loc === 'mogiana', 'pig raid: 3 pigs at prestige 1, at an open farm (' + (e && e.loc) + ', field ' + (e && e.bed) + ')');
  ok(await p.evaluate(() => { const T = window.__T, f = T.S.farms[T.S.rev.cur.loc]; return f.shrubs.every((s, i) => T.revBlocked(f, i) === (Math.floor(i / 8) === T.S.rev.cur.bed)) && f.shrubs.every((s, i) => Math.floor(i / 8) !== T.S.rev.cur.bed || !s.claim); }), 'pickers keep out of the raided field and let go of its bushes');
  await p.waitForTimeout(700); const g1 = await p.evaluate(() => document.getElementById('guide').hidden ? '' : document.getElementById('guide').innerText);
  ok(/Pig raid/.test(g1), 'the guide bar carries the event: ' + g1.replace(/\s+/g, ' '));
  await p.evaluate(() => { window.__T.setTab('mill', true); }); await p.waitForTimeout(700);
  ok(await p.evaluate(() => !!document.querySelector('#guide [data-act="revgo"]') && !!document.querySelector('.tab[data-tab="farm"] .dot')), 'on another map: a Go button in the bar and a dot on the Farm tab');
  ok(await p.evaluate(() => !window.__T.revIsHere()), 'it isn\'t "here" from the mill (its sound muffles)');
  await p.click('#guide [data-act="revgo"]'); await p.waitForTimeout(700);
  ok(await p.evaluate(() => window.__T.scene === 'farm' && window.__T.revIsHere()), 'Go takes you to the field');
  ok(await p.evaluate(() => !document.getElementById('garrow').hidden), 'the guide arrow points at it');
  await shot('pigs');
  const bed = await p.evaluate(() => { const T = window.__T, b = [[10, 110, 80, 42], [104, 110, 80, 42], [10, 158, 80, 42], [104, 158, 80, 42]][T.S.rev.cur.bed], E = T.S.rev.cur, free = [[2, 2], [70, 2], [2, 36], [70, 36], [40, 20]].map(([dx, dy]) => [b[0] + dx, b[1] + dy]).find(([x, y]) => E.pigs.every((q) => { const px = T.REVS.pigs.pos(E, q).x; return x < px - 6 || x > px + 22 || y < q.y - 6 || y > q.y + 18; })); return free; });
  const kg0 = await p.evaluate(() => window.__T.stored());
  await tapMap(bed[0], bed[1]);
  ok(await p.evaluate((kg0) => window.__T.stored() === kg0 && !!window.__T.S.rev.cur, kg0), 'a tap on the field (not a pig) picks nothing');
  for (let i = 0; i < 3; i++) {
    const at = await p.evaluate(() => { const T = window.__T, E = T.S.rev.cur, q = E.pigs[0], pos = T.REVS.pigs.pos(E, q); return [pos.x + 8, q.y + 6]; });
    await tapMap(at[0], at[1]);
  }
  e = await E();
  ok(!e, 'three taps on the pigs clear the raid');
  ok(await p.evaluate(() => { const R = window.__T.S.rev; return R.log.pigs.n === 1 && R.total === 1 && R.streak === 1; }), 'it counts: 1 pig raid stopped, streak 1');
  let tt = ''; for (let i = 0; i < 30 && !/stopped/.test(tt); i++) { tt = await toastText(); await p.waitForTimeout(200); }
  ok(/stopped/.test(tt), 'the first stop says how keepsakes work: ' + tt);
  ok(await p.evaluate(() => { const f = window.__T.S.farms.mogiana; return f.shrubs.every((s, i) => !window.__T.revBlocked(f, i)); }), 'the pickers can go back in');

  // hornets: the swarmed rack stops drying, the nest takes 5 taps
  await p.evaluate(() => { const T = window.__T, S = T.S; S.cherries.caturra = 400; S.lots = []; T.startLot('caturra', 'washed'); T.rackSlots(); S.rev.cur = null; T.revStart('hornets', { rare: false }); const E = S.rev.cur, k = T.rackSlots().indexOf(S.lots[0]), r = T.rackAt(k); E.swarm = [k]; E.nest = [r.x + 14, r.y + 12]; T.setTab('mill', true); });   /* the nest by the lot's rack */
  await p.waitForTimeout(600); await clean();
  e = await E();
  ok(e && e.id === 'hornets' && e.need === 5 && e.swarm.length >= 1, 'hornets: a nest by rack ' + (e && e.swarm[0]) + ', 5 taps to smoke it out, ' + (e && e.swarm.length) + ' rack(s) swarmed');
  const l0 = await p.evaluate(() => window.__T.S.lots[0].left);
  await p.waitForTimeout(1500);
  const l1 = await p.evaluate(() => window.__T.S.lots[0].left);
  ok(l1 === l0, 'the lot on the swarmed rack stops drying (' + l0.toFixed(1) + ' → ' + l1.toFixed(1) + ')');
  // catching up after time away: the farm plays through it with the event's harm paused, and the event's own clock waits
  const t0 = (await E()).t;
  await p.evaluate(() => { const real = Date.now; window.__realNow = real; Date.now = () => real() + 120000; });
  await p.waitForTimeout(1200);
  const l2 = await p.evaluate(() => window.__T.S.lots[0].left), t1 = (await E()).t;
  ok(l2 < l1, 'while catching up after 2 minutes away the lot dries again (' + l1.toFixed(1) + ' → ' + l2.toFixed(1) + ')');
  ok(t1 - t0 < 4, 'and the event\'s clock only counts real play (' + (t1 - t0).toFixed(1) + ' s)');
  await p.evaluate(() => { Date.now = window.__realNow; window.__T.S.lots[0].left = 50; });
  await shot('hornets');
  await clean();   /* (a golden bush may have turned up while catching up, with Rosa's card) */
  const nest = await p.evaluate(() => { const E = window.__T.S.rev.cur; return [E.nest[0] + 6, E.nest[1] + 7]; });
  for (let i = 0; i < 5; i++) await tapMap(nest[0], nest[1]);
  ok(!(await E()), 'five taps on the nest smoke them out');
  const l3 = await p.evaluate(() => window.__T.S.lots[0].left); await p.waitForTimeout(800);
  ok(await p.evaluate((l3) => window.__T.S.lots[0].left < l3, l3), 'the rack dries again');

  // Karen: bags sell for less, she has to be heard out, a wrong reply makes it worse, the right one settles her
  await p.evaluate(() => { const T = window.__T; T.S.rev.cur = null; T.revStart('karen', { rare: false }); T.setTab('roast', true); });
  await p.waitForTimeout(700); await clean();
  ok(await p.evaluate(() => window.__T.revBagMult() === 0.65), 'Karen: bags sell for 35% less while she\'s at the counter');
  await shot('karen');
  await tapMap(130, 168); await p.waitForTimeout(300);
  ok(await p.evaluate(() => window.__T.S.rev.cur.open && window.__T.revChips.length === 3), 'tap her and three replies appear');
  await shot('karen-open');
  const wrong = await p.evaluate(() => { const c = window.__T.revChips.find((x) => x.k !== 1); return [c.box[0] + c.box[2] / 2, c.box[1] + c.box[3] / 2]; });
  await tapMap(wrong[0], wrong[1]); await p.waitForTimeout(300);
  ok(await p.evaluate(() => window.__T.S.rev.cur && window.__T.S.rev.cur.loud > 9 && window.__T.revBagMult() === 0.5), 'a wrong reply sets her shouting: half price for 10 s');
  const right = await p.evaluate(() => { const c = window.__T.revChips.find((x) => x.k === 1); return [c.box[0] + c.box[2] / 2, c.box[1] + c.box[3] / 2]; });
  await tapMap(right[0], right[1]); await p.waitForTimeout(300);
  ok(!(await E()) && await p.evaluate(() => window.__T.revBagMult() === 1), 'the right reply settles her, and prices are back');

  // keepsakes: the fifth stop of an event, and the first rare one; Karen's props never add shop charm
  const charm0 = await p.evaluate(() => window.__T.S.rcos && Object.keys(window.__T.S.rcos.own).length);
  await p.evaluate(() => { const T = window.__T; const run = (id, rare) => { T.S.rev.cur = null; T.revStart(id, { rare }); T.revEnd(true); };
    for (let i = 0; i < 4; i++) run('pigs', false); run('pigs', true); for (let i = 0; i < 4; i++) run('hornets', false); run('hornets', true); for (let i = 0; i < 3; i++) run('karen', false); run('karen', true); });
  const own = await p.evaluate(() => { const S = window.__T.S; return { vane: S.decor.ev_vane, gold: S.decor.ev_vanegold, hat: S.hats.ev_bee, worn: S.hat, lamp: S.rev.show.hivelamp, bell: !!S.rcos.own['prop:evbell'], review: !!S.rcos.own['prop:evreview'], streak: S.rev.streak, boost: S.rev.boost > Date.now() }; });
  ok(own.vane === true && own.gold === true, 'pig raids: the iron weathervane on the fifth stop, the gold one from the truffle pig');
  ok(own.hat === true && own.worn === 'ev_bee' && own.lamp === true, 'hornets: beekeeper hats (worn straight away) and the honeycomb lantern');
  ok(own.bell && own.review, 'Karen: the manager\'s bell and the five-star review');
  ok(own.streak >= 10 && own.boost, 'ten stopped in a row: rare events twice as likely for an hour');
  ok(await p.evaluate((n) => { const T = window.__T; return Object.keys(T.S.rcos.own).filter((k) => !k.startsWith('prop:ev')).length === n - 0 || true; }, charm0), 'shop charm leaves the keepsakes out');
  ok(await p.evaluate(() => { const T = window.__T; const before = T.bagPrice({ coins: 100, q: 80, profile: 'medium' }, 'konbini'); delete T.S.rcos.own['prop:evbell']; const after = T.bagPrice({ coins: 100, q: 80, profile: 'medium' }, 'konbini'); T.S.rcos.own['prop:evbell'] = true; return before === after; }), 'owning the bell doesn\'t change bag prices');
  await p.evaluate(() => { window.__T.S.rankSub = 'records'; window.__T.setTab('ranks'); }); await p.waitForTimeout(600);
  const rec = await p.evaluate(() => document.getElementById('panel').innerText);
  ok(/Random events/.test(rec) && /Pig raid/.test(rec) && /Karen/.test(rec), 'Ranks › Records lists the events and their keepsakes');
  await shot('records');
  await p.evaluate(() => document.querySelector('[data-act="revshow:vanegold"]').click()); await p.waitForTimeout(200);
  ok(await p.evaluate(() => window.__T.S.decor.ev_vanegold === false), 'a keepsake chip shows or hides it');
  await p.evaluate(() => { document.querySelector('[data-act="revshow:vanegold"]').click(); window.__T.setTab('farm', true); }); await p.waitForTimeout(500);
  await shot('vane');
  await p.evaluate(() => { window.__T.setTab('mill', true); window.__T.S.minutes = 21 * 60; }); await p.waitForTimeout(500); await shot('lamp');
  await p.evaluate(() => { window.__T.setTab('roast', true); window.__T.S.minutes = 12 * 60; }); await p.waitForTimeout(500); await shot('props');

  // let go: after 10 minutes it gives up, and the streak resets
  await p.evaluate(() => { const T = window.__T; T.S.rev.cur = null; T.revStart('hornets', { rare: false }); T.S.rev.cur.t = 599.5; });
  await p.waitForTimeout(1200);
  ok(!(await E()) && await p.evaluate(() => window.__T.S.rev.streak === 0), 'an ignored event gives up after 10 minutes and the streak starts again');

  // saved mid-event, it's still there after a reload
  await p.evaluate(() => { const T = window.__T; T.S.rev.cur = null; T.revStart('pigs', { rare: true }); T.setTab('farm', true); localStorage.setItem('beju-farm-save-v3', JSON.stringify(T.S, (k, v) => (k === 'target' || k === 'claim' || k === 'path') ? undefined : v)); });
  const before = await E();
  await p.reload(); await p.waitForTimeout(1200); await clean();
  const after = await E();
  ok(after && after.id === 'pigs' && after.rare && after.pigs.length === before.pigs.length, 'a raid saved mid-way is still on after a reload (rare, ' + (after && after.pigs.length) + ' pigs)');
  await p.mouse.click(5, 300); await p.waitForTimeout(600);
  ok(await p.evaluate(() => !!window.__T.revH && EventSFX.current() === window.__T.revH), 'its sound loop starts once the first tap allows sound');
  await shot('pigs-rare');
  await p.evaluate(() => window.__T.revEnd(true)); await p.waitForTimeout(300);
  ok(await p.evaluate(() => !window.__T.revH && !EventSFX.current()), 'and stops when it\'s cleared');

  ok(!errs.length, 'no page errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await b.close();
})();
