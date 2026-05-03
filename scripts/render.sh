#!/usr/bin/env bash
#
# render.sh — bulletproof 2-step render pipeline
#
# Step 1: Render the composition at 2x scale (supersampled) into a
#         lossless ProRes 4444 master. This file is huge but
#         compression-free, perfect as an archival source.
#
# Step 2: Downscale the master back to native resolution using ffmpeg's
#         Lanczos resampler, then encode H.265 10-bit at CRF 18.
#         10-bit (yuv420p10le) gives 4x more color levels than 8-bit,
#         which kills banding in soft glow gradients.
#
# Usage:
#   ./scripts/render.sh <CompositionId> [outputName]
#
# Examples:
#   ./scripts/render.sh Reel-DetectCycle
#   ./scripts/render.sh Video-Reverse reverse-final.mp4
#
# Output:
#   out/<output>.mov   (ProRes 4444 master, 4K, ~10x size)
#   out/<output>.mp4   (H.265 10-bit final, native resolution, delivery)

set -euo pipefail

COMP="${1:-}"
if [[ -z "$COMP" ]]; then
  echo "Usage: $0 <CompositionId> [outputName]"
  echo ""
  echo "Common composition IDs:"
  echo "  Reel-InsertHead, Reel-InsertTail, Reel-DeleteNode"
  echo "  Reel-Reverse, Reel-DetectCycle, Reel-MergeLists"
  echo "  Video-InsertHead, Video-Reverse, Video-DetectCycle"
  exit 1
fi

OUT_NAME="${2:-${COMP}}"
MASTER="out/${OUT_NAME}.master.mov"
FINAL="out/${OUT_NAME}.mp4"

mkdir -p out

echo ""
echo "================================================================"
echo "  STEP 1/2  Rendering ProRes 4444 master at 2x scale (4K)"
echo "  Composition: ${COMP}"
echo "  Output:      ${MASTER}"
echo "================================================================"
echo ""

npx remotion render src/index.ts "${COMP}" "${MASTER}" \
  --codec=prores \
  --prores-profile=4444 \
  --image-format=png \
  --scale=2 \
  --color-space=bt709 \
  --audio-bitrate=320K

echo ""
echo "================================================================"
echo "  STEP 2/2  Downscaling with Lanczos -> H.265 10-bit CRF 18"
echo "  Output:    ${FINAL}"
echo "================================================================"
echo ""

ffmpeg -y -i "${MASTER}" \
  -vf "scale=iw/2:ih/2:flags=lanczos+accurate_rnd+full_chroma_int+full_chroma_inp" \
  -c:v libx265 \
  -crf 18 \
  -preset slow \
  -pix_fmt yuv420p10le \
  -tag:v hvc1 \
  -x265-params "profile=main10:level=5.1:colorprim=bt709:transfer=bt709:colormatrix=bt709" \
  -c:a aac \
  -b:a 320k \
  -movflags +faststart \
  "${FINAL}"

echo ""
echo "================================================================"
echo "  DONE"
echo "  Master: $(du -h "${MASTER}" | cut -f1)  ${MASTER}"
echo "  Final:  $(du -h "${FINAL}"  | cut -f1)  ${FINAL}"
echo "================================================================"
echo ""
echo "  Master is the archival source — keep or delete as you wish."
echo "  Final is delivery-ready (Instagram/YouTube compatible)."
