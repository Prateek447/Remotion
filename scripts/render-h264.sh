#!/usr/bin/env bash
#
# render-h264.sh — same 2-step pipeline as render.sh but final encode is
# H.264 high-profile 8-bit instead of H.265 10-bit.
#
# Use this when uploading to a platform that re-encodes aggressively
# from H.265 sources (rare, but happens). H.264 source survives those
# re-encodes more reliably even though it has slightly worse banding.
#
# The dithering noise overlay we apply at render time means the H.264
# output still looks good.
#
# Usage:
#   ./scripts/render-h264.sh <CompositionId> [outputName]

set -euo pipefail

COMP="${1:-}"
if [[ -z "$COMP" ]]; then
  echo "Usage: $0 <CompositionId> [outputName]"
  exit 1
fi

OUT_NAME="${2:-${COMP}}"
MASTER="out/${OUT_NAME}.master.mov"
FINAL="out/${OUT_NAME}.h264.mp4"

mkdir -p out

if [[ ! -f "$MASTER" ]]; then
  echo ""
  echo "================================================================"
  echo "  STEP 1/2  Rendering ProRes 4444 master at 2x scale (4K)"
  echo "================================================================"
  echo ""

  npx remotion render src/index.ts "${COMP}" "${MASTER}" \
    --codec=prores \
    --prores-profile=4444 \
    --image-format=png \
    --scale=2 \
    --color-space=bt709 \
    --audio-bitrate=320K
else
  echo "Reusing existing master: ${MASTER}"
fi

echo ""
echo "================================================================"
echo "  STEP 2/2  Downscaling with Lanczos -> H.264 high CRF 16"
echo "================================================================"
echo ""

ffmpeg -y -i "${MASTER}" \
  -vf "scale=iw/2:ih/2:flags=lanczos+accurate_rnd+full_chroma_int+full_chroma_inp" \
  -c:v libx264 \
  -crf 16 \
  -preset slow \
  -profile:v high \
  -pix_fmt yuv420p \
  -x264-params "colorprim=bt709:transfer=bt709:colormatrix=bt709" \
  -c:a aac \
  -b:a 320k \
  -movflags +faststart \
  "${FINAL}"

echo ""
echo "  Final: $(du -h "${FINAL}" | cut -f1)  ${FINAL}"
