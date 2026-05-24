# Design System Overview

This folder is the canonical reference for how videos are built in this project. Load slices of it into context when generating a new video; don't re-derive these decisions per topic.

## Philosophy

**One document describes a scene, everything else derives from it.** A scene-author writes (or generates) a `scene.yaml` conforming to `scene-schema.yaml`. From that single document:

- Stage 2 (Visuals) emits the `.tsx` scene file.
- Stage 3 (Narration) draws narration text per step in the chosen voice.
- Stage 4 (TTS Optimize) maps `(persona, arc)` → knob values using the two-axis model.
- Stage 5 (Voiceover) generates audio clips.
- Stage 6 (Apply) reconciles audio durations to frame offsets.
- Stage 7 (Render) emits the final MP4 plus thumbnail and metadata.

Every stage reads from the same schema. There is no separate "narration script", no separate "presets list", no separate "step list in the `.tsx` file" — those are all *derivations* of the scene document.

## The four kinds of docs in this folder

1. **The schema** (`scene-schema.yaml`) — the contract. The only file that's load-bearing for tooling. Everything else exists to explain how to populate it.
2. **The patterns** (`patterns/*.md`) — codebase-observable rules per data structure. "How do linked-list scenes work in *this* codebase?" Answers come from auditing existing scenes, not from generic best practices.
3. **The reference** (`components.md`, `theme.md`) — what components exist, what props they take, what colors/springs are available. Lookup material when going off-pattern.
4. **The voice** (`voice/*.md`) — how the narration sounds. Two-axis model + per-persona spec.

## Navigation

| If you're trying to… | Load |
|---|---|
| Write a brand-new video on topic X | `approaches.md` + `scene-schema.yaml` + `teaching.md` + `patterns/<data-structure>.md` + `voice/two-axis-model.md` + `voice/personas/<persona>.md` |
| Pick the presentation approach for a topic | `approaches.md` (discovery methodology + reference archetypes) |
| Ensure beginner clarity / step density | `teaching.md` |
| Review a rendered video or audio | `review-templates/visual.md` or `review-templates/audio.md` |
| Apply review feedback systematically | Copy the template to `../review/<sid>-*.md`, fill in, ask Claude |
| Understand why a scene looks the way it does | `patterns/<data-structure>.md` + `../scene-catalog/audited-scenes.md` |
| Figure out which component to use | `components.md` |
| Pick a color or spring | `theme.md` |
| Decide voice direction | `voice/two-axis-model.md`, then the matching persona file |
| Validate a scene before generation | `scene-schema.yaml` (the contract) |

## Schema → derivation map

Each schema field maps to one or more downstream artifacts:

| Schema field | Drives |
|---|---|
| `sceneId` | Folder name `public/narration/<sceneId>/`; `.tsx` file name; `Root.tsx` composition IDs |
| `dataStructure` | Which `patterns/*.md` to load; which diagram component (`LinkedListDiagram` / `TreeDiagram`) |
| `operationKind` | Phase taxonomy (mutation = 7 phases, algorithm = iteration-segmented, traversal = linear) |
| `voice.persona` | Reference clip selection; baseline knob values |
| `code.source` | The string in `src/data/code-snippets.ts`; the code block rendered in the scene |
| `steps[].arc` | Per-step `(exaggeration, cfg_weight, temperature)` lookup |
| `steps[].narration` | Audio generation input (after TTS-readiness cleanup) |
| `steps[].snapshot` | The per-step `ListSnapshot` / tree snapshot passed to the diagram |
| `steps[].highlight` | `highlightLines: { startLine, endLine }` in the `.tsx` |
| `steps[].targetFrames` | Visual budget; informs apply-narration-updates stretching logic |
| `outputs.formats` | Which compositions to render in `Root.tsx` (Video-X, Reel-X, or both) |
| `publish.*` | Stage 7 thumbnail, description, hashtags |

## Authoring contracts

These rules govern what a valid scene document looks like. Tooling should enforce them.

### Required fields
Every scene must specify: `sceneId`, `title`, `dataStructure`, `operationKind`, **`approach`, `approachNotes`**, `voice.persona`, `code.language`, `code.source`, `steps[]`, `outputs.formats`.

`approach` is a kebab-case identifier picked from the 4 options Claude presents in stage 1b (community-sourced, with `algorithm-walkthrough` always available). `approachNotes` documents the community sources surveyed and the rationale for the chosen archetype. See `approaches.md`.

### Step rules
- At least one step has `arc: opening`. Exactly one.
- At least one step has `arc: closing`. Exactly one.
- At most one step has `arc: peak`.
- All remaining steps have `arc: methodical`.
- Step 0 must be `arc: opening`.
- The last step must be `arc: closing`.
- `stepIndex` is contiguous starting at 0.
- `targetFrames` ≥ 40 (the minimum per `script-writer` legacy skill — viewer absorption floor).
- **Step COUNT meets the density heuristic in `teaching.md`.** Recursive algorithms need a step per recursive frame, not 6 steps for a 7-node tree. See `teaching.md` for the formula per algorithm class. Failing this rule produces review-tier scripts that beginners can't follow regardless of how polished the visuals are.

### Caption rules
- `caption` ≤ 40 characters (readable at video scale).
- Tense: declarative imperative (`"Print 3"`, `"newNode.next → head"`) or short noun phrases (`"Starting list: 3 → 7 → 9"`).
- Never duplicate `narration` verbatim.

### Narration rules
- All numbers spelled as words.
- All code references spoken (`"head dot next"`, `"O of n"`).
- No `[bracket tags]` (base Chatterbox reads them as literal English).
- ≤12 words per breath group (em-dashes count as breath boundaries).
- Present tense.

### Highlight rules
- `startLine ≤ endLine`.
- Both within `[0, codeLineCount - 1]`.
- Multi-line ranges for context/setup/recap; single-line for execution.

## Pipeline handoffs (machine-readable contract)

Each stage transition has a defined input and output. A pipeline runner could enforce these:

```
Stage 1 (Script)
  in:  topic name (+ optional code)
  out: scene.yaml validated against scene-schema.yaml

Stage 2 (Visuals)
  in:  scene.yaml
  out: src/scenes/<Name>.tsx + standalone/<Name>.tsx + Root.tsx registrations
       (compiles, type-checks)

Stage 3 (Narration)
  in:  scene.yaml (steps[].narration already drafted by stage 1)
  out: scene.yaml with narration normalized to chosen persona's phrasing

Stage 4 (TTS Optimize)
  in:  scene.yaml
  out: TTS-clean narration + computed *_presets list per (persona, arc)

Stage 5 (Voiceover)
  in:  *_lines + *_presets + reference audio
  out: public/narration/<sceneId>/step-N.mp3 for all N

Stage 6 (Apply)
  in:  durations.json for the scene
  out: patched .tsx (startFrame, *_SCENE_FRAMES) + patched narration-scripts.ts
       (handled by scripts/apply-narration-updates.py)

Stage 7 (Render)
  in:  composition ID
  out: out/<Name>.mp4 + thumbnail + description.txt
```

## How to evolve this design system

**Adding a new data structure (e.g. graphs, hash tables):**
1. Build the first scene by hand, using existing patterns as inspiration.
2. Audit 2–3 scenes once they exist.
3. Distill into `patterns/<new-structure>.md`.
4. Update `scene-schema.yaml` if new fields are needed.

**Adding a new voice persona:**
1. Define knob values per arc (4 rows × 3 columns).
2. Add to `voice/two-axis-model.md`'s combined preset table.
3. Write `voice/personas/<new-persona>.md` with phrasing patterns, anti-patterns, worked example.
4. Optionally provide a reference audio clip.

**Adding a new arc position:**
Don't. The four positions (opening/methodical/peak/closing) cover the narrative arc cleanly. If you find yourself wanting a 5th, the scene is probably too long — split it.

**Adding a new component:**
1. Build the component.
2. Use it in 1–2 scenes.
3. Document in `components.md` only after it has at least one real usage.

**Updating patterns when scenes diverge:**
If a new scene diverges from the documented pattern in a way that's intentional, update the pattern doc rather than letting tribal exceptions accumulate. The patterns are descriptive, not prescriptive — they should match what good scenes actually look like.

## Status

| Doc | Status |
|---|---|
| `scene-schema.yaml` | Draft (v0.2) — adds `approach` + `approachNotes` required fields |
| `overview.md` | This file |
| `approaches.md` | Complete — community-sourced approach discovery + 9 reference archetypes |
| `teaching.md` | Complete — pedagogy doctrine, beginner-clarity rules, step-count heuristics |
| `review-templates/{visual,audio}.md` | Complete — feedback templates for stage 2e and 3b review gates |
| `patterns/linked-list.md` | Complete (audited from 3 scenes) |
| `patterns/tree.md` | Complete (audited from 2 scenes; recursion narration pattern added) |
| `components.md` | Complete (audited from 23 components) |
| `theme.md` | Complete (colors, springs, types) |
| `../stages/01-validate/validate.py` | Schema validator |
| `../stages/02-scaffold/scaffold.py` | TSX scaffolder (4 supported combos) |
| `../stages/03-narration/preview.py` | TTS-readiness lint + preset preview |
| `../stages/05-audio/generate.py` | Pipeline-native audio generator (isolated from `scripts/`) |
| `../run.sh` | Orchestrator |
| `../RUNBOOK.md` | End-to-end execution recipe |
| `voice/two-axis-model.md` | Complete |
| `voice/personas/teacher-energetic.md` | Complete |
| `voice/personas/measured.md` | Complete |
| `voice/personas/casual.md` | Planned, not written |

## Open issues surfaced by the audits

These are cross-cutting findings from the scene and component audits. The full lists are in `../scene-catalog/audited-scenes.md` (scenes) and `components.md` / `theme.md` (components and types).

### Severity: landmines (would cause silent or loud failure)

1. **`springPresets.bouncy` is undefined** in `theme.ts` but referenced by `TreeNodeCircle`, `QueueVisualization`, `CodeOnlyLayout`, and `scenes/BoundaryTraversal.tsx`. Remotion silently falls back to its default spring config. Adding a `bouncy` preset later would change all four call sites' animations without anyone realizing. Fix: either add the preset explicitly, or replace the references with an existing preset.
2. **`"pinned"` would crash on tree nodes**. It's in `NodeHighlight` (types.ts:3) but `TreeNodeCircle.highlightColorMap` has no entry for it, so a tree node assigned `highlight: "pinned"` would crash the palette lookup. CLAUDE.md already warns against it; consider removing from the type.
3. **`"visited"` is in runtime but not in the type**. Both `NodeBox` and `TreeNodeCircle` check `highlight === "visited"`, but it's missing from the `NodeHighlight` union in `types.ts`. Scenes like `LeftViewTraversal.tsx` use it anyway. Add it to the type.
4. **`ListSnapshot` is a lower-bound** — components read fields not declared on the type: `searchTarget`, `complexityFormula`, `complexityDerivation`, `simplifyAtFrame`, `arrowLabel`, `arrowAnchorLine`, plus `secondaryCaption` used in `LeftViewTraversal.tsx:93`. TypeScript's structural typing tolerates this but the type is no longer load-bearing for correctness.

### Severity: drift (works today, will surprise someone tomorrow)

5. **`NodeHighlight` color collapse** — only `"found"` renders uniquely (green). `active`, `new`, `removing`, `error`, `visited` all render as the same blue with only opacity/spotlight differences. Scenes are written as if they were visually distinct.
6. **Theme alias drift** — `colors.nodeActive/Found/Removing/Error/New`, `colors.codeBg`, `colors.highlightBar` are defined but components hard-code the same hex values inline. Refactoring the theme alone won't change rendered visuals.
7. **`keepExplainedBright`** prop is passed to `CodeBlock` from `CodeOnlyLayout` but isn't in `CodeBlock`'s props interface. Silent dead prop.

### Severity: tech debt (intentional or near-intentional, worth cleaning up)

8. **`ComplexityCard` is duplicated** byte-identical between `BSTInsert.tsx:408` and `LeftViewTraversal.tsx:486`. Lift to `src/components/ComplexityCard.tsx` — separately, as a codebase refactor task (not pipeline scope).
9. **`Traverse.tsx` is on the legacy template** (no `AmbientLayer`, `NarrationLayer`, no format switch). Upgrade or mark "demo only".
10. **Reel safe-area magic numbers** vary per scene (`left: 30 / 60 / 90`, `topRatio: 0.45–0.60`) without a documented rule. Worth a deterministic mapping driven by pointer count and code line count.

The pipeline can be built against the current codebase. These issues are noted so a future hardening pass has a punch list.
