# Building an Unreal Engine 5 game with terminal-only AI agents: findings (13 Nov 2026)

**Bottom line:** agents can write almost everything as text, but the engine cannot live in their containers (about 25 GB compressed, no GPU). The plan needs one machine with Unreal and a GPU that builds, generates assets, tests, screenshots and reports back.

**Versions:** UE 5.8 shipped 17 June 2026 and is the stable line, with hotfixes up to 5.8.4 [https://forums.unrealengine.com/t/unreal-engine-5-8-released/2729274]. A 5.9 "MegaJam Preview" came out about 9 Nov 2026, assembled in roughly a week and flagged "may be unstable" [https://80.lv/articles/unreal-engine-5-9-preview-is-out-it-was-built-with-ai/]. Epic's docs pages are now labelled 5.9.

## 1. Unreal without a screen
- **Compile, cook, package:** Epic's container guide runs `RunUAT.sh BuildCookRun -platform=Linux -clientconfig=Shipping -project=… -noP4 -cook -build -stage -pak -archive -archivedirectory=…` inside the Linux image [https://dev.epicgames.com/documentation/unreal-engine/quick-start-guide-for-using-container-images-in-unreal-engine]. On Windows it is `RunUAT.bat BuildCookRun -project=… -clientconfig=Development` [https://dev.epicgames.com/documentation/unreal-engine/build-operations-cooking-packaging-deploying-and-running-projects-in-unreal-engine].
- **Headless Python:** `UnrealEditor-Cmd <proj>.uproject -run=pythonscript -script="x.py"` "can run your scripts in headless mode". It does not load levels automatically and needs the Python Editor Script Plugin (embedded Python 3.11.8). `-ExecutePythonScript=` opens the full editor UI instead [https://dev.epicgames.com/documentation/unreal-engine/scripting-the-unreal-editor-using-python].
- **Tests:** Epic documents `-ExecCmds="Automation RunTest <filter>;Quit"` and `-ReportExportPath=` (JSON plus HTML) [https://dev.epicgames.com/documentation/unreal-engine/run-automation-tests-in-unreal-engine].
- **Working CI example (Sept 2026, Epic's container):** `UnrealEditor <proj> -execcmds="Automation RunTests X;Quit" -stdout -unattended -NOSPLASH -NullRHI -ReportExportPath=… -TestExit="Automation Test Queue Empty"` [https://forums.unrealengine.com/t/unreal-tests-on-github-actions-with-test-reporter/2763115].
- **No GPU needed with `-nullrhi`:** it disables rendering, "which allows this to work in containers without GPU access" (page dated 2019–2023) [https://unrealcontainers.com/docs/use-cases/continuous-integration].
- **Screenshots need a real GPU:** `-RenderOffscreen` runs "headless, without any visible rendering… on the local computer" [https://dev.epicgames.com/documentation/unreal-engine/unreal-engine-pixel-streaming-reference].
- **Software renderers do not work:** with llvmpipe and `-AllowCPUDevices` the render thread timed out. Epic staff: "the CPU driver doesn't provide necessary functionality for UE to render correctly" [https://forums.unrealengine.com/t/running-unreal-editor-game-or-unreal-client-in-a-linux-container/2656254].
- **Containers:** a user reports `-nullrhi` works and `-RenderOffscreen` fails until Docker uses the NVIDIA runtime [https://forums.unrealengine.com/t/packaged-project-does-not-start-properly-when-run-inside-official-runtime-container/2655389].
- **Screenshot command:** `HighResShot 1920x1080` is documented only as a console command [https://dev.epicgames.com/documentation/unreal-engine/taking-screenshots-in-unreal-engine]. An unattended `-ExecCmds` recipe and Windows WARP software rendering are (unverified).

## 2. Getting the engine onto a build machine
- **Images:** `ghcr.io/epicgames/unreal-engine`, tags `dev-<ver>`, `dev-slim-<ver>`, `runtime`; a Beta feature. Development images' distribution is "governed by" the EULA [https://dev.epicgames.com/documentation/unreal-engine/overview-of-containers-in-unreal-engine].
- **Access:** link the Epic and GitHub accounts, accept the "Join @EpicGames" email within seven days [https://dev.epicgames.com/documentation/unreal-engine/downloading-source-code-in-unreal-engine]. Pulling needs a GitHub token with `read:packages` [https://dev.epicgames.com/documentation/unreal-engine/quick-start-guide-for-using-container-images-in-unreal-engine].
- **Size:** Epic states none. A third-party mirror lists dev-slim-5.8.4 at 24.95 GB compressed, dev at 33.23 GB, runtime at 123 MB [https://hub.docker.com/r/wukakuki/unreal-engine/tags]. Extracted size is (unverified), probably about double.
- **Known bad tags:** the 5.8.1 `dev` and `dev-slim` images contain a 1 TB file that fills the disk; a user reports it fixed as of 5.8.3 [https://forums.unrealengine.com/t/5-8-1-dev-slim-container-includes-a-uba-file-that-decompresses-to-1tb-file-on-disk/2742819].
- **Hardware:** Epic recommends Ubuntu 22.04, quad-core, 32 GB RAM, 8 GB VRAM for Linux development [https://dev.epicgames.com/documentation/unreal-engine/linux-development-requirements-for-unreal-engine].
- **Linux binary download:** unrealengine.com/linux returned 403 to me. The roughly 25 GB zip / 43 GB extracted figure is (unverified).
- **Licence:** the EULA page also returned 403. A third-party clause capture (May 2026; current text not checked) gives:
  - "A User may access the Licensed Technology from multiple computers or workstations while still only occupying a single Seat" [https://conductatlas.com/platform/unreal-engine/unreal-engine-eula/provision/CA-P-059482/single-user-may-access-from-multiple-computers/].
  - Seats are not required under $1M gross revenue in 12 months [https://conductatlas.com/platform/unreal-engine/unreal-engine-eula/provision/CA-P-059486/personal-and-indie-seat-subscription-exception/].
  - Engine code may go only to someone "separately licensed" [https://conductatlas.com/platform/unreal-engine/unreal-engine-eula/provision/CA-P-059470/engine-code-distribution-to-other-licensees/].
  - It lists a 5% royalty above $1M and no CI or cloud clause [https://conductatlas.com/platform/unreal-engine/unreal-engine-eula/].
  - My reading: private cloud or CI use is fine; never publish an image containing the engine. Have the owner read the EULA.
- **Cloud cost (on-demand, region and OS not stated; Windows costs more, unverified):**

| Instance | Spec | Per hour | Source |
|---|---|---|---|
| AWS g4dn.2xlarge | 8 vCPU, 32 GB, T4 16 GB | $0.752 (spot $0.32) | [https://instances.vantage.sh/aws/ec2/g4dn.2xlarge] |
| AWS g5.2xlarge | 8 vCPU, 32 GB, A10G 24 GB | $1.212 | [https://instances.vantage.sh/aws/ec2/g5.2xlarge] |
| AWS c7i.4xlarge | 16 vCPU, 32 GB, no GPU | $0.714 | [https://instances.vantage.sh/aws/ec2/c7i.4xlarge] |

## 3. What agents can author as text
- **C++ gameplay, Slate/UMG-in-C++, `.ini`, `.uproject`/`.uplugin`, `Build.cs`:** plain text and fully practical; the only limit is that agents cannot compile locally (unverified, general knowledge).
- **Data:** `DataTableFunctionLibrary` has `fill_data_table_from_csv_file`, `…_json_file`, `…_string` and matching exports [https://dev.epicgames.com/documentation/en-us/unreal-engine/python-api/class/DataTableFunctionLibrary].
- **Materials (practical):** `MaterialEditingLibrary` has `create_material_expression`, `connect_material_expressions`, `connect_material_property`, `recompile_material`, `set_material_instance_parent` and the instance parameter setters [https://dev.epicgames.com/documentation/en-us/unreal-engine/python-api/class/MaterialEditingLibrary].
- **Blueprints in 5.8 (partial):** `BlueprintEditorLibrary` has `create_blueprint_asset_with_parent`, `add_member_variable`, `add_function_graph`, `add_event_override`, `compile_blueprint`, but no general add-node call [https://dev.epicgames.com/documentation/en-us/unreal-engine/python-api/class/BlueprintEditorLibrary].
- **Blueprint text format in 5.8:** the experimental EditorToolset has `read_graph_dsl`/`write_graph_dsl`, with round-trip bugs reported [https://forums.unrealengine.com/t/blueprinttools-read-graph-dsl-output-is-not-round-trippable-through-write-graph-dsl-for-nodes-with-multiple-data-outputs-single-bind-emitted-for-a-non-first-output-write-binds-it-to-the-wrong-pin/2734654].
- **5.9 Preview:** adds "new Blueprint and Python libraries that let you edit Blueprints…" and "GraphDsl, a text-based language for authoring and editing graph assets" [https://dev.epicgames.com/documentation/unreal-engine/unreal-engine-5-9-release-notes].
- **Paper2D (needs a spike):** `PaperSpriteFactory` exposes no texture property [https://dev.epicgames.com/documentation/en-us/unreal-engine/python-api/class/PaperSpriteFactory]. `PaperFlipbook.key_frames` is listed Read-Write, but the page contradicts itself on other properties [https://dev.epicgames.com/documentation/en-us/unreal-engine/python-api/class/PaperFlipbook]. A small C++ editor helper may be needed (unverified).
- **UMG widget trees:** I found no Python API for them. Epic's MCP covers Widget Blueprints [https://dev.epicgames.com/documentation/unreal-engine/unreal-mcp-in-unreal-editor]. Building UI in C++ is the safer route (unverified).
- **Levels, lights, post-process, texture import by Python:** standard practice but (unverified); only `LevelEditorSubsystem.load_level` was confirmed [https://dev.epicgames.com/documentation/unreal-engine/scripting-the-unreal-editor-using-python].
- **Native text `.uasset`:** Epic staff, April 2025: "It is not supported yet" [https://forums.unrealengine.com/t/how-get-text-based-asset-feature/2525684/2].

## 4. Agent-facing Unreal tools
- **Epic Unreal MCP (official, Experimental, since 5.8):**
  - The server runs inside the editor at `http://127.0.0.1:8000/mcp` and names Claude Code as a client.
  - It covers actors, Blueprints, Widget Blueprints, materials, automation tests, scene capture, console and file import.
  - Commandlets start it with `-ModelContextProtocolStartServer`.
  - It is localhost-only with no authentication, runs calls serially, and Claude Code times out after about 120 s.
  - Source for all four: [https://dev.epicgames.com/documentation/unreal-engine/unreal-mcp-in-unreal-editor]. The agent must therefore run on the editor's machine.
- **5.9 Preview:** adds a Toolset Registry, Knowledge Base, Assistant access levels "Ask, Read, Edit, Auto or Full", and an experimental WebAssembly/WebGPU target [https://dev.epicgames.com/documentation/unreal-engine/unreal-engine-5-9-release-notes].
- **Third-party servers:**
  - chongdashu/unreal-mcp: MIT, 2.1k stars, self-described "EXPERIMENTAL" [https://github.com/chongdashu/unreal-mcp].
  - db-lyon/ue-mcp: MIT, UE 5.4–5.9, needs a running editor [https://github.com/db-lyon/ue-mcp].
  - runreal/unreal-mcp: MIT, no plugin, uses Python remote execution, includes viewport screenshots [https://github.com/runreal/unreal-mcp].
  - flopperam: MIT local server plus a hosted one [https://github.com/flopperam/unreal-engine-mcp].
  - StraySpark: commercial, from $129.99 [https://www.strayspark.studio/blog/unreal-mcp-setup-claude-code-2026].
- **Angelscript:** hot-reloaded text scripts, shipped in It Takes Two and Split Fiction [https://angelscript.hazelight.se/]. It "requires direct changes to unreal engine code", so it means a source-built fork with no prebuilt plugins [https://angelscript.hazelight.se/getting-started/installation/]. Poor fit here.
- **Verse:** UE6 Early Access is targeted for end 2027 [https://www.gamingonlinux.com/2026/06/unreal-engine-6-is-all-about-generative-ai-fortnite-and-the-verse/]. Not usable for a standalone UE5 game today (unverified).

## 5. Testing game rules without the editor
- **Low-Level Tests:** Catch2, built through UnrealBuildTool or `RunUAT BuildGraph -Script="Engine/Build/LowLevelTests.xml"` [https://dev.epicgames.com/documentation/unreal-engine/build-and-run-low-level-tests-in-unreal-engine]. Each needs a `.Build.cs` and `.Target.cs`; the docs cover plugins only [https://dev.epicgames.com/documentation/unreal-engine/types-of-low-level-tests-in-unreal-engine]. They need the engine toolchain.
- **Automation Spec:** `Describe()`/`It()` tests inside the Automation framework, so they run in an engine process [https://dev.epicgames.com/documentation/unreal-engine/automation-spec-in-unreal-engine].
- **Standalone library:** Unreal links external static libraries via `ModuleType.External` and `PublicAdditionalLibraries`, with RTTI caveats [https://dev.epicgames.com/documentation/unreal-engine/integrating-third-party-libraries-into-unreal-engine].
- **Verdict:** keep economy, timers and saves in engine-free C++ built with CMake and tested in the agents' containers. It is the only option that runs with no engine. Compiling the same sources straight into a UE module is simpler than a prebuilt library (unverified). Add a few Specs on the build machine for glue code.

## 6. Source control and parallel work
- **Git LFS on GitHub Free:** 10 GiB storage and 10 GiB bandwidth [https://docs.github.com/en/billing/concepts/product-billing/git-lfs]; 2 GB per file [https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-git-large-file-storage].
- **Locking:** `git lfs track "*.uasset" --lockable` makes files read-only until `git lfs lock` [https://github.com/git-lfs/git-lfs/wiki/File-Locking]. UEGitPlugin maps editor checkout to an LFS lock and must be compiled [https://github.com/ProjectBorealis/UEGitPlugin].
- **Perforce:** free for 5 users and 20 workspaces self-hosted; cloud is $39 per user per month [https://www.perforce.com/resources/vcs/helix-core-pricing]. The editor supports "Perforce and SVN… by default" [https://dev.epicgames.com/documentation/unreal-engine/source-control-in-unreal-engine].
- **One File Per Actor:** each actor is saved in its own file; on by default with World Partition; changelist support is Perforce-only [https://dev.epicgames.com/documentation/unreal-engine/one-file-per-actor-in-unreal-engine].
- **Recommendation (mine):** Git plus LFS. Commit scripts, CSV/JSON and PNGs; regenerate binaries on the build machine and do not commit them. Any hand-made `.uasset` gets one owner, a lock and its own folder.

## 7. CI
- **Runners:** self-hosted runners are free; you pay for the machine [https://docs.github.com/en/actions/concepts/runners/self-hosted-runners]. GitHub-hosted standard runners have 14 GB of SSD, too small for the engine [https://docs.github.com/en/actions/reference/runners/github-hosted-runners]. A job can run in Epic's image using `container:` credentials [https://forums.unrealengine.com/t/unreal-tests-on-github-actions-with-test-reporter/2763115].
- **Minimal pipeline:**
  1. Run engine-free rule tests on a hosted runner.
  2. On the self-hosted machine, run the Python asset-generation commandlet.
  3. `BuildCookRun` for Win64.
  4. Run `-nullrhi` automation tests.
  5. Take GPU screenshots and upload them with the test report.
  6. Package Android.
- **Android:** target SDK 35, NDK r27c, JDK 21; Google Play needs API 35 and UE 5.7 or newer [https://dev.epicgames.com/documentation/unreal-engine/android-development-requirements-for-unreal-engine]. Packaging inside the Linux container is (unverified).
- **iOS:** "Creating a signed build for iOS requires a Mac and an Apple Developer account"; a remote Mac needs only Xcode and certificates [https://dev.epicgames.com/documentation/unreal-engine/creating-remote-builds-of-unreal-engine-projects-for-ios]. Epic lists Xcode 26.1.1 [https://dev.epicgames.com/documentation/unreal-engine/ios-ipados-and-tvos-development-requirements-for-unreal-engine].
- **Build times:** I found no 2026 benchmark. One team reports "~5-10 minutes" [https://forums.unrealengine.com/t/cook-command-freezing-at-deriveddatacache-maintenance-on-build-machines/2678261]. An engine source build takes 10–40 minutes; avoid it with an installed build [https://dev.epicgames.com/documentation/unreal-engine/downloading-source-code-in-unreal-engine].
- **Derived-data cache:** local Zen cache by default since 5.4; share it via `DefaultEngine.ini` or `UE-SharedDataCachePath`; keep it persistent on the runner [https://dev.epicgames.com/documentation/unreal-engine/using-derived-data-cache-in-unreal-engine].

## 8. Recommended setup, in order of preference
1. **Owner's Windows PC as a self-hosted runner, with launcher-installed UE 5.8.x.** Agents push text; the PC builds, generates assets, tests, screenshots, packages Win64 and Android, and posts results to the pull request. Claude Code on that PC can use Epic's MCP for editor work. Owner provides: a PC with a GPU, 32 GB RAM and about 200 GB free SSD (unverified sizing), an Epic account, a GitHub account, the runner and the Android SDK.
2. **Cloud GPU box started on demand** (g4dn.2xlarge class, about $0.75 per hour plus disk), running Epic's `dev-slim` 5.8.3+ image with the NVIDIA runtime, or Windows. Owner provides: the Epic–GitHub link, a `read:packages` token and a cloud account.
3. **CPU-only Linux box.** It compiles, cooks, generates assets and runs `-nullrhi` tests but produces no screenshots, so a human must check visuals.
4. **Not viable:** running Unreal inside the agents' containers.

For any route, shipping needs a Google Play account ($25, with testing requirements for personal accounts) [https://support.google.com/googleplay/android-developer/answer/6112435], and for iOS a Mac plus the Apple Developer Program ($99 per year) [https://developer.apple.com/programs/enroll/]. Stay on 5.8.x until 5.9 is final.

## Could not verify
- Epic EULA text and the Linux download page (both returned 403); Arch wiki (blocked).
- Extracted container image size.
- Windows software rendering and an unattended screenshot command.
- Android packaging in the Linux container.
- Whether Low-Level Tests build on launcher installs.
- Paper2D sprite and UMG creation by Python in practice.
- Build-time benchmarks.

## URLs opened
- https://dev.epicgames.com/documentation/unreal-engine/unreal-mcp-in-unreal-editor
- https://dev.epicgames.com/documentation/unreal-engine/scripting-the-unreal-editor-using-python
- https://dev.epicgames.com/documentation/unreal-engine/overview-of-containers-in-unreal-engine
- https://dev.epicgames.com/documentation/unreal-engine/quick-start-guide-for-using-container-images-in-unreal-engine
- https://dev.epicgames.com/documentation/unreal-engine/hardware-and-software-requirements-for-container-deployments-in-unreal-engine?lang=en-US
- https://dev.epicgames.com/documentation/unreal-engine/run-automation-tests-in-unreal-engine
- https://dev.epicgames.com/documentation/unreal-engine/unreal-engine-5-9-release-notes
- https://dev.epicgames.com/documentation/unreal-engine/command-line-arguments-in-unreal-engine
- https://dev.epicgames.com/documentation/unreal-engine/build-operations-cooking-packaging-deploying-and-running-projects-in-unreal-engine
- https://dev.epicgames.com/documentation/unreal-engine/low-level-tests-in-unreal-engine (table of contents only)
- https://dev.epicgames.com/documentation/unreal-engine/build-and-run-low-level-tests-in-unreal-engine
- https://dev.epicgames.com/documentation/unreal-engine/types-of-low-level-tests-in-unreal-engine
- https://dev.epicgames.com/documentation/unreal-engine/automation-spec-in-unreal-engine
- https://dev.epicgames.com/documentation/unreal-engine/one-file-per-actor-in-unreal-engine
- https://dev.epicgames.com/documentation/unreal-engine/source-control-in-unreal-engine
- https://dev.epicgames.com/documentation/unreal-engine/linux-development-requirements-for-unreal-engine
- https://dev.epicgames.com/documentation/unreal-engine/downloading-source-code-in-unreal-engine
- https://dev.epicgames.com/documentation/unreal-engine/ios-ipados-and-tvos-development-requirements-for-unreal-engine
- https://dev.epicgames.com/documentation/unreal-engine/creating-remote-builds-of-unreal-engine-projects-for-ios
- https://dev.epicgames.com/documentation/unreal-engine/android-development-requirements-for-unreal-engine
- https://dev.epicgames.com/documentation/unreal-engine/using-derived-data-cache-in-unreal-engine
- https://dev.epicgames.com/documentation/unreal-engine/unreal-engine-pixel-streaming-reference
- https://dev.epicgames.com/documentation/unreal-engine/taking-screenshots-in-unreal-engine
- https://dev.epicgames.com/documentation/unreal-engine/integrating-third-party-libraries-into-unreal-engine
- https://dev.epicgames.com/documentation/en-us/unreal-engine/python-api/class/MaterialEditingLibrary
- https://dev.epicgames.com/documentation/en-us/unreal-engine/python-api/class/BlueprintEditorLibrary
- https://dev.epicgames.com/documentation/en-us/unreal-engine/python-api/class/DataTableFunctionLibrary
- https://dev.epicgames.com/documentation/en-us/unreal-engine/python-api/class/PaperFlipbookFactory
- https://dev.epicgames.com/documentation/en-us/unreal-engine/python-api/class/PaperFlipbook
- https://dev.epicgames.com/documentation/en-us/unreal-engine/python-api/class/PaperSpriteFactory
- https://forums.unrealengine.com/t/unreal-engine-5-8-released/2729274
- https://forums.unrealengine.com/t/5-8-1-dev-slim-container-includes-a-uba-file-that-decompresses-to-1tb-file-on-disk/2742819
- https://forums.unrealengine.com/t/running-unreal-editor-game-or-unreal-client-in-a-linux-container/2656254
- https://forums.unrealengine.com/t/packaged-project-does-not-start-properly-when-run-inside-official-runtime-container/2655389
- https://forums.unrealengine.com/t/unreal-tests-on-github-actions-with-test-reporter/2763115
- https://forums.unrealengine.com/t/building-and-testing-unreal-engine-on-github-actions/1958824
- https://forums.unrealengine.com/t/cook-command-freezing-at-deriveddatacache-maintenance-on-build-machines/2678261
- https://forums.unrealengine.com/t/blueprinttools-read-graph-dsl-output-is-not-round-trippable-through-write-graph-dsl-for-nodes-with-multiple-data-outputs-single-bind-emitted-for-a-non-first-output-write-binds-it-to-the-wrong-pin/2734654
- https://forums.unrealengine.com/t/how-get-text-based-asset-feature/2525684/2
- https://80.lv/articles/unreal-engine-5-9-preview-is-out-it-was-built-with-ai/
- https://www.gamingonlinux.com/2026/06/unreal-engine-6-is-all-about-generative-ai-fortnite-and-the-verse/
- https://unrealcontainers.com/docs/use-cases/continuous-integration
- https://unrealcontainers.com/docs/concepts/nvidia-docker
- https://hub.docker.com/r/wukakuki/unreal-engine/tags
- https://conductatlas.com/platform/unreal-engine/unreal-engine-eula/
- https://conductatlas.com/platform/unreal-engine/unreal-engine-eula/provision/CA-P-059482/single-user-may-access-from-multiple-computers/
- https://conductatlas.com/platform/unreal-engine/unreal-engine-eula/provision/CA-P-059486/personal-and-indie-seat-subscription-exception/
- https://conductatlas.com/platform/unreal-engine/unreal-engine-eula/provision/CA-P-059470/engine-code-distribution-to-other-licensees/
- https://instances.vantage.sh/aws/ec2/g4dn.2xlarge
- https://instances.vantage.sh/aws/ec2/g5.2xlarge
- https://instances.vantage.sh/aws/ec2/c7i.4xlarge
- https://github.com/chongdashu/unreal-mcp
- https://github.com/flopperam/unreal-engine-mcp
- https://github.com/db-lyon/ue-mcp
- https://github.com/runreal/unreal-mcp
- https://github.com/ProjectBorealis/UEGitPlugin
- https://github.com/git-lfs/git-lfs/wiki/File-Locking
- https://www.strayspark.studio/blog/unreal-mcp-setup-claude-code-2026
- https://angelscript.hazelight.se/
- https://angelscript.hazelight.se/getting-started/installation/
- https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-git-large-file-storage
- https://docs.github.com/en/billing/concepts/product-billing/git-lfs
- https://docs.github.com/en/actions/concepts/runners/self-hosted-runners
- https://docs.github.com/en/actions/reference/runners/github-hosted-runners
- https://www.perforce.com/resources/vcs/helix-core-pricing
- https://developer.apple.com/programs/enroll/
- https://support.google.com/googleplay/android-developer/answer/6112435
- Failed to open: https://www.unrealengine.com/en-US/eula/unreal (403), https://wiki.archlinux.org/title/Unreal_Engine_5 (blocked)
