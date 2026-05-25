# Teaching Quality — Explain, Don't Review

A scene exists to **teach a beginner**, not to refresh someone who already knows the algorithm. The viewer is seeing this idea for the first time. They need every operation shown, every concept named, every recursive frame visible.

**If the script reads like a refresher, the script is wrong** — no matter how clean the visuals are.

This doctrine is cross-cutting: it applies regardless of voice persona, data structure, or operationKind. Other docs cover *what* to say and *how* the voice sounds; this one covers *how much* to say and *at what density*.

---

## The "blaze-through" failure mode

Symptoms that a script is reviewing instead of teaching:

| Symptom | Looks like | Fix |
|---|---|---|
| **Symmetry shortcut** | "Same thing on the right side too" | Show it. Repetition is the lesson. |
| **Phantom recursion** | "We recurse left" — but no actual recursive call frame is shown | One step per recursive call. |
| **Skipped base case** | "Null returns zero" — stated once, never shown | A whole step for the base case, with the return value visible. |
| **Magic return values** | "Left subtree returns three" — viewer never saw 1+1+1=3 happen | Show each leaf returning 1, then the parent computing 1+1+1. |
| **Step count too low** | 6 steps for an algorithm that has 7 recursive calls | See step-count heuristics below. |
| **Code-speak narration** | "We invoke countNodes on the left child" | "We call this function on node 2 now" |
| **Wave-of-color recursion** | Multiple nodes highlighted at once across recursion levels | Each frame is one node, sequenced in time. |
| **Climax in audio only** | The final answer narrated but not shown on-screen | Big number overlay. The visual answer matters. |

If the scene has any of these, the script is too sparse — regardless of how polished the animations are.

---

## Beginner-clarity rules

Apply every rule to every scene. The persona changes how lines *sound*; these rules change *how many lines exist and what each one shows*.

### Rule 1: Open with WHAT and WHY, not HOW

Step 0 establishes the problem before any code mechanics.

✅ "We have a tree with seven nodes. How does code count all of them?"
❌ "We call countNodes on the root."

The first line should make the viewer *want* the answer. The second line is a code instruction with no context.

### Rule 2: Name concepts before invoking them

Before the first recursive call, the viewer needs to know what recursion *is*. One dedicated step explains the mechanism.

✅ Step 1 ("The function calls itself on smaller pieces") then Step 2 (first recursive call demonstrated).
❌ Step 1 already inside a recursive call.

### Rule 3: Dry-run with concrete values, not abstractions

The tree is on screen with labels. Use the labels.

✅ "We call countNodes on node two."
❌ "We recurse into the left subtree."

Concrete values let the eye follow the ear. Abstractions force the viewer to map words to visuals — slow and easy to lose.

### Rule 4: Every recursive call is its own step

For any recursive algorithm:

- **Entering a call** → one step. Show which node the call is on.
- **Hitting a base case** → one step. Show the null/empty condition and the return value.
- **Returning** → one step. Show the value being returned (caption or overlay).
- **Combining return values** → one step. Show the formula resolve with concrete numbers.

Do NOT condense multiple recursion levels into a single step. Recursion is exactly the kind of mechanism that requires frame-by-frame demonstration.

### Rule 5: Show return values bubbling up

When a recursive call returns, the return value must be *visible* before any parent uses it.

✅ Step N: "Node four returns one" → caption: "Node four → 1". Step N+1: "Node two sees one from the left, then..." → references the value the viewer just saw.
❌ "Left subtree returns three" — never showed it computing to three.

**Preferred visual treatment for recursive tree algorithms**: use the four-layer return-value overlay system (`NullNodeOverlay` + `TravelingNumberOverlay` + `ReturnValueOverlay` + `FormulaOverlay`) documented in `patterns/tree.md` → "Return-value overlay system". Captions become the supporting layer; the overlays do the load-bearing teaching. `CountTreeNodes.tsx` is the reference implementation.

### Rule 6: Show base cases as full steps, not narration

"If null, return zero" is the foundation of the algorithm. Give it a whole step:

- Highlight the null child (or mark its absence visually).
- State the base case: "Null is the base case. Return zero."
- Show the 0 in a caption or overlay.

The first time the viewer hits a base case in your dry-run is where they understand how recursion *terminates*. Don't blow past it.

### Rule 7: Repeat the pattern — repetition is the lesson

When the right subtree mirrors the left, the temptation is to skip it. Resist.

✅ Show the right side's recursion at slightly compressed pace (maybe 1 step instead of 2 per node) but show it.
❌ "Right subtree does the same thing."

The fourth or fifth time the pattern repeats is exactly when the viewer's brain forms the recursive abstraction. Skip the repetition and the abstraction never lands.

### Rule 8: End with the visible answer

The final result is on screen as a number overlay or large caption, not just narrated.

✅ Big "7" overlay + "Seven!"
❌ "And that's seven nodes" with no visual punctuation.

---

## Natural prosody (chunked narration)

Beginner clarity is necessary but not sufficient. A script that follows Rules 1–8 above can still sound *performed* — every sentence rehearsed, every transition crisp, no acoustic texture. The user feedback that prompted this section was:

> "it feels like someone is reading the script it should feel like someone is thinking and explaining the topic in natural way"

The fix is **chunked narration**: a sidecar yaml (`<scene>.narration.yaml`) where each step is broken into emotion-coherent chunks, each chunk runs through Chatterbox with its own `(exaggeration, cfg_weight, temperature)`, and `torch.zeros` silence is spliced between chunks per `pauseAfter`. This is the only audio path.

The historical alternative — inline `[pause:Xs]` markers in the scene yaml's `narration` field, resolved through a `voice.persona × step.arc` preset table — was deprecated. A single Chatterbox `generate()` call has one acoustic identity for its full duration, so the persona × arc table can't crescendo within a step. The chunk boundary IS the emotion boundary; that's the load-bearing architectural choice.

The scene yaml's `narration` field is preserved as a content-only draft (the words for the step) — `scaffold.py` consumes it to seed chunk text, and human authors keep it as a readability reference. It is NOT what Chatterbox reads at audio-gen time.

---

### Chunked narration (sidecar yaml)

**Why this exists.** A single Chatterbox `generate()` call has one acoustic identity for its full duration — you can't crescendo within a chunk. So the chunk boundary IS the emotion boundary. The persona × arc table (which emits one triple per step) collapses everything inside a step to one acoustic shape; chunks restore the ability to encode "calm setup → slow arithmetic → explosive reveal" within a single step.

**Schema** — `pipeline/scenes/<scene>.narration.yaml` next to the scene yaml:

```yaml
sceneId: count-tree-nodes
sourceScene: pipeline/scenes/count-tree-nodes.yaml
voice:
  reference: scripts/clone.wav
output:
  baseDir: public/narration/count-tree-nodes
  perChunkDebug: true          # writes per-chunk debug WAVs alongside step-N.mp3

steps:
  - stepIndex: 24
    intent: "PEAK — final combine, the 'aha'"
    chunks:
      - id: "24.0"
        intent: "arriving at the moment"
        text: "Okay."
        params: { exaggeration: 0.68, cfg_weight: 0.55, temperature: 0.90 }
        pauseAfter: 0.35
      - id: "24.4"
        intent: "slow arithmetic — building tension"
        text: "So, three plus three plus one."
        params: { exaggeration: 0.78, cfg_weight: 0.45, temperature: 0.92 }
        pauseAfter: 0.80          # longest pause in scene — pre-reveal hold
      - id: "24.5"
        intent: "PEAK REVEAL — maximum energy"
        text: "Seven!"
        params: { exaggeration: 0.95, cfg_weight: 0.32, temperature: 0.95 }
        pauseAfter: 0.0
```

**Per-chunk fields:**
- `id` — stable string, used for per-chunk debug WAV filenames and for locking seeds later
- `text` — the actual narration; **no** `[pause:Xs]` markers (pauses live between chunks)
- `params` — full `(exaggeration, cfg_weight, temperature)` triple passed straight to `ChatterboxTTS.generate()`
- `pauseAfter` — seconds of `torch.zeros` silence after this chunk (before next chunk or end of step)
- `intent` — optional, free-text human readable
- `seed` — optional, integer; lock for reproducibility once a take lands well

**Param tier legend** (use as a starting palette; tune to taste):

| Beat type | exaggeration | cfg_weight | temperature | Example |
|---|---|---|---|---|
| Calm orientation | 0.50 | 0.62 | 0.85 | "A binary tree." |
| Standard methodical | 0.60 | 0.55 | 0.88 | "Recurse left." |
| Curious / lean-in | 0.65 | 0.52 | 0.90 | "how does code count?" |
| Mini-reveal | 0.78 | 0.45 | 0.92 | "And returns one." |
| Subtree return | 0.82 | 0.42 | 0.93 | "Returns three." |
| **PEAK reveal** (1× per scene) | **0.95** | **0.32** | **0.95** | "Seven!" |
| Closing CTA | 0.75 | 0.48 | 0.92 | "...counting a tree." |

The knob-coupling rule still applies: higher exaggeration speeds delivery, lower cfg_weight compensates with slower pacing. Bump them together (`ex↑ cfg↓` for energy, `ex↓ cfg↑` for calm).

**Per-chunk debug WAVs** — when `output.perChunkDebug: true`, the generator writes each chunk's WAV alone to `public/narration/<sid>/chunks/step-N-N.M.wav`. Listen to a single chunk in isolation when only one beat sounds wrong; that tells you whether the chunk's params are off or whether the concatenation context is off (different fixes).

**Sidecar coverage.** Every scene stepIndex must have a sidecar entry — `generate.py` hard-errors on missing coverage. `preview.py` reports the gap before you run audio. The scaffolder produces one entry per step from the start, so missing coverage only happens if someone deletes an entry by hand.

**Chunks per step — how many?**
- Steps with one emotional tone (single methodical descent like "Recurse left.", a null-base-case observation, a routine return) keep a single chunk. Use the methodical seed params; one Chatterbox call captures the beat.
- Steps with more than one emotional beat — almost always true for `opening`, `peak`, `closing`, and any "subtree return" combine step — split into multiple chunks. Each chunk's params reflect that specific beat: setup chunks calmer, reveal chunks louder.
- The peak step in count-tree-nodes has 6 chunks spanning ex 0.65 → 0.95; the null-base-case methodical steps have 3–4 chunks all in a tight 0.55–0.60 ex band. Chunking a uniform step into many tiny chunks at identical params just slows compute for no audible gain — `preview.py` flags identical back-to-back chunk params as a "could be merged" warning.

**Reference example:** `pipeline/scenes/count-tree-nodes.narration.yaml` — full 92-chunk authoring across 26 steps. Step 24 (the peak) has the widest dynamic range (ex 0.65 → 0.95 in 6 chunks); the methodical null-base-case steps (10, 11, 16, 17, 20, 21) sit in a tight 0.55–0.60 ex band because the emotion really is uniform.

---

### Chunk content style

Per-chunk acoustic params handle prosody — but the *words* in each chunk's `text` still matter, because Chatterbox renders those words and how natural they sound depends on what the words are. Rules carried over from the deprecated AUTO-mode work:

**Use natural English connectors at chunk boundaries**, not non-word fillers. When a chunk's text starts with a thinking beat — "So,", "And,", "But", "Now,", "Then", "And then,", "And that," — Chatterbox renders it cleanly and the connector primes the listener for the emotional shift the chunk's params deliver. After extensive testing (see `../experiments/filler-lab/README.md`), non-word fillers (`Um`, `Ah`, `Hmm`, `Ummmm`, `Mmmmm`) were empirically rejected — they render literally or inconsistently. Real-English connectors are the only working "filler" vocabulary.

**Per-persona connector preferences:**
- `teacher-energetic` leans on `Okay`, `Right`, `So`, `Now`, `And then` (punchy openers)
- `measured` leans on `So`, `Now`, `Well`, `Then` (calmer, less peppy)
- `But` works as a base-case surprise word in both personas — it's the contrast doing the work, not the energy

**Keep chunks tight — one chunk = one beat = one emotion.** Aim for ≤18 words per chunk. Beyond that, emotion almost certainly drifts within the chunk; split it. `preview.py` flags chunks over 18 words as a shape warning.

**TTS-readiness still applies per-chunk:** spell numbers as words ("three" not "3"), no `[brackets]` (no `[pause:Xs]` either — pauses live in `pauseAfter`), code-as-speech ("dot next", "O of n"). `preview.py` lints each chunk's text against these hazards before audio gen.

**Persona is now a content-style guide, not a prosody resolver.** The `teacher-energetic` and `measured` personas describe how the text *reads* (energy level, sentence shape, opener choice, sentence rhythm) — they're a writing-style guide for chunk text. The acoustic prosody is purely the per-chunk `params`. A `teacher-energetic` scene reads punchier than a `measured` one, but both achieve "thinking, not reading" via the same chunking mechanism. See `voice/personas/*.md` for the per-persona writing style.

### Pause durations — empirical bands

When you set `pauseAfter` on a chunk, these durations are what land well:

| Duration | Use |
|---|---|
| 0.3–0.4s | Sentence-internal beat between two coherent chunks of the same idea |
| 0.5–0.6s | Standard thinking pause — most common; between chunks where emotion shifts mildly |
| 0.7–0.9s | Pre-reveal beat at peak step — heaviest emphasis. **One** pause this long per scene, max. |
| 1.0s+ | Almost never. Sounds like dead air or a stream cut. |

A 26-step scene with ~90 chunks lands at roughly 20–30s of total inter-chunk silence. Below that and the pacing feels rushed; above and it drags.

---

## Step-count heuristics

Guidelines, not validator-enforced. They surface intuitively-wrong density.

### Recursive tree algorithms
Rough formula:
```
steps ≈ 2 × (recursive_calls + base_case_returns) + 4 (orientation + closing)
```

For a 7-node binary tree with countNodes:
- 7 internal entries (one per non-null node visited)
- 8 null base-case returns (4 leaves × 2 null children each)
- 4 orientation/closing steps
- **Lower bound: ~14–18 steps.** A scene with 8 is half what's needed.

For a balanced tree of depth `d` (so `2^(d+1) - 1` nodes), the call count grows fast. If you can't fit it in your video length: **use a smaller tree**. A 3-node tree explained in 10 steps teaches recursion. A 15-node tree explained in 10 steps teaches nothing.

### Iterative algorithms (loops over arrays/lists)
```
steps ≈ loop_iterations + setup_lines + 4
```

For a linear search of a 4-element list: ~8–10 steps including the not-found branch and complexity wrap.

### Mutation / single-operation scenes
```
steps ≈ code_lines + 3 (setup) + 3 (closing) + (wrong-way demo if applicable)
```

`InsertHead.tsx` has 14 steps for 5 lines of code, including a "wrong way" demonstration and edge cases. That's the right density.

### Comparison / proof scenes
```
steps ≈ comparison_dimensions × 2 + 4
```

For "array vs linked list" comparing 4 dimensions (access, insert, delete, memory): ~12 steps.

---

## Recursion explanation template

Use this skeleton when storyboarding any recursive algorithm. Each line below corresponds to one step (some can be split into two).

```
Step 0      opening      Show input. Pose the question. Hint the answer.
Step 1      methodical   What does the function do at each call? Conceptual frame.
Step 2      methodical   Show the code. Name the three pieces: base case, recurse, combine.
Step 3      methodical   Enter the first call (root). Active node highlighted.
Step 4      methodical   Recurse into left child. Active node moves down-left.
Step 5      methodical   Continue recursing left until reaching a leaf or base case.
Step 6      methodical   Hit base case. Show the return value visually (0 for null, etc.).
Step 7      methodical   Hit the SECOND base case (right child of the same node).
Step 8      methodical   Parent combines child returns: "0 + 0 + 1 = 1." Show the value.
Step 9      methodical   Pop back up. Recurse into the OTHER child of the parent.
Step 10+    methodical   Repeat for the right subtree at slightly compressed pace.
Step N      methodical   Each parent in turn combines its children's returns.
Step N+1    peak         Root combines everything. Show the big number.
Step N+2    closing      Complexity wrap. Visual answer stays on screen.
```

Compression for symmetric subtrees: once a pattern has been shown end-to-end on the left side, the right side can be shown at half the step count — but **still show it**, don't say "same thing."

---

## Anti-patterns — read these out loud and reject scripts that match

- "Same thing on the right side too."
- "We descend through the tree."
- "Each leaf returns one. Now left subtree is three."
- "We recurse into the subtree."
- "The function calls itself."  *(without showing it call itself)*
- "By the recursive structure of the problem."
- "We can see that..." *(when the viewer in fact cannot)*
- Multiple nodes lighting up simultaneously across recursion levels.
- A peak step that's a formula like "1+3+3=7" without the viewer having seen the 3s constructed.
- Final answer narrated but no visual.

If you read your draft and any of these phrases jump out: rewrite.

---

## Pre-flight checklist for any recursive or iterative algorithm

Before running `pipeline/run.sh`, ask:

- [ ] Does step 0 establish WHAT and WHY before any code mechanics?
- [ ] Is there a dedicated step explaining the recursive (or iterative) mechanism before the first call?
- [ ] Does every recursive call have its own step?
- [ ] Does every base case have its own step with a visible return value?
- [ ] Does every return value appear on-screen (caption or overlay) before the parent uses it?
- [ ] Is the right subtree shown explicitly, not collapsed to "same thing"?
- [ ] Does the final step show a big visible answer, not just narrate it?
- [ ] Does step count meet the heuristic for the algorithm class?
- [ ] **Has a `<scene>.narration.yaml` sidecar been authored?** It's required — generate.py refuses to run without it.
- [ ] Does every scene stepIndex have a sidecar entry? `preview.py` cross-checks this and hard-errors on missing coverage.
- [ ] Are emotion-heavy steps (opening, peak, closing, subtree-return combines) split into ≥2 chunks, not single-chunk?
- [ ] Is the peak step's reveal chunk ≥ ex 0.90, cfg ≤ 0.35? That's the highest-energy chunk in the scene; anything lower undersells the moment.
- [ ] Do chunks use natural English connectors (`So,` / `And` / `But` / `Now,` / `Then`) at boundaries — not non-word fillers (`Um` / `Ah` / `Hmm`)? Those were empirically rejected.
- [ ] Is each chunk ≤18 words? Longer chunks let emotion drift; `preview.py` flags this.
- [ ] Do methodical iteration / repetition steps use single chunks or short chunk lists (not over-chunked)? They provide rhythm contrast against heavier steps.
- [ ] Total inter-chunk silence between 20–30s for a 26-step scene? `preview.py` reports the total.

A "no" on any of these is a script that needs another pass.

---

## When to make exceptions

Compression is sometimes appropriate:

- **Multi-scene compilations** where one algorithm is one scene of many — viewers have already seen the explanation pattern in earlier scenes, so 8 steps for the second occurrence is fine.
- **Advanced topics** where the audience description in the persona explicitly notes "assumes recursion familiarity" — but this should be rare. The default audience is the beginner.
- **Visual-first scenes** (`reel-anim` format) that strip narration — they were designed for compression. The non-anim formats still need full density.

Default position: full density. Compress only with reason.
