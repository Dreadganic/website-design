/* GET  /.netlify/functions/game-harvest                    ->  { now, day: { id, name, text, unit, method, variety, starts, ends, live, target, total, players, reached }, mine }
   POST /.netlify/functions/game-harvest  { id, n }          ->  { total, mine, accepted }   (n: how many you've made in all this Harvest Day; only the rise counts, rate-capped)
   POST /.netlify/functions/game-harvest  { id, claim: true } ->  { reward: "decor" | "cranes", cranes, half }   (halfway: 2 cranes; the full goal: the decoration, then cranes; for anyone who took part)
   Harvest Day: one weekend a month, everyone works towards one goal. The goal scales with how many people play, and reaching it unlocks a reward for everyone who helped. */
const G = require("../lib/game");
const C = require("../lib/community");

const RECOUNT_MS = 60e3;   /* the shared total is recounted from every player's record at most once a minute */
const REPEAT_CRANES = 5, HALF_CRANES = 2;   /* after the first Harvest Day's decoration, each reached day gives cranes; halfway pays a little, so a quiet weekend still counts */

async function meta(store, day, now) {   /* the goal, fixed a few days before the weekend from how many people play */
  const key = "harvest/" + day.id + "/meta"; let m = await store.get(key);
  if (!m && now >= day.starts - 3 * C.DAY) {
    const players = (await C.activePlayers(store, now)).length, u = C.HARVEST_UNIT[day.unit];
    m = { target: day.target || Math.max(u.min, Math.round(players * u.perPlayer / 10) * 10), players, at: now };
    await store.set(key, m);
  }
  return m;
}
async function total(store, day, now, force) {
  const key = "harvest/" + day.id + "/total"; let t = await store.get(key);
  if (force || !t || now - t.at > RECOUNT_MS) {
    const keys = await store.list("harvest/" + day.id + "/p/"), recs = await Promise.all(keys.map((k) => store.get(k)));
    t = { total: recs.reduce((a, r) => a + ((r && r.n) || 0), 0), players: recs.filter((r) => r && r.n > 0).length, at: now };
    await store.set(key, t);
  }
  return t;
}
const view = (day, m, t, now) => ({ id: day.id, name: day.name, text: day.text, unit: day.unit, method: day.method || "", variety: day.variety || "", starts: day.starts, ends: day.ends, live: now >= day.starts && now < day.ends,
  target: m ? m.target : null, total: t ? t.total : 0, players: t ? t.players : 0, reached: !!(m && t && t.total >= m.target), half: !!(m && t && t.total >= m.target / 2) });

exports.handler = async (event) => {
  const deps = exports.__deps;
  const store = G.stores(event, deps), now = (deps && deps.now) || Date.now();
  const day = C.harvestFor(now, deps && deps.harvest), m = await meta(store, day, now);
  if (event.httpMethod === "GET") {
    const t = now >= day.starts ? await total(store, day, now) : null, me = await G.authed(event, store);
    const mine = me ? (await store.get("harvest/" + day.id + "/p/" + me.id)) || { n: 0 } : null;
    return G.json(200, { now, day: view(day, m, t, now), mine: mine && { n: mine.n || 0, claimed: !!mine.claimed, halfClaimed: !!mine.half } });
  }
  if (event.httpMethod !== "POST") return G.json(405, { error: "method_not_allowed" });
  const me = await G.authed(event, store);
  if (!me) return G.json(401, { error: "sign_in" });
  const b = G.parse(event);
  if (!b || b.id !== day.id) return G.json(409, { error: "not_this_harvest" });
  const key = "harvest/" + day.id + "/p/" + me.id, rec = (await store.get(key)) || { n: 0, at: 0 };
  if (b.claim) {
    const t = await total(store, day, now, true);
    if (!m || t.total < m.target / 2) return G.json(422, { error: "not_reached" });
    if (!(rec.n > 0)) return G.json(422, { error: "did_not_take_part" });
    const full = t.total >= m.target;
    if (rec.claimed || (!full && rec.half)) return G.json(422, { error: "already_claimed" });
    let cranes = rec.half ? 0 : HALF_CRANES; rec.half = true;
    if (!full) { await store.set(key, rec); return G.json(200, { reward: "cranes", cranes, half: true }); }
    rec.claimed = true; await store.set(key, rec);
    const first = !me.harvestDecor; if (first) { me.harvestDecor = true; await G.savePlayer(store, me); } else cranes += REPEAT_CRANES;
    await G.addTrophy(store, me, { k: "harvest", d: day.id }, now);   /* each reached Harvest Day goes on the trophy shelf */
    return G.json(200, { reward: first ? "decor" : "cranes", cranes, half: false });
  }
  if (now < day.starts || now >= day.ends) return G.json(422, { error: "not_live" });
  const n = Math.floor(Number(b.n) || 0), rise = Math.max(0, n - (rec.n || 0));
  const accepted = Math.min(rise, C.harvestAllowed(day.unit, rec.at, day.starts, now));
  const wasNew = !(rec.n > 0);
  if (accepted > 0) { rec.n = (rec.n || 0) + accepted; rec.at = now; await store.set(key, rec); }
  const t = await total(store, day, now);
  if (accepted > 0 && now - t.at < RECOUNT_MS && t.at !== now) { t.total += accepted; t.players += wasNew ? 1 : 0; await store.set("harvest/" + day.id + "/total", t); }   /* keep the bar moving between recounts */
  return G.json(200, { total: t.total, mine: rec.n || 0, accepted, reached: !!(m && t.total >= m.target) });
};
