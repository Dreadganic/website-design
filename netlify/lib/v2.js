/* Netlify's current function format, a Request in and a Response out, around the Lambda-style handlers in handlers/.
   Netlify Blobs needs this format for strong consistency: in Lambda compatibility mode connectLambda() passes no uncachedEdgeURL,
   so every strong read failed with BlobsConsistencyError and the game could never go online. */
exports.v2 = (mod) => async (req, context) => {
  const url = new URL(req.url), headers = Object.fromEntries(req.headers);
  if (!headers["x-nf-client-connection-ip"] && context && context.ip) headers["x-nf-client-connection-ip"] = context.ip;
  const body = req.method === "GET" || req.method === "HEAD" ? undefined : await req.text();
  const r = await mod.handler({ httpMethod: req.method, headers, body: body || undefined, queryStringParameters: Object.fromEntries(url.searchParams), path: url.pathname });
  return new Response(r.body === undefined ? null : r.body, { status: r.statusCode, headers: r.headers || {} });
};
