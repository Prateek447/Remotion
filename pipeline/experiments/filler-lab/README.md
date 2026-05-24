# Filler Lab — empirically test Chatterbox filler rendering

## Two scripts

| Script | When to use |
|---|---|
| `lab.py` | **Initial discovery**: 34 variants across 5 categories. Run ONCE per filler to find which spellings sound natural at all. |
| `repro.py` | **Reliability gate**: After `lab.py` identifies a winner, run it N times to verify the natural sound reproduces consistently (not a one-time happy generation). |

## Final findings (post real-world listening)

| Variant | lab.py | repro.py (5 takes) | Real-world listening | Verdict |
|---|---|---|---|---|
| `Hmm` / `Hmmm` | ✅ natural | ⚠ 4/5 at temp 0.95 | ❌ "sometimes works, sometimes doesn't — i do not understand" | ❌ **DROPPED** — lab reliability didn't translate to production. Replaced by `But [pause:Xs]` for the same emotional moment (base-case surprise). |
| `Ummmm` | ✅ natural (1 take) | ❌ 0/5 at temp 0.95 | — | ❌ **DROPPED** — initial natural take was a fluke |
| `Mmmmm` | ✅ natural (1 take) | ❌ 0/5 at temp 0.95 | — | ❌ **DROPPED** — same |
| `Um` (single m) | ❌ reads literally | — | — | ❌ Dropped before repro |
| `Ah` | ❌ reads literally | — | — | ❌ Dropped before repro |

**Final conclusion**: NO non-word filler reliably produces natural speech in base Chatterbox. All variants tested (`Um`, `Ah`, `Hmm`, `Hmmm`, `Ummmm`, `Mmmmm`) either read literally as words or render inconsistently across generations. This is consistent with [Issue #97](https://github.com/resemble-ai/chatterbox/issues/97) — the short-segment hallucination failure mode.

## The production pattern that replaced fillers

**The connector-pause pattern** — a real-English connector word followed by `[pause:Xs]` silence-splicing. The connector primes the listener for the type of thought coming; the silence delivers the thinking beat. Real-English connectors render fine in Chatterbox because they don't trigger the short-segment failure mode.

| Replaces (rejected filler) | Connector-pause replacement |
|---|---|
| `Um —` (effort, pre-arithmetic) | `So, [pause:0.6]` |
| `Hmm —` (curiosity, base-case surprise) | `But [pause:0.6]` |
| `Ah,` (realization, pre-reveal) | `[pause:0.5]` or `And [pause:0.5]` |
| `Well,` (measured nuance — works as a word) | Kept; `Well, [pause:0.5]` |

Full connector vocabulary: `So` / `And` / `But` / `Now` / `Then` / `And then` / `And that` / `Okay` / `Right` / `Well`. See `pipeline/design-system/teaching.md` "Natural prosody — the connector-pause pattern" for placement rules and the per-persona vocabularies in `pipeline/design-system/voice/personas/*.md`.

## The lesson

Lab reliability (4/5 at a single bench) is not the same as production reliability (works across all generations in real scenes). The `Hmm` decision shows this: 80% reliability in a controlled 5-take test felt like an acceptable trade-off; in real-world listening across many step generations, that 20% misfire rate was noticeable and frustrating ("sometimes works, sometimes doesn't").

The empirical principle this experiment landed on: **for prosody, prefer deterministic mechanisms (silence-splicing) over probabilistic ones (model rendering of unusual words)**. The pipeline now treats all model-rendered prosody (ellipses, em-dashes, non-word fillers) as nice-to-have; the load-bearing tool is `[pause:Xs]` paired with real-English connectors.

## The scripts (`lab.py`, `repro.py`)

Kept in place for future investigations — e.g. if a new Chatterbox version, new reference voice, or new persona changes the picture. `repro.py`'s VARIANTS list is currently `Hmm`/`Hmmm`/`Hmmmm` from the final attempted stabilization run; update it before any new experiment.

## What this is

A focused experiment: does Chatterbox render `Um` as the natural elongated filler sound ("ummmmm"), or does it read the literal word "um"? We don't know until we listen. This lab generates one MP3 per filler-spelling variant against the same sentence template, so you can compare them side by side.

## Why it exists

The "Natural prosody" enhancement (`pipeline/design-system/teaching.md`) prescribed a filler vocabulary: `Um` for effort, `Ah` for realization, `Hmm` for curiosity, etc. First audio test revealed Chatterbox speaks `Um` literally. The placement theory may still be right, but the **spellings are provisional pending empirical results**.

This lab unblocks the design system: once you know which spellings produce natural filler sounds, those become the locked-in vocabulary.

## Usage

```bash
# Run everything (~10-15 min Chatterbox compute, ~30 variants)
python3 pipeline/experiments/filler-lab/lab.py

# Run only one category
python3 pipeline/experiments/filler-lab/lab.py --only um
python3 pipeline/experiments/filler-lab/lab.py --only ah
python3 pipeline/experiments/filler-lab/lab.py --only hmm
python3 pipeline/experiments/filler-lab/lab.py --only orientation
python3 pipeline/experiments/filler-lab/lab.py --only pause

# Test under a different persona/arc's knobs
python3 pipeline/experiments/filler-lab/lab.py --persona measured --arc methodical

# Force regenerate (default: skip existing)
python3 pipeline/experiments/filler-lab/lab.py --force
```

Output lands in `pipeline/experiments/filler-lab/output/NN-<label>.mp3`. Files are named with leading numbers so listening in alphabetical/numerical order keeps related variants adjacent.

## Categories

| Category | What it tests |
|---|---|
| `um` | `Um` / `Umm` / `Ummmm` / `Uh` / `Uhhh` / `Mmm` / `Mmmmm` / pause-only / em-dash-only — which produces natural effort/hesitation? |
| `ah` | `Ah` / `Ahh` / `Ahhh` / `Aha` / `Oh` / `Ooh` / `Yes` / pause-only — which lands as authentic realization at a peak? |
| `hmm` | `Hmm` / `Hmmm` / `Hmmmm` / pause-only / `Wait` — which signals curiosity at a base case? |
| `orientation` | `Okay` / `Right` / `Alright` / `So` / `Now` — which opener feels most natural? |
| `pause` | Pure pause/punctuation variants (no filler words) — control group. Sometimes the right answer is no filler. |

Each variant uses the **same surrounding sentence** within a category so the only audible difference is the filler spelling itself.

## Knob configuration

By default the lab runs at `teacher-energetic` `peak` knobs (the heaviest prosody — `exaggeration=0.80`, `cfg_weight=0.40`, `temperature=0.95`). Override with `--persona` / `--arc` to test under any preset.

Knob values match `pipeline/stages/05-audio/generate.py` exactly, so lab results are representative of real-pipeline audio.

## How to identify winners

For each category, listen to all variants in order. For each one ask:

1. **Did Chatterbox say the word literally?** (e.g. you heard "um" said as a one-syllable word) → not a winner.
2. **Did Chatterbox produce a natural elongated sound?** (e.g. you heard "ummmm" as a filler) → candidate winner.
3. **Did it sound performed / theatrical?** (e.g. exaggerated for cartoony effect) → not a winner, even if "natural" — we want subtle.
4. **Compared to the pause-only variant**: does the filler add something the pause didn't? If the pause sounds better, the filler is wrong.

Pick **one winner per category** (or "none — pause-only is best"). Report back, and the winners get locked into `pipeline/design-system/teaching.md` "Natural prosody" filler vocabulary + the persona docs.

## Propagating findings

After winners are identified:

1. Update `pipeline/design-system/teaching.md` filler vocabulary table — replace provisional spellings with empirical winners (or remove a filler if pause-only wins).
2. Update `pipeline/design-system/voice/personas/teacher-energetic.md` and `measured.md` prosody vocabularies.
3. Update `pipeline/scenes/count-tree-nodes.yaml` narration to use the winning spellings.
4. Update `pipeline/stages/03-narration/preview.py` `FILLERS` set if the winning spellings differ from the current set (`okay`, `right`, `um`, `ah`, `hmm`, `so`, `now`, `well`).

The lab itself stays in the repo for future filler experiments (e.g., when adding a new persona or testing a new reference voice).

## Adding new variants

Edit the `EXPERIMENTS` list in `lab.py`. Each entry is `(category, label, full_sentence)`. Keep the surrounding sentence identical across a category — only the filler spelling should vary, or you can't isolate the effect.

## Reproducibility (`repro.py`)

After `lab.py` identifies a winner, `repro.py` tests whether it reproduces reliably. TTS at high temperature (the peak preset uses 0.95) is non-deterministic — a single natural-sounding take might be a happy fluke. Production use requires consistent rendering.

### Usage

```bash
# Default: 5 takes per shortlisted variant at teacher-energetic peak knobs
python3 pipeline/experiments/filler-lab/repro.py

# More takes for tighter reliability signal
python3 pipeline/experiments/filler-lab/repro.py --takes 10

# If marginal at default temp, test lower temperatures
python3 pipeline/experiments/filler-lab/repro.py --temperature 0.85
python3 pipeline/experiments/filler-lab/repro.py --temperature 0.75
```

Output lands in `pipeline/experiments/filler-lab/repro-output/<variant>-tNN-take-MM.mp3` (NN = temperature × 100, MM = take number). The temperature tag in the filename means you can run at multiple temperatures without overwriting earlier results.

### Reliability bar

**5/5 takes consistent = ship it.** A single literal-reading failure in 5 takes is a 20% failure rate — unacceptable for production where this filler appears across many scenes.

Decision tree per variant:

| Result | Action |
|---|---|
| 5/5 natural | ✅ Lock into design system at current knobs |
| 4/5 natural | ⚠ Marginal. Re-run at temperature 0.85 to see if it stabilizes to 5/5 |
| 3/5 or fewer natural | ❌ Drop the variant; or test at temperature 0.75 (sacrifices some naturalness for reliability) |
| `Hmm` baseline fails reliability | The temperature is too high regardless of filler. Lower the global preset. |

### Shortlisted variants

Currently testing in `repro.py`:

1. `ummmm` — "Node four combines. Ummmm — one plus zero plus zero… returns one."
2. `mmmmm` — "Node four combines. Mmmmm — one plus zero plus zero… returns one."
3. `hmm` — "Node four combines. Hmm — one plus zero plus zero… returns one." (baseline)

To add more variants for reproducibility testing, edit the `VARIANTS` list at the top of `repro.py`.

## Cleanup

`pipeline/experiments/filler-lab/output/*.mp3` and `repro-output/*.mp3` files are not tracked in git (assumed gitignored — verify locally). Safe to delete after winners are locked into the design system.
