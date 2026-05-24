#!/usr/bin/env bash
# pipeline/run.sh — One-scene pipeline orchestrator with review gates.
#
# Pipeline flow (4 stages, with review gates inside stages 2 and 3):
#
#   Stage 1 (AUTHOR — conversational, not in this script)
#     1a. Claude researches community approaches for the topic
#     1b. AskUserQuestion presents 4 options; user picks one
#     1c. Claude writes scene.yaml
#
#   Stage 2 (VISUAL)
#     2a. validate           — schema + contract check
#     2b. scaffold           — emit .tsx + paste snippets
#     2c. narration-preview  — TTS-readiness lint + per-step preset table
#         (user pastes 4 snippets into Root.tsx / standalone / code-snippets / SCENES)
#     2d. render-preview     — silent video using targetFrames timing
#     2e. review-visual      — instructions for visual review + Claude fix loop
#         (user iterates with Claude; propagation patterns updated in design-system)
#
#   Stage 3 (AUDIO + ASSEMBLY)
#     3a. audio              — pipeline-native audio gen (reads scene.yaml)
#     3b. review-audio       — instructions for audio review + Claude fix loop
#         (user iterates with Claude; propagation patterns updated in design-system)
#     3c. apply              — apply real timings to .tsx (LAST step of stage 3,
#                              runs once audio is approved by the user)
#
#   Stage 4 (FINAL RENDER)
#     4a. render             — final render with audio
#
# Usage:
#   bash pipeline/run.sh <scene.yaml> [stage]
#
# Stages can be invoked individually or via the meta-stages below.

set -euo pipefail

SCENE_YAML="${1:-}"
STAGE="${2:-prefix}"

if [[ -z "$SCENE_YAML" ]]; then
  cat <<'USAGE'
Usage: bash pipeline/run.sh <scene.yaml> [stage]

Stage 1 (AUTHOR) — conversational, not in this script.
  Claude researches community approaches for the topic and asks via
  AskUserQuestion. See design-system/approaches.md.

Stage 2 (VISUAL):
  validate            — schema + contract check
  scaffold            — emit .tsx + paste snippets
  narration-preview   — TTS-readiness lint + per-step preset preview
  render-preview      — silent video using targetFrames timing
  review-visual       — print review/fix-loop instructions

Stage 3 (AUDIO + ASSEMBLY):
  audio               — pipeline-native audio gen
  review-audio        — print review/fix-loop instructions
  apply               — apply timings to .tsx + narration-scripts.ts
                        (LAST step of stage 3, after audio is approved)

Stage 4 (FINAL RENDER):
  render              — final render with audio

Meta-stages (run multiple stages in sequence):
  prefix              — validate + scaffold + narration-preview (default)
  preview             — render-preview + review-visual (after paste)
  audio-stage         — audio + review-audio (iterate before apply)
  finalize            — apply + render

USAGE
  exit 1
fi

if [[ ! -f "$SCENE_YAML" ]]; then
  echo "Not found: $SCENE_YAML"
  exit 1
fi

# Derive identifiers from the YAML.
SCENE_ID=$(python3 -c "import yaml,sys; print(yaml.safe_load(open(sys.argv[1]))['sceneId'])" "$SCENE_YAML")
TITLE_CASE=$(python3 -c "
import yaml,sys
d = yaml.safe_load(open(sys.argv[1]))
print(d.get('componentName') or ''.join(w.capitalize() for w in d['sceneId'].split('-')))
" "$SCENE_YAML")

step() { echo; echo "▶ $1"; }
hint() { echo "   → $1"; }
divider() { echo "═══════════════════════════════════════════════════════════════"; }

# ─── Stage 2 ─────────────────────────────────────────────────────────────────

validate_stage() {
  step "Stage 2a — Validate $SCENE_YAML"
  python3 pipeline/stages/01-validate/validate.py "$SCENE_YAML"
}

scaffold_stage() {
  step "Stage 2b — Scaffold src/scenes/${TITLE_CASE}.tsx"
  if [[ -f pipeline/stages/02-scaffold/scaffold.py ]]; then
    python3 pipeline/stages/02-scaffold/scaffold.py "$SCENE_YAML"
  else
    hint "scaffolder not yet built — author src/scenes/${TITLE_CASE}.tsx by hand"
    hint "using pipeline/design-system/patterns/ as the convention reference"
  fi
}

narration_preview_stage() {
  step "Stage 2c — Narration preview (lint + persona × arc presets)"
  python3 pipeline/stages/03-narration/preview.py "$SCENE_YAML"
}

render_preview_stage() {
  step "Stage 2d — Render silent preview (targetFrames timing)"
  hint "Output: out/${TITLE_CASE}-preview.mp4"
  hint "Uses targetFrames-based startFrames (audio durations not yet measured)."
  echo
  npx remotion render src/index.ts "Video-${TITLE_CASE}" "out/${TITLE_CASE}-preview.mp4"
  echo
  hint "Preview rendered. Open it to review."
}

review_visual_stage() {
  step "Stage 2e — Visual review"
  divider
  echo "REVIEW STEPS:"
  echo
  echo "  1. Open out/${TITLE_CASE}-preview.mp4 and watch it end-to-end."
  echo
  echo "  2. Copy the visual review template to your scene's review file:"
  echo
  echo "       cp pipeline/design-system/review-templates/visual.md \\"
  echo "          pipeline/review/${SCENE_ID}-visual.md"
  echo
  echo "  3. Fill in pipeline/review/${SCENE_ID}-visual.md with:"
  echo "       - Overall verdict (approved / needs fixes)"
  echo "       - One block per issue (step, what you see, what you want, severity)"
  echo "       - Propagation patterns (cross-scene insights → design-system docs)"
  echo
  echo "  4. When the file is complete, ask Claude:"
  echo
  echo "       \"Apply visual fixes from pipeline/review/${SCENE_ID}-visual.md."
  echo "        Re-render the preview. If I noted propagation patterns, update"
  echo "        the corresponding design-system docs.\""
  echo
  echo "  5. Re-review the new preview. Iterate until verdict is 'approved'."
  echo
  echo "  6. Then proceed to stage 3:"
  echo
  echo "       bash pipeline/run.sh $SCENE_YAML audio-stage"
  divider
}

# ─── Stage 3 ─────────────────────────────────────────────────────────────────

audio_stage() {
  step "Stage 3a — Generate audio (pipeline-native, reads scene.yaml directly)"
  hint "Takes several minutes per scene."
  python3 pipeline/stages/05-audio/generate.py "$SCENE_YAML"
  if [[ ! -d "public/narration/$SCENE_ID" ]]; then
    echo "✘ public/narration/$SCENE_ID not found — generation failed?"
    exit 1
  fi
}

review_audio_stage() {
  step "Stage 3b — Audio review"
  divider
  echo "REVIEW STEPS:"
  echo
  echo "  1. Listen to each clip in public/narration/${SCENE_ID}/step-N.mp3"
  echo
  echo "  2. Copy the audio review template:"
  echo
  echo "       cp pipeline/design-system/review-templates/audio.md \\"
  echo "          pipeline/review/${SCENE_ID}-audio.md"
  echo
  echo "  3. Fill in pipeline/review/${SCENE_ID}-audio.md with:"
  echo "       - Overall verdict"
  echo "       - Issues (step, problem class, quote, suggested fix, severity)"
  echo "       - Propagation patterns (e.g., 'persona X needs adjustment at peak')"
  echo
  echo "  4. When the file is complete, ask Claude:"
  echo
  echo "       \"Apply audio fixes from pipeline/review/${SCENE_ID}-audio.md."
  echo "        Regenerate affected step MP3s. If I noted propagation patterns,"
  echo "        update the corresponding design-system docs.\""
  echo
  echo "  5. Re-listen to the new clips. Iterate until verdict is 'approved'."
  echo
  echo "  6. Then run apply (last step of stage 3) — this reconciles real audio"
  echo "     durations into the scene .tsx and narration-scripts.ts:"
  echo
  echo "       bash pipeline/run.sh $SCENE_YAML apply"
  echo
  echo "  7. Finally, stage 4 — final render:"
  echo
  echo "       bash pipeline/run.sh $SCENE_YAML render"
  echo
  echo "  (Or run both as one command: bash pipeline/run.sh $SCENE_YAML finalize)"
  divider
}

apply_stage() {
  step "Stage 3c — Apply timings (pipeline-native)"
  hint "Reconciles audio durations into startFrames + SCENE_FRAMES + Durations array."
  hint "Reads scene.yaml directly — no SCENES dict registration required."
  python3 pipeline/stages/06-apply/apply.py "$SCENE_YAML"
}

# ─── Stage 4 ─────────────────────────────────────────────────────────────────

render_stage() {
  step "Stage 4 — Final render with audio"
  hint "YouTube (1920×1080):"
  echo "    npx remotion render src/index.ts Video-${TITLE_CASE} out/${TITLE_CASE}.mp4"
  hint "Reel (1080×1920):"
  echo "    npx remotion render src/index.ts Reel-${TITLE_CASE} out/${TITLE_CASE}-Reel.mp4"
  echo
  hint "Running both now."
  npx remotion render src/index.ts "Video-${TITLE_CASE}" "out/${TITLE_CASE}.mp4"
  npx remotion render src/index.ts "Reel-${TITLE_CASE}"  "out/${TITLE_CASE}-Reel.mp4"
  echo
  hint "Done. out/${TITLE_CASE}.mp4 and out/${TITLE_CASE}-Reel.mp4 ready."
}

# ─── Dispatch ────────────────────────────────────────────────────────────────

case "$STAGE" in
  validate)              validate_stage ;;
  scaffold)              scaffold_stage ;;
  narration-preview)     narration_preview_stage ;;
  render-preview)        render_preview_stage ;;
  review-visual)         review_visual_stage ;;
  audio)                 audio_stage ;;
  review-audio)          review_audio_stage ;;
  apply)                 apply_stage ;;
  render)                render_stage ;;

  prefix)
    validate_stage
    scaffold_stage
    narration_preview_stage
    echo
    divider
    echo "✅ Stage 2 prefix complete (validate + scaffold + narration-preview)."
    echo
    echo "NEXT: paste the printed snippets above into:"
    echo "  REQUIRED:"
    echo "    - src/data/code-snippets.ts"
    echo "    - src/standalone/index.tsx"
    echo "    - src/Root.tsx"
    echo "  OPTIONAL (only for ad-hoc legacy compat, pipeline doesn't need it):"
    echo "    - scripts/apply-narration-updates.py (SCENES dict)"
    echo
    echo "Then run the visual review pass:"
    echo "    bash pipeline/run.sh $SCENE_YAML preview"
    divider
    ;;

  preview)
    render_preview_stage
    review_visual_stage
    ;;

  audio-stage)
    audio_stage
    review_audio_stage
    ;;

  finalize)
    apply_stage
    render_stage
    ;;

  full)
    validate_stage
    scaffold_stage
    narration_preview_stage
    render_preview_stage
    audio_stage
    apply_stage
    render_stage
    ;;

  *)
    echo "Unknown stage: $STAGE"
    bash "$0"
    exit 1
    ;;
esac
