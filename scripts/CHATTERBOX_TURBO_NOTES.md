# Chatterbox-Turbo Reference Notes

Operational notes for using `ChatterboxTurboTTS` (from `chatterbox-tts` 0.1.7,
class `chatterbox.tts_turbo.ChatterboxTurboTTS`) for DSA / algorithm-explainer
narration in this project.

Sources of truth — read these if the API changes:

- Installed source: `.venv/lib/python3.12/site-packages/chatterbox/tts_turbo.py`
- Official demo: <https://huggingface.co/spaces/ResembleAI/chatterbox-turbo-demo>
  (file: `app.py` — defines the slider ranges and tag list users see)
- Repo: <https://github.com/resemble-ai/chatterbox>

---

## When to use Turbo vs base ChatterboxTTS

| Need | Use |
|---|---|
| Inline paralinguistic tags (`[gasp]`, `[chuckle]`) rendered as non-verbal vocalizations | **Turbo** |
| Per-clip `exaggeration` / `cfg_weight` variance | **Base** |
| Faster MPS throughput (~2× sampling speed) | **Turbo** |
| Long-form (300+ char) utterances | **Base** (Turbo trained on shorter inputs) |
| Default for DSA narration in this repo | **Turbo, chunked** — see chunking section below |

The chunked-Turbo approach gives us both expressive tag rendering AND
naturalness across long DSA scenes by splitting each step's text into short
utterances Turbo handles well.

---

## `ChatterboxTurboTTS.generate()` — full signature

```python
generate(
    text: str,
    repetition_penalty: float = 1.2,
    min_p: float = 0.00,           # IGNORED with cached conds — see "Dead args"
    top_p: float = 0.95,
    audio_prompt_path: str | None = None,
    exaggeration: float = 0.0,     # IGNORED with cached conds — see "Dead args"
    cfg_weight: float = 0.0,       # IGNORED with cached conds — see "Dead args"
    temperature: float = 0.8,
    top_k: int = 1000,
    norm_loudness: bool = True,    # IGNORED with cached conds — see "Dead args"
)
```

### What each knob actually does

| Param | Range (per demo) | Default | Effect | Honored on Turbo? |
|---|---|---|---|---|
| `temperature` | 0.05 – 2.0 | 0.8 | Sampling sharpness. Lower = deterministic, higher = lively/random | ✅ |
| `top_p` | 0.00 – 1.00 | 0.95 | Nucleus sampling cutoff | ✅ |
| `top_k` | 0 – 1000 | 1000 | Top-K sampling cutoff (0 disables) | ✅ |
| `repetition_penalty` | 1.00 – 2.00 | 1.2 | Discourage repeated tokens | ✅ |
| `min_p` | 0.00 – 1.00 | 0.00 | Min-probability token filter | ⚠ See below |
| `exaggeration` | n/a in demo | 0.0 | Emotion intensity scalar | ⚠ See below |
| `cfg_weight` | n/a in demo | 0.0 | Classifier-free guidance | ⚠ See below |
| `norm_loudness` | toggle | True | Normalize reference to -27 LUFS | ⚠ See below |

### Dead args when using cached conditionals

This is the **single most important Turbo gotcha**. The `generate()` source:

```python
if audio_prompt_path:
    self.prepare_conditionals(audio_prompt_path, exaggeration=..., norm_loudness=...)
else:
    assert self.conds is not None, "Please prepare_conditionals first"

if cfg_weight > 0.0 or exaggeration > 0.0 or min_p > 0.0:
    logger.warning("CFG, min_p and exaggeration are not supported by Turbo version and will be ignored.")
```

When you preload conditionals once (`model.prepare_conditionals(ref_wav)`)
and then call `generate(text=...)` without passing `audio_prompt_path`:

- **`exaggeration`** in `generate()` is ignored. The only way to bake in an
  emotion baseline is to pass `exaggeration=X` to `prepare_conditionals()` —
  and even then, the conditional carries `emotion_adv = X * ones(1,1,1)` but
  `inference_turbo` doesn't appear to read it (empirically: setting baseline
  to 0.85 produces byte-identical output to 0.5 under the same seed).
- **`norm_loudness`** in `generate()` is ignored. It only takes effect when
  `audio_prompt_path` is supplied (which triggers `prepare_conditionals` to
  run on every call — slow). Conclusion: loudness normalization is a
  property of the *cached reference encoding*, not the per-clip output.
- **`cfg_weight`** is ignored unconditionally on Turbo.
- **`min_p`** is ignored unconditionally on Turbo.

**Verified empirically**: same text + same seed + different `baseline_exag`
and `norm_loudness` flags → byte-identical mp3.

### Real per-clip levers on Turbo

Only four params change Turbo output between calls when conditionals are cached:

1. `text` (including tags)
2. `temperature`
3. `top_p`
4. `top_k`
5. `repetition_penalty`
6. RNG seed

Plan your variance around those.

---

## Paralinguistic tags

### Official tag list (9 tags)

From the ResembleAI demo's `EVENT_TAGS`:

```python
[clear throat]   [sigh]    [shush]
[cough]          [groan]   [sniff]
[gasp]           [chuckle] [laugh]
```

Bracket-tagged tokens outside this list may or may not work — undocumented.
Pass them through verbatim and ear-test.

### Empirically validated position support

Run on 2026-05-23 against this repo's `scripts/my-voice.wav` clone with
`seed=42, temperature=0.92, top_p=0.95, top_k=1000` using
`scripts/poc-tag-matrix-full.py`. Each cell is a confirmed ear-test: ✅ =
tag is audible at that position, ❌ = silently dropped.

| Tag | solo | prefix | mid | suffix |
|---|---|---|---|---|
| `[chuckle]` | ✅ | ❌ | ❌ | ❌ |
| `[clear throat]` | ✅ | ✅ | ✅ | ❌ |
| `[cough]` | ❌ | ❌ | ❌ | ✅ |
| `[gasp]` | ❌ | ✅ | ❌ | ❌ |
| `[groan]` | ✅ | ❌ | ❌ | ❌ |
| `[laugh]` | ✅ | ✅ | ✅ | ❌ |
| `[shush]` | ✅ | ✅ | ✅ | ✅ |
| `[sigh]` | ✅ | ❌ | ❌ | ✅ |
| `[sniff]` | ✅ | ✅ | ✅ | ✅ |

Position definitions (within a single chunk's text):

- **solo**: the chunk text is literally just the tag — `"[laugh]"`
- **prefix**: tag opens the chunk — `"[gasp] And there it is — null."`
- **mid**: tag in the middle — `"And there it is [laugh] — null."`
  (validated specifically between em-dashed clauses)
- **suffix**: tag at chunk-end before final punctuation — `"...— null [sigh]."`

Important caveats:

- **Mid position was validated only with em-dash-flanked context.** A tag
  followed by `…` (ellipsis) instead of `—` (em-dash) seems to behave like
  prefix-of-next-clause rather than true mid — different rules may apply.
  When in doubt, prefer solo.
- **Duration alone is not a reliable rendering signal.** Earlier hypothesis
  ("longer audio = rendered") proved false: a working `[gasp]` suffix
  actually came in *shorter* than the no-tag control because the model
  compresses carrier speech to make room. Trust ears, not ffprobe.
- **Per-voice variance probable.** The matrix above is specific to
  `scripts/my-voice.wav` + seed 42. A different reference clip or seed may
  produce different working positions. Re-run `poc-tag-matrix-full.py` if
  the reference changes.

### DSA narration palette

Subset of the 9 tags suited to algorithm explainer content:

| Tag | DSA use case | Recommended position |
|---|---|---|
| `[gasp]` | Discovery / "aha" — base case found, cycle detected | **prefix** (only position that works) |
| `[chuckle]` | Clever / elegant insights — code that "just works" | **solo** (only position that works) |
| `[sigh]` | Frustration / dead end — humanise hard problems | **solo** or **suffix** |
| `[laugh]` | Wrap-ups, sign-offs, light moments | **solo** (safest; prefix/mid also work) |

Tags reserved for character voiceover (not DSA): `[clear throat]`,
`[shush]`, `[cough]`, `[groan]`, `[sniff]`.

### Universal safe pattern: solo standalone chunks

If you don't want to track per-tag position rules, **always use solo
chunks**. The chunk text is the tag alone. The 250 ms inter-chunk silence
provides natural framing. The only DSA tag this breaks for is `[gasp]`,
which needs prefix instead.

```python
# Sigh as solo chunk between two ideas
chunks = [
    "But forty doesn't even have a left child.",
    "[sigh]",
    "What do we do now?",
]

# Gasp as prefix in the chunk it reacts to
chunks = [
    "[gasp] And there it is — null. That's the base case.",
]
```

### Other rules of thumb

- **At most one tag per chunk**. Stacking dilutes the effect.
- **No tags in the very first chunk of a scene** — opening narration
  benefits from a clean conversational tone. Closing solo `[laugh]` as
  sign-off is fine.
- **If a tag isn't audibly rendering, switch to its solo form** (when
  available per the matrix). That's the most reliable fix.

---

## The 300-character training cap

The demo enforces `max chars 300` on its input textbox. Inputs much longer
than this drift out of distribution and tend to sound monotonic — the model
appears trained on conversational utterance lengths, not narration
paragraphs.

Quick audit of our DSA narration:

```bash
# Steps that exceed 300 chars in BST insert:
#   step 0 — 473 chars (hook + setup)
#   step 6 — 306 chars (key insight)
#   step 15 — 361 chars (wrap + complexity + CTA)
```

**Strategy: pre-chunk every step at sentence/clause boundaries to ≤200 chars
per chunk.** This keeps Turbo inside its training window and resets prosody
at each utterance — both naturalness wins.

---

## Chunking strategy for DSA content

### Where to split

DSA narration has natural break points the chunker should preserve:

1. **Sentence boundaries** (`. `, `! `, `? `) — primary split
2. **Em-dash interjections** (` — `) — when used as "but wait, here's the thing"
3. **Phase markers** ("Step one.", "Alright,", "Now watch carefully.") — high-priority split
4. **List separators** ("First… second… third…") — preserve as separate chunks

### Where NOT to split

- Inside code-spoken phrases ("curr dot next dot val") — keep as one unit
- Inside numeric sequences ("three, seven, nine, five") — keep together
- Mid-clause when the comma is non-final ("the value, which is three, …")
- Right before a tag ("the base case [gasp]") — keep tag with its trigger phrase

### Target sizes

- Aim for **40–200 chars per chunk**
- Hard cap: 300 chars (the training cap)
- Allow short chunks (≤30 chars) for emphatic single-sentence beats

### Inter-chunk silence

**250 ms** between chunks within a single step.

- Long enough that Turbo's prosody resets, the model "breathes"
- Short enough that the listener hears one continuous narration

Generated with ffmpeg `lavfi anullsrc=r=24000:cl=mono`. Stitched together via
`ffmpeg -f concat`.

---

## Reproducibility & seeds

`generate()` does not accept a `seed` arg. We set RNG externally before each
clip:

```python
def set_seed(s):
    import random, numpy, torch
    random.seed(s); numpy.random.seed(s); torch.manual_seed(s)
    if torch.cuda.is_available(): torch.cuda.manual_seed_all(s)
```

Under MPS, even with a fixed seed, runs can be **near-identical but not
bit-identical** because some kernels use atomics. Treat seed as a "look
similar" knob, not a "byte-identical" one.

Recommended: pick a seed per scene and reuse it for regenerations of
individual steps so the voice stays consistent across iterations.

---

## Performance characteristics (Apple Silicon, MPS)

| Operation | Time |
|---|---|
| First-time model download | ~2 min (1.5 GB from HF) |
| Model load from disk | ~30–45 s |
| `prepare_conditionals()` from a 30s reference wav | ~5–10 s |
| `generate()` per chunk (100-char text) | ~10–25 s |
| `generate()` per chunk (300-char text) | ~30–60 s |
| Full bst-insert scene (16 steps, ~40 chunks) | ~15–25 min |

Throttling: long contiguous generation can throttle MPS. If you see
`Sampling` it/s drop below ~5 it/s for sustained periods, cool the machine
or run smaller batches.

---

## Voice cloning — reference clip guidance

The clone fidelity is bottlenecked by the reference recording. For
algorithm explainer voice in this repo (`scripts/my-voice.wav`):

- **Length**: 15–30 s of clean speech. Demo recommends >5 s, asserts in
  `prepare_conditionals`.
- **Content**: Match the target speaking style. If the production
  narration is conversational ("So, a linked list…"), record the reference
  conversationally — not formally.
- **Avoid**: background noise, music, multi-speaker clips, microphone
  pops, breathing too close to the mic.

`norm_loudness=True` (default) auto-normalizes the reference to -27 LUFS
during `prepare_conditionals`. Leave it on unless you have a specific
reason to preserve original dynamics.

---

## Pipeline integration with Remotion

Each scene step in the Remotion compositions corresponds to exactly one
file: `public/narration/<sceneId>/step-N.mp3`.

The Turbo chunked workflow produces those files unchanged:

```
public/narration/bst-insert/
  step-0.mp3      ← concatenation of chunks 0-a, 0-b, 0-c, 0-d, 0-e, 0-f
  step-1.mp3      ← concatenation of chunks 1-a, 1-b
  ...
  step-15.mp3
  durations.json  ← measured durations of the concatenated mp3s
```

`durations.json` mirrors what `NarrationLayer.tsx` reads from
`narrationDurationsByScene` in `src/data/narration-scripts.ts`. After
generating audio, run `scripts/apply-narration-updates.py <sceneId>` to:

- Patch the scene `.tsx` file's `startFrame:` values
- Patch the `*_SCENE_FRAMES` constant
- Update the corresponding `*Durations` array in `narration-scripts.ts`

---

## Quick reference: optimal Turbo params for DSA narration

These are the settings landed after the bst-insert step-5 A/B comparison.

```python
# Defaults for a "natural conversational explainer" feel
TURBO_DEFAULTS = dict(
    temperature=0.88,        # mid-range — clarity without monotony
    top_p=0.95,              # matches demo default
    top_k=1000,              # demo default, full pool
    repetition_penalty=1.2,  # demo default
)
```

Per-step deltas — bump `temperature` toward 1.0 on emotional peaks (aha
moments, wrap-ups), lower toward 0.75 on methodical algorithm steps. See
`STEP_PRESETS` in `scripts/generate-narration-turbo.py`.

---

## Known issues & workarounds

| Symptom | Cause | Fix |
|---|---|---|
| `ModuleNotFoundError: No module named 'pkg_resources'` | setuptools 81+ removed pkg_resources | `pip install 'setuptools<81'` |
| Tags spoken literally (e.g. "chuckle") | Wrong model — using base, not Turbo | Import from `chatterbox.tts_turbo` |
| All clips sound identical despite changing `baseline_exag` / `norm_loudness` | Those args are dead when conds are cached | Vary `temperature` / `top_p` / `top_k` instead |
| Monotonic long clips | Input >300 chars, out of training distribution | Chunk at sentence boundaries |
| MPS slowdown mid-generation (1 it/s) | Thermal throttle | Cool the machine; run shorter batches |
