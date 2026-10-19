/* GET  /.netlify/functions/game-visit?code=ABC123   ->  { code, name, look, prestige, level, farm, cheers, at }   (anyone can look)
   PUT  /.netlify/functions/game-visit  { farm }     ->  { code, cheers }   (your own farm's snapshot; the code is made once and kept)
   POST /.netlify/functions/game-visit?code=ABC123   ->  { cheers }   (one Cheers per visitor per farm per day, never on your own farm)
   Farm visits: a read-only snapshot of how a farm looks. Nothing a visitor does changes it, apart from the Cheers count. */
const G = require("../lib/game");

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";   /* no 0/O, 1/I/L, so codes read aloud cleanly */
const newCode = () => Array.from({ length: 6 }, () => CODE_CHARS[require("crypto").randomInt(CODE_CHARS.length)]).join("");
const CHEERS_PER_DAY = 30;   /* how many farms one visitor can cheer in a day */

exports.handler = async (event) => {
  const deps = exports.__deps;
  const store = G.stores(event, deps), now = (deps && deps.now) || Date.now(), day = G.dayJST(now);
  const q = event.queryStringParameters || {}, code = String(q.code || "").toUpperCase();
  if (event.httpMethod === "GET") {
    if (!/^[A-Z2-9]{6}$/.test(code)) return G.json(400, { error: "bad_code" });
    const id = await store.get("codes/" + code), farm = id && await store.get("farms/" + id);
    if (!farm) return G.json(404, { error: "no_farm" });
    const row = (await store.get("scores/" + id)) || {};
    return G.json(200, { code, name: row.name || "Farmer", look: row.look || {}, prestige: row.prestige || 0, level: row.level || 1, farm: farm.farm, cheers: farm.cheers || 0, at: farm.at }, { "Cache-Control": "public, max-age=60" });
  }
  const me = await G.authed(event, store);
  if (!me) return G.json(401, { error: "sign_in" });
  if (event.httpMethod === "PUT") {
    if ((event.body || "").length > G.RULES.maxFarmBytes) return G.json(413, { error: "too_big" });
    const b = G.parse(event), farm = b && G.cleanFarm(b.farm);
    if (!farm) return G.json(400, { error: "bad_farm" });
    const key = "farms/" + me.id, cur = await store.get(key);
    if (cur && now - cur.at < G.RULES.minFarmGapSec * 1000) return G.json(429, { error: "too_soon", code: cur.code });
    let c = cur && cur.code;
    if (!c) { do { c = newCode(); } while (await store.get("codes/" + c)); await store.set("codes/" + c, me.id); me.farmCode = c; await G.savePlayer(store, me); }
    await store.set(key, { code: c, farm, cheers: cur ? cur.cheers || 0 : 0, at: now });
    return G.json(200, { code: c, cheers: cur ? cur.cheers || 0 : 0 });
  }
  if (event.httpMethod === "POST") {
    if (!/^[A-Z2-9]{6}$/.test(code)) return G.json(400, { error: "bad_code" });
    const id = await store.get("codes/" + code);
    if (!id) return G.json(404, { error: "no_farm" });
    if (id === me.id) return G.json(422, { error: "own_farm" });
    const seenKey = "cheers/" + id + "/" + day, seen = (await store.get(seenKey)) || { by: [] };
    if (seen.by.includes(me.id)) return G.json(422, { error: "already_today" });
    const mineKey = "cheered/" + me.id + "/" + day, mine = (await store.get(mineKey)) || { n: 0 };
    if (mine.n >= CHEERS_PER_DAY) return G.json(429, { error: "enough_today" });
    const farm = await store.get("farms/" + id);
    if (!farm) return G.json(404, { error: "no_farm" });
    seen.by.push(me.id); mine.n += 1; farm.cheers = (farm.cheers || 0) + 1;
    await store.set(seenKey, seen); await store.set(mineKey, mine); await store.set("farms/" + id, farm);
    return G.json(200, { cheers: farm.cheers });
  }
  return G.json(405, { error: "method_not_allowed" });
};
