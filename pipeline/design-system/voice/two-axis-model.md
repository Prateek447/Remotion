# Two-Axis Voice Model

A step's voice is fully determined by two orthogonal choices:

1. **Persona** — *who* is speaking. The character behind the voice. Constant across a scene.
2. **Arc** — *where in the scene* this step sits. Varies per step.

The combination `(persona, arc)` deterministically yields the Chatterbox knob values `(exaggeration, cfg_weight, temperature)`. This replaces the legacy single-preset model (`calm` / `natural` / `expressive` / `dramatic`) which conflated *who* and *where*.

## Why two axes

A passionate teacher narrating an algorithm walk should still sound calm-ish on the methodical steps and excited on the peak — but **calmer than a podcaster on the same steps**. A single preset can't encode "calmer than X but louder than Y" without a baseline reference. Persona supplies the baseline; arc supplies the modulation around it.

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
| `opening` | 0.60 | 0.45 | 0.85 | Excited but oriented — sets the stage without shouting |
| `methodical` | 0.55 | 0.50 | 0.83 | Punchy fragments, faster pace, still clear |
| `peak` | 0.80 | 0.30 | 0.93 | Cranked — the one big moment per scene |
| `closing` | 0.70 | 0.40 | 0.90 | Enthusiastic wrap with subtle CTA energy |

### measured

| Arc | exaggeration | cfg_weight | temperature | Legacy preset equivalent |
|---|---|---|---|---|
| `opening` | 0.50 | 0.50 | 0.80 | `natural` |
| `methodical` | 0.35 | 0.60 | 0.75 | `calm` |
| `peak` | 0.65 | 0.40 | 0.90 | `expressive` |
| `closing` | 0.55 | 0.45 | 0.85 | `expressive`-lite |

**Note:** This table is calibrated so existing scenes built on the legacy preset names map cleanly. `measured + methodical ≡ calm`, `measured + peak ≡ expressive`, etc.

### casual *(future)*

| Arc | exaggeration | cfg_weight | temperature |
|---|---|---|---|
| `opening` | 0.55 | 0.45 | 0.85 |
| `methodical` | 0.50 | 0.50 | 0.82 |
| `peak` | 0.70 | 0.35 | 0.90 |
| `closing` | 0.60 | 0.45 | 0.87 |

## Knob-coupling rule (load-bearing)

Per Chatterbox README: **higher `exaggeration` speeds up speech**, and **lowering `cfg_weight` compensates** with slower, more deliberate pacing. The tables above already pair them — when you tune a single step manually, **keep the pairing**: bump exaggeration by 0.1 → drop cfg_weight by 0.1.

## In the scene schema

A scene schema specifies the persona once, and each step specifies its arc:

```yaml
voice:
  persona: teacher-energetic
steps:
  - stepIndex: 0
    arc: opening
    narration: "Okay, watch this — linked list, three, seven, nine, five."
  - stepIndex: 1
    arc: methodical
    narration: "We want to find nine. No shortcuts — walk it."
  - stepIndex: 2
    arc: methodical
    narration: "Three? Nope. Seven? Nope. Keep going."
  - stepIndex: 3
    arc: peak
    narration: "And boom — there it is, nine! Return true. O of n. Beautiful."
```

The narration generator looks up `(persona, arc) → (exaggeration, cfg_weight, temperature)` and emits the `*_presets` list automatically. The writer never specifies knob values directly.

## Per-step overrides (escape hatch)

Occasionally a step needs custom values — e.g., a hard-to-pronounce term that needs lower temperature for stability. Allow optional per-step override:

```yaml
  - stepIndex: 2
    arc: methodical
    narration: "Now we apply Dijkstra's relaxation step."
    voiceOverride:
      temperature: 0.72   # Override only the temperature; persona+arc supplies the rest
```

Use sparingly. If you find yourself overriding more than 1–2 steps per scene, the persona is wrong for the content.

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
