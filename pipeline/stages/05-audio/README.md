# Stage 5 — Audio (chunked narration)

`generate.py` synthesizes per-step MP3s from the chunked narration sidecar
(`<scene>.narration.yaml`). Each chunk runs through `ChatterboxTTS.generate()`
once with its own `(exaggeration, cfg_weight, temperature)`, and
`torch.zeros` silence is spliced between chunks per `pauseAfter`. The sidecar
is required — there is no fallback to scene-yaml-narration + persona × arc
preset resolution; that path was deprecated.

## Pipeline isolation

This stage does not import from or modify `scripts/generate-narration-chatterbox.py`.
The legacy script remains the editorial ancestor; it is preserved untouched for
non-pipeline scenes. Pipeline-driven scenes use this script exclusively.

## Inputs

- `pipeline/scenes/<sid>.yaml` — for sceneId + step-count cross-check
- `pipeline/scenes/<sid>.narration.yaml` — the authoritative chunked source
  (author via `pipeline/stages/03-narration/scaffold.py` then refine by hand)

## Outputs

- `public/narration/<sid>/step-N.mp3` — one per step, concatenated chunks
- `public/narration/<sid>/durations.json` — consumed by stage 06 apply.py
- `public/narration/<sid>/chunks/step-N-N.M.wav` — per-chunk debug WAVs
  (gated on sidecar `output.perChunkDebug: true`)

## Usage

```bash
# Generate all steps from the sidecar
python3 pipeline/stages/05-audio/generate.py pipeline/scenes/<sid>.yaml

# Overwrite existing MP3s
python3 pipeline/stages/05-audio/generate.py pipeline/scenes/<sid>.yaml --force

# Regenerate one step only (after tuning that step's chunk params)
python3 pipeline/stages/05-audio/generate.py pipeline/scenes/<sid>.yaml --step 24 --force

# Override the reference voice clip
python3 pipeline/stages/05-audio/generate.py pipeline/scenes/<sid>.yaml \
    --reference scripts/some-other-voice.wav
```

## Per-chunk log

The generator logs every chunk's params before synthesis so flat/rushed beats
are diagnosable:

```
Scene: count-tree-nodes
Sidecar: pipeline/scenes/count-tree-nodes.narration.yaml
Chunked steps: 26  Total chunks: 92
============================================================
  Step 24 [6 chunks]: "PEAK — final combine, the 'aha'"
      24.0  ex=0.68 cw=0.55 t=0.90 +0.35s  "Okay."
      24.1  ex=0.66 cw=0.55 t=0.90 +0.50s  "So, back at the root."
      24.2  ex=0.65 cw=0.55 t=0.90 +0.35s  "Left gave us three."
      24.3  ex=0.65 cw=0.55 t=0.90 +0.55s  "Right gave us three."
      24.4  ex=0.78 cw=0.45 t=0.92 +0.80s  "So, three plus three plus one."
      24.5  ex=0.95 cw=0.32 t=0.95 +0.00s  "Seven!"
    -> public/narration/count-tree-nodes/step-24.mp3 (5.42s, 163 frames)
```

When a clip lands wrong, the per-chunk WAV at
`public/narration/<sid>/chunks/step-N-N.M.wav` lets you isolate which chunk
needs tuning before paying the full-step compute again.

## Tuning chunk params

Edit the chunk's `params` in `pipeline/scenes/<sid>.narration.yaml` and run
`--step N --force`. Knob-coupling rule applies within every chunk:

- Flat clip → raise `exaggeration` by 0.1 *and* drop `cfg_weight` by 0.1 (paired)
- Rushed clip → opposite

For per-beat tier values (calm orientation, methodical, lean-in, mini-reveal,
subtree return, peak, closing), see
`pipeline/design-system/teaching.md` "Chunked narration".

## Reproducibility (`seed`)

If a chunk lands perfectly, lock its take by adding `seed: <int>` to that
chunk in the sidecar. The generator will call `torch.manual_seed(seed)` right
before that chunk's generate(), making future regenerations byte-identical
(modulo Chatterbox version + reference voice file). Re-rolling is just
removing the `seed` field.
