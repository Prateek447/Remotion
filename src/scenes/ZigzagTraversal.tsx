import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { ThemedToken } from "shiki";
import type { ArrowData, ListNodeData, SceneStep } from "../lib/types";
import { useStepTransition } from "../lib/useStepTransition";
import { colors, fonts, springPresets } from "../lib/theme";
import { AmbientLayer } from "../components/AmbientLayer";
import { compressStepsForAnim } from "../lib/animSteps";
import { AnimationOnlyLayout, ANIM_DIAGRAM_HEIGHT } from "../components/AnimationOnlyLayout";
import { CodeBlock } from "../components/CodeBlock";
import { CodeWindow } from "../components/CodeWindow";
import { NarrationLayer } from "../components/NarrationLayer";
import { SfxLayer } from "../components/SfxLayer";
import { SplitLayout } from "../components/SplitLayout";
import { StackedLayout, type SafeArea } from "../components/StackedLayout";
import { TreeDiagram } from "../components/TreeDiagram";
import { QueueVisualization } from "../components/QueueVisualization";

const REEL_SAFE: SafeArea = { top: 150, bottom: 380, left: 90, right: 130 };
const REEL_TOP_RATIO = 0.52;

export const ZIGZAG_SCENE_FRAMES = 4154;

const BASE_EDGES: ArrowData[] = [
  { from: "n1", to: "n2" },
  { from: "n1", to: "n3" },
  { from: "n2", to: "n4" },
  { from: "n2", to: "n5" },
  { from: "n3", to: "n6" },
  { from: "n3", to: "n7" },
];

function buildNodes(
  active: string[] = [],
  found: string[] = [],
  newIds: string[] = [],
): ListNodeData[] {
  return ["n1", "n2", "n3", "n4", "n5", "n6", "n7"].map((id, i) => ({
    id,
    value: i + 1,
    highlight: active.includes(id)
      ? "active"
      : found.includes(id)
      ? "found"
      : newIds.includes(id)
      ? "new"
      : "none",
  }));
}

function buildEdges(highlighted: string[] = []): ArrowData[] {
  return BASE_EDGES.map((e) => ({
    ...e,
    highlight: highlighted.includes(`${e.from}-${e.to}`),
  }));
}

function makeSteps(): SceneStep[] {
  const F1    = ["n1"];
  const F12   = ["n1", "n2"];
  const F123  = ["n1", "n2", "n3"];
  const FALL  = ["n1", "n2", "n3", "n4", "n5", "n6", "n7"];

  return [
    // Step 0 — Hook: preview zigzag output
    {
      excludeFromAnim: true,
      startFrame: 0,
      highlightLines: { startLine: 0, endLine: 0 },
      visibleLines: 1,
      snapshot: {
        nodes: buildNodes(),
        pointers: [],
        arrows: buildEdges(),
        caption: "Zigzag — level by level, flipping direction each time",
        queueItems: [],
        outputValues: [1, 3, 2, 4, 5, 6, 7],
        outputLabel: "Zigzag",
        showLevelBands: true,
      },
    },
    // Step 1 — Concept: one boolean flag
    {
      excludeFromAnim: true,
      startFrame: 576,
      highlightLines: { startLine: 0, endLine: 0 },
      visibleLines: 1,
      snapshot: {
        nodes: buildNodes(),
        pointers: [],
        arrows: buildEdges(),
        caption: "One boolean: leftToRight. Flip it after every level",
        queueItems: [],
        outputValues: [],
        outputLabel: "Zigzag",
        showLevelBands: true,
      },
    },
    // Step 2 — Null check
    {
      startFrame: 925,
      highlightLines: { startLine: 1, endLine: 1 },
      visibleLines: 2,
      snapshot: {
        nodes: buildNodes(),
        pointers: [],
        arrows: buildEdges(),
        caption: "Null root? Return empty list",
        queueItems: [],
        outputValues: [],
        outputLabel: "Zigzag",
      },
    },
    // Step 3 — Init result, queue, leftToRight=true
    {
      startFrame: 1034,
      highlightLines: { startLine: 2, endLine: 5 },
      visibleLines: 6,
      snapshot: {
        nodes: buildNodes([], [], ["n1"]),
        pointers: [],
        arrows: buildEdges(),
        caption: "Init queue with root. leftToRight = true (first level → L→R)",
        queueItems: [{ value: 1, highlight: "new" }],
        outputValues: [],
        outputLabel: "Zigzag",
      },
    },
    // Step 4 — While: size=1, init level LinkedList
    {
      startFrame: 1277,
      highlightLines: { startLine: 6, endLine: 8 },
      visibleLines: 9,
      snapshot: {
        nodes: buildNodes(["n1"]),
        pointers: [],
        arrows: buildEdges(),
        caption: "Level 0: size=1. New level list. leftToRight=true → addLast mode",
        queueItems: [{ value: 1, highlight: "active" }],
        outputValues: [],
        outputLabel: "Zigzag",
      },
    },
    // Step 5 — Poll n1, addLast(1)
    {
      startFrame: 1533,
      highlightLines: { startLine: 9, endLine: 12 },
      visibleLines: 13,
      snapshot: {
        nodes: buildNodes([], F1),
        pointers: [],
        arrows: buildEdges(),
        caption: "Poll 1. leftToRight=true → addLast(1). level = [1]",
        queueItems: [],
        outputValues: [],
        outputLabel: "Zigzag",
      },
    },
    // Step 6 — Offer n2, n3
    {
      startFrame: 1726,
      highlightLines: { startLine: 16, endLine: 17 },
      visibleLines: 18,
      snapshot: {
        nodes: buildNodes([], F1, ["n2", "n3"]),
        pointers: [],
        arrows: buildEdges(["n1-n2", "n1-n3"]),
        caption: "Offer left child 2 and right child 3",
        queueItems: [{ value: 2, highlight: "new" }, { value: 3, highlight: "new" }],
        outputValues: [],
        outputLabel: "Zigzag",
      },
    },
    // Step 7 — result.add([1]), flip to false
    {
      startFrame: 1837,
      highlightLines: { startLine: 19, endLine: 20 },
      visibleLines: 21,
      snapshot: {
        nodes: buildNodes([], F1),
        pointers: [],
        arrows: buildEdges(),
        caption: "Add [1] to result. Flip leftToRight → false (next level R→L)",
        queueItems: [{ value: 2, highlight: "none" }, { value: 3, highlight: "none" }],
        outputValues: [1],
        outputLabel: "Zigzag",
      },
    },
    // Step 8 — While: size=2, R→L mode
    {
      startFrame: 2000,
      highlightLines: { startLine: 6, endLine: 8 },
      visibleLines: 9,
      snapshot: {
        nodes: buildNodes(["n2", "n3"], F1),
        pointers: [],
        arrows: buildEdges(),
        caption: "Level 1: size=2. leftToRight=false → addFirst mode (R→L)",
        queueItems: [{ value: 2, highlight: "active" }, { value: 3, highlight: "active" }],
        outputValues: [1],
        outputLabel: "Zigzag",
      },
    },
    // Step 9 — Poll n2, addFirst(2)
    {
      startFrame: 2261,
      highlightLines: { startLine: 9, endLine: 14 },
      visibleLines: 15,
      snapshot: {
        nodes: buildNodes([], F12),
        pointers: [],
        arrows: buildEdges(),
        caption: "Poll 2. leftToRight=false → addFirst(2). level = [2]",
        queueItems: [{ value: 3, highlight: "active" }],
        outputValues: [1],
        outputLabel: "Zigzag",
      },
    },
    // Step 10 — Offer n4, n5
    {
      startFrame: 2432,
      highlightLines: { startLine: 16, endLine: 17 },
      visibleLines: 18,
      snapshot: {
        nodes: buildNodes([], F12, ["n4", "n5"]),
        pointers: [],
        arrows: buildEdges(["n2-n4", "n2-n5"]),
        caption: "Offer n4 and n5",
        queueItems: [
          { value: 3, highlight: "none" },
          { value: 4, highlight: "new" },
          { value: 5, highlight: "new" },
        ],
        outputValues: [1],
        outputLabel: "Zigzag",
      },
    },
    // Step 11 — Poll n3, addFirst(3) → level=[3,2]
    {
      startFrame: 2519,
      highlightLines: { startLine: 9, endLine: 14 },
      visibleLines: 15,
      snapshot: {
        nodes: buildNodes([], F123),
        pointers: [],
        arrows: buildEdges(),
        caption: "Poll 3. addFirst(3) → FRONT! level = [3, 2]. That's the zigzag!",
        queueItems: [
          { value: 4, highlight: "none" },
          { value: 5, highlight: "none" },
        ],
        outputValues: [1],
        outputLabel: "Zigzag",
      },
    },
    // Step 12 — Offer n6, n7
    {
      startFrame: 2863,
      highlightLines: { startLine: 16, endLine: 17 },
      visibleLines: 18,
      snapshot: {
        nodes: buildNodes([], F123, ["n6", "n7"]),
        pointers: [],
        arrows: buildEdges(["n3-n6", "n3-n7"]),
        caption: "Offer n6 and n7",
        queueItems: [
          { value: 4, highlight: "none" },
          { value: 5, highlight: "none" },
          { value: 6, highlight: "new" },
          { value: 7, highlight: "new" },
        ],
        outputValues: [1],
        outputLabel: "Zigzag",
      },
    },
    // Step 13 — result.add([3,2]), flip to true
    {
      startFrame: 2956,
      highlightLines: { startLine: 19, endLine: 20 },
      visibleLines: 21,
      snapshot: {
        nodes: buildNodes([], F123),
        pointers: [],
        arrows: buildEdges(),
        caption: "Add [3, 2] to result. Flip → true (next level L→R again)",
        queueItems: [
          { value: 4, highlight: "none" },
          { value: 5, highlight: "none" },
          { value: 6, highlight: "none" },
          { value: 7, highlight: "none" },
        ],
        outputValues: [1, 3, 2],
        outputLabel: "Zigzag",
      },
    },
    // Step 14 — Level 2: all 4 leaves, addLast, no children, add [4,5,6,7]
    {
      startFrame: 3187,
      highlightLines: { startLine: 6, endLine: 20 },
      visibleLines: 21,
      snapshot: {
        nodes: buildNodes([], FALL),
        pointers: [],
        arrows: buildEdges(),
        caption: "Level 2: size=4, addLast each. Leaves — no children. Add [4,5,6,7]. Queue empty.",
        queueItems: [],
        outputValues: [1, 3, 2, 4, 5, 6, 7],
        outputLabel: "Zigzag",
      },
    },
    // Step 15 — Return result
    {
      startFrame: 3521,
      highlightLines: { startLine: 22, endLine: 22 },
      visibleLines: 23,
      snapshot: {
        nodes: buildNodes([], FALL),
        pointers: [],
        arrows: buildEdges(),
        caption: "Return — [[1], [3,2], [4,5,6,7]]. One BFS pass, one boolean.",
        queueItems: [],
        outputValues: [1, 3, 2, 4, 5, 6, 7],
        outputLabel: "Zigzag",
      },
    },
    // Step 16 — Complexity
    {
      excludeFromAnim: true,
      startFrame: 3773,
      highlightLines: { startLine: 0, endLine: 23 },
      visibleLines: 24,
      snapshot: {
        nodes: buildNodes([], FALL),
        pointers: [],
        arrows: buildEdges(),
        caption: "Zigzag complete",
        queueItems: [],
        outputValues: [1, 3, 2, 4, 5, 6, 7],
        outputLabel: "Zigzag",
        complexityInfo: { time: "O(n)", space: "O(n)" },
      },
    },
  ];
}

function makePositionMap(format: "youtube" | "reel" | "reel-anim"): Record<string, { x: number; y: number }> {
  if (format === "youtube") {
    return {
      n1: { x: 0.50, y: 0.22 },
      n2: { x: 0.30, y: 0.42 },
      n3: { x: 0.70, y: 0.42 },
      n4: { x: 0.18, y: 0.62 },
      n5: { x: 0.38, y: 0.62 },
      n6: { x: 0.62, y: 0.62 },
      n7: { x: 0.82, y: 0.62 },
    };
  }
  if (format === "reel") {
    return {
      n1: { x: 0.50, y: 0.18 },
      n2: { x: 0.28, y: 0.42 },
      n3: { x: 0.72, y: 0.42 },
      n4: { x: 0.14, y: 0.68 },
      n5: { x: 0.38, y: 0.68 },
      n6: { x: 0.62, y: 0.68 },
      n7: { x: 0.86, y: 0.68 },
    };
  }
  return {
    n1: { x: 0.50, y: 0.16 },
    n2: { x: 0.28, y: 0.38 },
    n3: { x: 0.72, y: 0.38 },
    n4: { x: 0.14, y: 0.62 },
    n5: { x: 0.38, y: 0.62 },
    n6: { x: 0.62, y: 0.62 },
    n7: { x: 0.86, y: 0.62 },
  };
}

// ── ZigzagPathOverlay ─────────────────────────────────────────────────────────
// Single crawling-dotted snake path tracing zigzag order with an arrowhead.

const LEVEL_SIZES  = [1, 2, 4];
const LEVEL_COLORS = [colors.teal, colors.yellow, colors.green];

const LevelBandOverlay: React.FC<{
  positionMap: Record<string, { x: number; y: number }>;
  areaWidth: number;
  areaHeight: number;
  nodeRadius: number;
}> = ({ positionMap, areaWidth, areaHeight, nodeRadius }) => {
  const frame = useCurrentFrame();
  const pad = nodeRadius * 0.85;

  const px = (id: string) => positionMap[id].x * areaWidth;
  const py = (id: string) => positionMap[id].y * areaHeight;

  const y0 = py("n1");
  const y1 = py("n2"); // same as n3
  const y2 = py("n4"); // same as n5,n6,n7

  // Snake spans the widest level
  const farLeft  = px("n4") - nodeRadius - pad;
  const farRight = px("n7") + nodeRadius + pad;

  // Snake path: L0 left→right, connector right side, L1 right→left,
  //             connector left side, L2 left→right
  const cr = 18; // corner radius for smooth turns
  const d = [
    `M ${farLeft} ${y0}`,
    `L ${farRight - cr} ${y0}`,
    `Q ${farRight} ${y0} ${farRight} ${y0 + cr}`,
    `L ${farRight} ${y1 - cr}`,
    `Q ${farRight} ${y1} ${farRight - cr} ${y1}`,
    `L ${farLeft + cr} ${y1}`,
    `Q ${farLeft} ${y1} ${farLeft} ${y1 + cr}`,
    `L ${farLeft} ${y2 - cr}`,
    `Q ${farLeft} ${y2} ${farLeft + cr} ${y2}`,
    `L ${farRight} ${y2}`,
  ].join(" ");

  const dashLen    = 11;
  const gapLen     = 9;
  const period     = dashLen + gapLen;
  const dashOffset = -((frame * 0.75) % period);

  // Arrowhead at end: tip points right at (farRight, y2)
  const aw = 16;
  const ah = 10;

  return (
    <svg
      style={{
        position:      "absolute",
        top:           0,
        left:          0,
        width:         "100%",
        height:        "100%",
        pointerEvents: "none",
        overflow:      "visible",
      }}
    >
      <defs>
        <filter id="zpath-glow" x="-15%" y="-40%" width="130%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* glow layer */}
      <path
        d={d}
        fill="none"
        stroke={colors.blue}
        strokeWidth={7}
        strokeDasharray={`${dashLen} ${gapLen}`}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.22}
        filter="url(#zpath-glow)"
      />

      {/* main dashed line */}
      <path
        d={d}
        fill="none"
        stroke={colors.blue}
        strokeWidth={2.5}
        strokeDasharray={`${dashLen} ${gapLen}`}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.88}
      />

      {/* arrowhead at end — right-pointing triangle */}
      <polygon
        points={`${farRight + aw},${y2} ${farRight},${y2 - ah / 2} ${farRight},${y2 + ah / 2}`}
        fill={colors.blue}
        opacity={0.9}
      />
    </svg>
  );
};

// ── ZigzagOutputDisplay ───────────────────────────────────────────────────────
// Single-line list-of-lists: [ [1],  [3, 2],  [4, 5, 6, 7] ]

const ZigzagOutputDisplay: React.FC<{
  steps: SceneStep[];
  style: React.CSSProperties;
  circleSize?: number;
}> = ({ steps, style, circleSize = 34 }) => {
  const { fps } = useVideoConfig();
  const { current, previous, t, localFrame } = useStepTransition(steps);

  const currVals = current.snapshot.outputValues ?? [];
  const prevVals = previous.snapshot.outputValues ?? [];

  const isComplexity = !!current.snapshot.complexityInfo;
  const hideT = isComplexity
    ? interpolate(t, [0, 0.4], [1, 0], { extrapolateRight: "clamp" })
    : 1;

  if (currVals.length === 0) return null;

  // split flat outputValues into complete level groups
  const groups: { values: number[]; levelStart: number }[] = [];
  let idx = 0;
  for (let li = 0; li < LEVEL_SIZES.length; li++) {
    const sz = LEVEL_SIZES[li];
    if (idx >= currVals.length) break;
    const group = currVals.slice(idx, idx + sz);
    if (group.length === sz) groups.push({ values: group, levelStart: idx });
    idx += sz;
  }

  const fontSize = Math.max(13, Math.round(circleSize * 0.42));
  const bracketSize = Math.round(fontSize * 1.15);

  const bracketStyle: React.CSSProperties = {
    fontFamily: fonts.mono,
    fontSize:   bracketSize,
    fontWeight: 700,
    color:      colors.subtext0,
    lineHeight: 1,
    alignSelf:  "center",
  };

  return (
    <div
      style={{
        ...style,
        opacity:       hideT,
        pointerEvents: "none",
        display:       "flex",
        flexDirection: "column",
        alignItems:    "center",
        gap:           7,
      }}
    >
      {/* Label */}
      <span
        style={{
          fontFamily:    fonts.sans,
          fontSize:      fontSize,
          fontWeight:    700,
          letterSpacing: 1.4,
          textTransform: "uppercase" as const,
          color:         colors.teal,
          textShadow:    `0 0 12px ${colors.teal}88`,
          whiteSpace:    "nowrap" as const,
        }}
      >
        Result
      </span>

      {/* Single-line list-of-lists */}
      <div
        style={{
          display:        "flex",
          alignItems:     "center",
          gap:            4,
          background:     "rgba(255,255,255,0.04)",
          border:         "1px solid rgba(255,255,255,0.10)",
          borderRadius:   14,
          padding:        "7px 14px",
          flexWrap:       "nowrap" as const,
        }}
      >
        {/* outer opening [ */}
        <span style={bracketStyle}>[</span>

        {groups.map(({ values, levelStart }, gi) => {
          const color = LEVEL_COLORS[gi] ?? colors.teal;
          const isNewGroup = currVals.length > prevVals.length && levelStart >= prevVals.length;

          const popP = spring({
            frame: isNewGroup ? Math.max(0, localFrame) : 0,
            fps,
            config: springPresets.snappy,
          });
          const groupOpacity = isNewGroup
            ? interpolate(popP, [0, 0.3, 1], [0, 1, 1], { extrapolateRight: "clamp" })
            : 1;
          const groupScale = isNewGroup
            ? interpolate(popP, [0, 0.4, 1], [0.6, 1.08, 1])
            : 1;
          const glowStr = isNewGroup ? interpolate(popP, [0, 0.4, 1], [0, 1, 0]) : 0;

          return (
            <React.Fragment key={gi}>
              {gi > 0 && (
                <span style={{ ...bracketStyle, color: colors.subtext0, fontSize: fontSize - 1 }}>,</span>
              )}
              {/* inner group pill */}
              <div
                style={{
                  display:        "flex",
                  alignItems:     "center",
                  gap:            2,
                  background:     `${color}18`,
                  border:         `1.5px solid ${color}66`,
                  borderRadius:   9,
                  padding:        "3px 8px",
                  transform:      `scale(${groupScale})`,
                  opacity:        groupOpacity,
                  boxShadow:      glowStr > 0.05
                    ? `0 0 ${Math.round(14 * glowStr)}px ${color}88`
                    : "none",
                }}
              >
                {/* inner [ */}
                <span style={{ ...bracketStyle, fontSize, color }}>[</span>
                {values.map((val, vi) => (
                  <React.Fragment key={vi}>
                    {vi > 0 && (
                      <span style={{ fontFamily: fonts.mono, fontSize: fontSize - 1, color: `${color}99`, lineHeight: 1 }}>,</span>
                    )}
                    <span
                      style={{
                        fontFamily: fonts.mono,
                        fontSize,
                        fontWeight: 800,
                        color,
                        textShadow: glowStr > 0.1 ? `0 0 8px ${color}` : "none",
                        lineHeight: 1,
                      }}
                    >
                      {val}
                    </span>
                  </React.Fragment>
                ))}
                {/* inner ] */}
                <span style={{ ...bracketStyle, fontSize, color }}> ]</span>
              </div>
            </React.Fragment>
          );
        })}

        {/* outer closing ] */}
        <span style={bracketStyle}>]</span>
      </div>
    </div>
  );
};

// ── ComplexityCard ────────────────────────────────────────────────────────────

const ComplexityCard: React.FC<{
  time: string;
  space: string;
  localFrame: number;
  style: React.CSSProperties;
}> = ({ time, space, localFrame, style }) => {
  const { fps } = useVideoConfig();

  const slideP     = spring({ frame: localFrame, fps, config: springPresets.slide });
  const opacity    = interpolate(slideP, [0, 0.25], [0, 1], { extrapolateRight: "clamp" });
  const translateY = interpolate(slideP, [0, 1], [50, 0]);

  const pills: Array<{ label: string; value: string; color: string; glow: string }> = [
    { label: "Time",  value: time,  color: colors.yellow,   glow: "rgba(249,226,175,0.25)" },
    { label: "Space", value: space, color: colors.sapphire, glow: "rgba(116,199,236,0.25)" },
  ];

  return (
    <div
      style={{
        ...style,
        transform: `${style.transform ?? ""} translateY(${translateY}px)`.trim(),
        transformOrigin: "top center",
        opacity,
        display: "flex",
        gap: 16,
        pointerEvents: "none",
        zIndex: 20,
      }}
    >
      {pills.map(({ label, value, color, glow }) => (
        <div
          key={label}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(10,10,10,0.82)",
            border: `1px solid ${color}44`,
            borderRadius: 14,
            padding: "10px 20px",
            boxShadow: `0 0 18px ${glow}, inset 0 0 10px ${glow}`,
            backdropFilter: "blur(8px)",
          }}
        >
          <span
            style={{
              fontFamily: fonts.sans,
              fontSize: 15,
              fontWeight: 500,
              color: colors.subtext0,
              letterSpacing: 0.4,
              textTransform: "uppercase" as const,
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontFamily: fonts.mono,
              fontSize: 22,
              fontWeight: 800,
              color,
              textShadow: `0 0 10px ${color}88`,
              letterSpacing: 0.5,
            }}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Scene component ───────────────────────────────────────────────────────────

export interface ZigzagTraversalProps {
  tokens: ThemedToken[][];
  format?: "youtube" | "reel" | "reel-anim";
}

export const ZigzagTraversal: React.FC<ZigzagTraversalProps> = ({ tokens, format = "youtube" }) => {
  const { width, height } = useVideoConfig();
  const isReel     = format === "reel" || format === "reel-anim";
  const isAnim     = format === "reel-anim";
  const isReelOnly = format === "reel";

  const safeW = width - REEL_SAFE.left - REEL_SAFE.right;
  const safeH = height - REEL_SAFE.top - REEL_SAFE.bottom;
  const diagramAreaW = isAnim ? width : isReel ? safeW : width * 0.54;
  const diagramAreaH = isAnim ? ANIM_DIAGRAM_HEIGHT : isReel ? Math.round(safeH * REEL_TOP_RATIO) : height;
  const nodeScale    = isAnim ? 1.4 : isReel ? 1.1 : 1;

  const steps = isAnim ? compressStepsForAnim(makeSteps()) : makeSteps();
  const { current, localFrame } = useStepTransition(steps);
  const complexityInfo = current.snapshot.complexityInfo;

  const reelDividerTop = REEL_SAFE.top + safeH * REEL_TOP_RATIO;
  const reelCenterLeft = REEL_SAFE.left + safeW / 2;

  const diagram = (
    <div
      style={{
        width:    diagramAreaW,
        height:   isReel ? diagramAreaH : height,
        position: "relative",
        overflow: "hidden",
        margin:   isReel ? "0 auto" : undefined,
      }}
    >
      {current.snapshot.showLevelBands && (
        <LevelBandOverlay
          positionMap={makePositionMap(format)}
          areaWidth={diagramAreaW}
          areaHeight={diagramAreaH}
          nodeRadius={30 * nodeScale}
        />
      )}
      <TreeDiagram
        steps={steps}
        positionMap={makePositionMap(format)}
        areaWidth={diagramAreaW}
        areaHeight={diagramAreaH}
        nodeScale={nodeScale}
      />
      {isAnim && (
        <>
          <div
            style={{
              position:       "absolute",
              top:            -50,
              left:           0,
              right:          0,
              display:        "flex",
              justifyContent: "center",
              zIndex:         5,
            }}
          >
            <ZigzagOutputDisplay
              steps={steps}
              circleSize={62}
              style={{ position: "relative" }}
            />
          </div>
          <div
            style={{
              position:       "absolute",
              bottom:         28,
              left:           0,
              right:          0,
              display:        "flex",
              justifyContent: "center",
              zIndex:         5,
            }}
          >
            <QueueVisualization steps={steps} itemSize={66} />
          </div>
        </>
      )}
      {isReelOnly && (
        <div
          style={{
            position:       "absolute",
            bottom:         12,
            left:           0,
            right:          0,
            display:        "flex",
            flexDirection:  "row",
            justifyContent: "center",
            alignItems:     "center",
            gap:            28,
            zIndex:         5,
          }}
        >
          <QueueVisualization steps={steps} itemSize={56} />
          <ZigzagOutputDisplay
            steps={steps}
            circleSize={46}
            style={{ position: "relative" }}
          />
        </div>
      )}
      {!isReel && (
        <div
          style={{
            position:      "absolute",
            bottom:        50,
            left:          0,
            right:         0,
            display:       "flex",
            flexDirection: "column",
            alignItems:    "center",
            gap:           16,
            zIndex:        5,
          }}
        >
          <QueueVisualization steps={steps} itemSize={52} />
          <ZigzagOutputDisplay
            steps={steps}
            circleSize={48}
            style={{ position: "relative" }}
          />
        </div>
      )}
    </div>
  );

  const code = (
    <CodeWindow title="BinaryTree.java" hideTitle={isReel}>
      <CodeBlock
        tokens={tokens}
        steps={steps}
        fontSize={isReel ? 17 : 19}
        lineHeight={isReel ? 1.65 : 2.1}
        padding={isReel ? 14 : 20}
        centered={isReel}
        centerWidth={isReel ? safeW : undefined}
        bold={false}
        autoScroll={isReel}
        containerHeight={isReel ? Math.round(safeH * (1 - REEL_TOP_RATIO) - 56) : height - 58}
      />
    </CodeWindow>
  );

  const reelBottom = code;

  return (
    <>
      {isAnim ? (
        <AnimationOnlyLayout>{diagram}</AnimationOnlyLayout>
      ) : isReelOnly ? (
        <StackedLayout top={diagram} bottom={reelBottom} safeArea={REEL_SAFE} topRatio={REEL_TOP_RATIO} contentPaddingTop={16} />
      ) : (
        <SplitLayout left={diagram} right={code} leftWidth="54%" />
      )}
      <AmbientLayer />
      {!isAnim && <SfxLayer steps={steps} duckVolume={0.45} />}
      {!isAnim && <NarrationLayer sceneId="zigzag" steps={steps} />}
      {complexityInfo && (
        <ComplexityCard
          time={complexityInfo.time}
          space={complexityInfo.space}
          localFrame={Math.max(0, localFrame - 20)}
          style={
            isAnim
              ? { position: "absolute", top: 1460, left: "50%", transform: "translateX(-50%)" }
              : isReelOnly
              ? { position: "absolute", top: reelDividerTop + 420, left: reelCenterLeft, transform: "translateX(-50%)" }
              : { position: "absolute", top: 28, left: 28 }
          }
        />
      )}
    </>
  );
};
