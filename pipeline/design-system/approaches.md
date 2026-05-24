# Presentation Approaches

The **shape** of the explanation is a first-class decision before any code, narration, or visuals. Same topic, different shape, completely different teaching moments.

This doc describes:
- The dynamic discovery process Claude runs at the start of stage 1
- The codebase-compatible default (`algorithm-walkthrough`) that's always one of the 4 options
- Common archetypes Claude maps community findings against
- The schema fields that record the chosen approach

---

## Stage 1a: Approach Discovery

Before writing any scene.yaml, Claude does community research and presents 4 ranked options. This is **conversational, Claude-initiated** — not a CLI tool.

### The discovery process

1. **Research the community** — how do good explainers teach this specific topic?
   - `WebSearch` for: `"<topic>" tutorial`, `"<topic>" explained`, `how to teach <topic>`
   - `WebFetch` selected sources from the search results:
     - Educator video transcripts (3Blue1Brown, NeetCode, Computerphile, MIT OCW)
     - High-quality blog posts (Brilliant, Visualgo, GeeksforGeeks, dev.to)
     - Textbook excerpts (CLRS chapter intros, Sedgewick)
   - Read ≥5 sources; identify the distinct presentation patterns in use
   - Note which audience each pattern targets (beginner / intermediate / expert)

2. **Analyze and group** the variations:
   - Cluster similar approaches
   - Identify 3 most **distinct** approaches actually used for this topic
   - Discard approaches that don't fit our codebase primitives (e.g., require a 3D visualization we don't have)

3. **Rank the 3 community findings** by:
   - **Clarity for beginners** — does this approach teach, or review? (see `teaching.md`)
   - **Visual feasibility** — can the scaffolder + existing components support this without custom work?
   - **Distinctness from `algorithm-walkthrough`** — avoid near-duplicates of the default

4. **Present 4 options via `AskUserQuestion`**:
   - Option 1 (always): `algorithm-walkthrough` (the codebase default)
   - Options 2–4: top 3 from community research

5. **Record the choice** in `scene.yaml` as `approach` + `approachNotes`.

### The AskUserQuestion shape

When asking the user to pick, the question has:
- A single sentence framing the topic
- 4 options, each with: a short kebab-case identifier as the label header, 1–2 sentence description, and the source(s) the approach was distilled from

Example for "binary search":

```
Question: "Which approach should I use to explain binary search?"
Header:   "Approach"

Options:
  1. algorithm-walkthrough
     "Show a sorted array, point at the target, trace each loop iteration.
      Matches all existing scenes in this codebase. Default."

  2. visual-intuition
     "Open with a number-line halving animation before any code. Build the
      geometric intuition first; introduce the algorithm second.
      Sources: 3Blue1Brown, Visualgo."

  3. brute-force-to-optimal
     "Start with linear search O(n); contrast with binary search O(log n).
      Teaching moment is the complexity jump.
      Sources: NeetCode, CLRS chapter intro."

  4. guessing-game-analogy
     "Open with 'guess a number 1-100' framing; derive the algorithm
      from the optimal guessing strategy.
      Sources: MIT 6.006 lecture, Khan Academy."
```

The user picks one (or "Other" to describe a custom approach). The choice goes into `scene.yaml`.

### Why `algorithm-walkthrough` is always present

The scaffolder, patterns docs, and components are tuned for this archetype. Every existing scene uses it. Choosing this approach guarantees:

- Scaffolder emits valid TSX immediately (no new templates needed)
- Existing patterns (`linked-list.md`, `tree.md`) apply directly
- No new visual primitives required

Other approaches may require:
- New scaffolder templates (significant work)
- New diagram components
- Custom pattern documentation

`algorithm-walkthrough` is the friction-free option. The other 3 give the user real choices about presentation; they may require additional investment but produce more pedagogically appropriate videos for certain topics.

---

## Reference archetypes

This is **not a menu** — these are common archetypes Claude maps community findings against during ranking. New archetypes emerge often; don't constrain the search to this list.

| Archetype | When the community uses it | Codebase support |
|---|---|---|
| `algorithm-walkthrough` | Single-algorithm explainers, data-structure operations | ✅ Full (default) |
| `brute-force-to-optimal` | Problem-solving content where the insight is the optimization | ⚠️ Needs custom step shape (sequential approach reveal) |
| `concept-first` | Foundational topics ("what is recursion?") | ⚠️ May need abstract visualization steps |
| `comparison-driven` | "X vs Y" content (BFS vs DFS) | ⚠️ Needs side-by-side layout work |
| `problem-derive` | Interview prep, constraint analysis | ⚠️ Needs problem-statement scene type |
| `analogy-first` | Absolute-beginner content; metaphor opens the scene | ⚠️ Needs analogy visual (often custom) |
| `visual-intuition` | Geometric/spatial topics, graph theory | ⚠️ Needs custom geometric primitives |
| `socratic` | Engagement-driven, "test yourself" content | ⚠️ Needs question-then-pause step shape |
| `historical` | "Famous algorithm" content (Dijkstra origin, etc.) | ⚠️ Needs historical-figure visual cards |
| `proof-by-induction` | Theoretical CS, correctness arguments | ⚠️ Needs proof-step visualization |

⚠️ doesn't mean "impossible" — it means "scaffolder doesn't have a ready template, expect custom work." The community-found approach may be excellent but require building a new pattern. The user should know this trade-off when choosing.

### Adding a new archetype

When the same non-default approach is used in **two scenes**, document it as a new archetype in this table. Add a new scaffolder template under `pipeline/stages/02-scaffold/templates/` and update `patterns/<data-structure>.md` with conventions.

The "extracted-pattern rule": don't pre-build templates for hypothetical approaches. Build them once a real use case forces them.

---

## Schema fields

```yaml
approach: algorithm-walkthrough        # Required. kebab-case identifier.

approachNotes: |                       # Required. Why this approach was chosen.
  Step-by-step trace of countNodes with full recursion frames shown.
  Community sources surveyed: MIT 6.006 (lecture 18), NeetCode tree traversal
  playlist, GeeksforGeeks "tree size" article. All three default to a
  recursive trace with stack visualization — picked algorithm-walkthrough for
  codebase compatibility.
```

`approach` is required. `approachNotes` is required — it documents the discovery work so future authors (or Claude in a later session) understand why this shape was chosen.

For `algorithm-walkthrough`, `approachNotes` can be brief ("codebase default"). For any other approach, expand: list the community sources surveyed, explain the chosen archetype, and note any custom work needed.

---

## Stage 1 workflow checklist

When the user says "make a video about X":

- [ ] Research the community for X (≥5 sources)
- [ ] Identify 3 distinct approaches in use
- [ ] Rank by clarity / feasibility / distinctness
- [ ] Present 4 options via `AskUserQuestion` (option 1 = algorithm-walkthrough)
- [ ] Wait for user choice
- [ ] Record `approach` + `approachNotes` in scene.yaml
- [ ] Proceed to step authoring with the chosen approach

Skipping the research step (picking the approach without consulting the community) is the failure mode. The whole point of stage 1a is that the AI doesn't unilaterally decide explanation shape based on its training-set bias.

---

## When `algorithm-walkthrough` is wrong

The default is right for ~70% of topics. It's wrong when:

- The topic is more about a **trade-off** than an algorithm → `comparison-driven`
- The topic is a **paradigm** (recursion, dynamic programming as concepts) → `concept-first`
- The "lesson" is a specific **insight** rather than the algorithm itself → `brute-force-to-optimal`
- The audience is **truly new to code** → `analogy-first`

Claude's job during discovery is to recognize these signals from how the community teaches the topic. If 4 of 5 sources lead with an analogy, `algorithm-walkthrough` is probably the wrong default for this specific topic — even though it's our codebase default.
