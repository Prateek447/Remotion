# Tree Patterns

Distilled from `BSTInsert.tsx` (mutation) and `LeftViewTraversal.tsx` (BFS traversal). Use these when authoring any tree scene.

**Reference templates**:
- Mutation with topology resets between cases → `BSTInsert.tsx`
- Traversal with accumulating output → `LeftViewTraversal.tsx`

## Layout & rendering

- Use `TreeDiagram` — requires an explicit `positionMap` (fractional coords per node).
- Three-format render switch on `format` prop:
  - `youtube` → `SplitLayout` (55% diagram width), default position map (root at `y: 0.18`)
  - `reel` → `StackedLayout`, reel position map (root pushed higher: `y: 0.12-0.13`)
  - `reel-anim` → `AnimationOnlyLayout`, reel-anim position map
- Reel safe area for trees: `{ top: 150, bottom: 380, left: 90, right: 130 }` — wider than linked-list scenes.
- `REEL_TOP_RATIO`: `0.45` (12+ line code), `0.52`, `0.55`, `0.60` (≤6 lines). Hand-tuned per scene.

## Position map convention

```ts
const positionMaps = {
  "reel-anim": { "n50": { x: 0.5, y: 0.13 }, "n30": { x: 0.3, y: 0.4 }, ... },
  "reel":      { "n50": { x: 0.5, y: 0.12 }, "n30": { x: 0.3, y: 0.38 }, ... },
  "default":   { "n50": { x: 0.5, y: 0.18 }, "n30": { x: 0.3, y: 0.45 }, ... },
};
const positionMap = positionMaps[format] ?? positionMaps.default;
```

- Coordinates are fractional: `x: 0.0–1.0` of `areaWidth`, `y: 0.0–1.0` of `areaHeight`.
- Root usually `x: 0.5` (centered), `y: 0.12–0.18` depending on format.
- New nodes (during insertion) placed independently below their parent — not auto-computed.
- No layout algorithm — hand-tuned per scene. For future automation, consider Reingold-Tilford.

## Snapshot factory pattern

The defining tree convention: **factory functions for node sets**.

```ts
const makeBSTNodes = (
  activeId?: string,
  foundIds: string[] = [],
  includeN35 = false,
  n35Highlight: NodeHighlight = "new",
): TreeNodeData[] => { ... };

const makeBSTEdges = (
  highlighted: string[] = [],
  includeN35Edge = false,
): TreeEdgeData[] => { ... };
```

- The factory takes the **minimal differentiating parameters**: which one node is active, which set is "found", structural toggles (`includeN35` for newly inserted nodes).
- Static topology lives in a module-level `BST_BASE_EDGES`; the factory only flips highlight flags.
- Use this pattern when the same node set appears 10+ times with different highlight permutations.
- Edge highlighting uses string keys `"from-to"`: `highlighted: ["n50-n30", "n30-n40"]`.

## Progressive code reveal: `visibleLines`

Every tree step sets `visibleLines: N` — code lines fade in as the algorithm needs them:

```ts
{ stepIndex: 0, visibleLines: 1, highlightLines: {startLine: 0, endLine: 0}, ... }
{ stepIndex: 5, visibleLines: 13, highlightLines: {startLine: 7, endLine: 9}, ... }
```

Tree scenes always do this. Linked-list scenes don't (their code is short enough to show in full). For new scenes:
- Code length ≤8 lines → skip `visibleLines`, show all.
- Code length >8 lines → use `visibleLines` to reveal progressively.

## Phase handling: `CaseBanner` overlay

When a tree scene needs to reset topology between cases (e.g. "normal insert" → "empty tree case" → "duplicate case"), use the **CaseBanner pattern**:

```ts
const PHASE_MARKERS: Record<number, { label: string; title: string }> = {
  1:  { label: "CASE 1", title: "Normal insert" },
  7:  { label: "CASE 2", title: "Empty tree" },
  10: { label: "CASE 3", title: "Duplicate value" },
};
```

- Banner overlays at phase-start step.
- Tree content holds at `opacity: 0` during the banner's 92-frame window (70 hold + 22 fade).
- After the banner clears, the tree fades back in with the new topology already in place.

**This is the alternative to `transitionStyle="gravity"|"blob"|"flip"`** when the topology genuinely resets between cases. The banner masks the discontinuity.

Use transition styles when the tree gradually transforms across steps. Use the banner pattern when the tree resets entirely between phases.

## Traversal-specific patterns

### Queue overlay (`QueueVisualization`)
For BFS-style scenes, render the queue as a sibling overlay to the tree:

```tsx
<TreeDiagram steps={steps} ringNodeIds={["n1", "n2", "n4", "n8"]} />
<QueueVisualization steps={steps} />
```

- Reads `snapshot.queueItems: QueueItem[]`.
- Per-item `highlight: "new" | "active" | "visited" | "none"`.
- Positioned absolutely *over* the tree at `bottom: 110`.

### Output strip (`outputValues`)
For algorithms that accumulate a result:

```ts
snapshot: {
  ...,
  outputValues: [1, 2, 4, 8],
  outputLabel: "Left view",
}
```

- Grows from `[]` → accumulating values across steps.
- Rendered by `TreeDiagram` as a labeled strip.
- Use for any algorithm with a list/array result: left view, level order output, path-from-root.

### `ringNodeIds` (answer set)
For "show progress accumulating" scenes:

```tsx
<TreeDiagram ringNodeIds={["n1", "n2", "n4", "n8"]} />
```

- Adds a permanent dashed ring around the listed nodes.
- Lets the viewer track the result-so-far without re-coloring.
- Important when nodes have multiple states (queued, printed, skipped) and you want to mark the "final answer" set separately.

### Highlight palette for traversal
Four states per node:

| Highlight | Meaning |
|---|---|
| `none` | Not yet reached |
| `active` | Currently being processed (top of queue, current pointer) |
| `found` | Printed/output |
| `visited` | Polled but skipped (e.g. non-leftmost in left-view) — dims to 0.28 opacity |

`"visited"` is unique to traversal — it's the only highlight that dims without changing color.

### Shorthand constants for accumulating sets
Pre-name the accumulating subsets to keep step definitions terse:

```ts
const P1     = ["n1"];               // printed after step 4
const P12    = ["n1", "n2"];         // printed after step 8
const P124   = ["n1", "n2", "n4"];   // ...
const V3     = ["n3"];               // visited (skipped)
const V3567  = ["n3", "n5", "n6", "n7"];
```

## Mutation-specific patterns

### Phase taxonomy with banners
BST mutation scenes use a 3-phase structure marked by `PHASE_MARKERS`:

```
CASE 1: NORMAL INSERT      → Standard descent + insert
CASE 2: EMPTY TREE         → root == null edge case
CASE 3: DUPLICATE VALUE    → val == node.val behavior
```

Each case is a complete miniature scene with its own setup, walk, and conclusion. The banner provides the visual reset between them.

### Caption style
Tree mutation scenes use **tutorial-prose captions** that mirror the code call:

```ts
caption: "insertRec(50, 35) — is 50 null? No. Compare."
caption: "35 < 50 → move left to node 30"
caption: "40 == 40 — neither condition fires"
```

- Uses `→` arrow glyph and em-dash separator.
- References the *function call with args*, not pseudocode.
- End-of-phase captions are reflective: `"return node — duplicate silently ignored"`.

This style differs from linked-list captioning — captions are denser and code-anchored because trees have less natural narrative flow than sequential lists.

## Recursive algorithm pattern (cross-cutting)

Tree algorithms are almost always recursive. The default storyboard mistake is **collapsing multiple recursion frames into one step**, producing a wave of color instead of a sequence of calls. The fix is structural:

### One step per recursive frame

For an algorithm like `countNodes`, `treeHeight`, `sumTree`, or `diameter`:

- **Enter a call** → its own step. Highlight the node being processed. (Optionally annotate the path from root.)
- **Hit a base case** → its own step. Show the null/empty condition. Make the return value visible (caption or overlay).
- **Recurse into a child** → its own step. The active node moves down-left or down-right.
- **Return from a call** → its own step (or merge with the parent's combine step). Mark the node `"found"` and show the value it returned.
- **Combine return values at a parent** → its own step. Resolve the formula with concrete numbers: "left = 1, right = 1, return 1 + 1 + 1 = 3."

Compression for symmetric subtrees is allowed AFTER the left side has been shown end-to-end — the right side can move at roughly half the step count, but every recursive call still gets a frame. Never use "same thing" as a substitute for showing the work.

### Visual conventions for recursion

| State | NodeHighlight | When |
|---|---|---|
| Not yet visited | `none` | Default |
| Currently active recursive frame | `active` | The function is running on this node right now |
| Has returned a value | `found` | The recursive call on this node has completed |
| Skipped / pruned | `visited` | Algorithm explored this but determined it doesn't contribute |

Use `caption` to show the return value: `"Node four returns one"`. The viewer must see the number before the parent uses it.

For deeper visualization of the call stack, consider:

- `outputValues: [1, 1, 3, 1, 1, 3]` — strip showing returns in order they happened.
- `stackItems: [...]` — though this type field is currently unused for tree scenes, a renderer could be added.
- Caption with formula in progress: `"Node 2: 1 + 1 + 1 = 3"`.
- **Return-value overlay system** — four cooperating components that make the recursion mechanically visible (see next section). This is now the preferred way to teach recursion; captions become supporting text, not the primary signal.

### Return-value overlay system

Introduced in `CountTreeNodes.tsx` and reusable for any recursive tree algorithm (`treeHeight`, `sumTree`, `diameter`, `maxDepth`, `kthSmallest` with subtree-size, etc.). Four overlay layers stack on top of `TreeDiagram`; each is small, declarative, and driven by tables defined at the top of the scene file.

| Overlay | Visual | Purpose |
|---|---|---|
| `NullNodeOverlay` | Dashed circle labeled `null` fades in below the leaf, with a short dashed edge; a grey "0" pill then travels from the null node up to the parent | Makes the *base case* visible. Before this overlay, the null was implicit ("there is no left child"); now it's a real node on screen that returns a real zero |
| `TravelingNumberOverlay` | Green pill containing the returned number glides along the parent edge from child → parent over `TRAVEL_FRAMES` (~28 frames) | Makes the *return* visible. The viewer literally sees the value move up the call stack |
| `ReturnValueOverlay` | Persistent green `= N` badge below each node that has returned | Keeps returned values on screen so the parent's combine step can reference them visually |
| `FormulaOverlay` | Blue pill next to each node; lifecycle: `"L = 0"` (when left arrives) → `"0 + 0 + 1 = 1"` (when right arrives) → absorb into the node on return | Makes the *combine* visible. The formula updates in real time as each child reports back, then shrinks and fades into the node when the parent returns |

The four layers compose. Reading any base-case → combine sequence top-to-bottom shows:

1. Null node + edge fade in (base case is real)
2. "0" pill travels null → leaf (base case returns)
3. `L = 0` formula pill appears next to the leaf
4. Second null on the other side; second "0" travels up
5. Formula updates to `0 + 0 + 1 = 1`
6. On the leaf's return step: formula absorbs into the leaf; green `= 1` badge appears; green "1" pill travels leaf → parent
7. Parent's `L = 1` formula pill appears, and so on

#### Required scene-side scaffolding

Each scene declares these constant tables once, near the top of the file:

```ts
// Step index at which each node's return value first becomes visible
const NODE_RETURN_STEP:  Record<string, number> = { n4: 8, n5: 12, n2: 13, ... };
const NODE_RETURN_VALUE: Record<string, number> = { n4: 1, n5: 1, n2: 3, ... };

// Child → parent edges for the traveling-number animation
const PARENT_MAP: Record<string, string> = { n4: "n2", n5: "n2", n2: "n1", ... };

// Step → which null child appears at this step (drives NullNodeOverlay)
const NULL_CHILD_INFO: Record<number, { parentId: string; side: "left" | "right" }> = {
  6:  { parentId: "n4", side: "left"  },
  7:  { parentId: "n4", side: "right" },
  ...
};

// Per-node formula lifecycle: left-arrive step / right-arrive step / absorb step
const NODE_FORMULA_LIFECYCLE: Record<string, { leftStep, leftText, rightStep, fullText, absorbStep, ... }>;
```

`makeSteps()` then post-processes raw steps with `raw.map((step, i) => ({ ...step, snapshot: { ...step.snapshot, nodeReturnValues: ... } }))` — auto-attaching the accumulating `nodeReturnValues` to each snapshot from `NODE_RETURN_STEP`/`NODE_RETURN_VALUE`. **The yaml author does not write `nodeReturnValues` directly**; it's derived from the scene-level tables.

#### Snapshot type extensions

`src/lib/types.ts`'s `ListSnapshot` gained two optional fields supporting this system:

- `nodeReturnValues?: Record<string, number>` — set by `makeSteps()` post-processing; read by `ReturnValueOverlay` / `TravelingNumberOverlay`
- `showLevelBands?: boolean` — reserved for level-banded visualizations (`ZigzagTraversal`, etc.)

`SceneStep` also gained `excludeFromAnim?: boolean` so a step can be dropped from the `reel-anim` (no-narration) cut while staying in `youtube`/`reel`.

#### When to use it

✅ **Use for recursive aggregation algorithms** where the teaching moment is "values bubble up": `countNodes`, `treeHeight`, `sumTree`, `diameter`, `maxDepth`, `count-good-nodes`, `path-sum`.

⚠️ **Don't use for traversal algorithms** that emit values rather than aggregate them: level-order, left-view, boundary. Those use `outputValues` + `QueueVisualization` instead.

⚠️ **Don't use for mutation algorithms** (`BSTInsert`, `BSTDelete`) — there's no return value to bubble. Captions + `PHASE_MARKERS` are the idiom there.

### Step-count expectation

See `../teaching.md` "Step-count heuristics" for the formula. For a 7-node balanced binary tree with a `countNodes`-style algorithm, expect **14–18 steps**, not 6–8. Half-density scripts produce review-tier explanations; teaching tier requires showing every frame.

### Reference example

`pipeline/scenes/count-tree-nodes.yaml` is the canonical example of recursion done at teaching density. Mirror its step structure when authoring a new recursive tree scene.

## ComplexityCard

The complexity overlay shown on the closing step.

⚠️ **Currently duplicated** byte-identical between `BSTInsert.tsx:408` and `LeftViewTraversal.tsx:486`. **Should be lifted to `src/components/ComplexityCard.tsx`** — when you build a new tree scene, lift this component to a shared location instead of copying.

Driven by `current.snapshot.complexityInfo: { time: string, space: string }`. Only the closing step sets this field.

Positioned with format-specific absolute coordinates (different `top`/`left` per `anim` / `reel` / `youtube`).

## Code highlight conventions

Same as linked-list scenes:
- Multi-line range for context/recap.
- Single-line during execution.
- Two-line for compound logical steps.
- `visibleLines: N` controls how much code is rendered at all.

## Hook step special-case

Step 0 can occupy the full diagram width (no code panel) for orientation:

```tsx
const activeTreeW = stepIndex === 0
  ? width * 0.72
  : interpolate(stepIndex === 1 ? t : 1, [0, 1], [width * 0.72, width * 0.55]);
const codeOpacity = stepIndex === 0
  ? 0
  : interpolate(stepIndex === 1 ? t : 1, [0, 1], [0, 1]);
```

- BST does this for the title-frame hook.
- Hand-implemented per scene (not a layout primitive).
- Opt-in. Most tree scenes don't need it.

## Anti-patterns to avoid

- ❌ Computing positions algorithmically without first checking what a hand-tuned layout looks like — tree aesthetics matter more than tree correctness.
- ❌ Re-implementing `ComplexityCard` per scene. Lift it to `src/components/`.
- ❌ Hardcoding phase boundaries by `stepIndex` (`PHASE_MARKERS: Record<number, ...>`) — fragile if steps reorder. Better: a `phaseStart?: { label, title }` field on `SceneStep`.
- ❌ Importing `useStepTransition` in the scene component just to drive overlays. Overlays should be components that subscribe to step state internally.
- ❌ Using `secondaryCaption` on `ListSnapshot` — it's not in the type and is likely silently dropped.
- ❌ Skipping `visibleLines` on tree scenes — code is usually long enough that progressive reveal helps.

## Quick reference: copy targets

| Building this | Copy shell from |
|---|---|
| BST/AVL/RB-tree insertion or deletion | `src/scenes/BSTInsert.tsx` |
| Tree traversal (in/pre/post-order, level-order, views) | `src/scenes/LeftViewTraversal.tsx` |
| Graph algorithm on a tree-shaped graph | Adapt `LeftViewTraversal.tsx`, may need custom queue |

When you copy, **lift `ComplexityCard` to `src/components/`** as part of the copy. Don't perpetuate the duplication.
