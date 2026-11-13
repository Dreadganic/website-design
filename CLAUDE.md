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

## Business agents
- Six agents for running the business are defined in `.claude/agents/`: `sales-scout`, `outreach-writer`, `product-rnd`, `numbers-analyst`, `web-shop` and `brand-content`. The main session is the lead: it hands out jobs, checks each report against its sources, and records the result.
- Facts and lead records live in a private pipeline doc, and jobs in a private tracker; each agent file gives the pipeline link. This repository is public, so customer names, prices, margins, contacts and lead lists never go into it.
- Agents draft and research only. Sending email, ordering, quoting and publishing the site happen from the main session, after the owner agrees.

## The Unreal remake
- The plan, its research and a hand-off note are in `docs/unreal-remake/`; read `docs/unreal-remake/README.md` first. The game itself is in the private repository `beju-farm-unreal`.
- Seven game agents are defined in `.claude/agents/` (`game-designer`, `game-engineer`, `game-world-builder`, `game-pixel-artist`, `game-interface-designer`, `game-story-researcher`, `game-tester`). The main session leads: it holds the one build machine, approves any paid art call, checks reports and commits.
- Game art is generated through fal.ai with the `game-assets-enhancement` skill; the key and the script live in the private repository, never here.
