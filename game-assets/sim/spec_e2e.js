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
    S.prestige = 3; const base = { crack: T.crackSecs3('caturra.washed'), dry: T.lotTime('washed'), slots: T.contractSlots(), cup: T.cupBonus() };
    T.act('specpick:mill'); o.mill = T.specOn('mill') && T.lotTime('washed') < base.dry * 0.81 && T.cupBonus() === base.cup + 2;
    o.oneSwap = !S.spec.swap; T.act('specpick:trade'); o.trade = T.specOn('trade') && T.contractSlots() === base.slots + 1 && S.spec.swap; T.act('specpick:grow'); o.locked = T.specOn('trade');
    S.spec.swap = false; T.act('specpick:roast'); o.roast = T.specOn('roast') && Math.abs(T.crackSecs3('caturra.washed') / base.crack - 1.5) < 0.01;
    T.specSet('trade', true); const c0 = S.stats.contracts || 0; S.stats.contracts = c0 + 15; T.specCheck(); o.goal = S.spec.done && S.spec.stars.trade === 1 && !!S.sitems.title['sp:trade'] && T.titleText('sp:trade') === 'Master trader';
    T.specSet('trade', true); S.stats.contracts += 15; T.specCheck(); o.star2 = S.spec.stars.trade === 2 && /★★/.test(T.titleText('sp:trade'));
    S.dormant = { toba: 30 }; T.specSet('wander', true); o.wake = !Object.keys(S.dormant).length;
    return o; });
  ok(r.early, 'no focus before prestige 3'); ok(r.mill, 'Miller: lots dry 25% faster and cupping +2'); ok(r.oneSwap, 'first pick is not a swap');
  ok(r.trade, 'Trader: one more contract slot; changing marks the swap'); ok(r.locked, 'only one change a run'); ok(r.roast, 'Roaster: crack window ×1.5');
  ok(r.goal, 'goal reached gives the title and a star'); ok(r.star2, 'reaching it again adds a star'); ok(r.wake, 'Wanderer wakes dormant farms');
  const pr = await E(() => { const T = window.__T, S = T.S; for (let i = 0; i < 12; i++) T.closeModal(); T.laterQ && (T.laterQ.length = 0); delete S.spec; S.prestige = 2; S.xp = T.XP_AT(T.prestigeNeed() + 1); T.act('prestigeAsk'); const m = document.getElementById('modal'); const has = /Your focus for the next run/.test(m.innerHTML); T.act('specnext:wander'); const still = !m.hidden && /Your focus/.test(m.innerHTML); T.act('prestige'); return [has, still, S.prestige === 3 && T.specOn('wander') && !Object.keys(S.dormant).length]; });
  ok(pr[0], 'the prestige window offers a focus at prestige 3'); ok(pr[1], 'picking keeps the window open'); ok(pr[2], 'prestige sets the focus; a Wanderer keeps every farm awake');
  const card = await E(() => { const T = window.__T; T.setTab('ranks'); T.act('ranksub:prestige'); return /Focus: Wanderer/.test(document.body.innerHTML); });
  ok(card, 'the Focus card shows in Ranks › Prestige');
  ok(!errs.length, 'no page errors ' + errs.join(' | '));
  console.log(pass + ' passed, ' + fail + ' failed'); await b.close(); process.exit(fail ? 1 : 0); })();
