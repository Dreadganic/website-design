/* The roastery counter end to end, in the real game: unlocking, the board, opening by the sign, serving with real taps on the map, a wrong
   roast, walk-outs and closing early, the tally and the 30-minute wait, Sell all keeping the board's bags, the head roaster and foreman,
   events during service (Karen more often, the rest waiting), the pause while away, prestige, regulars, tasks and stars, and the Ranks
   and Looks changes that came with it (the counter board, rows without prestige numbers, the crest always the highest).
   node counter_e2e.js <test.html from mktest.py> [shots dir] */
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
const file = path.resolve(process.argv[2]), shots = process.argv[3] || ''; if (shots) fs.mkdirSync(shots, { recursive: true });
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m); } };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const g = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true }); const errs = []; g.on('pageerror', (e) => errs.push(e.message));
  await g.addInitScript(() => { try { if (!sessionStorage.getItem('keep')) localStorage.clear(); } catch (e) {} });
  await g.goto('file://' + file); await g.waitForTimeout(800);
  const E = (f, a) => g.evaluate(f, a);
  const clean = () => E(() => { const T = window.__T; (T.modalQueue || []).length = 0; for (let i = 0; i < 8; i++) T.closeModal(); document.getElementById('modal').hidden = true; document.getElementById('toast').hidden = true; T.S.nav = null; T.S.navSeen = new Proxy({}, { get: () => true }); });
  const setup = (rep) => E((rep) => { const T = window.__T, S = T.S; S.name = S.nameOk = 'Tess'; S.guide = T.GUIDE.length; S.prestige = 2; S.pwalkDone = true; Object.keys(S.tabs).forEach((k) => { S.tabs[k] = true; }); S.roastery.tip = true; S.roastery.rep = T.REP_AT(rep); S.rev.cur = null; T.revSess = 0;
    const R = S.roastery; R.roasters = []; R.beans = { 'caturra.washed': { kg: 600, coins: 90000, pts: 3000, cup: 86 }, 'yellowbourbon.natural': { kg: 500, coins: 120000, pts: 4000, cup: 88 } }; R.bags = []; S.lots = [];
    S.counter = { rating: 3, served: 0, season: S.season.key, sServed: 0, regs: {}, pre: null, next: 0, sess: null, tally: null }; }, rep);
  const bag = (key, profile, n, cup) => E(([key, profile, n, cup]) => { for (let i = 0; i < n; i++) window.__T.S.roastery.bags.push({ key, profile, kg: 160, coins: 24000, pts: 800, q: 70, cup: cup || 86 }); }, [key, profile, n, cup]);
  const tick = (sec) => E((sec) => { const T = window.__T; for (let i = 0; i < sec * 10; i++) T.counterTick(0.1); }, sec);
  const tapMap = async (x, y) => { await clean(); const p = await E(([x, y]) => { const r = document.getElementById('cv').getBoundingClientRect(), k = r.width / 192; return [r.left + x * k, r.top + y * k]; }, [x, y]); await g.mouse.click(p[0], p[1]); await g.waitForTimeout(120); };
  const toRoast = async () => { await E(() => window.__T.setTab('roast', true)); await g.waitForTimeout(500); await clean(); };
  const walkers = async () => { await g.waitForTimeout(9500); await clean(); await g.waitForTimeout(100); };
  const custPt = (i) => E((i) => { const T = window.__T, c = T.S.counter.sess.q[i], w = T.IN.roast.ct[c.id]; return [w.x, w.y - 10]; }, i);

  /* locked until reputation 5 */
  await setup(4); for (let k = 0; k < 3; k++) { await clean(); await g.waitForTimeout(150); }
  await E(() => { const T = window.__T; T.counterTick(0.1); T.setTab('roast'); T.renderPanel(); });
  ok(!(await E(() => window.__T.ctOn())), 'locked below reputation 5');
  ok(!(await E(() => !!document.querySelector('[data-act="roastsub:counter"]'))), 'no Counter sub-tab while locked');
  ok(!(await E(() => (window.__T.TASK_KINDS || {}).serve && window.__T.TASK_KINDS.serve.ok())), 'no counter dailies while locked');

  /* the board */
  await setup(7); await E(() => window.__T.counterTick(0.1));
  const pre = await E(() => window.__T.S.counter.pre);
  ok(pre.length === 3, 'three pre-orders at 3 stars: ' + pre.length);
  ok(new Set(pre.map((p) => p.who)).size === pre.length, 'no shop twice on one board');
  ok(new Set(pre.map((p) => p.key)).size <= 4, 'never more coffees than the four bins');
  ok(pre.every((p) => p.n >= 2 && p.n <= 4), 'pre-orders of 2 to 4 bags below reputation 12');
  ok(pre.every((p) => ['light', 'medium', 'dark'].includes(p.profile)), 'each asks for a roast');
  await E(() => { const T = window.__T; T.S.counter.rating = 1.4; T.ctBoard(); }); ok((await E(() => window.__T.S.counter.pre.length)) === 2, 'two at a poor rating');
  await E(() => { const T = window.__T; T.S.counter.rating = 4.8; T.ctBoard(); }); ok((await E(() => window.__T.S.counter.pre.length)) === 4, 'four at five stars');
  await E(() => { const T = window.__T, S = T.S; S.roastery.rep = T.REP_AT(15); S.counter.rating = 3; T.ctBoard(); }); ok((await E(() => window.__T.S.counter.pre.every((p) => p.n >= 4 && p.n <= 6))), '4 to 6 bags from reputation 15');

  /* the page before a session */
  await setup(7); await E(() => { const T = window.__T; T.counterTick(0.1); T.S.roastSub = 'counter'; T.setTab('roast'); T.renderPanel(); }); await g.waitForTimeout(300); await clean();
  ok(await E(() => !!document.querySelector('[data-act="ctopen"]:not([disabled])')), 'Open the counter on the page');
  ok(await E(() => document.querySelectorAll('#panel .row').length >= 3), 'the board listed on the page');
  ok(await E(() => /Counter ready/.test(document.getElementById('panel').innerText)), 'Counter ready');
  if (shots) await g.screenshot({ path: path.join(shots, 'page_ready.png') });

  /* can't open during the power cut */
  await E(() => window.__T.revStart('power', { force: true }));
  ok(!(await E(() => window.__T.ctCanOpen())), 'can\'t open during a roastery event');
  await E(() => window.__T.revEnd(true));

  /* open with the sign, on the map */
  await toRoast(); if (shots) await g.screenshot({ path: path.join(shots, 'map_ready.png') });
  const sg = await E(() => window.__T.CT_SIGN); await tapMap(sg[0] + 10, sg[1] + 9);
  ok(await E(() => window.__T.ctOpen()), 'the sign opens the counter');
  ok(await E(() => window.__T.S.counter.pre.every((p) => p.state === 'board')), 'pre-orders wait to arrive');

  /* events during service: the roastery's wait, Karen has her own roll */
  const evs = await E(() => { const T = window.__T, seen = new Set(); for (let i = 0; i < 300; i++) { T.S.rev.cur = null; if (T.revStart()) seen.add(T.S.rev.cur.id); } T.S.rev.cur = null; return [...seen]; });
  ok(!evs.some((k) => ['karen', 'power', 'fire', 'typhoon'].includes(k)), 'no roastery event or typhoon from the usual roll while open: ' + evs.join(','));

  /* the pre-orders arrive in the first two minutes; walk-ins come */
  await E(() => { const T = window.__T, S = T.S, pre = S.counter.pre; S.roastery.bags = []; pre.forEach((p) => { for (let i = 0; i < p.n; i++) S.roastery.bags.push({ key: p.key, profile: p.profile, kg: 160, coins: 24000, pts: 800, q: 70, cup: 88 }); }); });
  await E(() => { const s = window.__T.S.counter.sess; s.walkT = 999; s.karenT = 9999; });
  await tick(115);
  ok((await E(() => window.__T.S.counter.sess.q.filter((c) => c.kind === 'pre').length)) === 3, 'all three pre-orders in the queue by 2 minutes');
  ok(await E(() => window.__T.S.counter.pre.every((p) => p.state === 'queue')), 'the board marks them arrived');
  ok((await E(() => window.__T.ctKept())) >= 6, 'Sell all keeps the board\'s bags: ' + (await E(() => window.__T.ctKept())));
  await walkers(); if (shots) await g.screenshot({ path: path.join(shots, 'map_open.png') });

  /* serve the first with a real tap */
  const before = await E(() => { const T = window.__T, S = T.S, c = S.counter.sess.q[0], b = S.roastery.bags.find((x) => x.key === c.key && x.profile === c.profile); return { coins: S.coins, rep: S.roastery.rep, rating: S.counter.rating, n: c.n, want: Math.round(2 * T.bagPrice(b, Object.keys({ cafe: 1, kissa: 1, konbini: 1 }).reduce((x, k) => (T.bagPrice(b, k) > T.bagPrice(b, x) ? k : x), 'konbini')) * Math.min(1.6, 1 + 0.08 * (88 - 85))) }; });
  const p0 = await custPt(0); await tapMap(p0[0], p0[1]);
  const after = await E(() => { const S = window.__T.S; return { coins: S.coins, rep: S.roastery.rep, rating: S.counter.rating, served: S.counter.sess.served, q: S.counter.sess.q.length }; });
  ok(after.served === 1, 'a tap serves the customer: ' + after.served);
  ok(Math.abs((after.coins - before.coins) - before.want * before.n) <= before.want * before.n * 0.01, 'pays 2× the best buyer × cup (a level-up from the know-how may add a little): ' + (after.coins - before.coins) + ' vs ' + before.want * before.n);
  ok(Math.abs(after.rating - (before.rating + 0.03)) < 1e-6, 'the rating rises 0.03');
  ok(after.rep > before.rep, 'reputation rises');

  /* a wrong roast takes a second tap */
  await E(() => { const T = window.__T, S = T.S, s = S.counter.sess; s.q.push({ id: 'wtest', kind: 'walk', look: 'cafe', who: 'Walk-in', key: 'caturra.washed', profile: 'light', n: 1, got: 0, pat: 90, patMax: 90 }); S.roastery.bags = S.roastery.bags.filter((b) => !(b.key === 'caturra.washed' && b.profile === 'light')); S.roastery.bags.push({ key: 'caturra.washed', profile: 'dark', kg: 160, coins: 24000, pts: 800, q: 70, cup: 86 }); });
  await E(() => { const s = window.__T.S.counter.sess, i = s.q.findIndex((c) => c.id === 'wtest'), c = s.q.splice(i, 1)[0]; s.q.unshift(c); });
  await walkers();
  const wp = await custPt(0), s1 = await E(() => window.__T.S.counter.sess.served);
  await tapMap(wp[0], wp[1]); ok((await E(() => window.__T.S.counter.sess.served)) === s1, 'one tap doesn\'t give a wrong roast');
  const c0 = await E(() => window.__T.S.coins); await tapMap(wp[0], wp[1]);
  ok((await E(() => window.__T.S.counter.sess.served)) === s1 + 1, 'a second tap gives the wrong roast');
  const wpay = await E(() => window.__T.S.coins) - c0; ok(wpay > 0, 'and it still pays: ' + wpay);

  /* Karen: blocks serving, settled counts as served */
  await E(() => { const T = window.__T; T.S.rev.cur = null; T.revStart('karen', { rare: false }); T.S.rev.cur.counter = true; });
  const kq = await E(() => window.__T.S.counter.sess.q.length);
  const ks = await E(() => window.__T.ctServe(window.__T.S.counter.sess.q[0].id)); ok(!ks, 'nobody is served while Karen holds up the queue');
  const r0 = await E(() => window.__T.S.counter.rating); await E(() => window.__T.revEnd(true));
  ok(Math.abs((await E(() => window.__T.S.counter.rating)) - r0 - 0.03) < 1e-6, 'settling Karen counts as a customer served');
  /* Karen's roll: once a session, 15% a minute */
  const kr = await E(() => { const T = window.__T, s = T.S.counter.sess; let n = 0; for (let k = 0; k < 200; k++) { s.karen = false; s.karenT = 0; T.S.rev.cur = null; T.counterTick(0.01); if (T.S.rev.cur && T.S.rev.cur.id === 'karen') { n++; T.S.rev.cur = null; } } s.karen = true; return n; });
  ok(kr > 10 && kr < 60, 'Karen\'s own roll comes about 15% of minutes: ' + kr + '/200');

  /* the pause: catching up after time away doesn't move the session */
  const t0 = await E(() => window.__T.S.counter.sess.t); await E(() => { window.__T.away(0.5); }); await clean();
  ok(Math.abs((await E(() => window.__T.S.counter.sess.t)) - t0) < 1, 'time away doesn\'t run the session clock');

  /* reload mid-session keeps it */
  await E(() => { sessionStorage.setItem('keep', '1'); const T = window.__T; T.act('noop'); }); await E(() => { window.dispatchEvent(new Event('pagehide')); });
  await E(() => { const S = window.__T.S; localStorage.setItem('beju-farm-save-v3', JSON.stringify(S, (k, v) => (k === 'target' || k === 'claim' || k === 'path') ? undefined : v)); });
  await g.reload(); await g.waitForTimeout(900); await clean();
  ok(await E(() => window.__T.ctOpen()), 'a reload keeps the session open');
  ok((await E(() => window.__T.S.counter.sess.q.length)) > 0, 'with its queue');
  await E(() => sessionStorage.removeItem('keep'));

  /* walk-outs: three close early, the tally, the wait */
  await E(() => { const T = window.__T, s = T.S.counter.sess; s.out = 0; s.served = 0; T.S.roastery.bags = []; s.q.forEach((c) => { c.pat = 1; }); while (s.q.length < 3) T.ctWalkIn(); s.q.forEach((c) => { c.pat = 1; }); });
  const rb = await E(() => window.__T.S.counter.rating);
  await tick(2);
  ok(!(await E(() => window.__T.ctOpen())), 'three walk-outs close the counter early');
  const ta = await E(() => window.__T.S.counter.tally); ok(ta && ta.out >= 3, 'the tally counts the walk-outs');
  ok((await E(() => window.__T.S.counter.rating)) <= rb - 0.59, 'each walk-out takes 0.2 stars');
  ok((await E(() => window.__T.S.counter.next - Date.now())) > 29 * 60e3, 'it opens again 30 minutes later');
  ok(!(await E(() => window.__T.ctCanOpen())), 'and not before');
  ok((await E(() => window.__T.S.counter.pre.length)) >= 2, 'a new board is up');
  await E(() => { const T = window.__T; T.S.roastSub = 'counter'; T.setTab('roast'); T.renderPanel(); }); await g.waitForTimeout(300); await clean();
  ok(await E(() => /opens in/i.test(document.getElementById('panel').innerText)), 'the page counts down');
  if (shots) await g.screenshot({ path: path.join(shots, 'page_closed.png') });

  /* a clean session pays a season star and the clean daily */
  await setup(7); await E(() => { const T = window.__T, S = T.S; T.counterTick(0.1); S.tasks = [{ id: 'clean', text: 'x', goal: 1, have: 0, reward: { coins: 1 }, slot: 2 }, { id: 'serve', text: 'x', goal: 8, have: 0, reward: { coins: 1 }, slot: 2 }, { id: 'preorder', text: 'x', goal: 3, have: 0, reward: { coins: 1 }, slot: 2 }]; S.season.caps = {}; });
  const st0 = await E(() => window.__T.S.season.stars);
  await E(() => { const T = window.__T, S = T.S; T.ctOpenNow(); S.counter.sess.walkT = 999; S.counter.sess.karenT = 9999; S.counter.pre.forEach((p) => { for (let i = 0; i < p.n; i++) S.roastery.bags.push({ key: p.key, profile: p.profile, kg: 160, coins: 24000, pts: 800, q: 70, cup: 86 }); }); });
  await tick(115); await E(() => { const T = window.__T; T.S.counter.sess.q.slice().forEach((c) => T.ctServe(c.id)); });
  await tick(250);
  ok(!(await E(() => window.__T.ctOpen())), 'closes at six minutes');
  ok((await E(() => window.__T.S.season.stars)) === st0 + 1, 'a clean session: +1 season star');
  ok(await E(() => window.__T.S.tasks.find((t) => t.id === 'clean').have === 1), 'the clean-session daily counts');
  ok(await E(() => window.__T.S.tasks.find((t) => t.id === 'preorder').have === 3), 'the pre-order daily counts');
  ok(await E(() => window.__T.S.tasks.find((t) => t.id === 'serve').have === 3), 'the serve daily counts');
  ok((await E(() => window.__T.S.counter.sServed)) === 3, 'this season\'s customers counted');

  /* the head roaster roasts for the board while it's open */
  await setup(10); await E(() => { const T = window.__T, S = T.S; S.staff.roaster = true; S.roasterOff = false; T.counterTick(0.1); S.counter.pre = [{ id: 'hx', kind: 'pre', look: 'kissa', who: 'Kissa Mado', key: 'caturra.washed', profile: 'dark', n: 2, got: 0, state: 'board' }]; T.ctOpenNow(); T.headRoasterTick(false); });
  ok(await E(() => window.__T.S.roastery.roasters.some((r) => r.auto && r.key === 'caturra.washed' && r.profile === 'dark')), 'the head roaster roasts the board\'s coffee at its roast');
  await E(() => window.__T.ctClose('', true));

  /* the foreman fills the board's coffee first, in its process */
  await setup(7); await E(() => { const T = window.__T, S = T.S; S.staff.foreman = true; S.methods.natural = true; S.methods.washed = true; S.lots = []; S.cherries = { caturra: 2000, yellowbourbon: 300 }; S.roastery.beans = {}; S.counter.pre = [{ id: 'fx', kind: 'pre', look: 'kissa', who: 'Kissa Mado', key: 'yellowbourbon.natural', profile: 'dark', n: 2, got: 0, state: 'board' }]; T.staffTick(); });
  ok(await E(() => window.__T.S.lots.some((l) => l.v === 'yellowbourbon' && l.method === 'natural')), 'the foreman starts the board\'s coffee in its process');

  /* once the counter is unlocked the foreman always leaves one rack for you; before, he fills them all */
  const fill = (rep) => E((rep) => { const T = window.__T, S = T.S; S.roastery.rep = T.REP_AT(rep); S.lv.racks = 6; S.staff.foreman = true; S.request = null; S.lots = []; S.counter.pre = []; S.cherries = { caturra: 99999 }; S.roastery.beans = {}; for (let k = 0; k < 6; k++) { S.minutesTotal += 999; T.staffTick(); } return [S.lots.length, T.racks()]; }, rep);
  await setup(7); const [n7, r7] = await fill(7); ok(r7 > 1 && n7 === r7 - 1, 'counter unlocked: the foreman leaves one rack free (' + n7 + ' of ' + r7 + ')');
  await setup(4); const [n4, r4] = await fill(4); ok(n4 === r4, 'counter locked: he fills every rack (' + n4 + ' of ' + r4 + ')');
  await setup(7); const [nq, rq] = await E(() => { const T = window.__T, S = T.S; S.lv.racks = 6; S.staff.foreman = true; S.lots = []; S.counter.pre = []; S.cherries = { caturra: 99999 }; S.request = { v: 'geisha', m: 'washed', who: 'Kenji at Kissa Hoshi, Kyoto' }; for (let k = 0; k < 6; k++) { S.minutesTotal += 999; T.staffTick(); } S.request = null; return [S.lots.length, T.racks()]; });
  ok(nq === rq - 1, 'a lot request and the counter share the one free rack (' + nq + ' of ' + rq + ')');
  await E(() => { const T = window.__T; T.setTab('mill'); T.renderPanel(); }); await g.waitForTimeout(200); await clean();
  ok(await E(() => /leaves one rack free for you/.test(document.getElementById('panel').innerText)), 'the Mill page says so');

  /* a pre-order with nothing on hand: Request asks the foreman, whose next lot of it goes to a roastery bin */
  const reqSetup = (foreman) => E((foreman) => { const T = window.__T, S = T.S; S.lv.racks = 6; S.staff.foreman = foreman; S.staff.roaster = false; S.methods.natural = true; S.lots = []; S.roastery.beans = {}; S.roastery.bags = []; S.roastery.want = {}; S.cherries = { yellowbourbon: 400, caturra: 3000 };
    S.counter.sess = null; S.counter.pre = [{ id: 'rq', kind: 'pre', look: 'kissa', who: 'Kissa Mado', key: 'yellowbourbon.natural', profile: 'dark', n: 2, got: 0, state: 'board' }]; S.roastSub = 'counter'; T.setTab('roast'); T.renderPanel(); }, foreman);
  await setup(7); await reqSetup(false); await g.waitForTimeout(200); await clean();
  ok(await E(() => !!document.querySelector('[data-act="tab:mill"]') && !document.querySelector('[data-act^="ctreq:"]')), 'no foreman yet: the card sends you to the Mill');
  await reqSetup(true); await g.waitForTimeout(200); await clean();
  ok(await E(() => !!document.querySelector('[data-act="ctreq:yellowbourbon.natural"]')), 'with a foreman: a Request button instead');
  await E(() => { const T = window.__T, S = T.S; S.cherries = { caturra: 99999 }; for (let k = 0; k < 4; k++) { S.minutesTotal += 999; T.staffTick(); } S.cherries.yellowbourbon = 400; T.renderPanel(); }); await g.waitForTimeout(150); await clean();
  ok(await E(() => window.__T.S.lots.length === window.__T.racks() - 1), 'the foreman has filled all but the rack he keeps free');
  await g.click('[data-act="ctreq:yellowbourbon.natural"]'); await g.waitForTimeout(200);
  ok(await E(() => window.__T.S.roastery.want['yellowbourbon.natural'] === true), 'Request asks for it');
  await E(() => { const T = window.__T; T.renderPanel(); }); await g.waitForTimeout(150);
  ok(await E(() => /Requested/.test(document.getElementById('panel').innerText)), 'the card says Requested');
  await E(() => { const T = window.__T, S = T.S; for (let k = 0; k < 4; k++) { S.minutesTotal += 999; T.staffTick(); } });
  ok(await E(() => window.__T.S.lots.some((l) => l.v === 'yellowbourbon' && l.method === 'natural')), 'the foreman starts a lot of it, in its process');
  ok(await E(() => window.__T.S.lots.length === window.__T.racks()), 'the request may use the rack he keeps free');
  await E(() => { const T = window.__T, S = T.S; S.lots.forEach((l) => { if (l.v === 'yellowbourbon') l.left = 0; }); T.act('noop'); T.roasteryTick(); });
  await E(() => { const T = window.__T; for (let i = 0; i < 3; i++) T.counterTick(0.1); }); await g.waitForTimeout(600);
  ok(await E(() => !!window.__T.S.roastery.beans['yellowbourbon.natural'] && !window.__T.S.roastery.want['yellowbourbon.natural']), 'once dry it goes to a roastery bin');
  /* the head roaster asks for the board's coffees himself at reputation 20 */
  const headReq = (rep) => E((rep) => { const T = window.__T, S = T.S; S.roastery.rep = T.REP_AT(rep); S.staff.roaster = true; S.roasterOff = false; S.staff.foreman = true; S.lots = []; S.roastery.beans = {}; S.roastery.bags = []; S.roastery.want = {}; S.roastery.roasters = [];
    S.counter.pre = [{ id: 'hq', kind: 'pre', look: 'kissa', who: 'Kissa Mado', key: 'yellowbourbon.natural', profile: 'dark', n: 2, got: 0, state: 'board' }]; T.headRoasterTick(false); return S.roastery.want['yellowbourbon.natural'] || null; }, rep);
  ok((await headReq(19)) === null, 'below reputation 20 the head roaster leaves it to you');
  ok((await headReq(20)) === 'head', 'at 20 he requests the board\'s coffee from the foreman');
  await E(() => { const T = window.__T, S = T.S; S.counter.pre = []; T.headRoasterTick(false); });
  ok(await E(() => !window.__T.S.roastery.want['yellowbourbon.natural']), 'and lets it go once the board no longer needs it');
  await E(() => { const S = window.__T.S; S.staff.roaster = false; S.roastery.want = {}; });

  /* regulars from four stars; ten visits put a mug on the table; all five give the title */
  await setup(7); await E(() => { const T = window.__T, S = T.S; T.counterTick(0.1); S.counter.rating = 4.5; S.counter.regs = { kenji: { n: 9 }, aya: { n: 10 }, tanaka: { n: 10 }, mika: { n: 10 }, sora: { n: 10 } }; T.ctOpenNow(); });
  const reg = await E(() => { const T = window.__T, s = T.S.counter.sess; for (let k = 0; k < 80 && !s.q.some((c) => c.reg); k++) { s.q = s.q.filter((c) => c.reg); T.ctWalkIn(); } return s.q.find((c) => c.reg) || null; });
  ok(reg && reg.n === 2, 'a regular comes at four stars, for two bags of their favourite');
  if (reg) { await E((r) => { const T = window.__T, S = T.S, s = S.counter.sess; s.q = s.q.filter((c) => c.reg === r.reg); S.counter.regs = { kenji: { n: 9, key: r.key, profile: r.profile }, aya: { n: 10 }, tanaka: { n: 10 }, mika: { n: 10 }, sora: { n: 10 } }; s.q[0].reg = 'kenji'; for (let i = 0; i < 2; i++) S.roastery.bags.push({ key: r.key, profile: r.profile, kg: 160, coins: 24000, pts: 800, q: 70, cup: 86 }); T.ctServe(s.q[0].id); }, reg);
    ok((await E(() => window.__T.S.counter.regs.kenji.n)) === 10, 'their visit counts');
    ok(await E(() => !!window.__T.S.sitems.title['ct:nbr']), 'all five regulars: the Neighbourhood roaster title'); }
  await E(() => window.__T.ctClose('', true));

  /* prestige closes it with no penalty */
  await setup(7); await E(() => { const T = window.__T, S = T.S; T.counterTick(0.1); T.ctOpenNow(); S.counter.rating = 3.7; S.xp = T.XP_AT(T.prestigeNeed() + 1); T.prestige(); });
  ok(!(await E(() => window.__T.ctOpen())), 'a prestige closes the counter');
  ok((await E(() => window.__T.S.counter.rating)) === 3.7, 'and keeps the rating');
  await clean();

  /* Ranks: the boards, rows without prestige numbers, the counter stars */
  await setup(7); await E(() => { const T = window.__T, S = T.S; S.counter.sServed = 40; S.counter.rating = 3.4; S.rankSub = 'board'; S.rankTab = 'counter'; T.setTab('ranks'); T.renderPanel(); }); await g.waitForTimeout(300); await clean();
  const tabs = await E(() => [...document.querySelectorAll('[data-act^="ranktab:"]')].map((x) => x.textContent));
  ok(JSON.stringify(tabs) === JSON.stringify(['All time', 'This season', 'Counter', 'Hall']), 'boards in order: ' + tabs.join(', '));
  ok(await E(() => new Set([...document.querySelectorAll('[data-act^="ranktab:"]')].map((x) => Math.round(x.getBoundingClientRect().top))).size === 1), 'the four boards fit on one row');
  ok(await E(() => document.querySelectorAll('.lb-row .crate').length >= 5), 'counter stars on the rows');
  const txt = await E(() => [...document.querySelectorAll('.lb-row')].map((r) => r.innerText).join('|'));
  ok(!/\bP\d\b|\bkh\b|this season\)|Silver Leaf|Bronze Bean|Gold Cherry|Seedling/.test(txt), 'rows without prestige numbers, know-how or crest names');
  ok(/served/.test(txt), 'the counter board ranks customers served');
  if (shots) await g.screenshot({ path: path.join(shots, 'ranks_counter.png') });
  await E(() => { const T = window.__T; T.S.rankTab = 'season'; T.renderPanel(); }); await g.waitForTimeout(200);
  ok(await E(() => !/Prestige \d/.test(document.querySelector('.me').innerText)), 'your card without the prestige number');
  ok(await E(() => /served/.test(document.querySelector('.me').innerText)), 'your card with the counter');
  if (shots) await g.screenshot({ path: path.join(shots, 'ranks_season.png') });

  /* Looks: the crest follows the prestige */
  await E(() => { const T = window.__T, S = T.S; S.look.crest = 0; T.act('crest:0'); T.setTab('looks'); T.renderPanel(); }); await g.waitForTimeout(300); await clean();
  ok((await E(() => window.__T.S.look.crest)) === 2, 'a crest can\'t be swapped for an older one');
  ok(await E(() => !document.querySelector('[data-act^="crest:"]')), 'no crest picker in Looks');
  ok(await E(() => !!document.querySelector('.crestl.now')), 'the ladder marks your crest');

  console.log(pass + ' passed, ' + fail + ' failed' + (errs.length ? ' · page errors: ' + errs.slice(0, 4).join(' | ') : ''));
  if (fail || errs.length) process.exitCode = 1;
  await b.close();
})();
