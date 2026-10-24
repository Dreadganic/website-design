/* Shared code for Beju Farm's community features: Harvest Day (a monthly weekend goal for everyone),
   cooperatives with their weekly order and the Co-op Derby, and the Cup of Excellence. Used by game-harvest, game-coop and game-coe. */
const G = require("./game");
const HARVEST_FILE = require("./game-harvest.json");

const JST = 9 * 3600e3, DAY = 864e5;
const pad = (n) => String(n).padStart(2, "0");
/* weeks run Monday to Monday, Japan time; a week's key is its Monday, e.g. "2026-10-19" */
const weekKey = (ms) => { const d = new Date((ms || Date.now()) + JST), back = (d.getUTCDay() + 6) % 7; return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - back)).toISOString().slice(0, 10); };
const weekStart = (key) => Date.parse(key + "T00:00:00+09:00");
const prevWeek = (key) => weekKey(weekStart(key) - DAY);

/* active players: anyone whose leaderboard row moved in the last two weeks */
async function activePlayers(store, now) {
  const keys = await store.list("scores/"), rows = await Promise.all(keys.map((k) => store.get(k)));
  return rows.filter((r) => r && now - (r.at || 0) < 14 * DAY);
}

/* ---------- Harvest Day ---------- */
const HARVEST_GOALS = [
  { unit: "lots", method: "washed", name: "Washed weekend", text: "Sell or deliver washed lots" },
  { unit: "cups", name: "Cupping weekend", text: "Cup lots by hand" },
  { unit: "lots", method: "natural", name: "Natural weekend", text: "Sell or deliver natural lots" },
  { unit: "golden", name: "Golden weekend", text: "Catch golden bushes" },
  { unit: "lots", method: "honey", name: "Honey weekend", text: "Sell or deliver honey lots" },
  { unit: "lots", name: "Big harvest weekend", text: "Sell or deliver lots of any coffee" }
];
/* how big the goal is per active player, the smallest goal, and how fast one player can add (per minute, plus a burst for time away) */
const HARVEST_UNIT = { lots: { perPlayer: 60, min: 200, perMin: 30, burst: 300 }, cups: { perPlayer: 25, min: 100, perMin: 30, burst: 60 }, golden: { perPlayer: 3, min: 25, perMin: 2, burst: 6 } };   /* small floors so a handful of players can reach it at launch */
const ID = /^[a-z0-9_-]{1,24}$/;
function firstSaturday(y, m) {   /* 10:00 Japan time on the month's first Saturday */
  for (let d = 1; d <= 7; d++) { const t = Date.parse(y + "-" + pad(m) + "-" + pad(d) + "T10:00:00+09:00"); if (new Date(t + JST).getUTCDay() === 6) return t; }
  return null;
}
function harvestFor(now, file) {   /* the Harvest Day on now, or the next one */
  const d = new Date(now + JST); let y = d.getUTCFullYear(), m = d.getUTCMonth() + 1, s = firstSaturday(y, m);
  if (s + 2 * DAY <= now) { m += 1; if (m > 12) { m = 1; y += 1; } s = firstSaturday(y, m); }
  const auto = Object.assign({ id: y + "-" + pad(m), starts: s, ends: s + 2 * DAY }, HARVEST_GOALS[(y * 12 + m) % HARVEST_GOALS.length]);
  const manual = ((file || HARVEST_FILE).days || []).map((x) => ({ id: String(x.id || ""), name: String(x.name || "Harvest Day").slice(0, 40), text: String(x.text || "").slice(0, 80), unit: HARVEST_UNIT[x.unit] ? x.unit : "lots",
    method: ID.test(x.method || "") ? x.method : undefined, variety: ID.test(x.variety || "") ? x.variety : undefined, starts: Date.parse(x.starts), ends: Date.parse(x.ends), target: x.target > 0 ? Math.floor(x.target) : undefined }))
    .filter((x) => ID.test(x.id) && x.ends > now && x.ends > x.starts).sort((a, b) => a.starts - b.starts)[0];
  return manual && manual.starts < auto.ends ? manual : auto;
}
/* how much one post may add: the rate cap since the player's last post, plus a burst for time away */
function harvestAllowed(unit, lastAt, starts, now) {
  const u = HARVEST_UNIT[unit], mins = Math.max(1, Math.min(180, (now - Math.max(lastAt || 0, starts)) / 60000));
  return Math.floor(u.perMin * mins + u.burst);
}

/* ---------- cooperatives ---------- */
const COOP_MAX = 8;
const COOP_PROCESSES = ["washed", "natural", "honey"];   /* the weekly co-op order rotates through the processes everyone has */
const COOP_TIERS = [[0.25, 1], [0.5, 2], [0.75, 3], [1, 4]];   /* share of the order reached, cranes for each member who helped: 10 in all, like the solo weekly order, so play cranes stay low */
const COOP_MIN_PER = 2000, COOP_NEW_BASE = 2000;   /* kg of green coffee: at least 2,000 per active member, and a member the server knows nothing about counts as 2,000 */
const coopSize = (active) => 1 + 0.1 * (Math.max(1, active) - 1);   /* each member's usual week of the process, times 1.1 for 2 members up to 1.7 for 8: a bigger co-op asks more of everyone */
const COOP_AWAY_DAYS = 7, COOP_GONE_DAYS = 30;   /* away a week: not counted in the order; away a month: leaves the co-op, freeing the place */
const STICKERS = ["hello", "thanks", "nice", "onit", "washed", "natural", "honey", "roast", "golden", "prestige", "harvest", "night"];
const HELPS_PER_DAY = 3;   /* how many helps one farmer can receive in a day; each speeds their drying by 10% */
const coopProcess = (wk) => COOP_PROCESSES[Math.round(weekStart(wk) / (7 * DAY)) % COOP_PROCESSES.length];
function cleanCoopName(s) {
  s = String(s || "").normalize("NFKC").replace(/[\u0000-\u001f<>"'`\\]/g, "").replace(/\s+/g, " ").trim().slice(0, 24);
  return s.length >= 3 && G.cleanName(s.slice(0, 16)) ? s : null;
}
const COOP_WORDS = ["Cerrado", "Las Nubes", "Monte Alto", "Cafetal", "Golden Cherry", "Riverbend", "Sakura Hill", "Kopi Toba", "Yirga Ridge", "Volcán", "Red Cherry", "Morning Mist", "Pergola", "Terraza"];
const coopAutoName = (n) => "Cooperativa " + COOP_WORDS[n % COOP_WORDS.length] + (n >= COOP_WORDS.length ? " " + (Math.floor(n / COOP_WORDS.length) + 1) : "");
/* how much green coffee one sync may add: an hour's worth at a generous rate per hour since the last sync (up to 12), plus a week's baseline for time away */
const coopAllowed = (baseline, lastAt, now) => Math.round(Math.max(5000, baseline * 0.5) * Math.max(1 / 60, Math.min(12, (now - (lastAt || now - 3600e3)) / 3600e3)) + baseline);

module.exports = { JST, DAY, weekKey, weekStart, prevWeek, activePlayers, HARVEST_GOALS, HARVEST_UNIT, firstSaturday, harvestFor, harvestAllowed,
  COOP_MAX, COOP_PROCESSES, COOP_TIERS, COOP_MIN_PER, COOP_NEW_BASE, coopSize, COOP_AWAY_DAYS, COOP_GONE_DAYS, STICKERS, HELPS_PER_DAY, coopProcess, cleanCoopName, coopAutoName, coopAllowed };
