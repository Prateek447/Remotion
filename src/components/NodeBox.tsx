import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import type { NodeHighlight } from "../lib/types";
import { colors, fonts, springPresets } from "../lib/theme";

interface NodeBoxProps {
  value: number | string;
  highlight?: NodeHighlight;
  x: number;
  y: number;
  w: number;
  h: number;
  delay?: number;
  localStepFrame?: number;
  isNull?: boolean;
  exitProgress?: number;
  reversed?: boolean;
  address?: string;
  nextAddress?: string;
}

// Each entry has three stops:
//   light → ONE shade brighter than bg (a saturated highlight, NOT pastel)
//   bg    → the "true" colour — what the node mostly looks like
//   dark  → rolled-off shadow at the bottom-right of the gradient
// Together they produce a **subtle** self-illuminated look: the body stays
// saturated, only the top-left lifts a touch, and the outer bloom does the
// heavy emission work. (Earlier we used near-white pastels for `light` — it
// looked washed out / plasticky, like a glossy button rather than a glow.)
const highlightColorMap: Record<string, { light: string; bg: string; dark: string }> = {
  active: { light: "#A78BFA", bg: "#8B5CF6", dark: "#6D28D9" },
  found: { light: "#60A5FA", bg: "#3B82F6", dark: "#1D4ED8" },
  removing: { light: "#FB7185", bg: "#FF6B8A", dark: "#BE123C" },
  error: { light: "#FB7185", bg: "#FF6B8A", dark: "#BE123C" },
  new: { light: "#C084FC", bg: "#A855F7", dark: "#7E22CE" },
  pinned: { light: "#C084FC", bg: "#A855F7", dark: "#7E22CE" },
  none: { light: "#60A5FA", bg: colors.nodeDefault, dark: "#1D4ED8" },
};

export const NodeBox: React.FC<NodeBoxProps> = ({
  value,
  highlight = "none",
  x,
  y,
  w,
  h,
  delay = 0,
  localStepFrame = 0,
  isNull = false,
  exitProgress,
  reversed = false,
  address,
  nextAddress,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterP = spring({ frame, fps, delay, config: springPresets.enter });
  const enterOpacity = interpolate(enterP, [0, 1], [0, 1]);
  const enterScale = interpolate(enterP, [0, 0.6, 1], [0.6, 1.04, 1]);
  const enterY = interpolate(enterP, [0, 1], [-16, 0]);

  const isRemoving = highlight === "removing";
  const pulseIntensity = isRemoving
    ? Math.sin(localStepFrame * 0.25) * 0.4 + 0.6
    : 1;
  const shakeDampen = isRemoving
    ? Math.max(0, 1 - localStepFrame / 50) * 3
    : 0;
  const shakeX = shakeDampen > 0 ? Math.sin(localStepFrame * 1.0) * shakeDampen : 0;

  const hasExit = exitProgress !== undefined && exitProgress > 0;
  const exitScale = hasExit ? interpolate(exitProgress, [0, 1], [1, 0.3]) : 1;
  const exitOpacity = hasExit
    ? interpolate(exitProgress, [0, 0.7], [1, 0], { extrapolateRight: "clamp" })
    : 1;
  const exitY = hasExit ? interpolate(exitProgress, [0, 1], [0, 70]) : 0;
  const exitRotation = hasExit ? interpolate(exitProgress, [0, 1], [0, -12]) : 0;

  if (isNull) {
    const nullW = w * 0.45;
    const nullH = h * 0.7;
    return (
      <div
        style={{
          position: "absolute",
          left: x + (w - nullW) / 2,
          top: y + enterY + (h - nullH) / 2,
          width: nullW,
          height: nullH,
          transform: `scale(${enterScale})`,
          opacity: enterOpacity * 0.85,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 6,
          border: `1.5px dashed ${colors.nullNode}cc`,
          boxShadow: `0 0 8px ${colors.nullNode}55`,
          fontFamily: fonts.mono,
          fontSize: Math.max(13, h * 0.26),
          fontWeight: 600,
          color: colors.nullNode,
          letterSpacing: 0.5,
        }}
      >
        null
      </div>
    );
  }

  const palette = highlightColorMap[highlight] || highlightColorMap.none;
  const isEmphasized = highlight !== "none" && highlight !== "pinned";
  const valueFontSize = Math.max(18, Math.min(28, h * 0.46));

  const emphasisP = isEmphasized
    ? spring({
        frame: Math.max(0, localStepFrame),
        fps,
        config: springPresets.emphasis,
      })
    : 0;
  const emphasisScale = isEmphasized
    ? interpolate(emphasisP, [0, 0.5, 1], [1, 1.05, 1.0])
    : 1;

  const isError = highlight === "error";
  const isVisited = highlight === "visited";
  const contextOpacity = isError ? 0.4 : isVisited ? 0.55 : 1;
  const finalScale = enterScale * emphasisScale * exitScale;

  const dividerW = 1;
  const pointerSectionW = w * 0.3;

  const bloomIntensity = isRemoving
    ? 0.55 + pulseIntensity * 0.45
    : isEmphasized
      ? 0.85
      : 0.55;
  // Surface "emission" — a *subtle* lift toward white at the top-left of
  // the node. Kept low (max ~25%) so the body stays saturated and the
  // outer bloom does the visible glow work. Higher values made everything
  // look plasticky and washed out.
  const emissionAlpha = isRemoving
    ? 0.20 + pulseIntensity * 0.15
    : isEmphasized
      ? 0.22
      : 0.14;
  const innerShadow = isEmphasized
    ? `inset 0 1px 1px rgba(255,255,255,0.22), inset 0 -1px 2px rgba(0,0,0,0.35)`
    : `inset 0 1px 1px rgba(255,255,255,0.14), inset 0 -1px 2px rgba(0,0,0,0.30)`;

  const arrowPath = reversed
    ? "M12 8 L4 8 M7 5 L4 8 L7 11"
    : "M4 8 L12 8 M9 5 L12 8 L9 11";

  const pointerSection = (
    <div
      style={{
        width: pointerSectionW,
        // Pointer section reads as a "recessed back panel" containing
        // pointer info — kept darker than the value section so the value
        // side is clearly the emissive face and this side is the shadow.
        background: palette.dark,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {nextAddress ? (
        <span
          style={{
            fontFamily: fonts.mono,
            fontSize: Math.max(10, h * 0.20),
            fontWeight: 600,
            color: "rgba(255,255,255,0.9)",
            letterSpacing: 0.3,
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            transform: "rotate(180deg)",
            lineHeight: 1,
          }}
        >
          {nextAddress}
        </span>
      ) : (
        <svg
          width={14}
          height={14}
          viewBox="0 0 16 16"
          style={{ filter: "drop-shadow(0 0 3px rgba(255,255,255,0.8))" }}
        >
          <path
            d={arrowPath}
            stroke="rgba(255,255,255,0.95)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );

  const valueSection = (
    <div
      style={{
        position: "relative",
        flex: 1,
        // Smaller, off-centre highlight: lighter only in the top-left
        // 25%, body remains the saturated bg colour, bottom-right rolls
        // into the dark shadow stop. Mimics how a glowing object in 3D
        // catches more light at one shoulder.
        background: `radial-gradient(ellipse 90% 80% at 25% 20%, ${palette.light} 0%, ${palette.bg} 45%, ${palette.dark} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: fonts.mono,
        fontSize: valueFontSize,
        fontWeight: 800,
        color: "#fff",
        textShadow: "0 1px 2px rgba(0,0,0,0.45)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 60% 50% at 25% 20%, rgba(255,255,255,${emissionAlpha}) 0%, transparent 70%)`,
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />
      <span style={{ position: "relative" }}>{value}</span>
    </div>
  );

  const divider = (
    <div
      style={{
        width: dividerW,
        background: "rgba(255,255,255,0.35)",
        boxShadow: "0 0 4px rgba(255,255,255,0.4)",
      }}
    />
  );

  const haloLayers = (
    <>
      <div
        style={{
          position: "absolute",
          left: -w * 0.6,
          top: -h * 0.9,
          width: w * 2.2,
          height: h * 2.8,
          background: `radial-gradient(ellipse at center, ${palette.bg} 0%, ${palette.bg}00 60%)`,
          filter: "blur(40px)",
          opacity: 0.55 * bloomIntensity,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -w * 0.25,
          top: -h * 0.4,
          width: w * 1.5,
          height: h * 1.8,
          background: `radial-gradient(ellipse at center, ${palette.bg} 0%, ${palette.bg}00 65%)`,
          filter: "blur(18px)",
          opacity: 0.7 * bloomIntensity,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: -8,
          borderRadius: 12,
          background: palette.bg,
          filter: "blur(6px)",
          opacity: 0.5 * bloomIntensity,
          pointerEvents: "none",
        }}
      />
    </>
  );

  return (
    <div
      style={{
        position: "absolute",
        left: x + shakeX,
        top: y + enterY + exitY,
        width: w,
        height: h,
        transform: `scale(${finalScale}) rotate(${exitRotation}deg)`,
        transformOrigin: "center center",
        opacity: enterOpacity * contextOpacity * exitOpacity,
      }}
    >
      {haloLayers}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          borderRadius: 6,
          overflow: "hidden",
          border: `1.5px solid ${palette.light}`,
          boxShadow: innerShadow,
        }}
      >
        {reversed ? (
          <>{pointerSection}{divider}{valueSection}</>
        ) : (
          <>{valueSection}{divider}{pointerSection}</>
        )}
      </div>
    </div>
  );
};
