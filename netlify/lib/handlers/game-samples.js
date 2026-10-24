/* GET  /.netlify/functions/game-samples  ->  { samples: [...], rules }
   POST /.netlify/functions/game-samples  ->  same, after granting any samples the player now qualifies for
   Free coffee samples live here, not in the game's save, so editing a save earns nothing. Eligibility comes from the
   server's own leaderboard record (prestige, level) and check-in days. */
const G = require("../game");

exports.handler = async (event) => {
  const deps = exports.__deps;
  if (["GET", "POST"].indexOf(event.httpMethod) < 0) return G.json(405, { error: "method_not_allowed" });
  const store = G.stores(event, deps), now = (deps && deps.now) || Date.now();
  const me = await G.authed(event, store);
  if (!me) return G.json(401, { error: "sign_in" });
  let fresh = [];
  if (event.httpMethod === "POST") {
    fresh = G.newSamples(me, await store.get("scores/" + me.id), now);
    if (fresh.length) { me.samples = (me.samples || []).concat(fresh); await G.savePlayer(store, me); }
  }
  return G.json(200, { samples: (me.samples || []).map((s) => G.sampleView(s, now)), fresh: fresh.map((s) => s.id), rules: G.SAMPLE_RULES, ladder: G.SAMPLE_LADDER });
};
