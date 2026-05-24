# Stage 5 — Audio (pipeline-native)

`generate.py` synthesizes per-step MP3s from `scene.yaml`, applying persona × arc presets per `pipeline/design-system/voice/two-axis-model.md`.

## Pipeline isolation

This stage **does not** import from or modify `scripts/generate-narration-chatterbox.py`. The legacy script remains the editorial ancestor of this pipeline; it is preserved untouched for compatibility with non-pipeline scenes. Pipeline-driven scenes use this script exclusively.

The trade-off is some duplication (preset matrix, generate_speech wrapper, ffprobe/ffmpeg helpers). That's the cost of strict isolation.

## Usage

```bash
# Generate all steps for a scene
python3 pipeline/stages/05-audio/generate.py pipeline/scenes/<sid>.yaml

# Overwrite existing MP3s
python3 pipeline/stages/05-audio/generate.py pipeline/scenes/<sid>.yaml --force

# Regenerate only one step (after tuning its voiceOverride)
python3 pipeline/stages/05-audio/generate.py pipeline/scenes/<sid>.yaml --step 3 --force

# Use a different reference voice
python3 pipeline/stages/05-audio/generate.py pipeline/scenes/<sid>.yaml \
    --reference scripts/teacher-energetic-reference.wav
```

## Per-step preset log

The generator logs the applied preset per step so flat/rushed clips are diagnosable:

```
Scene: my-scene  persona: teacher-energetic
============================================================
  Step 0 [opening    ex=0.6 cw=0.45 t=0.85]: "Alright, watch this — linked..."
  Step 1 [methodical ex=0.55 cw=0.5 t=0.83]: "We want to find nine. No shortcuts..."
  Step 2 [peak       ex=0.8 cw=0.3 t=0.93]: "And boom — there it is, nine!..."
  Step 3 [closing    ex=0.7 cw=0.4 t=0.9]: "O of n, worst case. Clean."
```

## Outputs

- `public/narration/<sceneId>/step-N.mp3` for each step
- `public/narration/<sceneId>/durations.json` — consumed by `scripts/apply-narration-updates.py` in stage 6

## Tuning flat or rushed clips

Per `pipeline/design-system/voice/two-axis-model.md`: bump `exaggeration +0.1` *and* drop `cfg_weight -0.1` (paired) for flat clips; opposite direction for rushed ones. Apply via `voiceOverride` on the offending step in `scene.yaml`:

```yaml
- stepIndex: 3
  arc: peak
  narration: "And boom — there it is, nine!"
  voiceOverride:
    exaggeration: 0.85   # up from persona×arc default 0.80
    cfg_weight: 0.25     # down from 0.30
```

Then regenerate just that step:

```bash
python3 pipeline/stages/05-audio/generate.py pipeline/scenes/<sid>.yaml --step 3 --force
```
