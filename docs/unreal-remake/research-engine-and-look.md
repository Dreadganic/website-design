# Beju Farm in Unreal (HD-2D-style look): research findings, 13 Nov 2026

**Access limits.** Every unrealengine.com page returned HTTP 403 (licence page, Octopath spotlight, Octopath II interview, 5.8 news). The 5.8 release-notes body and several Epic docs pages did not render. Japanese slide decks were read through machine translation. Anything not taken from a page I opened is marked (unverified).

## 1. Engine version
- Current stable is UE 5.8, released 17 June 2026; the latest hotfix is 5.8.4, 20 Oct 2026. [https://forums.unrealengine.com/t/unreal-engine-5-8-released/2729274] [https://forums.unrealengine.com/t/5-8-4-hotfix-released/2842775]
- UE 5.9 "MegaJam Preview" came out 9 Nov 2026. It was built in about a week with a shortened QA pass, is "unstable until the final release", and full 5.9 is due "next year". [https://forums.unrealengine.com/t/unreal-engine-5-9-megajam-preview/2852840]
- 5.8 had been expected to be the last major UE5 release before UE6. [https://80.lv/articles/unreal-engine-5-9-preview-is-out-it-was-built-with-ai/]
- **Recommendation:** start on 5.8.4 and pin it; do not start on the 5.9 Preview.
- Store floors for 5.8: Google Play needs UE 5.7 or newer (target API 35), minimum Android 8 (API 26), minimum iOS 17. [https://dev.epicgames.com/documentation/unreal-engine/android-development-requirements-for-unreal-engine] [https://dev.epicgames.com/documentation/unreal-engine/ios-ipados-and-tvos-development-requirements-for-unreal-engine]
- Dropped features that matter: HTML5 export (Epic calls it "UE4's retired HTML5 platform") [5.9 forum post above], and Paper2D's Box2D physics; Paper2D tile maps are "stuck in Beta". [https://docswell.com/s/EpicGamesJapan/56ERMX-UE_UFT2025_COBRACODE] I could not read the 5.8 deprecation list (unverified).
- For AI agents: 5.8 has an experimental MCP plugin that connects LLMs to the editor; the 5.9 Preview adds an in-editor assistant panel for Claude Code and others. [both forum release posts above]
- Licence: 5% royalty on a game's gross revenue after the first US$1M. [https://www.cgchannel.com/?p=176531]
- Reduced rate: 3.5% if the game ships on the Epic Games Store at the same time as other PC/Android stores, since 1 Jan 2025; Epic Games Store revenue is excluded. [https://forums.unrealengine.com/t/a-better-deal-for-developers/2255943] [https://www.cgchannel.com/2024/10/epic-games-to-cut-royalty-rate-on-unreal-engine-games/]
- **Not confirmed from Epic's licence page itself** (403); the sources are Epic's forum announcement and CG Channel.

## 2. How the Octopath look is built
Octopath Traveler (Acquire, UE 4.18.1, Unreal Fest East 2018 slides) [https://www.docswell.com/s/EpicGamesJapan/KXPWY5-UE4_UFE2018_ACQUIRE_OCTOPATHTRAVELER]:
- **Characters:** Paper2D PaperFlipbook sprites; sprite-on-bone animation was rejected. Loading many PaperSprite assets fragmented memory, so they added a table-driven flipbook layer. About 350 sprite images per character. [https://automaton-media.com/devlog/report/20181023-78326]
- **Environments:** 3D meshes with pixel textures, nearly all from one master material. Textures are world-projected so pixels do not rotate with objects. Roads come from an in-house tile editor on a 100x100-unit grid with modular assets on top; terrain is Landscape; rivers are splines. Interiors are built at half scale.
- **Occlusion:** a screen-space circular alpha cut-out on objects in front of the character.
- **Post-process:** all stock PostProcessVolume effects (colour grading, bloom, bokeh depth of field, lens flares, ambient cubemap, vignette), tuned per map. The slides call post effects "a big key" to the visuals.
- **Lighting:** the goal was "dynamic, rich lighting", kept bright enough that textures stay visible in dark areas. Battles use dedicated point lights for moving shadows, and the sun is switched off during big attacks.
- **Camera:** slightly angled, with gentle sway in battle; depth of field is animated with camera moves.
- **Performance:** 720p docked, 1024x576 handheld, 30 fps on Switch. [https://nintendoeverything.com/octopath-traveler-technical-analysis/]

Live A Live (Historia, UE4, Unreal Fest West 2022 slides) [https://docswell.com/s/EpicGamesJapan/Z32GJ5-UE_UFE22W_SQEX_Historia]:
- They redefined the style as "pixel art plus modern real-time 3D lighting": depth of field weakened, vignette removed or weakened, stage-style lighting and fog.
- Camera looks down through a telephoto lens to avoid edge distortion.
- Shadows: a directional light outdoors, round blob shadows indoors, and a per-map colour lift so sprites stay readable in dark areas.
- Anti-aliasing off (it broke up the backgrounds), screen percentage 100, shipped on the Mobile Forward renderer.
- Workflow: grey-box first, drop in the original pixel art to check scale, then final art.

General description: billboard sprites, a point light so characters cast shadows, tilt-shift, depth of field, bloom, volumetric fog, particles. [https://en.wikipedia.org/wiki/HD-2D]

**Not published anywhere I could find:** field of view, f-stop, texel density, or bloom values. I found no technical talks for Triangle Strategy or Dragon Quest III. Whether sprites use normal maps or proxy shadow casters is not stated in the talks; one secondary write-up claims proxies (unverified). [https://dev.to/gaurav_de/creating-an-hd-2d-rendering-pipeline-on-dx12-205k]

## 3. Sprites in UE5 today
- **Paper2D:** still bundled and lightly maintained by "a small Epic team"; no Animation Blueprint or notifies. [Cobra Code slides above]
- **Known 5.8 bug:** black flicker where masked sprites overlap at the same depth. Workarounds are a per-sprite depth offset or Early-Z settings; unresolved as of Sept 2026. [https://forums.unrealengine.com/t/ue5-8-masked-material-not-rendering-alpha-correctly-on-sprites/2746359]
- **PaperZD:** free on Fab (paid until a 2022 Epic MegaGrant). It adds an animation graph, notifies, directional sequences and Sequencer support on top of Paper2D. [https://www.fab.com/listings/6664e3b5-e376-47aa-a0dd-f7bbbd5b93c0] [https://www.criticalfailure-studio.com/paperzd-documentation/]
- PaperZD caveats: the Fab page shows no licence text or engine-version list, and packaging needs Visual Studio because it is a C++ plugin. A third-party repo lists a 2.2.4 build for UE 5.8. [https://github.com/dimsmark/PaperZDMCP]
- **Simplest alternative:** a plane mesh with a flipbook (SubUV) material, no plugin; good for crops and props (my recommendation, unverified).
- **Masked vs translucent:** use masked. Translucent sprites have draw-order problems and are the most expensive; the manual fix is Translucency Sort Priority. [https://dev.epicgames.com/documentation/unreal-engine/paper-2d-sprite-material-in-unreal-engine] [https://forums.unrealengine.com/t/2d-2-5d-with-mix-of-3d-rendering-transparency-issues/300927]
- **Lighting and shadows:** MaskedLitSpriteMaterial plus Cast Shadow on the component. [https://forums.unrealengine.com/t/ue4-10-paper-sprite-shadows/346347]
- **Pixel-perfect textures:** "Apply Paper 2D Import Settings" removes mipmaps, sets Nearest filtering and uses Editor Icon compression. [https://dev.epicgames.com/documentation/en-us/unreal-engine/how-to-import-and-use-paper-2d-sprites-in-unreal-engine] The matching texture group is "2D Pixels (unfiltered)" (unverified).
- **Anti-aliasing:** temporal methods (TAA/TSR) ghost on sprites. Options are AA off (Live A Live), FXAA with motion blur off, or keeping TSR with Output Velocity enabled in the sprite material. [https://videohighlight.com/v/h00pEm91ers] [https://forums.unrealengine.com/t/paper2d-and-tsr-solving-smudging-ghosting-tutorial/764211]

## 4. Mobile
- Feasible: Live A Live shipped this look on Switch using Mobile Forward. [Live A Live slides above]
- The mobile renderer supports Mobile (Gaussian) depth of field, standard bloom, FXAA, TAA, and MSAA (forward only). Movable point and spot lights with dynamic shadows are listed as supported "with prerequisites"; verify on a device. [https://dev.epicgames.com/documentation/unreal-engine/rendering-features-reference?lang=en-US]
- Not supported on the mobile renderer: Lumen, Nanite, Virtual Shadow Maps, TSR, convolution bloom. [same page]
- Lumen is experimental on high-end Android through the desktop renderer only, and never on iOS. [https://dev.epicgames.com/documentation/unreal-engine/using-lumen-global-illumination-on-mobile-in-unreal-engine?lang=en-US]
- Mobile depth of field is "low-cost"; its cost scales with blur size. [https://dev.epicgames.com/documentation/unreal-engine/mobile-depth-of-field-in-unreal-engine?lang=en-US]
- Forward is the mobile default and gives the best anti-aliasing choice; deferred handles more dynamic lights but has no MSAA. [https://dev.epicgames.com/documentation/en-us/unreal-engine/mobile-rendering-and-shading-modes-for-unreal-engine?lang=en-US]
- Targets (my recommendation, not sourced): 30 fps on mid-range phones, 60 fps on flagships and PC, one shadowed directional light, a few unshadowed local lights, blob shadows.
- Package size: one guide says an empty UE5 project packages "over 321MB" and a stripped 5.7 project "under 80MB". [https://www.strayspark.studio/blog/ue5-packaging-shipping-build-size-optimization] A forum user reports a small UE5 Android APK over 400 MB. [https://forums.unrealengine.com/t/mobile-optimization-in-ue5-how-to-reduce-package-size-without-sacrificing-visual-quality/2511477]
- Shrinking: disable unused plugins, strip editor content and unused languages, cap texture sizes, and use Android relocation-table compression. [strayspark above] [https://dev.epicgames.com/documentation/unreal-engine/reducing-android-binary-size-in-unreal-engine-projects]

## 5. Browser
- **Answer: no.** Stable UE 5.8 has no supported browser export. A supported route may arrive with full 5.9 in 2027.
- The 5.9 Preview adds an experimental Web target (WebAssembly plus WebGPU, on the mobile renderer). It needs a source build and a C++ project, crashes above 2 GB of Wasm memory, can lose save data on reload, and Epic says parts of the web renderer are prototypes. [5.9 forum post above] [https://dev.epicgames.com/documentation/unreal-engine/unreal-engine-5-9-release-notes]
- Community: a UE 5.8.3 WebGPU fork was announced in Oct 2026 with no repo or licence given. [https://forums.unrealengine.com/t/unreal-engine-webgpu-ue-5-8-3-running-in-your-browser/2841904] Wonder Interactive (SimplyStream) offers WebGPU export for 5.6/5.7 on request, with no published price. [https://forums.unrealengine.com/t/webgpu-for-unreal-engine-5-5-6-and-5-7-support/2693702]
- Pixel Streaming renders every session on a remote GPU. [https://dev.epicgames.com/documentation/unreal-engine/overview-of-pixel-streaming-in-unreal-engine]
- Pixel Streaming cost: a raw AWS T4 instance is about $0.53/hour. [https://instances.vantage.sh/aws/ec2/g4dn.xlarge] Managed Vagon Streams is $0.025–0.047/minute (about $1.50–2.82/hour) plus $0.67/day. [https://vagon.io/streams/pricing] That is unworkable for a free idle game with long sessions.
- **Plan:** keep the current web game live and treat the Unreal build as a separate PC/mobile product.

## 6. Interface
- Stack: UMG, plus CommonUI (input routing, gamepad navigation, controller icons, shared styles), plus Enhanced Input, which is on by default. [https://dev.epicgames.com/documentation/unreal-engine/common-ui-plugin-for-advanced-user-interfaces-in-unreal-engine] [https://dev.epicgames.com/documentation/unreal-engine/enhanced-input-in-unreal-engine]
- Pitfall: CommonUI's Enhanced Input bridge is Experimental and Epic says not to ship with it. Use CommonUI's own actions for menus and Enhanced Input for gameplay. [https://dev.epicgames.com/documentation/en-us/unreal-engine/using-commonui-with-enhnaced-input-in-unreal-engine]
- Touch: the CommonUI pages I could open cover only gamepad and console. Build menus as large tap targets that also work with a mouse click (recommendation).
- Pixel fonts: UMG's runtime font cache cannot turn off anti-aliasing. [https://forums.unrealengine.com/t/umg-textblock-font-anti-aliasing/1985385]
- Scaling: DPI scaling is a free curve with no integer-scale mode. [https://dev.epicgames.com/documentation/unreal-engine/dpi-scaling-in-unreal-engine] Mitigation (recommendation): key the curve to 1x/2x/3x steps, use fonts at exact multiples, and check packaged builds.

## 7. Prior art
- Octopath Traveler production slides: master material, world-aligned pixel textures, tile grid, post stack. [docswell link in section 2]
- Live A Live slides: lighting-first look, AA off, Mobile Forward. [docswell link in section 2]
- Cobra Code, "4 years of 2D/2.5D in Unreal": Paper2D gaps, PaperZD, a 165 to 380 fps settings tweak on Steam Deck. [Cobra Code slides above]
- Cobra Code HD-2D tutorial on Epic's learning site; the body did not load for me. [https://forums.unrealengine.com/t/community-tutorial-how-to-make-hd-2d-style-games-with-unreal-engine-5/2565853]
- "2.5D Game Template" on Fab, US$24.99: 3D environments plus sprite characters, needs PaperZD; a quick look-test base. [https://www.fab.com/listings/9925900a-384c-4253-90c6-5352907da82d]
- Paper2D+ on Fab, free, UE 5.0–5.8, flagged as AI-generated: sprite and Aseprite import tooling. [https://www.fab.com/listings/7600dc00-077e-41db-9222-87f4240e26be]
- Wandering Sword: UE4, team grew from 3 to 13 over 4 years; the closest small-team shipped example. [https://steamdeckhq.com/news/wandering-sword-interview/] [https://www.pcgamer.com/uk/this-chinese-indie-rpg-brings-wuxia-games-of-the-ms-dos-era-to-unreal-engine-4/]
- I found no open-source HD-2D sample project.

## 8. Top five risks and mitigations
1. **Losing the website version.** Keep the current web game running; revisit the 5.9 Web target only after its full release.
2. **Mobile cost of depth of field, bloom and shadowed lights.** Use Mobile Forward, one shadowed sun, blob shadows, quality tiers per device, and a real mid-range phone test in week one. Measure an empty package the same week.
3. **Pixel-art integrity** (temporal smear, filtering, the 5.8 masked-sprite flicker). Use AA off or FXAA, nearest filtering with no mipmaps, masked lit sprites and per-sprite depth offsets; prove it in a one-scene look test before any content build.
4. **Toolchain versus team.** PaperZD needs a C++ toolchain to package, iOS needs a Mac with Xcode, and the MCP tooling is experimental. Keep plugins minimal, pin 5.8.4, and automate builds early.
5. **Scene production scope.** Thirteen 2D scenes become 3D dioramas. Follow the shipped pattern: a modular kit on a fixed grid, one master material, grey-box first, and one vertical-slice scene before committing.

## URLs opened
- https://forums.unrealengine.com/t/unreal-engine-5-8-released/2729274 (and ?page=3)
- https://forums.unrealengine.com/t/5-8-4-hotfix-released/2842775
- https://forums.unrealengine.com/t/unreal-engine-5-9-megajam-preview/2852840
- https://dev.epicgames.com/documentation/unreal-engine/unreal-engine-5-9-release-notes
- https://80.lv/articles/unreal-engine-5-9-preview-is-out-it-was-built-with-ai/
- https://80.lv/articles/unreal-engine-5-8-is-out-today-with-big-optimization-improvements-and-mesh-terrain/
- https://80.lv/articles/tutorial-creating-the-tilt-shift-effect-in-unreal-engine-5
- https://runtimewire.com/article/epic-unreal-engine-5-9-preview-web-target
- https://gamefromscratch.com/unreal-engine-5-8-released/
- https://www.cgchannel.com/?p=176531
- https://www.cgchannel.com/2024/10/epic-games-to-cut-royalty-rate-on-unreal-engine-games/
- https://digitalproduction.com/2026/06/18/unreal-engine-5-8-tidies-up/
- https://forums.unrealengine.com/t/a-better-deal-for-developers/2255943
- https://conductatlas.com/platform/unreal-engine/unreal-engine-eula/royalty-payment-obligation-5-above-1m/
- https://dev.epicgames.com/documentation/unreal-engine/android-development-requirements-for-unreal-engine
- https://dev.epicgames.com/documentation/unreal-engine/ios-ipados-and-tvos-development-requirements-for-unreal-engine
- https://www.docswell.com/s/EpicGamesJapan/KXPWY5-UE4_UFE2018_ACQUIRE_OCTOPATHTRAVELER
- https://docswell.com/s/EpicGamesJapan/Z32GJ5-UE_UFE22W_SQEX_Historia
- https://docswell.com/s/EpicGamesJapan/56ERMX-UE_UFT2025_COBRACODE
- https://docswell.com/s/EpicGamesJapan/5DEVPV-2023-12-01-082936
- https://automaton-media.com/devlog/report/20181023-78326
- https://en.wikipedia.org/wiki/HD-2D
- https://nintendoeverything.com/octopath-traveler-technical-analysis/
- https://www.nintendolife.com/news/2022/10/octopath-traveler-ii-devs-aimed-to-make-its-hd-2d-visuals-picture-perfect
- https://gonintendo.com/contents/10593-square-enix-showcases-hd-2d-improvements-in-octopath-traveler-ii
- https://dev.to/gaurav_de/creating-an-hd-2d-rendering-pipeline-on-dx12-205k
- https://www.fab.com/listings/6664e3b5-e376-47aa-a0dd-f7bbbd5b93c0
- https://www.fab.com/listings/7600dc00-077e-41db-9222-87f4240e26be
- https://www.fab.com/listings/9925900a-384c-4253-90c6-5352907da82d
- https://www.criticalfailure-studio.com/paperzd-documentation/
- https://github.com/dimsmark/PaperZDMCP
- https://github.com/heavybullets/PaperZD
- https://forums.unrealengine.com/t/ue5-8-masked-material-not-rendering-alpha-correctly-on-sprites/2746359
- https://forums.unrealengine.com/t/paper2d-and-tsr-solving-smudging-ghosting-tutorial/764211
- https://forums.unrealengine.com/t/ue4-10-paper-sprite-shadows/346347
- https://forums.unrealengine.com/t/2d-2-5d-with-mix-of-3d-rendering-transparency-issues/300927
- https://forums.unrealengine.com/t/ue5-8-subsurface-profile-shading-model-produces-no-sss-effect-on-mobile-multi-pass-deferred-shading-works-correctly-on-desktop/2729811
- https://dev.epicgames.com/documentation/unreal-engine/paper-2d-sprite-material-in-unreal-engine
- https://dev.epicgames.com/documentation/en-us/unreal-engine/how-to-import-and-use-paper-2d-sprites-in-unreal-engine
- https://videohighlight.com/v/h00pEm91ers
- https://dev.epicgames.com/documentation/unreal-engine/rendering-features-reference?lang=en-US
- https://dev.epicgames.com/documentation/en-us/unreal-engine/mobile-rendering-and-shading-modes-for-unreal-engine?lang=en-US
- https://dev.epicgames.com/documentation/unreal-engine/using-lumen-global-illumination-on-mobile-in-unreal-engine?lang=en-US
- https://dev.epicgames.com/documentation/unreal-engine/mobile-depth-of-field-in-unreal-engine?lang=en-US
- https://dev.epicgames.com/documentation/unreal-engine/supported-features-by-rendering-path-for-desktop-with-unreal-engine
- https://dev.epicgames.com/documentation/unreal-engine/reducing-android-binary-size-in-unreal-engine-projects
- https://www.strayspark.studio/blog/ue5-packaging-shipping-build-size-optimization
- https://forums.unrealengine.com/t/mobile-optimization-in-ue5-how-to-reduce-package-size-without-sacrificing-visual-quality/2511477
- https://forums.unrealengine.com/t/knowledge-base-optimizing-build-size-for-android-mobile/1919436
- https://hackread.com/deep-dive-technical-details-ue5-lighting-on-mobile/
- https://developer.arm.com/community/arm-community-blogs/b/mobile-graphics-and-gaming-blog/posts/lighting-at-scale-bringing-hundreds-of-dynamic-lights-to-mobile-with-unreal-megalights
- https://forums.unrealengine.com/t/unreal-engine-webgpu-ue-5-8-3-running-in-your-browser/2841904
- https://forums.unrealengine.com/t/webgpu-for-unreal-engine-5-5-6-and-5-7-support/2693702
- https://dev.epicgames.com/documentation/unreal-engine/overview-of-pixel-streaming-in-unreal-engine
- https://vagon.io/streams/pricing
- https://instances.vantage.sh/aws/ec2/g4dn.xlarge
- https://dev.epicgames.com/documentation/unreal-engine/common-ui-plugin-for-advanced-user-interfaces-in-unreal-engine
- https://dev.epicgames.com/documentation/en-us/unreal-engine/using-commonui-with-enhnaced-input-in-unreal-engine
- https://dev.epicgames.com/documentation/unreal-engine/enhanced-input-in-unreal-engine
- https://dev.epicgames.com/documentation/unreal-engine/dpi-scaling-in-unreal-engine
- https://forums.unrealengine.com/t/umg-textblock-font-anti-aliasing/1985385
- https://forums.unrealengine.com/t/community-tutorial-how-to-make-hd-2d-style-games-with-unreal-engine-5/2565853
- https://forums.unrealengine.com/t/community-tutorial-best-2d-game-settings/1248239
- https://forums.unrealengine.com/t/2-5d-game-template/2692931
- https://steamdeckhq.com/news/wandering-sword-interview/
- https://www.pcgamer.com/uk/this-chinese-indie-rpg-brings-wuxia-games-of-the-ms-dos-era-to-unreal-engine-4/ (headline only)

Tried but blocked or empty (nothing taken from them): unrealengine.com licence, EULA, FAQ, 5.8 news, Octopath spotlight and Octopath II interview (403); web.archive.org copies; the UE 5.8 release notes; Epic's mobile rendering features, mobile lighting, Paper 2D overview, CommonUI input guide and font docs pages; the Cobra Code HD-2D tutorial and settings pages on Epic's learning site and Notion; the SlideShare copy of the Octopath deck; the Square Enix Triangle Strategy VR interview.
