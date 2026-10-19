/* Tests for the community features: Harvest Day, cooperatives, the Co-op Derby and the Cup of Excellence. Run: npm test */
const test = require("node:test");
const assert = require("node:assert");
const G = require("../lib/game");
const C = require("../lib/community");
const account = require("../functions/game-account");
const score = require("../functions/game-score");
const harvest = require("../functions/game-harvest");
const coop = require("../functions/game-coop");
const D = require("../lib/derby");
const E = require("../lib/coe");
const coe = require("../functions/game-coe");

let store, clock, harvestFile;
const deps = () => ({ store, now: clock, harvest: harvestFile });
for (const f of [account, score, harvest, coop, coe]) Object.defineProperty(f, "__deps", { get: deps, configurable: true });
const call = async (fn, method, body, auth, query) => {
  const r = await fn.handler({ httpMethod: method, body: body === undefined ? undefined : JSON.stringify(body), headers: auth ? { authorization: "Bearer " + auth } : {}, queryStringParameters: query || {} });
  return { status: r.statusCode, body: JSON.parse(r.body) };
};
const newPlayer = async (name, prestige) => {
  const r = await call(account, "POST", { name: name || "Tester" }), a = r.body.player + "." + r.body.token;
  await call(score, "POST", { name: name || "Tester", prestige: 0, seasonP: 0, level: 1, points: 0 }, a);
  if (prestige) { const row = await store.get("scores/" + r.body.player); row.prestige = prestige; await store.set("scores/" + r.body.player, row); }
  return a;
};
test.beforeEach(() => { store = G.memoryStore(); clock = Date.parse("2026-10-27T03:00:00Z"); harvestFile = { days: [] }; });

test("weeks run Monday to Monday in Japan time", () => {
  assert.equal(C.weekKey(Date.parse("2026-10-25T14:59:00Z")), "2026-10-19", "Sunday 23:59 JST is still last week");
  assert.equal(C.weekKey(Date.parse("2026-10-25T15:00:00Z")), "2026-10-26", "Monday 00:00 JST starts a new week");
  assert.equal(C.prevWeek("2026-10-26"), "2026-10-19");
});

test("harvest day: the first weekend of each month, rotating goals, and a file entry replaces that month's", () => {
  const nov = C.harvestFor(Date.parse("2026-10-27T03:00:00Z"));
  assert.equal(nov.id, "2026-11"); assert.equal(new Date(nov.starts).toISOString(), "2026-11-07T01:00:00.000Z", "Saturday 7 November, 10:00 JST");
  assert.equal(nov.ends - nov.starts, 2 * C.DAY);
  assert.equal(C.harvestFor(nov.starts + 3600e3).id, "2026-11", "during the weekend it's the current one");
  assert.equal(C.harvestFor(nov.ends + 1).id, "2026-12", "after it, the next month's");
  assert.notDeepEqual(C.harvestFor(nov.ends + 1).unit + C.harvestFor(nov.ends + 1).method, nov.unit + nov.method, "goals rotate");
  const file = { days: [{ id: "strawberry", name: "Strawberry weekend", text: "Deliver strawberry lots", unit: "lots", method: "strawberry", starts: "2026-11-06T10:00:00+09:00", ends: "2026-11-08T10:00:00+09:00", target: 999 }] };
  const m = C.harvestFor(Date.parse("2026-10-27T03:00:00Z"), file);
  assert.equal(m.id, "strawberry"); assert.equal(m.target, 999);
});

test("harvest day: the goal scales with players, contributions are rate-capped, and everyone who helped can claim", async () => {
  const a = await newPlayer("Ana"), b = await newPlayer("Ben"), c = await newPlayer("Cai");
  const day = C.harvestFor(clock);
  let g = await call(harvest, "GET", undefined, a);
  assert.equal(g.body.day.id, day.id); assert.equal(g.body.day.live, false); assert.equal(g.body.day.target, null, "the goal is set a few days before");
  assert.equal((await call(harvest, "POST", { id: day.id, n: 5 }, a)).body.error, "not_live");
  clock = day.starts - 2 * C.DAY;
  g = await call(harvest, "GET", undefined, a);
  const u = C.HARVEST_UNIT[day.unit];
  assert.equal(g.body.day.target, Math.max(u.min, Math.round(3 * u.perPlayer / 10) * 10), "three active players");
  clock = day.starts + 60e3;
  const huge = await call(harvest, "POST", { id: day.id, n: 1e6 }, a);
  assert.ok(huge.body.accepted < 1e6 && huge.body.accepted === C.harvestAllowed(day.unit, 0, day.starts, clock), "a made-up count is capped");
  assert.equal((await call(harvest, "POST", { id: "1999-01", n: 5 }, a)).status, 409);
  clock += 120e3;
  const again = await call(harvest, "POST", { id: day.id, n: huge.body.mine }, a);
  assert.equal(again.body.accepted, 0, "only the rise counts");
  assert.equal((await call(harvest, "POST", { id: day.id, claim: true }, a)).body.error, "not_reached");
  // reach the goal over the weekend
  const target = g.body.day.target;
  for (let i = 0; i < 40 && (await call(harvest, "GET")).body.day.total < target; i++) { clock += 180 * 60e3; const m = (await call(harvest, "GET", undefined, b)).body.mine.n; await call(harvest, "POST", { id: day.id, n: m + 400 }, b); }
  clock += 61e3;
  const done = await call(harvest, "GET", undefined, b);
  assert.ok(done.body.day.reached, "goal reached"); assert.equal(done.body.day.players, 2);
  const first = await call(harvest, "POST", { id: day.id, claim: true }, a);
  assert.equal(first.body.reward, "decor", "the first reached Harvest Day gives the decoration");
  assert.equal((await call(harvest, "POST", { id: day.id, claim: true }, a)).body.error, "already_claimed");
  assert.equal((await call(harvest, "POST", { id: day.id, claim: true }, c)).body.error, "did_not_take_part");
});

test("co-ops: start one, join by code, find by prestige, up to 8, and leave", async () => {
  const a = await newPlayer("Ana", 2), b = await newPlayer("Ben", 2), c = await newPlayer("Cai", 6);
  assert.equal((await call(coop, "GET", undefined, a)).body.coop, null);
  assert.equal((await call(coop, "POST", { act: "create", name: "<b>" }, a)).body.error, "bad_name");
  const made = await call(coop, "POST", { act: "create", name: "Las Nubes" }, a);
  assert.equal(made.status, 200); assert.equal(made.body.coop.name, "Las Nubes"); assert.match(made.body.coop.code, /^[A-Z2-9]{6}$/);
  assert.equal((await call(coop, "POST", { act: "create", name: "Again" }, a)).body.error, "already_in_a_coop");
  const joined = await call(coop, "POST", { act: "join", code: made.body.coop.code.toLowerCase() }, b);
  assert.equal(joined.body.coop.members.length, 2); assert.ok(joined.body.coop.members.find((m) => m.you).name === "Ben");
  assert.ok(!JSON.stringify(joined.body).includes("p_"), "player ids never reach other players");
  const found = await call(coop, "POST", { act: "find" }, c);
  assert.equal(found.body.coop.name, "Las Nubes", "the only open co-op");
  for (let i = 0; i < 5; i++) await call(coop, "POST", { act: "join", code: made.body.coop.code }, await newPlayer("F" + i));
  assert.equal((await call(coop, "POST", { act: "join", code: made.body.coop.code }, await newPlayer("Late"))).body.error, "coop_full");
  const solo = await call(coop, "POST", { act: "find" }, await newPlayer("Solo"));
  assert.match(solo.body.coop.name, /^Cooperativa /, "a full co-op makes find start a new one");
  assert.equal((await call(coop, "POST", { act: "leave" }, c)).body.coop, null);
  assert.equal((await call(coop, "GET", undefined, a)).body.coop.members.length, 7);
});

test("co-ops: the weekly order scales with members, counts only rises, and pays tiers to members who helped", async () => {
  const a = await newPlayer("Ana"), b = await newPlayer("Ben"), c = await newPlayer("Cai");
  const made = (await call(coop, "POST", { act: "create", name: "Cerrado" }, a)).body.coop;
  await call(coop, "POST", { act: "join", code: made.code }, b); await call(coop, "POST", { act: "join", code: made.code }, c);
  let v = (await call(coop, "GET", undefined, a)).body.coop;
  assert.equal(v.order.target, C.COOP_MIN_TARGET, "three new members: the smallest order");
  assert.equal(v.order.process, C.coopProcess(v.order.week));
  const wk = v.order.week;
  assert.equal((await call(coop, "POST", { act: "claim", tier: 0 }, a)).body.error, "not_reached");
  clock += 3600e3;
  v = (await call(coop, "POST", { act: "sync", week: wk, kg: 2000, est: 9000 }, a)).body.coop;
  assert.equal(v.order.total, 2000);
  v = (await call(coop, "POST", { act: "sync", week: wk, kg: 1500 }, a)).body.coop;
  assert.equal(v.order.total, 2000, "a lower number never takes anything away");
  clock += 60e3;
  v = (await call(coop, "POST", { act: "sync", week: wk, kg: 9e9 }, b)).body.coop;
  assert.ok(v.order.total < 9e9 && v.order.total > 2000, "a made-up number is capped");
  const claim = await call(coop, "POST", { act: "claim", tier: 3 }, a);
  assert.equal(claim.body.cranes, 10); assert.equal(claim.body.full, true);
  assert.equal((await call(coop, "POST", { act: "claim", tier: 3 }, a)).body.error, "already_claimed");
  assert.equal((await call(coop, "POST", { act: "claim", tier: 0 }, c)).body.error, "did_not_help");
  // next week the order is sized from last week's shares, and the new member's estimate
  clock += 7 * C.DAY;
  v = (await call(coop, "GET", undefined, a)).body.coop;
  assert.notEqual(v.order.week, wk);
  const last = await store.get("coops/" + (await store.get("players/" + a.split(".")[0])).coop + "/week/" + wk);
  assert.equal(v.order.target, Math.round((last.shares[a.split(".")[0]] + last.shares[b.split(".")[0]] + C.COOP_NEW_BASE) / 100) * 100);
});

test("co-ops: stickers only from the list, helps once a day per mate, and the helped farmer collects them", async () => {
  const a = await newPlayer("Ana"), b = await newPlayer("Ben");
  const made = (await call(coop, "POST", { act: "create", name: "Pergola" }, a)).body.coop;
  await call(coop, "POST", { act: "join", code: made.code }, b);
  assert.equal((await call(coop, "POST", { act: "sticker", id: "<script>" }, a)).body.error, "bad_sticker");
  const st = await call(coop, "POST", { act: "sticker", id: "thanks" }, a);
  assert.equal(st.body.coop.feed.pop().s, "thanks");
  assert.equal((await call(coop, "POST", { act: "sticker", id: "nice" }, a)).body.error, "too_soon");
  const v = (await call(coop, "GET", undefined, a)).body.coop, benAt = v.members.findIndex((m) => m.name === "Ben"), meAt = v.members.findIndex((m) => m.you);
  assert.equal((await call(coop, "POST", { act: "help", i: meAt }, a)).body.error, "bad_mate");
  const h = await call(coop, "POST", { act: "help", i: benAt }, a);
  assert.equal(h.body.coop.members[benAt].helped, true);
  assert.equal((await call(coop, "POST", { act: "help", i: benAt }, a)).body.error, "already_today");
  assert.equal((await call(coop, "GET", undefined, b)).body.coop.helpsIn, 1);
  const got = await call(coop, "POST", { act: "takehelp" }, b);
  assert.equal(got.body.n, 1); assert.deepEqual(got.body.from, ["Ana"]);
  assert.equal((await call(coop, "POST", { act: "takehelp" }, b)).body.n, 0, "collected once");
  clock += C.DAY;
  assert.equal((await call(coop, "POST", { act: "help", i: benAt }, a)).status, 200, "again the next day");
});

test("derby: waits for enough co-ops, groups them, scores capped task counts, and moves leagues at the week's end", async () => {
  const lead = [];
  for (let i = 0; i < D.DERBY_MIN_COOPS - 1; i++) {
    const a = await newPlayer("L" + i), b = await newPlayer("M" + i), made = (await call(coop, "POST", { act: "create", name: "Coop " + i }, a)).body.coop;
    await call(coop, "POST", { act: "join", code: made.code }, b); lead.push(a);
  }
  let v = (await call(coop, "GET", undefined, lead[0])).body.coop;
  assert.equal(v.derby.on, false); assert.equal(v.derby.have, D.DERBY_MIN_COOPS - 1);
  const a = await newPlayer("Last"), b = await newPlayer("Last2"), made = (await call(coop, "POST", { act: "create", name: "Coop last" }, a)).body.coop;
  await call(coop, "POST", { act: "join", code: made.code }, b); lead.push(a);
  v = (await call(coop, "GET", undefined, lead[0])).body.coop;
  assert.equal(v.derby.on, true, "the 20th co-op starts it"); assert.equal(v.derby.group.length, D.GROUP, "two groups of 10"); assert.equal(v.derby.board.length, 4);
  const x = await newPlayer("X"), y = await newPlayer("Y"), late = (await call(coop, "POST", { act: "create", name: "Coop late" }, x)).body.coop;
  await call(coop, "POST", { act: "join", code: late.code }, y);
  assert.equal((await call(coop, "GET", undefined, x)).body.coop.derby.joinsNext, true, "a co-op formed mid-week joins next week");
  const k = v.derby.board[0], counts = {}; counts[k.id] = 1e6;
  v = (await call(coop, "POST", { act: "sync", week: v.derby.week, kg: 0, derby: counts }, lead[0])).body.coop;
  assert.equal(v.derby.board[0].mine, k.cap, "capped per member"); assert.equal(v.derby.group[0].you, true); assert.equal(v.derby.group[0].pts, k.cap * k.pts);
  clock += 7 * C.DAY;
  const next = (await call(coop, "GET", undefined, x)).body.coop.derby;
  assert.equal(next.on, true, "the late co-op is grouped the next week"); assert.equal(next.group.length + 0 > 0, true);
  v = (await call(coop, "GET", undefined, lead[0])).body.coop;
  assert.equal(v.derby.last.rank, 1); assert.equal(v.derby.last.to, 2, "first place moves up a league"); assert.equal(v.derby.last.canClaim, true);
  const cl = await call(coop, "POST", { act: "derbyclaim" }, lead[0]);
  assert.equal(cl.body.cranes, 8);
  assert.equal((await call(coop, "POST", { act: "derbyclaim" }, lead[0])).body.error, "already_claimed");
});

test("cup of excellence: one brief for everyone, scores worked out on the server, three attempts, best counts", async () => {
  const a = await newPlayer("Ana", 7), b = await newPlayer("Ben", 7), newbie = await newPlayer("New", 1);
  const g = await call(coe, "GET", undefined, a), br = g.body.brief;
  assert.equal(br.vars.length, 3); assert.equal(br.methods.length, 3); assert.deepEqual(br, E.briefFor(C.weekKey(clock)), "the same brief for everyone this week");
  assert.notDeepEqual(E.briefFor(C.prevWeek(C.weekKey(clock))), br, "a new brief each week");
  assert.equal((await call(coe, "POST", { act: "start", v: br.vars[0], m: br.methods[0], profile: "light" }, newbie)).body.error, "not_yet");
  assert.equal((await call(coe, "POST", { act: "start", v: "nope", m: br.methods[0], profile: "light" }, a)).body.error, "not_in_the_brief");
  const v = br.vars[0], m = br.methods[0], best = E.bestRoast(v, m);
  const st = await call(coe, "POST", { act: "start", v, m, profile: best }, a);
  assert.equal(st.body.n, 1); assert.deepEqual({ c: st.body.c, hw: st.body.hw }, E.crackWindow(C.weekKey(clock), 1, v));
  assert.equal((await call(coe, "POST", { act: "submit", n: 1, t: st.body.c }, a)).body.error, "too_quick", "can't tap before the roast got there");
  clock += st.body.c + 200;
  const sub = await call(coe, "POST", { act: "submit", n: 1, t: st.body.c }, a);
  assert.equal(sub.body.score.crack, 15, "a tap on the centre of the window"); assert.equal(sub.body.score.roast, 5);
  assert.equal(sub.body.score.total, E.scoreFor(C.weekKey(clock), 1, v, m, best, st.body.c).total);
  // a worse second attempt doesn't replace the best
  const st2 = await call(coe, "POST", { act: "start", v, m, profile: best === "light" ? "dark" : "light" }, a); clock += 9000;
  const sub2 = await call(coe, "POST", { act: "submit", n: 2, t: 100 }, a);
  assert.equal(sub2.body.score.crack, -5); assert.ok(sub2.body.score.early); assert.equal(sub2.body.mine.best, sub.body.score.total);
  await call(coe, "POST", { act: "start", v, m, profile: best }, a); clock += 9000; await call(coe, "POST", { act: "submit", n: 3, t: 5000 }, a);
  assert.equal((await call(coe, "POST", { act: "start", v, m, profile: best }, a)).body.error, "no_attempts_left");
  const sb = await call(coe, "POST", { act: "start", v, m, profile: best }, b); clock += 9000;
  await call(coe, "POST", { act: "submit", n: 1, t: 100 }, b);
  const board = (await call(coe, "GET", undefined, b)).body;
  assert.equal(board.board[0].name, "Ana"); assert.equal(board.mine.rank, 2); assert.equal(board.players, 2);
});

test("cup of excellence: the week's final places feed the Q grader rating and the Hall of Excellence", async () => {
  const a = await newPlayer("Ana", 7), b = await newPlayer("Ben", 7);
  for (let week = 0; week < 4; week++) {
    const br = (await call(coe, "GET", undefined, a)).body.brief, v = br.vars[0], m = br.methods[0];
    for (const [p, good] of [[a, true], [b, false]]) {
      const st = (await call(coe, "POST", { act: "start", v, m, profile: E.bestRoast(v, m) }, p)).body; clock += 9000;
      await call(coe, "POST", { act: "submit", n: st.n, t: good ? st.c : 50 }, p);
    }
    clock += 7 * C.DAY;
  }
  const g = (await call(coe, "GET", undefined, b)).body;
  assert.equal(g.hall[0].name, "Ana"); assert.equal(g.hall[0].rating, 1000, "first of two every week for four weeks");
  assert.equal(g.rating, 500); assert.equal(g.hallRank, 2); assert.equal(g.last.pct, 50);
  assert.equal(E.ratingFrom([100, 100]), 500, "two good weeks out of the last eight is half the way");
});
