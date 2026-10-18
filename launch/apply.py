"""Launch Beju Farm on bejucoffee.com. Run this once, on launch day, then deploy.

  python3 launch/apply.py --target beju-site            # make the changes
  python3 launch/apply.py --target /tmp/copy --dry-run  # try it on a copy first

What it changes (nothing here is live until you run it):
  1. Builds /farm/ without its noindex tag and removes the /farm/* noindex header.
  2. Adds /farm/ to the sitemap and a "Beju Farm" link to every footer (EN and JA).
  3. Adds the thank-you page button that adds the order to the farm (assets/farm-thanks.<hash>.js).
  4. Adds the checkout sample offer (assets/farm-checkout.<hash>.js) and makes the site's checkout call send it,
     by rebuilding the site script under a new hashed name (assets are cached for a year, so names must change).
Then set GAME_SAMPLES=on in Netlify (Site configuration > Environment variables) so checkout honours samples.
"""
import argparse, hashlib, os, re, shutil, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ap = argparse.ArgumentParser()
ap.add_argument("--target", default=os.path.join(ROOT, "beju-site"))
ap.add_argument("--dry-run", action="store_true", help="say what would change without writing (use on a copy to test fully)")
args = ap.parse_args()
T = os.path.abspath(args.target)
done = []

def write(path, text):
    done.append(os.path.relpath(path, T))
    if not args.dry_run:
        open(path, "w").write(text)

def hashed(src, stem):
    body = open(src).read()
    name = "%s.%s.js" % (stem, hashlib.sha256(body.encode()).hexdigest()[:10])
    if not args.dry_run:
        open(os.path.join(T, "assets", name), "w").write(body)
    done.append("assets/" + name)
    return name

pages = [os.path.join(d, f) for d, _, fs in os.walk(T) for f in fs if f.endswith(".html") and "/farm" not in d.replace(T, "")]
bundle = [f for f in os.listdir(os.path.join(T, "assets")) if re.match(r"app\.[0-9a-f]+\.js$", f)]
if len(bundle) != 1: sys.exit("expected one assets/app.<hash>.js, found %s" % bundle)
old = bundle[0]
src = open(os.path.join(T, "assets", old)).read()
if "BejuFarm" in src: sys.exit("already applied: the site script mentions BejuFarm")

# 1. the game page, indexable, and its header
subprocess.check_call([sys.executable, os.path.join(ROOT, "game-assets", "play", "build.py"), os.path.join(T, "farm", "index.html") if not args.dry_run else os.devnull, "--site", "--launch"])
done.append("farm/index.html")
h = open(os.path.join(T, "_headers")).read()
h2 = h.replace("/farm/*\n  X-Robots-Tag: noindex, nofollow\n", "/farm/*\n")
if h2 == h: sys.exit("_headers: /farm/* noindex block not found")
write(os.path.join(T, "_headers"), h2)

# 2. sitemap and footers
sm = open(os.path.join(T, "sitemap.xml")).read()
if "/farm/" not in sm:
    entry = '  <url>\n    <loc>https://bejucoffee.com/farm/</loc>\n    <changefreq>weekly</changefreq>\n  </url>\n'
    write(os.path.join(T, "sitemap.xml"), sm.replace("</urlset>", entry + "</urlset>"))

# 3 and 4. scripts
thanks_js = hashed(os.path.join(HERE, "site", "farm-thanks.js"), "farm-thanks")
checkout_js = hashed(os.path.join(HERE, "site", "farm-checkout.js"), "farm-checkout")
call = "body: JSON.stringify({ lang: lang, lines: cart.map("
if src.count(call) != 1: sys.exit("site script: checkout call not found exactly once; update apply.py")
src = src.replace(call, "body: JSON.stringify({ farm: window.BejuFarm && window.BejuFarm.checkoutExtra ? window.BejuFarm.checkoutExtra() : undefined, lang: lang, lines: cart.map(")
new = "app.%s.js" % hashlib.sha256(src.encode()).hexdigest()[:10]
if not args.dry_run:
    open(os.path.join(T, "assets", new), "w").write(src)
    os.remove(os.path.join(T, "assets", old))
done.append("assets/%s (replaces %s)" % (new, old))

for p in pages:
    t = o = open(p).read()
    ja = "/ja/" in p.replace(T, "")
    t = t.replace("/assets/" + old, "/assets/" + new)
    if "/assets/" + new in t and checkout_js not in t:
        t = t.replace("</body>", '<script src="/assets/%s" defer></script>\n</body>' % checkout_js)
    if os.path.basename(os.path.dirname(p)) == "thanks" and thanks_js not in t:
        t = t.replace("</body>", '<script src="/assets/%s" defer></script>\n</body>' % thanks_js)
    j = '<li><a href="/ja/journal/">読みもの</a></li>' if ja else '<li><a href="/journal/">Journal</a></li>'
    if j in t and 'href="/farm/"' not in t:
        t = t.replace(j, j + ('<li><a href="/farm/">Beju Farm(ゲーム)</a></li>' if ja else '<li><a href="/farm/">Beju Farm game</a></li>'), 1)
    if t != o: write(p, t)

print(("Would change" if args.dry_run else "Changed") + " %d files:" % len(done))
for d in done: print("  " + d)
print("\nNext: set GAME_SAMPLES=on in Netlify's environment variables, then deploy.")
