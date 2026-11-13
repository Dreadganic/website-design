<!-- Research report from 13 November 2026, kept as written by the agent that produced it. -->

Note: the export hides the diagrams, so any gate conditions shown only in the phases diagram were invisible to me; they belong in text either way. I spot-checked the repository to test several claims (files at the end).

## Verdict
The engineering shape is sensible, but the plan never argues that the remake should exist, sets no budget or stop rule, and gives its two largest jobs (art and interface) one line each. Several comfort claims ("keeps the economy identical", "Kept as it is", sprites "carry over", "compiles and tests in seconds") do not hold. I would tell the owner: fund phases 0 to 2 only, under a ceiling written down today, and run the same look test in browser 3D beside Unreal, because a browser version keeps the one-tap entry and the existing rules.

## Must fix

1. **No case, ceiling or alternative.** The server code says the online game "didn't work on bejucoffee.com until 24 October 2026": three weeks of data, and the plan cites no player numbers. It ports the game one-for-one ("No new systems") though the 6 November audit found the problem is reasons to play, not looks. Add a section before Decisions: current players and retention; the result that would justify the spend; the options (keep improving the web game, the diorama look in browser 3D, Unreal); a ceiling in dollars and owner-hours for phases 0 to 2. Limit the first release to farm, mill and roastery; "the phase 5 gate allows cutting" is too late.

2. **Gates cannot be decided.** "You decide go or no-go" and "you judge feel" are not conditions. Write them now.
   - Phase 0: one command on a clean copy builds the trial scene twice with matching screenshots and no hand steps.
   - Phase 1: the owner approves the scene against a target picture agreed beforehand; 60 fps on a named minimum PC and 30 fps for 15 minutes on a named phone; start-up time and download size under set limits; cost per scene times scene count fits the ceiling.
   - Phase 2: recorded sessions match (item 3); five current players finish a first sale unaided and three prefer it to the web game.

3. **The rules port untangles and translates at once, and its proof is unplanned.** "Formulas port almost line for line" and "must land on the same numbers", yet the page has 88 `Math.random` and 207 `Date.now` calls with no seeded generator. All 23 browser suites drive the page, so "640 rule checks become the remake's rule tests" is a rewrite. Add a first step, in JavaScript, in the cloud: pull the rules into a standalone module (commands in, results out, seeded chance, supplied clock) that passes today's checks. Then choose between porting to C++ and running that module inside Unreal, which avoids two rule sets for good. Name the frozen web version used as reference; "gets fixes" conflicts with it.

4. **"Keeps the economy identical" contradicts tap-or-walk.** Picker walking becomes data, but "your farmer walks there and does the obvious thing" slows hand picking, cupping and the 30-second golden bush. State that actions land on the tap and the farmer catches up, or re-measure pacing with bots that model walking before the phase 2 gate.

5. **Nobody is named as making the art.** "One kit of reusable pieces" has no maker, method or specification: a pixel scale shared by sprites and textures, a piece list per origin, backdrops, water, foliage, weather effects (editor-made files with no text form), four prestige reskins. "937 sprites ... Carry over" contradicts "Top-down pictures can't become side-on 3D scenes"; objects drawn for that view share the problem. "None of the motion-based smoothing" conflicts with "Unreal's standard" depth of field, which relies on it to look clean. Add an Art section naming who or what makes each asset class. Require the look test to show a crowded scene (8 pickers, 40 bushes) and one menu with real text.

6. **"Server ... Kept as it is" is untrue.** The plan itself needs a second save ("New format"), a client identity, board and co-op rules for two farms on one account, a score cap per game, and a sign-in path: accounts are anonymous tokens moved by an 8-character link code. The risk table leans on "the fresh-farm decision", which is still open. Decide it now and list the server changes.

7. **Store rules are deferred and understated.** "It shapes the store pages, not the build" and "it does not affect PC" are unsafe: the server grants cranes for paid subscription renewals, which is in-game currency for purchases outside the store. Move the check to phase 0 and add a checklist: Steam's $100 fee and identity checks, Google's 14-day closed test for new accounts, privacy and in-app account deletion, age rating, controller support in every menu, languages (the game is English-only today), accessibility (cues that do not rely on colour or glow, blur and flash toggles), analytics.

## Should fix
- "Compiles and tests in seconds" (stated twice) is minutes in practice; measure it in phase 0. With "one editor at a time", the four-role Unreal crew is one queue; say so.
- The interface is uncounted ("New work") yet is most of an idle game; count its panels. "Interface ... written in C++" conflicts with "widget layouts" through an "experimental" bridge, and dropping "layout checks" leaves it untested.
- "Strong" for a 55.5% pass rate whose misses were "behaviour bugs" oversells. Add that no report was found of an agent team shipping a complete Unreal game.
- "Leave it reachable" needs detail: always on, disk space, who clears a hung editor, what access agents get to a personal machine. Replace "move to it once it is final" with staying on 5.8 until release.
- Switch is one fixed console, not evidence for Android phones. Add battery and heat to the phone budget, and test landscape play with current portrait players.
- Jargon: "pure sums", "plain C++", "binary files", "round-trip tests", "editor bridge", "Blueprints", "depth offset", "pinned", "voicings", "stage documents". Add a glossary or reword.

## What is solid
- Look test, then small slice, then go or no-go; no dates before measurement.
- Rules kept apart from the engine and checked against the web game; the walking-time finding.
- The candid table of what agents do badly; no agent signs off by "playing".
- The web game stays as the way in; own name for the look; few add-ons.

Files checked:
- /tmp/claude-0/-home-user-website-design/a90e8fbb-74db-5d74-b4f7-b632c683ab9f/scratchpad/ue_plan.txt
- /home/user/website-design/game-assets/play/template.html (random and clock call counts, no Japanese text)
- /home/user/website-design/netlify/lib/game.js (line 84, online since 24 October)
- /home/user/website-design/netlify/lib/handlers/game-account.js and game-link.js (anonymous tokens, link code)
- /home/user/website-design/netlify/lib/handlers/game-grants.js (cranes from paid renewals)
- /home/user/website-design/game-assets/sim/ (all 23 `*_e2e.js` suites touch the page)
