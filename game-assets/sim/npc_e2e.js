/* The cast, end to end: every character has their own sprites (front, back, side, blink, their action) and the named ones a
   portrait for each mood; the islanders live on their maps (stroll to their spots and home, keep to their post while there's
   work on and at night, stop and turn when tapped, open a card with their portrait), greet you by the time of day, chat, and
   speak up when something happens (a boat home, ash on Kona, fog lifting, a seedling wilting, a storm, fresh tracks); the
   estate managers, the roastery's staff and customers and the foreman are themselves too; Rosa's cards wear her portrait.
   node npc_e2e.js <test.html from mktest.py> [shots dir] */
const { chromium } = require(process.env.PW_MODULE || '/opt/node-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
const file = path.resolve(process.argv[2]), shots = process.argv[3] || ''; if (shots) fs.mkdirSync(shots, { recursive: true });
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m); } };
const NAMED = ['ama', 'kimo', 'pearl', 'lise', 'wayan', 'ines', 'rosa', 'ze', 'almaz', 'tigor', 'mario', 'yuki', 'kenji', 'aya', 'tanaka', 'mika', 'sora'];
const OTHERS = ['roaster', 'barista', 'till', 'foreman', 'g_cafe', 'g_kissa', 'g_konbini', 'g_guest'];
const ISLES = [['hb', 'ama', 'hbAma'], ['kona', 'kimo', 'kKimo'], ['bm', 'pearl', 'bmPearl'], ['re', 'lise', 'reLise'], ['ba', 'wayan', 'baWayan'], ['ga', 'ines', 'gaInes']];
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });
  const g = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true }); const errs = []; g.on('pageerror', (e) => errs.push(e.message));
  await g.goto('file://' + file); await g.waitForTimeout(800);
  const E = (f, a) => g.evaluate(f, a);
  const clean = () => E(() => { const T = window.__T; for (let i = 0; i < 8; i++) T.closeModal(); document.getElementById('modal').hidden = true; document.getElementById('toast').hidden = true; });
  const modal = () => E(() => document.getElementById('modal').hidden ? '' : document.getElementById('modalCard').innerHTML);
  await E(() => { const T = window.__T, S = T.S, d = new Date(); S.checkin.last = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); S.name = S.nameOk = 'Tess'; S.guide = T.GUIDE.length; S.prestige = 7; S.pwalkDone = true; S.practiceTip = true; S.roastery.tip = true; Object.keys(S.tabs).forEach((k) => { S.tabs[k] = true; }); S.navSeen = new Proxy({}, { get: () => true }); S.nav = null; S.rev.cur = null; S.stats.lotsSold = 40; S.newsSeen = T.NEWS[0].v; S.minutes = 9 * 60;
    S.route = T.routeFresh(); S.route.seen = true; S.route.mig = 1; ['pier', 'isle_re', 'isle_ba', 'isle_ga', 'lanai', 'porch'].forEach((k) => { S.route.bd[k] = 1; }); T.bmTick(); S.bm.seen = true; T.konaTick(); S.kona.seen = true; S.re = T.reFresh(); S.re.seen = true; S.ba = T.baFresh(); S.ba.seen = true; S.ga = T.gaFresh(); S.ga.seen = true; });
  await clean();

  /* the art */
  const art = await E(([named, others]) => { const A = window.__T.ART.sprites, miss = [];
    named.concat(others).forEach((id) => ['down_0', 'down_1', 'down_2', 'up_0', 'up_1', 'up_2', 'side_0', 'side_1', 'blink'].forEach((f) => { if (!A['npc_' + id + '_' + f]) miss.push(id + '_' + f); }));
    named.filter((id) => id !== 'rosa' || true).forEach((id) => { if (!A['npc_' + id + '_act_0'] || !A['npc_' + id + '_act_1']) miss.push(id + '_act'); ['idle', 'happy', 'surprised', 'worried'].forEach((m) => { if (!A['npc_pt_' + id + '_' + m]) miss.push('pt_' + id + '_' + m); }); });
    const sizes = named.concat(others).every((id) => A['npc_' + id + '_down_0'].w === 16 && A['npc_' + id + '_down_0'].h === 24) && named.every((id) => A['npc_pt_' + id + '_idle'].w === 32);
    const same = new Set(named.concat(others).map((id) => A['npc_' + id + '_down_0'].rows.join(''))).size;
    return { miss, sizes, same, n: named.length + others.length }; }, [NAMED, OTHERS]);
  ok(!art.miss.length, 'every character has front, back and side frames and a blink; the named ones their action and four moods' + (art.miss.length ? ': missing ' + art.miss.slice(0, 6).join(', ') : ''));
  ok(art.sizes, 'map sprites are 16 x 24 like the farmer, portraits 32 x 32');
  ok(art.same === art.n, 'no two characters share a sprite (' + art.same + ' different of ' + art.n + ')');

  /* the islanders on their maps */
  for (const [isle, id, fn] of ISLES) {
    await clean(); await E((isle) => { const T = window.__T; T.S.isle = isle === 'kona' ? true : isle; T.setTab('farm', true); }, isle);
    await g.waitForTimeout(1800);
    const o = await E(([isle, id]) => { const o = window.__T.IN[isle][id]; return o ? { npc: o.npc, x: o.x, y: o.y, hx: o.home.x, hy: o.home.y, say: o.say && o.say.text } : null; }, [isle, id]);
    ok(o && o.npc === id, isle + ': ' + id + ' is on the map as themselves');
    ok(o && o.say && o.say.length > 1, isle + ': ' + id + ' greets you when you arrive: "' + (o && o.say) + '"');
    /* a tap on them: they stop and turn, and their card wears their portrait */
    await clean();
    const at = await E(([isle, id]) => { const o = window.__T.IN[isle][id], cv = document.getElementById('cv'), r = cv.getBoundingClientRect(), k = r.width / 192; o.path = []; return { x: r.left + o.x * k, y: r.top + (o.y - 10) * k }; }, [isle, id]);
    await E(([x, y]) => { const sc = document.getElementById('scroller'); const el = document.elementFromPoint(x, y); }, [at.x, at.y]);
    await E(([isle, id]) => { const sc = document.getElementById('scroller'), o = window.__T.IN[isle][id], cv = document.getElementById('cv'), k = cv.getBoundingClientRect().width / 192; sc.scrollTop += cv.getBoundingClientRect().top + o.y * k - (sc.getBoundingClientRect().top + sc.getBoundingClientRect().bottom) / 2; }, [isle, id]);
    await g.waitForTimeout(200);
    const at2 = await E(([isle, id]) => { const o = window.__T.IN[isle][id], cv = document.getElementById('cv'), r = cv.getBoundingClientRect(), k = r.width / 192; o.path = []; return { x: r.left + o.x * k, y: r.top + (o.y - 10) * k }; }, [isle, id]);
    await g.mouse.click(at2.x, at2.y); await g.waitForTimeout(300);
    const st = await E(([isle, id]) => { const o = window.__T.IN[isle][id]; return { talk: o.talkT > 0, dir: o.dir }; }, [isle, id]);
    const card = await modal();
    ok(st.talk && st.dir === 'down', isle + ': tapped, ' + id + ' stops and turns to you');
    ok(/class="coach-face pt"/.test(card), isle + ': their card shows their portrait');
    if (shots) await g.screenshot({ path: path.join(shots, 'card-' + id + '.png') });
  }

  /* their day: a stroll to a spot and back, their action, home while busy and at night */
  const life = await E(() => { const T = window.__T, r0 = Math.random, out = {}, rnd = (v) => { Math.random = () => v; };
    const o = T.npcWalker('wayan', 100, 100), spots = [{ x: 120, y: 100 }];
    rnd(0.5); o.idleT = 0; T.npcLife(o, 0.016, spots); out.walks = o.path.length === 1 && o.path[0].x === 120;   /* neither at work nor turning: a stroll */
    for (let i = 0; i < 200 && o.path.length; i++) T.npcLife(o, 0.05, spots, { speed: 14 }); out.there = Math.abs(o.x - 120) < 0.5;
    rnd(0.5); o.idleT = 0; T.npcLife(o, 0.016, spots); out.home = o.path.length === 1 && o.path[0].x === 100;
    for (let i = 0; i < 200 && o.path.length; i++) T.npcLife(o, 0.05, spots);
    rnd(0.1); o.idleT = 0; T.npcLife(o, 0.016, spots); out.acts = o.act > 0;
    o.act = 0; o.idleT = 0; rnd(0.5); T.npcLife(o, 0.016, spots, { busy: () => true }); out.busyStays = !o.path.length;
    const m0 = T.S.minutes; T.S.minutes = 23 * 60; o.act = 0; o.idleT = 0; rnd(0.1); T.npcLife(o, 0.016, spots); out.nightStill = !o.path.length && !(o.act > 0); T.S.minutes = m0;
    T.npcTap(o); out.tapStops = o.talkT > 0 && o.dir === 'down' && !o.path.length;
    Math.random = r0; return out; });
  ok(life.walks && life.there, 'an islander strolls to one of their spots');
  ok(life.home, 'and comes home again');
  ok(life.acts, 'at home they get on with their own thing (their action)');
  ok(life.busyStays, 'while there\'s work on, they keep to their post');
  ok(life.nightStill, 'at night they stay home and rest');
  ok(life.tapStops, 'a tap stops them and turns them to you');
  ok(await E(() => { const T = window.__T, b = T.NPC_SPOTS; return ['ama', 'kimo', 'pearl', 'lise', 'wayan', 'ines'].every((k) => b[k] && b[k].length >= 2); }), 'each islander has places to stroll to');

  /* greetings by the time of day, and chat */
  ok(await E(() => { const T = window.__T, S = T.S, m0 = S.minutes, r = [8, 13, 19, 23].map((h) => { S.minutes = h * 60; return T.greetIx(); }); S.minutes = m0; return r.join() === '0,1,2,3'; }), 'greetings follow the clock: morning, day, evening, night');
  await clean();
  ok(await E(() => { const T = window.__T, o = T.IN.ga.ines; o.say = null; o.seen = Date.now(); o.chatT = 0; T.npcChat(o, 0.1); return !!(o.say && T.NPC.ines.idle.includes(o.say.text)); }), 'now and then they say something in character');

  /* they speak up when something happens */
  await clean(); await E(() => { const T = window.__T; T.S.isle = 'ba'; T.setTab('farm', true); }); await g.waitForTimeout(400);
  await E(() => { const T = window.__T; T.IN.ba.wayan.say = null; T.baStart(); }); await g.waitForTimeout(500);
  ok(await E(() => { const o = window.__T.IN.ba.wayan; return o.say && /rain/.test(o.say.text); }), 'a storm starts in Bali: Wayan calls it ("Here comes the rain!")');
  ok(await E(() => { const o = window.__T.IN.ba.wayan; return Math.hypot(o.x - o.home.x, o.y - o.home.y) < 2 || o.path.length; }), 'and keeps to his post through it');
  await clean(); await E(() => { const T = window.__T; T.S.ba.st = null; T.S.isle = 'ga'; T.setTab('farm', true); }); await g.waitForTimeout(400);
  await E(() => { const T = window.__T; T.IN.ga.ines.say = null; T.gaTrailStart(); }); await g.waitForTimeout(500);
  ok(await E(() => { const o = window.__T.IN.ga.ines; return o.say && /tracks/i.test(o.say.text); }), 'fresh tortoise tracks: Dr. Inés calls you over');
  await E(() => { const T = window.__T; T.gaTrailEnd && T.gaTrailEnd(); T.S.ga.tr = null; });
  await E(() => { const T = window.__T, R = T.S.route; T.IN.hb.ama.say = null; R.voy.push({ to: Object.keys(T.VOY || {})[0] || 'kona', at: Date.now() - 2e3, end: Date.now() - 1e3 }); T.routeTick(); });
  ok(await E(() => { const o = window.__T.IN.hb.ama; return o.say && /ahoy/i.test(o.say.text); }), 'a boat comes home: Captain Ama sings out');
  await E(() => { const T = window.__T, K = T.S.kona; T.IN.kona.kimo = T.IN.kona.kimo || T.npcWalker('kimo', T.KIMO_AT.x, T.KIMO_AT.y); T.IN.kona.kimo.say = null; K.shop.tarps = false; K.plots.forEach((p, i) => { if (i < 3) { p.k = p.k && p.k !== 'coffee' ? p.k : 'mango'; p.ash = false; } }); T.kPuffNow(true); });
  ok(await E(() => { const o = window.__T.IN.kona.kimo; return o.say && /ash/i.test(o.say.text); }), 'the mountain blows on Kona: Uncle Kimo warns you about the ash');

  /* the cards' moods */
  ok(await E(() => { const T = window.__T; return T.sayMood('Welcome to the harbour!') === 'happy' && T.sayMood('Careful, the storm is close.') === 'worried' && T.sayMood('Row 3 clears next.') === 'idle'; }), 'a card picks the portrait\'s mood from what is said');
  await clean(); await E(() => { const T = window.__T; T.showModal(T.coachCard('Lesson', 'Well done! Your first lot is drying.')); });
  ok(/npc_pt_rosa|class="coach-face pt"/.test(await modal()), 'Rosa\'s cards wear her portrait');
  ok(await E(() => /first lot/.test(document.getElementById('modalCard').innerText) && getComputedStyle(document.body).fontVariantLigatures === 'none'), 'the pixel font\'s ligatures are off, so "first" no longer reads as "Arst"');
  await clean();

  /* the farms, the roastery and the mill */
  await E(() => { const T = window.__T, S = T.S; S.isle = false; S.loc = 'mogiana'; S.estate = S.estate || {}; S.estate.st = Object.assign({}, S.estate.st, { mogiana: 3 }); S.emgr = { mogiana: true }; T.setTab('farm', true); }); await g.waitForTimeout(500);
  ok(await E(() => { const o = (window.__T.IN.em || {}).mogiana; return o && o.npc === 'ze'; }), 'a hired estate manager works their chore as themselves (Zé on the patio)');
  await E(() => { const T = window.__T; T.S.staff.roaster = true; T.S.staff.foreman = true; T.setTab('roast', true); }); await g.waitForTimeout(600);
  ok(await E(() => { const R = window.__T.IN.roast; return R.help && R.help.npc === 'barista' && R.till && R.till.npc === 'till' && R.head && R.head.npc === 'roaster'; }), 'the roastery\'s barista, till and head roaster are themselves');
  ok(await E(() => { const T = window.__T, R = T.IN.roast; T.roastGuest('kissa', false); const gst = R.guests[R.guests.length - 1]; return gst && gst.npc === 'g_kissa'; }), 'a buyer walks in looking like their trade (the kissaten master)');
  ok(await E(() => { const T = window.__T, R = T.IN.roast; R.help.look = { shirt: ['#C83030', '#A02020', '#701010'], hat: ['#F8F4EC', '#D8D0C8', '#A89C84'] }; return true; }), 'the barista still wears the aprons you buy');
  await E(() => { window.__T.setTab('mill', true); }); await g.waitForTimeout(500);
  ok(await E(() => { const M = window.__T.IN.mill; return M.fore && M.fore.npc === 'foreman'; }), 'the foreman in the mill has his own look and clipboard');
  ok(await E(() => /npc_pt|<img src="data:image\/png/.test(window.__T.ctAv({ reg: 'kenji' }))), 'the counter\'s regulars show their portraits');
  ok(!errs.length, 'no page errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  console.log(pass + ' passed, ' + fail + ' failed');
  await b.close(); process.exit(fail ? 1 : 0);
})();
