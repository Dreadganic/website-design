/* The Cup of Excellence: a weekly championship on equal terms. Everyone gets the same brief (three coffees, three processes, the week's weather
   and what the judges like) and the same crack windows. No staff, upgrades or estates count. Each player has three attempts a week; the best counts.
   The server works out every score from the brief and the player's choices, so the game only sends what was chosen and when the crack was tapped. */
const C = require("./community");

const ATTEMPTS = 3, DUR = 8000, MIN_PRESTIGE = 5;
/* mirrors the game's VAR (value and cup bonuses) and METHODS (cup) without any of the player's own bonuses */
const VARS = { caturra: { value: 1 }, catuai: { value: 1.1 }, castillo: { value: 1 }, mundonovo: { value: 1 }, catimor: { value: 0.9 },
  yellowbourbon: { value: 1.3, cup: { natural: 1.5, honey: 1.5 } }, pinkbourbon: { value: 1.4, cup: { whiskey: 2, rum: 2 } }, heirloom: { value: 1.8, cup: { washed: 2 } }, geisha: { value: 3, cup: { washed: 3, natural: 3, honey: 3 } } };
const METHODS = { washed: 84, natural: 85.5, honey: 85, rum: 87, whiskey: 87.5, strawberry: 88 };
const FLAVOUR = { caturra: "balanced", catuai: "balanced", castillo: "balanced", mundonovo: "chocolate", catimor: "bold", yellowbourbon: "sweet", pinkbourbon: "fruity", heirloom: "floral", geisha: "floral" };
const METHOD_FLAVOUR = { washed: "floral", natural: "fruity", honey: "sweet", rum: "bold", whiskey: "bold", strawberry: "fruity" };
const JUDGES = { floral: "floral, tea-like cups", fruity: "fruity, winey cups", sweet: "sweet, caramel cups", bold: "bold, heavy-bodied cups", chocolate: "chocolate and nut", balanced: "clean, balanced cups" };
const WEATHER = [
  { id: "rain", name: "A wet week", note: "Rain on the drying beds: naturals and honeys struggle, washed lots shine.", mod: { washed: 1.5, natural: -2, honey: -1 } },
  { id: "sun", name: "A dry, sunny week", note: "Perfect patio weather: naturals and honeys dry beautifully.", mod: { natural: 2, honey: 1, washed: -0.5 } },
  { id: "cool", name: "A cool, misty week", note: "Slow, even drying: washed and honey lots gain.", mod: { washed: 1, honey: 1, natural: -0.5 } },
  { id: "heat", name: "A heatwave", note: "Fermentation runs fast: barrel and infused lots come alive, washed lots go flat.", mod: { washed: -1, rum: 1.5, whiskey: 1.5, strawberry: 1.5 } }
];
const RARE = { geisha: 0.6, heirloom: 0.75, pinkbourbon: 0.8 };   /* rarer beans have tighter crack windows */
const bestRoast = (v, m) => (["geisha", "heirloom"].includes(v) || (m === "washed" && VARS[v].value >= 1.3) ? "light" : m === "rum" || m === "whiskey" || (m === "natural" && ["mundonovo", "yellowbourbon", "catimor", "catuai"].includes(v)) ? "dark" : "medium");   /* the game's bestRoast */

function rng(seed) {   /* mulberry32 from a string, so a week's brief is the same for everyone */
  let h = 1779033703 ^ seed.length; for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => { h |= 0; h = (h + 0x6d2b79f5) | 0; let t = Math.imul(h ^ (h >>> 15), 1 | h); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pick = (r, list, n) => { const a = list.slice(), out = []; while (out.length < n && a.length) out.push(a.splice(Math.floor(r() * a.length), 1)[0]); return out; };
function briefFor(wk) {
  const r = rng("coe:" + wk);
  const vars = pick(r, Object.keys(VARS), 3), methods = pick(r, Object.keys(METHODS), 3), weather = WEATHER[Math.floor(r() * WEATHER.length)];
  const tastes = [...new Set(vars.map((v) => FLAVOUR[v]).concat(methods.map((m) => METHOD_FLAVOUR[m])))], judge = tastes[Math.floor(r() * tastes.length)];
  return { week: wk, vars, methods, weather: { id: weather.id, name: weather.name, note: weather.note }, judge, judgeNote: "The judges this week love " + JUDGES[judge] + ".", attempts: ATTEMPTS, dur: DUR };
}
function crackWindow(wk, n, v) {   /* the same windows for everyone: attempt n's first crack, in ms into the roast, and how wide it is */
  const r = rng("coe:" + wk + ":crack:" + n);
  return { c: Math.round(3000 + r() * 3000), hw: Math.round((260 + r() * 300) * (RARE[v] || 1)) };
}
function scoreFor(wk, n, v, m, profile, t) {   /* everything that makes the score, worked out from the brief */
  const b = briefFor(wk), w = WEATHER.find((x) => x.id === b.weather.id), win = crackWindow(wk, n, v);
  const base = METHODS[m] + (VARS[v].value - 1) * 2 + ((VARS[v].cup || {})[m] || 0);
  const weather = w.mod[m] || 0, judge = (FLAVOUR[v] === b.judge ? 2 : 0) + (METHOD_FLAVOUR[m] === b.judge ? 1 : 0);
  const d = Math.abs(t - win.c), crack = d <= win.hw ? Math.round((10 + 5 * (1 - d / win.hw)) * 10) / 10 : -5;
  const best = bestRoast(v, m), order = ["light", "medium", "dark"], roast = profile === best ? 5 : Math.abs(order.indexOf(profile) - order.indexOf(best)) === 1 ? 0 : -5;
  const total = Math.round((base + weather + judge + crack + roast) * 10) / 10;
  return { base: Math.round(base * 10) / 10, weather, judge, crack, roast, total, best, early: t < win.c - win.hw, late: t > win.c + win.hw };
}
/* the Q grader rating: the best 4 weekly percentiles of the last 8 weeks, averaged over 4, times 10 (0 to 1000) */
const ratingFrom = (pcts) => Math.round(10 * pcts.slice().sort((a, b) => b - a).slice(0, 4).reduce((a, b) => a + b, 0) / 4);

module.exports = { ATTEMPTS, DUR, MIN_PRESTIGE, VARS, METHODS, WEATHER, rng, briefFor, crackWindow, scoreFor, bestRoast, ratingFrom };
