# Audited Scenes — Pattern Catalog

Reference audit of 5 representative scenes in `src/scenes/`. Patterns are observable from the source; cite-by-line. Conventions encoded here should propagate to new scenes without re-derivation.

---

## 1. `src/scenes/Traverse.tsx` — Linked-list traversal (read-only walk)

**Step structure.** 7 steps, uniform 40-frame spacing (lines 18, 37, 56, 75, 94, 113, 132). No narration — frames are hand-tuned, not derived from `durations.json`. Step 0 is the *primer* (active=head, caption `"Traverse linked list"`). Last step (line 132) zeros all highlights, removes pointer, captions `"Print null — done!"` and highlights the loop-exit line.

**Snapshot.** Constant `nodes` array; only the `highlight` field rotates `"active"` → `"none"` across one node at a time. `arrows` are never mutated (read-only walk). Single pointer `curr` colored `colors.peach` (line 26) follows `targetNodeId`. Caption alternates between *narrative* (`"Traverse linked list"`) and *action* (`"Print 3"`, `"curr = curr.next"`).

**Captions.** Mix of natural language ("Print 3") and code-mirror ("curr = curr.next" at line 70). Literal node values, not variable names. No tense — declarative fragments only.

**Code highlight.** Two-line range `{0, 1}` for setup, narrowing to `{2, 3}` during the print body, `{4, 4}` for the advance, `{6, 6}` for the exit. The "print" highlight `{2,3}` repeats verbatim across iterations 1–3 (lines 53, 91, 110, 129) — re-highlighting an unchanged range is the convention for "we're on this line again."

**Layout.** YouTube-only (no `format` prop). Renders `<SplitLayout>` + `<SfxLayer steps={steps} />`. No `AmbientLayer`, no `NarrationLayer`, no reel branch. This is the simplest possible scene shell — it predates the standalone/reel pipeline and should be treated as a *legacy template*, not a model for new work.

---

## 2. `src/scenes/InsertHead.tsx` — Linked-list mutation

**Step structure.** 14 steps, frame deltas vary (273, 204, 147, 226, 160, 127, 199, 155, 179, 272, 224, 221) — frames are *measured* from narration `durations.json`, not hand-tuned. Steps are commented into 7 *Phases* (lines 30–276): CONTEXT → PROBLEM → WRONG WAY → CORRECT → WHY O(1) → EDGE CASE → RECAP → CTA. This phase taxonomy is the canonical structure for any *mutation* scene.

**Snapshot.** No captions — narration carries the explanation. The "wrong way" demonstration (lines 96–108) sets all old nodes to `highlight: "error"` simultaneously and *empties* `arrows: []` to visualize unreachability. The recovery step (line 111) literally resets to the pre-error snapshot — repeating an earlier snapshot to signal "rewind" is a recognized pattern.

`newNode` field (line 73) is used in Phase 2 to show the candidate before insertion; once attached, the node moves into the main `nodes` array (line 134) and the `newNode` field is dropped. The dashed-highlight arrow `{ from: "n1", to: "n3", dashed: true, highlight: true }` (line 163) marks the *intent* link before it commits. Pointer color `HEAD_COLOR = "#1565C0"` (line 26) and `NEWNODE_COLOR = "#7B1FA2"` (line 27) — module-level constants, not inline hex.

**Highlights used.** `"new"` for the candidate node, `"error"` for the unreachable-old-nodes shock state, `"found"` for completion (line 194), `"active"` for the "WHY O(1)" zoom (line 214) and recap (line 245). Final CTA step (line 264) marks *every* node `"found"` to glow the whole list.

**Code highlight.** Multi-line range covering the whole signature `{0, 5}` for context/why-O(1)/CTA, narrows to single lines `{1,1}`, `{2,2}`, `{3,3}` during step-by-step execution. Multi-line `{1,3}` for "three simple steps" recap (line 242). Highlight resets to `{0,0}` during the "rewind to good state" step (line 113).

**Layout.** Three-way switch via `format` prop (line 290): `reel-anim` → `AnimationOnlyLayout` with `nodeScale: 1.4`; `reel` → `StackedLayout` with `REEL_SAFE = { top: 150, bottom: 380, left: 60, right: 160 }` (line 288), `nodeScale: 1.2`, `codeFontSize: 30`; `youtube` → `SplitLayout` at `width * 0.62`, `nodeScale: 1`, `codeFontSize: 24`. `compressStepsForAnim(steps)` strips narration-only padding for the anim variant (line 294).

**Layers.** `AmbientLayer animOnly={isAnim}` always mounted, `SfxLayer duckVolume={0.5} animOnly={isAnim}` always, `NarrationLayer sceneId="insert-head"` only when `!isAnim`.

---

## 3. `src/scenes/Reverse.tsx` — Multi-pointer algorithm

**Step structure.** 19 steps, organized into 8 commented phases (lines 39–465): INTRO → CONCEPT → SETUP → ITERATION 1/2/3 → FINAL → COMPLEXITY → CTA. Each iteration has 4 sub-steps: `next` appears co-located → `next` slides forward → `curr.next = prev` (flip) → advance `prev`/`curr`. The sub-step where `next` appears on the *same node* as `curr` (e.g. line 130) then slides 20 frames later to the next node (line 152) — the **"pointer materialize, then translate"** idiom — is the canonical way to show pointer assignment.

**Snapshot.** Three module-level pointer colors: `PREV_COLOR = "#E87B35"`, `CURR_COLOR = "#8B5CF6"`, `NEXT_COLOR = "#2563EB"` (lines 31–33). The `reversed: true` field on `ListNodeData` (e.g. line 167) is the algorithm-specific flag — `LinkedListDiagram` renders these nodes with flipped chevrons. Special sentinel target ID `"__null__"` (line 177) renders an explicit null node at the end of a reversed pointer.

Captions are entirely **absent** — narration covers semantics. The `hideEndNull: true` flag (line 341) appears once Phase 5's flip completes, suppressing the trailing-null sentinel which would now be redundant given an explicit `n3 → __null__` arrow.

**Pointer choreography.** `prev` starts `targetNodeId: null` (line 86) — a null-targeted pointer renders as a labeled badge with no destination. As the algorithm progresses, `prev` walks: null → n3 → n7 → n9; `curr` walks: n3 → n7 → n9 → null. The pointer with `targetNodeId: null` is the canonical "off-the-list" rendering.

**Code highlight.** Each iteration cycles through `{4,4}` (next = curr.next), `{5,5}` (curr.next = prev), `{6,7}` (advance). The 2-line range `{6,7}` is treated as one *logical step* even though it's two statements. Final summary uses `{0, 10}` covering all 11 code lines (line 430).

**Layout.** Same three-way `format` switch. `REEL_SAFE = { top: 150, bottom: 380, left: 30, right: 30 }` — wider safe margins than InsertHead (line 470), `REEL_TOP_RATIO = 0.45` (line 471). Reel `nodeScale: 0.9` (line 489) — smaller than InsertHead's 1.2 because Reverse has 3 pointers per step. `verticalOffset: -30` for reel/anim only (line 498) — diagram nudge to clear pointer badges.

---

## 4. `src/scenes/BSTInsert.tsx` — Tree mutation

**Step structure.** 16 steps in 3 phases (lines 84, 171, 210): NORMAL INSERT → EMPTY TREE → DUPLICATE. Each phase is announced by a `PHASE_MARKERS` (line 326) entry mapping `stepIndex → { label, title }` for steps 1, 7, 10. The `CaseBanner` (line 335) overlays at phase-start; `contentOpacity` (line 521) holds the tree at 0 opacity during the banner's hold-then-fade (92 frames total = 70 hold + 22 fade).

**Snapshot factories.** Helper functions `makeBSTNodes(activeId?, foundIds[], includeN35, n35Highlight)` (line 32) and `makeBSTEdges(highlighted[], includeN35Edge)` (line 63) replace inline node arrays — this is the canonical pattern when the same node set appears 15+ times with different highlight permutations. The factory takes the *minimal* parameter set: which single node is "active", which set is "found". `BST_BASE_EDGES` (line 25) holds the static topology; the factory only flips `highlight` flags.

**Highlights.** `"active"` for the node currently being compared, `"found"` for committed/result nodes, `"new"` for the just-created node before linking. Edge highlighting is bidirectional: `highlighted: ["n50-n30"]` (line 118) — uses string keys `"from-to"`.

**Captions.** Tutorial-prose style, *teach-not-narrate*: `"insertRec(50, 35) — is 50 null? No. Compare."` (line 107), `"35 < 50 → move left to node 30"` (line 119), `"40 == 40 — neither condition fires"` (line 257). Uses `→` arrow glyph and em-dash separator. References *the function call with args*, not pseudocode. End-of-phase captions are reflective: `"return node — duplicate silently ignored"` (line 269).

**`visibleLines` field.** Every step sets `visibleLines: N` (lines 90, 102, 114, …) — progressive code reveal: step 0 shows 1 line, step 5 shows 13. The `CodeBlock` component honors this to fade in code lines as the algorithm needs them. New convention for tree scenes that linked-list scenes don't use.

**Position map.** Three position maps keyed by `format` (line 290): `reel-anim`, `reel`, default. Coordinates are fractional (`x: 0.0–1.0` of `areaWidth`, `y: 0.0–1.0` of `areaHeight`). Reel/reel-anim push the root higher (`y: 0.12-0.13`) to leave room for the queue/code below; YouTube uses `y: 0.18`. New node `n35` is positioned independently to fall *below* its parent `n40` at `y: 0.87` reel-anim / `y: 0.76` YouTube.

**Tree transition style.** Not passed → defaults to `"none"` (see TreeDiagram.tsx:34). Phase changes are masked by the `CaseBanner` overlay; no explicit gravity/blob/flip transitions used. Phase-isolation via banner is the *alternative* to transition styles when the tree topology genuinely resets between cases.

**Hook step special-case.** Step 0 occupies the full width (`width * 0.72`, line 513) with no code panel. Lines 510–516 interpolate `activeTreeW` and `codeOpacity` based on `stepIndex === 1 ? t : 1`. This **hook → splitview** transition is hand-implemented in the scene component (not a layout primitive). The pattern is opt-in per scene.

**ComplexityCard.** Inline component (line 408), driven by `current.snapshot.complexityInfo` (line 503). Only the *last* step (line 282) sets `complexityInfo: { time: "O(h)", space: "O(h)" }`. Positioned via inline style (lines 608–624) — different absolute coordinates for `anim` / `reel` / `youtube`.

---

## 5. `src/scenes/LeftViewTraversal.tsx` — Tree traversal (BFS)

**Step structure.** 22 steps. No phase banners — flat structure. Step 0 introduces with a `secondaryCaption` field (line 93) — *not* in the `ListSnapshot` type (see types.ts:34); used here informally and likely dead/unrendered. Last narrative step (line 412) caption `"Queue empty → loop exits"`, then complexity step (line 427).

**Snapshot factories.** `buildNodes(activeId?, printedIds[], activeIsPrinted, visitedIds[])` (line 34) — richer signature than BST's because BFS has *4 states* per node: untouched, queued/active, printed (`"found"`), skipped (`"visited"`). Shorthand constants `P1`, `P12`, `P124`, `P1248`, `V3`, `V3567` (lines 74–79) — pre-named subsets to keep step definitions terse. New pattern: name the *accumulating output set* per step rather than re-listing IDs.

**Highlights.** Adds `"visited"` (lines 60, 374, 377) — the *only* highlight that dims a node to 0.28 opacity without changing its color. `"visited"` is used for nodes BFS-polled but not printed (the non-leftmost-of-row nodes).

**Queue rendering.** `<QueueVisualization steps={steps} />` (line 579) — separate component sibling of `TreeDiagram`. Reads `snapshot.queueItems[]` (line 126). Per-item `highlight: "new" | "active" | "visited" | "none"` (typed in types.ts:42). Positioned absolutely *over* the tree diagram at `bottom: 110` (line 583). Treats queue as a first-class data-structure overlay distinct from the tree itself.

**Output strip.** `snapshot.outputValues: number[]` and `snapshot.outputLabel: string` (lines 95–96, types.ts:45) — accumulating result strip rendered by the diagram layer. Grows from `[]` → `[1, 2, 4, 8]` across steps. This is the right pattern for any algorithm with a list/array result.

**Captions.** Same `→` glyph style as BST: `"i = 0 → poll node 1"` (line 153), `"i == 0 → print 1"` (line 167). Loop-variable references (`i == 0`, `levelSize = 2`) bind narration to code structure. `"Row 1 — levelSize = 1"` uses em-dash to label rows.

**Position map.** Two maps: `reel-anim` and ternary between `reel` and YouTube (line 458). 8 nodes laid out in 4 rows. Fractional coords with the leaf `n8` at `y: 0.58–0.67`. No formula — hand-tuned.

**`ringNodeIds`.** `ringNodeIds={["n1", "n2", "n4", "n8"]}` (line 577) — TreeDiagram-level prop highlighting the *answer set* with a permanent dashed ring (see CLAUDE.md "Dashed ring" row). Lets the viewer track the result-so-far without re-coloring nodes. **Important pattern for "show progress accumulating" scenes.**

**Transition style.** Default `"none"`. No phase banners. BFS visualization doesn't need topology resets, so no transition needed.

---

## Cross-scene synthesis

### Universal patterns (every scene)

1. **`steps: SceneStep[]` at module scope** with `startFrame`, `highlightLines: {startLine, endLine}`, `snapshot: ListSnapshot`. Optional `visibleLines: N` for progressive code reveal (BST, LeftView only).
2. **Step 0 = intro/hook**, last step = CTA or completion. Phase comments (e.g. `// ─── Phase 3: ITERATION 1 ─────`) divide steps into logical groups even when no UI marker exists.
3. **`highlightLines` is multi-line for context, single-line for execution.** Sequence `{0, N}` → `{specific line}` → … → `{0, N}` (re-summary at end).
4. **Pointer colors are module-level constants**, not inline hex. Convention: SCREAMING_SNAKE_CASE (`HEAD_COLOR`, `PREV_COLOR`, `CURR_COLOR`, `NEXT_COLOR`).
5. **Three-format render**: `youtube` (`SplitLayout`, `leftWidth` 54–62%), `reel` (`StackedLayout` + `REEL_SAFE` + `REEL_TOP_RATIO`), `reel-anim` (`AnimationOnlyLayout`, `nodeScale ≈ 1.4`, no code panel). `compressStepsForAnim()` strips narration padding for anim. Traverse.tsx is the exception — pre-multi-format and should not be the template.
6. **Layer mount order** (post-Traverse scenes): `AmbientLayer animOnly={isAnim}` → `SfxLayer steps={...} duckVolume={0.45-0.5} animOnly={isAnim}` → `NarrationLayer sceneId="..." steps={...}` gated by `!isAnim`.
7. **`sceneId` is kebab-case** matching `public/narration/<sceneId>/`: `"insert-head"`, `"reverse"`, `"bst-insert"`, `"left-view"`.
8. **Reel safe area baseline**: `{ top: 150, bottom: 380, left: 60–90, right: 130–160 }`. Margins vary slightly per scene; top/bottom are stable.

### Operation-specific patterns

| Operation | Tell-tale snapshot fields | Highlight palette | Phase structure |
|---|---|---|---|
| **Traversal** (Traverse, LeftView) | One pointer or queue. `arrows` never mutated. Accumulating `outputValues[]` or marked-visited nodes. | `active` (current), `found` (printed), `visited` (skipped). | Linear: setup → loop body × N → exit. No phases. |
| **Mutation** (InsertHead, BSTInsert) | `newNode` field (linked list) or `includeN35` factory flag (tree). Pointer/arrow set changes mid-step. | `new` (candidate), `active` (cursor), `found` (committed), `error` (wrong-way demo). | Phased: CONTEXT → PROBLEM → WRONG WAY (optional) → CORRECT → EDGE CASE → RECAP. |
| **Algorithm** (Reverse) | Multiple co-existing pointers (`prev/curr/next`) with distinct colors. Per-node algorithm flags (`reversed: true`). Sentinel target IDs (`"__null__"`). | `active` (cursor), `found` (final), implicit "rest" via dim. | Iteration-segmented: SETUP → ITER 1/2/3 → FINAL → COMPLEXITY. Each iteration has consistent sub-step rhythm. |

### Linked-list vs tree

**Linked list (Traverse, InsertHead, Reverse).** Uses `LinkedListDiagram` — laid out left-to-right automatically, no `positionMap` needed. Arrows are sequential `from → to` along the list. `hideEndNull?: boolean` suppresses the trailing-null sentinel when an explicit `__null__` arrow exists. Pointer `targetNodeId: null` renders as a "floating" pointer (Reverse uses heavily). No `visibleLines` progressive reveal in linked-list scenes — code is short enough to show in full.

**Tree (BSTInsert, LeftView).** Uses `TreeDiagram` requiring an explicit `positionMap: Record<string, {x, y}>` per format. Edges are highlighted by string key `"from-to"` (BST) or via `highlight: true` per `ArrowData` (LeftView via `buildEdges`). Trees use **snapshot factory functions** (`makeBSTNodes`, `buildNodes`) because the same node set repeats across many steps with different highlight permutations. `visibleLines` always set (progressive code reveal). Trees pull in `useStepTransition` directly in the scene component (`{ current, localFrame, stepIndex, t }`) for inline animation work (banner, complexity card). `ComplexityCard` is duplicated inline between BST and LeftView (lines 408 and 486 respectively — see anti-patterns).

### Anti-patterns / technical-debt smells

1. **`ComplexityCard` is duplicated**, byte-identical, between `BSTInsert.tsx:408–481` and `LeftViewTraversal.tsx:486–541`. Should live in `src/components/ComplexityCard.tsx`. Same positioning logic copy-pasted (lines 608–624 vs 626–632).
2. **`Traverse.tsx` is on the legacy template** — no `AmbientLayer`, no `NarrationLayer`, no format switch, hand-tuned 40-frame deltas. Either upgrade or mark explicitly as "demo only".
3. **`secondaryCaption` in LeftView step 0 (line 93) is not in `ListSnapshot` type** (types.ts:34–47). TypeScript should reject this; if it doesn't, the type allows index signature loosely or `secondaryCaption` is silently dropped. Flag for type-system hardening.
4. **`"pinned"` is declared in `NodeHighlight`** (types.ts:3) but never used in any audited scene. The CLAUDE.md visual reference explicitly says to avoid it. Candidate for type removal.
5. **`NodeHighlight` color collapse**: per CLAUDE.md, only `"found"` is visually distinct (green); `"active"`, `"new"`, `"removing"`, `"error"`, `"visited"` all render the same blue with only opacity / spotlight differences. Scenes use the semantic names (good for code clarity) but mistakenly believe they produce visual differentiation. InsertHead's `"error"` for the wrong-way demo (line 102) is *only* distinguished because `arrows: []` simultaneously empties — the red color in CLAUDE.md's table doesn't actually render. Flag for either fixing `TreeNodeCircle`'s `highlightColorMap` or correcting documentation.
6. **`startFrame` values are not derivable** — they're either hand-tuned (Traverse) or copied from `durations.json` after running narration generation. No script regenerates these. Drift between narration and `startFrame[]` is a silent failure mode. A `verify-startframes.mjs` would prevent this.
7. **Reel layout magic numbers diverge**: `REEL_SAFE.left` is `30` (Reverse), `60` (InsertHead), `90` (tree scenes). `REEL_TOP_RATIO` is `0.45` (Reverse), `0.52` (LeftView), `0.55` (default Stacked), `0.60` (BST). Not driven by any rule — purely empirical. Worth documenting which values map to which line counts / node counts.
8. **InsertHead has no `caption` field on any step**; BST and LeftView caption every step. Both styles work, but the project should pick one — captions are either *redundant with narration* (InsertHead view) or *visual anchors when narration is muted* (BST/LeftView view). Mixing implies the convention isn't settled.
9. **`PHASE_MARKERS` (BST) is hardcoded by `stepIndex`** (line 326) — fragile if steps reorder. Better as a field on `SceneStep` (`phaseStart?: {label, title}`) so step manipulation is local.
10. **Tree scenes import `useStepTransition` directly** (BST line 5, LeftView line 5) just to drive a complexity card / banner. The diagram component already calls it internally. This is a real coupling smell — overlays that depend on step state should be components that subscribe to step state, not props piped down through the scene.

### Quick template prescription for new scenes

- Mutation/algorithm scene → copy `Reverse.tsx` shell (multi-pointer aware, full reel/anim/youtube switch).
- Tree scene → copy `BSTInsert.tsx` shell, lift `ComplexityCard` from there, keep `makeNodes`/`makeEdges` factory pattern, use `PHASE_MARKERS` only if topology resets.
- Traversal-with-output scene → copy `LeftViewTraversal.tsx` shell, use `outputValues[]` + `ringNodeIds` + `QueueVisualization` if applicable.
- Never copy `Traverse.tsx` as a template.
