# Beju website and Beju Farm

## Deploying: read before pushing to main
- A push to `main` publishes to bejucoffee.com only when a commit message in the push contains `[deploy]` (any case). A pull request's title counts too, since GitHub puts it in the merge commit.
- Each production deploy costs 15 Netlify credits, so batch work: push freely, and write `[deploy]` once, on the commit or PR title that should go live, only when you mean it. Without it the push is kept but not published; the next `[deploy]` push publishes everything since.
- Deploy Previews and branch deploys are free and unaffected.
- To publish with no new commit: a Netlify build hook, or Deploys → Trigger deploy → Clear cache and deploy site.
- The rule lives in `netlify/deploy-gate.sh`; its tests are in `netlify/tests/deploy-gate.test.js`.

## The game
- Source: `game-assets/play/template.html`. The live copy, `beju-site/farm/index.html`, is built from it with `python3 game-assets/play/build.py beju-site/farm/index.html --site --beta`; commit both.
- Tests: `npm test` for the server; the browser suites and the pacing bots are in `game-assets/sim/` (see its README).
