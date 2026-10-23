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
   POST /.netlify/functions/game-coop  { act: "claim" }                ->  { cranes, tiers, full }   (every tier of this week's order reached so far, once per member who helped)
   POST /.netlify/functions/game-coop  { act: "derbyclaim" }           ->  { cranes, rank, of, week }   (last week's Co-op Derby reward; a top 3 place adds a trophy)
   The weekly order asks for 80% of what the members brought last week (a new member counts their own estimate), never less than 1,000 kg per active member, so small and large co-ops both get a goal an ordinary week reaches. Members away a week don't count; away a month, they leave. */
const G = require("../lib/game");
const C = require("../lib/community");
const D = require("../lib/derby");

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const newCode = () => Array.from({ length: 6 }, () => CODE_CHARS[require("crypto").randomInt(CODE_CHARS.length)]).join("");
const STICKER_GAP_MS = 20e3, FEED_KEEP = 30;

async function scoreRow(store, id) { return (await store.get("scores/" + id)) || {}; }
async function index(store) { return (await store.get("coopidx")) || {}; }
async function reindex(store, coop, now) {   /* the list "find a co-op" and the Derby read: size, average prestige and when a member last played */
  const idx = await index(store);
  if (!coop.members.length) delete idx[coop.id];
  else { const rows = await Promise.all(coop.members.map((m) => scoreRow(store, m))); idx[coop.id] = { n: coop.members.length, p: rows.reduce((a, r) => a + (r.prestige || 0), 0) / rows.length, name: coop.name, league: coop.league || 1, act: Math.max(now || 0, ...rows.map((r) => r.at || 0)) }; }
  await store.set("coopidx", idx);
}
const awayFor = (coop, pid, row, now) => now - Math.max((row && row.at) || 0, ((coop.seen || {})[pid]) || 0);   /* how long since a member last played: their leaderboard row, or their last visit to the co-op */
async function prune(store, coop, now) {   /* a member gone a month leaves, so a small community's co-ops don't fill with empty places */
  const rows = await Promise.all(coop.members.map((m) => scoreRow(store, m)));
  const keep = coop.members.filter((m, i) => awayFor(coop, m, rows[i], now) < C.COOP_GONE_DAYS * C.DAY);
  if (keep.length === coop.members.length) return;
  coop.members = keep; await store.set("coops/" + coop.id, coop); await reindex(store, coop, now);
}
async function baseline(store, coop, pid, wk, now) {   /* what a member is expected to bring in a week; 0 for someone away a week who brought nothing last week */
  const last = await store.get("coops/" + coop.id + "/week/" + C.prevWeek(wk));
  const had = last && last.shares && last.shares[pid];
  if (had > 0) return had;
  if (awayFor(coop, pid, await scoreRow(store, pid), now) >= C.COOP_AWAY_DAYS * C.DAY) return 0;
  const p = await store.get("players/" + pid);
  return Math.max(C.COOP_NEW_BASE, Math.floor((p && p.coopEst) || 0));
}
const orderSize = (base, active) => Math.max(C.COOP_MIN_PER * Math.max(1, active), Math.round(base * C.COOP_SHARE / 100) * 100);   /* 80% of last week, so an ordinary week reaches the top tier */
async function weekOf(store, coop, wk, now) {   /* this week's order, made on first touch */
  const key = "coops/" + coop.id + "/week/" + wk; let w = await store.get(key);
  if (!w) {
    const bases = await Promise.all(coop.members.map((m) => baseline(store, coop, m, wk, now)));
    const base = bases.reduce((a, b) => a + b, 0), active = bases.filter((b) => b > 0).length;
    w = { week: wk, process: C.coopProcess(wk), base, active, target: orderSize(base, active), shares: {}, at: {}, claimed: {}, joined: coop.members.slice() };
    await store.set(key, w);
  }
  return w;
}
async function view(store, coop, me, now) {
  if (!coop) return null;
  await prune(store, coop, now);
  const wk = C.weekKey(now), w = await weekOf(store, coop, wk, now), day = G.dayJST(now);
  const help = (await store.get("coops/" + coop.id + "/help/" + day)) || { pairs: [], inbox: {} };
  const feed = (await store.get("coops/" + coop.id + "/feed")) || { items: [] };
  const rows = await Promise.all(coop.members.map((m) => scoreRow(store, m)));
  const total = Object.values(w.shares).reduce((a, b) => a + b, 0);
  return {
    id: coop.id, name: coop.name, code: coop.code, league: coop.league || 1,
    members: coop.members.map((m, i) => ({ you: m === me.id, name: rows[i].name || "Farmer", look: rows[i].look || {}, prestige: rows[i].prestige || 0, level: rows[i].level || 1, share: Math.round(w.shares[m] || 0), away: m !== me.id && awayFor(coop, m, rows[i], now) >= C.COOP_AWAY_DAYS * C.DAY, helped: help.pairs.includes(me.id + ">" + m), code: rows[i].code || "" })),
    order: { week: wk, ends: C.weekStart(wk) + 7 * C.DAY, process: w.process, target: w.target, total: Math.round(total), tiers: C.COOP_TIERS.map(([f, cr]) => ({ at: Math.round(w.target * f), cranes: cr })), claimed: w.claimed[me.id] || [] },
    feed: feed.items.slice(-12), helpsIn: help.inbox[me.id] || 0,
    derby: await D.derbyView(store, coop, me, now)
  };
}
async function joinCoop(store, me, coop, now) {
  coop.members.push(me.id); coop.seen = Object.assign(coop.seen || {}, { [me.id]: now }); await store.set("coops/" + coop.id, coop);
  me.coop = coop.id; me.coopJoined = now; await G.savePlayer(store, me);
  const w = await store.get("coops/" + coop.id + "/week/" + C.weekKey(now));
  if (w && !w.joined.includes(me.id)) { w.base = (w.base || 0) + await baseline(store, coop, me.id, w.week, now); w.active = (w.active || 0) + 1; w.target = Math.max(w.target, orderSize(w.base, w.active)); w.joined.push(me.id); await store.set("coops/" + coop.id + "/week/" + w.week, w); }   /* a new member brings their share of the goal */
  await reindex(store, coop, now);
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
  if (coop && now - ((coop.seen || {})[me.id] || 0) > 3600e3) { coop.seen = Object.assign(coop.seen || {}, { [me.id]: now }); await store.set("coops/" + coop.id, coop); }   /* seen in the co-op, at most one write an hour */
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
      const code = String(b.code || "").toUpperCase().replace(/[^A-Z2-9]/g, ""), id = /^[A-Z2-9]{6}$/.test(code) && await store.get("coopcodes/" + code); target = id && await store.get("coops/" + id);
      if (!target || !target.members.length) return G.json(404, { error: "no_coop" });
    } else {
      const mine = (await scoreRow(store, me.id)).prestige || 0, idx = await index(store), live = (x) => now - (x.act || 0) < C.COOP_AWAY_DAYS * C.DAY;
      const pick = Object.entries(idx).filter(([, x]) => x.n < C.COOP_MAX).sort((a, b2) => live(b2[1]) - live(a[1]) || Math.abs(a[1].p - mine) - Math.abs(b2[1].p - mine) || b2[1].n - a[1].n)[0];   /* a co-op someone played in this week first, then the nearest prestige, then the fullest */
      target = pick ? await store.get("coops/" + pick[0]) : await makeCoop(store, C.coopAutoName(Object.keys(idx).length));
    }
    if (target.members.length >= C.COOP_MAX) return G.json(422, { error: "coop_full" });
    await joinCoop(store, me, target, now);
    return G.json(200, { coop: await view(store, target, me, now) });
  }
  if (!coop) return G.json(422, { error: "not_in_a_coop" });
  if (act === "leave") {
    coop.members = coop.members.filter((m) => m !== me.id); await store.set("coops/" + coop.id, coop);
    delete me.coop; await G.savePlayer(store, me); await reindex(store, coop, now);
    return G.json(200, { coop: null });
  }
  if (act === "sync") {
    const wk = C.weekKey(now);
    if (b.est > 0) { me.coopEst = Math.min(1e9, Math.floor(b.est)); await G.savePlayer(store, me); }
    if (b.week === wk) {
      const w = await weekOf(store, coop, wk, now), had = w.shares[me.id] || 0, rise = Math.max(0, Math.floor(Number(b.kg) || 0) - had);
      const ok = Math.min(rise, C.coopAllowed(Math.max(C.COOP_NEW_BASE, await baseline(store, coop, me.id, wk, now)), w.at[me.id], now));
      if (ok > 0) { w.shares[me.id] = had + ok; w.at[me.id] = now; await store.set("coops/" + coop.id + "/week/" + wk, w); }
      const idx = await index(store); if (idx[coop.id] && now - (idx[coop.id].act || 0) > 3600e3) { idx[coop.id].act = now; await store.set("coopidx", idx); }   /* this co-op is alive */
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
  if (act === "claim") {   /* one claim pays every tier reached and not yet claimed */
    const wk = C.weekKey(now), w = await weekOf(store, coop, wk, now), total = Object.values(w.shares).reduce((a, x) => a + x, 0);
    if (!(w.shares[me.id] > 0)) return G.json(422, { error: "did_not_help" });
    const mine = w.claimed[me.id] || [], ready = C.COOP_TIERS.map((t, i) => i).filter((i) => total >= w.target * C.COOP_TIERS[i][0] && !mine.includes(i));
    if (!ready.length) return G.json(422, { error: total >= w.target * C.COOP_TIERS[0][0] ? "already_claimed" : "not_reached" });
    w.claimed[me.id] = mine.concat(ready); await store.set("coops/" + coop.id + "/week/" + wk, w);
    return G.json(200, { cranes: ready.reduce((a, i) => a + C.COOP_TIERS[i][1], 0), tiers: ready, full: ready.includes(C.COOP_TIERS.length - 1) });
  }
  if (act === "derbyclaim") {
    const r = await D.derbyClaim(store, coop, me, now);
    if (r.error) return G.json(422, r);
    if (r.rank <= 3) await G.addTrophy(store, me, { k: "derby", w: r.week, r: r.rank }, now);   /* a Derby podium goes on the trophy shelf */
    return G.json(200, r);
  }
  return G.json(400, { error: "bad_act" });
};
