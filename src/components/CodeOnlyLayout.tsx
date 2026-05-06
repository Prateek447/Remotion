import React from "react";
import { AbsoluteFill, useVideoConfig, spring, interpolate } from "remotion";
import type { ThemedToken } from "shiki";
import type { SceneStep } from "../lib/types";
import { useStepTransition } from "../lib/useStepTransition";
import { CodeBlock } from "./CodeBlock";
import { CodeWindow } from "./CodeWindow";
import { colors, fonts, springPresets } from "../lib/theme";

const RESULT_COLORS: Record<string, string> = {
  "O(1)":       "#94e2d5",
  "O(n)":       "#f9e2af",
  "O(n²)":      "#fab387",
  "O(log n)":   "#a6e3a1",
  "O(n log n)": "#cba6f7",
};

// Character width ratio for JetBrains Mono (matches CodeBlock.tsx constant)
const CHAR_W_RATIO = 0.601;
const CODE_PAD = 40;       // CodeBlock default padding
const TITLE_BAR_H = 0;     // title bar hidden (hideTitle=true)
const PILL_PAD = 10;       // pill breathing room (matches CodeBlock)

function maxCharsInRange(tokens: ThemedToken[][], start: number, end: number): number {
  let max = 0;
  for (let i = start; i <= end && i < tokens.length; i++) {
    const chars = tokens[i]?.reduce((acc, tok) => acc + tok.content.length, 0) ?? 0;
    if (chars > max) max = chars;
  }
  return max;
}

// ─── Animated arrow + sliding label ─────────────────────────────────────────
interface ArrowAnnotationProps {
  label: string;
  lineStart: number;
  lineEnd: number;
  arrowY: number;      // precomputed Y (with collision resolution)
  localFrame: number;
  tokens: ThemedToken[][];
  hPad: number;
  fontSize: number;
  lineHeightRatio: number;
  endX?: number;       // override right boundary (for reel safe area)
  labelFontSize?: number;
}

const ArrowAnnotation: React.FC<ArrowAnnotationProps> = ({
  label, lineStart, lineEnd,
  arrowY,
  localFrame, tokens,
  hPad, fontSize, lineHeightRatio,
  endX,
  labelFontSize = 30,
}) => {
  const { width } = useVideoConfig();
  const charW = fontSize * CHAR_W_RATIO;

  // X: start just after the widest highlighted line's text
  const arrowStartX  = hPad + CODE_PAD + maxCharsInRange(tokens, lineStart, lineEnd) * charW + PILL_PAD + 28;
  const arrowEndX    = endX ?? (width - hPad - 60);

  // localFrame=999 means "fully drawn" (used for past/static arrows)
  const GROW_START = 6;
  const GROW_END   = 30;
  const growProgress = interpolate(localFrame, [GROW_START, GROW_END], [0, 1], { extrapolateRight: "clamp" });

  const arrowColor  = "#ffffff";
  const shaftW      = growProgress * (arrowEndX - arrowStartX);
  const tipX        = arrowStartX + shaftW;
  const labelOpacity = interpolate(growProgress, [0, 0.15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div style={{ position: "absolute", pointerEvents: "none" }}>
      {/* shaft */}
      <div style={{
        position: "absolute",
        left: arrowStartX,
        top: arrowY - 1.5,
        width: shaftW,
        height: 3,
        background: arrowColor,
        boxShadow: `0 0 8px rgba(255,255,255,0.5)`,
        borderRadius: 2,
      }} />
      {/* arrowhead — rides the tip */}
      {growProgress > 0 && (
        <div style={{
          position: "absolute",
          left: tipX,
          top: arrowY - 6,
          width: 0,
          height: 0,
          borderTop: "7px solid transparent",
          borderBottom: "7px solid transparent",
          borderLeft: `12px solid ${arrowColor}`,
        }} />
      )}
      {/* label — slides with arrowhead, blue accent */}
      {growProgress > 0 && (
        <div style={{
          position: "absolute",
          left: tipX + 18,
          top: arrowY - labelFontSize * 0.65,
          fontFamily: fonts.mono,
          fontSize: labelFontSize,
          fontWeight: 800,
          color: "#4f83f5",
          textShadow: `0 0 12px #4f83f588`,
          whiteSpace: "nowrap",
          opacity: labelOpacity,
        }}>
          {label}
        </div>
      )}
    </div>
  );
};

function extractFinalComplexity(formula: string): string | null {
  const matches = formula.match(/O\([^)]+\)/g);
  return matches ? matches[matches.length - 1] : null;
}

function parseDerivation(formula: string): Array<{ text: string; isComplexity: boolean; isDroppable: boolean }> {
  const parts: { text: string; isComplexity: boolean; isDroppable: boolean }[] = [];
  const regex = /O\([^)]+\)/g;
  let last = 0;
  let m;
  while ((m = regex.exec(formula)) !== null) {
    if (m.index > last) parts.push({ text: formula.slice(last, m.index), isComplexity: false, isDroppable: false });
    parts.push({ text: m[0], isComplexity: true, isDroppable: false });
    last = m.index + m[0].length;
  }
  if (last < formula.length) parts.push({ text: formula.slice(last), isComplexity: false, isDroppable: false });

  // Find "=" to isolate the left side (inputs) from the right side (result)
  const eqIdx = parts.findIndex(p => p.text.trim() === "=");

  // O(1) terms on the left side are droppable constants
  parts.forEach((p, i) => {
    if (p.isComplexity && p.text === "O(1)" && (eqIdx === -1 || i < eqIdx)) {
      p.isDroppable = true;
    }
  });

  // Operators (×, +, etc.) adjacent to a droppable term are also droppable
  for (let i = 0; i < parts.length; i++) {
    if (eqIdx >= 0 && i >= eqIdx) break;
    if (parts[i].isComplexity || parts[i].text.trim() === "=") continue;
    const prevComplex = [...parts.slice(0, i)].reverse().find(p => p.isComplexity);
    const nextComplex = parts.slice(i + 1).find(p => p.isComplexity);
    if (prevComplex?.isDroppable || nextComplex?.isDroppable) parts[i].isDroppable = true;
  }

  return parts;
}

// ─── Derivation display ───────────────────────────────────────────────────────
const TEAL = "#4f83f5";

const DerivationDisplay: React.FC<{
  formula: string;
  localFrame: number;
  bottom?: number;
  top?: number;          // when set, positions from top (overrides bottom)
  sourceYs?: number[];   // Y of each past arrow, one per O() term before "="
  simplifyAtFrame?: number; // localFrame when Phase 2 (strikethrough) fires
  fontSize?: number;
}> = ({ formula, localFrame, bottom = 90, top, sourceYs = [], simplifyAtFrame = 90, fontSize = 36 }) => {
  const SIMPLIFY_START = simplifyAtFrame;
  const SIMPLIFY_END   = simplifyAtFrame + 50;
  const { fps, height } = useVideoConfig();
  const parts = parseDerivation(formula);
  const eqIdx = parts.findIndex(p => p.text.trim() === "=");

  const formulaY = top !== undefined
    ? top + fontSize * 0.5
    : height - bottom - fontSize * 0.5;

  let cIdx = 0;
  const enriched = parts.map((part, i) => {
    const isResult = eqIdx >= 0 && i > eqIdx;
    let sourceY: number | undefined;
    if (part.isComplexity && !isResult) sourceY = sourceYs[cIdx++];
    return { ...part, isResult, sourceY };
  });

  // Phase 2 progress: 0 = full formula shown, 1 = simplification complete
  const simplifyFrac = interpolate(
    localFrame,
    [SIMPLIFY_START, SIMPLIFY_END],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const positionStyle: React.CSSProperties = top !== undefined
    ? { top }
    : { bottom };

  return (
    <div style={{
      position: "absolute",
      ...positionStyle,
      left: 0,
      right: 0,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 6,
      padding: "0 80px",
      pointerEvents: "none",
    }}>
      {enriched.map((part, i) => {
        // ── Phase 1: fly-in ──────────────────────────────────────────────────
        const hasSource = part.isComplexity && !part.isResult && part.sourceY !== undefined;
        const startYOffset = hasSource ? (part.sourceY! - formulaY) : (part.isResult ? 16 : 10);
        const p = spring({ frame: localFrame, fps, delay: hasSource ? 0 : i * 4, config: springPresets.gentle });
        const flyOpacity = interpolate(p, [0, 0.35], [0, 1], { extrapolateRight: "clamp" });
        const y = interpolate(p, [0, 1], [startYOffset, 0]);

        // ── Phase 2: simplification ──────────────────────────────────────────
        // Droppable tokens (O(1) and adjacent operators) fade out + get strikethrough
        const finalOpacity = part.isDroppable
          ? flyOpacity * interpolate(simplifyFrac, [0, 1], [1, 0.1])
          : flyOpacity;

        // Strikethrough line grows left→right on droppable tokens
        const strikeFrac = part.isDroppable
          ? interpolate(localFrame, [SIMPLIFY_START, SIMPLIFY_END - 15], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          : 0;

        // Dominant + result terms glow brighter after simplification
        const isDominant = part.isComplexity && !part.isDroppable;
        const glowScale = isDominant
          ? interpolate(simplifyFrac, [0, 1], [1, part.isResult ? 3 : 2])
          : 1;

        const color = part.isComplexity
          ? TEAL
          : part.text.trim() === "=" ? "#ffffff" : "rgba(255,255,255,0.7)";

        return (
          <span key={i} style={{
            position: "relative",
            display: "inline-block",
            fontFamily: fonts.mono,
            fontSize,
            fontWeight: part.isResult ? 900 : 600,
            color,
            textShadow: isDominant
              ? `0 0 ${18 * glowScale}px ${TEAL}88, 0 0 ${40 * glowScale}px ${TEAL}55`
              : undefined,
            opacity: finalOpacity,
            transform: `translateY(${y}px)`,
            whiteSpace: "pre",
          }}>
            {part.text}
            {/* Animated strikethrough for droppable tokens */}
            {part.isDroppable && (
              <span style={{
                position: "absolute",
                left: 0,
                top: "52%",
                height: 3,
                width: `${strikeFrac * 100}%`,
                background: "#ff6b6b",
                borderRadius: 2,
                boxShadow: "0 0 6px #ff6b6b88",
              }} />
            )}
          </span>
        );
      })}
    </div>
  );
};

// ─── Big-O result badge ───────────────────────────────────────────────────────
const BigOBadge: React.FC<{ formula: string; localFrame: number; bottom?: number }> = ({ formula, localFrame, bottom = 130 }) => {
  const { fps } = useVideoConfig();
  const label = extractFinalComplexity(formula);
  if (!label) return null;

  const accent = RESULT_COLORS[label] ?? colors.lavender;

  const p = spring({ frame: localFrame, fps, delay: 4, config: springPresets.bouncy });
  const scale   = interpolate(p, [0, 1], [0.5, 1]);
  const opacity = interpolate(p, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });
  const y       = interpolate(p, [0, 1], [20, 0]);

  return (
    <div
      style={{
        position: "absolute",
        bottom,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity,
        transform: `translateY(${y}px) scale(${scale})`,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          background: `${accent}14`,
          border: `2px solid ${accent}66`,
          borderRadius: 40,
          padding: "10px 28px",
          boxShadow: `0 0 28px ${accent}44, 0 0 60px ${accent}22`,
        }}
      >
        <span style={{
          fontFamily: fonts.sans,
          fontSize: 18,
          fontWeight: 500,
          color: colors.overlay0,
          letterSpacing: 0.5,
        }}>
          Time Complexity
        </span>
        <span style={{
          fontFamily: fonts.mono,
          fontSize: 28,
          fontWeight: 900,
          color: accent,
          textShadow: `0 0 12px ${accent}88`,
          letterSpacing: 1,
        }}>
          {label}
        </span>
      </div>
    </div>
  );
};

// ─── Caption text (crossfade, white, no pill) ─────────────────────────────────
const CaptionText: React.FC<{
  current?: string;
  previous?: string;
  localFrame: number;
  bottom?: number;
  hPad?: number;
}> = ({ current, previous, localFrame, bottom = 130, hPad = 140 }) => {
  const changed = previous !== current;
  const outOpacity = changed ? interpolate(localFrame, [0, 8],  [1, 0], { extrapolateRight: "clamp" }) : 0;
  const inOpacity  = changed ? interpolate(localFrame, [8, 22], [0, 1], { extrapolateRight: "clamp" }) : 1;
  const inY        = changed ? interpolate(localFrame, [8, 22], [10, 0], { extrapolateRight: "clamp" }) : 0;

  const textStyle: React.CSSProperties = {
    fontFamily: fonts.sans,
    fontSize: 22,
    fontWeight: 400,
    lineHeight: 1.65,
    color: "#ffffff",
    textAlign: "center",
    maxWidth: 1100,
  };
  const wrapStyle: React.CSSProperties = {
    position: "absolute",
    bottom,
    left: hPad,
    right: hPad,
    display: "flex",
    justifyContent: "center",
    pointerEvents: "none",
  };

  return (
    <>
      {changed && previous && (
        <div style={{ ...wrapStyle, opacity: outOpacity }}>
          <span style={textStyle}>{previous}</span>
        </div>
      )}
      {current && (
        <div style={{ ...wrapStyle, opacity: inOpacity, transform: `translateY(${inY}px)` }}>
          <span style={textStyle}>{current}</span>
        </div>
      )}
    </>
  );
};

// ─── CodeOnlyLayout ───────────────────────────────────────────────────────────
export interface CodeOnlyLayoutProps {
  steps: SceneStep[];
  tokens: ThemedToken[][];
  filename?: string;
  format?: "youtube" | "reel";
  reelSafeArea?: { top: number; bottom: number; left: number; right: number };
  arrowEndOffset?: number;   // px subtracted from right edge; smaller = longer arrow (default 280 yt / 220 reel)
}

export const CodeOnlyLayout: React.FC<CodeOnlyLayoutProps> = ({
  steps,
  tokens,
  filename = "Solution.java",
  format = "youtube",
  reelSafeArea = { top: 150, bottom: 380, left: 60, right: 160 },
  arrowEndOffset,
}) => {
  const { width, height } = useVideoConfig();
  const isReel = format === "reel";
  const { current, previous, localFrame, stepIndex } = useStepTransition(steps);

  const formula          = current.snapshot.complexityFormula;
  const derivation       = current.snapshot.complexityDerivation;
  const simplifyAtFrame  = current.snapshot.simplifyAtFrame;
  const caption          = current.snapshot.caption;
  const prevCap          = previous.snapshot.caption;
  const arrowLabel       = current.snapshot.arrowLabel;

  // All steps before the current one that have an arrowLabel — shown as static arrows
  const pastArrows = steps
    .slice(0, stepIndex)
    .filter(s => s.snapshot.arrowLabel);

  const gridBg = [
    "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)",
    "linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
    "#000",
  ].join(", ");

  const fontSize   = isReel ? 22 : 28;
  const lineHeight = 1.8;
  const bottomReserve = 200; // reserve space at bottom for captions

  if (isReel) {
    const fontSize_reel   = 22;
    const charW_reel      = fontSize_reel * CHAR_W_RATIO;
    const lineH_reel      = fontSize_reel * lineHeight;
    const totalCodeH_reel = CODE_PAD * 2 + tokens.length * lineH_reel;
    const safeH_reel      = height - reelSafeArea.top - reelSafeArea.bottom;
    const codeTop         = Math.round(reelSafeArea.top + (safeH_reel - totalCodeH_reel) / 2);
    const codeTop_reel    = codeTop + CODE_PAD;
    const MIN_GAP_reel    = lineH_reel * 0.85;

    // Code window width sized to content — leaves right side clear for arrow annotations
    const maxCodeChars_reel = Math.max(...tokens.map(line =>
      line.reduce((acc, tok) => acc + tok.content.length, 0)
    ));
    const codeWindowW_reel = CODE_PAD * 2 + Math.ceil(maxCodeChars_reel * charW_reel) + 20;

    // Reel arrows always reach near the right safe edge; arrowEndOffset is YouTube-sized so ignore it
    const reelArrowEndX = width - reelSafeArea.right - 80;

    const allArrowSteps_reel = steps.filter(s => s.snapshot.arrowLabel);
    const arrowYMap_reel = new Map<SceneStep, number>();
    allArrowSteps_reel.forEach(step => {
      const anchor = step.snapshot.arrowAnchorLine;
      const { startLine, endLine } = step.highlightLines;
      const line = anchor !== undefined ? anchor : (startLine + endLine) / 2;
      arrowYMap_reel.set(step, codeTop_reel + (line + 0.5) * lineH_reel);
    });
    for (let i = 1; i < allArrowSteps_reel.length; i++) {
      const prev = arrowYMap_reel.get(allArrowSteps_reel[i - 1])!;
      const curr = arrowYMap_reel.get(allArrowSteps_reel[i])!;
      if (curr - prev < MIN_GAP_reel) arrowYMap_reel.set(allArrowSteps_reel[i], prev + MIN_GAP_reel);
    }

    return (
      <AbsoluteFill style={{ background: "#000" }}>
        {/* Code window — width capped to content so arrow area stays clear */}
        <div style={{
          position: "absolute",
          top: codeTop,
          left: reelSafeArea.left,
          width: codeWindowW_reel,
          height: totalCodeH_reel,
        }}>
          <CodeWindow title={filename} hideTitle>
            <CodeBlock tokens={tokens} steps={steps} fontSize={fontSize} lineHeight={lineHeight} keepExplainedBright />
          </CodeWindow>
        </div>

        {/* Past arrows */}
        {pastArrows.map((step, i) => (
          <ArrowAnnotation
            key={i}
            label={step.snapshot.arrowLabel!}
            lineStart={step.highlightLines.startLine}
            lineEnd={step.highlightLines.endLine}
            arrowY={arrowYMap_reel.get(step)!}
            localFrame={999}
            tokens={tokens}
            hPad={reelSafeArea.left}
            fontSize={fontSize_reel}
            lineHeightRatio={lineHeight}
            endX={reelArrowEndX}
            labelFontSize={22}
          />
        ))}

        {/* Current arrow */}
        {arrowLabel && (
          <ArrowAnnotation
            label={arrowLabel}
            lineStart={current.highlightLines.startLine}
            lineEnd={current.highlightLines.endLine}
            arrowY={arrowYMap_reel.get(current)!}
            localFrame={localFrame}
            tokens={tokens}
            hPad={reelSafeArea.left}
            fontSize={fontSize_reel}
            lineHeightRatio={lineHeight}
            endX={reelArrowEndX}
            labelFontSize={22}
          />
        )}

        {/* Derivation — anchored just below the code block */}
        {derivation && (
          <DerivationDisplay
            formula={derivation}
            localFrame={localFrame}
            top={codeTop + totalCodeH_reel + 50}
            sourceYs={pastArrows.map(s => arrowYMap_reel.get(s)!)}
            simplifyAtFrame={simplifyAtFrame}
            fontSize={26}
          />
        )}

        {/* Caption text */}
        <CaptionText
          current={caption}
          previous={prevCap}
          localFrame={localFrame}
          bottom={reelSafeArea.bottom + 20}
          hPad={reelSafeArea.left}
        />

      </AbsoluteFill>
    );
  }

  // ── YouTube ──────────────────────────────────────────────────────────────────
  const hPad = 160;

  // Compute arrow Y positions aligned to highlighted lines, with collision resolution
  const fontSize_yt  = isReel ? 22 : 28;
  const lineH_yt     = fontSize_yt * 1.8;
  const totalCodeH_yt = CODE_PAD * 2 + tokens.length * lineH_yt; // TITLE_BAR_H = 0
  const codeTop_yt   = (height - bottomReserve - totalCodeH_yt) / 2 + CODE_PAD;
  const MIN_GAP      = lineH_yt * 0.85;

  const allArrowSteps = steps.filter(s => s.snapshot.arrowLabel);

  // Ideal Y = arrowAnchorLine if set, else center of highlighted range
  const arrowYMap = new Map<SceneStep, number>();
  allArrowSteps.forEach(step => {
    const anchor = step.snapshot.arrowAnchorLine;
    const { startLine, endLine } = step.highlightLines;
    const line = anchor !== undefined ? anchor : (startLine + endLine) / 2;
    arrowYMap.set(step, codeTop_yt + (line + 0.5) * lineH_yt);
  });

  // Push arrows down when they're too close to the previous one
  for (let i = 1; i < allArrowSteps.length; i++) {
    const prev = arrowYMap.get(allArrowSteps[i - 1])!;
    const curr = arrowYMap.get(allArrowSteps[i])!;
    if (curr - prev < MIN_GAP) arrowYMap.set(allArrowSteps[i], prev + MIN_GAP);
  }

  return (
    <AbsoluteFill
      style={{
        background: gridBg,
        backgroundSize: "60px 60px, 60px 60px, 100% 100%",
      }}
    >
      {/* Code centered vertically in the space above captions */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: hPad,
          right: hPad,
          bottom: bottomReserve,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ width: "100%" }}>
          <CodeWindow title={filename} hideTitle>
            <CodeBlock
              tokens={tokens}
              steps={steps}
              fontSize={fontSize}
              lineHeight={lineHeight}
              keepExplainedBright
            />
          </CodeWindow>
        </div>
      </div>

      {/* Past arrows — fully drawn and permanently visible */}
      {pastArrows.map((step, i) => (
        <ArrowAnnotation
          key={i}
          label={step.snapshot.arrowLabel!}
          lineStart={step.highlightLines.startLine}
          lineEnd={step.highlightLines.endLine}
          arrowY={arrowYMap.get(step)!}
          localFrame={999}
          tokens={tokens}
          hPad={hPad}
          fontSize={fontSize}
          lineHeightRatio={lineHeight}
          endX={width - hPad - (arrowEndOffset ?? 280)}
        />
      ))}

      {/* Current arrow — animates in */}
      {arrowLabel && (
        <ArrowAnnotation
          label={arrowLabel}
          lineStart={current.highlightLines.startLine}
          lineEnd={current.highlightLines.endLine}
          arrowY={arrowYMap.get(current)!}
          localFrame={localFrame}
          tokens={tokens}
          hPad={hPad}
          fontSize={fontSize}
          lineHeightRatio={lineHeight}
          endX={width - hPad - (arrowEndOffset ?? 280)}
        />
      )}

      {/* Caption text — shown on steps that have a caption */}
      <CaptionText
        current={caption}
        previous={prevCap}
        localFrame={localFrame}
        bottom={20}
        hPad={hPad}
      />

      {/* Derivation — shown on the conclusion step instead of a caption */}
      {derivation && (
        <DerivationDisplay
          formula={derivation}
          localFrame={localFrame}
          sourceYs={pastArrows.map(s => arrowYMap.get(s)!)}
          simplifyAtFrame={simplifyAtFrame}
          fontSize={34}
          bottom={110}
        />
      )}

    </AbsoluteFill>
  );
};
