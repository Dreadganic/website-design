# Beju website: going live

This folder is a ready-to-deploy **Netlify project**:

- `beju-site/` is the website: 36 pages (18 in English and 18 in Japanese), each fully written out in the HTML so Google can read it.
- `netlify/functions/` holds three small payment functions that talk to Stripe: start a checkout, show the order on the thank-you page, and receive Stripe's "order paid" notice.
- `netlify.toml` tells Netlify where both live.

No `npm install` or build step is needed.

## 1. Check it before launch

These are **suggested defaults written for Beju**. Change anything that doesn't match how you work:
- **Subscription:** 10% off; pause, skip or cancel before roast day; roasting twice a week and shipping within 2 days; gift subscriptions.
- **Wholesale:** from 5 kg a month; free tasting and samples; a staff training session, recipe cards and equipment advice for partners; delivery across Japan.
- **Training courses:** Coffee Foundations (2 hours), Espresso & Milk (3 hours), Latte Art (3 hours) and the Café Starter Package (3 days), with group sizes and "price on request".
- **Coffee pages:** brew recipes, roast levels, flavour scores, food pairings and freshness windows.
- **Journal:** four guides (V60 recipe, grind size, storing beans, processing). These are general coffee advice, but they mention your coffees, so check them against your real sourcing.
- **Your coffees:** the farm details (region, altitude, variety, process, drying, harvest, grade) come from your green-coffee sheets. Still to confirm:
  - **Casablanca blend ratio:** set to 50% Brazil, 30% Colombia, 20% Costa Rica as a placeholder.
  - **Prices of the new coffees:** Colombia Rum Barrel ¥5,500, Ethiopia Yirgacheffe ¥3,500 and Sumatra Strawberry ¥4,500 are placeholders.
  - **Names:** "Colombia Rum Barrel", "Ethiopia Yirgacheffe" and "Sumatra Strawberry" are suggested names.
  - **Tasting notes** for the Rum Barrel, Yirgacheffe and Strawberry, and the brew recipes and pairings, are written by Claude.
  - **Gaps in the sheets:** the processing method of the Cundinamarca Excelso (set to washed) and the harvest months of Shimaren Farm (set to October to February) were not on the sheets.
- **Logo and bags:** the header, footer, favicon, app icons and share image use the final crane logo (tapered folds). The bag pictures on the shop and coffee pages are renders of your print-ready bag files (layout with the logo as the headline), front and back.
  - **Bag backs:** the corrected print files (beju_bags_logo_print-files_corrected) show @bejucoffeeroasters. Send those to the printer, not the earlier set.
- **Sample content:** anything else not from your sheets is sample content. Edit them in the `ORIGINS` and `PRODUCTS` blocks near the top of the script in each page, or send the real details back to Claude to rebuild the site.
- **Shipping routes and the map explorer:** the export ports, sea routes and transit days (for example "Buenaventura, about 28 days across the Pacific") are typical figures, not your importer's real schedule. The flavour groups used by "By taste" are set in `O_FLAV` and `P_FLAV`, and the harvest months come from each origin's `months`.
- **Japanese:** have a native speaker read the Japanese pages, especially the coffee terms.
- **Prices:** ¥3,000 for the Casablanca Blend and ¥5,500 for the Colombia Pink Whiskey (both from your current store). Your old store showed ¥2,400 for the Casablanca in one place, so confirm which is right.

## 2. Put it online on Netlify (with payments)

**Drag-and-drop deploys don't include functions**, so payments won't work that way. Use one of these:

- **Git (recommended):** put this folder in a GitHub repository. In Netlify, choose **Add new site → Import an existing project** and pick the repository. Netlify reads `netlify.toml`, so there's nothing to fill in. Every later change you push goes live by itself.
- **Netlify CLI:** install Node.js, then run `npm install -g netlify-cli`, `netlify login` and `netlify deploy --prod` from inside this folder.

Then:
1. Click through the test address (for example `beju.netlify.app`).
2. Point `www.bejucoffee.com` at it in Netlify's domain settings. This moves your domain off Squarespace, so keep the Squarespace store running until a real test order has gone through.
3. The `_headers` file adds security and caching headers automatically.

## 3. Payments with Stripe

Customers pay on Stripe's secure checkout page. Prices, the 10% subscription discount and delivery are built into the payment functions, so nobody can change what they pay in their browser.

### 3a. In Netlify: Site configuration → Environment variables

| Name | Value |
| --- | --- |
| `STRIPE_SECRET_KEY` | Your Stripe secret key. Start with the **test** key (`sk_test_…`), and switch to the live key (`sk_live_…`) when you're ready. |
| `STRIPE_WEBHOOK_SECRET` | The signing secret from step 3b (`whsec_…`). |
| `ORDER_NOTIFY_URL` | *(Optional)* A Formspree form address. Each paid order is emailed to you, with each coffee's grind and the delivery address. |
| `SITE_URL` | *(Optional)* `https://www.bejucoffee.com` once your domain points at Netlify. Until then, the Netlify address is used. |

Never put the secret key in `config.js` or any website file. Redeploy after adding variables.

### 3b. In Stripe (Dashboard)

1. **Webhook:** go to **Developers → Webhooks → Add endpoint** and enter `https://YOUR-SITE/.netlify/functions/stripe-webhook`. Choose the events `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
2. **Payment methods (Settings → Payment methods):** turn on Cards, Apple Pay, Google Pay, and PayPay and Konbini if you want them. Checkout shows whichever methods are on. Konbini only appears for one-off orders.
3. **Receipts (Settings → Customer emails):** turn on emails for successful payments. Also turn on the notifications you'd like to receive yourself.
4. **Customer portal (Settings → Billing → Customer portal):** turn it on, and allow customers to cancel and pause subscriptions. Copy its login link into `stripe.portalLink` in `config.js`. Subscribers will then see a "Manage your subscription" link.
5. **Public details:** set your business name, support email and the statement descriptor customers will see on card statements.

### 3c. Test, then go live

1. While using the test key, order a coffee with the card number `4242 4242 4242 4242`, any future date and any CVC. Try one subscription too.
2. Check that the thank-you page shows the order, the order appears in Stripe (test mode), and you get the order email.
3. Swap in the live key and the live webhook's signing secret, then redeploy.

### What's set, and what to confirm

- **Delivery:** ¥600 anywhere in Japan, free from ¥5,000. This is a placeholder: tell Claude your real rates.
  - Subscriptions charge delivery with every box, unless the box is over ¥5,000.
  - One-off bags added to a subscription order ship in the first box.
- **Subscriptions:** 10% off, every 2 weeks or every month. If a cart mixes both rhythms, the customer is asked to check out separately.
- **Prices include tax** (税込). Stripe doesn't add tax on top.
- **Changing prices, the discount or delivery** means rebuilding the package, because the functions must match the site. Ask Claude to do it.
- **Order by message on Instagram** stays available as a second option.

### Legal notice (特定商取引法に基づく表記)

Japanese law requires this page before you take online orders, and Stripe checks for it. It's at `/legal/` and linked in the footer.

Your seller details are filled in: Jordan Hipkiss (Beju Coffee Roasters), the Higashi-Ishikiri address, 080-1880-9040 and hello@bejucoffee.com. To change them, edit `seller` in `config.js`. As a sole trader, you can replace the address and phone with `"on-request"`, which shows "disclosed without delay on request". Give Stripe the page address: `https://YOUR-SITE/ja/legal/`.

## 4. Contact and enquiry forms

Create a free form at **Formspree** (formspree.io) and paste its address into `contactEndpoint` in `config.js`. Both the contact form and the wholesale/training enquiry form will then send to your inbox. Enquiries arrive with every answer included (business type, monthly volume, course, dates). Until then, the forms ask people to message you on Instagram.

## 5. Get found on Google

1. Add the site to **Google Search Console** and submit `https://www.bejucoffee.com/sitemap.xml`.
2. Claim or create your **Google Business Profile** as a roastery in Osaka, and add photos, hours and a link to the site. This is the biggest lever for local searches like "コーヒー豆 大阪".
3. Use the Rich Results Test (search.google.com/test/rich-results) on `/shop/` to confirm the product listings.
4. The product images in `images/` are made from the bag artwork. Swap in real bag photos when you have them (square, at least 1000px, same file names).

### What's already built in

- Separate pages for each section in English and Japanese, linked to each other so Google shows the right language.
- A title and description for every page.
- Structured data for search: your business (Osaka, Instagram), all five coffees with prices, and breadcrumbs.
- A sitemap that lists both languages, a robots file, a social-sharing preview image, a favicon and a 404 page.

## 4. Beju Farm game backend (first pieces)

The game's server parts run as Netlify Functions next to the payment functions, and store their data in **Netlify Blobs** (built into Netlify; nothing to sign up for). `package.json` lists the one package this needs (`@netlify/blobs`), and Netlify installs it on deploy.

| Function | What it does |
| --- | --- |
| `game-account` | Creates an anonymous player: an id and a secret token (only its hash is stored). |
| `game-save` | Cloud save. Versioned, so an old phone can't overwrite newer progress. |
| `game-score` | Live leaderboard (season and all time). Each score must be possible since the last one, so impossible jumps are refused. |
| `game-claim` | Turns a paid order into game rewards, once: 1 crane per ¥100 and a passport stamp for each coffee, checked with Stripe on the server. |
| `game-events` | Drop events, read from `netlify/lib/game-events.json`. Edit that file and push to schedule one. |

- **The game page:** `bejucoffee.com/farm/` (built by `python3 game-assets/play/build.py beju-site/farm/index.html --site`). It is hidden from search engines and not linked from the shop. Online features switch on only there; the Claude preview stays offline.
- **Linking an order:** send customers to `/farm/?claim=` followed by their Checkout session id (`cs_…`). The thank-you page already has that id; adding the button is one line when you're ready to launch.
- **Tests:** `npm test` runs the backend tests with an in-memory store and a fake Stripe.
- **Not built yet:** push notifications (needs an Apple Developer account and Firebase), Capacitor app wrapping, real co-ops, and a leaderboard that scales past a few thousand players (it currently reads every score; it should keep a running top list instead).


### Beju Farm rewards (backend, dormant until launch)
- New functions: `game-samples` (free samples the server has decided a player earned), `game-checkin` (daily check-ins, Japan time), `game-grants` (cranes waiting for the game, for example from subscription renewals).
- `create-checkout` adds an earned sample to orders of ¥3,000 or more **only when the environment variable `GAME_SAMPLES` is `on`**. Leave it unset until launch.
- `stripe-webhook` now also handles `checkout.session.expired`, `checkout.session.async_payment_failed` and `invoice.paid`. In Stripe (Developers > Webhooks), add those three events to the existing endpoint so samples are released and renewals earn cranes.
- Launch steps: `launch/README.md`.
