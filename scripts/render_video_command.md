time npx remotion render Video-BSTInsert out/output.mp4 \
  --codec=h264 \
  --crf=1 \
  --x264-preset=veryslow \
  --image-format=png \
  --scale=2 \
  --color-space=bt709 \
  --gl=angle \
  --concurrency=10


time npx remotion render Video-BSTInsert out/output.mp4 \
  --frames=0-380 \
  --codec=h264 \
  --crf=1 \
  --x264-preset=veryslow \
  --image-format=png \
  --scale=2 \
  --color-space=bt709 \
  --gl=angle \
  --concurrency=10

  time npx remotion render Video-BSTInsert out/output.mp4 --frames=0-380 --codec=h264 --crf=1 --x264-preset=veryslow --image-format=png --scale=2 --color-space=bt709 --gl=angle --concurrency=10