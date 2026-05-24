# Narration Writing Guide — Using the `tts-narration-writer` Skill

Operational runbook for applying `.cursor/skills/tts-narration-writer/SKILL.md` to this repo. Two workflows: **A. Write a new scene narration from scratch.** **B. Finetune an existing scene that sounds off.**

The skill itself is the reference for *what* to write and *which* knobs to turn. This doc is *how* to actually do it in this codebase — commands, file paths, the iteration loop.

---

## Prereqs

- `.venv` is set up and `chatterbox-tts` is installed (`.venv/bin/pip install chatterbox-tts`).
- `scripts/my-voice.wav` exists (your reference voice clone, 15–30s clean speech).
- `ffmpeg` and `ffprobe` are on PATH.
- The `tts-narration-writer` skill is loaded. If you're collaborating with the agent, mention "use the tts-narration-writer skill" or ask about "Chatterbox narration" and it should auto-invoke.

---

## Workflow A — New Scene Narration

Use this when you've just built a new scene component (e.g. `src/scenes/MyAlgo.tsx`) and there's no narration yet.

### A1. Get the step structure first

You need the scene's step list before you can write narration. That comes from the `script-writer` skill — narration should never lead the step decomposition, because then you're writing words for animations that don't exist yet.

Open the scene file and read its `steps: SceneStep[]` array. Each step gives you a `caption` and a `highlightLines` range — these tell you what's visible on screen during that beat. Write one sentence per step that expands on the caption.

### A2. Draft the `*_lines` list

In `scripts/generate-narration-chatterbox.py`, find the block of `*_lines` definitions (around line 35–320). Add your new list following the existing pattern:

```python
my_algo_lines = [
    {"stepIndex": 0, "text": "Opening sentence — orients the viewer."},
    {"stepIndex": 1, "text": "Setup — what we're about to do."},
    # ... one entry per step ...
    {"stepIndex": 9, "text": "Wrap + CTA. Hit subscribe."},
]
```

Apply the skill's voice optimization checklist as you write — every number spelled out, every code reference spoken ("dot next", "O of n"), 5–12 words per sentence, present tense.

### A3. Register the scene

Add an entry to `ALL_NARRATIONS` at the bottom of the same file:

```python
ALL_NARRATIONS = [
    # ... existing entries ...
    {"sceneId": "my-algo", "lines": my_algo_lines},
]
```

The `sceneId` becomes the output directory: `public/narration/my-algo/step-N.mp3`.

### A4. Generate audio

```bash
.venv/bin/python scripts/generate-narration-chatterbox.py my-algo
```

First-time runs download ~1.5 GB and load the model (~30–45s). Subsequent runs reuse the cache. Each clip takes roughly 5–15 seconds on Apple Silicon MPS.

The script writes:

- `public/narration/my-algo/step-N.mp3` — one file per step
- `public/narration/my-algo/durations.json` — measured durations + frame counts
- A printed `startFrame:` suggestion table at the end

### A5. Listen to every clip

Don't skip this. Open the directory and play each clip in sequence:

```bash
open public/narration/my-algo
```

What to listen for, per clip:

- **Flat?** → bump `exaggeration` 0.1 and drop `cfg_weight` 0.1 (see Workflow B).
- **Rushed?** → drop both.
- **Mispronounced number or symbol?** → fix the *text*, not the knobs ("O of n" instead of "O(n)").
- **Weird emphasis?** → restructure the sentence (em-dash, sentence fragment) — knobs won't fix it.

### A6. Wire durations into the scene

After regenerating to your satisfaction, run the duration-applier:

```bash
.venv/bin/python scripts/apply-narration-updates.py my-algo
```

This patches `src/scenes/MyAlgo.tsx` `startFrame:` values, the `*_SCENE_FRAMES` constant, and the matching `*Durations` array in `src/data/narration-scripts.ts`. Don't compute these by hand — let the script do it.

---

## Workflow B — Finetuning an Existing Scene

Use this when narration exists but sounds wrong. The skill's value here is **diagnosis** — connecting what you hear to which knob (or which sentence) to change.

### B1. Diagnose by listening

Play the scene's clips back-to-back. Common symptoms and their root causes:

| Symptom | Likely root cause | Where to fix |
|---|---|---|
| Every clip sounds the same energy | No preset variation; flat 0.5 / 0.5 across the scene | Add a `*_presets` list with arc variation |
| Specific clip is monotonic | That clip's `exaggeration` too low for the beat | Bump that step's `exaggeration` 0.1, drop `cfg_weight` 0.1 |
| Specific clip is rushed / stressed | `exaggeration` too high without compensating `cfg_weight` drop | Lower `exaggeration`, *or* keep it and lower `cfg_weight` more |
| Clip stumbles on a number or symbol | Text issue, not voice issue | Edit the `text` — spell it out |
| Wrap-up sounds cheesy / oversold | `dramatic` preset on a CTA | Drop to `expressive` |
| Mid-scene loses momentum | Three calm steps in a row, no variation | Promote one mid step to `natural` or `expressive` |
| Whole scene sounds bot-read | Sentences too long | Restructure text — short fragments, em-dashes |

### B2. Worked example: `detect-cycle`

The existing narration already has good text. What it likely lacks is per-step preset variation — every clip currently uses the module-level `EXAGGERATION = 0.5` / `CFG_WEIGHT = 0.5`. Let's add an arc.

The scene's emotional shape:

- Steps 0–1: problem setup ("how do you even know if a list has a cycle?") — **natural**, curiosity
- Steps 2–6: algorithm walk (slow / fast pointer advances, comparisons) — **calm**, methodical
- Steps 7–8: discovery ("they meet!") — **dramatic**, this is the one peak
- Steps 9–10: counter-case (no cycle) — back to **calm**
- Steps 11–12: "why does this work" insight — **expressive**
- Step 13: CTA — **expressive** (not dramatic — see skill rule 4)

That maps to:

```python
detect_cycle_presets = [
    {"step": 0,  "preset": "natural",    "exaggeration": 0.5,  "cfg_weight": 0.5,  "temperature": 0.80},
    {"step": 1,  "preset": "natural",    "exaggeration": 0.5,  "cfg_weight": 0.5,  "temperature": 0.80},
    {"step": 2,  "preset": "calm",       "exaggeration": 0.35, "cfg_weight": 0.6,  "temperature": 0.75},
    {"step": 3,  "preset": "calm",       "exaggeration": 0.40, "cfg_weight": 0.55, "temperature": 0.78},
    {"step": 4,  "preset": "calm",       "exaggeration": 0.35, "cfg_weight": 0.6,  "temperature": 0.75},
    {"step": 5,  "preset": "calm",       "exaggeration": 0.40, "cfg_weight": 0.55, "temperature": 0.78},
    {"step": 6,  "preset": "calm",       "exaggeration": 0.45, "cfg_weight": 0.5,  "temperature": 0.80},
    {"step": 7,  "preset": "expressive", "exaggeration": 0.65, "cfg_weight": 0.4,  "temperature": 0.90},
    {"step": 8,  "preset": "dramatic",   "exaggeration": 0.75, "cfg_weight": 0.3,  "temperature": 0.95},
    {"step": 9,  "preset": "natural",    "exaggeration": 0.5,  "cfg_weight": 0.5,  "temperature": 0.80},
    {"step": 10, "preset": "calm",       "exaggeration": 0.4,  "cfg_weight": 0.55, "temperature": 0.78},
    {"step": 11, "preset": "expressive", "exaggeration": 0.6,  "cfg_weight": 0.4,  "temperature": 0.88},
    {"step": 12, "preset": "expressive", "exaggeration": 0.65, "cfg_weight": 0.4,  "temperature": 0.90},
    {"step": 13, "preset": "expressive", "exaggeration": 0.6,  "cfg_weight": 0.4,  "temperature": 0.88},
]
```

Note the discipline: only **step 8** uses dramatic (the moment they collide and we return true). Step 7 is the lead-in (expressive ramp). The CTA at 13 is expressive, not dramatic.

### B3. Surgical regeneration

Once `*_presets` is wired into `generate_speech()` (see "Wiring" below), regenerate only the steps that changed:

```bash
# Delete only the steps you want to redo
rm public/narration/detect-cycle/step-{7,8,11,12,13}.mp3

# Regenerate — existing files are skipped, only the deleted ones rebuild
.venv/bin/python scripts/generate-narration-chatterbox.py detect-cycle
```

The script's `if output_path.exists() and not force` guard makes this safe and fast. Add `--force` only when you genuinely want to overwrite everything.

### B4. A/B compare

Keep the previous version around while iterating:

```bash
cp -r public/narration/detect-cycle public/narration/detect-cycle.bak
# ... regenerate ...
# listen to both, pick winner
rm -rf public/narration/detect-cycle.bak  # or .bak2, .v3, etc.
```

---

## Wiring Presets Into the Script (One-Time Setup)

`scripts/generate-narration-chatterbox.py` currently has module-level constants:

```python
EXAGGERATION = 0.5
CFG_WEIGHT = 0.5
```

And `generate_speech()` passes those directly. Until this is changed, your `*_presets` lists are inert documentation — every clip gets the same flat voice.

The minimal patch: extend `ALL_NARRATIONS` entries to carry presets, then look them up by `stepIndex` inside the per-line loop. Something like:

```python
ALL_NARRATIONS = [
    {"sceneId": "detect-cycle", "lines": detect_cycle_lines, "presets": detect_cycle_presets},
    # ... etc
]

# Inside the per-line loop:
preset = next((p for p in narration.get("presets", []) if p["step"] == step_index), None)
exag = preset["exaggeration"] if preset else EXAGGERATION
cfg  = preset["cfg_weight"]   if preset else CFG_WEIGHT
temp = preset.get("temperature", 0.8) if preset else 0.8

wav = model.generate(
    text=text,
    audio_prompt_path=REFERENCE_WAV if REFERENCE_WAV else None,
    exaggeration=exag,
    cfg_weight=cfg,
    temperature=temp,
)
```

The fallback to `EXAGGERATION` / `CFG_WEIGHT` means scenes that don't yet have a `*_presets` list keep working unchanged.

Verify `temperature` is accepted by the base `ChatterboxTTS.generate()` signature before relying on it — peek at `.venv/lib/python3.12/site-packages/chatterbox/tts.py`. If it's not there, drop it from the call; the `exaggeration` / `cfg_weight` variance alone still does most of the work.

---

## Iteration Tactics

A few patterns that come up repeatedly when finetuning:

**The "paired" adjustment.** The README's pacing rule means you almost always change `exaggeration` and `cfg_weight` together, in opposite directions. Raising `exaggeration` alone makes a clip louder *and* faster, which usually sounds rushed. Pair it with a `cfg_weight` drop to keep the pacing. Single-knob nudges are rare.

**Temperature as a tiebreaker, not a primary lever.** If a clip is *almost* right but slightly stiff, bump `temperature` by 0.05 before touching the other two. It's a subtler dial.

**Fix text before knobs.** If a clip stumbles, mispronounces, or has weird stress, the answer is almost always rewriting the sentence — not turning a knob. Spell out the symbol. Break the sentence at an em-dash. Drop the comma that's making it pause weirdly.

**Reset the seed if a clip is just unlucky.** Chatterbox sampling is stochastic. Sometimes a clip just gets a bad roll. Delete it and regenerate — if the second try is dramatically better with the *same* preset, that was the issue.

**Don't chase perfection per clip.** The scene plays in context. A clip that sounds slightly flat on its own often works fine after a more emphatic neighbor. Listen to the whole scene back-to-back before retuning any single clip.

---

## When to Stop

You're done when:

- Listening to the full scene start-to-finish, no individual clip pulls your attention for the wrong reason.
- The arc is audible — the discovery beat sounds different from the methodical beats.
- The CTA doesn't sound like a used-car ad.
- `durations.json` is up to date and `apply-narration-updates.py` has patched the scene file.

Then commit the `public/narration/<sceneId>/*.mp3` files (yes, they go in git — they're the source of truth that `NarrationLayer.tsx` reads), the updated scene `.tsx`, the updated `narration-scripts.ts`, and your new `*_presets` list in `generate-narration-chatterbox.py`.
