# Theme & Types Reference

Defined in `src/lib/theme.ts` and `src/lib/types.ts`. CLAUDE.md covers the visual palette at a high level; this doc enumerates every token, every type field, and notes drift between declared theme tokens and what components actually use.

---

## Colors (`theme.ts → colors`)

### Surface & text
| Token | Value | Use |
|---|---|---|
| `base` | `#0A0A0F` | Default scene background |
| `mantle` | `#06060A` | Used as `rgba(6,6,16,0.78)` for `StackedLayout`'s code card |
| `crust` | `#000000` | Hard-coded as `SplitLayout`/`StackedLayout` background |
| `surface0` | `#14141F` | Card / panel fill |
| `surface1` | `#1C1C2B` | Elevated surface |
| `surface2` | `#2A2A3D` | Borders / dividers |
| `overlay0` | `#5C5C7A` | `CodeWindow` YouTube-header filename label |
| `text` | `#F0F0F8` | Primary text (`TitleCard`/`OutroCard` titles) |
| `subtext0` | `#A0A0B8` | Dimmed text (`LinkedListDiagram` caption pill) |

### Accent palette
| Token | Value | Use |
|---|---|---|
| `lavender` | `#B8C4FF` | Default `Pointer` color; fallback for `CodeOnlyLayout` Big-O badge |
| `blue` | `#6E9BFF` | Same as `arrowActive` — highlighted arrows |
| `sapphire` | `#5BB8E8` | Defined; unused |
| `green` | `#6EE7A0` | Success accent / diagonal 0 (CLAUDE.md) |
| `yellow` | `#FFD666` | Diagonal 1 / warning |
| `peach` | `#FF9E6B` | Accent |
| `red` | `#FF6B8A` | Error / removing |
| `mauve` | `#B07EFF` | `CodeBlock` function-name re-color |
| `pink` | `#FF7EB8` | Accent |
| `teal` | `#5CE8D4` | Accent |

### Node-state aliases (mostly unused by components)
| Token | Value |
|---|---|
| `nodeDefault` | `#3B82F6` |
| `nodeDefaultDark` | `#2563EB` |
| `nodeActive` | `#8B5CF6` |
| `nodeFound` | `#3B82F6` |
| `nodeRemoving` | `#FF6B8A` |
| `nodeError` | `#FF6B8A` |
| `nodeNew` | `#A855F7` |

`NodeBox` reimplements its `{light, bg, dark}` palette inline with the same hex values — only `colors.nodeDefault` is actually read from the theme (for the `none` highlight `bg`). The other aliases are dead in current code; editing them in `theme.ts` won't change anything.

### Connection colors
| Token | Value | Use |
|---|---|---|
| `arrowDefault` | `rgba(255,255,255,0.92)` | Default `Arrow` stroke |
| `arrowActive` | `#6E9BFF` | Highlighted `Arrow` stroke |
| `highlightBar` | `rgba(110,155,255,0.14)` | Defined; `CodeBlock` uses a different hard-coded `rgba(0,150,255,...)` |
| `nullNode` | `#4A4A6A` | `null` sentinel border + label |

### Code background
| Token | Value | Note |
|---|---|---|
| `codeBg` | `#08080E` | Defined; `CodeBlock` uses `background: transparent` |
| `dimmed` | `0.3` | Generic dim-opacity constant; components reference their own values |

---

## TreeNodeCircle palette (separate from `colors`)

Confirmed in `TreeNodeCircle.tsx:20–28`:

| Highlight | Background | Rendered effect |
|---|---|---|
| `none` | `#0096FF` | Default blue |
| `active` | `#0096FF` | **Same as `none`** — no color difference |
| `found` | `#40c057` | **Only unique color** — green |
| `new` | `#0096FF` | Same blue |
| `visited` | `#0096FF` | Same blue; opacity drops to 0.28 via `nodeDimT` |
| `removing` | `#0096FF` | Same blue |
| `error` | `#0096FF` | Same blue |

`isEmphasizedHighlight()` returns true for `active`, `found`, `new`, `removing`, `error` — these trigger emphasis pulse + wobble and stay full-opacity during spotlight. `visited` and `none` get dimmed. **`"pinned"` is NOT in this map** — using `"pinned"` on a tree node crashes the palette lookup. The flat palette means tree-group differentiation must rely on **dashed colored arrows** (`ArrowData.color` + `dashed: true`) or **rotating dashed rings** (`showRing` + `ringNodeIds` on `TreeDiagram`).

---

## Fonts (`theme.ts → fonts`)

| Token | Value |
|---|---|
| `mono` | `'JetBrains Mono', 'Fira Code', monospace` — code, addresses, complexity, node values |
| `sans` | `'Inter', 'SF Pro Display', system-ui, sans-serif` — titles, captions, headers |

`CHAR_W_RATIO = 0.601` (referenced by `CodeBlock`, `CodeOnlyLayout`, `InlineCodeMagicMove`) is calibrated to JetBrains Mono — swapping the mono font drifts every line/arrow position.

---

## Spacing (`theme.ts → spacing`)

| Token | Value | Use |
|---|---|---|
| `nodeWidth` | `130` | `NodeBox` base width |
| `nodeHeight` | `56` | `NodeBox` base height; `TreeNodeCircle` size = `56 * 1.18 * nodeScale` |
| `nullWidth` | `50` | Defined; null sentinels currently compute `nodeW * 0.45` instead |
| `diagramPadding` | `40` | `LinkedListDiagram` left/right padding |
| `pointerStackOffset` | `42` | Extra arrow length per stack level (`Pointer` `baseArrowLen = 22 + stackIndex * 42`) |

---

## Spring presets (`theme.ts → springPresets`)

| Name | damping | stiffness | mass | Where used |
|---|---|---|---|---|
| `enter` | 12 | 100 | 0.8 | `NodeBox`/`Pointer`/`TreeNodeCircle` entry; `CodeBlock` line reveal |
| `exit` | 18 | 80 | — | `LinkedListDiagram` removing-node fade |
| `snappy` | 20 | 200 | — | `Pointer` enter |
| `slide` | 22 | 150 | — | `Arrow` draw; `SceneTransition` enter |
| `emphasis` | 8 | 60 | 0.6 | Activation pulse; `TitleCard`/`OutroCard` badge; comparison badge |
| `gentle` | 25 | 100 | — | `OutroCard` next-topic; `CodeOnlyLayout` derivation fly-in |
| `transition` | 16 | 120 | — | The crossfade `t` from `useStepTransition` |
| `pointerMove` | 10 | 140 | 0.9 | Pointer pendulum overshoot |

### Undefined preset — gotcha

`springPresets.bouncy` is referenced in `TreeNodeCircle.tsx`, `QueueVisualization.tsx`, `CodeOnlyLayout.tsx`, and `scenes/BoundaryTraversal.tsx` but **not defined in `theme.ts`**. Remotion's `spring()` falls back to its built-in default (`damping: 10, stiffness: 100, mass: 1`), so the animation still runs — it just doesn't match `enter`. Adding `bouncy` to `theme.ts` later would silently change every consumer.

---

## Types (`src/lib/types.ts`)

### `NodeHighlight`
```ts
type NodeHighlight = "active" | "found" | "removing" | "new" | "error" | "pinned" | "none";
```
- `NodeBox`: 5 unique looks — `active` (purple), `found` (blue), `removing`/`error` (pink/red), `new`/`pinned` (purple), `none` (default blue). `visited` is NOT in the type but is referenced elsewhere; `NodeBox` checks `highlight === "visited"` to drop opacity to 0.55 — meaning the type is incomplete vs actual usage.
- `TreeNodeCircle`: only `found` unique (see table above). **Don't pass `"pinned"` to tree nodes.**
- `SfxLayer` keys off `active`, `found`, `new`, `removing`, `error` for SFX selection.

### `ListNodeData`
```ts
interface ListNodeData {
  id: string;            // identity for cross-step matching
  value: number;
  highlight?: NodeHighlight;
  x?: number;            // px override (off-row placement, floating newNode)
  y?: number;
  reversed?: boolean;    // flips NodeBox pointer/value panes (Reverse.tsx)
  address?: string;      // memory-address label below the box
}
```

### `PointerData`
```ts
interface PointerData {
  label: string;
  targetNodeId: string | null;
  color?: string;
  id?: string;           // stable identity; defaults to `label`
}
```
Set `id` when the displayed `label` changes between steps (`"len = 1"` → `"len = 2"`) — without it, `LinkedListDiagram` re-mounts the pointer each step and the slide/pendulum doesn't play.

### `ArrowData`
```ts
interface ArrowData {
  from: string;          // node id
  to: string;            // node id or "__null__"
  dashed?: boolean;
  highlight?: boolean;
  curved?: boolean;      // elbow path; required for cycle-back
  color?: string;        // overrides stroke + glow (diagonal groups)
}
```
- `to: "__null__"`: `LinkedListDiagram` renders a short leftward arrow to a dashed `null` box (good for initial `head → null`).
- `curved: true`: triggers the L-path AND the pointer pendulum's down-across-up arc when a pointer follows it.
- `dashed + color`: recommended way to show colored groups (e.g. `DiagonalTraversal.tsx`) — works around the `TreeNodeCircle` flat palette.

### `ListSnapshot`
```ts
interface ListSnapshot {
  nodes: ListNodeData[];
  pointers: PointerData[];
  arrows: ArrowData[];
  newNode?: ListNodeData;
  caption?: string;
  hideEndNull?: boolean;
  complexityInfo?: { time: string; space: string };
  queueItems?: Array<{ value: number; highlight?: "active" | "new" | "visited" | "none" }>;
  nextQItems?: Array<{ value: number; highlight?: "active" | "new" | "visited" | "none" }>;
  stackItems?: number[];
  outputValues?: number[];
  outputLabel?: string;
}
```
- `caption`: a string matching `curr.val(N) == M` / `curr.val(N) != M` makes `LinkedListDiagram` render an inline comparison badge above the active node (see `parseComparison`).
- **Additive fields used by consumers but not declared here**: `searchTarget` (`SearchNode.tsx` + `LinkedListDiagram`), `complexityFormula`, `complexityDerivation`, `simplifyAtFrame`, `arrowLabel`, `arrowAnchorLine` (all consumed by `CodeOnlyLayout`). TypeScript is structural so these work, but the declared interface is a lower-bound — treat this doc as the full shape.

### `HighlightStep`
```ts
interface HighlightStep {
  startLine: number;   // 0-indexed inclusive
  endLine: number;     // 0-indexed inclusive
}
```

### `SceneStep`
```ts
interface SceneStep {
  snapshot: ListSnapshot;
  highlightLines: HighlightStep;
  startFrame: number;       // absolute frame when this step becomes active
  visibleLines?: number;    // progressive code reveal; high-water-marked
}
```
`startFrame` must be monotonically increasing; `useStepTransition` returns the latest step whose `startFrame ≤ frame`. `visibleLines` is high-water-marked — once a line index is exposed, it stays visible.

### `CodeSnippet`
```ts
interface CodeSnippet {
  code: string;
  tokens: ThemedToken[][];
  language: string;
}
```
Produced by `calculateMetadata` in each composition (`Root.tsx`). The `tokens` array is what every code component consumes.

---

## Notable theme-vs-component drift

- `colors.codeBg` defined but `CodeBlock` uses `background: transparent`. The dark backdrop comes from the surrounding layout.
- `colors.highlightBar` defined but `CodeBlock` hard-codes its own `rgba(0,150,255,...)` for the highlight border.
- `colors.nodeActive/Found/Removing/Error/New` are dead aliases — `NodeBox` reimplements them inline.
- Tree palette lives entirely in `TreeNodeCircle.tsx` — refactoring `theme.ts` does not touch tree colors.
- `Pointer`'s declared default color (`"#2563EB"`) only fires when the caller bypasses `LinkedListDiagram`, which always forwards `colors.lavender`.

When extending the system, prefer adding theme tokens and wiring them through rather than introducing more inline hex.
