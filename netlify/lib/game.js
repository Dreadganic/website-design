/* Shared code for the Beju Farm game backend: storage, player tokens, and the rules that keep the leaderboard honest.
   Storage is Netlify Blobs (built into Netlify, no extra account). Tests pass an in-memory store instead. */
const crypto = require("crypto");

const json = (status, body, extra) => ({ statusCode: status, headers: Object.assign({ "Content-Type": "application/json", "Cache-Control": "no-store" }, extra || {}), body: JSON.stringify(body) });
const parse = (event) => { try { return JSON.parse(event.isBase64Encoded ? Buffer.from(event.body || "", "base64").toString("utf8") : event.body || "{}"); } catch (e) { return null; } };

/* One store per kind of record. On Netlify this is a Blobs store; in tests, a Map with the same three methods. */
function stores(event, deps) {
  if (deps && deps.store) return deps.store;
  const blobs = require("@netlify/blobs");
  if (blobs.connectLambda && event && event.blobs) blobs.connectLambda(event);
  const s = blobs.getStore({ name: "beju-farm", consistency: "strong" });
  return {
    get: (k) => s.get(k, { type: "json" }),
    set: (k, v) => s.setJSON(k, v),
    list: async (prefix) => (await s.list({ prefix })).blobs.map((b) => b.key)
  };
}
function memoryStore() {   /* for tests and local runs */
  const m = new Map();
  return { get: async (k) => (m.has(k) ? JSON.parse(m.get(k)) : null), set: async (k, v) => { m.set(k, JSON.stringify(v)); }, list: async (p) => [...m.keys()].filter((k) => k.startsWith(p)), _m: m };
}

/* Players are anonymous until they link an order: an id plus a secret token, of which the server keeps only a hash. */
const hash = (t) => crypto.createHash("sha256").update(t).digest("hex");
const newId = () => "p_" + crypto.randomBytes(9).toString("base64url");
const newToken = () => crypto.randomBytes(24).toString("base64url");
async function authed(event, store) {
  const h = (event.headers && (event.headers.authorization || event.headers.Authorization)) || "";
  const m = /^Bearer (p_[A-Za-z0-9_-]{8,20})\.([A-Za-z0-9_-]{20,64})$/.exec(h);
  if (!m) return null;
  const p = await store.get("players/" + m[1]);
  if (!p || !crypto.timingSafeEqual(Buffer.from(p.tokenHash, "hex"), Buffer.from(hash(m[2]), "hex"))) return null;
  return Object.assign(p, { id: m[1] });
}

/* The game's own rules, mirrored so the server can check what a client claims */
const XP_AT = (l) => Math.round(100 * Math.pow(l - 1, 2.4));
const levelFor = (xp) => { let l = 1; while (xp >= XP_AT(l + 1)) l++; return l; };
const PRESTIGE_LEVEL = 10;
const seasonKey = (ms) => { const d = new Date((ms || Date.now()) + 9 * 3600e3); return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0"); };   /* seasons follow Japan time */
const RULES = {
  xpPerSecond: 60,          /* far above the best late-game rate, so honest players never hit it */
  xpBurst: 25000,           /* contracts, check-ins and offline earnings arrive in lumps */
  minPrestigeGapSec: 15 * 60, /* reaching level 10+ again takes far longer than this */
  minScoreGapSec: 15,
  minSaveGapSec: 5,
  maxSaveBytes: 400 * 1024
};

/* A score is accepted only if it could have happened since the last accepted one */
function checkScore(prev, next, now) {
  const n = next;
  if (!Number.isInteger(n.prestige) || !Number.isInteger(n.seasonP) || !Number.isFinite(n.points) || n.prestige < 0 || n.seasonP < 0 || n.points < 0) return "bad_numbers";
  if (n.seasonP > n.prestige) return "bad_numbers";
  const lv = levelFor(n.points);
  if (n.level !== lv) return "level_mismatch";
  if (!prev) return n.prestige <= 1 && n.points <= RULES.xpBurst * 4 ? null : "too_far_for_a_new_player";
  const dt = Math.max(0, (now - prev.at) / 1000);
  if (dt < RULES.minScoreGapSec) return "too_soon";
  const sameSeason = prev.season === seasonKey(now);
  if (n.prestige < prev.prestige) return "prestige_went_down";
  if (n.prestige > prev.prestige + 1) return "prestige_jump";
  if (n.prestige === prev.prestige + 1) {
    if (prev.level < Math.min(20, PRESTIGE_LEVEL + 2 * (sameSeason ? prev.seasonP : 0)) && prev.points < XP_AT(PRESTIGE_LEVEL)) return "prestige_without_level";
    if (now - (prev.prestigeAt || 0) < RULES.minPrestigeGapSec * 1000) return "prestige_too_fast";
  } else if (n.points > prev.points + RULES.xpPerSecond * dt + RULES.xpBurst) return "too_fast";
  if (sameSeason && n.seasonP > prev.seasonP + (n.prestige - prev.prestige)) return "season_jump";
  return null;
}

/* Names: short, printable, no links, nothing hateful */
const BLOCK = /(https?:|www\.|\.com|fuck|shit|cunt|nigg|fag|hitler|nazi)/i;
function cleanName(s) {
  s = String(s || "").normalize("NFKC").replace(/[\u0000-\u001f<>"'`\\]/g, "").trim().slice(0, 16);
  if (s.length < 2 || BLOCK.test(s)) return null;
  return s;
}
const cleanLook = (l) => { const n = (x) => Math.max(0, Math.min(7, Math.floor(Number(x) || 0))); l = l || {}; return { plate: n(l.plate), border: n(l.border), skin: n(l.skin) }; };

/* Which passport origins each real coffee can stamp, in blend order (mirrors the game's COFFEES) */
const STAMPS = { casablanca: ["mogiana", "huila", "turrialba"], pinkwhiskey: ["huila"], rumbarrel: ["huila"], yirgacheffe: ["gedeo"], strawberry: ["toba"] };

module.exports = { json, parse, stores, memoryStore, authed, hash, newId, newToken, XP_AT, levelFor, seasonKey, RULES, checkScore, cleanName, cleanLook, STAMPS };
