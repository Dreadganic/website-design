# Beju Farm launch kit

Everything the public website needs for the game launch, kept out of `beju-site/` until you're ready.
Until then the game stays at the unlisted, noindexed `/farm/`, and the backend pieces below are deployed but switched off.

## Already live (dormant or invisible)
- **Free samples on the server** (`game-samples`): the welcome bag, one per origin at prestige 2-5, and one a month for 20 check-ins (`game-checkin`). The server decides from its own records; editing a save earns nothing. Samples last 60 days.
- **Checkout redemption** (`create-checkout`): a sample rides with an order of ¥3,000 or more, shown on Stripe's page and noted on the order email. **Off until `GAME_SAMPLES=on`**, and a problem with a sample never blocks a purchase.
- **Webhook** (`stripe-webhook`): marks a sample redeemed when the order is paid, gives it back if the checkout expires or a konbini payment fails, and pays cranes for every paid subscription renewal (`game-grants` hands them to the game).
- **Subscriptions**: claiming a subscription order in the game links it, so renewals earn cranes.

## On launch day
1. Try it on a copy: `cp -r beju-site /tmp/beju-launch && python3 launch/apply.py --target /tmp/beju-launch`
2. Apply it for real: `python3 launch/apply.py` and commit the result.
3. In Netlify, add the environment variable `GAME_SAMPLES` = `on` (Site configuration > Environment variables), then deploy.
4. Check: the footer shows "Beju Farm game", `/farm/` has no noindex, a test order's thank-you page shows "Add this order to Beju Farm", and the cart drawer offers an earned sample.

## What `apply.py` changes
- `farm/index.html` rebuilt without noindex; `/farm/*` noindex header removed; `/farm/` added to the sitemap.
- Footer link on every page (EN "Beju Farm game", JA "Beju Farm(ゲーム)").
- Thank-you pages (EN and JA): an "Add this order to Beju Farm" card linking to `/farm/?claim=<session>` (`site/farm-thanks.js`).
- Every page with the cart: the sample offer (`site/farm-checkout.js`), and the site script sends it with the checkout request. The script is saved under a new hashed name because assets are cached for a year.

## Fulfilment
Order emails (`ORDER_NOTIFY_URL`) gain a line: "Include a free 100 g … sample (Beju Farm)". Pack one 100 g bag of that coffee; "Roaster's choice" means the monthly sample, your pick.
