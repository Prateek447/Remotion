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

---

## Visual Design Reference

### Color palette (`src/lib/theme.ts → colors`)

| Name | Hex | Use |
|---|---|---|
| `base` | `#0A0A0F` | Background |
| `surface0` | `#14141F` | Card/panel fill |
| `surface1` | `#1C1C2B` | Elevated surface |
| `surface2` | `#2A2A3D` | Borders/dividers |
| `text` | `#F0F0F8` | Primary text |
| `subtext0` | `#A0A0B8` | Dimmed text |
| `blue` | `#6E9BFF` | Active arrows, code highlight |
| `green` | `#6EE7A0` | Diagonal 0 / success accent |
| `yellow` | `#FFD666` | Diagonal 1 / warning accent |
| `peach` | `#FF9E6B` | Accent |
| `red` | `#FF6B8A` | Error / remove |
| `mauve` | `#B07EFF` | Accent |
| `teal` | `#5CE8D4` | Accent |
| `arrowDefault` | `rgba(255,255,255,0.92)` | Default tree edges |
| `arrowActive` | `#6E9BFF` | Highlighted edge |
| `highlightBar` | `rgba(110,155,255,0.14)` | Code line highlight strip |
| `nullNode` | `#4A4A6A` | Null sentinel nodes |

### NodeHighlight → TreeNodeCircle color mapping

**Critical:** `TreeNodeCircle` has a flat `highlightColorMap` — only `"found"` renders green. Every other value renders the same blue.

| Highlight value | Background | When to use |
|---|---|---|
| `"none"` | `#0096FF` (blue) | Idle / not yet visited |
| `"active"` | `#0096FF` (blue) | Currently processing (no visual difference from none — use caption/spotlight instead) |
| `"found"` | `#40c057` (green) | Node has been added to output / confirmed result |
| `"new"` | `#0096FF` (blue) | Same as active |
| `"visited"` | `#0096FF` (blue) | Same as active — only opacity changes (dimmed to 0.28 via `nodeDimT`) |
| `"removing"` | `#0096FF` (blue) | Same visual, use for semantic clarity |
| `"error"` | `#0096FF` (blue) | Same visual |

**Spotlight dimming:** When any node has `active/found/new/removing/error`, all *non-emphasized* nodes dim to `opacity: 0.28`. Use `"pinned"` in `NodeHighlight` type has no entry — avoid it. To show multiple nodes as "already output", use `"found"` for all of them.

**To show color differences between groups** (e.g. diagonals), use **colored dashed arrows** (`ArrowData.color` + `ArrowData.dashed: true`) — not node highlights, which can't express more than one non-green color.

### Spring presets (`src/lib/theme.ts → springPresets`)

| Name | damping | stiffness | mass | Feel |
|---|---|---|---|---|
| `enter` | 12 | 100 | 0.8 | Gentle pop-in |
| `exit` | 18 | 80 | — | Quick fade out |
| `snappy` | 20 | 200 | — | Instant snap |
| `slide` | 22 | 150 | — | Arrow draw / step transitions |
| `emphasis` | 8 | 60 | 0.6 | Slow emphasis pulse |
| `gentle` | 25 | 100 | — | Smooth, no overshoot |
| `transition` | 16 | 120 | — | Mid-speed crossfade |
| `pointerMove` | 10 | 140 | 0.9 | Pendulum swing with overshoot |

### Arrow component animations (`src/components/Arrow.tsx`)

**Three rendering modes based on props:**

1. **Curved** (`curved={true}`): elbow path (L-shape), pixel-space dashes.
   - `strokeDasharray="8 5"` (13px period), `dashCrawl = -(frame * 0.5) % 13`
   - No `pathLength` attribute — pixel space throughout.

2. **Straight/Bezier** (default, `curved={false}`): quadratic bezier with optional `bend` for rubber-band effect.
   - **Draw animation:** `pathLength={1}`, `strokeDasharray="1"`, `strokeDashoffset` springs from 1→0.
   - **Dashed crawl:** `pathLength={1}`, `strokeDasharray="0.12 0.08"` (period = 0.20 in normalized space).
     - Formula: `dashCrawlNorm = -((frame * 0.006) % 0.20)`
     - **Do NOT divide by pixel length** — everything stays in pathLength=1 space.
     - Speed: ~1 full cycle/second at 30fps. Length-independent.

3. **No arrowhead** for dashed arrows (`opacity={dashed ? drawProgress : 1}` on the path; arrowhead uses `headOpacity` separately).

**`ArrowData` fields** (`src/lib/types.ts`):
```typescript
{ from: string; to: string; dashed?: boolean; highlight?: boolean; curved?: boolean; color?: string; }
```
- `color` overrides both stroke and glow color.
- `highlight` dims all non-highlighted arrows to 0.25 opacity (same spotlight logic as nodes).
- `dashed` + `color` together = colored crawling dotted line (used for diagonal group visualization).

### TreeNodeCircle animations

| Animation | Mechanic |
|---|---|
| **Entry bounce** | Underdamped spring: `scale` 0.55→1 (overshoots), `y` −28→0 |
| **Emphasis pulse** | On `active/found/new`: scale peaks at 1.12× then settles at 1.02× |
| **Wobble** | Decaying sine on highlight change: `exp(-localFrame * 0.07) * 6px * sin(frame * 0.55)` |
| **Idle float** | Continuous: `sin(frame * 0.055 + phase) * 10px`; phase = `delay * 0.9` |
| **Idle rotate** | Continuous: `sin(frame * 0.04 + phase + 1.2) * 3deg` |
| **Spotlight dim** | Non-emphasized nodes → `0.28` opacity when any node is active/found/new |
| **Dashed ring** | `showRing={true}`: rotating dashed circle, 0.45°/frame, color follows highlight |

**`TreeDiagram` passes `delay = index * 3`** to each node, so idle float phases are spread across nodes. Arrows mirror the same wiggle offsets so edges stay attached.

### Reel layout parameters (tree scenes)

- `REEL_TOP_RATIO`: `0.42` for ~22 line code, `0.45` for 13–15 lines, `0.55` for ≤6 lines
- `REEL_SAFE`: `{ top: 150, bottom: 380, left: 90, right: 130 }` — accounts for Instagram UI chrome
- Code font size: 22–24px for 20+ line code in reel format

### Tree scene position map convention

Node positions are fractional (`x: 0.0–1.0, y: 0.0–1.0`) relative to the diagram area. `TreeDiagram` multiplies by `areaWidth`/`areaHeight` to get pixel coords. YouTube uses `areaWidth = 1920 * 0.55`; Reel uses safe-area-adjusted dimensions.

---

## Tree Transition Styles

`TreeDiagram` accepts `transitionStyle?: "none" | "gravity" | "blob"` (default `"none"`). Safe to add to any tree scene; no other file changes needed.

### All available transition options (catalogue for future implementation)

| # | Name | Description | Effort |
|---|---|---|---|
| 1 | **Ripple Wave** | Stagger each node's transition by `level × 6 frames`. Root snaps first, leaves last. Pure delay change in `TreeNodeCircle`. | Low |
| 2 | **Per-Step Position Morphing** | Add `positionMap` per step to `SceneStep`; `TreeDiagram` lerps `prevPos → currPos` using `t`. Nodes glide to new layout positions. Foundation that unlocks 3, 5, 6, 7. | Medium |
| 3 | **Explosion → Reassembly** | Nodes fly outward from centroid mid-transition then snap back. Two-phase spring: overshoot to 1.4× then settle to 1.0×. | Medium |
| 4 | **3D Card Flip** ✅ IMPLEMENTED | `perspective: 1200px` container. First half: old tree `rotateY(0→90°)` easeIn. Swap at 90° (edge-on, invisible). Second half: new tree `rotateY(-90→0°)` easeOut. 28-frame window. Prop: `transitionStyle="flip"`. | Medium |
| 5 | **Vortex Spiral** | Nodes travel in polar coords: `r` decreases to 0 at centroid, then expands to new positions while `θ` rotates by 2π. | Medium-High |
| 6 | **Liquid Blob Merge** ✅ IMPLEMENTED | All nodes + arrows scale to 0.28× + `blur(30px) brightness(1.7)` → merge into glowing blob → snapshot swaps at peak blur (invisible cut) → unblur + expand. 32-frame window. Prop: `transitionStyle="blob"` on `TreeDiagram`. | Medium |
| 7 | **Gravity Drop + Rain** ✅ IMPLEMENTED | Phase 1: prev snapshot falls off bottom (`easeIn`, 980px). Phase 2: curr snapshot rains in from above (`easeOut`, −720px). 22-frame window. Prop: `transitionStyle="gravity"` on `TreeDiagram`. | Medium |
| 8 | **Shockwave Ripple** | SVG circle expands from root outward; each node bounces (1→1.3→1 scale) as the ring passes through it. Cosmetic overlay, compatible with any other transition. | Low-Medium |
| 9 | **Chromatic Aberration Glitch** | For 4–6 frames at transition: 3 copies of tree offset ±4px in RGB channels via `mix-blend-mode`. Looks like corrupted signal. Snaps to new state. | Low-Medium |
| 10 | **Particle Dissolve** | Each node dissolves into ~12 scatter dots, which then converge on new positions. Pure SVG/math particle system, no libs. | High |

### Implementation notes for Option 6 (Liquid Blob Merge)

- `BLOB_FRAMES = 32` — full animation window (both collapse and expand)
- Triangle wave: `blobT = phase < 0.5 ? phase*2 : (1−phase)*2` — peaks at midpoint
- At peak (frame 16): `scale = 0.28`, `blur = 30px`, `brightness = 1.7`
- Snapshot swap happens at `blobPhase = 0.5` — completely hidden by max blur
- First half renders `prevSnapshot` collapsing into blob; second half renders `snapshot` expanding out
- All rendering simplified (no crossfade, `transitionT=1`, `nodeDimT=0`) — blur makes detail invisible
- Guard: `stepIndex > 0` skips on the very first step
- `transformOrigin: "center center"` — all nodes scale toward diagram center
- Blob render is a separate early-return branch in TreeDiagram, completely separate from normal render path

### Implementation notes for Option 7 (Gravity Drop + Rain)

- `GRAVITY_FRAMES = 22` — both phases run within this window simultaneously
- Fall easing: `offsetY = t² × 980` (quadratic easeIn → accelerates)
- Rain easing: `offsetY = -(1−t)² × 720` (quadratic easeOut → decelerates into place)
- Opacity: fall = `1 − t` (linear fade out), rain = `t` (linear fade in)
- Prev snapshot rendered as a separate absolute-positioned layer (arrows + nodes) that falls
- Curr snapshot wrapped in a second layer that rains in
- Guard: `stepIndex > 0` skips on the very first step
- `willChange: "transform, opacity"` on both layers for GPU compositing
