# Component Catalog

Reference for every component in `src/components/`. For each: purpose, props as defined in source, when to use, common patterns, and gotchas. CLAUDE.md covers shared color palette, spring presets, and the canonical Arrow/TreeNodeCircle quirks — this doc adds the per-component contract and what CLAUDE.md doesn't cover.

---

## Layout

### `SplitLayout`
**Purpose**: 62/38 two-column canvas for YouTube (1920×1080): diagram left, code right.
**Props**: `left`, `right: React.ReactNode`; `leftWidth?: string` (default `"62%"`).
**Use**: Every linked-list scene in YouTube format. Pair with `<LinkedListDiagram>` on the left and `<CodeWindow><CodeBlock/></CodeWindow>` on the right (`InsertHead.tsx`, `Reverse.tsx`).
**Gotchas**: Background hard-coded `#000`. Right panel is `pointerEvents: "none"` and overlays the left, which fills the full canvas. `NoiseOverlay` is appended automatically — don't re-add it.

### `StackedLayout`
**Purpose**: Vertical two-pane canvas for Instagram Reels (1080×1920): diagram top, code in a rounded card at the bottom.
**Props**: `top`, `bottom: React.ReactNode`; `safeArea?: { top, bottom, left, right }` (default zeros); `topRatio?: number` (default exported `STACKED_TOP_RATIO = 0.55`); `contentPaddingTop?: number` (default `36`).
**Use**: All reel scenes. Pass the reel safe area (`{ top: 150, bottom: 380, left: 60, right: 160 }`) to clear Instagram UI; pick `topRatio` from CLAUDE.md's line-count table.
**Gotchas**: The glowing divider gradient + radial bloom at `topPct` is intrinsic — you can't disable it without editing the component. Code-card styling (`rgba(6,6,16,0.78)`, `borderRadius: 22px 22px 0 0`) is also baked in.

### `AnimationOnlyLayout`
**Purpose**: Reel-format wrapper that centers a diagram vertically and applies a `0.889×` uniform scale (`ANIM_SAFE_SCALE`) so it fits Instagram's horizontal safe area.
**Props**: `children`. Exports `ANIM_DIAGRAM_HEIGHT = 900`.
**Use**: "Anim-only" reel compositions that show just the diagram (no code) — e.g. `RightViewTraversal.tsx`, `LeftViewTraversal.tsx`. Pass `format === "reel-anim"` to the scene so it sets `areaHeight={ANIM_DIAGRAM_HEIGHT}` on the diagram.
**Gotchas**: The uniform scale shrinks node/arrow size — compensate with the diagram's `nodeScale` prop.

### `CodeOnlyLayout`
**Purpose**: Full-canvas code layout with line→label arrow annotations and an animated Big-O derivation/badge at the bottom. Built for complexity-explanation scenes.
**Props**: `steps: SceneStep[]`, `tokens: ThemedToken[][]`, `filename?: string` (default `"Solution.java"`), `format?: "youtube" | "reel"`, `reelSafeArea?: { top, bottom, left, right }`, `arrowEndOffset?: number` (px shaved off right edge — smaller = longer arrow; YouTube only).
**Use**: `ConstantTime`, `LinearSearch`, `BinarySearch`, `BubbleSort`, `Factorial`, `Exponential`, `MergeSort` — any scene where the diagram is replaced by annotated code.
**Common patterns**: Each `SceneStep.snapshot` carries extra fields not declared in `ListSnapshot`: `arrowLabel`, `arrowAnchorLine`, `complexityFormula`, `complexityDerivation`, `simplifyAtFrame`. Past arrows render as static, current as a draw-in, then a 2-phase derivation fades droppable `O(1)` terms with a strikethrough.
**Gotchas**: Magic numbers (`CHAR_W_RATIO = 0.601`, `CODE_PAD = 40`) tightly couple this to `CodeBlock`'s defaults. Passes `keepExplainedBright` to `CodeBlock` — that prop is **not declared** in `CodeBlock`'s interface, so it's a silent no-op today. `arrowEndOffset` is ignored in reel; reel uses `reelSafeArea.right`.

---

## Data structure renderers

### `LinkedListDiagram`
**Purpose**: Horizontal singly-linked list with nodes, arrows, pointers, optional `newNode`, null sentinel, and inline caption/search/comparison badges.
**Props**: `steps: SceneStep[]`; `areaWidth?: number` (default `1920 * 0.55`), `areaHeight?: number` (default `1080`), `nodeScale?: number`, `verticalOffset?: number` (positive = shift node row down, useful in reel).
**Use**: Every linked-list scene.
**Common patterns**: Auto-renders the null sentinel when `nodes.length ≤ 5` and `snapshot.hideEndNull` is falsy; collapses to inline `null` text otherwise. Mark cycle arrows `curved: true` for the pointer pendulum to use the down-across-up arc path.
**Gotchas**: Reads `snapshot.searchTarget` even though `ListSnapshot` doesn't declare it (`SearchNode.tsx`). Pointers with `label.toLowerCase() === "prev"` and `targetNodeId === null` go to the **left** of the first node; all other null pointers go to the right. If a `PointerData.label` changes between steps (`"len = 1"` → `"len = 2"`), set a stable `id` or the pointer re-mounts and skips its slide.

### `TreeDiagram`
**Purpose**: Tree renderer driven by a `positionMap` of fractional coordinates. Supports four cross-snapshot transitions.
**Props**: `steps: SceneStep[]`, `positionMap: Record<string, { x: number; y: number }>` (fractional 0–1, multiplied by `areaWidth`/`areaHeight`), `areaWidth?`, `areaHeight?`, `nodeScale?`, `ringNodeIds?: string[]` (nodes to decorate with the spinning dashed ring), `transitionStyle?: "none" | "gravity" | "blob" | "flip"` (see CLAUDE.md for transition details).
**Use**: Every tree scene. Define a per-scene `makePositionMap(format)` returning different layouts for YouTube vs reel — see `LevelOrder.tsx`.
**Gotchas**: Edge wiggle mirrors `TreeNodeCircle`'s idle float (`sin(frame * 0.055 + nodeIndex * 3 * 0.9)`) — reordering `snapshot.nodes` desynchronizes edges for a frame. Transitions only fire when edge topology changes (`edgesChanged`); pure highlight-only steps stay still. Transitions are mutually exclusive — only one style fires per step.

### `QueueVisualization`
**Purpose**: BFS queue (circle cards) + optional nextQ list (yellow rect cards), connected by a `→`.
**Props**: `steps: SceneStep[]`; `itemSize?: number` (default `68`); `style?: React.CSSProperties`.
**Use**: BFS tree-traversal scenes — `LevelOrder`, `LeftViewTraversal`, `RightToLeftDiagonal`, `DiagonalTraversal`.
**Common patterns**: Reads `snapshot.queueItems` and `snapshot.nextQItems`. Items match across snapshots **by value** — duplicate values collapse into one card.
**Gotchas**: Uses `springPresets.bouncy` which is **not defined** in `theme.ts` (Remotion falls back to default config). Hides itself via fade when the current snapshot has `complexityInfo`.

### `TowerOfHanoiDiagram`
**Purpose**: Three-peg Hanoi with physics-based disk lift / travel / drop animation per move.
**Props**: `prevPegs`, `currPegs: PegState` (`{ A: number[]; B: number[]; C: number[] }`), `movingDisk?: number`, `fromPeg?`, `toPeg?: keyof PegState`, `localFrame: number`, `width: number`, `height: number`, `params?: HanoiParams` (`{ n, src, dst, via }`).
**Use**: `TowerOfHanoi.tsx`.
**Gotchas**: Does NOT take `SceneStep[]` — scene owns the step→pegs mapping and passes `localFrame` from `useStepTransition`. Disk colors and bounce amplitudes are hard-coded for `n ≤ 4` (`DISK_COLOR`, `DISK_MASS`, `DISK_BOUNCE_AMP`). Phase durations: `LIFT_F=20, TRAVEL_F=16, DROP_F=22` (58 frames per move at 30 fps).

---

## Code display

### `CodeBlock`
**Purpose**: Shiki-tokenized code listing with springified highlight strip, optional progressive line reveal, and optional auto-scroll.
**Props**: `tokens: ThemedToken[][]`, `steps: SceneStep[]`, `fontSize?: number` (24), `lineHeight?: number` (1.85), `padding?: number` (40), `centered?: boolean`, `centerWidth?: number`, `bold?: boolean`, `autoScroll?: boolean`, `containerHeight?: number`.
**Use**: Inside every `<CodeWindow>`. When `containerHeight` is set, code scrolls to keep the highlighted line in the upper third and adds top/bottom fade gradients.
**Gotchas**: Token colors are re-mapped from One Dark Pro: keywords (`#C678DD`) → blue `#0096FF`, function names (`#61AFEF`) → purple `#B07EFF`, comments → gray `#7C8396`, yellows → white. Changing Shiki theme breaks this. `CHAR_W_RATIO = 0.601` assumes JetBrains Mono. `keepExplainedBright` is referenced by `CodeOnlyLayout` but **not declared** here — dead prop.

### `CodeWindow`
**Purpose**: Window chrome — traffic-light header for YouTube, minimal-dot header for Reel, or no header.
**Props**: `title?: string` (`"LinkedList.java"`), `hideTitle?: boolean` (reel-style minimal header), `noHeader?: boolean`, `children`.
**Use**: Always wraps `<CodeBlock>`. Pass `hideTitle` in reel format.

### `CodeMagicMove`
**Purpose**: Full-canvas Motion-Canvas-style morph between two code snapshots, driven internally by `useCurrentFrame`.
**Props**: `fromInfo`, `toInfo: KeyedTokensInfo`.
**Use**: Between scenes in `FullVideo.tsx`. `KeyedTokensInfo` comes from `src/lib/magic-move.ts` — token identity is preserved so shared tokens slide instead of crossfading.
**Gotchas**: Owns its progress spring (`damping: 18, stiffness: 80, mass: 0.8`) — not controllable from the parent.

### `InlineCodeMagicMove`
**Purpose**: Same morph, externally controlled via `progress: 0..1`.
**Props**: `fromInfo`, `toInfo: KeyedTokensInfo`, `progress: number`, `fontSize?` (24), `lineHeight?` (1.75), `padX?` (40), `padY?` (60).
**Use**: When a code morph must sync to a specific frame window inside a scene — e.g. `RemoveNthFromEnd.tsx` morphs from a long approach to a shorter one over 36 frames.
**Gotchas**: Caller owns positioning; no auto-centering. JetBrains Mono assumption again.

---

## Atomic node elements

### `NodeBox`
**Purpose**: Single linked-list node — value pane + pointer pane separated by a divider, three-stop `{light, bg, dark}` gradient per highlight.
**Props**: `value: number | string`, `highlight?: NodeHighlight`, `x, y, w, h: number`, `delay?`, `localStepFrame?`, `isNull?` (dashed `null` box), `exitProgress?: number` (0..1 fall + rotate + fade), `reversed?: boolean` (flips pointer/value sections — used in `Reverse.tsx`), `address?: string`, `nextAddress?: string` (vertical text in the pointer pane).
**Use**: Only inside `LinkedListDiagram`.
**Gotchas**: Unlike `TreeNodeCircle`, the `NodeBox` palette has 7 unique entries — `active` (purple), `found` (blue), `removing`/`error` (pink/red), `new`/`pinned` (purple), `none` (default blue). `visited` triggers no color change — only `opacity: 0.55`. Hard-coded inline palette ignores the `colors.nodeXxx` aliases in `theme.ts`.

### `TreeNodeCircle`
**Purpose**: Single circular tree node with entry bounce, emphasis pulse, idle float/rotate wiggle, spotlight dimming, and optional rotating dashed ring.
**Props**: `value: number | string`, `highlight?`, `prevHighlight?: NodeHighlight`, `transitionT?: number`, `nodeDimT?: number`, `x, y, size: number`, `delay?`, `localStepFrame?`, `showRing?: boolean`.
**Use**: Only inside `TreeDiagram`.
**Gotchas (critical)**: See CLAUDE.md — confirmed in source: `highlightColorMap` only renders `"found"` (`#40c057` green) uniquely; `none`, `active`, `new`, `visited`, `removing`, `error` all render `#0096FF`. To distinguish groups, use **dashed colored arrows** or rings. **`"pinned"` is not in the map** — passing it on a tree node will read `undefined` and crash the palette lookup. Uses `springPresets.bouncy` which is undefined in theme — falls back to Remotion's default.

---

## Connections

### `Arrow`
**Purpose**: Animated edge between two points. Three render modes (see CLAUDE.md): straight/bezier, curved L-elbow (for cycle-back), and dashed crawl.
**Props**: `fromX, fromY, toX, toY: number`, `dashed?: boolean`, `highlight?: boolean`, `delay?`, `opacity?: number`, `curved?: boolean`, `color?: string` (overrides stroke + glow), `bend?: number` (bezier control offset; `TreeDiagram` uses it to arc edges when nodes wiggle out of phase).
**Use**: Use directly only for scene-owned connections; `LinkedListDiagram`/`TreeDiagram` build their own from `snapshot.arrows`.
**Common patterns**: Cycle visualizations — set `ArrowData.curved = true`. Group coloring (e.g. diagonals) — set `ArrowData.color` + `dashed: true`.
**Gotchas**: Dashed arrows suppress the arrowhead (opacity tied to draw progress). Default non-highlighted stroke is `colors.arrowDefault` (`rgba(255,255,255,0.92)`); highlighted is `colors.arrowActive` (`#6E9BFF`).

### `Pointer`
**Purpose**: Pendulum-style labeled pointer that hangs above a node, swings on motion (`tilt`), rubber-band stretches mid-flight (`stretch`).
**Props**: `label: string`, `x, y: number`, `color?` (default `"#2563EB"`), `delay?`, `stackIndex?: number` (vertical offset for multiple pointers on same node), `scale?: number`, `exitProgress?: number`, `tilt?: number` (degrees, ±14 typical), `stretch?: number` (extra line px during motion, max ≈22).
**Use**: Only inside `LinkedListDiagram` — it computes tilt/stretch/stack automatically from `PointerData`.
**Gotchas**: `transformOrigin: "50% 100%"` — pivot is the arrow tip, so rotation swings the label, not the tip. Lower-stacked pointers render on top (`zIndex: 20 - stackIndex`) so taller pointers' lines pass behind them.

---

## Ambient & audio layers

### `AmbientLayer`
**Purpose**: Loops `sfx/ambient-pad.mp3` at low volume.
**Props**: `volume?: number`; `animOnly?: boolean` (raises default to 0.18 vs 0.06).
**Use**: One per scene composition.

### `SfxLayer`
**Purpose**: Auto-detects step-level events and plays matching SFX clips.
**Props**: `steps: SceneStep[]`; `duckVolume?: number` (default `1`, multiplied through every event); `animOnly?: boolean` (different mix: per-step beat ding, boosted volumes).
**Use**: One per scene composition.
**Detection rules**: new node → `pop`; node count drop → `remove`; new/removed arrow → `swoosh`/`remove`; pointer target changed → `slide`; highlight became `found` → `resolve` / `removing` → `alert` / `error` → `errorBuzz` / `active` → `ding` / `new` → `pop`; phase transition (>150-frame gap) → `phaseTransition`; last step → `successChime`.
**Gotchas**: `animOnly` is a static prop — can't toggle mid-composition. Volumes are calibrated against narration at 85%.

### `NarrationLayer`
**Purpose**: Aligns per-step audio clips from `public/narration/<sceneId>/step-N.mp3` to `step.startFrame` based on `narrationDurationsByScene`.
**Props**: `sceneId: string`, `steps: SceneStep[]`; `volume?: number` (default `0.85`).
**Common patterns**: Each entry in `narrationDurationsByScene[sceneId]` is `{ step, frames, audioStep? }` — `audioStep` overrides which mp3 to play (lets multiple visual steps share one narration).
**Gotchas**: Adds a 5-frame buffer (`d.frames + 5`); scene's `startFrame` math must match (CLAUDE.md).

### `NoiseOverlay`
**Purpose**: SVG `feTurbulence` noise tiled at `mix-blend-mode: overlay` to dither flat gradients and prevent H.264 banding.
**Props**: `opacity?: number` (default `0.025`).
**Use**: Automatic inside `SplitLayout`, `StackedLayout`, `AnimationOnlyLayout`, `TitleCard`, `OutroCard`.
**Gotchas**: `zIndex: 9999`. Above `0.05` opacity becomes perceptible as grain.

---

## Cards & transitions

### `TitleCard`
**Purpose**: Standalone title slide — bouncy title, complexity badge, fade-in subtitle.
**Props**: `title: string`, `subtitle?`, `complexity?: string`.
**Use**: Start of every standalone composition (`StandaloneVideo.tsx`).
**Gotchas**: Radial-gradient background and `#1565C0` badge color are hard-coded.

### `OutroCard`
**Purpose**: Closing slide — checkmark, title, optional "Up next: X →".
**Props**: `title: string`, `nextTopic?: string`.
**Use**: End of every standalone composition.

### `SceneTransition`
**Purpose**: 18-frame enter (slide-up + scale-in) + 22-frame exit (slide-up + scale-out) wrapper.
**Props**: `durationInFrames: number` (must match the wrapping `<Series.Sequence>`), `children`.
**Use**: Inside `FullVideo.tsx` `<Series.Sequence>`s.
**Gotchas**: If `durationInFrames` doesn't match the actual sequence duration the exit fires mid-scene or never.
