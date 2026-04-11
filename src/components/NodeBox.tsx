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
}

const highlightColorMap: Record<string, { bg: string; dark: string }> = {
  active: { bg: "#2E7D32", dark: "#1B5E20" },
  found: { bg: "#2196F3", dark: "#1565C0" },
  removing: { bg: "#c0392b", dark: "#962d22" },
  error: { bg: "#c0392b", dark: "#962d22" },
  new: { bg: "#9C6ADE", dark: "#8455C0" },
  visited: { bg: "#37474F", dark: "#263238" },
  none: { bg: colors.nodeDefault, dark: colors.nodeDefaultDark },
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
  const isEmphasized = highlight !== "none";
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
  const rightSectionW = w * 0.3;

  const removingGlow = isRemoving
    ? `0 0 ${6 + pulseIntensity * 14}px ${palette.bg}dd, 0 0 ${16 + pulseIntensity * 24}px ${palette.bg}77, 0 0 ${30 + pulseIntensity * 20}px ${palette.bg}33`
    : null;
  const boxShadow = removingGlow
    || (isEmphasized
      ? `0 0 6px ${palette.bg}cc, 0 0 18px ${palette.bg}55`
      : `0 0 4px ${palette.bg}99, 0 0 12px ${palette.bg}33`);

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
        display: "flex",
        borderRadius: 6,
        overflow: "hidden",
        border: `1.5px solid ${palette.bg}99`,
        boxShadow,
      }}
    >
      {/* Value section */}
      <div
        style={{
          flex: 1,
          background: palette.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fonts.mono,
          fontSize: valueFontSize,
          fontWeight: 800,
          color: "#fff",
        }}
      >
        {value}
      </div>
      {/* Divider */}
      <div
        style={{
          width: dividerW,
          background: "rgba(255,255,255,0.35)",
          boxShadow: "0 0 4px rgba(255,255,255,0.4)",
        }}
      />
      {/* Next-pointer section */}
      <div
        style={{
          width: rightSectionW,
          background: palette.dark,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width={14}
          height={14}
          viewBox="0 0 16 16"
          style={{ filter: "drop-shadow(0 0 3px rgba(255,255,255,0.8))" }}
        >
          <path
            d="M4 8 L12 8 M9 5 L12 8 L9 11"
            stroke="rgba(255,255,255,0.95)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
};
