# Stage 2 — Scaffold

Convert a `scene.yaml` (conforming to `pipeline/design-system/scene-schema.yaml`)
into a complete Remotion `src/scenes/<Name>.tsx` file, plus paste snippets for
the four sibling files that need a coordinated registration.

## Usage

```bash
python3 pipeline/stages/02-scaffold/scaffold.py <path/to/scene.yaml>
```

### Common flags

| Flag | Behaviour |
|---|---|
| `--out-dir <dir>` | Where to write the .tsx (default `src/scenes/`). |
| `--dry-run` | Print what would be written; no files touched. |
| `--no-snippets` | Suppress the paste snippets on stdout. |

### Pre-requisites

```bash
pip install pyyaml jinja2
```

Both libraries are available globally via this repo's `.venv`. Jinja2 is
strictly required (templates use control flow); raw Python templating is
attempted as a fallback only for simple substitution-only templates.

## What gets generated

For every successful scaffold the script:

1. **Writes** `<out-dir>/<TitleCase>.tsx` — a complete, type-checking scene
   component matching the template for the (dataStructure, operationKind)
   combination.
2. **Prints to stdout** four paste-ready snippets (unless `--no-snippets`):
   - `src/data/code-snippets.ts` — the code constant addition
   - `src/standalone/index.tsx` — `<Name>Video`, `<Name>Reel`, `<Name>ReelAnim`
     exports (subject to `outputs.formats`)
   - `src/Root.tsx` — import lines, the `<Folder name="Scenes">` registration,
     and the per-format sub-folder under `<Folder name="LinkedList">` /
     `<Folder name="Trees">`
   - `scripts/apply-narration-updates.py` — the entry to add to the `SCENES` dict

The scaffolder **does not modify** any of those four files automatically.
Root.tsx in particular is fragile — surgical paste is safer than regex-based
editing.

## Supported combinations

| dataStructure | operationKind | Template (under `templates/`) | Modelled on |
|---|---|---|---|
| `linked-list` | `mutation`   | `linked-list-mutation.tsx.j2`   | `src/scenes/InsertHead.tsx` |
| `linked-list` | `algorithm`  | `linked-list-algorithm.tsx.j2`  | `src/scenes/Reverse.tsx` |
| `tree`        | `mutation`   | `tree-mutation.tsx.j2`          | `src/scenes/BSTInsert.tsx` |
| `tree`        | `traversal`  | `tree-traversal.tsx.j2`         | `src/scenes/LeftViewTraversal.tsx` |

Any other combination prints a clear "not yet supported" message and exits 1.

## What the templates emit

Every generated scene:

- Imports correctly from `remotion`, `../components/*`, `../lib/*`, `../data/code-snippets`.
- Declares **module-level pointer color constants** (SCREAMING_SNAKE_CASE + `_COLOR`
  suffix) whenever the YAML declares `pointers:` or step pointers carry colours.
  Pointer entries in the steps reference these constants (not the inline hex).
- Declares `export const <SCREAMING_SNAKE>_SCENE_FRAMES = N;` where `N` is
  seeded from `sum(targetFrames) + 10 * stepCount` (matches the buffer used by
  `scripts/apply-narration-updates.py`). The real value is overwritten by that
  script once audio durations exist.
- Builds the `SceneStep[]` literal faithfully — `nodes`, `pointers`, `arrows`,
  `newNode`, `caption`, `complexityInfo`, `queueItems`, `outputValues`, plus the
  rarer fields read by the diagrams (`hideEndNull`, `secondaryCaption`, etc).
- For tree scenes: emits a `makePositionMap(format)` function with three branches
  (`default`, `reel`, `reel-anim`) populated from `positionMaps:` in the YAML.
  Falls back to a centred stub with a TODO if the YAML omits the map.
- Mounts the three-layer audio stack with the right gating:
  `AmbientLayer animOnly={isAnim}` → `SfxLayer steps duckVolume={…} animOnly={isAnim}` →
  `NarrationLayer sceneId="…" steps` gated by `!isAnim`.
- Exposes the `youtube` / `reel` / `reel-anim` format switch with the conventions
  audited per pattern (see `pipeline/design-system/patterns/*.md`).

## Scene-YAML extensions read by this stage

Beyond what's in `scene-schema.yaml`, the scaffolder reads a few optional fields
that don't change downstream stages:

| Field | Purpose | Default |
|---|---|---|
| `identifiers.componentName` | TitleCase override (else derived from `sceneId`) | derived |
| `identifiers.sceneFramesConst` | `*_SCENE_FRAMES` const name override | derived |
| `identifiers.codeConstName` | `*Code` export name override | derived |
| `identifiers.codeWindowTitle` | Filename shown in the code chrome | `BinaryTree.java` / `LinkedList.java` |
| `identifiers.durationsVarName` | `*Durations` var in `narration-scripts.ts` | derived |
| `pointers.<label>.color` | Hoists pointer colour to `<LABEL>_COLOR` constant | scanned from steps if absent |
| `reel.safeArea` | Per-scene `{top, bottom, left, right}` overrides | pattern-derived defaults |
| `reel.topRatio` | Stacked layout top-pane ratio (`null` → use `STACKED_TOP_RATIO`) | pattern-derived |
| `reel.nodeScale` / `reel.animNodeScale` | Diagram scale for reel / reel-anim | pattern-derived |
| `reel.codeFontSize` | Code font size for reel formats | pattern-derived |
| `duckVolume` | `SfxLayer duckVolume` value | 0.5 (LL) / 0.45 (tree) |
| `positionMaps.{default,reel,reel-anim}` | Tree position maps (fractional 0..1) | stub with TODO |
| `ringNodeIds` | `TreeDiagram ringNodeIds` prop (traversal only) | absent |
| `standalone.nextTopic` | "Up next" overlay on the outro card | absent |
| `complexity.time` / `.space` | Title-card complexity badge | "O(?)" |

Per-step extensions:

| Step field | Purpose |
|---|---|
| `intent` | Short comment placed above the step literal in the .tsx |
| `visibleLines` | Tree scenes only — progressive code reveal |
| `snapshot.secondaryCaption` | Emits the field with an `@ts-expect-error` (read by some scenes) |

## Pointer field naming

The schema uses `points: "n3"` (or `points: null`) on a pointer. This maps to
TypeScript's `targetNodeId` — the scaffolder rewrites the field name when
emitting JSX, so the YAML stays readable.

## Testing & regression fixture

The fixture `test-fixtures/insert-head.yaml` is a hand-built reverse-engineering
of the real `src/scenes/InsertHead.tsx`. Run:

```bash
python3 pipeline/stages/02-scaffold/scaffold.py \
  pipeline/stages/02-scaffold/test-fixtures/insert-head.yaml \
  --out-dir pipeline/stages/02-scaffold/test-fixtures/expected \
  --no-snippets

diff src/scenes/InsertHead.tsx \
     pipeline/stages/02-scaffold/test-fixtures/expected/InsertHead.tsx
```

Differences are expected to be **cosmetic only**:
- Single-element arrays render multi-line in the scaffolder vs inline in the
  hand-written original.
- The scaffolder emits one `intent` comment per step (from YAML) rather than
  the original's phase headers.

The structural content matches: same imports, same module-level constants,
same step shape, same `*_SCENE_FRAMES` number (2756), same layout switch, same
sceneId.

Three other smoke-test fixtures exercise the remaining combos:

- `test-fixtures/reverse-mini.yaml` → linked-list / algorithm
- `test-fixtures/bst-mini.yaml`     → tree / mutation
- `test-fixtures/left-view-mini.yaml` → tree / traversal

## Caveats & known limitations

- **Tree positions are hand-tuned**, not auto-computed. The scaffolder won't
  guess geometry — if `positionMaps:` is missing, you get a stub at
  `{x: 0.5, y: 0.5}` for every node and a TODO. Fill it in.
- **Algorithm scenes** that use sentinel target IDs (`"__null__"`) work — pass
  them in `arrows[].to` and they round-trip through to the .tsx.
- **No automatic CodeMagicMove dual-code support.** Scenes like
  `RemoveNthFromEnd` that morph between two code variants are out of scope —
  they use the `DualTokenProps` signature and a separate composition flow.
- **No automatic Banner support** for tree mutation phase resets (BSTInsert's
  `CaseBanner`). If your scene needs banners, generate the file and hand-add
  the `PHASE_MARKERS` block + `CaseBanner` component after.
- **TypeScript caveats are pre-existing**: scenes that use `highlight: "visited"`
  on linked-list nodes hit the same `NodeHighlight` union gap as the real
  LeftViewTraversal does (see design-system audit, severity "landmines").
- **Comments differ**: the scaffolder uses `step.intent` from the YAML to
  generate above-step comments. The originals have hand-written phase headers
  with `─── Phase N ───` separators.
