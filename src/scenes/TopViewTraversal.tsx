import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { ThemedToken } from "shiki";
import type { ArrowData, ListNodeData, SceneStep } from "../lib/types";
import { useStepTransition } from "../lib/useStepTransition";
import { colors, fonts, springPresets } from "../lib/theme";
import { AmbientLayer } from "../components/AmbientLayer";
import { CodeBlock } from "../components/CodeBlock";
import { CodeWindow } from "../components/CodeWindow";
import { NarrationLayer } from "../components/NarrationLayer";
import { SfxLayer } from "../components/SfxLayer";
import { SplitLayout } from "../components/SplitLayout";
import { StackedLayout, type SafeArea } from "../components/StackedLayout";
import { TreeDiagram } from "../components/TreeDiagram";
import { QueueVisualization } from "../components/QueueVisualization";

const REEL_SAFE: SafeArea = { top: 150, bottom: 380, left: 90, right: 130 };
const REEL_TOP_RATIO = 0.50;

export const TOP_VIEW_SCENE_FRAMES = 4957;

const BASE_EDGES: ArrowData[] = [
  { from: "n1", to: "n2" },
  { from: "n1", to: "n3" },
  { from: "n2", to: "n4" },
  { from: "n2", to: "n5" },
  { from: "n3", to: "n6" },
  { from: "n3", to: "n7" },
  { from: "n4", to: "n8" },
];

// Column assigned to each node id
const NODE_COL: Record<string, number> = {
  n1:  0,
  n2: -1,
  n3:  1,
  n4: -2,
  n5:  0,
  n6:  0,
  n7:  2,
  n8: -3,
};

// Nodes that appear in the top view (one per unique column, topmost in BFS order)
const TOP_VIEW_NODE_IDS = ["n1", "n2", "n3", "n4", "n7", "n8"];

function buildNodes(
  activeId?: string,
  foundIds: string[] = [],
  visitedIds: string[] = [],
): ListNodeData[] {
  const values: Array<{ id: string; value: number }> = [
    { id: "n1", value: 1 },
    { id: "n2", value: 2 },
    { id: "n3", value: 3 },
    { id: "n4", value: 4 },
    { id: "n5", value: 5 },
    { id: "n6", value: 6 },
    { id: "n7", value: 7 },
    { id: "n8", value: 8 },
  ];

  return values.map((node) => ({
    ...node,
    highlight:
      node.id === activeId
        ? "active"
        : foundIds.includes(node.id)
          ? "found"
          : visitedIds.includes(node.id)
            ? "visited"
            : "none",
  }));
}

function buildEdges(highlighted: string[] = []): ArrowData[] {
  return BASE_EDGES.map((edge) => ({
    ...edge,
    highlight: highlighted.includes(`${edge.from}-${edge.to}`),
  }));
}

// Shorthand sets reused across steps
const F1      = ["n1"];
const F12     = ["n1", "n2"];
const F123    = ["n1", "n2", "n3"];
const F1234   = ["n1", "n2", "n3", "n4"];
const F12347  = ["n1", "n2", "n3", "n4", "n7"];
const F123478 = ["n1", "n2", "n3", "n4", "n7", "n8"];
const V56     = ["n5", "n6"];
const V5      = ["n5"];

function makeSteps(): SceneStep[] {
  return [
    // ── Step 0: Intro ─────────────────────────────────────────────────────────
    {
      startFrame: 0,
      highlightLines: { startLine: 0, endLine: 0 },
      snapshot: {
        nodes: buildNodes(),
        pointers: [],
        arrows: buildEdges(),
        caption: "Top view of a binary tree",
        secondaryCaption: "The nodes visible from directly above — one per column.",
        outputLabel: "Top View",
        outputValues: [],
        queueItems: [],
      },
    },
    // ── Step 1: Null check ─────────────────────────────────────────────────────
    {
      startFrame: 338,
      highlightLines: { startLine: 1, endLine: 1 },
      snapshot: {
        nodes: buildNodes(),
        pointers: [],
        arrows: buildEdges(),
        caption: "Guard: empty tree",
        outputLabel: "Top View",
        outputValues: [],
        queueItems: [],
      },
    },
    // ── Step 2: Create colMap + colOf + queue ─────────────────────────────────
    {
      startFrame: 467,
      highlightLines: { startLine: 2, endLine: 4 },
      snapshot: {
        nodes: buildNodes(),
        pointers: [],
        arrows: buildEdges(),
        caption: "Three data structures",
        secondaryCaption: "colMap (sorted), colOf (node→col), queue (BFS)",
        outputLabel: "Top View",
        outputValues: [],
        queueItems: [],
      },
    },
    // ── Step 3: Seed root at col 0 ─────────────────────────────────────────────
    {
      startFrame: 825,
      highlightLines: { startLine: 5, endLine: 6 },
      snapshot: {
        nodes: buildNodes("n1"),
        pointers: [],
        arrows: buildEdges(),
        caption: "Root → col 0",
        outputLabel: "Top View",
        outputValues: [],
        queueItems: [{ value: 1, highlight: "new" }],
      },
    },
    // ── Step 4: While loop ──────────────────────────────────────────────────────
    {
      startFrame: 1046,
      highlightLines: { startLine: 7, endLine: 7 },
      snapshot: {
        nodes: buildNodes("n1"),
        pointers: [],
        arrows: buildEdges(),
        caption: "Queue not empty",
        outputLabel: "Top View",
        outputValues: [],
        queueItems: [{ value: 1 }],
      },
    },
    // ── Step 5: Poll n1, col=0 ──────────────────────────────────────────────────
    {
      startFrame: 1138,
      highlightLines: { startLine: 8, endLine: 9 },
      snapshot: {
        nodes: buildNodes("n1"),
        pointers: [],
        arrows: buildEdges(),
        caption: "Poll node 1  —  col = 0",
        outputLabel: "Top View",
        outputValues: [],
        queueItems: [{ value: 1, highlight: "active" }],
      },
    },
    // ── Step 6: putIfAbsent col 0 → store n1 ───────────────────────────────────
    {
      startFrame: 1250,
      highlightLines: { startLine: 10, endLine: 10 },
      snapshot: {
        nodes: buildNodes("n1", F1),
        pointers: [],
        arrows: buildEdges(),
        caption: "Col 0 is free  →  store node 1",
        outputLabel: "Top View",
        outputValues: [1],
        queueItems: [],
      },
    },
    // ── Step 7: Push n2 (col -1) and n3 (col +1) ───────────────────────────────
    {
      startFrame: 1566,
      highlightLines: { startLine: 11, endLine: 18 },

      snapshot: {
        nodes: buildNodes("n2", F1),
        pointers: [],
        arrows: buildEdges(["n1-n2", "n1-n3"]),
        caption: "Push left(col -1) and right(col +1)",
        outputLabel: "Top View",
        outputValues: [1],
        queueItems: [
          { value: 2, highlight: "new" },
          { value: 3, highlight: "new" },
        ],
      },
    },
    // ── Step 8: Poll n2, col=-1 ─────────────────────────────────────────────────
    {
      startFrame: 1848,
      highlightLines: { startLine: 8, endLine: 9 },

      snapshot: {
        nodes: buildNodes("n2", F1),
        pointers: [],
        arrows: buildEdges(["n1-n2"]),
        caption: "Poll node 2  —  col = -1",
        outputLabel: "Top View",
        outputValues: [1],
        queueItems: [{ value: 2, highlight: "active" }, { value: 3 }],
      },
    },
    // ── Step 9: putIfAbsent col -1 → store n2 ──────────────────────────────────
    {
      startFrame: 1949,
      highlightLines: { startLine: 10, endLine: 10 },

      snapshot: {
        nodes: buildNodes("n2", F12),
        pointers: [],
        arrows: buildEdges(["n1-n2"]),
        caption: "Col -1 is free  →  store node 2",
        outputLabel: "Top View",
        outputValues: [2, 1],
        queueItems: [{ value: 3 }],
      },
    },
    // ── Step 10: Push n4 (col -2) and n5 (col 0) ───────────────────────────────
    {
      startFrame: 2061,
      highlightLines: { startLine: 11, endLine: 18 },

      snapshot: {
        nodes: buildNodes("n4", F12),
        pointers: [],
        arrows: buildEdges(["n2-n4", "n2-n5"]),
        caption: "Push n4(col -2) and n5(col 0)",
        outputLabel: "Top View",
        outputValues: [2, 1],
        queueItems: [
          { value: 3 },
          { value: 4, highlight: "new" },
          { value: 5, highlight: "new" },
        ],
      },
    },
    // ── Step 11: Poll n3, col=+1 ────────────────────────────────────────────────
    {
      startFrame: 2285,
      highlightLines: { startLine: 8, endLine: 9 },

      snapshot: {
        nodes: buildNodes("n3", F12),
        pointers: [],
        arrows: buildEdges(["n1-n3"]),
        caption: "Poll node 3  —  col = +1",
        outputLabel: "Top View",
        outputValues: [2, 1],
        queueItems: [{ value: 3, highlight: "active" }, { value: 4 }, { value: 5 }],
      },
    },
    // ── Step 12: putIfAbsent col +1 → store n3 ─────────────────────────────────
    {
      startFrame: 2385,
      highlightLines: { startLine: 10, endLine: 10 },

      snapshot: {
        nodes: buildNodes("n3", F123),
        pointers: [],
        arrows: buildEdges(["n1-n3"]),
        caption: "Col +1 is free  →  store node 3",
        outputLabel: "Top View",
        outputValues: [2, 1, 3],
        queueItems: [{ value: 4 }, { value: 5 }],
      },
    },
    // ── Step 13: Push n6 (col 0) and n7 (col +2) ───────────────────────────────
    {
      startFrame: 2499,
      highlightLines: { startLine: 11, endLine: 18 },

      snapshot: {
        nodes: buildNodes("n6", F123),
        pointers: [],
        arrows: buildEdges(["n3-n6", "n3-n7"]),
        caption: "Push n6(col 0) and n7(col +2)",
        outputLabel: "Top View",
        outputValues: [2, 1, 3],
        queueItems: [
          { value: 4 },
          { value: 5 },
          { value: 6, highlight: "new" },
          { value: 7, highlight: "new" },
        ],
      },
    },
    // ── Step 14: Poll n4, col=-2 ────────────────────────────────────────────────
    {
      startFrame: 2725,
      highlightLines: { startLine: 8, endLine: 9 },

      snapshot: {
        nodes: buildNodes("n4", F123),
        pointers: [],
        arrows: buildEdges(["n2-n4"]),
        caption: "Poll node 4  —  col = -2",
        outputLabel: "Top View",
        outputValues: [2, 1, 3],
        queueItems: [{ value: 4, highlight: "active" }, { value: 5 }, { value: 6 }, { value: 7 }],
      },
    },
    // ── Step 15: putIfAbsent col -2 → store n4 ─────────────────────────────────
    {
      startFrame: 2829,
      highlightLines: { startLine: 10, endLine: 10 },

      snapshot: {
        nodes: buildNodes("n4", F1234),
        pointers: [],
        arrows: buildEdges(["n2-n4"]),
        caption: "Col -2 is free  →  store node 4",
        outputLabel: "Top View",
        outputValues: [4, 2, 1, 3],
        queueItems: [{ value: 5 }, { value: 6 }, { value: 7 }],
      },
    },
    // ── Step 16: Push n8 (col -3) ───────────────────────────────────────────────
    {
      startFrame: 3042,
      highlightLines: { startLine: 11, endLine: 14 },

      snapshot: {
        nodes: buildNodes("n8", F1234),
        pointers: [],
        arrows: buildEdges(["n4-n8"]),
        caption: "Push n8  —  col = -3",
        outputLabel: "Top View",
        outputValues: [4, 2, 1, 3],
        queueItems: [
          { value: 5 },
          { value: 6 },
          { value: 7 },
          { value: 8, highlight: "new" },
        ],
      },
    },
    // ── Step 17: Poll n5, col=0 — SKIP ──────────────────────────────────────────
    {
      startFrame: 3209,
      highlightLines: { startLine: 10, endLine: 10 },

      snapshot: {
        nodes: buildNodes(undefined, F1234, V5),
        pointers: [],
        arrows: buildEdges(["n2-n5"]),
        caption: "Col 0 taken  →  skip node 5",
        outputLabel: "Top View",
        outputValues: [4, 2, 1, 3],
        queueItems: [{ value: 5, highlight: "visited" }, { value: 6 }, { value: 7 }, { value: 8 }],
      },
    },
    // ── Step 18: Poll n6, col=0 — SKIP ──────────────────────────────────────────
    {
      startFrame: 3441,
      highlightLines: { startLine: 10, endLine: 10 },

      snapshot: {
        nodes: buildNodes(undefined, F1234, V56),
        pointers: [],
        arrows: buildEdges(["n3-n6"]),
        caption: "Col 0 taken  →  skip node 6",
        outputLabel: "Top View",
        outputValues: [4, 2, 1, 3],
        queueItems: [{ value: 6, highlight: "visited" }, { value: 7 }, { value: 8 }],
      },
    },
    // ── Step 19: Poll n7, col=+2 → store ────────────────────────────────────────
    {
      startFrame: 3673,
      highlightLines: { startLine: 10, endLine: 10 },

      snapshot: {
        nodes: buildNodes("n7", F12347, V56),
        pointers: [],
        arrows: buildEdges(["n3-n7"]),
        caption: "Col +2 is free  →  store node 7",
        outputLabel: "Top View",
        outputValues: [4, 2, 1, 3, 7],
        queueItems: [{ value: 7, highlight: "active" }, { value: 8 }],
      },
    },
    // ── Step 20: Poll n8, col=-3 → store ────────────────────────────────────────
    {
      startFrame: 3829,
      highlightLines: { startLine: 10, endLine: 10 },

      snapshot: {
        nodes: buildNodes("n8", F123478, V56),
        pointers: [],
        arrows: buildEdges(["n4-n8"]),
        caption: "Col -3 is free  →  store node 8",
        outputLabel: "Top View",
        outputValues: [8, 4, 2, 1, 3, 7],
        queueItems: [{ value: 8, highlight: "active" }],
      },
    },
    // ── Step 21: Loop ends + complexity ─────────────────────────────────────────
    {
      startFrame: 3996,
      highlightLines: { startLine: 19, endLine: 20 },
      snapshot: {
        nodes: buildNodes(undefined, F123478, V56),
        pointers: [],
        arrows: buildEdges(),
        caption: "Output: 8  4  2  1  3  7",
        complexityInfo: { time: "O(n)", space: "O(n)" },
        outputLabel: "Top View",
        outputValues: [8, 4, 2, 1, 3, 7],
        queueItems: [],
      },
    },
  ];
}

function makePositionMap(isReel: boolean): Record<string, { x: number; y: number }> {
  return isReel
    ? {
        n1: { x: 0.50, y: 0.18 },
        n2: { x: 0.34, y: 0.36 },
        n3: { x: 0.66, y: 0.36 },
        n4: { x: 0.24, y: 0.54 },
        n5: { x: 0.43, y: 0.54 },
        n6: { x: 0.57, y: 0.54 },
        n7: { x: 0.74, y: 0.54 },
        n8: { x: 0.18, y: 0.72 },
      }
    : {
        n1: { x: 0.47, y: 0.22 },
        n2: { x: 0.33, y: 0.34 },
        n3: { x: 0.61, y: 0.34 },
        n4: { x: 0.24, y: 0.46 },
        n5: { x: 0.40, y: 0.46 },
        n6: { x: 0.54, y: 0.46 },
        n7: { x: 0.69, y: 0.46 },
        n8: { x: 0.19, y: 0.58 },
      };
}

// ─── ColumnLabels ─────────────────────────────────────────────────────────────
// Column index labels above each node with per-node animations:
//   • Staggered fade-in on scene start
//   • Claim pulse  — scale + teal glow when node transitions to "found"
//   • Taken shake  — horizontal shake + red flash when column already occupied
const ColumnLabels: React.FC<{
  steps: SceneStep[];
  positionMap: Record<string, { x: number; y: number }>;
  areaWidth: number;
  areaHeight: number;
  nodeScale: number;
}> = ({ steps, positionMap, areaWidth, areaHeight, nodeScale }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { current, previous, localFrame } = useStepTransition(steps);

  // Match TreeDiagram: nodeSize = spacing.nodeHeight * 1.18 * nodeScale
  const nodeSize        = 56 * 1.18 * nodeScale;
  const nodeRadius      = nodeSize / 2;
  const ringPad         = Math.round(nodeSize * 0.22);   // same as TreeNodeCircle
  const ringOuterRadius = nodeRadius + ringPad;           // label must clear this
  const fontSize        = Math.round(18 * nodeScale);

  return (
    <>
      {Object.entries(NODE_COL).map(([id, col], nodeIndex) => {
        const pos = positionMap[id];
        if (!pos) return null;

        const cx = pos.x * areaWidth;
        const cy = pos.y * areaHeight;
        const label = col === 0 ? "0" : col > 0 ? `+${col}` : `${col}`;
        const isTopViewNode = TOP_VIEW_NODE_IDS.includes(id);

        // Mirror the idle wiggle from TreeNodeCircle (delay = nodeIndex * 3, phase = delay * 0.9)
        const wigglePhase = nodeIndex * 3 * 0.9;
        const idleY = Math.sin(frame * 0.055 + wigglePhase) * 10;

        const currHL = current.snapshot.nodes.find(n => n.id === id)?.highlight ?? "none";
        const prevHL = previous.snapshot.nodes.find(n => n.id === id)?.highlight ?? "none";

        // Scene-level staggered fade-in (outer columns appear last)
        const enterP = spring({ frame, fps, delay: Math.abs(col) * 5, config: { damping: 22, stiffness: 70 } });

        // CLAIM PULSE — node just transitioned to "found"
        const wasJustClaimed = currHL === "found" && prevHL !== "found";
        const claimP = spring({
          frame: wasJustClaimed ? localFrame : 0,
          fps,
          config: springPresets.emphasis,
        });
        const claimScale = interpolate(claimP, [0, 0.3, 1], [1, 1.65, 1.05]);
        const claimGlow  = interpolate(claimP, [0, 0.2, 0.55, 1], [0, 1, 0.7, 0]);

        // TAKEN SHAKE — non-top-view node just became "visited" (col already claimed)
        const justBecameVisited = !isTopViewNode && currHL === "visited" && prevHL !== "visited";
        const takenP = spring({
          frame: justBecameVisited ? localFrame : 0,
          fps,
          config: { damping: 7, stiffness: 200 },
        });
        const takenShakeX = justBecameVisited
          ? interpolate(takenP, [0, 0.12, 0.28, 0.46, 0.64, 0.82, 1], [0, 8, -7, 5, -3, 1.5, 0])
          : 0;
        const takenGlow = justBecameVisited
          ? interpolate(takenP, [0, 0.22, 0.55, 1], [0, 1, 0.6, 0])
          : 0;

        // Color driven by highlight state
        const color =
          currHL === "found" && isTopViewNode  ? "#40c057"
          : currHL === "active"                ? colors.blue
          : currHL === "visited" && !isTopViewNode ? colors.red
          : colors.subtext0;

        const baseOpacity = currHL === "none" ? 0.70 : 1.0;

        const textShadow =
          claimGlow > 0.04
            ? `0 0 ${Math.round(14 * claimGlow)}px #40c057, 0 0 ${Math.round(30 * claimGlow)}px #40c05744`
            : takenGlow > 0.04
              ? `0 0 ${Math.round(14 * takenGlow)}px ${colors.red}, 0 0 ${Math.round(26 * takenGlow)}px ${colors.red}44`
              : "none";

        return (
          <div
            key={id}
            style={{
              position:        "absolute",
              left:            cx - 24 + takenShakeX,
              top:             cy + idleY - ringOuterRadius - fontSize - 6,
              width:           48,
              textAlign:       "center",
              fontFamily:      fonts.mono,
              fontSize,
              fontWeight:      700,
              color,
              opacity:         enterP * baseOpacity,
              transform:       `scale(${claimScale})`,
              transformOrigin: "bottom center",
              pointerEvents:   "none",
              letterSpacing:   0.5,
              textShadow,
              zIndex:          20,
            }}
          >
            {label}
          </div>
        );
      })}
    </>
  );
};

// ─── CaptionBadge ─────────────────────────────────────────────────────────────
// Shows the current step caption — slides up + fades in whenever it changes.
const CaptionBadge: React.FC<{
  steps: SceneStep[];
  style: React.CSSProperties;
  fontSize?: number;
}> = ({ steps, style, fontSize = 15 }) => {
  const { fps } = useVideoConfig();
  const { current, previous, t, localFrame } = useStepTransition(steps);

  const currCaption = current.snapshot.caption ?? "";
  const prevCaption = previous.snapshot.caption ?? "";
  const captionChanged = currCaption !== prevCaption;

  const isComplexity = !!current.snapshot.complexityInfo;
  const hideT = isComplexity
    ? interpolate(t, [0, 0.4], [1, 0], { extrapolateRight: "clamp" })
    : 1;

  const enterP      = spring({ frame: localFrame, fps, config: springPresets.slide });
  const enterOpacity = captionChanged
    ? interpolate(enterP, [0, 0.45, 1], [0, 1, 1], { extrapolateRight: "clamp" })
    : 1;
  const enterY = captionChanged ? interpolate(enterP, [0, 1], [14, 0]) : 0;

  if (!currCaption) return null;

  return (
    <div
      style={{
        ...style,
        opacity:       enterOpacity * hideT,
        transform:     `${(style.transform as string) ?? ""} translateY(${enterY}px)`.trim(),
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontFamily:     fonts.sans,
          fontSize,
          fontWeight:     600,
          color:          "rgba(255,255,255,0.82)",
          letterSpacing:  0.3,
          textAlign:      "center",
          background:     "rgba(8,8,8,0.65)",
          border:         "1px solid rgba(255,255,255,0.1)",
          borderRadius:   10,
          padding:        "6px 20px",
          backdropFilter: "blur(6px)",
          boxShadow:      "0 2px 14px rgba(0,0,0,0.4)",
          whiteSpace:     "nowrap" as const,
        }}
      >
        {currCaption}
      </div>
    </div>
  );
};

// ─── OutputDisplay ────────────────────────────────────────────────────────────
// Growing row of "Top View" output values — each new value pops in with a
// spring scale animation when it is added to the colMap.
const OutputDisplay: React.FC<{
  steps: SceneStep[];
  style: React.CSSProperties;
  circleSize?: number;
}> = ({ steps, style, circleSize = 34 }) => {
  const { fps } = useVideoConfig();
  const { current, previous, t, localFrame } = useStepTransition(steps);

  const currVals = current.snapshot.outputValues ?? [];
  const prevVals = previous.snapshot.outputValues ?? [];
  const prevValSet = new Set(prevVals.map(String));

  const isComplexity = !!current.snapshot.complexityInfo;
  const hideT = isComplexity
    ? interpolate(t, [0, 0.4], [1, 0], { extrapolateRight: "clamp" })
    : 1;

  if (currVals.length === 0) return null;

  return (
    <div
      style={{
        ...style,
        opacity:       hideT,
        pointerEvents: "none",
        display:       "flex",
        alignItems:    "center",
        gap:           8,
      }}
    >
      <span
        style={{
          fontFamily:    fonts.sans,
          fontSize:      11,
          fontWeight:    700,
          letterSpacing: 1.1,
          textTransform: "uppercase" as const,
          color:         "rgba(255,255,255,0.35)",
          whiteSpace:    "nowrap" as const,
        }}
      >
        Top View
      </span>

      <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" as const }}>
        {currVals.map((val, i) => {
          const isNew = !prevValSet.has(String(val));
          const popP = spring({
            frame: isNew ? Math.max(0, localFrame - i * 2) : 0,
            fps,
            config: springPresets.snappy,
          });
          const popScale   = isNew ? interpolate(popP, [0, 0.4, 1], [0.2, 1.22, 1])   : 1;
          const popOpacity = isNew ? interpolate(popP, [0, 0.2, 1], [0, 1, 1], { extrapolateRight: "clamp" }) : 1;
          const glowStr    = isNew ? interpolate(popP, [0, 0.35, 1], [0, 1, 0])        : 0;

          return (
            <div
              key={`${val}-${i}`}
              style={{
                width:          circleSize,
                height:         circleSize,
                borderRadius:   "50%",
                background:     `${colors.teal}1a`,
                border:         `1.5px solid ${colors.teal}77`,
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                transform:      `scale(${popScale})`,
                opacity:        popOpacity,
                boxShadow:      glowStr > 0.05
                  ? `0 0 ${Math.round(10 * glowStr)}px ${colors.teal}99`
                  : "none",
              }}
            >
              <span
                style={{
                  fontFamily: fonts.mono,
                  fontSize:   Math.round(circleSize * 0.38),
                  fontWeight: 800,
                  color:      colors.teal,
                  lineHeight: 1,
                }}
              >
                {val}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── TopViewResultPanel ───────────────────────────────────────────────────────
// Replaces the tree at step 21: six teal circles pop in with column labels.
const TopViewResultPanel: React.FC<{
  panelFrame: number;
  isReel: boolean;
}> = ({ panelFrame, isReel }) => {
  const { fps } = useVideoConfig();

  const result = [
    { val: 8, col: -3 },
    { val: 4, col: -2 },
    { val: 2, col: -1 },
    { val: 1, col:  0 },
    { val: 3, col: +1 },
    { val: 7, col: +2 },
  ];

  const circleSize    = isReel ? 60  : 78;
  const gap           = isReel ? 12  : 20;
  const valFontSize   = isReel ? 28  : 36;
  const colFontSize   = isReel ? 11  : 13;
  const headFontSize  = isReel ? 13  : 16;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: isReel ? 22 : 32,
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          fontFamily:    fonts.sans,
          fontSize:      headFontSize,
          fontWeight:    700,
          letterSpacing: 2.5,
          textTransform: "uppercase" as const,
          color:         "rgba(255,255,255,0.38)",
        }}
      >
        Top View
      </span>

      <div style={{ display: "flex", gap, alignItems: "flex-start" }}>
        {result.map(({ val, col }, i) => {
          const popP = spring({
            frame: Math.max(0, panelFrame - i * 5),
            fps,
            config: springPresets.snappy,
          });
          const scale    = interpolate(popP, [0, 0.38, 1], [0, 1.28, 1]);
          const opacity  = interpolate(popP, [0, 0.18], [0, 1], { extrapolateRight: "clamp" });
          const glowStr  = interpolate(popP, [0, 0.28, 1], [0, 1, 0]);
          const colLabel = col === 0 ? "0" : col > 0 ? `+${col}` : `${col}`;

          return (
            <div
              key={val}
              style={{
                display:       "flex",
                flexDirection: "column",
                alignItems:    "center",
                gap:           8,
                transform:     `scale(${scale})`,
                opacity,
              }}
            >
              <div
                style={{
                  width:          circleSize,
                  height:         circleSize,
                  borderRadius:   "50%",
                  background:     "#40c057",
                  border:         `3px solid #40c057`,
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  boxShadow:      `0 0 ${10 + Math.round(14 * glowStr)}px #40c05766, 0 0 ${22 + Math.round(20 * glowStr)}px #40c05722`,
                }}
              >
                <span
                  style={{
                    fontFamily: fonts.mono,
                    fontSize:   valFontSize,
                    fontWeight: 800,
                    color:      "#ffffff",
                    lineHeight: 1,
                    textShadow: "0 0 8px rgba(255,255,255,0.18)",
                  }}
                >
                  {val}
                </span>
              </div>

              <span
                style={{
                  fontFamily:  fonts.mono,
                  fontSize:    colFontSize,
                  fontWeight:  600,
                  color:       "rgba(255,255,255,0.28)",
                  letterSpacing: 0.5,
                }}
              >
                {colLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

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
          <span style={{ fontFamily: fonts.sans, fontSize: 15, fontWeight: 500, color: colors.subtext0, letterSpacing: 0.4, textTransform: "uppercase" as const }}>
            {label}
          </span>
          <span style={{ fontFamily: fonts.mono, fontSize: 22, fontWeight: 800, color, textShadow: `0 0 10px ${color}88`, letterSpacing: 0.5 }}>
            {value}
          </span>
        </div>
      ))}
    </div>
  );
};

export interface TopViewTraversalProps {
  tokens: ThemedToken[][];
  format?: "youtube" | "reel";
}

export const TopViewTraversal: React.FC<TopViewTraversalProps> = ({
  tokens,
  format = "youtube",
}) => {
  const { width, height, fps } = useVideoConfig();
  const isReel = format === "reel";

  const safeW = width - REEL_SAFE.left - REEL_SAFE.right;
  const safeH = height - REEL_SAFE.top - REEL_SAFE.bottom;
  const diagramAreaW = isReel ? safeW : width * 0.54;
  const diagramAreaH = isReel ? Math.round(safeH * REEL_TOP_RATIO) : height;
  // Actual pixel height available for code lines in the reel code panel
  // = safe area code portion minus 20px top/bottom padding from StackedLayout
  const codeViewH = Math.round(safeH * (1 - REEL_TOP_RATIO)) - 40;
  const nodeScale  = isReel ? 1.1 : 0.72;
  const treeScale  = 1;

  const steps = makeSteps();
  const { current, localFrame } = useStepTransition(steps);
  const complexityInfo = current.snapshot.complexityInfo;
  const posMap = makePositionMap(isReel);

  // Slide animation: when the complexity step hits, tree slides up and out,
  // result panel slides up from below into its place.
  const slideP = spring({
    frame: complexityInfo ? localFrame : 0,
    fps,
    config: { damping: 24, stiffness: 75 },
  });
  const slideH      = (isReel ? diagramAreaH : height) + 80;
  const treeExitY   = interpolate(slideP, [0, 1], [0, -slideH]);
  const resultEnterY = interpolate(slideP, [0, 1], [slideH, 0]);
  // Circles inside the result panel start popping after the slide settles (~12f)
  const panelFrame  = Math.max(0, localFrame - 12);

  const diagram = (
    <div
      style={{
        width: diagramAreaW,
        height: isReel ? diagramAreaH : height,
        position: "relative",
        overflow: "hidden",
        margin: isReel ? "0 auto" : undefined,
      }}
    >
      {/* ── Tree + all overlays — slides upward out on step 21 ── */}
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${treeExitY}px)` }}>
        <div
          style={{
            width: "100%",
            height: "100%",
            transform: `scale(${treeScale})`,
            transformOrigin: "50% 42%",
            marginTop: 0,
          }}
        >
          <TreeDiagram
            steps={steps}
            positionMap={posMap}
            areaWidth={diagramAreaW}
            areaHeight={diagramAreaH}
            nodeScale={nodeScale}
            ringNodeIds={isReel ? [] : TOP_VIEW_NODE_IDS}
          />
          <ColumnLabels
            steps={steps}
            positionMap={posMap}
            areaWidth={diagramAreaW}
            areaHeight={diagramAreaH}
            nodeScale={nodeScale}
          />
        </div>
        <QueueVisualization
          steps={steps}
          itemSize={isReel ? 44 : 52}
          style={{
            position: "absolute",
            bottom: isReel ? 20 : 200,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 5,
          }}
        />
      </div>

      {/* ── Result panel — slides up from below on step 21 ── */}
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${resultEnterY}px)` }}>
        <TopViewResultPanel
          panelFrame={panelFrame}
          isReel={isReel}
        />
      </div>
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
        viewHeight={isReel ? codeViewH : undefined}
        bold={false}
      />
    </CodeWindow>
  );

  const reelDividerTop = REEL_SAFE.top + safeH * REEL_TOP_RATIO;
  const reelCenterLeft = REEL_SAFE.left + safeW / 2;

  return (
    <>
      {isReel ? (
        <StackedLayout top={diagram} bottom={code} safeArea={REEL_SAFE} topRatio={REEL_TOP_RATIO} contentPaddingTop={16} />
      ) : (
        <SplitLayout left={diagram} right={code} leftWidth="54%" />
      )}
      <AmbientLayer />
      <SfxLayer steps={steps} duckVolume={0.45} />
      <NarrationLayer sceneId="top-view" steps={steps} />
      {complexityInfo && (
        <ComplexityCard
          time={complexityInfo.time}
          space={complexityInfo.space}
          localFrame={Math.max(0, localFrame - 20)}
          style={
            isReel
              ? { position: "absolute", top: reelDividerTop - 160, left: reelCenterLeft, transform: "translateX(-50%)" }
              : { position: "absolute", top: 28, left: 28 }
          }
        />
      )}
    </>
  );
};
