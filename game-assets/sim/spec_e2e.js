/* specialties: a focus per run from prestige 3. node spec_e2e.js <test.html from mktest.py> */
const { chromium } = require('playwright'); const path = require('path');
const file = path.resolve(process.argv[2]); let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('PASS ' + m); } else { fail++; console.log('FAIL ' + m); } };
(async () => { const b = await chromium.launch(); const g = await b.newPage({ viewport: { width: 390, height: 844 } }); const errs = []; g.on('pageerror', (e) => errs.push(e.message));
  await g.goto('file://' + file); await g.waitForTimeout(800);
  const E = (f, a) => g.evaluate(f, a);
  await E(() => { const T = window.__T, S = T.S; S.guide = T.GUIDE.length; Object.keys(S.tabs).forEach((k) => { S.tabs[k] = true; }); for (let i = 0; i < 12; i++) T.closeModal(); });
  const r = await E(() => { const T = window.__T, S = T.S, o = {};
    S.prestige = 2; delete S.spec; T.act('specpick:grow'); o.early = !S.spec;   /* not before prestige 3 */
    S.prestige = 3; T.act('specpick:wander');
    o.wander = T.nativeKg2('huila', 'geisha') === 1 && T.nativeKg2('turrialba', 'geisha') === 1.3;
    o.oneSwap = !S.spec.swap; T.act('specpick:grow'); o.swap = T.specOn('grow') && S.spec.swap; T.act('specpick:mill'); o.locked = T.specOn('grow');
    /* Grower: shade on every field of one coffee gives it +2 cup; wildflowers bring golden bushes sooner */
    const f = S.farms[S.loc], v = f.beds[0]; f.comp = []; f.beds.forEach((x, b) => { if (x === v) f.comp[b] = 'shade'; });
    const others = T.LOCS ? 0 : 0; o.shade = T.compCup(v) > 0; f.comp = ['flower', 'flower']; o.flower = T.compGold() < 1;
    /* Miller */
    S.spec.swap = false; T.act('specpick:mill'); T.act('seal:2'); o.seal = S.spec.seal === 2;
    o.sour = T.sealPay({ seal: 2, ferm: -4, sour: true }) === 0.5 && T.sealPay({ seal: 2, ferm: 3 }) > 1.29;
    /* Trader */
    S.spec.swap = false; T.act('specpick:trade'); const c = T.newContract(); o.bid = c.t0 !== undefined && c.bidN >= 2 && T.tradeMult(c) === 1;
    c.t0 -= 120; o.rise = T.tradeMult(c) > 1.19; c.t0 -= 600; o.cap = T.tradeMult(c) <= 1.4;
    S.contracts.push(c); c.leave = S.minutesTotal - 1; T.tradeTick(); o.leave = !S.contracts.includes(c);
    const c2 = T.newContract(); S.contracts.push(c2); T.act('future:' + c2.id); o.fut = c2.fut && T.tradeMult(c2) === 1.4; c2.due = S.minutesTotal - 1; T.tradeTick(); o.cold = S.spec.cold > S.minutesTotal;
    S.spec.won = (S.spec.won || 0); const w0 = S.spec.won; S.spec.won = w0 + 10; T.specCheck(); o.goal = S.spec.done && S.spec.stars.trade === 1 && !!S.sitems.title['sp:trade'] && T.titleText('sp:trade') === 'Master trader';
    T.specSet('trade', true); S.spec.won += 10; T.specCheck(); o.star2 = S.spec.stars.trade === 2 && /★★/.test(T.titleText('sp:trade'));
    S.dormant = { toba: 30 }; T.specSet('wander', true); o.wake = !Object.keys(S.dormant).length;
    return o; });
  ok(r.early, 'no focus before prestige 3'); ok(r.wander, 'Wanderer: coffee picks full weight away from home, ×1.3 still only at home');
  ok(r.oneSwap, 'first pick is not a swap'); ok(r.swap, 'changing focus marks the swap'); ok(r.locked, 'only one change a run');
  ok(r.shade, 'Grower: banana shade raises that coffee\'s cup'); ok(r.flower, 'Grower: wildflowers bring golden bushes sooner');
  ok(r.seal, 'Miller: the sealed-tank setting'); ok(r.sour, 'Miller: a sour batch pays half, a good one +10% a point');
  ok(r.bid, 'Trader: contracts draw 2 or 3 bidders'); ok(r.rise, 'Trader: the bid climbs while it stays open'); ok(r.cap, 'Trader: the bid stops at its cap');
  ok(r.leave, 'Trader: the buyers leave when their patience runs out'); ok(r.fut, 'Trader: a future is +40% fixed'); ok(r.cold, 'Trader: a missed future leaves buyers cold');
  ok(r.goal, 'goal reached gives the title and a star'); ok(r.star2, 'reaching it again adds a star'); ok(r.wake, 'Wanderer wakes dormant farms');
  const rd = await E(() => { const T = window.__T, S = T.S, R = S.roastery; S.spec.swap = false; T.act('specpick:roast'); if (!T.specOn('roast')) return ['not open'];
    R.roasters.length = 0; R.roasters.push({ key: 'caturra.washed', profile: 'medium', kg: 10, coins: 100, pts: 10, cup: 85, start: Date.now() - 7600, dur: 10000, crack: 0, cw: 0.16 });
    T.act('crack:0'); const r0 = R.roasters[0], dev = !!(r0 && r0.dev); r0.dev = Date.now() - r0.devDur * 0.45; const nb = R.bags.length; T.act('drop:0');
    const bag = R.bags[R.bags.length - 1]; return [dev, R.bags.length === nb + 1 && bag.profile === 'medium' && (S.spec.drops || 0) >= 1]; });
  ok(rd[0] === true, 'Roaster: a perfect crack starts development instead of ending the roast'); ok(rd[1] === true, 'Roaster: dropping in the window bags it and counts toward the goal');
  const pr = await E(() => { const T = window.__T, S = T.S; for (let i = 0; i < 12; i++) T.closeModal(); T.laterQ && (T.laterQ.length = 0); delete S.spec; S.prestige = 2; S.xp = T.XP_AT(T.prestigeNeed() + 1); T.act('prestigeAsk'); const m = document.getElementById('modal'); const has = /Your focus for the next run/.test(m.innerHTML); T.act('specnext:wander'); const still = !m.hidden && /Your focus/.test(m.innerHTML); T.act('prestige'); return [has, still, S.prestige === 3 && T.specOn('wander') && !Object.keys(S.dormant).length]; });
  ok(pr[0], 'the prestige window offers a focus at prestige 3'); ok(pr[1], 'picking keeps the window open'); ok(pr[2], 'prestige sets the focus; a Wanderer keeps every farm awake');
  const card = await E(() => { const T = window.__T; T.setTab('ranks'); T.act('ranksub:prestige'); return /Focus: Wanderer/.test(document.body.innerHTML); });
  ok(card, 'the Focus card shows in Ranks › Prestige');
  ok(!errs.length, 'no page errors ' + errs.join(' | '));
  console.log(pass + ' passed, ' + fail + ' failed'); await b.close(); process.exit(fail ? 1 : 0); })();
