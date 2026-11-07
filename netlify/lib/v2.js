/* Netlify's current function format, a Request in and a Response out, around the Lambda-style handlers in handlers/.
   Netlify Blobs needs this format for strong consistency: in Lambda compatibility mode connectLambda() passes no uncachedEdgeURL,
   so every strong read failed with BlobsConsistencyError and the game could never go online.
   Each function imports @netlify/blobs itself and passes it in: Netlify's file tracer only ships packages a function imports directly,
   and missed the one shared code loads with require(), so the bundle failed with "Cannot find module '@netlify/blobs'". */
exports.v2 = (mod, blobs) => {
  if (blobs) require("./game").useBlobs(blobs);
  return async (req, context) => {
    const url = new URL(req.url), headers = Object.fromEntries(req.headers);
    if (!headers["x-nf-client-connection-ip"] && context && context.ip) headers["x-nf-client-connection-ip"] = context.ip;
    const body = req.method === "GET" || req.method === "HEAD" ? undefined : await req.text();
    const fn = url.pathname.split("/").pop(), t0 = Date.now(), json = (status, o) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
    /* the kill switch: GAME_READONLY=1 in Netlify's environment refuses every change (the game keeps playing and tries again later) */
    if (process.env.GAME_READONLY === "1" && req.method !== "GET" && req.method !== "HEAD" && fn.startsWith("game-") && fn !== "game-beacon")   /* the game only: payments and Stripe's webhook always go through */ return json(503, { error: "read_only" });
    let r;
    try { r = await mod.handler({ httpMethod: req.method, headers, body: body || undefined, queryStringParameters: Object.fromEntries(url.searchParams), path: url.pathname }); }
    catch (e) {   /* one line a failure, so an outage and a bug can be told apart in the function log; the game treats 503 as "try later" */
      console.error(JSON.stringify({ fn, method: req.method, status: 503, ms: Date.now() - t0, err: String((e && e.message) || e).slice(0, 300), kind: e && e.name }));
      return json(503, { error: "unavailable" });
    }
    const ms = Date.now() - t0;
    if (r.statusCode >= 500 || ms > 3000) console.warn(JSON.stringify({ fn, method: req.method, status: r.statusCode, ms }));
    return new Response(r.body === undefined ? null : r.body, { status: r.statusCode, headers: r.headers || {} });
  };
};
