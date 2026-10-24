/* POST /.netlify/functions/game-checkin  ->  { day, month, days }
   Records today's check-in (Japan time) on the server, once a day. Twenty check-ins in a month earn that month's free sample. */
const G = require("../game");

exports.handler = async (event) => {
  const deps = exports.__deps;
  if (event.httpMethod !== "POST") return G.json(405, { error: "method_not_allowed" });
  const store = G.stores(event, deps), now = (deps && deps.now) || Date.now();
  const me = await G.authed(event, store);
  if (!me) return G.json(401, { error: "sign_in" });
  const day = G.dayJST(now), month = day.slice(0, 7);
  me.checkins = me.checkins || {};
  const list = me.checkins[month] || [];
  if (list.indexOf(day) < 0) {
    me.checkins[month] = list.concat([day]);
    Object.keys(me.checkins).sort().slice(0, -3).forEach((k) => { delete me.checkins[k]; });   /* keep three months */
    await G.savePlayer(store, me);
  }
  return G.json(200, { day, month, days: me.checkins[month].length, needed: G.SAMPLE_RULES.monthlyCheckins });
};
