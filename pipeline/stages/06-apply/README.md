# Stage 3c — Apply timings (pipeline-native)

`apply.py` reconciles real audio durations from `public/narration/<sceneId>/durations.json` into the scene `.tsx` and `src/data/narration-scripts.ts`.

This is the **last action of stage 3**, run after the audio has been approved through the review gate at stage 3b.

## Pipeline isolation

The legacy `scripts/apply-narration-updates.py` does effectively the same job for non-pipeline scenes via a hardcoded `SCENES` dict. The pipeline-native version here does NOT depend on that script — it reads `scene.yaml` directly and derives all identifiers from `sceneId`.

The legacy script remains in place as an ad-hoc tool for scenes that weren't authored through the pipeline. The pipeline doesn't need it. Both can co-exist; they patch the same files but from different sources.

## What it patches

For sceneId `<sid>` (e.g. `count-tree-nodes`):

1. `src/scenes/<TitleCase>.tsx`
   - Every `startFrame: N` rewritten in order using cumulative `frames + 10-frame buffer` from `durations.json`
   - The `<UPPER_SNAKE>_SCENE_FRAMES` constant updated to the new total

2. `src/data/narration-scripts.ts`
   - The `<camelCase>Durations: NarrationDuration[]` array replaced (or inserted before the `narrationDurationsByScene` map if not present)
   - The `narrationDurationsByScene` map has its `"<sid>": <var>` entry inserted if missing

## Identifier derivation

```
sceneId           = scene.yaml "sceneId" field (e.g. "count-tree-nodes")
componentName     = PascalCase(sceneId)             (e.g. "CountTreeNodes")
tsxPath           = src/scenes/<componentName>.tsx
sceneConstName    = UPPER_SNAKE(sceneId) + "_SCENE_FRAMES"
durationsVarName  = camelCase(sceneId) + "Durations"
```

Override any of `componentName`, `sceneConstName`, `durationsVarName` via top-level fields in `scene.yaml` if the convention doesn't match (e.g. legacy `BSTInsert` for `bst-insert`).

## Usage

```bash
# Preview (writes nothing)
python3 pipeline/stages/06-apply/apply.py pipeline/scenes/<sid>.yaml --dry-run

# Apply for real
python3 pipeline/stages/06-apply/apply.py pipeline/scenes/<sid>.yaml
```

Or through the orchestrator:

```bash
bash pipeline/run.sh pipeline/scenes/<sid>.yaml apply
```

## When to run

After stage 3a (audio gen) and stage 3b (audio review + fix loop) — once the user has signed off on the audio. Running before audio is final means the next audio iteration overwrites `durations.json`, forcing apply to re-run.

## Failure modes

| Error | Meaning | Fix |
|---|---|---|
| `durations.json missing` | Stage 3a hasn't been run for this scene | `bash pipeline/run.sh <yaml> audio` |
| `<tsx> not found` | Stage 2b hasn't been run, or the file was deleted | `bash pipeline/run.sh <yaml> scaffold` |
| `step-count mismatch` | scene.tsx step count differs from durations.json | scene was edited after audio gen, or audio gen failed midway; regenerate audio (`--force`) or fix scene step count |
| `could not locate '<CONST>_SCENE_FRAMES = N'` | Scaffolder didn't emit the constant, or it has a non-standard name | Set `sceneConstName` in scene.yaml to override |
| `could not locate narrationDurationsByScene` | `src/data/narration-scripts.ts` is missing the map | Check that file exists with the expected structure |
