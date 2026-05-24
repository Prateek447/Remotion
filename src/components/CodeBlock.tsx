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
  autoScroll?: boolean;
  containerHeight?: number;
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

// Keywords → blue, functions → purple, comments → gray (italic in One Dark Pro), else → white
function getTokenColor(shikiColor: string, fontStyle?: number): string {
  const normalized = shikiColor.toUpperCase();
  if (normalized === "#C678DD") return "#0096FF";
  if (normalized === "#61AFEF") return "#B07EFF";
  // Comments: italic flag (One Dark Pro) OR explicit gray color match
  if (((fontStyle ?? 0) & 1) !== 0 || normalized.startsWith("#5C6370")) return "#7C8396";
  return "#ffffff";
}


export const CodeBlock: React.FC<CodeBlockProps> = ({
  tokens,
  steps,
  fontSize = 24,
  lineHeight = 1.85,
  padding = 40,
  centered = false,
  centerWidth,
  bold = false,
  autoScroll = false,
  containerHeight,
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

  const { current, previous, t, localFrame, stepIndex } = useStepTransition(steps);

  const currStart = current.highlightLines.startLine;
  const currEnd = current.highlightLines.endLine;

  // Left-to-right wipe: resets every time a new step begins
  const wipeProgress = spring({
    frame: localFrame,
    fps,
    config: { damping: 22, stiffness: 250 },
  });
  // ── Auto-scroll: keep highlighted line(s) in the upper-center of visible area ──
  // Scrolling is active whenever containerHeight is provided (both reel and youtube).
  const totalH   = padding * 2 + tokens.length * lineH;
  const maxScroll = containerHeight != null ? Math.max(0, totalH - containerHeight) : 0;
  let scrollY = 0;
  if (containerHeight != null) {
    const scrollFor = (step: SceneStep) => {
      const midLine = (step.highlightLines.startLine + step.highlightLines.endLine) / 2;
      const target = padding + midLine * lineH - containerHeight * 0.38;
      return Math.max(0, Math.min(maxScroll, target));
    };
    scrollY = interpolate(t, [0, 1], [scrollFor(previous), scrollFor(current)]);
  }

  // ── Shared highlight border ───────────────────────────────────────────────────
  const prevStart = previous.highlightLines.startLine;
  const prevEnd   = previous.highlightLines.endLine;
  const hasPrev   = prevStart >= 0;

  const maxLineWidth = (start: number, end: number) => {
    let max = 0;
    for (let i = start; i <= end; i++) {
      const chars = tokens[i]?.reduce((acc, tok) => acc + tok.content.length, 0) ?? 0;
      max = Math.max(max, chars);
    }
    return max * charW + 16; // 8px breathing room on each side
  };

  const highlightStrips = currStart >= 0
    ? (() => {
        const currTop    = padding + currStart * lineH;
        const currHeight = (currEnd - currStart + 1) * lineH;
        const prevTop    = hasPrev ? padding + prevStart * lineH : currTop;
        const prevHeight = hasPrev ? (prevEnd - prevStart + 1) * lineH : currHeight;

        const currWidth  = maxLineWidth(currStart, currEnd);
        const prevWidth  = hasPrev ? maxLineWidth(prevStart, prevEnd) : currWidth;

        const animTop     = interpolate(t, [0, 1], [prevTop,    currTop]);
        const animHeight  = interpolate(t, [0, 1], [prevHeight, currHeight]);
        const animWidth   = interpolate(t, [0, 1], [prevWidth,  currWidth]);
        const animOpacity = hasPrev ? 1 : wipeProgress;

        return (
          <div
            style={{
              position:      "absolute",
              left:          pLeft - 8,
              width:         animWidth,
              top:           animTop,
              height:        animHeight,
              border:        `2px solid rgba(0, 150, 255, ${0.8 * animOpacity})`,
              borderRadius:  "6px",
              boxShadow:     `0 0 12px rgba(0, 150, 255, ${0.22 * animOpacity})`,
              pointerEvents: "none",
              opacity:       animOpacity,
              zIndex:        0,
            }}
          />
        );
      })()
    : null;

  // ── Lines ────────────────────────────────────────────────────────────────────
  const renderedLines = tokens.map((lineTokens, i) => {
    const isHighlightedLine = i >= currStart && i <= currEnd;

    if (autoScroll) {
      // All lines visible from frame 0 — no progressive reveal
      return (
        <div
          key={i}
          style={{
            whiteSpace:  "pre",
            height:      lineH,
            lineHeight:  `${lineH}px`,
            display:     "flex",
            alignItems:  "center",
            position:    "relative",
            zIndex:      1,
          }}
        >
          <span>
            {lineTokens.map((tok, j) => (
              <span
                key={j}
                style={{
                  color:      getTokenColor(tok.color ?? "", tok.fontStyle),
                  fontWeight: isHighlightedLine ? 800 : (bold ? 700 : 400),
                }}
              >
                {tok.content}
              </span>
            ))}
          </span>
        </div>
      );
    }

    // ── Original progressive-reveal mode ──
    const currVisible = current.visibleLines;
    const hasRevealControl = currVisible !== undefined;

    // High-water mark: max visibleLines across all steps seen so far.
    // Lines never disappear once shown — only the highlight box moves.
    const highWaterVisible = steps
      .slice(0, stepIndex + 1)
      .reduce((max, s) => Math.max(max, s.visibleLines ?? tokens.length), 0);
    const prevHighWaterVisible = stepIndex > 0
      ? steps.slice(0, stepIndex).reduce((max, s) => Math.max(max, s.visibleLines ?? tokens.length), 0)
      : 0;

    const isVisible = !hasRevealControl || i < highWaterVisible;
    // Only animate lines revealed for the first time in this step
    const isNewlyRevealed = hasRevealControl
      && isVisible
      && currVisible !== undefined
      && i >= prevHighWaterVisible
      && i < currVisible
      && currVisible > prevHighWaterVisible;

    if (!isVisible) {
      return (
        <div key={i} style={{ whiteSpace: "pre", lineHeight: `${lineHeight}`, opacity: 0, height: lineH }}>
          {"​"}
        </div>
      );
    }

    const revealProgress = isNewlyRevealed
      ? spring({ frame: localFrame, fps, delay: (i - prevHighWaterVisible) * 3, config: springPresets.enter })
      : spring({ frame, fps, delay: i * 2, config: springPresets.enter });
    const revealOpacity = interpolate(revealProgress, [0, 1], [0, 1]);
    const revealX       = interpolate(revealProgress, [0, 1], [24, 0]);

    return (
      <div
        key={i}
        style={{
          whiteSpace:  "pre",
          height:      lineH,
          lineHeight:  `${lineH}px`,
          opacity:     revealOpacity,
          transform:   `translateX(${revealX}px)`,
          display:     "flex",
          alignItems:  "center",
          position:    "relative",
          zIndex:      1,
        }}
      >
        <span>
          {lineTokens.map((tok, j) => (
            <span
              key={j}
              style={{
                color:      getTokenColor(tok.color ?? "", tok.fontStyle),
                fontWeight: isHighlightedLine ? 800 : (bold ? 700 : 400),
              }}
            >
              {tok.content}
            </span>
          ))}
        </span>
      </div>
    );
  });

  // ── Scrolling layout: clip outer, translate inner, fade top/bottom ──────────
  // Used for both reel (autoScroll) and youtube (containerHeight provided).
  if (containerHeight != null) {
    const FADE_H     = 64;
    const topOpacity = interpolate(scrollY, [0, 40], [0, 1], { extrapolateRight: "clamp" });
    const botOpacity = maxScroll > 0
      ? interpolate(scrollY, [maxScroll - 40, maxScroll], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      : 0;

    return (
      <div
        style={{
          fontFamily:  fonts.mono,
          fontSize,
          background:  "transparent",
          height:      "100%",
          position:    "relative",
          boxSizing:   "border-box",
          overflow:    "hidden",
        }}
      >
        <div
          style={{
            transform:   `translateY(${-scrollY}px)`,
            padding,
            paddingLeft: pLeft,
            position:    "relative",
          }}
        >
          {highlightStrips}
          {renderedLines}
        </div>
        {/* Top fade — visible only when content is scrolled */}
        <div
          style={{
            position:      "absolute",
            top:           0,
            left:          0,
            right:         0,
            height:        FADE_H,
            background:    `linear-gradient(to bottom, ${colors.base} 0%, transparent 100%)`,
            opacity:       topOpacity,
            pointerEvents: "none",
            zIndex:        5,
          }}
        />
        {/* Bottom fade — visible when more content remains below */}
        <div
          style={{
            position:      "absolute",
            bottom:        0,
            left:          0,
            right:         0,
            height:        FADE_H,
            background:    `linear-gradient(to top, ${colors.base} 0%, transparent 100%)`,
            opacity:       botOpacity,
            pointerEvents: "none",
            zIndex:        5,
          }}
        />
      </div>
    );
  }

  // ── Original layout ───────────────────────────────────────────────────────────
  return (
    <div
      style={{
        fontFamily:  fonts.mono,
        fontSize,
        background:  "transparent",
        padding,
        paddingLeft: pLeft,
        height:      "100%",
        position:    "relative",
        boxSizing:   "border-box",
        overflow:    "hidden",
      }}
    >
      {highlightStrips}
      {renderedLines}
    </div>
  );
};
