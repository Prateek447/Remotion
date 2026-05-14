import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import type { ThemedToken } from "shiki";
import type { SceneStep } from "../lib/types";
import { useStepTransition } from "../lib/useStepTransition";
import { colors, fonts, springPresets } from "../lib/theme";

interface CodeBlockProps {
  tokens: ThemedToken[][];
  steps: SceneStep[];
  fontSize?: number;
  lineHeight?: number;
  padding?: number;
  centered?: boolean;
  centerWidth?: number;
  bold?: boolean;
}

// JetBrains Mono character width ratio (width / fontSize)
const CHAR_W_RATIO = 0.601;
const PILL_PAD = 10; // breathing room used for centered-layout width calculation

const COLOR_REMAP: Record<string, string> = {
  "#e06c75": "#61AFEF", // red → blue
  "#E06C75": "#61AFEF",
  "#61afef": "#E06C75", // blue → red
  "#61AFEF": "#E06C75",
};


function remapTokenColor(hex: string): string {
  if (COLOR_REMAP[hex]) return COLOR_REMAP[hex];
  const c = hex.replace("#", "");
  if (c.length < 6) return hex;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  if (r > 180 && g > 140 && b < 140) return "#E0E0E0"; // yellow → white
  return hex;
}

// Keywords → node blue, functions/methods → purple, everything else → white
function getTokenColor(shikiColor: string): string {
  const normalized = shikiColor.toUpperCase();
  if (normalized === "#C678DD") return "#0096FF";           // keywords
  if (normalized === "#61AFEF") return "#B07EFF";           // functions / method names
  return "#ffffff";
}


export const CodeBlock: React.FC<CodeBlockProps> = ({
  tokens,
  steps,
  fontSize = 24,
  lineHeight = 2.1,
  padding = 40,
  centered = false,
  centerWidth,
  bold = false,
}) => {
  const frame = useCurrentFrame();
  const { fps, width: canvasWidth } = useVideoConfig();
  const lineH = fontSize * lineHeight;
  const charW = fontSize * CHAR_W_RATIO;

  // When centered, compute left padding so the longest line sits in the middle
  const referenceWidth = centerWidth ?? canvasWidth;
  const longestLineChars = tokens.reduce(
    (max, line) => Math.max(max, line.reduce((acc, tok) => acc + tok.content.length, 0)),
    0,
  );
  const contentWidth = longestLineChars * charW + PILL_PAD * 2;
  const centeredLeft = Math.max(padding, (referenceWidth - contentWidth) / 2);
  const pLeft = centered ? centeredLeft : padding;

  const { current, previous, localFrame } = useStepTransition(steps);

  const currStart = current.highlightLines.startLine;
  const currEnd = current.highlightLines.endLine;

  // Left-to-right wipe: resets every time a new step begins
  const wipeProgress = spring({
    frame: localFrame,
    fps,
    config: { damping: 22, stiffness: 250 },
  });
  const getLineWidthPx = (lineIndex: number) => {
    const lineChars = tokens[lineIndex]?.reduce((acc, tok) => acc + tok.content.length, 0) ?? 0;
    return lineChars * charW + PILL_PAD * 2;
  };

  return (
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize,
        background: "transparent",
        padding,
        paddingLeft: pLeft,
        height: "100%",
        position: "relative",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Per-line highlighter strips — each line gets its own band */}
      {currStart >= 0 &&
        Array.from({ length: currEnd - currStart + 1 }, (_, idx) => {
          const lineIndex = currStart + idx;
          const targetW = getLineWidthPx(lineIndex);
          const stripW  = targetW * wipeProgress;
          return (
            <div
              key={lineIndex}
              style={{
                position: "absolute",
                left: pLeft,
                width: stripW,
                top: padding + lineIndex * lineH + lineH * 0.12,
                height: lineH * 0.76,
                borderRadius: 6,
                background: "#0096FF",
                pointerEvents: "none",
              }}
            />
          );
        })}

      {tokens.map((lineTokens, i) => {
        const currVisible = current.visibleLines;
        const prevVisible = previous.visibleLines;
        const hasRevealControl = currVisible !== undefined;

        const isVisible = !hasRevealControl || i < currVisible;
        const wasVisible = !hasRevealControl || prevVisible === undefined || i < prevVisible;
        const isNewlyRevealed = hasRevealControl && isVisible && !wasVisible;

        if (!isVisible) {
          return (
            <div key={i} style={{ whiteSpace: "pre", lineHeight: `${lineHeight}`, opacity: 0, height: lineH }}>
              {"\u200b"}
            </div>
          );
        }

        const revealProgress = isNewlyRevealed
          ? spring({ frame: localFrame, fps, delay: (i - (prevVisible ?? 0)) * 3, config: springPresets.enter })
          : spring({ frame, fps, delay: i * 2, config: springPresets.enter });
        const revealOpacity = interpolate(revealProgress, [0, 1], [0, 1]);
        const revealX = interpolate(revealProgress, [0, 1], [24, 0]);

        return (
          <div
            key={i}
            style={{
              whiteSpace: "pre",
              height: lineH,
              lineHeight: `${lineH}px`,
              opacity: revealOpacity,
              transform: `translateX(${revealX}px)`,
              display: "flex",
              alignItems: "center",
              position: "relative",
              zIndex: 1,
            }}
          >
            <span>
              {lineTokens.map((tok, j) => {
                const isHighlightedLine = i >= currStart && i <= currEnd;
                const tokenColor = isHighlightedLine ? "#0a0a18" : getTokenColor(tok.color ?? "");

                return (
                  <span key={j} style={{ color: tokenColor, fontWeight: bold ? 700 : 400 }}>
                    {tok.content}
                  </span>
                );
              })}
            </span>
          </div>
        );
      })}
    </div>
  );
};
