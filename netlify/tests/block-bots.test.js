/* The bot-blocking edge function (netlify/edge-functions/block-bots.js): every real file on the site is served to a browser, probes
   and scrapers are turned away, and the function skips the static files a page loads but still covers pages, images and the game. */
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "../../beju-site");
const PHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const load = () => import("../edge-functions/block-bots.js");
const siteFiles = () => {
  const out = [];
  const walk = (d) => fs.readdirSync(d).forEach((f) => { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else out.push("/" + path.relative(ROOT, p).split(path.sep).join("/")); });
  walk(ROOT); return out;
};
const matches = (pattern, p) => new RegExp("^" + pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$").test(p);   /* the URLPattern wildcards the config uses */

test("block-bots: every file on the site, and every page at its clean address, is served to a browser", async () => {
  const { isBlocked } = await load();
  const files = siteFiles(), pages = files.filter((f) => f.endsWith("/index.html")).map((f) => f.replace(/index\.html$/, ""));
  const blocked = files.concat(pages).filter((p) => isBlocked(p, PHONE));
  assert.deepEqual(blocked, [], "real paths blocked: " + blocked.join(", "));
});

test("block-bots: scanners, probes and scrapers are turned away", async () => {
  const { isBlocked } = await load();
  ["/wp-login.php", "/.env", "/.git/config", "/admin", "/api/v1/users", "/phpmyadmin/", "/backup.zip"].forEach((p) => assert.ok(isBlocked(p, PHONE), p));
  ["GPTBot/1.1", "python-requests/2.31", "Scrapy/2.11", ""].forEach((ua) => assert.ok(isBlocked("/farm/", ua), "user agent: " + (ua || "(none)")));
  assert.ok(!isBlocked("/farm/", "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"), "search engines are let in");
});

test("block-bots: it skips the files a page loads, but still covers pages, images, the game and unknown paths", async () => {
  const { config } = await load();
  const skipped = (p) => config.excludedPath.some((x) => matches(x, p));
  ["/assets/app.11b4635bf5.js", "/assets/site.f5baebc8dc.css", "/favicon.ico", "/config.js", "/farm/sw.js", "/farm/manifest.webmanifest", "/.netlify/functions/game-save"].forEach((p) => assert.ok(skipped(p), "skipped: " + p));
  ["/", "/shop/", "/ja/shop/casablanca/", "/farm/", "/images/bags/casablanca-front.jpg", "/wp-login.php", "/.env", "/robots.txt"].forEach((p) => assert.ok(!skipped(p), "still covered: " + p));
  const html = siteFiles().filter((f) => f.endsWith(".html")), assetRefs = new Set();
  html.forEach((f) => (fs.readFileSync(path.join(ROOT, f), "utf8").match(/(?:src|href)="\/[^"#?]+/g) || []).forEach((m) => assetRefs.add(m.replace(/^(?:src|href)="/, ""))));
  const staticRefs = [...assetRefs].filter((p) => /\.(js|css|ico|svg|png|webmanifest)$/.test(p) && !p.startsWith("/images/") && p !== "/og-image.png");
  assert.deepEqual(staticRefs.filter((p) => !skipped(p)), [], "a script, style or icon the pages load isn't skipped");
});
