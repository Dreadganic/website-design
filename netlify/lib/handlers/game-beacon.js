/* POST /.netlify/functions/game-beacon  { batch: [{ e, ts, fid, sid, ...fields }] }  ->  { ok: true, n }
   Anonymous usage events for the roadmap's retention metrics (the BEACON module in the game sends these).
   No accounts, no save data, no PII: fid is a random id from its own storage slot, fields are whitelisted
   numbers and short strings. Each batch lands as its own blob under beacon/<day>/, so batches written at the
   same moment never overwrite each other (no read-modify-write). Stats read them in netlify/lib/handlers/game-stats.js. */
const G = require("../game");

const NAMES = ["session_start", "session_end", "first_pick", "first_sale", "first_prestige", "prestige", "tab_open", "shop_view",
  "counter_open", "counter_close", "counter_quick", "kona_open", "coop_join", "coe_play", "away_collect", "order_click", "unlock_seen", "practice_seen",
  "mood_view", "reg_story", "care_send", "care_recv", "postcard_send", "bag_card"];
const FIELDS = {   /* field: [type, cap] — unknown or oversized fields are dropped */
  len: ["int", 172800], h: ["num", 24], p: ["int", 99], lvl: ["int", 999], min: ["int", 100000], gap: ["int", 2592000000],
  served: ["int", 999], out: ["int", 999], coins: ["int", 1e12], rep: ["int", 1000000], m: ["int", 999], t: ["string", 40], key: ["string", 40], reg: ["string", 10], pc: ["string", 12]
};
NAMES.push("bm_open", "bm_visit", "bm_pick", "bm_grade", "bm_ship");   /* Blue Mountain: arrivals, gaps between visits, clean and blind picks, trays, barrels */

exports.handler = async (event) => {
  const deps = exports.__deps;
  if (event.httpMethod !== "POST") return G.json(405, { error: "method_not_allowed" });
  if ((event.body || "").length > 16000) return G.json(413, { error: "too_big" });
  const body = G.parse(event);
  const batch = body && Array.isArray(body.batch) ? body.batch : null;
  if (!batch || !batch.length || batch.length > 50) return G.json(400, { error: "bad_batch" });
  const store = G.stores(event, deps), now = (deps && deps.now) || Date.now();
  const clean = [];
  for (const raw of batch) {
    if (!raw || !NAMES.includes(raw.e)) continue;
    const ev = { e: raw.e, ts: Number(raw.ts) || now, fid: /^[a-f0-9]{16}$/.test(raw.fid || "") ? raw.fid : "unknown", sid: /^[a-z0-9]{4,16}$/.test(raw.sid || "") ? raw.sid : "" };
    for (const k of Object.keys(FIELDS)) {
      const spec = FIELDS[k];
      if (raw[k] === undefined || raw[k] === null || raw[k] === "") continue;
      if (spec[0] === "int" && Number.isFinite(+raw[k])) ev[k] = Math.max(0, Math.min(spec[1], Math.round(+raw[k])));
      else if (spec[0] === "num" && Number.isFinite(+raw[k])) ev[k] = Math.max(0, Math.min(spec[1], +raw[k]));
      else if (spec[0] === "string") ev[k] = String(raw[k]).slice(0, spec[1]).replace(/[<>&"]/g, "");
    }
    clean.push(ev);
  }
  if (!clean.length) return G.json(400, { error: "no_valid_events" });
  await store.set("beacon/" + new Date(now).toISOString().slice(0, 10) + "/" + now + "-" + Math.random().toString(36).slice(2, 6) + ".json", { at: now, events: clean });
  return G.json(200, { ok: true, n: clean.length });
};
