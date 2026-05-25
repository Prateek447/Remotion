# Runbook — From Topic to Published Video

Drive the pipeline with **five prompts**, each handed to Claude at a stage transition. Claude does the work between transitions; you evaluate at the boundaries.

```
                     Claude works ───────────►  ◄─── You evaluate
                                                      │
[Prompt 1]  Stage 1 + Stage 2 + paste pause + narration-preview
                                                      │
[Prompt 2]  ← Visual review (in Remotion Studio) ─────┤
            (loop on feedback; propagate on approval)
                                                      │
[Prompt 3]  Stage 3a (audio) + Stage 3c (apply)
                                                      │
[Prompt 4]  ← Audio + sync review (in Remotion Studio) ┤
            (loop on feedback; propagate on approval)
                                                      │
[Prompt 5]  Stage 4 — final MP4s
```

Two natural pauses happen INSIDE Prompt 1 (approach pick via AskUserQuestion, paste confirmation). The rest is non-stop within each prompt.

You evaluate via **Remotion Studio** (`npm run studio`) — not via rendered preview MP4s. Studio reads source live, so as soon as Claude finishes a prompt and refreshes happen, the composition is ready to scrub.

---

## One-time setup

```bash
pip install pyyaml jinja2 chatterbox-tts torchaudio
brew install ffmpeg            # or apt install ffmpeg
npm install
```

Optional: a 6–10 second WAV reference clip at `scripts/my-voice.wav`. Without one, Chatterbox uses its default voice.

In a second terminal: `npm run studio` (keep this running across all prompts).

---

## The five prompts

### Prompt 1 — Build through visual-review-ready state

```
I want to build a video on <topic>.

Run the pipeline non-stop until the scene is renderable in Remotion Studio
for me to review. Two pauses are allowed:
  - AskUserQuestion for me to pick the approach
  - Paste confirmation after you print scaffold snippets

Sequence:

1. Load pipeline/design-system/approaches.md. Research the community for how
   <topic> is taught — survey at least 5 sources (3Blue1Brown, NeetCode,
   MIT OCW, GeeksforGeeks, Brilliant, blog posts, textbooks). Identify the
   3 most distinct presentation archetypes used for this specific topic.

2. AskUserQuestion: 4 options. Option 1 always algorithm-walkthrough
   (codebase default). Options 2-4 are your top 3 community findings, ranked
   by clarity / visual feasibility / distinctness.
   [PAUSE for me to pick]

3. Load the rest of the design system: teaching.md,
   patterns/<dataStructure>.md, voice/two-axis-model.md,
   voice/personas/<persona>.md, scene-schema.yaml.

4. Author pipeline/scenes/<sceneId>.yaml at teaching density per teaching.md.
   Every recursive frame is a step. Concrete values. Visible return values.
   No by-symmetry shortcuts.

5. Validate (pipeline/stages/01-validate/validate.py). Fix any violations.

6. Scaffold (pipeline/stages/02-scaffold/scaffold.py). Print the paste snippets,
   clearly labeled:
     REQUIRED — src/data/code-snippets.ts, src/standalone/index.tsx,
                src/Root.tsx
     OPTIONAL — scripts/apply-narration-updates.py SCENES dict (pipeline
                has its own apply; only paste this for ad-hoc legacy support)
   [PAUSE for me to paste the REQUIRED snippets and say "pasted"]

7. Run narration-preview (pipeline/stages/03-narration/preview.py). Show me
   the per-step persona × arc preset table and any TTS-readiness warnings.
   Fix any warnings in scene.yaml.

8. Tell me:
   "Scene is renderable. Refresh Remotion Studio (the dev server should
   already be running) and navigate to composition Video-<TitleCase>. Scrub
   through to review the silent animations, captions, layout, code highlights.
   Use Prompt 2 to give feedback or approve."
```

**Boundary**: Claude has driven from "I want a video on X" through to a Studio-renderable scene. You review in Studio.

---

### Prompt 2 — Visual feedback OR approval (iterate as needed)

```
Visual review:
<freeform feedback, OR "approved", OR pointer to pipeline/review/<sceneId>-visual.md>

If I gave you fixes:
  1. For each issue, identify which scene.yaml field changes. Apply the edits.
  2. For each item that's a cross-scene pattern (not just this scene's quirk),
     update the relevant design-system doc (teaching.md / patterns/<x>.md /
     voice/<x>.md / theme.md). Show me the diffs.
  3. Re-run scaffold so the .tsx is regenerated.
  4. Tell me to refresh Remotion Studio and re-review. Loop back to Prompt 2.

If I approved:
  1. Meta-review the final scene.yaml. Even without explicit feedback,
     identify SCENE-LEVEL learnings worth propagating to the design system:
       - Did this scene's approach work for this topic class? Note in
         approaches.md if a new archetype emerged or a known one validated.
       - Did the step count match teaching.md's heuristic for this algorithm
         class? Update the heuristic if it didn't.
       - Did any new visual idiom emerge (a snapshot pattern, a caption style,
         a pointer convention) not yet in patterns/<x>.md? Add it.
       - Did the voice persona fit this content well? Note in the persona doc.
  2. Apply those documentation updates. Show me each diff.
  3. Tell me:
     "Visuals approved and learnings propagated. Use Prompt 3 to generate
     audio and sync it for Studio review."
```

**Boundary**: Iterate this prompt until you say "approved." On approval, design-system absorbs scene-level learnings.

---

### Prompt 3 — Audio + apply (until Studio plays synced)

```
Visuals approved. Run stage 3 — audio + apply timings — so I can review the
synced video in Remotion Studio.

1. Run pipeline/stages/05-audio/generate.py for this scene. Takes 5-15
   minutes. When complete, show me the per-step preset log so I can spot
   anything that looks wrong on paper before listening.

2. Run pipeline/stages/06-apply/apply.py for this scene. This reconciles
   real audio durations into scene.tsx startFrames + SCENE_FRAMES + the
   Durations array in narration-scripts.ts. Show me the output.

3. Tell me:
   "Audio is synced. Refresh Remotion Studio at composition Video-<TitleCase>
   — you'll now hear the narration over the visuals at the real audio
   timings. Use Prompt 4 to give feedback or approve."
```

**Boundary**: Studio now plays the synced version. You listen and watch.

---

### Prompt 4 — Audio + sync feedback OR approval (iterate as needed)

```
Audio + sync review (after listening in Studio):
<freeform feedback, OR "approved", OR pointer to pipeline/review/<sceneId>-audio.md>

If I gave you fixes:
  1. Classify each fix:
       - VOICE: chunk `params` tune / chunk split / `pauseAfter` adjust /
                chunk text rewrite / chunk seed lock / persona change
       - VISUAL: snapshot, caption, targetFrames, highlight (audio review may
                 reveal a visual mismatch I didn't catch in Prompt 2)
       - BOTH: e.g., rewriting narration that changes both audio and caption
  2. Apply sidecar edits in pipeline/scenes/<sceneId>.narration.yaml
     (and scene.yaml only for visual / content-text changes).
  3. For each cross-scene pattern, update the right design-system doc
     (voice/personas/<persona>.md / voice/two-axis-model.md /
     teaching.md TTS-readiness / patterns/<x>.md). Show diffs.
  4. Re-execute whichever stages are needed:
       - Voice change: regenerate affected steps with
         `pipeline/stages/05-audio/generate.py --step N --force`, then re-apply.
       - Visual-only change: re-scaffold, re-apply (durations didn't change).
       - Both: full re-scaffold + targeted --step regen + re-apply.
  5. Tell me what to refresh in Studio and which clips/steps to re-listen to.
     Loop back to Prompt 4.

If I approved:
  1. Meta-review the scene + audio. Identify cross-scene learnings:
       - Any persona × arc preset that needed overriding? Update voice docs.
       - Any narration phrasing that worked particularly well? Note in
         voice/personas/<persona>.md.
       - Any new TTS hazard encountered? Add to teaching.md TTS section.
       - Any visual fixes that emerged during audio review (i.e., things the
         silent preview missed)? Note in patterns/<x>.md so the next scene's
         visual review catches them earlier.
  2. Apply documentation updates. Show me each diff.
  3. Tell me:
     "Audio approved and learnings propagated. Use Prompt 5 to render the
     final MP4s for publishing."
```

**Boundary**: Iterate until approved. On approval, design-system absorbs cross-modal learnings.

---

### Prompt 5 — Final render

```
Render the final video for publishing.

1. YouTube (1920×1080):
     npx remotion render src/index.ts Video-<TitleCase> out/<TitleCase>.mp4

2. Reel (1080×1920):
     npx remotion render src/index.ts Reel-<TitleCase> out/<TitleCase>-Reel.mp4

3. Tell me:
     - Where the files are
     - Final file sizes and durations
     - Anything anomalous from the render log (warnings, missing assets, etc.)
```

**Boundary**: Pipeline complete. You have publishable MP4s.

---

## What each prompt does under the hood

| Prompt | Tools Claude invokes | Files written / read |
|---|---|---|
| 1 | `WebSearch`, `WebFetch`, `AskUserQuestion`, validate.py, scaffold.py, preview.py | reads design-system/* · writes scene.yaml + src/scenes/<Name>.tsx · prints paste snippets |
| 2 | scaffold.py (on iterate); none on approval | edits scene.yaml + design-system/* (propagation) |
| 3 | generate.py, apply.py | writes public/narration/<sid>/step-*.mp3 + durations.json · edits src/scenes/<Name>.tsx + src/data/narration-scripts.ts |
| 4 | generate.py with `--step N --force`, apply.py, scaffold.py (if visual fix) | edits scene.yaml + design-system/* (propagation) · regenerates targeted mp3s · re-applies timings |
| 5 | `npx remotion render` (×2) | writes out/<Name>.mp4 + out/<Name>-Reel.mp4 |

---

## What's automated vs. manual

| Action | Who | When |
|---|---|---|
| Approach research + ranking | Claude | Prompt 1 |
| Approach pick | You (AskUserQuestion) | Prompt 1 pause |
| Author scene.yaml | Claude | Prompt 1 |
| Validate + scaffold | Claude | Prompt 1 |
| Paste 3 (or 4) snippets into shared files | You | Prompt 1 pause |
| Lint + narration preview | Claude | Prompt 1 |
| Visual review (in Studio) | You | After Prompt 1 |
| Apply visual fixes + propagate | Claude | Prompt 2 |
| Audio generation | Claude | Prompt 3 |
| Apply timings | Claude | Prompt 3 |
| Audio + sync review (in Studio) | You | After Prompt 3 |
| Apply audio fixes + propagate | Claude | Prompt 4 |
| Final render | Claude | Prompt 5 |

The review gates after Prompts 1 and 3 are the only places human judgment is required. Approval + propagation happens inside Prompts 2 and 4.

---

## Iteration patterns

| Situation | Re-use prompt |
|---|---|
| Visual feedback that doesn't touch the approach | Prompt 2 |
| Audio feedback only | Prompt 4 |
| Audio review reveals a visual issue too | Prompt 4 (handles both — classify as VISUAL or BOTH) |
| Realize approach was wrong mid-flight | Restart from Prompt 1 (with note to skip research, use approach X) |
| Final MP4 came out wrong, need re-render | Prompt 5 |

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Validator: "missing approach" / "missing approachNotes" | Required after Prompt 1's research step. If missing, re-run Prompt 1. |
| Validator: "narration contains digits" | Spell numbers as words. Hand Claude the validator output via Prompt 2. |
| Studio: "composition not found" | Required paste snippets (Root.tsx etc.) not pasted yet. Paste, then refresh Studio. |
| Studio: scene renders but audio silent after Prompt 3 | Either Prompt 3 didn't complete `apply` (re-run it), or Studio is caching — restart `npm run studio`. |
| `apply.py`: "step-count mismatch" | scene.tsx step count drifted from durations.json. Re-run Prompt 3 (`--force`) then retry apply. |
| `apply.py`: "could not locate '<CONST>_SCENE_FRAMES'" | Scaffolder named the constant non-standardly. Add `sceneConstName` override in scene.yaml. |
| Audio sounds flat or rushed | Send feedback via Prompt 4 — identify the chunk(s) via `chunks/step-N-N.M.wav`. Claude tunes chunk `params` (paired ex↑/cfg↓ for flat, opposite for rushed) in the sidecar. |
| Audio review reveals caption too long for the spoken phrase | Send via Prompt 4 — Claude classifies it BOTH and fixes scene.yaml + regenerates audio if narration changes. |

---

## What this pipeline does **not** do (yet)

- **No fully automated approach discovery** — Claude must do live research in Prompt 1.
- **No thumbnail / description / metadata generation** — Prompt 5 ends at the MP4.
- **No publishing** — no YouTube / Instagram API integration.
- **No cross-format pacing adjustment** — Reels and YouTube share narration timing.
- **No automated knob auto-tune** — chunk param tuning is manual via Prompt 4 (or direct sidecar editing).

---

## Commands

Cheat sheet for pipeline tools, experiments, audio generation, applying updates, and
final render. The five-prompt flow above is the primary interface; everything here is
the granular toolbox for manual override, debugging, and experimentation.

### Stage 2 — Visual (validate, scaffold, narration scaffold + preview)

```bash
# Validate scene.yaml against design-system contracts (schema, approach, content sanity)
python3 pipeline/stages/01-validate/validate.py pipeline/scenes/<sid>.yaml

# Scaffold src/scenes/<Name>.tsx + print paste snippets for Root.tsx etc.
python3 pipeline/stages/02-scaffold/scaffold.py pipeline/scenes/<sid>.yaml

# Scaffold the chunked narration sidecar (one chunk per step, default params keyed off arc).
# Refuses to overwrite an existing sidecar unless --force.
python3 pipeline/stages/03-narration/scaffold.py pipeline/scenes/<sid>.yaml

# Validate + summarize the sidecar (chunk counts, param ranges, TTS lint per chunk,
# coverage cross-check vs. scene.yaml). Read-only. Hard-errors on missing scene coverage.
python3 pipeline/stages/03-narration/preview.py pipeline/scenes/<sid>.yaml
```

### Stage 3 — Audio generation & apply

The audio generator requires the chunked-narration sidecar (`<sid>.narration.yaml`).
It runs one Chatterbox call per chunk with per-chunk
`(exaggeration, cfg_weight, temperature)` and splices `torch.zeros` silence
between chunks per each chunk's `pauseAfter`. There is no AUTO-mode fallback;
scenes without a sidecar are rejected.

```bash
# Generate audio for full scene (~30–45 min on GPU, longer on CPU)
python3 pipeline/stages/05-audio/generate.py pipeline/scenes/<sid>.yaml

# Regenerate one step only — for misfires or after tuning chunk params
python3 pipeline/stages/05-audio/generate.py pipeline/scenes/<sid>.yaml --step 24 --force

# Force-regenerate full scene
python3 pipeline/stages/05-audio/generate.py pipeline/scenes/<sid>.yaml --force

# Override the reference voice clip
python3 pipeline/stages/05-audio/generate.py pipeline/scenes/<sid>.yaml --reference scripts/<other>.wav

# Apply audio durations to scene.tsx + narration-scripts.ts
python3 pipeline/stages/06-apply/apply.py pipeline/scenes/<sid>.yaml

# Dry-run apply — print intended edits without writing
python3 pipeline/stages/06-apply/apply.py pipeline/scenes/<sid>.yaml --dry-run
```

#### Sidecar authoring + tune loop

```bash
# 1. Generate skeleton (one chunk per step, default params seeded by arc)
python3 pipeline/stages/03-narration/scaffold.py pipeline/scenes/<sid>.yaml

# 2. Hand-author the sidecar — split high-emotion steps into multiple chunks,
#    tune params per chunk against the tier legend in teaching.md
#    Reference: pipeline/scenes/count-tree-nodes.narration.yaml

# 3. Validate the authored sidecar
python3 pipeline/stages/03-narration/preview.py pipeline/scenes/<sid>.yaml

# 4. Smoke-test a single step before committing to full-scene compute
python3 pipeline/stages/05-audio/generate.py pipeline/scenes/<sid>.yaml --step <N> --force

# 5. Listen
open public/narration/<sid>/step-<N>.mp3
# Or listen to a single chunk in isolation (gated on output.perChunkDebug: true)
open public/narration/<sid>/chunks/step-<N>-<N>.M.wav

# 6. Tune chunk params in the sidecar, repeat step 4. Iterate until satisfied.
# 7. Lock keepers by adding `seed: <int>` to chunks that landed perfectly.
# 8. Full-scene regenerate when all spot-checked steps are good.
```

Per-chunk WAVs at `public/narration/<sid>/chunks/step-N-N.M.wav` are debug-only;
apply.py never reads them. The concatenated `step-N.mp3` files are what feed
into timing reconciliation.

### Stage 4 — Final render

The render preset is high-quality: `--crf=1` near-lossless, `--x264-preset=veryslow` for
best compression efficiency, `--scale=2` super-samples then downscales (sharper text and
SVG edges), `--gl=angle` for the most reliable Remotion renderer across platforms.

Use `--frames=0-380` to render only a frame range — invaluable for iterating on a single
moment without paying the full encode cost.

#### macOS / Linux — full render (multi-line)

```bash
time npx remotion render Video-BSTInsert out/output.mp4 \
  --codec=h264 \
  --crf=1 \
  --x264-preset=veryslow \
  --image-format=png \
  --scale=2 \
  --color-space=bt709 \
  --gl=angle \
  --concurrency=10
```

#### macOS / Linux — partial-frame render (multi-line)

```bash
time npx remotion render Video-BSTInsert out/output.mp4 \
  --frames=0-380 \
  --codec=h264 \
  --crf=1 \
  --x264-preset=veryslow \
  --image-format=png \
  --scale=2 \
  --color-space=bt709 \
  --gl=angle \
  --concurrency=10
```

#### Windows — single-line variant

PowerShell and cmd.exe don't parse the `\` line-continuation. Use the single-line form:

```bash
time npx remotion render Video-BSTInsert out/output.mp4 --frames=0-380 --codec=h264 --crf=1 --x264-preset=veryslow --image-format=png --scale=2 --color-space=bt709 --gl=angle --concurrency=10
```

Drop `--frames=0-380` for a full render; everything else is identical.

#### Render flags — what each does

| Flag | Effect |
|---|---|
| `--codec=h264` | Standard H.264 — broad playback support, YouTube/Instagram compatible |
| `--crf=1` | Constant Rate Factor 1 — near-lossless (range 0–51, lower = higher quality). For drafts, use `--crf=18`. |
| `--x264-preset=veryslow` | Best compression efficiency at the cost of encode time. For drafts, `--x264-preset=medium`. |
| `--image-format=png` | Uncompressed intermediate frames — no JPEG artifacts feeding into encode |
| `--scale=2` | 2× super-sample then downscale — sharper text & SVG line art |
| `--color-space=bt709` | Standard HD/SDR color space — what YouTube expects |
| `--gl=angle` | ANGLE WebGL renderer — most reliable across platforms |
| `--concurrency=10` | Parallel frame rendering — set to your CPU core count |
| `--frames=A-B` | Render only the given frame range — fast iteration on a specific moment |

**Composition IDs:** swap `Video-BSTInsert` for your scene's composition. Examples:
`Video-CountTreeNodes` / `Reel-CountTreeNodes`, `Video-LeftViewTraversal` / `Reel-LeftViewTraversal`.
See `src/Root.tsx` for the full registered list.

#### Draft render (~10× faster, for iteration)

```bash
time npx remotion render Video-<TitleCase> out/<TitleCase>-draft.mp4
```

Uses Remotion defaults (`crf=18`, `preset=medium`, no scaling) — fine for sync-check and
visual-review passes; not the final-quality preset.

### Orchestrator shortcuts (`pipeline/run.sh`)

Bundles the per-stage Python commands behind named stages. Useful when running
end-to-end without Claude in the loop.

```bash
bash pipeline/run.sh <yaml> validate            # validator only
bash pipeline/run.sh <yaml> scaffold            # validate + scaffold tsx
bash pipeline/run.sh <yaml> narration-scaffold  # scene.yaml → <scene>.narration.yaml skeleton
bash pipeline/run.sh <yaml> narration-preview   # validate + summarize the sidecar
bash pipeline/run.sh <yaml> prefix              # validate + scaffold + narration-scaffold + narration-preview (default)
bash pipeline/run.sh <yaml> audio               # generate audio for full scene
bash pipeline/run.sh <yaml> audio-stage         # audio + review-audio template
bash pipeline/run.sh <yaml> apply               # apply timings to scene.tsx + narration-scripts.ts
bash pipeline/run.sh <yaml> render              # final render (Video + Reel formats)
bash pipeline/run.sh <yaml> finalize            # apply + render
```

### Experiments — filler lab

Empirical proving ground for prosody techniques. See
`pipeline/experiments/filler-lab/README.md` for the full history (Um / Ah / Hmm all
dropped — chunked authoring is what shipped).

```bash
# Initial 34-variant discovery (~10–15 min on GPU, 1 take per variant)
python3 pipeline/experiments/filler-lab/lab.py

# Run a single category
python3 pipeline/experiments/filler-lab/lab.py --only um
python3 pipeline/experiments/filler-lab/lab.py --only hmm
python3 pipeline/experiments/filler-lab/lab.py --only pause

# Test under a different persona/arc's knobs
python3 pipeline/experiments/filler-lab/lab.py --persona measured --arc methodical

# Force-regenerate (default skips existing files)
python3 pipeline/experiments/filler-lab/lab.py --force

# Reliability gate — N takes at random seeds for shortlisted variants
python3 pipeline/experiments/filler-lab/repro.py
python3 pipeline/experiments/filler-lab/repro.py --takes 10
python3 pipeline/experiments/filler-lab/repro.py --temperature 0.85   # stabilization test
```

### Inspection & debugging

```bash
# List all scene definitions
ls -1 pipeline/scenes/*.yaml

# Prosody summary across every scene
for s in pipeline/scenes/*.yaml; do
  echo "=== $s ==="
  python3 pipeline/stages/03-narration/preview.py "$s" 2>&1 | grep "Prosody markers"
done

# Audio files for a scene
ls -la public/narration/<sid>/*.mp3

# One-off audio duration check
ffprobe -v error -show_entries format=duration -of csv=p=0 public/narration/<sid>/step-0.mp3

# Compare durations.json against actual MP3 lengths
cat public/narration/<sid>/durations.json
```

### Remotion Studio (live preview)

```bash
# Scrub through compositions live, no render required
npm run studio
# → http://localhost:3000
```

Use Studio for visual review (Stage 2 gate) and audio-sync review (Stage 3 gate). It's
the listening surface for `apply.py` output — far better than playing MP4s.
