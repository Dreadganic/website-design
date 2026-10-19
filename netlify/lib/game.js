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
const XP_EARLY = (l) => (l <= 10 ? 5 : l < 26 ? Math.pow(5, (26 - l) / 16) : 1);   /* early levels take up to 5x the know-how, easing back by level 26 */
const XP_AT = (l) => Math.round((l <= 10 ? 100 * Math.pow(l - 1, 2.4) : l <= 30 ? 100 * Math.pow(9, 2.4) * Math.pow(1.22, l - 10) : 100 * Math.pow(9, 2.4) * Math.pow(1.22, 20) * Math.pow(1.15, l - 30)) * XP_EARLY(l));   /* past level 30 the climb eases to 1.15x; keep in step with XP_AT in the game */
const levelFor = (xp) => { let l = 1; while (xp >= XP_AT(l + 1)) l++; return l; };
const PRESTIGE_LEVEL = 10;
const prestigeNeed = (p) => PRESTIGE_LEVEL + 8 * p;   /* by lifetime prestige: 10, 18, 26, 34 ... */
/* Seasons follow the calendar month in Japan time. SEASON_JOIN folds a month into an earlier season, e.g. { "2026-12": "2026-11" } when the game launches after the 15th.
   Keep it in step with SEASON_JOIN in game-assets/play/template.html. */
const SEASON_JOIN = {};
const monthKey = (y, m) => { while (m < 1) { m += 12; y -= 1; } while (m > 12) { m -= 12; y += 1; } return y + "-" + String(m).padStart(2, "0"); };
const seasonKey = (ms) => { const d = new Date((ms || Date.now()) + 9 * 3600e3), k = monthKey(d.getUTCFullYear(), d.getUTCMonth() + 1); return SEASON_JOIN[k] || k; };
const prevSeason = (key) => { const k = monthKey(+key.slice(0, 4), +key.slice(5) - 1); return SEASON_JOIN[k] || k; };   /* a season's key is its first month */
const SEASON_IDS = ["shogatsu", "ume", "hina", "sakura", "koinobori", "tsuyu", "tanabata", "hanabi", "tsukimi", "akimatsuri", "momiji", "lights"];   /* by month, January first */
const RULES = {
  xpPerSecond: 1500,        /* a maxed farm with mastery earns a few hundred a second; this leaves room above that */
  xpBurst: 150000,          /* contracts, check-ins and offline earnings arrive in lumps */
  starsPerDay: 25,          /* the daily caps add up to about 19 season stars, plus the weekly order spread over the week */
  starsBurst: 50,           /* a weekly order, a drop contract and a day's capped stars can land together */
  starsPerPrestige: 10,
  minPrestigeGapSec: 15 * 60, /* reaching level 10+ again takes far longer than this */
  minScoreGapSec: 15,
  minSaveGapSec: 5,
  maxSaveBytes: 400 * 1024,
  maxFarmBytes: 8 * 1024,   /* a farm snapshot for visits is small */
  minFarmGapSec: 30
};

/* A score is accepted only if it could have happened since the last accepted one */
function checkScore(prev, next, now) {
  const n = next;
  if (!Number.isInteger(n.prestige) || !Number.isInteger(n.seasonP) || !Number.isFinite(n.points) || n.prestige < 0 || n.seasonP < 0 || n.points < 0) return "bad_numbers";
  n.seasonKh = Math.max(0, Math.floor(Number(n.seasonKh) || 0));
  if (n.seasonP > n.prestige) return "bad_numbers";
  n.seasonStars = Math.max(0, Math.floor(Number(n.seasonStars) || 0));
  const lv = levelFor(n.points);
  if (n.level !== lv) return "level_mismatch";
  if (!prev) return n.prestige <= 1 && n.points <= RULES.xpBurst * 4 && n.seasonKh <= RULES.xpBurst * 4 && n.seasonStars <= RULES.starsBurst + RULES.starsPerPrestige ? null : "too_far_for_a_new_player";
  const dt = Math.max(0, (now - prev.at) / 1000);
  if (dt < RULES.minScoreGapSec) return "too_soon";
  const sameSeason = prev.season === seasonKey(now);
  if (n.prestige < prev.prestige) return "prestige_went_down";
  if (n.prestige > prev.prestige + 1) return "prestige_jump";
  if (n.prestige === prev.prestige + 1) {
    if (prev.level < prestigeNeed(prev.prestige)) return "prestige_without_level";
    if (now - (prev.prestigeAt || 0) < RULES.minPrestigeGapSec * 1000) return "prestige_too_fast";
  } else if (n.points > prev.points + RULES.xpPerSecond * dt + RULES.xpBurst) return "too_fast";
  if (sameSeason && n.seasonP > prev.seasonP + (n.prestige - prev.prestige)) return "season_jump";
  const khBase = sameSeason ? prev.seasonKh || 0 : 0;   /* know-how earned this month can only grow as fast as play allows */
  if (n.seasonKh > khBase + RULES.xpPerSecond * dt + RULES.xpBurst) return "too_fast";
  const starBase = sameSeason ? prev.seasonStars || 0 : 0;   /* season stars are capped per real day in the game */
  if (n.seasonStars > starBase + RULES.starsPerDay * dt / 86400 + RULES.starsBurst + RULES.starsPerPrestige * (n.prestige - prev.prestige)) return "too_many_stars";
  return null;
}

/* Names: short, printable, no links, nothing hateful */
const BLOCK = /(https?:|www\.|\.com|fuck|shit|cunt|nigg|fag|hitler|nazi)/i;
function cleanName(s) {
  s = String(s || "").normalize("NFKC").replace(/[\u0000-\u001f<>"'`\\]/g, "").trim().slice(0, 16);
  if (s.length < 2 || BLOCK.test(s)) return null;
  return s;
}
/* A look is a crest (nameplate and border, capped at the tier the player's prestige has reached), an outfit (any of the 8 once they have prestiged, since each prestige picks one) and a background. Old clients sent plate/border. */
const BGS = ["none", "mogiana", "huila", "gedeo", "toba", "turrialba", "osaka", "beju"];
const CHARS = ["none", "shiba", "capybara", "bear", "gelada", "orangutan", "sloth", "tanuki", "kitsune", "robot", "crane"];   /* character models, bought with cranes */
const ROASTER_FINISHES = ["copper", "showa", "sakura", "beju", "cream", "gold"];   /* roastery cosmetics that show on the board */
const cleanLook = (l, prestige) => {
  const n = (x, max) => Math.max(0, Math.min(max, Math.floor(Number(x) || 0)));
  l = l || {};
  const cap = prestige === undefined ? 7 : n(prestige, 7);
  const sid = (x) => String(x || "").replace(/^s_/, ""), now = seasonKey();
  return { crest: n(l.crest !== undefined ? l.crest : l.plate, cap), skin: cap > 0 ? n(l.skin, 7) : 0, bg: BGS.includes(l.bg) || (/^s_/.test(l.bg || "") && SEASON_IDS.includes(sid(l.bg))) ? l.bg : "none", char: CHARS.includes(l.char) ? l.char : "none",
    hat: SEASON_IDS.includes(sid(l.hat)) ? "s_" + sid(l.hat) : "", charm: l.charm === "qgrader" || l.charm === "crack" ? l.charm : SEASON_IDS.includes(sid(l.charm)) ? sid(l.charm) : "",
    roaster: ROASTER_FINISHES.includes(l.roaster) ? l.roaster : "",
    title: (/^\d{4}-\d{2}$/.test(l.title || "") && l.title <= now) || /^nbm?:[a-z]{3,16}$|^nbt:(cupper|head|q)$|^rr:(master|crack)$/.test(l.title || "") ? l.title : "" };   /* season titles, and cupping notebook titles */   /* season track cosmetics; a title names a season that has started */
};

/* Free coffee samples earned in the game. The server decides who has earned what, from its own records:
   a welcome bag once a new farmer gets going, one per origin at prestige 2-5, and one a month for checking in on 20 days.
   Each sample is redeemed with an order of SAMPLE_RULES.minOrder or more and lasts SAMPLE_RULES.lifeDays. */
const SAMPLE_RULES = { minOrder: 3000, lifeDays: 60, monthlyCheckins: 20 };
const SAMPLE_LADDER = [
  { id: "welcome", origin: "mogiana", coffee: "Casablanca Blend", prestige: 0, minLevel: 2 },
  { id: "huila", origin: "huila", coffee: "Colombia Pink Whiskey", prestige: 2 },
  { id: "gedeo", origin: "gedeo", coffee: "Ethiopia Yirgacheffe", prestige: 3 },
  { id: "toba", origin: "toba", coffee: "Sumatra Strawberry", prestige: 4 },
  { id: "turrialba", origin: "turrialba", coffee: "Casablanca Blend", prestige: 5 }
];
const dayJST = (ms) => new Date((ms || Date.now()) + 9 * 3600e3).toISOString().slice(0, 10);   /* "2026-10-18" */
/* samples this player qualifies for that they don't hold yet; score is their leaderboard record */
function newSamples(player, score, now) {
  const have = new Set((player.samples || []).map((s) => s.id)), out = [];
  SAMPLE_LADDER.forEach((r) => {
    if (have.has(r.id) || !score) return;
    if (score.prestige >= r.prestige && (r.prestige > 0 || score.level >= r.minLevel || score.prestige > 0)) out.push({ id: r.id, kind: r.id === "welcome" ? "welcome" : "origin", origin: r.origin, coffee: r.coffee });
  });
  const month = dayJST(now).slice(0, 7), days = ((player.checkins || {})[month] || []).length;
  if (days >= SAMPLE_RULES.monthlyCheckins && !have.has("month-" + month)) out.push({ id: "month-" + month, kind: "monthly", origin: "", coffee: "Roaster's choice" });
  return out.map((s) => Object.assign(s, { earned: now, expires: now + SAMPLE_RULES.lifeDays * 864e5, status: "earned" }));
}
/* a sample as the game sees it, with expiry applied */
const sampleView = (s, now) => Object.assign({}, s, { status: s.status === "earned" && s.expires <= now ? "expired" : s.status });
/* save a player record (the authed() copy carries its id, which isn't stored) */
/* A farm snapshot for visits: only what's needed to draw the farm, every value checked or dropped */
const FARM_LOCS = ["mogiana", "huila", "gedeo", "toba", "turrialba", "osaka"];
const ID = /^[a-z0-9_]{1,24}$/;
const int = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.floor(Number(v) || 0)));
function cleanFarm(f) {
  if (!f || typeof f !== "object" || !f.farms || typeof f.farms !== "object") return null;
  const farms = {};
  FARM_LOCS.forEach((l) => {
    const x = f.farms[l]; if (!x || typeof x !== "object" || !x.u) return;
    farms[l] = { u: true, b: (Array.isArray(x.b) ? x.b : []).slice(0, 6).map((n) => int(n, 0, 12)), f: !!x.f, s: ID.test(x.s || "") ? x.s : "", e: int(x.e, 0, 3), h: int(x.h, 0, 3), beds: (Array.isArray(x.beds) ? x.beds : []).slice(0, 4).filter((v) => ID.test(v)) };
  });
  if (!Object.keys(farms).length) return null;
  return { loc: farms[f.loc] ? f.loc : Object.keys(farms)[0], farms, store: int(f.store, 1, 10), decor: (Array.isArray(f.decor) ? f.decor : []).filter((d) => ID.test(d)).slice(0, 40), spiece: ID.test(f.spiece || "") ? f.spiece : "", perk: !!f.perk };
}
async function savePlayer(store, me) { const { id, ...rest } = me; await store.set("players/" + id, rest); }

/* Which passport origins each real coffee can stamp, in blend order (mirrors the game's COFFEES) */
const STAMPS = { casablanca: ["mogiana", "huila", "turrialba"], pinkwhiskey: ["huila"], rumbarrel: ["huila"], yirgacheffe: ["gedeo"], strawberry: ["toba"] };

module.exports = { cleanFarm, FARM_LOCS, SAMPLE_RULES, SAMPLE_LADDER, dayJST, newSamples, sampleView, savePlayer, json, parse, stores, memoryStore, authed, hash, newId, newToken, XP_AT, levelFor, prestigeNeed, seasonKey, prevSeason, SEASON_JOIN, SEASON_IDS, RULES, checkScore, cleanName, cleanLook, STAMPS };
