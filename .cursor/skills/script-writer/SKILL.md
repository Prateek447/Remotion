---
name: script-writer
description: DEPRECATED — superseded by pipeline/ design system. See pipeline/README.md and pipeline/design-system/overview.md. This skill remains as historical reference for editorial principles only.
---

> ⚠️ **DEPRECATED — DO NOT USE FOR NEW WORK**
>
> This skill has been superseded by the `pipeline/` design system at the repo root.
>
> For new videos, load these instead:
> - `pipeline/README.md` — pipeline stage map
> - `pipeline/design-system/overview.md` — design philosophy & contracts
> - `pipeline/design-system/scene-schema.yaml` — the single-source-of-truth schema
> - `pipeline/design-system/patterns/<data-structure>.md` — codebase-observable patterns
> - `pipeline/RUNBOOK.md` — concrete execution commands
>
> The editorial principles below (hook design, step pacing, narration rules) are still correct but have been distilled and re-encoded into the design system docs with concrete codebase grounding. Refer to `pipeline/design-system/voice/` for voice direction and `pipeline/design-system/patterns/` for visual structure.

---

# Script Writer for Code Explanation Videos *(legacy)*

Every video is a **story with a teaching goal**. The viewer should understand the concept after watching once at 1x speed. Structure every video around this principle.

## Video Structure Template

Every code explanation video follows this arc:

```
Hook (3-5s) -> Context (5-10s) -> Core Explanation (bulk) -> Recap (5-10s)
```

### 1. Hook (3-5 seconds)

One sentence or visual that creates curiosity or states the value:
- "How does a linked list reverse itself in O(n)?"
- "This one algorithm detects cycles with zero extra memory."
- Show the final result first, then rewind to explain.

For **YouTube**: the hook IS the first frame (appears in preview on hover).
For **Instagram Reels**: the hook must work without sound (text overlay).

### 2. Context (5-10 seconds)

Title card with:
- Operation name
- Time/space complexity badge
- One-line subtitle explaining what it does

This is the `TitleCard` component. Keep it to 60-90 frames (2-3 seconds at 30fps).

### 3. Core Explanation (bulk of video)

This is the animated split-layout with diagram + code. Structure as **steps**.

### 4. Recap (5-10 seconds)

Final title card or overlay summarizing:
- What was accomplished
- Key takeaway (complexity, when to use it)
- Call to action ("Next: Trees!")

---

## Step Decomposition

The core skill: breaking an algorithm into animated steps.

### Rules for Step Design

1. **One concept per step**: Each step should change exactly ONE thing in the diagram
   - Bad: "Create node, link it, and move head" (3 changes)
   - Good: Step 1: "Create node", Step 2: "Link to head", Step 3: "Move head pointer"

2. **Show the code line FIRST, then animate the diagram**: The viewer reads the code, then sees it happen visually. This is why `highlightLines` and `snapshot` are paired in a `SceneStep`.

3. **Hold frames matter**: Each step needs enough frames for the viewer to:
   - Read the highlighted code line (~20 frames / 0.7s)
   - Watch the diagram animation (~15 frames / 0.5s)
   - Absorb the change (~10 frames / 0.3s)
   - **Minimum: 40 frames per step, recommended: 50**

4. **Caption = one short sentence**: Describe what's happening in plain English
   - Bad: "We are now setting the next pointer of the new node to point to the current head"
   - Good: "Point newNode.next to head"
   - Max 40 characters for readability at video scale

5. **First step = initial state**: Always start with the "before" picture showing the existing data structure before any operation begins.

6. **Last step = completion**: Show the final state with a summary caption ("Done! size++" or "Reversed: 9→7→3").

### Step Timing Formula

```
framesPerStep = max(40, codeLines * 20 + diagramChanges * 15 + 10)
totalSceneFrames = steps.length * avgFramesPerStep + 30 (buffer)
```

For a typical 5-step operation at 50 frames/step: **250 frames (~8.3s at 30fps)**.

---

## Pacing Guidelines

| Video Length | Platform | Steps | Frames/Step |
|---|---|---|---|
| 15-30s | Instagram Reel | 3-5 | 40-50 |
| 30-60s | YouTube Short | 5-8 | 40-50 |
| 1-3min | YouTube | 8-15 | 45-60 |
| 3-10min | YouTube (full) | 15-40 | 50-60 |

### Pace Variation

Not every step should be the same length. Use **longer holds** for:
- The first step (viewer is orienting)
- Key insight moments ("This is where the reversal happens")
- The final result

Use **shorter holds** for:
- Repetitive iterations ("Same again for node 7...")
- Simple pointer advances

---

## Narration Scripting

If adding TTS narration, write the script alongside the steps:

```ts
const steps: NarratedStep[] = [
  {
    startFrame: 0,
    narration: "Let's insert value 1 at the head of this linked list.",
    snapshot: { ... },
    highlightLines: { startLine: 0, endLine: 0 },
  },
  {
    startFrame: 50,
    narration: "First, create a new node with value 1.",
    snapshot: { ... },
    highlightLines: { startLine: 1, endLine: 1 },
  },
];
```

### Narration Rules

- **Match the caption, don't duplicate it**: If the caption says "Create new node", the narration should expand: "First, we create a new node with value 1."
- **Use present tense**: "We set the next pointer" not "We will set"
- **Keep sentences short**: 5-12 words per step. TTS sounds bad with long sentences.
- **Name the values**: "Point newNode's next to 3" not "Point newNode's next to head"
- **Estimated timing**: ~3 words per second for natural TTS pacing

---

## Topic Complexity Tiers

When choosing what to animate, consider the complexity tier:

### Tier 1: Single Operation (15-60s)
One operation on one data structure. Example: "Insert at head of linked list".
- 3-6 steps, one code snippet, one diagram state flow

### Tier 2: Operation Suite (1-5min)
All operations on one data structure. Example: "Linked List Operations".
- Multiple scenes chained with title cards between them
- This is what FullVideo.tsx does

### Tier 3: Concept Explainer (3-10min)
Comparing approaches or explaining a concept. Example: "Array vs Linked List".
- Multiple data structures, side-by-side comparisons
- Requires custom layouts beyond the standard split

### Tier 4: Problem Walkthrough (5-15min)
Solving a LeetCode/interview problem step by step.
- Show the problem statement, then brute force, then optimal
- Multiple code versions with transitions between them

---

## Scene Order for Multi-Operation Videos

When explaining all operations on a data structure, order by teaching dependency:

1. **Construction/Basics first**: insert, append
2. **Read operations next**: search, traverse
3. **Mutation operations**: delete, update
4. **Advanced algorithms last**: reverse, detect cycle, merge

Each operation should build on knowledge from the previous one.

---

## Checklist for a New Video

- [ ] Hook: first 3 seconds grab attention
- [ ] Each step changes exactly one thing
- [ ] Steps have >=40 frames each
- [ ] Captions are <=40 characters
- [ ] First step shows initial state
- [ ] Last step shows final result with summary
- [ ] Code is highlighted BEFORE diagram animates
- [ ] Complexity badge shown on title card
- [ ] Total duration matches target platform
