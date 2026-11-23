# How people use Claude models to build in Unreal (13 Nov 2026)

**Headline.** I found no first-hand write-up of Claude Fable 5.2 on an Unreal project. The model was released on 9 November 2026, four days ago. The only Fable 5.2 Unreal item is a YouTube demo that I know through press coverage. Every finding below names the model it is about.

## Best uses (ranked)
1. **Scoped Unreal C++ gameplay code with a compile-and-test loop** (Fable 5). GameEngineBench (15 Jul 2026) ran 110 native C++ tasks in nine UE5 projects against hidden Play-in-Editor tests. Fable 5 at max effort passed 55.5%, Opus 4.8 at max 23.6%, GPT-5.5 at xhigh 29.1%. The strong models' failures were behavioural, not compile errors: replication and authority, object lifecycle, initialisation order. Save/persistence and weapons were the weakest areas. [1]
2. **Editor tools, plugins, Slate UI, reflection, data import/export** (Claude, model unnamed). Thrylox built a ~4,000-line DataAsset-to-CSV plugin (16 Jul 2026). Boilerplate, Slate and property traversal were "correct on the first attempt". Claude missed undo transactions and an engine default, and caused regressions as the system grew. Round-trip tests were the safeguard. [2]
3. **Long unattended refactors behind CI** (Opus, Sonnet and Haiku in Claude Code). Believer, a game studio (16 Jun 2026): a weekend run removed ~40,000 lines and 500 MB. The plan was ~40 stage documents run by subagents, with regression tests and CI watching. "The merge button is human-only." [3]
4. **UMG from mockups, Niagara, automation tests, level dressing with a screenshot-and-fix loop** (Claude Opus, explicitly not Fable; UE 5.8.2). An Epic Games Japan engineer built a jam game in two days (reported 15 Sep 2026). Runs went ~6 hours unattended, with up to ~8 sessions. The agent wrote Automation Tests unprompted. [4]
5. **Greybox levels and small Blueprints through MCP** (Opus 4.8). Puget Systems (9 Jul 2026): a six-room greybox in ~5 minutes, and a light-trigger Blueprint that worked. [5]
6. **Whole-game autonomous build: a ceiling demo, not a method** (Fable 5.2). Matthew Berman's one-level Gears of War clone in UE5 used Claude Code's ultracode setting: ~8.5 billion tokens, several days, ~$15,000 at API prices, with an awkward vault animation. The coverage does not say how the model drove Unreal. [6][7]

## Poor fits and how people work around them
- **Blueprint graphs and binary assets.**
- Puget: ground movement was still broken after 25+ minutes. Asked for a PCG graph, the model hand-placed meshes instead. [5]
- Epic Japan: Blueprint structs cannot be created through MCP, so write them in C++. UMG animation worked only by clicking, at ~1/100 of human speed. [4]
- A forum report with Codex (23 Jun 2026): of 1,477 MCP calls, one returned a formal error. Most failures arrived as "success" with error text inside. [8]
- Workaround: keep logic in C++ and Blueprints as thin wiring, and read every tool result.
- **Judging look and feel.** One harness author's CLAUDE.md bans "playing the game" to validate, because it gives "confident, wrong" results. He says Claude "struggles with spatial reasoning". [9] Workaround: deterministic tests that arrange state in C++ and read a value back, and screenshots only from a fixed capture pose.
- **The editor as a shared bottleneck.**
- Epic Japan: C++ builds crashed the editor, and sessions on one editor conflicted. [4]
- Epic's docs: Live Coding misses new `UFUNCTION` declarations, so the editor must restart. Claude Code times out MCP calls at ~120 seconds. [10]
- Workarounds: one editor per agent on its own port (`-ModelContextProtocolPort`) [10]; a proxy that survives editor restarts [3]; a build lock and a PIE lease [9].
- **Tool catalogue size.** A Claude Code user (31 Aug 2026): a full toolset description costs "six figures of tokens", "expect the schemas to lie", and `find_actors` silently truncates at 20. [11] Workaround: tool search, which is Epic's default [10], or a single Python-execute tool [3].
- **Engine API drift.** A May 2026 compiled survey (Opus 4.6 era, secondary) reports hallucinated UE 5.6/5.7 APIs. Pin the version. [12]
- **Computer use.** I found no report of it working on Unreal Editor, only vendor guides with no results. [13]

## Setups that work
- **A. Claude Code, Epic's Unreal MCP, and Epic's official Claude Code plugin.** [14]
- A SessionStart hook sets Unreal conventions, and the server shows three meta-tools.
- `LiveCodingToolset.CompileLiveCoding` blocks until the compile ends and returns compiler diagnostics. Automation-test tools are included.
- On Windows the hook needs Git Bash.
- The Epic Japan engineer used this. [4]
- **B. Headless C++ loop.**
- Build with UnrealBuildTool and run automation tests with `-nullrhi`. Open the editor only for assets.
- mcp-unreal wraps this (UE 5.7, a small project). [15]
- Metaplay (14 May 2026): loop speed decides agent productivity, 10 seconds versus 20 minutes. [16]
- **C. Studio pattern: Believer's Claireon (UE 5.5.4, Git, beta).** [3]
- Three tools sit in front of a 600+ tool catalogue.
- A nine-stage workflow has human checkpoints, with state saved as JSON on the branch.
- Each stage gets its own model, and work lands through a merge queue and CI.

## Conventions worth copying
- C++ holds logic, state and maths. Blueprints hold wiring, assets and tuning. [9][12]
- Pin the engine version, and check APIs against that version's headers. [12][17]
- Keep agents out of `Binaries/`, `Intermediate/`, `Saved/`, `DerivedDataCache/`, `*.uasset`, `*.umap` and engine source. Keep CLAUDE.md under ~150 lines. [12]
- Incremental builds only: `Build.bat <Target> Win64 Development -Project=<uproject> -WaitMutex`. Never pass `-Rebuild` or `-Clean` without confirmation. [9]
- Save before and after bulk editor edits, wait for compiles, and stop PIE before asset work. [14]
- Anthropic's Fable 5.2 guidance [18][19][20][21]:
- **Effort.** Claude Code defaults to medium (the API to high). Use high for long unattended work, xhigh only where a gain is measured, and low for subagents.
- **Finishing.** At low and medium the model stops early more often. Add Anthropic's "Finishing work" prompt.
- **Ownership.** Tell the agent it owns the code if you want consolidation: about 75% of runs versus under 10%, at 1.7 to 1.8 times the output tokens. Review the diff, because its summary omits small changes.
- **Subagents.** They can dominate cost, so set their model.
- **Cautions.** Replace "never" rules with scoped ones. Stale cautions pile up when several agents work together.
- **Workflows.** They run 16 agents at once by default and at most 1,000 per run.

**Anthropic's facts** [18][19][22]: 1M context, 128K output, $8/$40 per million tokens, text and image input, June 2026 cutoff, and up to 30% faster than Fable 5.1. Computer use goes through the new toolset (OSWorld 2.1: 89.3%). The announcement quotes Unity on "harder game-dev tasks" and does not mention Unreal.

**Costs reported**: Puget used ~15% of a weekly Team allowance in one morning, with 5 to 15 minute waits. [5] Believer says daily use fits a Max plan. [3] Berman's demo was ~$15,000. [6]

## Not found / unverified
- Any first-hand Fable 5.2 or 5.1 account on Unreal C++, and any GameEngineBench result for 5.2.
- Berman's video itself, which I did not open. Token figures differ between outlets (8.5 to 12+ billion).
- Reddit was blocked (403), so I read no thread. Hacker News has no substantive thread.
- Reports on git worktrees with binary assets, or on computer use driving Unreal.
- The UE 5.9 "text format for Blueprint graphs". The release notes I opened mention scripted Blueprint-editing libraries, not a text format. I cannot confirm it.
- Which models Epic's "fleets of agents" used to build the 5.9 preview. [23]

## URLs opened
Cited:
1. https://www.alphaxiv.org/abs/2607.03525.md
2. https://www.pocketgamer.biz/lessons-from-building-an-ai-assisted-unreal-engine-tool/
3. https://believer.gg/introducing-claireon-our-open-source-unreal-plugin-for-agentic-workflows and https://github.com/believer-oss/claireon
4. https://www.4gamer.net/games/210/G021013/20260907003/
5. https://www.pugetsystems.com/?p=48127
6. https://wccftech.com/claude-fable-5-2-builds-playable-gears-of-war-e-day-clone-from-three-line-prompt-but-estimated-cost-reaches-15000/
7. https://www.stork.ai/blog/ai-built-an-excel-clone-the-15k-catch, https://www.geeky-gadgets.com/anthropic-fable-5-2-review/, https://www.mindstudio.ai/blog/fable-5-2-vibe-coding-demos/
8. https://forums.unrealengine.com/t/unreal-mcp-codex-issue-analysis-report/2730883
9. https://github.com/oliver-io/unreal-harness and https://raw.githubusercontent.com/oliver-io/unreal-harness/main/CLAUDE.md
10. https://dev.epicgames.com/documentation/unreal-engine/unreal-mcp-in-unreal-editor?lang=en-US
11. https://forums.unrealengine.com/t/how-are-people-making-local-llms-reliably-control-unreal-engine-5-8-through-mcp/2746458
12. https://raw.githubusercontent.com/getarobo/unreal-ai-dev/main/CLAUDE.md and https://raw.githubusercontent.com/getarobo/unreal-ai-dev/main/REPORT.md
13. https://vagon.io/blog/how-to-use-unreal-engine-with-claude-mcp-computer-use
14. https://github.com/EpicGames/unreal-engine-skills-for-claude-code-plugin (plus raw `skills/unreal-mcp/SKILL.md` and `hooks/unreal-context.sh`)
15. https://github.com/remiphilippe/mcp-unreal
16. https://www.metaplay.io/blog/agentic-ai-game-development-what-works-2026
17. https://github.com/quodsoler/unreal-engine-skills
18. https://platform.claude.com/docs/en/models/fable-5-2/overview.md
19. https://platform.claude.com/docs/en/models/fable-5-2/whats-new-fable-5-2.md
20. https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-2
21. https://code.claude.com/docs/en/workflows and https://code.claude.com/docs/en/model-config
22. https://www.anthropic.com/claude-fable-and-mythos-5-2 and https://www.anthropic.com/claude/fable
23. https://forums.unrealengine.com/t/unreal-engine-5-9-megajam-preview/2852840

Also opened:
- https://dev.epicgames.com/documentation/unreal-engine/run-external-ai-agents-in-the-unreal-assistant-panel-in-unreal-engine?lang=en-US
- https://dev.epicgames.com/documentation/unreal-engine/unreal-engine-5-9-release-notes
- https://80.lv/articles/unreal-engine-5-9-preview-is-out-it-was-built-with-ai/
- https://www.gamedeveloper.com/programming/unreal-engine-will-be-developed-with-ai-code-confirms-epic
- https://engadget.com/2196807/epic-games-details-how-its-embracing-gen-ai-in-unreal-engine
- https://dev.to/indiebots/epic-ai-megajam-2026-rules-prizes-and-unreal-mcp-setup-291j
- https://forums.unrealengine.com/t/community-tutorial-build-a-playable-unreal-engine-5-level-with-ai-mcp-claude-code/2747422
- https://forums.unrealengine.com/t/community-tutorial-for-unreal-mcp-claude-code-team-setup-for-uefn-is-here/2746336
- https://forums.unrealengine.com/t/after-wasting-hours-watching-claude-read-my-ue5-project-file-by-file-i-built-an-open-source-mcp-tool-that-gives-ai-a-map-of-your-game-codebase/2709804
- https://www.strayspark.studio/blog/epic-official-mcp-plugin-ue5-8-vs-third-party
- https://www.strayspark.studio/blog/cursor-3-vs-claude-code-ue5-development-may-2026
- https://www.strayspark.studio/blog/cloud-ai-agents-large-unreal-projects-local-execution
- https://hobby-tech-blog.pages.dev/blog/20260408-claude-code-unreal-engine-c-ai/
- https://sharkpillow.com/post/rider-claude/
- https://dreamawakelabs.com/blog/unreal-engine-cpp-blueprints-claude-code
- https://developer.nvidia.com/blog/reliable-ai-coding-for-unreal-engine-improving-accuracy-and-reducing-token-costs/
- https://dev.to/colton_willey_ef3d8727ae9/how-i-taught-claude-to-see-inside-unreal-engine-23a9
- https://www.generationamiga.com/2026/06/14/claude-code-builds-playable-endless-runner-in-unreal-engine-5/
- https://note.com/hacklog_stealth/n/n4ad0da7ef8c1?hl=en
- https://echoulen.github.io/claude-unreal/docs/
- https://github.com/Natfii/UnrealClaude
- https://github.com/chongdashu/unreal-mcp
- https://github.com/getarobo/unreal-ai-dev
- https://mcp.directory/blog/fable-5-claude-code-model-routing-guide-2026
- https://en.gamegpu.com/news/igry/nejroset-fable-5-2-ot-anthropic-sozdala-polnotsennyj-fps-za-8-chasov-i-usd550
- Hacker News search API and items 48557270, 50427817, 48583236

Failed to open (403, 404, 402 or 503): tweaktown, talkesport, marktechpost, the two unrealengine.com news posts, two Medium posts, 4sysops, tomevault, mcpservers.org, the Epic community tutorial body, and Reddit.
