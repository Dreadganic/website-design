# Unreal remake: hand-off for the next agent

Read this first. It says where the Beju Farm Unreal remake stands on 13 November 2026, what is decided, and what blocks a start. Nothing has been built yet: this folder is a plan and its research.

## Files here

| File | What it is |
| --- | --- |
| `plan.md` | The full plan, copied from the owner's document. The living version is https://claude.ai/artifact/67WJVtYTStJ2aVjYLktL2D; if the two differ, the document wins. |
| `research-game-inventory.md` | A count of today's game from this repository: systems, data tables, art, audio, server, saves, tests. Has file paths and line numbers. |
| `research-engine-and-look.md` | Unreal version, how the Octopath-style look is built, sprites, phones, browser export, interface, risks. With sources. |
| `research-agent-tooling.md` | How terminal-only agents can build and test an Unreal project, and what must run on a machine with the engine. With sources. |
| `research-fable-in-unreal.md` | What is reported about Claude models on Unreal projects: best uses, poor fits, working setups, conventions. With sources. |
| `review-critique.md` | A sceptical review of the first draft. The plan was revised for every "must fix" point; read it to see why the plan says what it says. |

## What the owner has decided

- How you play: tap or walk. A tap acts at once and the farmer hurries over; a stick or keys steer directly.
- Platforms: PC first, landscape phones after, from one project.
- Build machine (confirmed 13 November): the owner's MacBook Pro, Apple M2 Max (38-core GPU, Metal), 32 GB memory, about 390 GB free, macOS 27. Unreal 5.8 is at `/Users/Shared/Epic Games/UE_5.8`; Blender and Xcode are installed. A local agent session runs on this machine, in this repository's clone.
- Spending (13 November): no separate money ceiling. Development stays inside the owner's Claude plan budget, so no paid extras (rented machines, bought kits, freelancers) without asking. The owner's hours are not capped.
- Repository (13 November): the Unreal project lives in the private repository `Dreadganic/beju-farm-unreal`, created empty.
- The tab bar and HUD decisions for the web game are separate and already built (see the HUD design document linked from earlier commits).

## What is still open (the plan's "Decisions for you")

The three that blocked phase 0 (ceiling, machine, repository) were answered on 13 November; see above. Phase 0 has started on the branch `unreal/phase0-rules-replay`.

Still open: a browser look test beside the Unreal one (recommended), the first release stopping at the roastery (recommended), the web game staying live (recommended), a fresh farm with honours carried over (recommended, needed before phase 3), free with no ads, languages at launch, Mogiana as the look-test scene, and the project's own name for the look ("HD-2D" is Square Enix's trademark).

The owner was also asked to write one sentence on what the remake must achieve that the web game cannot. The phase 2 go or no-go is judged against it.

## The plan in one paragraph

Unreal Engine 5.8 (5.9 is an unstable preview). Wide, lit 3D diorama scenes with today's pixel characters, laid out left to right in the order the coffee moves: estate, mill yard, Osaka roastery street, harbour. Rules, data, about 550 of 937 sprites, sound and the server carry over; all 13 places and the whole interface are rebuilt. Work is committed in steps: phase 0 set-up, phase 1 a look test of one Mogiana scene, phase 2 a 20-minute playable farm and mill, then a go or no-go. Each gate has written pass conditions in `plan.md`.

## What phase 0 contains

1. Lift the rules out of `game-assets/play/template.html` into a standalone JavaScript module: commands in, results out, with chance and the clock supplied from outside. The page calls `Math.random` 88 times and `Date.now` 207 times directly today, so no session can be replayed. Every later step depends on this. It can be done in a cloud session with no Unreal.
2. Three trials: build a scene by script (Unreal's Python, headless), build 3D kit pieces by script (Blender, headless), and choose the rules route (translate to C++, or run the same JavaScript module inside Unreal through an embedded engine such as QuickJS). The plan leans to one shared rule set if the trial holds.
3. Export scripts: data tables (load the built page headless and `JSON.stringify` each constant), sprite sheets from the palette-grid JSON, and audio rendered from the Web Audio synths.
4. The build loop on the owner's machine: one command builds, tests with `-nullrhi`, and takes fixed-camera screenshots (these need the real graphics card; software rendering does not work).
5. Store rules check: the server grants cranes for paid coffee subscriptions (`netlify/lib/handlers/game-grants.js`), which stores may restrict.
6. Count the interface's screens.

## Phase 0 progress

**13 November: a session can already be replayed, without changing the game.** `game-assets/rules/replay_probe.js` plays the built page headless inside a sealed environment (seeded `Math.random`, a `Date`, `performance.now` and timers that only move when told, no network, the frame loop driven by hand). It records a session of random taps and commands, plays it again in a fresh page, and compares the whole save after every step. Three sessions (300, 3,000 and 3,000 steps; seeds 1 to 3) matched at every step with no page errors.

What this does and does not show:

- The 88 `Math.random` and 207 `Date.now` calls do not block replay: replacing the two globals from outside covers them. Item 1 below overstates the problem.
- Coverage is the early game only. The random player used at most 36 command verbs of about 219 and never left the first farm (under 900 coins). The roastery, events, islands, time away and the online paths are untested. Next: replay the pacing bot's sessions (`game-assets/sim/policy.js`) through the same seal to reach prestige.
- The rules still need a browser page to run. Replay is solved for checking parity; running the rules inside Unreal (or translating them) still needs them separated from the page, which is the rules-route trial.

Run it with `python3 game-assets/play/build.py /tmp/beju-farm.html`, then `PW_MODULE=<path to playwright> node game-assets/rules/replay_probe.js /tmp/beju-farm.html 3000 2`. On the owner's Mac, Playwright is at `/Users/jordanhipkiss/beju/pw-env/node_modules/playwright`.

## Things worth knowing before you touch anything

- Picker income depends on map distances: pickers walk at 24 px/s between bush coordinates stored in `game-assets/sprites.json` (`tickFarm`, about line 2609). In the remake, walking time must become a data value.
- Every player action arrives as a `data-act` string through one click listener (about 219 verbs). That list is the natural interface to the lifted-out rules.
- The pacing bots in `game-assets/sim/` drive the real page in Playwright; there is no headless rules model yet.
- The reference for parity is a fixed version of the web game: the one published with the pending update.
- Agents do Unreal C++ with a compile-and-test loop well, and visual scripting, hand-made editor files and judging look and feel badly. Keep logic in C++, read every tool result back, and let the owner judge feel at gates.
- One editor at a time: agents sharing an open editor collide.
- Epic ships an experimental editor bridge for AI tools (MCP) since 5.8 and a Claude Code plugin; both are local-only, so editor work runs in a session on the Unreal machine.

## State of the web game in this repository

Everything is pushed to `main`. Two `[deploy]` commits for the shop landed on `main` on top of the game work (pull requests 18 and 19), and a `[deploy]` push publishes everything before it. So specialties, masterwork tiers, the Mrs. Okada rename, the HUD redesign and the edge-to-edge tab bar should now be live on bejucoffee.com; check the Netlify deploy log to confirm. Further production deploys cost 15 Netlify credits each and need `[deploy]` in a commit message; do that only when the owner asks. See `CLAUDE.md` at the repository root for the build, test and deploy rules.

## The five diagrams in the document

They are not in `plan.md`. In words:

1. **The world as four wide scenes.** Estate (fields, barn, estate project, road gate) → by truck → mill yard (wash and tanks, drying racks, cupping table, buyers' board) → ships to Osaka → roastery street (roasters, bag shelf, Counter café, the street) → by boat from prestige 5 → harbour (board, ledger, the boat, five islands).
2. **One diorama in cross-section.** Camera with a long lens looking slightly down; foreground leaves out of focus; the path with flat sprites in focus; fields and 3D buildings behind; a soft backdrop; one sun casting shadows, lamps adding glow.
3. **The parts of the Unreal game.** Text sources (game data, sprites and sound, scene recipes) feed the rules (kept apart from Unreal), the game layer and the world; the game layer drives the interface; the rules talk to an online part, which talks to today's server.
4. **The agent team.** The owner and a lead agent; a cloud crew (rules engineer, data and export, online engineer, designer) and an Unreal crew on the owner's machine (game-layer engineer, world builder, interface engineer, build and test keeper); every change passes tests, a separate reviewer agent, then the lead merges.
5. **Eight phases.** 0 set up, 1 look test, 2 first harvest (the go or no-go), 3 the core game, 4 roastery and seasons, 5 islands and endgame, 6 phones, 7 launch.
