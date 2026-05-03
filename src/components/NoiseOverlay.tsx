import React from "react";
import { AbsoluteFill } from "remotion";

/**
 * A subtle, full-screen noise overlay used to **dither** the underlying
 * frame. The reason this exists is purely encoder-friendliness:
 *
 * Soft glow gradients (the kind produced by `filter: blur()` halos) are
 * exactly the content that H.264/H.265 quantize most aggressively. The
 * encoder sees a "flat" low-frequency region and snaps adjacent pixel
 * values to the same quantized level, producing visible **banding** in the
 * exported video.
 *
 * Adding a tiny amount of high-frequency noise breaks up that flatness so
 * the encoder treats it as detail and preserves more of the gradient.
 *
 * Implementation: a single pre-rendered SVG `feTurbulence` patch tiled
 * over the frame, blended with `mix-blend-mode: overlay` at very low
 * opacity. Visually imperceptible at viewing distance, but devastatingly
 * effective at killing banding.
 */
const noiseSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
  <filter id='n'>
    <feTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='2' stitchTiles='stitch'/>
    <feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0'/>
  </filter>
  <rect width='100%' height='100%' filter='url(#n)'/>
</svg>`;

const noiseDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(noiseSvg)}`;

interface NoiseOverlayProps {
  /** Overlay opacity. 0.025 (default) is invisible to viewers but eliminates
   *  banding. Going above 0.05 starts to be perceptible. */
  opacity?: number;
}

export const NoiseOverlay: React.FC<NoiseOverlayProps> = ({ opacity = 0.025 }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url("${noiseDataUrl}")`,
        backgroundRepeat: "repeat",
        backgroundSize: "200px 200px",
        mixBlendMode: "overlay",
        opacity,
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />
  );
};
