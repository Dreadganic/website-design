/* The first round of fixes from the design audit (6 November 2026), end to end: a regular's request no longer feeds the income
   rate it's priced from; a stopped event brings only the event companions, never an island's; long notices come in short pieces;
   the top bar shows short numbers; the welcome-back card shows the coins and know-how earned, with the fourth field picking too;
   and the contract cards keep their height on a 320 x 568 phone.
   node review_e2e.js <test.html from mktest.py> */
const { chromium } = require(process.env.PW_MODULE || '/opt/node-tools/node_modules/playwright');
const path = require('path');
const file = path.resolve(process.argv[2]);
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m); } };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });
  const g = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true }); const errs = []; g.on('pageerror', (e) => errs.push(e.stack.slice(0, 400)));
  await g.goto('file://' + file); await g.waitForTimeout(800);
  const E = (f, a) => g.evaluate(f, a);
  const clean = () => E(() => { const T = window.__T; for (let i = 0; i < 8; i++) T.closeModal(); document.getElementById('modal').hidden = true; document.getElementById('toast').hidden = true; });
  const modal = () => E(() => document.getElementById('modal').hidden ? '' : document.getElementById('modalCard').innerText);
  await E(() => { const T = window.__T, S = T.S, d = new Date(); S.checkin.last = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); S.name = S.nameOk = 'Tess'; S.guide = T.GUIDE.length; S.prestige = 3; S.pwalkDone = true; S.practiceTip = true; S.coins = 50016310; S.points = 5123456; S.xp = 9e6; });
  await clean();

  /* a regular's request: paid, and taken back out of the rate it was priced from */
  const req = await E(() => {
    const T = window.__T, S = T.S; S.lots = [{ v: 'caturra', method: 'washed', kg: 40, left: 0, cupped: true, cup: 84 }];
    S.request = { who: 'Kenji at the kissaten', v: 'caturra', m: 'washed', ends: Date.now() + 864e5, coins: 9000, points: 3000 };
    T.earned = [0, 0]; const c0 = S.coins; T.act('reqfill'); return { paid: S.coins - c0, earned: T.earned };
  });
  ok(req.paid === 9000, 'the request pays its coins: ' + req.paid);
  ok(req.earned[0] === 0 && req.earned[1] === 0, 'and leaves nothing in the income counters: ' + req.earned.join(', '));
  await clean();

  /* companions from events: only the five event animals */
  const pets = await E(() => { const T = window.__T, S = T.S, got = new Set(), rnd = Math.random; S.rev.pets = {};
    for (let i = 0; i < 400; i++) { const left = T.EV_PETS.filter((k) => !S.rev.pets[k]); if (!left.length) break; const k = left[Math.floor(rnd() * left.length)]; got.add(k); S.rev.pets[k] = true; }
    return { pool: T.EV_PETS, got: [...got] }; });
  ok(pets.pool.length === 5 && !pets.pool.some((k) => ['doctorbird', 'nene', 'tuittuit', 'duck', 'tortoise'].includes(k)), 'the event pool is the piglet, capuchin, crow, mill cat and dalmatian: ' + pets.pool.join(', '));
  ok(await E(() => /EV_PETS\.filter/.test(document.documentElement.innerHTML)), 'a stopped event draws from that pool');
  await E(() => { window.__T.S.rev.pets = {}; });

  /* long notices */
  const long = 'Huila reached farm level 25: Cafetero building style, Whiskey and rum barrel lots sell for 10% more, from any farm, The farmhouse gets a striped awning and a veranda with hammocks for the pickers. Next at 40: the estate farmhouse.';
  const parts = await E((m) => window.__T.toastSplit(m), long);
  ok(parts.length >= 2 && parts.every((x) => x.length <= 110), 'a long notice splits into pieces of 110 characters or less: ' + parts.map((x) => x.length).join(', '));
  ok(parts.join(' ').replace(/\s+/g, ' ') === long, 'and nothing is lost');
  await E((m) => { window.__T.toast(m); }, long); await g.waitForTimeout(100);
  const fit = await E(() => { const t = document.getElementById('toast'), bar = t.parentElement.getBoundingClientRect(), r = t.getBoundingClientRect(); return { th: Math.round(r.height), bh: Math.round(bar.height) }; });
  ok(fit.th <= fit.bh, 'the first piece fits the top bar: ' + fit.th + ' px in ' + fit.bh);
  await clean();

  /* the top bar */
  await E(() => { window.__T.renderPanel(); }); await g.waitForTimeout(300);
  const hud = await E(() => ({ c: document.getElementById('hudCoins').textContent, l: document.getElementById('hudLevel').textContent, aria: document.getElementById('hudCoins').getAttribute('aria-label') }));
  ok(hud.c.trim() === '50M' && /5\.1M/.test(hud.l), 'coins and know-how are short in the pills: ' + hud.c + ' / ' + hud.l);
  ok(/^50,0\d\d,\d{3} coins$/.test(hud.aria), 'the full number is read out: ' + hud.aria);

  /* the welcome-back card */
  await E(() => { const T = window.__T, S = T.S; S.staff.foreman = true; S.lots = []; Object.values(S.farms).forEach((f) => { f.field = 0; }); });
  const three = await E(() => { const T = window.__T, S = T.S, f = S.farms.mogiana; f.beds = ['caturra', 'caturra', 'caturra', 'geisha']; f.field = 0; S.cherries = {}; T.away(1); return S.cherries.geisha || 0; });
  await clean();
  const four = await E(() => { const T = window.__T, S = T.S, f = S.farms.mogiana; f.field = 1; S.cherries = {}; T.away(1); return S.cherries.geisha || 0; });
  ok(three === 0 && four > 0, 'a cleared fourth field picks while you are away too: ' + three + ' then ' + four + ' kg of its Geisha');
  ok(/Coins earned/.test(await modal()) || /Picked/.test(await modal()), 'the welcome-back card opens');
  await clean();
  const card = await E(() => { const T = window.__T, S = T.S; S.lv.racks = 3; S.lots = []; S.cherries = { caturra: 5000 }; const r = T.away(2); let all = ''; for (let i = 0; i < 8 && !document.getElementById('modal').hidden; i++) { all += document.getElementById('modalCard').innerText + '\n'; T.closeModal(); } return r > 0 ? all : 'earned nothing'; });   /* the card may wait behind a level-up the sales brought */
  ok(/Coins earned/.test(card) && /Know-how earned/.test(card), 'it shows the coins and know-how the foreman earned');
  await clean();

  /* contract cards on a small phone */
  await g.setViewportSize({ width: 320, height: 568 }); await g.waitForTimeout(200);
  await E(() => { const T = window.__T, S = T.S; S.lv.racks = 3; T.setTab('mill'); T.renderPanel(); }); await g.waitForTimeout(300);
  const strip = await E(() => { const s = document.querySelector('#panel .ccards'); if (!s) return null; const c = s.firstElementChild; return { s: Math.round(s.getBoundingClientRect().height), c: c ? Math.round(c.getBoundingClientRect().height) : 0 }; });
  ok(strip && strip.s >= 80 && strip.c >= 80, 'the contract strip keeps its height at 320 x 568: ' + JSON.stringify(strip));

  /* round two: settings first, sheets named for their place, dots, a new coffee planted from its window, the night shift, the boat */
  await g.setViewportSize({ width: 390, height: 844 }); await clean();
  await E(() => { const T = window.__T; T.setTab('settings'); T.renderPanel(); }); await g.waitForTimeout(200);
  const order = await E(() => [...document.querySelectorAll('#panel h2, #panel h3')].map((x) => x.textContent));
  ok(order.indexOf('Haptics') > -1 && (order.indexOf('Test tools') === -1 || order.indexOf('Haptics') < order.indexOf('Test tools')), 'Settings: the player\'s own settings, haptics among them, come before the test tools: ' + order.slice(0, 8).join(', '));
  ok(await E(() => !!document.querySelector('#panel a[href="/privacy/"]')), 'Settings links the privacy page');
  ok(await E(() => { const T = window.__T, S = T.S; S.prestige = 6; S.route = S.route || T.routeFresh(); S.route.seen = true; S.re = S.re || T.reFresh(); S.re.seen = true; S.route.bd.isle_re = 1; T.goIsle('re'); T.setTab('farm'); T.renderPanel(); return document.getElementById('sheetT').textContent; }) === 'Réunion', 'an island\'s sheet is named for the place');
  await clean(); await E(() => { const T = window.__T, S = T.S; S.isle = false; S.loc = 'mogiana'; T.setTab('farm'); });
  const dots = await E(() => { const T = window.__T, S = T.S; S.coins = 9e9; S.prestige = 3; T.renderPanel(); const late = document.querySelectorAll('#panel .subtabs .dot').length; S.prestige = 0; S.__x = 1; T.renderPanel(); const early = document.querySelectorAll('#panel .subtabs .dot').length; S.prestige = 3; return { late, early }; });
  ok(dots.late === 0 && dots.early > 0, 'affordability dots only before the first prestige: ' + JSON.stringify(dots));
  const vc = await E(() => { const T = window.__T, S = T.S, d = document.createElement('div'); d.innerHTML = T.varCard('mundonovo'); return [...d.querySelectorAll('[data-act^="plantnow:"]')].map((x) => x.dataset.act); });
  ok(vc.length >= 3 && vc.every((x) => /^plantnow:mogiana\.\d\.mundonovo$/.test(x)), 'a new coffee\'s window plants it straight into a field of its home farm: ' + vc.join(', '));
  const night = await E(() => { const T = window.__T, S = T.S, run = (h) => { S.staff.foreman = true; S.lv.racks = 3; S.lots = []; S.cherries = {}; S.contracts = S.contracts.filter((c) => !c.boat); const l0 = S.stats.lotsSold; T.away(h); for (let i = 0; i < 8; i++) T.closeModal(); return S.stats.lotsSold - l0; }; return [run(1), run(12)]; });
  ok(night[1] > night[0], 'with a foreman, twelve hours away mills more than one (the night shift): ' + night.join(' then '));
  const boat = await E(() => { const T = window.__T, S = T.S; S.staff.foreman = true; S.request = null; S.lots = Array.from({ length: 6 }, () => ({ v: 'caturra', method: 'natural', kg: 200, left: 0, cupped: true, cup: 84 })); S.contracts = [{ id: 'b1', boat: true, kg: 99999, have: 0, v: null, m: null, cup: 0, pay: 1, at: Date.now(), ends: Date.now() + 864e5 }]; const n0 = S.lots.length; T.staffTick(); return { before: n0, after: S.lots.length, racks: T.racks() }; });
  ok(boat.after < boat.before, 'a big boat order no longer holds every lot: the foreman still sells (' + boat.before + ' lots, ' + boat.after + ' left)');
  /* round three: the clock only moves forward; Galápagos's weekly survey */
  const clock = await E(() => { const T = window.__T, S = T.S, real = Date.now, out = {}; for (let i = 0; i < 8; i++) T.closeModal();
    S.checkin.last = ''; T.checkIn(); out.n1 = S.checkin.n; for (let i = 0; i < 8; i++) T.closeModal();
    Date.now = () => real() + 864e5; T.checkIn(); out.n2 = S.checkin.n; for (let i = 0; i < 8; i++) T.closeModal();
    Date.now = real; T.checkIn(); out.n3 = S.checkin.n; out.ahead = T.gameNow() - real() > 8e7; S.clockMax = real(); return out; });
  ok(clock.n2 === clock.n1 + 1 && clock.n3 === clock.n2 && clock.ahead, 'a phone set a day ahead and back again gets one check-in, not two, and the game\'s clock stays ahead: ' + JSON.stringify(clock));
  const sv = await E(() => { const T = window.__T, S = T.S; S.ga = S.ga || T.gaFresh(); const G = S.ga; G.got = {}; const before = T.gaSurvey();
    T.GA_GUIDE.forEach((e) => { G.got[e[0]] = 1; }); const list = T.gaSurvey().list.slice(); const p0 = S.points; const first = T.gaLog(T.GA_GUIDE.find((e) => e[0] === list[0]));
    const again = T.gaLog(T.GA_GUIDE.find((e) => e[0] === list[0])); list.slice(1).forEach((id) => T.gaLog(T.GA_GUIDE.find((e) => e[0] === id)));
    return { before: !!before, n: list.length, paid: S.points - p0, firstNote: first.got.join(' '), againNote: again.got.join(' '), surveys: G.surveys, rare: list.every((id) => T.GA_GUIDE.find((e) => e[0] === id)[2] <= 2) }; });
  ok(!sv.before && sv.n === 5 && sv.rare, 'the survey starts once the guide is full, with five species up to rare: ' + JSON.stringify(sv));
  ok(/survey photo/.test(sv.firstNote) && !/survey photo/.test(sv.againNote) && sv.surveys === 1, 'each wanted species pays once, and all five complete the week\'s survey');
  const nb = await E(() => { const T = window.__T, S = T.S; S.vars.pointu = false; const m0 = T.nbMax(); S.vars.pointu = true; const m1 = T.nbMax(); const t0 = T.nbTotal(); T.nbAdd('pointu', 'washed', 1); return { m0, m1, gain: T.nbTotal() - t0 }; });
  ok(nb.m0 === 162 && nb.m1 === 180 && nb.gain === 1, 'Bourbon Pointu counts in the cupping notebook once Réunion gives it to you: ' + JSON.stringify(nb));
  const miss = await E(() => window.__noSprite || []); ok(!miss.length, 'every picture drawn exists: ' + miss.join(', '));
  ok(!errs.length, 'no page errors: ' + errs.join(' | '));
  console.log(pass + ' passed, ' + fail + ' failed'); await b.close(); process.exit(fail ? 1 : 0);
})();
