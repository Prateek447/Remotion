# Two-Axis Voice Model

> **Role in the pipeline (post-refactor):** Audio is no longer rendered from these tables directly. The chunked-narration sidecar (`<scene>.narration.yaml`) is the only audio source; each chunk carries its own `(exaggeration, cfg_weight, temperature)` and `pauseAfter`. This document is the **starting palette** that `pipeline/stages/03-narration/scaffold.py` uses to seed default chunk params when generating a sidecar skeleton from a scene yaml. Chunk authors tune from these seeds against the per-beat tier legend in `pipeline/design-system/teaching.md` "Chunked narration".

The two axes:

1. **Persona** — *who* is speaking. The character behind the voice. Constant across a scene. Now governs content-writing style (sentence shape, opener choice, connector preferences) — see `personas/*.md`. The scaffolder records it for the seed values.
2. **Arc** — *where in the scene* this step sits. Varies per step. The scaffolder reads it to pick the seed param triple for the step's first chunk.

## Why two axes

A passionate teacher narrating an algorithm walk should still sound calm-ish on the methodical steps and excited on the peak — but **calmer than a podcaster on the same steps**. A single preset can't encode "calmer than X but louder than Y" without a baseline reference. Persona supplies the baseline; arc supplies the modulation around it.

This gave a useful starting palette per `(persona, arc)`, which is exactly what the scaffolder consumes. The per-chunk authoring layer then refines: within a single step, the opening setup chunk and the climactic reveal chunk get different params, something a single `(persona, arc)` triple can't express.

## The persona axis

| Persona | Vibe | Use for |
|---|---|---|
| `teacher-energetic` | Excited, passionate teacher. Punchy fragments, rhetorical questions, "watch this" energy. | Default for new videos targeting YouTube/Reels engagement. |
| `measured` | Calm, methodical explainer. Closer to a podcast or audiobook. The voice of the existing scenes. | Backwards compatibility; scenes where energy would feel oversold (proofs, math-heavy content). |
| `casual` | Conversational, friendly aside-style. Lower energy than energetic, less formal than measured. | Future use — not yet active. |

Each persona defines a **baseline knob triple** and **per-arc deltas** that modulate the baseline.

## The arc axis

Every scene has the same four-position arc:

| Arc | When in scene | What the step is doing |
|---|---|---|
| `opening` | Step 0 (sometimes 0–1) | Orientation — set up the data structure, name the values, state the goal |
| `methodical` | Middle bulk | Walking through the algorithm — pointer advances, comparisons, iterations |
| `peak` | One step (rarely two) per scene | The aha moment, complexity callout, key insight, the "this is the trick" line |
| `closing` | Final step (sometimes -1 to -2) | Result + takeaway + CTA |

**Rules:**
- Every scene has exactly one `opening` and one `closing`.
- Every scene has **0 or 1** `peak`. Tiny scenes (≤3 steps) may skip peak; large scenes never have more than one.
- All other steps are `methodical`.

## Combined preset table

The full mapping. All values are the final `(exaggeration, cfg_weight, temperature)` triple passed to `ChatterboxTTS.generate()`.

### teacher-energetic

| Arc | exaggeration | cfg_weight | temperature | Feel |
|---|---|---|---|---|
| `opening` | 0.60 | 0.55 | 0.90 | Excited but oriented — sets the stage without shouting |
| `methodical` | 0.55 | 0.60 | 0.88 | Punchy fragments, faster pace, still clear |
| `peak` | 0.80 | 0.40 | 0.95 | Cranked — the one big moment per scene |
| `closing` | 0.70 | 0.50 | 0.92 | Enthusiastic wrap with subtle CTA energy |

### measured

| Arc | exaggeration | cfg_weight | temperature | Legacy preset equivalent |
|---|---|---|---|---|
| `opening` | 0.50 | 0.60 | 0.85 | `natural` (tuned) |
| `methodical` | 0.35 | 0.65 | 0.80 | `calm` (tuned) |
| `peak` | 0.65 | 0.50 | 0.92 | `expressive` (tuned) |
| `closing` | 0.55 | 0.55 | 0.88 | `expressive`-lite (tuned) |

**Note:** Both tables were tuned upward (`cfg_weight` +0.05–0.10, `temperature` +0.05) from earlier baselines — those tunings came from the deprecated AUTO-mode era when text-level prosody markers (`[pause:Xs]`, ellipses, em-dashes) had to render reliably at a single per-step preset. The values survive here because they're sensible seed points for chunk authoring: most methodical chunks in a scene end up landing near these values, with chunks that need stronger emotional shape deviating up (high-emotion beats) or holding still (calm orientation). The `measured` table's legacy preset-equivalent column is historical context only — the audio resolver is per-chunk params, not these triples.

### casual *(future)*

| Arc | exaggeration | cfg_weight | temperature |
|---|---|---|---|
| `opening` | 0.55 | 0.45 | 0.85 |
| `methodical` | 0.50 | 0.50 | 0.82 |
| `peak` | 0.70 | 0.35 | 0.90 |
| `closing` | 0.60 | 0.45 | 0.87 |

## How the scaffolder uses these tables

`pipeline/stages/03-narration/scaffold.py` reads a scene yaml's `voice.persona` and each step's `arc`, looks up the matching triple, and writes it into the skeleton sidecar as the seed params for that step's first chunk. The scaffolder uses a slightly smoothed palette (close to but not identical to the per-persona tables above) — the seed values are intentionally middle-of-the-road so authors immediately want to refine.

The author's job after scaffolding:
- **Split high-emotion steps** (opening, peak, closing, subtree-returns) into multiple chunks where emotion shifts within the step.
- **Tune chunk params** against the per-beat tier legend in `teaching.md` "Chunked narration" — calm orientation, methodical, lean-in, mini-reveal, subtree return, peak reveal, closing CTA.
- **Set pauseAfter** between chunks where pauses serve the listener's understanding.

The seed values from these tables are deliberately conservative. If you ship a sidecar where every chunk's params equal the table value, the audio is fine but doesn't make use of the per-chunk control — you've effectively re-implemented the old AUTO mode. The whole point of chunked authoring is **deviating** from the seeds at emotional pivots.

## Knob-coupling rule (load-bearing)

Per Chatterbox README: **higher `exaggeration` speeds up speech**, and **lowering `cfg_weight` compensates** with slower, more deliberate pacing. The tables above pair them — when you tune a chunk's params, **keep the pairing**: bump exaggeration by 0.1 → drop cfg_weight by 0.1.

Apply this within every chunk regardless of which arc seeded it. A chunk that needs to land slower and weightier than its neighbors gets `ex↓ cfg↑`; a chunk that releases energy gets `ex↑ cfg↓`. The peak reveal chunk in `count-tree-nodes.narration.yaml` (ex=0.95, cfg=0.32) is the extreme example.

### Empirically rejected non-word fillers (content rule)

For chunk text, never write: `Um`, `Ah`, `Hmm`, `Hmmm`, `Ummmm`, `Mmmmm`, or any repeated-letter elongation. Chatterbox renders them literally or inconsistently — see `../experiments/filler-lab/README.md` for the full 5-take reliability data. Use natural English connectors at chunk boundaries instead: `So,` / `And` / `But` / `Now,` / `Then`. The chunk's params handle the emotional weight; the connector handles the linguistic transition.

## In the scene schema

A scene yaml carries `voice.persona` once and per-step `arc` — these feed the scaffolder. The `narration` field on each step is content-only: the words the author intends for that step, which the scaffolder copies into the first chunk's `text`. The actual audio comes from the sidecar.

```yaml
voice:
  persona: teacher-energetic
steps:
  - stepIndex: 0
    arc: opening
    narration: "Okay, watch this — linked list, three, seven, nine, five."
  - stepIndex: 3
    arc: peak
    narration: "And boom — there it is, nine! Return true. O of n. Beautiful."
```

After `scaffold.py` runs, the sidecar at `<scene>.narration.yaml` is what holds the audio-authoritative content:

```yaml
steps:
  - stepIndex: 3
    intent: "PEAK — the find"
    chunks:
      - id: "3.0"
        text: "And boom — there it is, nine! Return true."
        params: { exaggeration: 0.90, cfg_weight: 0.35, temperature: 0.95 }
        pauseAfter: 0.5
      - id: "3.1"
        text: "O of n. Beautiful."
        params: { exaggeration: 0.75, cfg_weight: 0.50, temperature: 0.92 }
        pauseAfter: 0.0
```

The author splits, retunes, and adds `pauseAfter` between chunks — that's where the per-beat control lives.

## Per-chunk params replace per-step voiceOverride

The deprecated `voiceOverride` field on a scene step (which let you override one knob while persona × arc supplied the rest) no longer exists. Per-chunk `params` in the sidecar are the only mechanism for tuning Chatterbox knobs. If a chunk needs custom values — e.g., a hard-to-pronounce term that needs lower temperature for stability — set them in that chunk's `params` directly.

## Choosing a persona for a new video

| Topic class | Recommended persona |
|---|---|
| Data structure operations (linked list, tree, hash, etc.) | `teacher-energetic` |
| Sorting & search algorithms | `teacher-energetic` |
| Complexity analysis explainers (e.g., O(n) vs O(log n)) | `teacher-energetic` |
| Network/protocol walkthroughs (e.g., TLS handshake) | `measured` |
| Mathematical proofs or invariant arguments | `measured` |
| LeetCode problem walkthroughs | `teacher-energetic` |
| Recursive algorithms (e.g., Tower of Hanoi, factorial) | `teacher-energetic` |

The default for the project going forward is `teacher-energetic` unless content reasons argue against it.

## Anti-patterns

- **Same arc on every step.** A scene where every step is `methodical` will sound monotonic no matter the persona. Pick a peak; honor the opening/closing.
- **Two peaks per scene.** If two moments feel peak-worthy, the second one is probably a `closing` — peak is the *single biggest reveal*, not "every interesting line."
- **Persona switching mid-scene.** Don't mix `teacher-energetic` and `measured` across steps in the same scene. The voice should feel like one person. Persona is set once.
- **Knob overrides as a habit.** If you're overriding more than ~10% of steps, change the persona instead.
