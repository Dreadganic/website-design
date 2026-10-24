/* GET /.netlify/functions/game-events  ->  { now, events: [...] }
   Drop events for the game. Edit netlify/lib/game-events.json and push: the game picks them up without an app update. */
const G = require("../game");
const EVENTS = require("../game-events.json");

exports.handler = async (event) => {
  const deps = exports.__deps, now = (deps && deps.now) || Date.now();
  const list = ((deps && deps.events) || EVENTS).events.filter((e) => Date.parse(e.ends) > now).map((e) => Object.assign({}, e, { live: Date.parse(e.starts) <= now }));
  return G.json(200, { now, events: list }, { "Cache-Control": "public, max-age=300" });
};
