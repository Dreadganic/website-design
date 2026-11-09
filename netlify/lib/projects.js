/* Co-op projects: a washing station, a shade grove, a cupping lab, built together over weeks. One project at a time, three stages,
   one stage a week at most. Each stage has three slots filled by normal play (the same weekly counts the Derby reads: lots sold, cupped,
   golden bushes, contracts, roasts). A member whose focus matches a slot counts double, which gives the specialties a part to play.
   Stages never fail or decay: a stalled stage waits. Sized to the members when the stage opens. Rewards are cosmetic only: a builders'
   plaque that keeps every name, and a trophy for the shelf. Separate from the Derby: projects score no Derby points. */
const C = require("./community");

const PER = { sell: 60, cup: 20, golden: 8, contract: 6, roast: 25 };   /* each slot asks this much per member */
const SLOT_NAME = { sell: "Lots sold or delivered", cup: "Lots cupped by hand", golden: "Golden bushes", contract: "Contracts completed", roast: "Bags roasted" };
const FOCUS_SLOT = { grow: "golden", mill: "cup", roast: "roast", trade: "contract", wander: "sell" };   /* a focus doubles one kind of slot */
const PROJECTS = {
  wetmill: { name: "Washing station", stages: [["sell", "cup", "contract"], ["sell", "golden", "roast"], ["cup", "contract", "golden"]] },
  grove: { name: "Shade grove", stages: [["golden", "sell", "cup"], ["golden", "contract", "roast"], ["sell", "cup", "golden"]] },
  lab: { name: "Cupping lab", stages: [["cup", "roast", "sell"], ["cup", "contract", "golden"], ["roast", "cup", "sell"]] }
};
const ORDER = ["wetmill", "grove", "lab"];

function openStage(coop, wk) {   /* the next stage: sized to the members now */
  const P = coop.project, kinds = PROJECTS[P.kind].stages[P.stage], n = Math.max(2, coop.members.length);
  P.slots = kinds.map((k) => ({ k, need: PER[k] * n, have: 0 })); P.wk = wk;
}
function ensure(coop, wk) {   /* -> true when it changed */
  if (!coop.project) { coop.project = { kind: ORDER[(coop.built || []).length % ORDER.length], stage: 0, by: {}, seen: {} }; openStage(coop, wk); return true; }
  const P = coop.project;
  if (P.waiting && P.waiting !== wk) {   /* a finished stage: the next opens the following week */
    delete P.waiting;
    if (P.stage >= 3) { coop.project = { kind: ORDER[(coop.built || []).length % ORDER.length], stage: 0, by: {}, seen: {} }; }
    openStage(coop, wk); return true;
  }
  return false;
}
/* counts: this week's running totals from the game (as for the Derby); only the rise since last time counts */
function add(coop, pid, counts, focus, wk, now) {
  const P = coop.project; if (!P || P.waiting || !counts || typeof counts !== "object") return { changed: false };
  const seen = (P.seen[pid] && P.seen[pid].wk === wk) ? P.seen[pid] : { wk, c: {} };
  let changed = false, done = null;
  P.slots.forEach((s) => {
    const cur = Math.max(0, Math.floor(Number(counts[s.k]) || 0)), rise = Math.max(0, Math.min(PER[s.k] * 4, cur - (seen.c[s.k] || 0)));
    if (!rise) return;
    const got = rise * (FOCUS_SLOT[focus] === s.k ? 2 : 1), room = Math.max(0, s.need - s.have), take = Math.min(room, got);
    if (take > 0) { s.have += take; P.by[pid] = (P.by[pid] || 0) + take; changed = true; }
  });
  Object.keys(PER).forEach((k) => { const cur = Math.floor(Number(counts[k]) || 0); if (cur > (seen.c[k] || 0)) { seen.c[k] = cur; changed = true; } });
  P.seen[pid] = seen;
  if (P.slots.every((s) => s.have >= s.need)) {
    P.stage += 1; P.waiting = wk; changed = true;
    if (P.stage >= 3) { coop.built = (coop.built || []).concat([{ kind: P.kind, at: now, names: Object.keys(P.by) }]); done = P.kind; }
  }
  return { changed, done };
}
function view(coop, me, names) {
  const P = coop.project; if (!P) return null;
  return { kind: P.kind, name: PROJECTS[P.kind].name, stage: Math.min(3, P.stage), stages: 3, waiting: !!P.waiting,
    slots: (P.slots || []).map((s) => ({ k: s.k, name: SLOT_NAME[s.k], need: s.need, have: Math.round(s.have) })), focusSlot: FOCUS_SLOT,
    builders: Object.entries(P.by || {}).sort((a, b) => b[1] - a[1]).map(([pid, n]) => ({ name: names[pid] || "Farmer", n: Math.round(n), you: pid === me.id })),
    built: (coop.built || []).map((b) => ({ name: PROJECTS[b.kind].name, at: b.at, n: (b.names || []).length })) };
}
module.exports = { PROJECTS, PER, FOCUS_SLOT, SLOT_NAME, ensure, add, view };
