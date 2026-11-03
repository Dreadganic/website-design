/* Galápagos, the Naturalist's Highlands, end to end in the real game: closed until prestige 7, a first voyage there and the harbour
   board's project; Dr. Inés's welcome; camera traps (setting, developing, collecting, setting again, more with levels, sooner at
   level 25); what a photo shows and what a tortoise digs up, the very rare guarantee, shade trees at home bringing rarer birds;
   field notes; tortoise trails (fresh tracks banking, the clue and three signs, a wrong pick going cold, finding her, the hint at
   level 15, the young tortoise); the five pages and what each gives back (two photos a trap, owl boxes and hawk perches against
   the rats and crows, shade trees counting more, the fossil display, the field hat); the patio's coffee; levels and the title;
   the daily task; photo postcards; the page; "Where to?"; a reload; and a simulation of how long the guide takes to fill.
   node galapagos_e2e.js <test.html from mktest.py> [shots dir] */
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
  const trap = (i) => E((i) => { const a = window.__T.GA_TRAPS[i]; return [a.x, a.y - 7]; }, i);
  const spot = (k) => E((k) => { const p = window.__T.GA_SPOTS[k]; return [p.x, p.y]; }, k);
  const head = [96, 280], ines = await E(() => [window.__T.GA_INES.x, window.__T.GA_INES.y - 10]);
  await E(() => { const T = window.__T, S = T.S, d = new Date(); S.checkin.last = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); S.name = S.nameOk = 'Tess'; S.guide = T.GUIDE.length; S.prestige = 6; S.pwalkDone = true; S.practiceTip = true; S.roastery.tip = true; Object.keys(S.tabs).forEach((k) => { S.tabs[k] = true; }); S.rev.cur = null; T.revSess = 0; S.loc = 'osaka'; S.isle = false; T.setTab('farm', true); T.bmTick(); S.bm.seen = true; T.routeTick(); S.route.seen = true; for (const l of Object.keys(S.farms)) S.farms[l].build = Object.assign({}, S.farms[l].build, { shade: 0 }); });
  await clean();

  /* opening: prestige 7, a first voyage to Galápagos, then the board's project */
  const proj = () => E(() => window.__T.bdState(window.__T.BOARD.find((x) => x.id === 'isle_ga')));
  ok(await proj() === 'Opens at prestige 7', 'the camp waits for prestige 7');
  await E(() => { window.__T.S.prestige = 7; });
  ok(await proj() === 'Sail to Galápagos first', 'then for a first voyage to Galápagos');
  await E(() => { const R = window.__T.S.route; R.vdone.galapagos = 1; R.cw = 0; });
  ok(await proj() === 'cowries', 'then for its 12 cowries');
  await E(() => { const T = window.__T; T.S.route.cw = 12; T.act('hb_build:isle_ga'); });
  ok(await E(() => window.__T.isleOpen('ga') && !!window.__T.S.ga && window.__T.S.route.cw === 0), 'building "Join Dr. Inés\'s field camp" opens Galápagos');
  await clean();
  await E(() => { const T = window.__T, S = T.S; S.loc = 'mogiana'; S.isle = false; T.setTab('farm', true); document.getElementById('prevLoc').click(); }); await g.waitForTimeout(250);
  ok(await E(() => window.__T.scene === 'ga'), 'Galápagos comes last in the arrows: the arrow back from Mogiana');
  await g.waitForTimeout(800);
  ok(/Dr\. Inés/i.test(await modal()) && /field guide/i.test(await modal()), 'Dr. Inés welcomes you and explains the traps, the trails and the guide');
  await clean();
  ok(await E(() => document.getElementById('locName').textContent.startsWith('Galápagos') && /Lv 1/.test(document.getElementById('locLv').textContent) && /guide 0\/46/.test(document.getElementById('locBeds').textContent)), 'the farm bar names the highlands, the level and the guide: 0 of 46');
  ok(await E(() => window.__T.GA_GUIDE.length === 46 && window.__T.GA_PAGES.map(([k]) => window.__T.GA_GUIDE.filter((e) => e[1] === k).length).join() === '12,12,8,7,7'), 'the field guide: 46 entries on five pages (12 finches, 12 birds and reptiles, 8 plants, 7 fossils, 7 curios)');

  /* camera traps */
  ok(await E(() => window.__T.gaTrapN() === 4 && window.__T.gaDevMs() === 50 * 60e3), 'four traps at level 1, a photo in 50 minutes');
  ok(await E(() => { const h = window.__T.hintAt('ga'); return h && window.__T.GA_TRAPS.slice(0, 4).some((a) => a.x === h[0] && a.y - 14 === h[1]); }), 'the arrow points at a trap to set');
  let p = await trap(0); await tapMap(p[0], p[1]);
  ok(await E(() => window.__T.gaLeft(window.__T.S.ga.traps[0]) > 49 * 60e3), 'tapping a trap sets it');
  await tapMap(p[0], p[1]);
  ok(await E(() => window.__T.S.ga.photos === 0), 'tapping it again only says how long it has to go');
  p = await trap(4); await tapMap(p[0], p[1]);
  ok(await E(() => window.__T.S.ga.traps[4].at === 0), 'a fifth trap waits for level 10');
  const k0 = await E(() => window.__T.S.points);
  await E(() => { window.__T.S.ga.traps[0].at -= 51 * 60e3; });
  p = await trap(0); await tapMap(p[0], p[1]);
  ok(await E(() => { const G = window.__T.S.ga; return G.photos === 1 && window.__T.gaFound() === 1 && window.__T.gaLeft(G.traps[0]) > 49 * 60e3 && window.__T.S.route.got.ga_photo; }), 'after 50 minutes it has a photo: into the guide, the trap set again, a find for the first photo');
  ok(await E((k0) => window.__T.S.points > k0, k0), 'a new entry brings a field note: know-how');
  ok(await E(() => { const e = window.__T.GA_GUIDE.find((x) => window.__T.S.ga.got[x[0]]); return e[1] === 'finch' || e[1] === 'bird'; }), 'a photo shows a finch, a bird or a reptile');
  ok(await E(() => { const T = window.__T; for (let i = 0; i < 40; i++) { const e = T.gaRoll('trail'); if (!['plant', 'fossil', 'curio'].includes(e[1])) return false; } return true; }), 'a tortoise digs up a seedling, a fossil or a curio');
  ok(await E(() => { const T = window.__T, G = T.S.ga, mr = Math.random; Math.random = () => 0.95; const a = T.gaRoll('photo')[2]; T.S.farms.mogiana.build.shade = 24; const c = T.gaRoll('photo')[2]; T.S.farms.mogiana.build.shade = 0; Math.random = mr; return a === 2 && c === 3; }), 'shade trees at home bring rarer birds: the same luck that gives a rare bird gives a very rare one with 24 levels of shade');
  ok(await E(() => { const T = window.__T, G = T.S.ga; G.dry.owl = 119; G.dry.mgr = 0; const mr = Math.random; Math.random = () => 0.01; const e = T.gaRoll('photo'); Math.random = mr; return e[0] === 'owl'; }), 'a very rare entry is sure by its 120th roll');
  await E(() => { const G = window.__T.S.ga; G.dry.owl = 119; G.traps[1].at = Date.now() - 51 * 60e3; });
  p = await trap(1); await tapMap(p[0], p[1]);
  ok(/very rare sighting/i.test(await modal()) && /Short-eared owl/.test(await modal()) && await E(() => !!window.__T.S.route.got.ga_rare), 'a very rare photo: a card for the sighting, and a find');
  await clean();

  /* tortoise trails */
  ok(await E(() => window.__T.S.ga.tracks === 1), 'fresh tracks wait at the trailhead to start with');
  await tapMap(head[0], head[1]);
  ok(await E(() => { const tr = window.__T.S.ga.tr; return tr && tr.n >= 4 && tr.n <= 6 && tr.opts.length === 3 && tr.opts.includes(tr.right) && window.__T.S.ga.tracks === 0; }), 'tapping the trailhead follows them: 4 to 6 steps, three signs, one of them right');
  await g.waitForTimeout(700);
  ok(await E(() => { const tr = window.__T.S.ga.tr; return window.__T.GA_CLUES[tr.right].includes(tr.clue) && document.getElementById('locBeds').textContent.includes(tr.clue.toLowerCase()); }), 'the clue describes the right sign, and the farm bar shows it');
  ok(await E(() => window.__T.hintAt('ga') === null), 'the arrow never gives the answer away');
  p = await spot(await E(() => window.__T.S.ga.tr.right)); await tapMap(p[0], p[1]);
  ok(await E(() => window.__T.S.ga.tr && window.__T.S.ga.tr.k === 1), 'the right sign: the trail goes on');
  p = await spot(await E(() => window.__T.S.ga.tr.opts.find((k) => k !== window.__T.S.ga.tr.right))); await tapMap(p[0], p[1]);
  ok(await E(() => !window.__T.S.ga.tr && window.__T.S.ga.cold === 1), 'a wrong sign: the trail goes cold');
  await E(() => { window.__T.S.ga.tracks = 1; });
  await tapMap(head[0], head[1]);
  const n = await E(() => window.__T.S.ga.tr.n);
  for (let k = 0; k < n; k++) { p = await spot(await E(() => window.__T.S.ga.tr.right)); await tapMap(p[0], p[1] + (k % 2 ? 10 : 0)); }   /* every other step by its TRACKS label */
  ok(/Found her!/.test(await modal()) && await E(() => window.__T.S.ga.trails === 1 && window.__T.S.route.got.ga_trail && !window.__T.S.ga.tr), 'following every sign finds her, with what she dug up; a find for the first');
  await clean();
  const ph0 = await E(() => { const G = window.__T.S.ga; G.traps[3].at = Date.now() - 51 * 60e3; return G.photos; });
  p = await E(() => { const a = window.__T.GA_TRAPS[3]; return [a.x, a.y - 16]; }); await tapMap(p[0], p[1]);
  ok(await E((ph0) => window.__T.S.ga.photos === ph0 + 1, ph0), 'tapping a trap\'s PHOTO label collects it too');
  await clean();
  ok(await E(() => window.__T.TASK_KINDS.gtrail.ok() && /tortoise trails/.test(window.__T.TASK_KINDS.gtrail.text) && window.__T.TASK_KINDS.gtrail.goal === 2), 'the daily task "Finish 2 tortoise trails" can come up');
  await clean();
  ok(await E(() => { const T = window.__T, G = T.S.ga; G.tracks = 0; G.tracksAt = Date.now() - 31 * 60e3; T.gaBank(); const one = G.tracks === 1; G.tracksAt = Date.now() - 10 * 3600e3; T.gaBank(); return one && G.tracks === 4; }), 'fresh tracks every 30 minutes, up to four, while you\'re away');
  ok(await E(() => { const T = window.__T, G = T.S.ga, S = T.S; delete (S.rev.pets || {}).tortoise; G.tortoiseDry = 249; T.gaTrailStart(); G.tr.k = G.tr.n - 1; T.gaSign(G.tr.right); return !!(S.rev.pets || {}).tortoise && S.route.got.ga_pet; }), 'the young tortoise is sure by the 250th trail: a companion and a find');
  await clean();

  /* the patio */
  await E(() => { const T = window.__T, G = T.S.ga; G.pool = 8; G.poolAt = Date.now() - 2 * 3600e3; T.S.roastery.beans = {}; T.S.roastery.want = {}; });
  ok(await E(() => Math.floor(window.__T.gaPool()) === 12), 'the patio dries 2 kg of San Cristóbal an hour');
  await tapMap(45, 284);
  ok(await E(() => { const B = window.__T.S.roastery.beans['caturra.isl_galapagos']; return B && B.kg >= 12 && window.__T.gaPool() < 1; }), 'tapping it bags the coffee for the Osaka bins');

  /* the pages and what they give back */
  const fill = (pg) => E((pg) => { const T = window.__T, G = T.S.ga, es = T.GA_GUIDE.filter((e) => e[1] === pg); es.slice(0, -1).forEach((e) => { G.got[e[0]] = 1; }); delete G.got[es[es.length - 1][0]]; const r = T.gaLog(es[es.length - 1]); return r.got.join(' | '); }, pg);
  let got = await fill('finch');
  ok(await E(() => window.__T.gaPageDone('finch') && window.__T.S.route.got.ga_finches), 'the finches page: complete, and a find');
  const ph1 = await E(() => { const G = window.__T.S.ga, n = G.photos; G.traps[2].at = Date.now() - 51 * 60e3; window.__T.gaTrap(2); return n; });
  ok(await E((ph1) => window.__T.S.ga.photos === ph1 + 2, ph1), 'and every trap now takes two photos');
  await clean();
  const rats0 = await E(() => { const E2 = { rare: false }; window.__T.REVS.rats.start(E2); return E2.tails.length; });
  const crows0 = await E(() => { const T = window.__T, E2 = { rare: false }; T.S.prestige = 7; T.REVS.crows.start(E2); return E2.stay; });
  got = await fill('bird');
  ok(await E(() => window.__T.gaOwls() && window.__T.S.route.got.ga_birds) && /owl boxes/.test(got), 'the birds and reptiles page: owl boxes and hawk perches for your farms');
  ok(await E(() => { const E2 = { rare: false }; window.__T.REVS.rats.start(E2); return E2.tails.length; }) === 2 && rats0 === 3, 'storehouse rats: two holes to trap instead of three');
  ok(await E(() => { const E2 = { rare: false }; window.__T.REVS.crows.start(E2); return E2.stay; }) === 1 && crows0 === 3, 'the crow flock: one stays after the scarecrow instead of three');
  const cup0 = await E(() => window.__T.shadeCup(12));
  got = await fill('plant');
  ok(await E((c0) => Math.abs(window.__T.shadeCup(12) - c0 * 1.1) < 1e-9, cup0) && await E(() => window.__T.S.route.got.ga_plants), 'the plants page: your farms\' shade trees count 10% more towards cup score');
  got = await fill('fossil');
  ok(await E(() => window.__T.S.rev.show.fossils === true && window.__T.REV_COSM.fossils.own() && window.__T.S.route.got.ga_fossils), 'the fossils page: a fossil display for your farms');
  await E(() => window.__T.act('revshow:fossils'));
  ok(await E(() => window.__T.S.rev.show.fossils === false), 'and you can hide it again');
  await E(() => window.__T.act('revshow:fossils'));
  got = await fill('curio');
  ok(await E(() => window.__T.S.hats.ev_ga_field && window.__T.S.route.got.ga_curios), 'the curios page: Dr. Inés\'s field hat for your pickers');
  ok(await E(() => window.__T.gaFound() === 46), 'the whole field guide');
  await clean();

  /* field notes by rarity */
  ok(await E(() => { const T = window.__T, G = T.S.ga, e = T.GA_BY.dove; delete G.got.dove; const p0 = T.S.points; const r = T.gaLog(e); const p1 = T.S.points; const r2 = T.gaLog(e); return r.isNew && r.pts === Math.max(100, Math.round(T.rateX * 5)) && !r2.isNew && r2.pts === Math.max(20, Math.round(T.rateX)) && T.S.points - p1 === r2.pts && p1 - p0 === r.pts; }), 'a field note: 5 minutes of your farm\'s know-how for a new common entry, a minute for a repeat');

  /* levels */
  const lvTo = (n) => E((n) => { const T = window.__T, G = T.S.ga; while (G.lv < n) T.isleXp('ga', T.isleNeed(G.lv) - G.xp); }, n);
  await lvTo(5);
  ok(await E(() => window.__T.gaTrackMs() === 25 * 60e3), 'level 5: fresh tracks every 25 minutes');
  await lvTo(10);
  ok(await E(() => window.__T.gaTrapN() === 6), 'level 10: six traps');
  await lvTo(15);
  ok(await E(() => window.__T.S.route.got.ga_l15), 'level 15: a find for the level');
  await E(() => { const T = window.__T, G = T.S.ga; G.tracks = 1; T.gaTrailStart(); });
  await tapMap(ines[0], ines[1]);
  ok(await E(() => window.__T.S.ga.tr.hint && window.__T.S.ga.tr.used), 'level 15: once a trail, Dr. Inés points out the right sign');
  await E(() => { const tr = window.__T.S.ga.tr; tr.hint = false; }); await tapMap(ines[0], ines[1]);
  ok(await E(() => !window.__T.S.ga.tr.hint), 'only once a trail');
  await E(() => { window.__T.S.ga.tr = null; });
  await lvTo(20);
  ok(await E(() => window.__T.gaTrapN() === 8), 'level 20: eight traps');
  await lvTo(25);
  ok(await E(() => window.__T.gaDevMs() === 40 * 60e3), 'level 25: photos in 40 minutes');
  await lvTo(30);
  ok(await E(() => window.__T.S.sitems.title['ga:nat'] && window.__T.titleText('ga:nat') === 'Naturalist' && window.__T.S.route.got.ga_l30), 'level 30: the "Naturalist" title, and the level find');

  /* photo postcards */
  ok(await E(() => { const T = window.__T, c = T.gaCards(); return c.length === 3 && c.every((k) => /^g_/.test(k)) && T.cardOf('g_owl')[1] === 'ga_owl' && /Short-eared owl/.test(T.cardOf('g_owl')[0]) && T.cardOf('lovely')[0] === 'What a lovely farm!'; }), 'your three rarest photos can ride a Cheers as postcards');

  /* the page, "Where to?", a reload */
  await E(() => { const T = window.__T; T.goIsle('ga'); T.setTab('farm'); });
  for (const [sub, pg] of [['high'], ['guide', 'finch'], ['guide', 'bird'], ['guide', 'plant'], ['guide', 'fossil'], ['guide', 'curio'], ['log']]) {
    await E(([s, pg]) => { window.__T.S.gaSub = s; if (pg) window.__T.S.gaPage = pg; window.__T.renderPanel(); }, [sub, pg]); await g.waitForTimeout(80);
    ok(await E(() => { const t = document.getElementById('panel').innerText; return t.length > 200 && !/undefined|NaN/.test(t); }), 'the Galápagos page, ' + sub + (pg ? ' (' + pg + ')' : '') + ', reads cleanly');
  }
  await clean(); await E(() => window.__T.setTab('farm', true)); await g.waitForTimeout(150);
  await g.click('#locTap'); await g.waitForTimeout(200);
  ok(await E(() => !!document.querySelector('#modalCard [data-act="goplace:ga"]')), '"Where to?" lists Galápagos');
  await clean();
  if (shots) { await E(() => { const T = window.__T, G = T.S.ga; G.tracks = 1; T.gaTrailStart(); G.traps[3].at = 0; G.traps[5].at = Date.now() - 3 * 3600e3; }); await g.waitForTimeout(300); await g.screenshot({ path: shots + '/galapagos.png' }); await E(() => { window.__T.S.ga.tr = null; }); }
  await E(() => { const T = window.__T; T.S.ga.traps[0].at = 12345; T.save(); });
  await g.reload(); await g.waitForTimeout(1200);
  ok(await E(() => { const G = window.__T.S.ga; return G && G.lv === 30 && G.traps[0].at === 12345 && window.__T.gaFound() === 46; }), 'a reload keeps the camp, its traps and the guide');

  /* how long the guide takes: about 15 photos and 4 trails a day, as the drop-rate plan assumes */
  const sim = await E(() => {
    const T = window.__T, S = T.S, keep = S.ga, days = [];
    for (let run = 0; run < 40; run++) {
      S.ga = T.gaFresh(); let d = 0;
      while (T.gaFound() < 46 && d < 120) { d += 1; for (let k = 0; k < 15; k++) { const e = T.gaRoll('photo'); S.ga.got[e[0]] = 1; } for (let k = 0; k < 4; k++) { const e = T.gaRoll('trail'); S.ga.got[e[0]] = 1; } }
      days.push(d);
    }
    S.ga = keep; days.sort((a, b) => a - b); return { median: days[20], slow: days[36], max: days[39] };
  });
  console.log('  the field guide, full in: median', sim.median, 'days · 9 in 10 by', sim.slow, '· slowest', sim.max);
  ok(sim.median >= 14 && sim.median <= 35, 'the whole guide takes about 3 to 4 weeks at the expected pace (median ' + sim.median + ' days)');
  ok(sim.max <= 45, 'and never much more than 6 weeks, thanks to the guarantees (slowest ' + sim.max + ' days)');
  ok(!errs.length, 'no page errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  console.log(pass + ' passed, ' + fail + ' failed');
  await b.close(); process.exit(fail ? 1 : 0);
})();
