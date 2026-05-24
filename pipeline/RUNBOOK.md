# Runbook — From Topic to Published Video

Drive the pipeline by giving Claude one of **six prompts** at each stage boundary. Claude reads the design system, invokes the right pipeline tools, and hands back control at the next review point.

```
Stage 1  AUTHOR           ← Prompt 1
Stage 2  VISUAL           ← Prompt 2
   review-visual          ← Prompt 3 (iterate as needed)
Stage 3  AUDIO+ASSEMBLY   ← Prompt 4
   review-audio           ← Prompt 5 (iterate as needed)
Stage 4  FINAL RENDER     ← Prompt 6
```

`design-system/` describes *what* to build. The 6 prompts below tell Claude *when and how*.

---

## One-time setup

```bash
pip install pyyaml jinja2 chatterbox-tts torchaudio
brew install ffmpeg            # or apt install ffmpeg
npm install
```

Optional: a 6–10 second WAV reference clip at `scripts/my-voice.wav`. Without one, Chatterbox uses its default voice.

---

## The six prompts

### Prompt 1 — Author the scene

```
I want to build a video on <topic>.

1. Load pipeline/design-system/approaches.md. Research the community for how
   this topic is taught — survey 3Blue1Brown, NeetCode, MIT OCW, GeeksforGeeks,
   Brilliant, blog posts, textbook chapters. At least 5 sources. Identify the
   3 most distinct presentation archetypes actually used for this topic.

2. Present me 4 approach options via AskUserQuestion. Option 1 is always
   algorithm-walkthrough (codebase default). Options 2–4 are your top 3 from
   community research, ranked by clarity / visual feasibility / distinctness
   from option 1.

3. After I pick, load the rest of the design system you'll need: teaching.md,
   patterns/<dataStructure>.md, voice/two-axis-model.md, voice/personas/<persona>.md,
   scene-schema.yaml.

4. Author pipeline/scenes/<sceneId>.yaml at teaching density per teaching.md —
   every recursive frame is its own step, no "by-symmetry" shortcuts, concrete
   values everywhere, visible return values before parents combine.
```

**Boundary**: Claude pauses to ask the approach question, then writes the scene.yaml.

---

### Prompt 2 — Build the visual

```
The scene is at pipeline/scenes/<sceneId>.yaml. Run stage 2 — visual.

1. Validate the scene (pipeline/stages/01-validate/validate.py). Fix any
   violations by editing the scene.yaml before proceeding.

2. Scaffold the .tsx (pipeline/stages/02-scaffold/scaffold.py). Print the
   paste snippets.

3. Tell me clearly which snippets are REQUIRED and which are OPTIONAL:
     REQUIRED — src/data/code-snippets.ts, src/standalone/index.tsx, src/Root.tsx
     OPTIONAL — scripts/apply-narration-updates.py SCENES dict (pipeline has
                its own apply at stages/06-apply; the SCENES paste is only
                useful for ad-hoc legacy usage)

4. Wait for me to confirm I've pasted the required ones.

5. Run narration-preview (pipeline/stages/03-narration/preview.py) — TTS
   lint + per-step persona × arc preset table. Surface any warnings.

6. Run render-preview: `npx remotion render src/index.ts Video-<TitleCase>
   out/<TitleCase>-preview.mp4`. This is silent (no audio yet); uses
   targetFrames timing.

7. Tell me where the preview file is and that I should now watch it and use
   Prompt 3 to give feedback.
```

**Boundary**: Claude pauses for paste confirmation, then renders the silent preview. You watch it.

---

### Prompt 3 — Visual review feedback (iterate as needed)

```
Here's my feedback on the visual preview:
<freeform description of issues>

(Or: My filled-in review is at pipeline/review/<sceneId>-visual.md.)

1. Read every issue. For each one, identify which scene.yaml field changes.
   Make the edits.

2. For each item I marked as a "pattern worth propagating to design-system",
   identify the right doc (teaching.md / patterns/<x>.md / voice/<x>.md /
   theme.md) and apply the update. Show me the diff.

3. Re-run scaffold + render-preview.

4. Summarize:
     - what scene.yaml fields changed
     - what design-system docs you updated (for propagation)
     - where the new preview is

I'll re-watch and either approve or send another round of feedback.
```

**Boundary**: Repeat this prompt until you're satisfied with the visual. Then move to Prompt 4.

---

### Prompt 4 — Build the audio

```
Visual is approved. Run stage 3a — generate audio.

1. Run pipeline/stages/05-audio/generate.py for this scene. Takes 5–15
   minutes; let it complete.

2. When done, tell me:
     - Where the MP3s landed (public/narration/<sceneId>/)
     - The per-step preset log (so I can spot anything that looks wrong on
       paper before listening — e.g. an arc:peak step that landed at
       conservative knobs)
     - The full duration of each clip and the suggested total scene length
     - How to give you audio feedback (Prompt 5)
```

**Boundary**: Claude runs audio gen and reports. You listen.

---

### Prompt 5 — Audio review feedback (iterate as needed)

```
Here's my audio feedback:
<freeform description of issues>

(Or: My filled-in review is at pipeline/review/<sceneId>-audio.md.)

1. Read every issue. For each one, classify the fix as:
     - voiceOverride on that step (knob nudge — exaggeration / cfg_weight /
       temperature)
     - Narration text rewrite (better phrasing, phonetic respelling)
     - Persona change at scene level (rare — only if the entire scene feels
       miscast)

2. Apply the edits to scene.yaml.

3. For each "pattern worth propagating", update the right design-system doc
   (voice/personas/<persona>.md / voice/two-axis-model.md / teaching.md
   TTS-readiness section).

4. Regenerate ONLY the affected steps:
   `python3 pipeline/stages/05-audio/generate.py pipeline/scenes/<sceneId>.yaml
    --step N --force` for each changed step.

5. Tell me which clips to re-listen to.

I'll re-listen and either approve or send another round of feedback.
```

**Boundary**: Repeat until audio is approved. Then move to Prompt 6.

---

### Prompt 6 — Final touch

```
Audio is approved. Close out stage 3 and run stage 4.

1. Apply timings — pipeline/stages/06-apply/apply.py for this scene. This
   reconciles real audio durations into scene.tsx startFrames + SCENE_FRAMES
   + narration-scripts.ts. Show me the dry-run output first if anything looks
   off, then apply for real.

2. Render the final video — both formats:
     - YouTube: npx remotion render src/index.ts Video-<TitleCase> out/<TitleCase>.mp4
     - Reel:    npx remotion render src/index.ts Reel-<TitleCase>  out/<TitleCase>-Reel.mp4

3. Tell me where the final files are.
```

**Boundary**: Pipeline done. You have publishable MP4s.

---

## What each prompt does under the hood

Quick reference for the tools Claude invokes per prompt. You don't need to remember these — Claude does.

| Prompt | Tools invoked | Files written / read |
|---|---|---|
| 1 Author | `WebSearch` + `WebFetch` + `AskUserQuestion` | reads: design-system/* · writes: pipeline/scenes/<sid>.yaml |
| 2 Build visual | validate.py · scaffold.py · preview.py · `npx remotion render` | writes: src/scenes/<Name>.tsx · out/<Name>-preview.mp4 · prints paste snippets |
| 3 Visual feedback | scaffold.py · `npx remotion render` (re-run) | edits: scene.yaml · design-system/* (propagation) |
| 4 Build audio | generate.py | writes: public/narration/<sid>/step-N.mp3 + durations.json |
| 5 Audio feedback | generate.py with `--step N --force` | edits: scene.yaml · design-system/* (propagation) |
| 6 Final touch | apply.py · `npx remotion render` (×2) | edits: src/scenes/<Name>.tsx · src/data/narration-scripts.ts · writes: out/<Name>.mp4 + out/<Name>-Reel.mp4 |

---

## Iteration patterns

If you need to re-enter a stage rather than restart:

| Situation | Prompt to use |
|---|---|
| Scene step is reframed but visuals fine | Prompt 5 (audio re-fix only) |
| Snapshot tweak, audio still valid | Prompt 3 (with note "audio is fine, just re-render preview") |
| Approach change mid-flight | Prompt 1 again — Claude re-authors from scratch |
| Just want to re-render | Prompt 6 |

---

## What's automated vs. manual

| Boundary | Human role |
|---|---|
| Pick approach | Decide between the 4 options Claude presents |
| Paste 3 (or 4) snippets | Manually paste into Root.tsx, standalone, code-snippets, optionally SCENES dict |
| Visual review | Watch the preview, write feedback |
| Audio review | Listen to each clip, write feedback |
| Approve at each gate | Tell Claude "approved" so it moves to the next prompt |

Everything else is mechanical and Claude-driven.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Validator: "missing approach" / "missing approachNotes" | These are required. Claude should add them after Prompt 1's discovery step. Re-run Prompt 1 if missing. |
| Validator: "narration contains digits" | Spell numbers as words. Claude fixes via Prompt 3 if you just send the validator output. |
| Preview shows pronunciation hazard | Same — fix in scene.yaml via Prompt 3 or Prompt 5. |
| `render-preview` fails: "no composition named X" | Required paste snippets (Root.tsx) not applied yet. Paste then retry. |
| `apply.py`: "step-count mismatch" | scene.tsx step count drifted from durations.json. Re-run Prompt 4 (`--force`) then retry Prompt 6. |
| `apply.py`: "could not locate '<CONST>_SCENE_FRAMES'" | The scaffolder named the constant differently than expected. Add `sceneConstName` override in scene.yaml. |
| Audio sounds flat or rushed | Send feedback via Prompt 5; Claude applies `voiceOverride` paired adjustments. |
| Visuals look right but audio still seems wrong on a step | Re-run Prompt 5 with specific step feedback. Don't restart stage 3. |

---

## What this pipeline does **not** do (yet)

- **No fully automated approach discovery** — stage 1a needs Claude doing the research live. There's no batch CLI.
- **No thumbnail / description / metadata generation** — stage 4 ends at the MP4.
- **No publishing** — no YouTube/Instagram API integration.
- **No cross-format pacing adjustment** — Reels and YouTube share narration timing.
- **No automated knob auto-tune** for flat clips — iteration is manual via `voiceOverride`.
- **Review files are user-authored** — Claude doesn't transcribe audio to find issues; you write the feedback. The freeform/template-driven feedback format is the input to Prompts 3 and 5.

---

## Detailed command reference (advanced / manual override)

If you want to drive a stage without going through Claude — useful for debugging or scripting — here are the raw commands the prompts above invoke.

### Stage 2 commands
```bash
python3 pipeline/stages/01-validate/validate.py   pipeline/scenes/<sid>.yaml
python3 pipeline/stages/02-scaffold/scaffold.py   pipeline/scenes/<sid>.yaml
python3 pipeline/stages/03-narration/preview.py   pipeline/scenes/<sid>.yaml
npx remotion render src/index.ts Video-<TitleCase> out/<TitleCase>-preview.mp4
```

### Stage 3 commands
```bash
python3 pipeline/stages/05-audio/generate.py      pipeline/scenes/<sid>.yaml
# (review + iterate; regenerate one step:)
python3 pipeline/stages/05-audio/generate.py      pipeline/scenes/<sid>.yaml --step N --force
# (when audio approved:)
python3 pipeline/stages/06-apply/apply.py         pipeline/scenes/<sid>.yaml [--dry-run]
```

### Stage 4 commands
```bash
npx remotion render src/index.ts Video-<TitleCase> out/<TitleCase>.mp4
npx remotion render src/index.ts Reel-<TitleCase>  out/<TitleCase>-Reel.mp4
```

### Orchestrator shortcuts (`pipeline/run.sh`)
```bash
bash pipeline/run.sh <yaml> prefix         # stage 2a-c
bash pipeline/run.sh <yaml> preview        # stage 2d-e
bash pipeline/run.sh <yaml> audio-stage    # stage 3a-b
bash pipeline/run.sh <yaml> apply          # stage 3c
bash pipeline/run.sh <yaml> render         # stage 4
bash pipeline/run.sh <yaml> finalize       # apply + render
```

These exist for cases where Claude isn't in the loop. The six-prompt flow above is the primary interface.
