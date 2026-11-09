/* The quick wins from the design review, end to end: Looks › Collection (every collection in one count, ranks, Go to where
   each grows, the rank on your profile, the walk that points it out); Looks › Music (songs added as you visit places, the
   jukebox, how often music plays); the daily calendar that never resets; What's new after an update and from Settings; the
   odds of rare finds where you find them; and the sub-tab labels that used to clip on small phones.
   node journal_e2e.js <test.html from mktest.py> */
const { chromium } = require(process.env.PW_MODULE || '/opt/node-tools/node_modules/playwright');
const path = require('path');
const file = path.resolve(process.argv[2]);
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m); } };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });
  const g = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true }); const errs = []; g.on('pageerror', (e) => errs.push(e.message));
  g.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) errs.push(m.text()); });
  await g.goto('file://' + file); await g.waitForTimeout(800);
  const E = (f, a) => g.evaluate(f, a);
  const clean = () => E(() => { const T = window.__T; for (let i = 0; i < 8; i++) T.closeModal(); document.getElementById('modal').hidden = true; document.getElementById('toast').hidden = true; });
  const modal = () => E(() => document.getElementById('modal').hidden ? '' : document.getElementById('modalCard').innerText);
  const panel = () => E(() => document.getElementById('panel').innerText);
  await E(() => { const T = window.__T, S = T.S, d = new Date(); S.checkin.last = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); S.name = S.nameOk = 'Tess'; S.guide = T.GUIDE.length; S.prestige = 7; S.pwalkDone = true; S.practiceTip = true; S.specTip = true; S.roastery.tip = true; Object.keys(S.tabs).forEach((k) => { S.tabs[k] = true; }); S.tabs.looks = true; S.navSeen = new Proxy({}, { get: () => true }); S.nav = null; S.rev.cur = null; S.stats.lotsSold = 40;
    S.route = T.routeFresh(); S.route.seen = true; S.route.mig = 1; ['pier', 'isle_re', 'isle_ba', 'isle_ga'].forEach((k) => { S.route.bd[k] = 1; }); S.re = T.reFresh(); S.re.seen = true; S.ba = T.baFresh(); S.ba.seen = true; S.ga = T.gaFresh(); S.ga.seen = true; });
  await clean();

  /* Looks › Collection */
  await E(() => { const T = window.__T; T.S.looksSub = 'looks'; T.setTab('looks'); T.renderPanel(); }); await g.waitForTimeout(150);
  ok(await E(() => [...document.querySelectorAll('#panel .subtabs button')].map((x) => x.textContent.trim()).join('|') === 'Looks|Collection|Music'), 'Looks has three sub-tabs: Looks, Collection and Music');
  ok(/collection: Seedling|collection: Picker/.test(await panel()), 'the Looks profile line shows your collection rank');
  await E(() => document.querySelector('#panel [data-act="looksub:collection"]').click()); await g.waitForTimeout(150);
  ok(/Collection log/.test(await panel()) && await E(() => window.__T.S.looksSub === 'collection'), 'tapping Collection opens the collection log');
  const cs = await E(() => window.__T.collections().map((c) => [c.id, c.got, c.total]));
  ok(cs.length === 9 && cs.every(([, g2, t]) => t > 0 && g2 >= 0 && g2 <= t), 'nine collections, each with a count and a total: ' + cs.map((c) => c[0]).join(', '));
  const tot = await E(() => window.__T.colTotals());
  ok(tot[1] === cs.reduce((a, c) => a + c[2], 0) && tot[1] >= 400, 'the log adds up to one total (' + tot[1] + ' things to find)');
  const before = await E(() => window.__T.colTotals()[0]);
  await E(() => { const T = window.__T, S = T.S; S.route.got.re_first = 1; S.ga.got.owl = 1; S.ga.got.sgf = 1; });
  ok(await E((b0) => window.__T.colTotals()[0] === b0 + 3, before), 'a ledger find and two field-guide entries add three to the log');
  ok(await E(() => { const T = window.__T, all = 400; return T.colRank(0, all).name === 'Seedling' && T.colRank(40, all).name === 'Picker' && T.colRank(100, all).name === 'Sorter' && T.colRank(160, all).name === 'Cupper' && T.colRank(240, all).name === 'Roaster' && T.colRank(320, all).name === 'Q grader' && T.colRank(400, all).name === 'Cup of Excellence' && T.colRank(39, all).next.at === 40; }), 'ranks from Seedling to Cup of Excellence by the share found, with the next one to aim for');
  await E(() => window.__T.act('colgo:notebook')); await g.waitForTimeout(120);
  ok(await E(() => window.__T.tab === 'unlock' && window.__T.S.unTab === 'notebook'), 'Go on the notebook opens Unlock › Notebook');
  await E(() => window.__T.act('colgo:records')); await g.waitForTimeout(120);
  ok(await E(() => window.__T.tab === 'ranks' && window.__T.S.rankSub === 'records'), 'Go on keepsakes, companions or achievements opens Ranks › Records');
  ok(await E(() => window.__T.NAV.some((n) => n.id === 'looks:collection' && n.when())), 'a walk points out Looks › Collection once Looks is open');
  ok(await E(() => { const T = window.__T, S = T.S; S.skinPicks = 1; S.looksSub = 'music'; T.setTab('looks'); const r = S.looksSub === 'looks'; S.skinPicks = 0; return r; }), 'with an outfit pick waiting, Looks opens on the outfits');

  /* Looks › Music */
  await E(() => { const T = window.__T, S = T.S; S.heard = {}; S.isle = false; S.loc = 'mogiana'; T.setTab('farm', true); T.syncMusic(); });
  ok(await E(() => window.__T.S.heard.mogiana && window.__T.S.heard.main && window.__T.songsHeard() === 2), 'visiting a farm adds its song to the music log (and the main theme)');
  await E(() => { const T = window.__T; T.goIsle('ba'); T.syncMusic(); });
  ok(await E(() => window.__T.S.heard.bali && window.__T.songsHeard() === 3), 'and an island adds its own');
  await E(() => { const T = window.__T; T.S.looksSub = 'music'; T.setTab('looks'); T.renderPanel(); }); await g.waitForTimeout(150);
  ok(/3 of 14 heard/.test(await panel()) && /\?\?\?/.test(await panel()), 'the music page counts songs heard and hides the rest until you visit');
  ok(/Visit Galápagos to hear it/.test(await panel()) && /Open the Roast tab to hear it/.test(await panel()), 'a song not heard yet says where to hear it');
  const places = await E(() => { const T = window.__T, S = T.S, got = new Set(['main']);   /* every place you can stand: each farm, the roastery, the harbour, every island */
    T.LOCS.forEach((l) => { S.isle = false; S.loc = l; T.setTab('farm', true); got.add(T.placeTrack()); });
    S.loc = 'mogiana'; T.setTab('roast', true); got.add(T.placeTrack()); T.setTab('farm', true);
    ['hb', 'bm', true, ...T.ISLE_IDS].forEach((i) => { S.isle = i; T.setTab('farm', true); got.add(T.placeTrack()); });
    S.isle = false; T.setTab('farm', true); return Cozy.songs.filter((s) => !got.has(s.id)).map((s) => s.id); });
  ok(!places.length, 'every song in the music log can be heard somewhere' + (places.length ? ': not ' + places.join(', ') : ''));
  await E(() => window.__T.act('jukebox:bali'));
  ok(await E(() => { const T = window.__T; T.S.isle = false; T.S.loc = 'mogiana'; return T.trackFor() === 'bali' && T.placeTrack() === 'mogiana'; }), 'the jukebox plays a song you have heard everywhere');
  ok(await E(() => { const T = window.__T; T.S.jukebox = 'galapagos'; return T.trackFor() === 'mogiana'; }), 'a song you haven\'t heard can\'t be picked');
  await E(() => window.__T.act('jukebox:auto'));
  ok(await E(() => !window.__T.S.jukebox && window.__T.trackFor() === 'mogiana'), '"Each place its own song" goes back to normal');
  const rests = await E(() => { const T = window.__T, calls = [], f = Cozy.setRest; Cozy.setRest = (a, b2) => { calls.push([a, b2]); f(a, b2); }; T.act('mrest:some'); T.act('mrest:rare'); T.act('mrest:always'); Cozy.setRest = f; return calls; });
  ok(JSON.stringify(rests) === JSON.stringify([[45, 120], [180, 420], [0, 0]]), 'How often music plays sets quiet stretches between plays: now and then 45–120 s, rarely 3–7 min, all the time none');
  ok(await E(() => typeof Cozy.resting === 'function' && !Cozy.resting()), 'the music player knows when it is resting');
  ok(await E(() => window.__T.collections().find((c) => c.id === 'songs').got === 3), 'songs count in the collection log');

  /* the daily calendar */
  await clean();
  ok(await E(() => { const T = window.__T, S = T.S; S.checkin = { last: '2026-1-1', n: 5, streak: 5, freezes: 0, days: {} }; T.checkIn(); return S.checkin.n === 6 && S.checkin.last !== '2026-1-1'; }), 'a check-in after weeks away moves the calendar on a day: nothing resets');
  const openCard = () => E(() => { const m = document.getElementById('moment'), t = m.querySelector('.m-t b'), b = m.querySelector('[data-act="later:open"]'); if (b) b.click(); return t ? t.textContent : ''; });   /* the new HUD: a window the game opens by itself waits as a card at the bottom of the map */
  ok(await openCard() === 'Daily brew calendar', 'the calendar waits as a card at the bottom of the map, not a window');
  ok(/Daily brew calendar/.test(await modal()) && /Day 6 on the farm/.test(await modal()) && /never resets/.test(await modal()), 'the card shows the day and says it never resets');
  ok(await E(() => document.querySelectorAll('#modalCard .streak > span.now')[0] === document.querySelectorAll('#modalCard .streak > span')[5]), 'day 6 lights the sixth reward');
  await clean();
  ok(await E(() => { const T = window.__T, S = T.S; S.checkin = { last: '2026-2-1', streak: 4, freezes: 1, days: {} }; T.checkIn(); return S.checkin.n === 5; }), 'an older save carries its streak over as calendar days');
  await clean();
  ok(await E(() => { const T = window.__T, a = T.ACH.find((x) => x.id === 'streak7'); return /different days/.test(a.text) && a.have() === 5; }), 'the check-in achievements count days played, not days in a row');
  await E(() => { const T = window.__T; T.setTab('orders'); T.renderPanel(); }); await g.waitForTimeout(150);
  ok(/Daily brew calendar/.test(await panel()) && /never resets/.test(await panel()) && !/streak freeze/.test(await panel()), 'the Daily tab describes the calendar, with no streak freezes');
  await g.setViewportSize({ width: 320, height: 568 }); await E(() => { const T = window.__T; T.S.rerollDay = ''; T.setTab('orders'); T.renderPanel(); }); await g.waitForTimeout(150);
  const narrow = await E(() => [...document.querySelectorAll('#panel .row')].filter((r) => r.querySelectorAll('.btn').length > 1).map((r) => Math.round(r.querySelector('.grow').getBoundingClientRect().width)));
  ok(narrow.length && narrow.every((w) => w >= 80), 'on a 320 px phone, a task row with Go and Swap stacks its buttons and keeps its text readable (' + narrow.join(', ') + ' px wide)');
  await g.setViewportSize({ width: 390, height: 844 });

  /* What's new */
  await clean();
  ok(await E(() => { const T = window.__T, S = T.S; S.newsSeen = undefined; S.stats.lotsSold = 40; T.laterQ.length = 0; T.laterShow(); T.newsSoon(); return S.newsSeen === T.NEWS[0].v; }), 'after an update, a returning farmer sees What\'s new once');
  ok(await openCard() === 'What\'s new on the farm', 'What\'s new waits as a card too');
  ok(/What's new on the farm/.test(await modal()) && /Every farm awake/.test(await modal()) && /steadier week/.test(await modal()), 'the card lists what arrived since they last looked (the two newest)');
  await clean();
  ok(await E(() => { window.__T.newsSoon(); return document.getElementById('modal').hidden; }), 'and not again');
  ok(await E(() => { const T = window.__T, S = T.S; S.newsSeen = 'fresh'; T.newsSoon(); return document.getElementById('modal').hidden && S.newsSeen === T.NEWS[0].v; }), 'a new farm skips it');
  await E(() => { const T = window.__T; T.setTab('test'); T.renderPanel(); }); await g.waitForTimeout(150);
  await E(() => document.querySelector('#panel [data-act="news"]').click()); await g.waitForTimeout(150);
  ok(/What's new on the farm/.test(await modal()), 'Settings has a What\'s new button');
  await clean();

  /* the odds, where you find things */
  await E(() => { const T = window.__T; T.S.baSub = 'log'; T.goIsle('ba'); T.setTab('farm'); T.renderPanel(); }); await g.waitForTimeout(150);
  const bl = await panel();
  ok(/1 in 250, sure by the 600th/.test(bl) && /1 in 400, sure by the 1,000th/.test(bl) && /1 time in 40/.test(bl) && /1 in 15/.test(bl), 'Bali\'s log shows the odds of the duck, the golden rake, the outfit and the tools, with the guarantees');
  await E(() => { const T = window.__T; T.S.reSub = 'log'; T.goIsle('re'); T.setTab('farm'); T.renderPanel(); }); await g.waitForTimeout(150);
  ok(/1 in 60 shifts of 50 cherries or more, sure by the 150th/.test(await panel()), 'Réunion\'s log shows the tuit-tuit\'s odds');
  await E(() => { const T = window.__T; T.S.gaSub = 'guide'; T.goIsle('ga'); T.setTab('farm'); T.renderPanel(); }); await g.waitForTimeout(150);
  ok(/Odds: a photo is common 55%, uncommon 28%, rare 13% and very rare 4%/.test(await panel()) && /sure by its 120th try/.test(await panel()), 'the field guide shows the odds of each rarity, and the guarantee');
  await E(() => { const T = window.__T; T.S.gaSub = 'log'; T.renderPanel(); }); await g.waitForTimeout(150);
  ok(/1 in 100 trails, sure by the 250th/.test(await panel()), 'Galápagos\'s log shows the young tortoise\'s odds');
  await E(() => { const T = window.__T, S = T.S; S.rev.seen = true; S.isle = false; S.rankSub = 'records'; T.setTab('ranks'); T.renderPanel(); }); await g.waitForTimeout(150);
  ok(/1 time in 20/.test(await panel()) && /One stop in 100 brings a companion/.test(await panel()), 'Ranks › Records shows how often rare events and companions come');

  /* labels that used to clip */
  await E(() => { const T = window.__T; T.S.rankSub = 'board'; T.setTab('ranks'); T.renderPanel(); }); await g.waitForTimeout(150);
  ok(await E(() => [...document.querySelectorAll('#panel .subtabs button')].some((x) => x.textContent.trim() === 'Board') && ![...document.querySelectorAll('#panel .subtabs button')].some((x) => /Leaderboard/.test(x.textContent))), 'Ranks\' first sub-tab is "Board"');
  ok(!errs.length, 'no page errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  console.log(pass + ' passed, ' + fail + ' failed');
  await b.close(); process.exit(fail ? 1 : 0);
})();
