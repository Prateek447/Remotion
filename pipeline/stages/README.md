# Stages

Per-stage tooling for the 4-stage pipeline (see `../README.md`). The orchestrator at `../run.sh` drives these in sequence; you can also invoke each stage directly.

## Pipeline isolation

**Anything required to execute the pipeline lives in `pipeline/`.** External scripts in `scripts/` are ad-hoc tools for non-pipeline scenes; the pipeline does not invoke them. The pipeline could survive their deletion.

The only external invocation is `npx remotion render` — a system command provided by the npm-installed Remotion CLI, not a project-owned script.

## Stage tooling

| Pipeline stage | Folder | Script | Status |
|---|---|---|---|
| 1. AUTHOR (conversational) | — | Claude + design-system docs | Manual |
| 2a. Validate | `01-validate/` | `validate.py` | ✅ |
| 2b. Scaffold | `02-scaffold/` | `scaffold.py` + Jinja templates | ✅ |
| 2c. Narration preview | `03-narration/` | `preview.py` | ✅ |
| 2d. Render preview | — | `npx remotion render` | ✅ |
| 2e. Visual review | — | template at `../design-system/review-templates/visual.md` | ✅ |
| 3a. Audio generate | `05-audio/` | `generate.py` | ✅ |
| 3b. Audio review | — | template at `../design-system/review-templates/audio.md` | ✅ |
| 3c. Apply timings | `06-apply/` | `apply.py` (pipeline-native, replaces legacy `scripts/apply-narration-updates.py` for pipeline scenes) | ✅ |
| 4. Final render | — | `npx remotion render` | ✅ |

## Invoking stages

Through the orchestrator (recommended):
```
bash ../run.sh <scene.yaml> [stage]
```

Directly:
```
python3 01-validate/validate.py    <scene.yaml>
python3 02-scaffold/scaffold.py    <scene.yaml>
python3 03-narration/preview.py    <scene.yaml>
python3 05-audio/generate.py       <scene.yaml> [--force] [--step N] [--reference WAV]
python3 06-apply/apply.py          <scene.yaml> [--dry-run]
```

See `../RUNBOOK.md` for the full end-to-end command sequence.

## Why 06 and not 04

The folder numbering (`01`, `02`, `03`, `05`, `06`) tracks the original 7-stage logical model from early pipeline design (1=Script, 2=Visuals, 3=Narration, 4=TTS-optimize, 5=Voiceover, 6=Apply, 7=Render). The 4-stage user-facing model (`1 AUTHOR / 2 VISUAL / 3 AUDIO+APPLY / 4 RENDER`) groups several of those into review-gated stages. The folder numbers haven't been renumbered to avoid breaking memory references; treat them as opaque identifiers.
