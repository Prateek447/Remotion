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

## Natural prosody (the connector-pause pattern)

Beginner clarity is necessary but not sufficient. A script that follows Rules 1–8 above can still sound *performed* — every sentence rehearsed, every transition crisp, no acoustic texture. The user feedback that prompted this section was:

> "it feels like someone is reading the script it should feel like someone is thinking and explaining the topic in natural way"

The fix is **acoustic texture via the connector-pause pattern**: a real-English connector word (So, And, But, Now, Then) followed by `[pause:Xs]` — the connector primes the listener for what's coming, the silence delivers the thinking beat. After extensive empirical testing (see `../experiments/filler-lab/README.md`), this is the ONLY production-reliable approach. Non-word fillers (`Um`, `Ah`, `Hmm`, `Ummmm`) all failed reproducibility and were dropped.

### Primary mechanism: `[pause:Xs]` silence-splicing

Narration text may include `[pause:0.5]` markers. The audio generator (`pipeline/stages/05-audio/generate.py`) splits text on these markers, runs Chatterbox per chunk, and splices in **exactly that many seconds of digital silence** before concatenation. Deterministic, millisecond-precise, model-agnostic.

```yaml
narration: "Node four combines. So, [pause:0.6] one plus zero plus zero. And [pause:0.4] returns one."
```

This is the community-validated pattern from [PR #164](https://github.com/resemble-ai/chatterbox/pull/164) and [psdwizzard/chatterbox-Audiobook](https://github.com/psdwizzard/chatterbox-Audiobook). It is the **load-bearing prosody tool** — every meaningful step should use at least one.

### ⭐ The connector-pause pattern (the working technique)

The empirical winner from audio testing: a real-English connector word **followed by** `[pause:Xs]`. The connector primes the listener for the type of thought coming; the silence gives them time to anticipate and absorb.

| Pattern | Example | Emotional signal |
|---|---|---|
| `So, [pause:0.6]` | "Node four combines. So, [pause:0.6] one plus zero plus zero." | Consequence / pre-arithmetic / "this is what follows" |
| `And [pause:0.5]` | "Plus one for itself. And [pause:0.5] returns three." | Addition / continuation / "and now this too" |
| `But [pause:0.6]` | "Recurse left. But [pause:0.6] there is no left child." | Contrast / base-case surprise / "wait, hold on" |
| `Now, [pause:0.5]` | "Pop back. Now, [pause:0.5] recurse right." | Transition between phases / "moving on" |
| `Then [pause:0.5]` / `And then, [pause:0.5]` | "Each node asks how big. And then, [pause:0.5] adds one for itself." | Sequence / "next step is" |
| `And that, [pause:0.5]` | "O of n time. And that, [pause:0.5] is recursion counting a tree." | Closing emphasis / "and that's the takeaway" |

These are real English words. Chatterbox renders them naturally (unlike `Um` / `Ah` / `Hmm` which fail the [short-segment hallucination test](https://github.com/resemble-ai/chatterbox/issues/97)). The pause does the emotional work; the connector makes the silence feel intentional rather than dead.

**Two-beat rhythm**: the connector creates a small breath (comma after it), the `[pause:Xs]` creates the longer thinking silence. Together they sound like someone working through a thought, not reading a sentence.

### Secondary mechanisms: text-level markers Chatterbox honors

| Marker | Rendered as | Use |
|---|---|---|
| `[pause:Xs]` | exact `Xs` of digital silence (deterministic) | Primary tool. Pair with a connector word for max effect. |
| ` — ` (em-dash) | ~300ms pause (model-rendered) | Re-framing within a sentence; subordinate clause flag |
| `…` (ellipsis) | ~500–700ms audible pause (cfg_weight ≥ 0.55, model-rendered) | Soft trailing thought; use sparingly (`[pause:Xs]` is more reliable) |
| `,` and `.` | natural punctuation pauses | Routine breath / sentence boundary |

`[pause:Xs]` is the only deterministic option. Use ellipses and em-dashes for shorter, sentence-internal breaths; reach for `[pause:Xs]` whenever the pause matters to the listener's understanding.

### Connector vocabulary (the only "filler" words that work)

These are normal English connectors — they don't hit the short-segment failure mode that killed `Um`/`Ah`/`Hmm`. Use them at step boundaries and major thought transitions.

| Connector | Use |
|---|---|
| `So` / `So,` | Pre-arithmetic, consequence, follow-through ("So, [pause:0.6] one plus zero plus zero") |
| `And` / `And then` / `And that` | Additive continuation, sequence, closing emphasis |
| `But` | Contrast, base-case surprise, "wait — actually" pivots |
| `Now` / `Now,` | Phase transition, "moving on to the next thing" |
| `Then` | Sequence step |
| `Okay` / `Okay.` | Orientation opener after a pop-back-up or context shift |
| `Right` / `Right.` | Quick re-anchor mid-scene; less peppy than `Okay` |
| `Well` | Measured pivot (preferred by `measured` persona; rare in `teacher-energetic`) |

**Rejected after empirical testing** (do not use as fillers):
- `Um` — read literally by Chatterbox as the word "um"
- `Ah` — same
- `Hmm` / `Hmmm` / `Hmmmm` — initial 4/5 reliability in lab; failed in real-world listening (sometimes works, sometimes doesn't). Dropped entirely.
- `Ummmm` / `Mmmmm` / repeated-letter elongation — 0/5 reproducibility

If you want the *effect* of a hesitation filler ("Um — let me think"), use `Connector, [pause:Xs]` instead: `"So, [pause:0.6] let me think"`. The silence does the emotional work without a non-word.

### Placement rules — emotion, not syntax

✅ **Pre-arithmetic / pre-computation**: `"Node four combines. So, [pause:0.6] one plus zero plus zero."`
✅ **Before a reveal at peak**: `"three plus three plus one. [pause:0.9] Seven!"`
✅ **At a base-case surprise**: `"Recurse left. But [pause:0.6] there is no left child."`
✅ **At a phase transition**: `"Pop back to the root. Now, [pause:0.5] recurse right."`
✅ **Closing emphasis**: `"O of n time. And that, [pause:0.5] is recursion counting a tree."`

❌ **At every period or comma** — monotonous, formulaic
❌ **At every step opener** — over-eager; saturates the device
❌ **Bare `[pause:Xs]` without a connector**: `"[pause:0.5] Recurse left."` — sounds dead. Pair with a connector.
❌ **Inside a methodical iteration step where the rhythm is the lesson** — pauses there sound hesitant. Keep iteration steps clean for rhythm contrast.

### Density rule of thumb

For a scene of length ≥8 steps:

- **1–2 `[pause:Xs]` per non-trivial step** at emotional pause points (~30–40 total in a 26-step scene)
- **Pause durations**:
  - 0.4s — sentence-internal beat, additive emphasis
  - 0.5–0.6s — standard thinking pause (most common; pair with connectors)
  - 0.7–0.9s — pre-reveal at peak step (heaviest emphasis)
- **Methodical iteration steps stay simple** — 0–1 pauses. The contrast with heavier steps creates breathing room.
- Em-dashes as needed for re-framing (no strict density target)

A 26-step scene lands at roughly 30–40 `[pause:Xs]` markers totaling 15–20s of injected silence. Below that and it reads scripted; above and the pacing drags.

`pipeline/stages/03-narration/preview.py` reports pause count + total silence; warns if a scene ≥8 steps has zero `[pause:Xs]` AND zero ellipses.

### Knob coupling

`[pause:Xs]` is **deterministic** — it works at any `cfg_weight`. The silence is spliced at the audio layer after Chatterbox returns. Use this for any pause that needs to land precisely.

Ellipses and em-dashes are **model-rendered** — they need `cfg_weight ≥ 0.50` to be honored as audible pauses. The default `teacher-energetic` and `measured` presets are tuned to this floor. **If you override knobs per step via `voiceOverride`, do not drop `cfg_weight` below 0.50** for non-peak arcs — at 0.40 or lower, Chatterbox smooths over ellipses entirely.

The peak step (`cfg_weight = 0.40`) is the documented exception: use `[pause:Xs]` (not ellipses) for guaranteed pauses there; the peak's exaggeration energy does the work model-rendered pauses would otherwise do.

### Persona-agnostic

This section applies to `teacher-energetic` AND `measured`. The persona governs voice **character** (energetic vs. calm); prosody governs voice **acoustic texture** (scripted vs. spoken-aloud). They're orthogonal. A `teacher-energetic` scene with the connector-pause pattern sounds like a hyped teacher *thinking-while-explaining*; a `measured` scene with the same pattern sounds like a calm narrator *thinking-while-explaining*. Both beat their no-prosody counterparts. Personas may favor different connectors (`teacher-energetic` leans `So`, `Now`, `Right`; `measured` leans `So`, `Now`, `Well`) — see persona docs for vocabulary.

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
- [ ] Does the narration use the **connector-pause pattern** (`So, [pause:0.6]` / `And [pause:0.5]` / `But [pause:0.6]` / `Now, [pause:0.5]`) at thought transitions?
- [ ] Does each non-trivial step have 1–2 `[pause:Xs]` markers at emotional pause points?
- [ ] Are non-word fillers (`Um`, `Ah`, `Hmm`) avoided? They were empirically rejected — use connector + pause instead.
- [ ] Do iteration / repetition steps stay clean (0–1 pauses) to create rhythm contrast against heavier steps?

A "no" on any of these is a script that needs another pass.

---

## When to make exceptions

Compression is sometimes appropriate:

- **Multi-scene compilations** where one algorithm is one scene of many — viewers have already seen the explanation pattern in earlier scenes, so 8 steps for the second occurrence is fine.
- **Advanced topics** where the audience description in the persona explicitly notes "assumes recursion familiarity" — but this should be rare. The default audience is the beginner.
- **Visual-first scenes** (`reel-anim` format) that strip narration — they were designed for compression. The non-anim formats still need full density.

Default position: full density. Compress only with reason.
