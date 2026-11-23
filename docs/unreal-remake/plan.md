> Copy of the plan document at https://claude.ai/artifact/67WJVtYTStJ2aVjYLktL2D as of 13 November 2026. The document is the living version and holds five diagrams that appear here only as captions.

# Beju Farm: Unreal remake plan

2026-11-13 · Jordan

## The short version

Beju Farm is remade in Unreal Engine 5.8 as a landscape game of wide, lit pixel-art scenes you tap or walk through, on PC first and phones after. The rules, data, sprites, sound and server carry over from today's game; every scene and the whole interface are rebuilt.

- **Who builds it.** A lead agent and eight specialist roles in two crews: one in the cloud lifting the rules out of today's game and testing them, one on your Unreal machine building what you see.
- **The order.** Set up, then a look test of one Mogiana scene, then a 20-minute playable farm and mill. Commit to those three phases only; you decide go or no-go there, before the full build starts.
- **What you play first.** The look-test scene: your farmer walking a lit Mogiana estate. Then the first harvest: pick, dry, cup and sell.
- **How big it is.** Large. Today's game has about 20 systems and 13 places, and none of its scenes convert. There are no dates until the first two phases have measured the real cost.
- **What I need to start.** The details of your Unreal machine, a new repository, a spending ceiling for the first three phases, and your ticks on the open decisions below.

## Before you commit

My advice is to commit to phases 0 to 2 only, under a ceiling you write down today, and to decide the rest on what those phases show. A separate agent reviewed this plan as a sceptic, and three of its points come before everything else.

**It needs a reason beyond looks.** The 6 November audit found the web game's weak spot is reasons to keep playing, not how it looks, and the online game has only worked on the site since 24 October. Before phase 0, write one sentence on what the remake must achieve that the web game can't: a Steam audience, say, or a game people stop to look at. The phase 2 gate is judged against that sentence.

**There are three routes, not one.**

| Route | What you get | What it costs | What you give up |
| --- | --- | --- | --- |
| Keep improving the web game | One tap from the coffee site, and everything built so far | Nothing new | The new look and a PC audience |
| The same diorama look, built for the browser | Lit 3D scenes with pixel characters, still one tap from the site, running today's rules as they are | Every scene rebuilt in 3D and a new landscape interface | Unreal's ready-made lighting and effects tools; store versions take extra work |
| The Unreal remake (this plan) | The full look, with store versions for PC and phones, by a method shipped games have proven | Every scene and the interface rebuilt, the rules moved across, and a build machine | The browser. The web game has to keep running beside it |

You asked for Unreal and this plan delivers that. The browser route is worth one cheap test all the same: I can build a browser version of the look test here, with no Unreal machine, so you can hold the two side by side at the phase 1 gate.

**It needs a ceiling.** Set a limit for phases 0 to 2, in money and in your own hours. Running through it is a no-go signal by itself.

## Decisions for you

Three choices are made; ten are open. Tick what you agree with, or comment on a line and I'll change the plan.

| Decided on 13 November | Your choice |
| --- | --- |
| How you play | Tap or walk: tap or click and the farmer goes there, or steer directly |
| Where it launches | PC first, landscape phones after, from the same project |
| Where it's built | Your machine with Unreal installed; agents write from the cloud |

**Open**

- [ ] **A ceiling for phases 0 to 2**, in money and in your own hours.
    Yours to set; comment with the numbers. Nothing starts without it.
- [ ] **A browser look test beside the Unreal one.**
    Recommended. It needs no Unreal machine and shows what the cheaper route would look like before you commit.
- [ ] **The first release stops at the roastery**: farms, mill, roastery and Counter. Islands, co-ops and the prestige worlds follow as updates.
    Recommended. It roughly halves what must exist before anyone outside can play.
- [ ] **The web game keeps running** on bejucoffee.com while the remake is built, and gets fixes only once the pending update is published.
    Recommended. Unreal can't run in a browser, so the web game stays the free way in from the coffee site.
- [ ] **A fresh farm in the remake, with your honours carried over** (crest, titles, cosmetics) from the web account, instead of one shared save.
    Recommended as the working assumption; confirm it before phase 3, because the online work depends on it.
- [ ] **Free, no ads, same as today**, on Steam and later on phones.
    Recommended. The crane rewards for real coffee orders must be checked against each store's rules in phase 0, before the build relies on them.
- [ ] **Languages at launch**: English only, as today, or English and Japanese.
    Yours to choose. It touches every screen, so it is cheapest decided early.
- [ ] **Mogiana is the look-test scene**: the first farm a new player sees.
- [ ] **A new private GitHub repository** for the Unreal project, separate from the website's.
    Needed before any Unreal work starts. Unreal's files are large and need their own storage setup.
- [ ] **Our own name for the look.** "HD-2D" is Square Enix's trademark, so the store pages describe ours in other words (for example "pixel-art dioramas").

## What carries over and what's rebuilt

The rules, the data, most of the sprites, the sound and the server carry over, each with work attached; the scenes and the interface are rebuilt. An agent read the whole repository to count it.

| Part of today's game | Size today | In the remake | How |
| --- | --- | --- | --- |
| Rules and formulas | About 970 functions; about two thirds only work out a number | Lifted out of the web page, then moved across | Harder than it sounds: anything that changes the farm is mixed with sound, notices and page building today, and chance and the clock are read directly about 300 times. Step one separates them; see How it's built |
| Game data: coffees, methods, upgrades, tiers, tasks, events | About 290 tables and constants | Exported by script | A script reads them out of the built page. Tables with small formulas inside are converted by hand |
| Character and object sprites | 937 sprites, 407 of them animation frames | About 550 carry over | Characters, portraits, crops and event creatures export straight to sprite sheets, with extra frames for walking in depth. About 145 building sprites were drawn for the top-down view and become 3D pieces; icons and decorations are decided one by one |
| Scenes | 26 flat pictures of 13 places, drawn top-down at 192 x 352, plus 42 estate overlays | Rebuilt as 3D dioramas | The biggest art job. Top-down pictures can't become side-on 3D scenes; they serve as reference |
| Prestige 7 to 10 buildings and effects | Drawn in code | Rebuilt as 3D pieces | New work, guided by the existing designs |
| Sound and music | 59 effects, 10 event sound sets, 14 songs, each in two sound styles; all made live by code | Recorded to audio files | A script plays each one through the existing synth and saves it |
| Interface | Eight tabs of web panels built for portrait; the screens are not yet counted | Rebuilt for landscape | New work, and most of what an idle game is. Phase 0 counts the screens; the HUD rules already agreed apply |
| Server: accounts, cloud saves, boards, co-ops, visits | 18 game functions | Kept, with additions | An app can call it today. It gains a second save for each account, a marker for which game is calling, separate boards and score limits, and a way to link an existing farm to the app |
| Saves | One object with about 213 field names | New format | See the fresh-farm decision |
| Tests | 85 server tests; about 1,000 browser checks | About 640 rule checks are rewritten against the lifted-out rules | Each states its rule in words, but all of them run through the web page today. New layout checks are written for the new interface |
| Pacing bots | Drive the real web page | The method carries over | The web game becomes the reference the new rules are checked against |

**One finding changes the plan.** Income depends on the map: pickers earn by walking between bushes at a fixed speed, so the distance between things is part of the balance. Wide scenes would quietly change the economy. In the remake, walking time becomes a number in the data, set to match today's pace, and the scene is free to look how it should. Your own farmer needs the same care: a tap acts at once, as it does today, and the farmer is shown hurrying over, so hand play is no slower than on the web.

## The game, reimagined sideways

The coffee's journey becomes the world: each place is one wide scene you travel left to right, in the order the coffee moves. The rules underneath (economy, pacing, prestige) carry over; what changes is how you see and touch them.

> Diagram in the doc: the world as four wide scenes · stations in coffee order

Read each band as one scene you scroll sideways. The station order inside a scene is a first proposal; the look test and the first playable slice will move things.

**How you play**

- **Tap or walk.** Tap or click anything and it happens at once, as today, while your farmer hurries over: pick, cup, crack, serve. A stick or the keys walk the farmer directly, with one "act" button near things. Both work at all times.
- **The idle heart stays.** Pickers, the foreman, the agent and the head roaster still run the chain while you watch or are away. Your farmer is where active play happens: hand picking, hand cupping, the crack and the drop, serving at the Counter.
- **The camera** looks from the side with a slight downward tilt and follows the farmer. Pull back to see a whole estate at once; push in on one work area.

**What the wide screen and the new look add**

- **Light as information.** A dry rack glows under its lamp, a golden bush lights the plants around it, first crack flares in the roaster, a storm changes the whole scene. Less text has to say it, though light is never the only signal: each cue keeps a word or an icon for players who can't rely on colour or glow.
- **Depth as place.** Foreground plants frame the scene, the work happens on the middle path, and each origin's landscape fills the back: Mogiana's plains, Huila's mountains, Toba's lake.
- **The cast lives there.** Rosa, Captain Ama, the estate managers and the Counter regulars walk the same path you do, so talking to someone is walking up to them.
- **Prestige themes become worlds.** Gold, Inferno, Heaven and Cosmos change the sky, the light and the buildings, not only the sprites.

**The interface in landscape**

- The rules from the HUD design carry over: the scene is the screen, numbers show when they matter, one moment card at a time, at most 12% covered.
- Menus open as a panel on the right third, so the scene stays visible on the left. Small cards open beside the thing you tapped: a rack, a roaster, a person.
- Farm, Mill and Roast are places you travel to along a ribbon at the top. Unlock, Daily, Ranks, Looks and Shop become things in the world (a notebook, a task board, a trophy shelf, a wardrobe, a stall) and stay reachable from one menu button.

**What it does not do, at first.** No new systems, currencies or timers until the first playable slice has passed its gate. The remake earns its keep by making the existing game feel new; new rules come after.

## The look

The look is today's pixel characters standing in small, lit 3D scenes, with a lens that keeps the working path sharp and softens everything in front and behind. We take the technique that Octopath Traveler made famous, with our own art, characters and interface.

> Diagram in the doc: one diorama in cross-section · four depth zones, camera and light

The recipe comes from the published production talks for Octopath Traveler and Live A Live, both made in Unreal:

- **Characters are flat sprites** standing upright in the scene. Our 16 x 24 pixel characters are the same scale as the classic games this style draws on, so they carry over.
- **The world is simple 3D with pixel-art textures**, built from a kit of reusable pieces on a grid, with one shared material. Octopath was built this way.
- **Light does most of the work.** One sun casts shadows; lamps, windows and the roaster add glow; each scene is lifted just enough that sprites stay readable at night.
- **The lens effects are Unreal's standard ones**: depth of field, bloom, fog and a light vignette, tuned scene by scene. We follow Live A Live and keep the blur gentle, because this is a game you work in, not only look at.
- **Pixels stay crisp.** No smoothing on textures. Unreal's motion-based smoothing smears sprites, yet its blur looks grainy without it, so the look test has to find the setting that serves both.

**On phones.** Unreal's phone renderer supports this recipe in a lighter form: cheaper blur, one shadowed light, round shadows under characters. Live A Live shipped this look on the Switch with that renderer, which is encouraging but is one fixed console, not the many kinds of Android phone. The working targets are 60 frames a second on PC and 30 on a named mid-range phone, held for 15 minutes without the phone running hot, to be proven in phase 1.

**What the look test must find.** Nobody has published the lens or blur values, so phase 1 finds ours. It also has to clear one known fault in Unreal 5.8, where overlapping sprites can flicker; nudging each sprite slightly in depth is the usual fix.

**Who makes the art.** The 3D pieces are the least proven part of this plan, so they are tried first.

| Kind of art | Made by | How sure |
| --- | --- | --- |
| Characters, portraits, crops, creatures | Today's sprite generators, run by agents | Proven: all of today's art is made this way |
| New character frames for walking towards and away from the camera | The same generators | Likely: same method, more frames |
| 3D pieces: buildings, racks, fences, terrain | Agents writing scripts for Blender, a free 3D tool that runs without a screen, with textures from the pixel generators | Unproven; tried in phase 0. If it fails: bought kits, or a freelance 3D artist for the kit |
| Sky, backdrops, water, weather and glow | Made inside Unreal on your machine, by script where possible | The least automatable part, so kept few and reused |
| Prestige worlds: Gold, Inferno, Heaven, Cosmos | New light and colour settings on the same scenes, plus a few special pieces each | Follows from the kit |
| Interface art | The pixel generators | Proven method |

One rule holds the look together: a pixel on a sprite and a pixel on a wall are the same size in the world.

## How it's built in Unreal

The game is split so that its rules never touch Unreal. That one choice lets cloud agents work on the rules without the engine, and lets the economy be checked against the one already balanced.

> Diagram in the doc: the parts of the Unreal game · three text sources, five parts, one existing server

- **Step one happens in today's code, not in Unreal.** The rules are lifted out of the web page into a module of their own: commands in, results out, with chance and the clock supplied from outside so that a run can be repeated exactly. Today the page reads the random-number and clock functions about 300 times directly, so nothing can be replayed. Every later step depends on this one.
- **Then one of two routes, chosen by a trial in phase 0.** Either the rules are translated into C++, or the same module runs inside Unreal through a small built-in JavaScript engine. Running the same module means one rule set for both games, for good; translating means two rule sets to keep in step. I lean towards one rule set if the trial holds.
- **The reference is a fixed version of the web game**: the one published with the pending update. The new rules replay sessions recorded from it and must land on the same numbers.
- **The front door already exists.** Every player action arrives today as one of about 220 named commands (pick this bush, start a lot, sell). That list becomes how the game layer talks to the rules.
- **Game layer and interface are written in C++**, not in Unreal's visual scripting, because code is text that agents can write, review and merge.
- **Few add-ons.** Unreal's own sprite system, plus at most one free add-on for character animation, decided in phase 0. Each add-on is one more thing that can break when the engine updates.
- **Online reuses the server**, with the additions listed under What carries over, so accounts, boards and co-ops work from the first online build.

## The agent team

The team is one lead agent and eight specialist roles, split by where the work can run. The split follows the evidence: these agents are strongest at code with a fast test loop, and weakest at Unreal's visual tools and at judging how something looks.

> Diagram in the doc: the agent team · one lead, two crews of four roles, one review gate

**How the team works**

- **A written brief for every piece of work**: the goal, the files it owns, what done means and how to test it. Long stretches are planned as a list of stage documents the agents work through.
- **No two roles edit the same files.** Unreal's own files can't be read or merged as text, so they are rebuilt from text by script; the few made by hand have one owner each.
- **The Unreal crew works on your machine**, where a change compiles and tests in a minute or two (to be measured in phase 0). Sending each change away to be built takes far longer, and loop speed decides how much agents get done.
- **One editor at a time.** Builds and editor work queue up, because agents sharing one open editor have been seen to collide and crash it. So the Unreal crew is one queue, not four workers at once.
- **Agents check numbers and fixed-camera screenshots; you judge feel.** No agent signs off its own work by "playing" it.
- **Cost is steered.** Routine work runs at lower effort settings, and each run has a scope. One public demo of a fully unattended build of a single game level used about $15,000 of model time; this plan does not work that way.

**What the research says these agents do well in Unreal**

Claude Fable 5.2 came out on 9 November, four days before this plan, so no first-hand account of it on an Unreal project exists yet. The findings below are for the model before it (Fable 5) and for other Claude models, as marked. Two cautions: "best fit" is relative, since 55.5% still means nearly half the benchmark tasks failed; and no report was found of an agent team shipping a complete Unreal game, so this plan would be among the first to try.

| Fit | Kind of work | Evidence | In this plan |
| --- | --- | --- | --- |
| Best fit | Unreal C++ gameplay with a compile-and-test loop | Fable 5 passed 55.5% of 110 Unreal C++ tasks in a July 2026 benchmark, about double the other models tested. Its misses were behaviour bugs, not code that failed to build | The core of the build. Every system ships with tests of its behaviour |
| Best fit | Editor tools, data import and export, interface code | A developer's 4,000-line data add-on: the routine parts were right first time, and mistakes crept in as it grew until tests that export, re-import and compare caught them | The export scripts and tools, each with export-and-re-import tests |
| Best fit | Long unattended work behind automatic checks | A game studio's weekend run removed about 40,000 lines, planned as about 40 stage documents, with people keeping the merge button | The phase 3 to 5 waves; the lead and you keep the merge |
| Good | Interface from mock-ups, effects, tests, dressing a scene with a screenshot loop | An Epic Games Japan engineer built a two-day game-jam entry this way with Claude Opus, in runs of about six hours | The world builder and interface roles |
| Good | Blocking out a scene through Epic's editor bridge | A six-room layout in about five minutes with Opus 4.8 | Phase 1 scene blocking |
| Poor | Unreal's visual scripting, and files made by hand in the editor | Movement logic still broken after 25 minutes in one test; tools that report success while failing | Logic lives in C++; every tool result is read back and checked |
| Poor | Judging look and feel | One team bans its agent from "playing the game" to check work, because the results were confident and wrong | Agents measure; you judge at gates |
| Poor | Recalling the right engine version's functions | Reported for earlier models on recent Unreal versions | The engine version is fixed, and code is checked against the installed engine |
| Unproven | Working the editor by screen and mouse | No working report found | Not used |

## Phases

The remake is committed in steps: a look test, then a small playable slice, and only then the full build. The highlighted gate after phase 2 is where you decide whether to go on.

> Diagram in the doc: eight phases · seven gates · the go or no-go after phase 2

**What passes each gate.** A gate is a list of things that are true or not, written before the work starts.

| Gate after | It passes when |
| --- | --- |
| Phase 0, set up | One command on a clean copy builds the trial scene twice, with matching screenshots and no steps by hand. The rules run outside the web page and replay a recorded session exactly. Three trials have answers: scenes built by script, 3D pieces built by script, and which route the rules take. The stores' rules on coffee-order rewards have been checked. The interface's screens have been counted. |
| Phase 1, look test | You approve the scene against a target picture agreed beforehand. It shows a crowded moment (8 pickers, 40 bushes) and one menu with real text. It holds 60 frames a second on a named minimum PC, and 30 for 15 minutes on a named phone. The measured cost of one scene, times the number of scenes, fits your ceiling. |
| Phase 2, first harvest | Recorded sessions land on the web game's numbers. Three people who play the web game each make a first sale without help, and say which of the two they would rather play. Spending is inside the ceiling. You judge the result against the sentence you wrote under Before you commit. |
| Phase 3, the core game | A new player reaches the first prestige from a fresh start. Bots that play both games reach it at the same pace, within one tenth. |
| Phase 4, roastery and seasons | A full day's loop plays on PC. Every menu works with a controller. The store checklist for the first release is complete. |
| Phase 5, islands and endgame | Every system in the web game is either here or on a written list of things cut on purpose. |
| Phase 6, phones | The named phone holds 30 frames a second for 15 minutes without running hot. The download is under the size limit set in phase 1. |

- **No dates yet, on purpose.** Phases 1 and 2 measure what one scene and one system really cost with this team. The schedule for the rest is set from those numbers at the phase 2 gate.
- **Phases 3 to 5 run in waves.** Each wave takes one group of systems through the same steps: rules proven, scene built, interface added, reviewed, then played by you.
- **A smaller first release changes the order.** If the first release stops at the roastery, the PC launch follows phase 4 and phase 5 arrives as updates.
- **Every gate ends with a build you play**, not a report.

## What agents can and can't do in Unreal

Agents can write almost the whole game as text, but Unreal itself can't run where they work: the engine is about 25 GB and needs a graphics card. So your Unreal machine does the building, testing and picture-taking, and reports back.

| Work | Where it happens | How sure |
| --- | --- | --- |
| Game rules lifted out of the web page, with their tests | Cloud agents, no Unreal needed | Confirmed: they already run the web game's code, and a C++ compiler is available to them |
| Unreal C++ (actors, camera, input, interface), settings, data tables from CSV or JSON | Agents working on your machine, where a change compiles and tests in a minute or two | Standard practice |
| Materials, lights, scenes and imports made by script | Scripts written in the cloud, run on your machine without opening the editor | Materials and data confirmed in Epic's docs; scenes and sprites need a short trial in phase 0 |
| Automated tests | Your machine, no screen needed | Confirmed in Epic's docs |
| Screenshots, so agents can see their work | Your machine; needs its graphics card | Confirmed; software rendering does not work |
| Hands-on editor work (visual scripts, effects, placing things) | A Claude session on your machine, through Epic's own editor bridge for AI tools | Epic ships it since 5.8 as experimental; local only |
| Judging whether it looks and feels right | You, at each gate | Agents can check a screenshot, not a feeling |

**The engine version.** Start on Unreal 5.8, the current stable release. 5.9 is still a preview that Epic calls unstable, so the plan stays on 5.8 through the first release unless 5.9 fixes something we need. Unreal is free to use; Epic is reported to take 5% of a game's revenue above its first US$1 million (its licence page could not be opened to confirm).

**Text first.** Everything that can be text is kept as text (code, data, scene recipes, sprite sheets) and Unreal's own files are rebuilt from it by script. That is what lets several agents work at once without overwriting each other.

**Needed from you**

- [ ] **Tell me about the Unreal machine**: Windows or Mac, its graphics card, free disk space and the engine version installed.
- [ ] **Leave it reachable**: the Unreal crew are Claude sessions that run on it, and it also builds and tests every merged change by itself. It needs to be on while that crew works, with about 200 GB free. Agents get only the project folder you share, and you can disconnect them at any time. If the editor hangs, someone at the machine may have to close it.
- [ ] **Create the new repository** for the Unreal project (see Decisions).
- [ ] **Later, for stores**: a Steam developer account, a Google Play account ($25), and for iPhone a Mac plus Apple's developer programme ($99 a year).

## Risks

The three that could sink the remake are its size, the cost of rebuilding every scene in 3D, and leaving the browser. The plan answers each before the full build is committed. The risk above all of them, that the remake is not worth its cost, is what the ceiling and the phase 2 gate are for.

| Risk | Why it matters | What the plan does |
| --- | --- | --- |
| The game is large | About 20 systems, 970 functions and five islands that are games in themselves | Two small proofs first; then waves, each checked against the web game; the phase 5 gate allows cutting on purpose |
| Every scene must be rebuilt in 3D | 13 places today, plus four prestige worlds, and none of the flat art converts | One kit of reusable pieces, scenes assembled by script, and the real cost of a scene measured in phase 1 before the rest is promised |
| Leaving the browser | Today the game is one tap from the coffee site; an app has to be found and downloaded | The web game stays live as the way in. Unreal's own browser support is experimental and due no earlier than 2027; it is watched, not relied on |
| Agents can't see or feel the game | They can be confident and wrong about how something looks | Fixed-camera screenshots and number checks for agents; you play every gate build |
| Building scenes and sprites by script is unproven | If it fails, more work moves into the editor by hand, which agents do badly | A short trial in phase 0, before anything depends on it |
| The look is too heavy for phones | Blur, glow and shadowed lights cost the most on phones | A phone budget from phase 1 and a test on a real mid-range phone at that gate |
| Two games, one server | A server change for one could break the other | The server additions are listed and tested before phase 3; the server's 85 tests run for both games; a fresh farm, once you confirm it, keeps the two saves apart |
| Rewards for real coffee orders inside store apps | Stores have rules about in-game rewards for purchases made outside them, and today the server grants cranes for paid coffee subscriptions | Checked in phase 0 for Steam, Apple and Google, with the rest of the store checklist: fees and identity checks, Google's closed test for new accounts, privacy and account deletion, age rating, controller support in every menu, languages, and cues that don't rely on colour or glow |
| The look sits too close to Octopath Traveler | The technique is free to use; the art, characters and the name "HD-2D" are not | Our own art direction and our own name for the look |
| Your machine is the only place Unreal runs | If it is off or busy, the Unreal crew stops | The cloud crew's work does not depend on it; a rented graphics machine (about $0.75 an hour) is the fallback |

## Sources

Four research agents opened these pages on 13 November 2026. Epic's own licence page, some Epic documentation pages and Reddit could not be opened, so nothing here rests on them.

**The look**

- [Octopath Traveler production slides, Acquire, Unreal Fest East 2018](https://www.docswell.com/s/EpicGamesJapan/KXPWY5-UE4_UFE2018_ACQUIRE_OCTOPATHTRAVELER)
- [Live A Live production slides, Historia, Unreal Fest West 2022](https://docswell.com/s/EpicGamesJapan/Z32GJ5-UE_UFE22W_SQEX_Historia)
- [Cobra Code: four years of 2D and 2.5D in Unreal](https://docswell.com/s/EpicGamesJapan/56ERMX-UE_UFT2025_COBRACODE)
- [Epic: rendering features by platform](https://dev.epicgames.com/documentation/unreal-engine/rendering-features-reference?lang=en-US)
- [Unreal 5.8 sprite flicker report](https://forums.unrealengine.com/t/ue5-8-masked-material-not-rendering-alpha-correctly-on-sprites/2746359)
- [HD-2D, Wikipedia](https://en.wikipedia.org/wiki/HD-2D)

**The engine**

- [Unreal Engine 5.8 released](https://forums.unrealengine.com/t/unreal-engine-5-8-released/2729274)
- [Unreal Engine 5.9 preview](https://forums.unrealengine.com/t/unreal-engine-5-9-megajam-preview/2852840) and [its release notes](https://dev.epicgames.com/documentation/unreal-engine/unreal-engine-5-9-release-notes)
- [Epic: scripting the editor with Python](https://dev.epicgames.com/documentation/unreal-engine/scripting-the-unreal-editor-using-python)
- [Epic: running automated tests](https://dev.epicgames.com/documentation/unreal-engine/run-automation-tests-in-unreal-engine)
- [Epic staff on software rendering not working](https://forums.unrealengine.com/t/running-unreal-editor-game-or-unreal-client-in-a-linux-container/2656254)
- [Cloud graphics machine price](https://instances.vantage.sh/aws/ec2/g4dn.2xlarge), [Google Play fee](https://support.google.com/googleplay/android-developer/answer/6112435), [Apple developer programme](https://developer.apple.com/programs/enroll/)

**Agents in Unreal**

- [Epic: the Unreal editor bridge for AI tools (MCP)](https://dev.epicgames.com/documentation/unreal-engine/unreal-mcp-in-unreal-editor) and [Epic's plugin for Claude Code](https://github.com/EpicGames/unreal-engine-skills-for-claude-code-plugin)
- [GameEngineBench: 110 Unreal C++ tasks, July 2026](https://www.alphaxiv.org/abs/2607.03525.md)
- [Lessons from building an AI-assisted Unreal tool](https://www.pocketgamer.biz/lessons-from-building-an-ai-assisted-unreal-engine-tool/)
- [Believer: agent workflows on an Unreal project](https://believer.gg/introducing-claireon-our-open-source-unreal-plugin-for-agentic-workflows)
- [4Gamer: an Epic Games Japan engineer's two-day game with Claude](https://www.4gamer.net/games/210/G021013/20260907003/)
- [Puget Systems: Claude and Unreal through MCP](https://www.pugetsystems.com/?p=48127)
- [unreal-harness: conventions for agents in Unreal](https://github.com/oliver-io/unreal-harness)
- [Metaplay: what works in agent game development, 2026](https://www.metaplay.io/blog/agentic-ai-game-development-what-works-2026)
- [Press report on the $15,000 unattended build](https://wccftech.com/claude-fable-5-2-builds-playable-gears-of-war-e-day-clone-from-three-line-prompt-but-estimated-cost-reaches-15000/)
- [Anthropic: Claude Fable 5.2 overview](https://platform.claude.com/docs/en/models/fable-5-2/overview.md) and [prompting guide](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-2)

**Today's game.** The inventory was counted from this repository's code, art generators, server and tests.
