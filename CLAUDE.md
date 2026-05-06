# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Remotion project that generates animated DSA (Data Structures & Algorithms) explanation videos for YouTube (16:9) and Instagram Reels (9:16). Currently covers linked list operations: Insert Head/Tail, Delete Node/Head/Middle/Tail, Search, Traverse, Reverse, Detect Cycle, Merge Sorted Lists.

## Commands

```bash
npm run studio                                        # Open Remotion Studio (hot reload preview)
npm run render                                        # Render FullVideo to out/video.mp4
npx remotion render src/index.ts Video-SearchNode out/SearchNode.mp4   # Render a single composition
node scripts/generate-narration.mjs                  # Generate step-N.mp3 audio files via edge-tts
node scripts/update-durations.mjs                    # Measure mp3 durations via ffprobe → durations.json
```

No test suite. No lint script.

## Architecture

### Composition hierarchy (`src/Root.tsx`)

- **`TitleIntro`** — standalone title card (90 frames)
- **`Folder "Scenes"`** — each DSA operation as a bare scene component
- **`FullVideo`** — all scenes concatenated with `<Series>`, title cards, and `CodeMagicMove` transitions between scenes
- **`Folder "Standalone"`** — each scene wrapped in `StandaloneVideo` (intro + scene + outro), YouTube format (1920×1080)
- **`Folder "Reels"`** — same as Standalone but reel format (1080×1920)

All compositions use `calculateMetadata` to run Shiki syntax highlighting at render time, passing `tokens` as props.

### Scene anatomy

Each file in `src/scenes/` exports a React component that receives `{ tokens, format? }` and:
1. Renders `<SplitLayout>` (YouTube) or `<StackedLayout>` (Reels) containing `<LinkedListDiagram>` + `<CodeBlock>` inside a `<CodeWindow>`
2. Mounts `<AmbientLayer />`, `<SfxLayer steps={steps} />`, `<NarrationLayer sceneId="..." steps={steps} />`

The core data structure driving every animation is the **`steps: SceneStep[]`** array defined at the top of each scene file. Each step holds:
- `startFrame` — absolute frame when this step begins
- `highlightLines` — `{startLine, endLine}` (0-indexed) for code highlight bar
- `snapshot` — the full visual state: `nodes[]`, `pointers[]`, `arrows[]`, optional `newNode`, `caption`, `searchTarget`

`useStepTransition(steps)` (in `src/lib/`) determines the active step from `useCurrentFrame()` and returns a spring-interpolated `t` for smooth crossfades between snapshots.

### Narration system

Audio lives at `public/narration/<sceneId>/step-N.mp3`. Duration metadata is at `public/narration/<sceneId>/durations.json` and mirrors into `narrationDurationsByScene` in `src/data/narration-scripts.ts`.

`NarrationLayer` reads that map, aligns each clip to its step's `startFrame`, and renders `<Audio>` via Remotion `<Sequence>`.

**startFrame calculation:** `startFrame[n] = sum(frames[0..n-1]) + n*10` (10-frame buffer after each audio clip). After generating audio, read `durations.json` and recalculate all `startFrame` values manually, then update the scene file and the duration array in `narration-scripts.ts`.

Voice: `en-US-BrianMultilingualNeural` at `+10%` rate (configured in `scripts/generate-narration.mjs`).

### Adding a new scene — checklist

1. Add Java code string to `src/data/code-snippets.ts`
2. Create `src/scenes/MyOperation.tsx` with `steps[]` and dual-layout render (see any existing scene as template)
3. Add narration lines to `src/data/narration-scripts.ts` and `scripts/generate-narration.mjs`
4. Run `node scripts/generate-narration.mjs`, then `node scripts/update-durations.mjs`
5. Calculate `startFrame` values from `durations.json` and update the scene + duration array
6. Add `MyOperationVideo` + `MyOperationReel` exports to `src/standalone/index.tsx`
7. Register both compositions in `src/Root.tsx` under `Folder "Standalone"` and `Folder "Reels"` using `standaloneDuration(SCENE_FRAMES)` and `makeCalcMetadata(myOperationCode)`

### Key types (`src/lib/types.ts`)

- `NodeHighlight`: `"active" | "found" | "removing" | "new" | "error" | "visited" | "none"`
- `ListSnapshot`: nodes + pointers + arrows + optional newNode/caption/searchTarget
- `SceneStep`: snapshot + highlightLines + startFrame

### Layout & theming

- **YouTube** (`SplitLayout`): 62% diagram / 38% code, grid dot background
- **Reel** (`StackedLayout`): diagram top ~55% / code bottom, pure black, glowing divider; safe area `{ top: 150, bottom: 380, left: 60, right: 160 }` for Instagram UI overlay
- All colors, fonts, spacing, and spring presets live in `src/lib/theme.ts`
- Reel `topRatio` and `codeFontSize` depend on code line count: ≤6 lines → 0.55 / 30px; 7–12 → 0.45 / 26px; 13–15 → 0.42 / 24px

### Narration writing style

Each line is one standalone audio clip. Write conversationally (short sentences, use concrete values like "three, seven, nine" not "the nodes"), explain *why* before *how*, show wrong approaches first when instructive, end with CTA on the last step.
