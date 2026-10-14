/* Minimal Stripe REST client (no dependencies, so the site deploys without an npm install).
   The secret key only ever lives in Netlify's environment variables, never in the website files. */
const crypto = require("crypto");
const API = "https://api.stripe.com/v1/";

function encode(obj, prefix, out) {
  out = out || [];
  for (const k of Object.keys(obj)) {
    const v = obj[k], key = prefix ? prefix + "[" + k + "]" : k;
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) v.forEach((x, i) => (typeof x === "object" ? encode(x, key + "[" + i + "]", out) : out.push(encodeURIComponent(key + "[" + i + "]") + "=" + encodeURIComponent(x))));
    else if (typeof v === "object") encode(v, key, out);
    else out.push(encodeURIComponent(key) + "=" + encodeURIComponent(v));
  }
  return out;
}

async function stripe(method, path, params, fetchImpl) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw Object.assign(new Error("STRIPE_SECRET_KEY is not set in Netlify"), { status: 500 });
  const body = params ? encode(params).join("&") : undefined;
  const url = API + path + (method === "GET" && body ? "?" + body : "");
  const res = await (fetchImpl || fetch)(url, {
    method,
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/x-www-form-urlencoded", "Stripe-Version": "2024-06-20" },
    body: method === "GET" ? undefined : body
  });
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error((data.error && data.error.message) || "Stripe error"), { status: res.status, stripe: data.error });
  return data;
}

/* Check the Stripe-Signature header (HMAC SHA-256 of "timestamp.payload"), allowing 5 minutes of clock drift. */
function verifySignature(payload, header, secret, toleranceSec) {
  if (!header || !secret) return false;
  const tPart = header.split(",").map(p => p.trim()).filter(p => p.startsWith("t="))[0];
  const t = tPart && tPart.slice(2);
  const sigs = header.split(",").map(p => p.trim()).filter(p => p.startsWith("v1=")).map(p => p.slice(3));
  if (!t || !sigs.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > (toleranceSec || 300)) return false;
  const expected = crypto.createHmac("sha256", secret).update(t + "." + payload, "utf8").digest("hex");
  return sigs.some(s => s.length === expected.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
}

module.exports = { stripe, verifySignature, encode };
