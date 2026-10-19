/* Cooperatives: up to 8 farmers fill a weekly order together, send preset stickers (no free chat) and help each other's lots dry.
   GET  /.netlify/functions/game-coop                                  ->  { coop | null, week }   your co-op: members, this week's order, the sticker feed, helps waiting
   POST /.netlify/functions/game-coop  { act: "create", name }         ->  { coop }
   POST /.netlify/functions/game-coop  { act: "join", code }           ->  { coop }   (by invite code)
   POST /.netlify/functions/game-coop  { act: "find" }                 ->  { coop }   (an open co-op near your prestige, or a new one)
   POST /.netlify/functions/game-coop  { act: "leave" }                ->  { coop: null }
   POST /.netlify/functions/game-coop  { act: "sync", week, kg, est, derby } ->  { coop }   (kg: your green coffee of the week's process in all this week; only the rise counts, rate-capped)
   POST /.netlify/functions/game-coop  { act: "sticker", id }          ->  { coop }
   POST /.netlify/functions/game-coop  { act: "help", i }              ->  { coop }   (i: the mate's place in the member list; once a day per mate)
   POST /.netlify/functions/game-coop  { act: "takehelp" }             ->  { n, from }   (helps waiting for you; the game speeds up your drying lots)
   POST /.netlify/functions/game-coop  { act: "claim", tier }          ->  { cranes, full }   (a tier of this week's order, once per member who helped)
   POST /.netlify/functions/game-coop  { act: "derbyclaim" }           ->  { cranes }   (last week's Co-op Derby reward)
   The weekly order's size is the sum of each member's last week in the co-op (or their own estimate when they're new), so small and large co-ops both get a fair goal. */
const G = require("../lib/game");
const C = require("../lib/community");
const D = require("../lib/derby");

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const newCode = () => Array.from({ length: 6 }, () => CODE_CHARS[require("crypto").randomInt(CODE_CHARS.length)]).join("");
const STICKER_GAP_MS = 20e3, FEED_KEEP = 30;

async function scoreRow(store, id) { return (await store.get("scores/" + id)) || {}; }
async function index(store) { return (await store.get("coopidx")) || {}; }
async function reindex(store, coop) {   /* the list "find a co-op" and the Derby read: size and average prestige */
  const idx = await index(store);
  if (!coop.members.length) delete idx[coop.id];
  else { const rows = await Promise.all(coop.members.map((m) => scoreRow(store, m))); idx[coop.id] = { n: coop.members.length, p: rows.reduce((a, r) => a + (r.prestige || 0), 0) / rows.length, name: coop.name, league: coop.league || 1 }; }
  await store.set("coopidx", idx);
}
async function baseline(store, coop, pid, wk) {   /* what a member is expected to bring in a week */
  const last = await store.get("coops/" + coop.id + "/week/" + C.prevWeek(wk));
  const had = last && last.shares && last.shares[pid];
  if (had > 0) return had;
  const p = await store.get("players/" + pid);
  return Math.max(C.COOP_NEW_BASE, Math.floor((p && p.coopEst) || 0));
}
const orderSize = (base) => Math.max(C.COOP_MIN_TARGET, Math.round(base / 100) * 100);
async function weekOf(store, coop, wk) {   /* this week's order, made on first touch */
  const key = "coops/" + coop.id + "/week/" + wk; let w = await store.get(key);
  if (!w) {
    const bases = await Promise.all(coop.members.map((m) => baseline(store, coop, m, wk)));
    const base = bases.reduce((a, b) => a + b, 0);
    w = { week: wk, process: C.coopProcess(wk), base, target: orderSize(base), shares: {}, at: {}, claimed: {}, joined: coop.members.slice() };
    await store.set(key, w);
  }
  return w;
}
async function view(store, coop, me, now) {
  if (!coop) return null;
  const wk = C.weekKey(now), w = await weekOf(store, coop, wk), day = G.dayJST(now);
  const help = (await store.get("coops/" + coop.id + "/help/" + day)) || { pairs: [], inbox: {} };
  const feed = (await store.get("coops/" + coop.id + "/feed")) || { items: [] };
  const rows = await Promise.all(coop.members.map((m) => scoreRow(store, m)));
  const total = Object.values(w.shares).reduce((a, b) => a + b, 0);
  return {
    id: coop.id, name: coop.name, code: coop.code, league: coop.league || 1,
    members: coop.members.map((m, i) => ({ you: m === me.id, name: rows[i].name || "Farmer", look: rows[i].look || {}, prestige: rows[i].prestige || 0, level: rows[i].level || 1, share: Math.round(w.shares[m] || 0), seen: rows[i].at || 0, helped: help.pairs.includes(me.id + ">" + m), code: rows[i].code || "" })),
    order: { week: wk, ends: C.weekStart(wk) + 7 * C.DAY, process: w.process, target: w.target, total: Math.round(total), tiers: C.COOP_TIERS.map(([f, cr]) => ({ at: Math.round(w.target * f), cranes: cr })), claimed: w.claimed[me.id] || [] },
    feed: feed.items.slice(-12), helpsIn: help.inbox[me.id] || 0,
    derby: await D.derbyView(store, coop, me, now)
  };
}
async function joinCoop(store, me, coop, now) {
  coop.members.push(me.id); await store.set("coops/" + coop.id, coop);
  me.coop = coop.id; me.coopJoined = now; await G.savePlayer(store, me);
  const w = await store.get("coops/" + coop.id + "/week/" + C.weekKey(now));
  if (w && !w.joined.includes(me.id)) { w.base = (w.base || 0) + await baseline(store, coop, me.id, w.week); w.target = Math.max(w.target, orderSize(w.base)); w.joined.push(me.id); await store.set("coops/" + coop.id + "/week/" + w.week, w); }   /* a new member brings their share of the goal */
  await reindex(store, coop);
}
async function makeCoop(store, name) {
  let code; do { code = newCode(); } while (await store.get("coopcodes/" + code));
  const coop = { id: "c_" + require("crypto").randomBytes(6).toString("base64url"), name, code, members: [], league: 1, created: Date.now() };
  await store.set("coopcodes/" + code, coop.id);
  return coop;
}

exports.handler = async (event) => {
  const deps = exports.__deps;
  const store = G.stores(event, deps), now = (deps && deps.now) || Date.now();
  const me = await G.authed(event, store);
  if (!me) return G.json(401, { error: "sign_in" });
  let coop = me.coop ? await store.get("coops/" + me.coop) : null;
  if (coop && !coop.members.includes(me.id)) coop = null;
  if (event.httpMethod === "GET") return G.json(200, { coop: await view(store, coop, me, now), week: C.weekKey(now) });
  if (event.httpMethod !== "POST") return G.json(405, { error: "method_not_allowed" });
  const b = G.parse(event) || {};
  const act = b.act;
  if (act === "create" || act === "join" || act === "find") {
    if (coop) return G.json(422, { error: "already_in_a_coop" });
    let target = null;
    if (act === "create") {
      const name = C.cleanCoopName(b.name); if (!name) return G.json(422, { error: "bad_name" });
      target = await makeCoop(store, name);
    } else if (act === "join") {
      const id = await store.get("coopcodes/" + String(b.code || "").toUpperCase()); target = id && await store.get("coops/" + id);
      if (!target || !target.members.length) return G.json(404, { error: "no_coop" });
    } else {
      const mine = (await scoreRow(store, me.id)).prestige || 0, idx = await index(store);
      const pick = Object.entries(idx).filter(([, x]) => x.n < C.COOP_MAX).sort((a, b2) => Math.abs(a[1].p - mine) - Math.abs(b2[1].p - mine) || b2[1].n - a[1].n)[0];
      target = pick ? await store.get("coops/" + pick[0]) : await makeCoop(store, C.coopAutoName(Object.keys(idx).length));
    }
    if (target.members.length >= C.COOP_MAX) return G.json(422, { error: "coop_full" });
    await joinCoop(store, me, target, now);
    return G.json(200, { coop: await view(store, target, me, now) });
  }
  if (!coop) return G.json(422, { error: "not_in_a_coop" });
  if (act === "leave") {
    coop.members = coop.members.filter((m) => m !== me.id); await store.set("coops/" + coop.id, coop);
    delete me.coop; await G.savePlayer(store, me); await reindex(store, coop);
    return G.json(200, { coop: null });
  }
  if (act === "sync") {
    const wk = C.weekKey(now);
    if (b.est > 0) { me.coopEst = Math.min(1e9, Math.floor(b.est)); await G.savePlayer(store, me); }
    if (b.week === wk) {
      const w = await weekOf(store, coop, wk), had = w.shares[me.id] || 0, rise = Math.max(0, Math.floor(Number(b.kg) || 0) - had);
      const ok = Math.min(rise, C.coopAllowed(await baseline(store, coop, me.id, wk), w.at[me.id], now));
      if (ok > 0) { w.shares[me.id] = had + ok; w.at[me.id] = now; await store.set("coops/" + coop.id + "/week/" + wk, w); }
      await D.derbyAdd(store, coop, me, b.derby, now);
    }
    return G.json(200, { coop: await view(store, coop, me, now) });
  }
  if (act === "sticker") {
    if (!C.STICKERS.includes(b.id)) return G.json(422, { error: "bad_sticker" });
    const key = "coops/" + coop.id + "/feed", feed = (await store.get(key)) || { items: [] };
    const last = feed.items.filter((x) => x.by === me.id).pop();
    if (last && now - last.at < STICKER_GAP_MS) return G.json(429, { error: "too_soon" });
    feed.items.push({ by: me.id, name: (await scoreRow(store, me.id)).name || "Farmer", s: b.id, at: now }); feed.items = feed.items.slice(-FEED_KEEP);
    await store.set(key, feed);
    return G.json(200, { coop: await view(store, coop, me, now) });
  }
  if (act === "help") {
    b.to = Number.isInteger(b.i) ? coop.members[b.i] : null;   /* the game names a mate by their place in the list, so ids never leave the server */
    if (!b.to || b.to === me.id) return G.json(422, { error: "bad_mate" });
    const key = "coops/" + coop.id + "/help/" + G.dayJST(now), h = (await store.get(key)) || { pairs: [], inbox: {} };
    const pair = me.id + ">" + b.to;
    if (h.pairs.includes(pair)) return G.json(422, { error: "already_today" });
    if ((h.got || {})[b.to] >= C.HELPS_PER_DAY) return G.json(422, { error: "mate_has_enough" });
    h.pairs.push(pair); h.inbox[b.to] = (h.inbox[b.to] || 0) + 1; h.got = h.got || {}; h.got[b.to] = (h.got[b.to] || 0) + 1;
    h.from = h.from || {}; h.from[b.to] = (h.from[b.to] || []).concat([(await scoreRow(store, me.id)).name || "Farmer"]).slice(-7);
    await store.set(key, h);
    return G.json(200, { coop: await view(store, coop, me, now) });
  }
  if (act === "takehelp") {
    const key = "coops/" + coop.id + "/help/" + G.dayJST(now), h = (await store.get(key)) || { pairs: [], inbox: {} };
    const n = h.inbox[me.id] || 0, from = ((h.from || {})[me.id] || []).slice(-n);
    if (n) { h.inbox[me.id] = 0; await store.set(key, h); }
    return G.json(200, { n, from });
  }
  if (act === "claim") {
    const wk = C.weekKey(now), w = await weekOf(store, coop, wk), t = C.COOP_TIERS[b.tier];
    if (!t) return G.json(422, { error: "bad_tier" });
    const total = Object.values(w.shares).reduce((a, x) => a + x, 0);
    if (total < w.target * t[0]) return G.json(422, { error: "not_reached" });
    if (!(w.shares[me.id] > 0)) return G.json(422, { error: "did_not_help" });
    const mine = w.claimed[me.id] || [];
    if (mine.includes(b.tier)) return G.json(422, { error: "already_claimed" });
    w.claimed[me.id] = mine.concat([b.tier]); await store.set("coops/" + coop.id + "/week/" + wk, w);
    return G.json(200, { cranes: t[1], full: t[0] >= 1 });
  }
  if (act === "derbyclaim") { const r = await D.derbyClaim(store, coop, me, now); return r.error ? G.json(422, r) : G.json(200, r); }
  return G.json(400, { error: "bad_act" });
};
