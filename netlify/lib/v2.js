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
    const r = await mod.handler({ httpMethod: req.method, headers, body: body || undefined, queryStringParameters: Object.fromEntries(url.searchParams), path: url.pathname });
    return new Response(r.body === undefined ? null : r.body, { status: r.statusCode, headers: r.headers || {} });
  };
};
