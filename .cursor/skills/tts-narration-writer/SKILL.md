---
name: tts-narration-writer
description: Write TTS narration text and per-step voice presets for the base (non-Turbo) Chatterbox model. Covers prosody-as-emotion (since paralinguistic tags don't render), the exaggeration / cfg_weight / temperature knob set, and the per-step preset table that drops into `scripts/generate-narration-chatterbox.py`. Use when writing a voice script for a new scene, picking per-step Chatterbox parameters, fixing flat or monotonic narration, or translating an emotional arc into base-Chatterbox-readable text.
---

# TTS Narration Writer (Base Chatterbox)

Every narration line is a **standalone audio clip** read by base Chatterbox. The model cannot read paralinguistic tags — it pronounces `[chuckle]` as the literal English word. Emotion has to live in the **words and punctuation**, with the per-clip knobs shaping prosody on top.

This skill is the sibling of `script-writer`. Script-writer decides what each step *shows*. This skill decides what each step *says* and how it's voiced.

---

## Hard Constraints — Why We're on Base, Not Turbo

We abandoned Turbo after extensive testing. Three constraints carry over and shape every rule below:

1. **No paralinguistic tags.** On the base model `[gasp]`, `[chuckle]`, `[laugh]`, `[sigh]` get spoken as the literal English words. Do not write them. (Turbo *could* render them at specific positions — see `scripts/CHATTERBOX_TURBO_NOTES.md` — but we're not on Turbo.) Emotion comes from prosody cues written into the sentence.
2. **Per-clip emotion variance DOES work on base.** `exaggeration`, `cfg_weight`, and `temperature` are real per-`generate()` levers on the base model, unlike Turbo where they're ignored when conditionals are cached. This is the entire reason to be back on base.
3. **No 300-character training cap.** Base handles long narration without going monotonic, so we do not need to pre-chunk for naturalness. Chunking at sentence boundaries is optional, used only for cadence reset on long beats.

The deliverable: a `*_lines` list of step texts and a parallel `*_presets` list of per-step knob settings. Both drop into `scripts/generate-narration-chatterbox.py`.

---

## The Three Knobs

The base `ChatterboxTTS.generate()` signature accepts these and they all change output per call:

| Knob | Useful range | What it does | README guidance |
|---|---|---|---|
| `exaggeration` | 0.25 – 1.0+ | Emotion intensity. Higher = more affect, also speeds up speech. | Default 0.5. Push to ~0.7+ for dramatic. |
| `cfg_weight` | 0.0 – 1.0 | Classifier-free guidance. Lower = looser, more like reference voice and slower pacing; higher = stricter text following. | Default 0.5. Lower to ~0.3 to compensate for the speed-up that high `exaggeration` causes, or for faster-delivery reference voices. |
| `temperature` | 0.7 – 1.0 | Sampling sharpness. Lower = deterministic and flat; higher = lively and varied. | Not addressed in README's original tips. Project convention from Turbo work: ~0.75 calm, ~0.88 natural, ~0.95+ peaks. |

Critical interaction the README spells out: **"Higher `exaggeration` tends to speed up speech; reducing `cfg_weight` helps compensate with slower, more deliberate pacing."** Treat them as a paired control — when you raise one, consider the other.

---

## Preset Map for DSA Narration

Map each step's emotional intent to a preset. Only the bold rows are quoted verbatim from the README — Calm and Expressive are interpolations following the README's pacing principle.

| Preset | When to use | `exaggeration` | `cfg_weight` | `temperature` |
|---|---|---|---|---|
| Calm / methodical | Algorithm walks, pointer advances, comparisons | 0.35 | 0.6 | 0.75 |
| **Natural** *(README default)* | Default narration, transitions, setup beats | **0.5** | **0.5** | 0.80 |
| Expressive | Aha moments, key insights, "this is the cool part" | 0.65 | 0.4 | 0.90 |
| **Dramatic** *(README recommendation)* | One big reveal or complexity payoff per scene | **0.7+** | **~0.3** | 0.95 |

Sources: Natural and Dramatic come from the [Original Chatterbox Tips](https://github.com/resemble-ai/chatterbox#tips) on the repo README. Calm and Expressive are derived using the README's principle (lower exaggeration / higher cfg_weight = slower, flatter; higher exaggeration / lower cfg_weight = faster, more affected). Temperature recommendations come from the empirical Turbo work in `scripts/CHATTERBOX_TURBO_NOTES.md` — base accepts the same arg.

---

## Replacing Tags With Prosody

Tags don't render on base. Everything we used to get from `[gasp]` etc. now comes from **how the sentence is written**. This is the central craft of the skill.

| Effect we wanted via tags | Prosody substitute | Example |
|---|---|---|
| `[gasp]` (surprise / aha) | Em-dash + emphasis word + exclamation | "And there it is — null!" |
| `[chuckle]` (light / clever) | Em-dashed aside, or "Honestly," / "Look," opener | "Honestly, that's the whole trick." |
| `[sigh]` (frustration / hard problem) | Hesitation marker + ellipsis | "Hmm… now what?" |
| `[laugh]` (wrap / sign-off) | Casual sign-off phrasing | "And that's it — seriously." |

### Other prosody levers

- **Em-dashes (`—`)** force a brief pause — great for setting up emphasis or interjecting an aside.
- **Ellipses (`…`)** signal hesitation or a trailing thought. Use sparingly; one per step max.
- **Short interjections** ("Right.", "Okay.", "Hmm.") at the start of a clause create rhythm shifts.
- **Sentence fragments** ("Done.", "Clean.", "That's it.") break monotony after longer sentences.
- **Capitalization for stress** does *not* work — Chatterbox ignores it. Use word choice and punctuation instead.
- **Spelling-out numbers and code** is non-negotiable for TTS fluency:
  - "thirty-five" not "35"
  - "three, seven, nine" not "3, 7, 9"
  - "O of n" not "O(n)"
  - "dot next" not ".next"
  - "n plus one" not "n+1"

---

## Per-Step Script Format

The skill's output is two parallel lists that drop into `scripts/generate-narration-chatterbox.py` unchanged. The existing file already contains the `*_lines` slots; the `*_presets` lists are new and the script needs a tiny addition to read them (see "Wiring presets into the script" at the bottom).

```python
search_node_lines = [
    {"stepIndex": 0, "text": "Alright, here's our linked list. Three, seven, nine, five. Four nodes, all connected."},
    {"stepIndex": 1, "text": "We want to find the value nine. But there's no shortcut — we have to check each node, one at a time."},
    {"stepIndex": 2, "text": "Curr starts at head. Three is not nine. Move forward. Seven is not nine. Move forward."},
    {"stepIndex": 3, "text": "And there it is — nine! We return true. O of n, worst case. That's the whole story."},
]

search_node_presets = [
    {"step": 0, "preset": "natural",    "exaggeration": 0.5,  "cfg_weight": 0.5, "temperature": 0.80},
    {"step": 1, "preset": "calm",       "exaggeration": 0.35, "cfg_weight": 0.6, "temperature": 0.75},
    {"step": 2, "preset": "calm",       "exaggeration": 0.40, "cfg_weight": 0.55,"temperature": 0.78},
    {"step": 3, "preset": "expressive", "exaggeration": 0.65, "cfg_weight": 0.4, "temperature": 0.90},
]
```

Read this example carefully. Step 0 is orientation (natural). Steps 1–2 are methodical algorithm walking (calm — flatter, more deliberate). Step 3 is the find + wrap (expressive — the one emotional peak). No step uses dramatic, because this is a small scene and dramatic would feel oversold. The text changes shape too: short fragments and "move forward" repetition in the calm middle, em-dash + exclamation at the peak.

---

## Voice Optimization Checklist for DSA Content

Apply this to every new scene. Most of it is about variation — flat presets across a scene sound flat regardless of how high you crank them.

1. **Per-step emotional arc.** Every scene has a curiosity → analysis → discovery → wrap shape. Map presets onto that arc. Do not use the same preset for every step.
2. **Vary `exaggeration` across the scene.** Range across roughly 0.35–0.85. A constant value reads as monotonic at any level.
3. **One emotional peak per scene, not three.** Reserve `dramatic` for the single biggest moment. If you use it on every step, nothing is dramatic.
4. **Open and close calm-ish.** First step is orientation — use `natural`. Last step is takeaway + CTA — use `expressive`, not `dramatic`. Dramatic on a CTA reads as cheesy.
5. **Spell out all code.** "head dot next", "curr dot next dot val", "O of one", "n minus i minus one". Punctuation gets pronounced — write commas as pause cues, not as code syntax.
6. **Numbers as words.** "thirty-five" not "35". "Three, seven, nine" not "3, 7, 9".
7. **5–12 words per sentence.** Break longer thoughts at em-dashes or periods. Short sentences sound natural; long sentences sound bot-read.
8. **Present tense.** "We point new node dot next to head", not "We will point".
9. **Name the concrete value, not the abstract reference.** "Point next to three" beats "Point next to head" — the listener tracks the value, not the variable.
10. **~3 words per second** is the natural TTS pace. Use that for duration budgeting before generation.

---

## How to Use This Skill

1. Start from the scene's step structure produced by the `script-writer` skill. You should already have a list of steps, each with a one-line caption and the diagram action it covers.
2. For each step, sketch one sentence of narration in the caption's voice — present tense, concrete values, short. Match the optimization checklist above as you write.
3. Map each step to a preset (`calm` / `natural` / `expressive` / `dramatic`) based on the emotional arc. The first step is `natural`, the last is `expressive`, the middle methodical steps are `calm`, and one (and only one) peak gets `dramatic` if the scene has a payoff that earns it.
4. Replace any instinct to write `[gasp]`, `[sigh]`, etc. with the prosody substitutes from the table. Read each line aloud once — if it sounds like a paragraph of email, rewrite it shorter.
5. Emit two parallel lists: `<scene>_lines` (text) and `<scene>_presets` (per-step knob values).
6. Paste both lists into `scripts/generate-narration-chatterbox.py` next to the other scene narrations. Register the scene in the `ALL_NARRATIONS` list at the bottom.
7. Run `.venv/bin/python scripts/generate-narration-chatterbox.py <sceneId>` to generate `public/narration/<sceneId>/step-N.mp3`. Listen to each clip.
8. If a clip is flat: bump `exaggeration` by 0.1 *and* drop `cfg_weight` by 0.1 (paired). If it's rushed: lower both. Regenerate only that step with `--force`.

---

## Wiring Presets Into the Existing Script

`scripts/generate-narration-chatterbox.py` currently uses module-level `EXAGGERATION = 0.5` and `CFG_WEIGHT = 0.5` for every clip. To honor `*_presets`, change the per-step call in `generate_speech()` to read from the preset for that `stepIndex`, falling back to the module defaults if no preset entry exists. The lists and their alignment by `stepIndex` are the skill's deliverable — the script change is a one-time plumbing fix, not part of every scene.

If the script hasn't been updated yet, the `*_lines` list still works on its own (you'll just get the flat 0.5 / 0.5 voice for every step until the presets are wired in).

---

## Checklist for a New Scene Narration

- [ ] One line per step, every step covered
- [ ] No `[bracket-tags]` anywhere in the text
- [ ] All numbers spelled as words ("three" not "3")
- [ ] All code references spoken ("dot next", "O of n")
- [ ] No sentence longer than 12 words
- [ ] Every step has a preset assigned in the `*_presets` list
- [ ] At least three different presets used across the scene
- [ ] At most one step uses `dramatic`
- [ ] First step is `natural`, last step is `expressive`
- [ ] Read aloud — sounds like a person, not a slide deck
- [ ] Both lists pasted into `scripts/generate-narration-chatterbox.py`
- [ ] Scene registered in `ALL_NARRATIONS`
