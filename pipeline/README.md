# Video Generation Pipeline

This folder houses the design system, schemas, and tooling for the **topic → published video** pipeline. It is intentionally isolated from `.cursor/skills/` so the pipeline subsystem evolves on its own track.

## The Pipeline (4 stages, 2 review gates)

```
Stage 1  AUTHOR           (Claude researches approaches → asks user → writes scene.yaml)
Stage 2  VISUAL           validate → scaffold → preview → REVIEW-VISUAL → fix loop
Stage 3  AUDIO+ASSEMBLY   generate → REVIEW-AUDIO → fix loop → apply timings
Stage 4  FINAL RENDER     render with audio (only this)
```

Review gates at **2e** and **3b** are where human judgment lives. The "propagate learnings" closing action of each review pushes patterns into the design system so future scenes don't repeat the same issues.

| Stage | Sub-step | Inputs | Outputs | Tooling |
|---|---|---|---|---|
| 1 | 1a Research | Topic name | List of community approaches | `WebSearch` / `WebFetch` (Claude-driven) |
| 1 | 1b Ask approach | Research | 4 options to user (always includes `algorithm-walkthrough`) | `AskUserQuestion` |
| 1 | 1c Write scene.yaml | Approach + research | `pipeline/scenes/<sid>.yaml` | Claude + design system |
| 2 | 2a Validate | scene.yaml | ✅ or violations | `stages/01-validate/validate.py` |
| 2 | 2b Scaffold | scene.yaml | `src/scenes/<Name>.tsx` + paste snippets | `stages/02-scaffold/scaffold.py` |
| 2 | 2c Narration preview | scene.yaml | Lint + per-step preset table | `stages/03-narration/preview.py` |
| 2 | 2d Render preview | scene.yaml + .tsx | Silent `<Name>-preview.mp4` | `npx remotion render` |
| 2 | **2e Review-visual** | Preview file | Feedback file → fixes + propagation | `review/<sid>-visual.md` + Claude |
| 3 | 3a Audio | scene.yaml | `step-*.mp3` + `durations.json` | `stages/05-audio/generate.py` |
| 3 | **3b Review-audio** | Audio files | Feedback file → fixes + propagation | `review/<sid>-audio.md` + Claude |
| 3 | 3c Apply | `durations.json` | Patched `.tsx` + `narration-scripts.ts` | `stages/06-apply/apply.py` (pipeline-native) |
| 4 | 4 Final render | Approved scene | `<Name>.mp4`, `<Name>-Reel.mp4` | `npx remotion render` |

Apply lives in stage 3, not stage 4, so audio iteration never forces a stage transition.

## Folder map

| Path | Purpose |
|---|---|
| `README.md` | This file — pipeline overview & entry point |
| `design-system/scene-schema.yaml` | ⭐ Single source of truth: the canonical scene description from which `.tsx`, narration, and presets all derive |
| `design-system/overview.md` | How the design system pieces fit together |
| `design-system/approaches.md` | ⭐ Stage 1a methodology: community-sourced approach discovery + `algorithm-walkthrough` default |
| `design-system/teaching.md` | ⭐ Pedagogy doctrine — step density, recursion explanation, anti-blaze-through rules |
| `design-system/review-templates/` | Visual + audio review file templates (copied to `review/` per scene) |
| `design-system/patterns/*.md` | Distilled patterns per data structure (linked-list, tree, …) |
| `review/` | User-authored review files (`<sid>-visual.md`, `<sid>-audio.md`) — the feedback artifacts that drive fix loops and design-system propagation |
| `design-system/components.md` | Remotion component library reference |
| `design-system/theme.md` | Colors, springs, layout constants, core types |
| `design-system/voice/two-axis-model.md` | The persona × arc voice framework |
| `design-system/voice/personas/*.md` | Voice persona specs (teacher-energetic, measured, …) |
| `scene-catalog/audited-scenes.md` | Audit notes from existing scenes — the source material from which patterns were distilled |
| `stages/README.md` | Reserved for stage-specific tooling |

## How to use this design system

When generating a new video, load the relevant slices of `design-system/` into context. A typical context bundle:

- Always: `scene-schema.yaml` + `overview.md`
- For the topic's data structure: `patterns/<data-structure>.md`
- For voice direction: `voice/two-axis-model.md` + `voice/personas/<persona>.md`
- For component questions (rare, only when going off-pattern): `components.md`

Each `.md` is sized to be loaded individually. The schema is the contract; everything else is reference material that explains how to populate it.

## Relationship to legacy skills

The skills at `.cursor/skills/script-writer/SKILL.md` and `.cursor/skills/tts-narration-writer/SKILL.md` are the editorial ancestors of this design system. They encoded principles (step pacing, narration phrasing, TTS rules) but didn't capture concrete codebase patterns or provide a machine-readable schema.

This folder supersedes those skills. They will be deprecated once `design-system/` is complete; until then they remain as historical reference.

## Pipeline isolation principle

**Anything required to execute the pipeline lives under `pipeline/`.** The pipeline edits external files (`Root.tsx`, scene `.tsx`s, `narration-scripts.ts`) as integration touches — that's unavoidable — but it does NOT *depend* on external scripts for execution. The pipeline could survive deletion of everything under `scripts/`.

In particular, neither `scripts/apply-narration-updates.py` nor `scripts/generate-narration-chatterbox.py` is invoked by the pipeline:

- Audio generation: `pipeline/stages/05-audio/generate.py` (pipeline-native, reads scene.yaml + applies persona×arc presets directly)
- Apply timings: `pipeline/stages/06-apply/apply.py` (pipeline-native, derives identifiers from scene.yaml — no SCENES dict required)

The legacy scripts remain in `scripts/` as ad-hoc tools for non-pipeline scenes. They can drift independently. The price of this isolation is some duplication (preset matrix, file-patching helpers); the benefit is that pipeline survival is decoupled from changes elsewhere in the repo.

The only external invocation the pipeline makes is `npx remotion render` — a system command provided by Remotion's CLI, not a project-owned script.

## Status

✅ Pipeline complete. End-to-end runnable from `scene.yaml` to `.mp4`.

**Design system**
- [x] Pipeline overview (this file)
- [x] Two-axis voice model + personas (teacher-energetic, measured)
- [x] Scene schema (v0.1)
- [x] Scene audit (5 scenes), component & theme audit (23 components + types)
- [x] Linked-list and tree pattern libraries
- [x] Design-system overview

**Tooling**
- [x] Stage 1: Validator (`stages/01-validate/validate.py`)
- [x] Stage 2: Scaffolder (`stages/02-scaffold/scaffold.py` + Jinja templates)
- [x] Stage 3: Narration preview/lint (`stages/03-narration/preview.py`)
- [x] Stage 5: Audio generator (`stages/05-audio/generate.py` — pipeline-native)
- [x] Orchestrator (`run.sh`)
- [x] Runbook (`RUNBOOK.md`)

**Not yet built (future work)**
- [ ] Stage 1 tooling: topic → scene.yaml generator (manual / Claude-assisted today)
- [ ] Stage 7 add-ons: thumbnail generation, description/metadata, publishing
- [ ] Cross-format pacing adjustment (Reels vs YouTube)
- [ ] Automated knob auto-tune for flat clips
