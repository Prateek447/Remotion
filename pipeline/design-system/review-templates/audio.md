# Audio Review — <sceneId>

**Date**: <YYYY-MM-DD>
**Audio files**: `public/narration/<sceneId>/step-*.mp3`
**Scene yaml**: `pipeline/scenes/<sceneId>.yaml`
**Persona**: <current voice.persona>

---

## Overall verdict

Pick one:

- [ ] **Approved** — proceed to apply timings + final render. Skip to "Patterns worth propagating" below.
- [ ] **Needs fixes** — list issues below.

---

## Issues observed

For each issue, fill in the block.

### Issue 1: <one-line summary>

- **Step(s)**: <stepIndex>
- **Chunk id(s)** (if you isolated the bad chunk via `chunks/step-N-N.M.wav`): <chunk id>
- **Problem class**: flat | rushed | mispronounced | wrong-tone | sounds-off | persona-mismatch | needs-more-chunks
- **Specific quote**: "<the audio segment that's wrong>"
- **Suggested fix**: one of:
  - Tune the chunk's `params` (e.g., `{ exaggeration: 0.85, cfg_weight: 0.40 }`) in `<scene>.narration.yaml`
  - Split a chunk in two (different beats need different params)
  - Adjust `pauseAfter` on the chunk before this one
  - Rewrite the chunk's `text` (paste the new text)
  - Lock a take with `seed: <int>` if the take landed right but won't survive regeneration
  - Change scene-level persona (e.g., `teacher-energetic` → `measured`) — content-style change, requires re-running scaffold + retuning
- **Severity**: blocking | improvement | nit

### Issue 2: <one-line summary>

- **Step(s)**:
- **Problem class**:
- **Specific quote**:
- **Suggested fix**:
- **Severity**:

(repeat as needed)

---

## Patterns worth propagating to design-system

⭐ If an issue above is a CROSS-SCENE pattern, name it here.

Format: `<observation>` → `<design-system doc>`

Examples (illustrative):

- "TTS consistently mispronounces 'Dijkstra' — needs phonetic respelling" → `teaching.md` TTS-readiness section
- "Peak-reveal chunks at ex=0.95 sound shouty when the previous chunk was at cfg=0.55" → `teaching.md` param tier legend; consider an intermediate chunk
- "Methodical scenes feel rushed at the scaffolder's seed cfg=0.55" → `voice/personas/teacher-energetic.md` seed palette tuning

If feedback is **scene-specific** (just this scene), don't put it here.

---

## Next step

When this file is complete, ask Claude:

> "Apply audio fixes from `pipeline/review/<sceneId>-audio.md`. Regenerate affected step MP3s. If I noted any propagation patterns, update the corresponding design-system docs."

Claude will:

1. Read all issues and identify which chunk `params`, `pauseAfter`, `text`, or split decisions need changes in `<scene>.narration.yaml`.
2. Edit the sidecar.
3. Update referenced design-system docs with the propagation patterns (if any).
4. Regenerate ONLY the affected step MP3s via `--step N --force`.
5. Tell you it's ready for re-review.

Iterate until verdict is "approved." Then Claude runs `apply` (timings reconciliation) automatically as the last action of stage 3 — at that point the audio is final, durations are final, and the .tsx is patched with real frame offsets. **Stage 4 is then just the final render with audio.**
