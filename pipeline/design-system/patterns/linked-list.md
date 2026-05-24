# Linked-List Patterns

Distilled from `Traverse.tsx`, `InsertHead.tsx`, `Reverse.tsx`. Use these when authoring any linked-list scene.

**Reference template**: `Reverse.tsx` for multi-pointer/algorithm scenes; `InsertHead.tsx` for mutation; **do not copy `Traverse.tsx`** — it predates the standalone/reel/narration pipeline.

## Layout & rendering

- Use `LinkedListDiagram` — handles left-to-right layout automatically. No position map needed.
- Three-format render switch on `format` prop:
  - `youtube` → `SplitLayout` (62% diagram, 38% code), `nodeScale: 1`, `codeFontSize: 24`
  - `reel` → `StackedLayout`, `nodeScale: 1.2` (single-pointer) or `0.9` (multi-pointer), `codeFontSize: 30`
  - `reel-anim` → `AnimationOnlyLayout`, `nodeScale: 1.4`, no code panel
- `compressStepsForAnim(steps)` strips narration padding for the anim variant.
- Reel safe area: `{ top: 150, bottom: 380, left: 30–60, right: 30–160 }`. Use `left: 30` for multi-pointer scenes (Reverse), `60` for single-pointer (InsertHead).
- Layer mount order (all post-Traverse scenes): `AmbientLayer animOnly={isAnim}` → `SfxLayer steps={...} duckVolume={0.45-0.5} animOnly={isAnim}` → `NarrationLayer sceneId="..." steps={...}` gated by `!isAnim`.

## Pointer conventions

- **Pointer colors are module-level constants**, SCREAMING_SNAKE_CASE, never inline hex:
  ```ts
  const HEAD_COLOR = "#1565C0";
  const NEWNODE_COLOR = "#7B1FA2";
  const PREV_COLOR = "#E87B35";
  const CURR_COLOR = "#8B5CF6";
  const NEXT_COLOR = "#2563EB";
  ```
- Single-pointer scenes use one constant (often `colors.peach` or a custom blue).
- Multi-pointer scenes (Reverse) use three distinct colors — one per pointer.
- `targetNodeId: null` on a pointer renders it as a floating labeled badge with no destination. Used heavily in `Reverse.tsx` when `prev` starts off-list.

## Snapshot anatomy by operation type

### Traversal (read-only walk)
- Constant `nodes` array across steps; only `highlight` field rotates.
- `arrows` never mutated.
- Single pointer follows the cursor via `targetNodeId`.
- Caption alternates *narrative* (`"Traverse linked list"`) with *action* (`"Print 3"`, `"curr = curr.next"`).

### Mutation (insert / delete)
- `newNode` field holds the insertion candidate before it joins the main list.
- Once attached, the new node moves into the `nodes` array; `newNode` is dropped.
- **Dashed-highlighted intent arrow** marks the link before it commits:
  ```ts
  arrows: [{ from: "n1", to: "n3", dashed: true, highlight: true }, ...]
  ```
- "Wrong way" demonstration empties `arrows: []` and sets all old nodes to `highlight: "error"` to visualize unreachability.
- Recovery step repeats an earlier snapshot to signal "rewind to good state."

### Algorithm (in-place multi-pointer)
- Three module-level pointer color constants.
- **"Pointer materialize, then translate"** idiom: a new pointer appears co-located with an existing one for one step, then slides to its target the next step. This is the canonical way to show pointer assignment.
- Algorithm-specific flags on nodes: `reversed: true` (LinkedListDiagram renders flipped chevrons).
- Sentinel target IDs (`"__null__"`) render an explicit null node — used when an explicit terminator improves clarity.
- `hideEndNull: true` suppresses the trailing-null sentinel when an explicit `__null__` arrow exists (otherwise you'd see two nulls).
- Captions are absent — narration carries the semantics in algorithm scenes.

## Code highlight conventions

- **Multi-line range** for context/setup/recap: `{0, N}` covering the whole function.
- **Single-line range** for execution steps: `{2, 2}`.
- **Two-line range** when one logical step spans two statements: `{6, 7}` (e.g. advance `prev` and `curr` in Reverse).
- Re-highlighting an unchanged range across iterations = "we're on this line again, new iteration."
- Highlight resets to `{0, 0}` on "rewind to good state" steps.

## Phase structure by operation

### Mutation (canonical phase taxonomy)
`Insert*` and `Delete*` scenes follow this 7-phase shape, marked by comment dividers:
```
CONTEXT      → State the operation, show starting list
PROBLEM      → "We need to add value X at the head"
WRONG WAY    → Demonstrate the failure mode (empty arrows, error highlight)
CORRECT      → Step-by-step pointer wiring with dashed intent arrows
WHY O(1)     → Zoom into why this is constant time
EDGE CASE    → Empty list, single-node list, etc.
RECAP + CTA  → Final state with all nodes marked "found"
```

### Algorithm (iteration-segmented)
`Reverse`, `MergeLists`, `DetectCycle` follow:
```
INTRO     → State the goal
CONCEPT   → Show the invariant or trick (one pointer per state)
SETUP     → Initialize pointers (one step per pointer materializing)
ITER 1    → 4 sub-steps: next materialize → next translate → flip → advance
ITER 2    → Same 4 sub-steps (next, slide, flip, advance)
ITER N    → ...
FINAL     → Show the result state
COMPLEXITY → ComplexityCard with time/space
CTA       → Closing
```

### Traversal (linear)
`Traverse` and other read-only walks:
```
Setup → Loop body × N (each loop = 1-2 steps) → Exit → Done
```
No phases needed.

## Highlight semantics for linked lists

Use these values consistently:

| Highlight | When |
|---|---|
| `none` | Idle / not yet visited |
| `active` | Current cursor / processing target |
| `new` | Newly created node before linking |
| `found` | Confirmed / committed result (e.g. inserted, located) |
| `removing` | About to be unlinked |
| `error` | "Wrong way" demonstration (semantic only — see anti-patterns) |
| `visited` | Walked past, no longer relevant |

**Visual rendering caveat**: only `"found"` renders uniquely (green). `active`, `new`, `removing`, `error`, `visited` all render as the same blue with only opacity/spotlight differences. Use the semantic names for code clarity, but **don't expect color differentiation** between them. To show multiple states, lean on:
- Spotlight dimming (other nodes drop to 0.28 opacity)
- Dashed rings (`showRing: true`)
- Pointer color differences
- Arrow color/dash patterns

## Animation idioms

| Idiom | When to use | How |
|---|---|---|
| Pointer materialize, then translate | Showing a pointer assignment in an algorithm | Step N: new pointer appears co-located with source. Step N+1: pointer slides to destination. |
| Dashed intent arrow | Showing a link before it commits | `{ from, to, dashed: true, highlight: true }` |
| Wrong-way reveal | Demonstrating a failure mode in mutation scenes | `arrows: []` + all nodes `highlight: "error"` |
| Rewind to good state | After a wrong-way demo | Snapshot literally identical to a previous step |
| Final glow | Closing/CTA step | Every node `highlight: "found"` |

## Captioning convention

Two valid styles, pick one per scene and stick with it:

1. **Narration-driven (InsertHead style)**: no captions on steps, narration carries everything. Better for muting-resistant content where the visual already shows what's happening.
2. **Caption-anchored (Traverse style)**: short imperative captions every step (`"Print 3"`, `"curr = curr.next"`). Better for tutorial-style scenes where the viewer might scrub.

Don't mix within a scene. Reverse mixes inconsistently — not the model.

## Anti-patterns to avoid

- ❌ Copying `Traverse.tsx` as a template — it has no `AmbientLayer`, no `NarrationLayer`, no format switch.
- ❌ Hand-tuning `startFrame` deltas. They should come from `durations.json` via `apply-narration-updates.py`.
- ❌ Inline hex codes for pointer colors. Always module-level constants.
- ❌ Mixing `error` highlight without simultaneously emptying `arrows` — the red doesn't actually render distinctly.
- ❌ Using `"pinned"` highlight — exists in the type but unused and CLAUDE.md flags it.
- ❌ Leaving narration and `startFrame[]` out of sync. Always run `apply-narration-updates.py` after audio regen.

## Quick reference: copy targets

| Building this | Copy shell from |
|---|---|
| Insert/Delete operation | `src/scenes/InsertHead.tsx` |
| Multi-pointer algorithm (reverse, cycle, merge) | `src/scenes/Reverse.tsx` |
| Read-only traversal | **Build new from `InsertHead.tsx` shell** — don't use `Traverse.tsx` |
