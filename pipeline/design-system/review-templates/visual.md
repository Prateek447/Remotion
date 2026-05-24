# Visual Review — <sceneId>

**Date**: <YYYY-MM-DD>
**Preview file**: `out/<TitleCase>-preview.mp4`
**Scene yaml**: `pipeline/scenes/<sceneId>.yaml`

---

## Overall verdict

Pick one:

- [ ] **Approved** — proceed to audio generation. Skip to "Patterns worth propagating" below.
- [ ] **Needs fixes** — list issues below.

---

## Issues observed

For each issue, fill in the block. Add as many as needed.

### Issue 1: <one-line summary>

- **Step(s)**: <stepIndex or range, e.g. "step 4" or "steps 4-5">
- **What I see**: <description of the current behavior in the preview>
- **What I want**: <description of the desired behavior>
- **Severity**: blocking | improvement | nit

### Issue 2: <one-line summary>

- **Step(s)**:
- **What I see**:
- **What I want**:
- **Severity**:

(repeat as needed)

---

## Patterns worth propagating to design-system

⭐ **This section closes the feedback loop**. If any issue above is a CROSS-SCENE pattern (not just this scene's quirk), name it here along with which design-system doc should encode it.

Format: `<pattern observation>` → `<design-system doc>`

Examples (illustrative — replace with your actual observations):

- "Recursion descent needs an intermediate frame showing the path from parent to child" → `patterns/tree.md` "Recursive algorithm pattern"
- "Final answer needs a big number overlay, not just a caption" → `teaching.md` Rule 8
- "Reel layouts crowd the bottom when there are 3+ pointers" → `patterns/linked-list.md` "Pointer conventions"

If a piece of feedback is **scene-specific** (only matters for this one scene), don't put it here — it'll just be applied to scene.yaml.

---

## Next step

When this file is complete, ask Claude:

> "Apply visual fixes from `pipeline/review/<sceneId>-visual.md`. Re-render the preview. If I noted any propagation patterns, update the corresponding design-system docs."

Claude will:

1. Read all issues and identify which `scene.yaml` fields to change.
2. Edit `scene.yaml`.
3. Update referenced design-system docs with the propagation patterns (if any).
4. Re-run `scaffold` + `render-preview`.
5. Tell you it's ready for re-review.

Iterate until verdict is "approved." Then move to **stage 3 — audio**.
