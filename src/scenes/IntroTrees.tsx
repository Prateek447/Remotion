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

const REEL_SAFE: SafeArea = { top: 150, bottom: 380, left: 90, right: 130 };
const REEL_TOP_RATIO = 0.52;
// Step index at which the code panel first appears
const CODE_START_STEP = 14;

export const INTRO_TREES_SCENE_FRAMES = 5451;

// ── Tree structure ─────────────────────────────────────────────────────────────
//         1 (n1)
//        / \
//       2   3
//      / \ / \
//     4  5 6  7

const BASE_EDGES: ArrowData[] = [
  { from: "n1", to: "n2" },
  { from: "n1", to: "n3" },
  { from: "n2", to: "n4" },
  { from: "n2", to: "n5" },
  { from: "n3", to: "n6" },
  { from: "n3", to: "n7" },
];

function makeHeightArrows(): ArrowData[] {
  const path = new Set(["n1-n2", "n2-n4"]);
  return BASE_EDGES.map(e => ({
    ...e,
    highlight: path.has(`${e.from}-${e.to}`),
    color: path.has(`${e.from}-${e.to}`) ? colors.mauve : undefined,
  }));
}

function makePathArrows(): ArrowData[] {
  const path = new Set(["n1-n3", "n3-n7"]);
  return BASE_EDGES.map(e => ({
    ...e,
    highlight: path.has(`${e.from}-${e.to}`),
    color: path.has(`${e.from}-${e.to}`) ? colors.mauve : undefined,
  }));
}

function buildNodes(
  active:  string[] = [],
  found:   string[] = [],
  visited: string[] = [],
): ListNodeData[] {
  return ["n1", "n2", "n3", "n4", "n5", "n6", "n7"].map((id, i) => ({
    id,
    value: i + 1,
    highlight: active.includes(id)
      ? "active"
      : found.includes(id)
      ? "found"
      : visited.includes(id)
      ? "visited"
      : "none",
  }));
}

const LEAVES   = ["n4", "n5", "n6", "n7"];
const INTERNAL = ["n2", "n3"];
const ALL      = ["n1", "n2", "n3", "n4", "n5", "n6", "n7"];

function makeSteps(): SceneStep[] {
  return [
    // Step 0 — Hook (excludeFromAnim)
    {
      excludeFromAnim: true,
      startFrame: 0,
      highlightLines: { startLine: 0, endLine: 10 },
      snapshot: {
        nodes:    buildNodes(),
        pointers: [],
        arrows:   BASE_EDGES,
        caption:  "Binary Trees — the foundation of every tree algorithm",
      },
    },
    // Step 1 — What is a binary tree?
    {
      startFrame: 346,
      highlightLines: { startLine: 0, endLine: 10 },
      snapshot: {
        nodes:    buildNodes(),
        pointers: [],
        arrows:   BASE_EDGES,
        caption:  "Each node connects to at most 2 children — left and right",
      },
    },
    // Step 2 — Root
    {
      startFrame: 667,
      highlightLines: { startLine: 0, endLine: 0 },
      snapshot: {
        nodes:    buildNodes(["n1"]),
        pointers: [],
        arrows:   BASE_EDGES,
        caption:  "The ROOT is the topmost node — every tree has exactly one",
      },
    },
    // Step 3 — Parent / Left child / Right child
    {
      startFrame: 872,
      highlightLines: { startLine: 0, endLine: 4 },
      snapshot: {
        nodes:    buildNodes(["n1"], ["n2", "n3"]),
        pointers: [],
        arrows:   BASE_EDGES,
        caption:  "Node 1 is the PARENT of its LEFT child 2 and RIGHT child 3",
      },
    },
    // Step 4 — Siblings (NEW)
    {
      startFrame: 1146,
      highlightLines: { startLine: 0, endLine: 4 },
      snapshot: {
        nodes:    buildNodes(["n1"], ["n2", "n3"], LEAVES),
        pointers: [],
        arrows:   BASE_EDGES,
        caption:  "SIBLINGS share the same parent — node 2 and node 3 are siblings",
      },
    },
    // Step 5 — Left / Right positioning
    {
      startFrame: 1422,
      highlightLines: { startLine: 0, endLine: 4 },
      snapshot: {
        nodes:    buildNodes(["n2", "n3"]),
        pointers: [],
        arrows:   BASE_EDGES,
        caption:  "Position matters — left vs right creates a different tree",
      },
    },
    // Step 6 — Subtree (NEW)
    {
      startFrame: 1677,
      highlightLines: { startLine: 0, endLine: 4 },
      snapshot: {
        nodes:    buildNodes(["n2", "n4", "n5"], [], ["n1", "n3", "n6", "n7"]),
        pointers: [],
        arrows:   BASE_EDGES,
        caption:  "A SUBTREE is a node plus all its descendants — node 2's subtree: {2, 4, 5}",
      },
    },
    // Step 7 — Leaf nodes
    {
      startFrame: 1991,
      highlightLines: { startLine: 0, endLine: 4 },
      snapshot: {
        nodes:    buildNodes([], LEAVES),
        pointers: [],
        arrows:   BASE_EDGES,
        caption:  "LEAF nodes have no children — they're the endpoints",
      },
    },
    // Step 8 — Internal nodes
    {
      startFrame: 2283,
      highlightLines: { startLine: 0, endLine: 4 },
      snapshot: {
        nodes:    buildNodes(INTERNAL, [], LEAVES),
        pointers: [],
        arrows:   BASE_EDGES,
        caption:  "INTERNAL nodes have at least one child",
      },
    },
    // Step 9 — Degree (NEW, CLEAR)
    {
      startFrame: 2502,
      highlightLines: { startLine: 0, endLine: 4 },
      snapshot: {
        nodes:    buildNodes(),
        pointers: [],
        arrows:   BASE_EDGES,
        caption:  "DEGREE = number of children. n1/n2/n3 have degree 2, leaves have degree 0",
      },
    },
    // Step 10 — Level (NEW, CLEAR)
    {
      startFrame: 2793,
      highlightLines: { startLine: 0, endLine: 4 },
      snapshot: {
        nodes:    buildNodes(),
        pointers: [],
        arrows:   BASE_EDGES,
        caption:  "LEVEL = distance from root. Root is level 0, and so on",
      },
    },
    // Step 11 — Height (CLEAR, path highlighted in mauve)
    {
      startFrame: 3087,
      highlightLines: { startLine: 0, endLine: 4 },
      snapshot: {
        nodes:    buildNodes(["n1", "n2", "n4"], [], ["n3", "n5", "n6", "n7"]),
        pointers: [],
        arrows:   makeHeightArrows(),
        caption:  "HEIGHT = longest root-to-leaf path in edges. Here: 2",
      },
    },
    // Step 12 — Depth (CLEAR)
    {
      startFrame: 3453,
      highlightLines: { startLine: 0, endLine: 4 },
      snapshot: {
        nodes:    buildNodes(),
        pointers: [],
        arrows:   BASE_EDGES,
        caption:  "DEPTH = edges from root to a node. Root=0, level 1=1, level 2=2",
      },
    },
    // Step 13 — Path (NEW, CLEAR)
    {
      startFrame: 3930,
      highlightLines: { startLine: 0, endLine: 4 },
      snapshot: {
        nodes:    buildNodes(["n1", "n3", "n7"], [], ["n2", "n4", "n5", "n6"]),
        pointers: [],
        arrows:   makePathArrows(),
        caption:  "A PATH is a sequence of nodes — 1→3→7 is a path of length 2",
      },
    },
    // Step 14 — Code intro (layout switches to split here, CLEAR)
    {
      startFrame: 4282,
      highlightLines: { startLine: 0, endLine: 10 },
      snapshot: {
        nodes:    buildNodes(),
        pointers: [],
        arrows:   BASE_EDGES,
        caption:  "In code: a node is just a class with three fields",
      },
    },
    // Step 15 — val field
    {
      startFrame: 4476,
      highlightLines: { startLine: 1, endLine: 1 },
      snapshot: {
        nodes:    buildNodes(),
        pointers: [],
        arrows:   BASE_EDGES,
        caption:  "val stores the node's data",
      },
    },
    // Step 16 — left / right fields
    {
      startFrame: 4612,
      highlightLines: { startLine: 2, endLine: 3 },
      snapshot: {
        nodes:    buildNodes(),
        pointers: [],
        arrows:   BASE_EDGES,
        caption:  "left and right point to children — null if no child exists",
      },
    },
    // Step 17 — Constructor
    {
      startFrame: 4853,
      highlightLines: { startLine: 5, endLine: 9 },
      snapshot: {
        nodes:    buildNodes(),
        pointers: [],
        arrows:   BASE_EDGES,
        caption:  "Constructor: set val, initialize left and right to null",
      },
    },
    // Step 18 — CTA (excludeFromAnim)
    {
      excludeFromAnim: true,
      startFrame: 5119,
      highlightLines: { startLine: 0, endLine: 10 },
      snapshot: {
        nodes:    buildNodes([], ALL),
        pointers: [],
        arrows:   BASE_EDGES,
        caption:  "One class. Three fields. Foundation for every tree algorithm.",
        complexityInfo: { time: "O(1)", space: "O(1)" },
      },
    },
  ];
}

// ── Position maps ─────────────────────────────────────────────────────────────

function makePositionMap(
  format: "youtube" | "reel" | "reel-anim",
  showCode: boolean,
): Record<string, { x: number; y: number }> {
  if (format === "reel-anim") {
    return {
      n1: { x: 0.50, y: 0.14 },
      n2: { x: 0.28, y: 0.36 },
      n3: { x: 0.72, y: 0.36 },
      n4: { x: 0.14, y: 0.60 },
      n5: { x: 0.38, y: 0.60 },
      n6: { x: 0.62, y: 0.60 },
      n7: { x: 0.86, y: 0.60 },
    };
  }
  if (format === "reel") {
    if (!showCode) {
      return {
        n1: { x: 0.50, y: 0.20 },
        n2: { x: 0.26, y: 0.44 },
        n3: { x: 0.74, y: 0.44 },
        n4: { x: 0.12, y: 0.68 },
        n5: { x: 0.36, y: 0.68 },
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
  // youtube
  if (!showCode) {
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
    n1: { x: 0.50, y: 0.20 },
    n2: { x: 0.30, y: 0.40 },
    n3: { x: 0.70, y: 0.40 },
    n4: { x: 0.18, y: 0.62 },
    n5: { x: 0.38, y: 0.62 },
    n6: { x: 0.62, y: 0.62 },
    n7: { x: 0.82, y: 0.62 },
  };
}

// ── TermLabelsOverlay ─────────────────────────────────────────────────────────
// Renders colored terminology pills next to nodes.
// Labels accumulate across steps (later entries override same nodeId+side).
// CLEAR_LABELS_AT_STEPS resets the map before applying new labels.
// Pills wiggle like nodes using a continuous idle-float sine.

interface TermLabel {
  nodeId: string;
  text:   string;
  color:  string;
  side:   "above" | "below" | "left" | "right";
}

const STEP_LABELS: Record<number, TermLabel[]> = {
  2: [
    { nodeId: "n1", text: "Root", color: colors.yellow, side: "above" },
  ],
  3: [
    { nodeId: "n1", text: "Parent",      color: colors.yellow, side: "above" },
    { nodeId: "n2", text: "Left child",  color: colors.blue,   side: "left"  },
    { nodeId: "n3", text: "Right child", color: colors.teal,   side: "right" },
  ],
  4: [
    { nodeId: "n2", text: "Sibling", color: colors.lavender, side: "above" },
    { nodeId: "n3", text: "Sibling", color: colors.lavender, side: "above" },
  ],
  5: [
    { nodeId: "n2", text: "Left",  color: colors.blue, side: "left"  },
    { nodeId: "n3", text: "Right", color: colors.teal, side: "right" },
  ],
  6: [
    { nodeId: "n2", text: "Subtree", color: colors.pink, side: "below" },
  ],
  7: [
    { nodeId: "n4", text: "Leaf", color: colors.green, side: "below" },
    { nodeId: "n5", text: "Leaf", color: colors.green, side: "below" },
    { nodeId: "n6", text: "Leaf", color: colors.green, side: "below" },
    { nodeId: "n7", text: "Leaf", color: colors.green, side: "below" },
  ],
  8: [
    // "above" so they coexist with "Sibling" labels (which also use "above") but override them
    { nodeId: "n2", text: "Internal", color: colors.peach, side: "above" },
    { nodeId: "n3", text: "Internal", color: colors.peach, side: "above" },
  ],
  9: [
    { nodeId: "n1", text: "Degree: 2", color: colors.yellow, side: "above" },
    { nodeId: "n2", text: "Degree: 2", color: colors.blue,   side: "left"  },
    { nodeId: "n3", text: "Degree: 2", color: colors.teal,   side: "right" },
    { nodeId: "n4", text: "Degree: 0", color: colors.green,  side: "below" },
    { nodeId: "n5", text: "Degree: 0", color: colors.green,  side: "below" },
    { nodeId: "n6", text: "Degree: 0", color: colors.green,  side: "below" },
    { nodeId: "n7", text: "Degree: 0", color: colors.green,  side: "below" },
  ],
  10: [
    { nodeId: "n1", text: "Level 0", color: colors.yellow, side: "above" },
    { nodeId: "n2", text: "Level 1", color: colors.blue,   side: "left"  },
    { nodeId: "n3", text: "Level 1", color: colors.teal,   side: "right" },
    { nodeId: "n4", text: "Level 2", color: colors.green,  side: "below" },
    { nodeId: "n5", text: "Level 2", color: colors.green,  side: "below" },
    { nodeId: "n6", text: "Level 2", color: colors.green,  side: "below" },
    { nodeId: "n7", text: "Level 2", color: colors.green,  side: "below" },
  ],
  11: [
    { nodeId: "n1", text: "Height = 2", color: colors.mauve, side: "right" },
  ],
  12: [
    { nodeId: "n1", text: "Depth = 0", color: colors.yellow, side: "above" },
    { nodeId: "n2", text: "Depth = 1", color: colors.blue,   side: "left"  },
    { nodeId: "n3", text: "Depth = 1", color: colors.teal,   side: "right" },
    { nodeId: "n4", text: "Depth = 2", color: colors.green,  side: "below" },
    { nodeId: "n5", text: "Depth = 2", color: colors.green,  side: "below" },
    { nodeId: "n6", text: "Depth = 2", color: colors.green,  side: "below" },
    { nodeId: "n7", text: "Depth = 2", color: colors.green,  side: "below" },
  ],
  // Step 13 (Path): no labels — highlighted arrows + caption convey the concept
};

// Steps that reset the accumulated label map before applying new labels
const CLEAR_LABELS_AT_STEPS = new Set([9, 10, 11, 12, 13, 14]);
// Labels at these steps are ephemeral — only visible exactly at that step, not accumulated
const EPHEMERAL_LABEL_STEPS = new Set([6]);

function buildLabelMap(upToStep: number): Map<string, TermLabel> {
  const map = new Map<string, TermLabel>();
  for (let i = 0; i <= upToStep; i++) {
    if (CLEAR_LABELS_AT_STEPS.has(i)) map.clear();
    if (EPHEMERAL_LABEL_STEPS.has(i) && i !== upToStep) continue;
    for (const label of STEP_LABELS[i] ?? []) {
      map.set(`${label.nodeId}-${label.side}`, label);
    }
  }
  return map;
}

const TermLabelsOverlay: React.FC<{
  steps:       SceneStep[];
  positionMap: Record<string, { x: number; y: number }>;
  areaWidth:   number;
  areaHeight:  number;
  nodeRadius:  number;
}> = ({ steps, positionMap, areaWidth, areaHeight, nodeRadius }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const { current, previous, localFrame } = useStepTransition(steps);

  const stepIdx     = steps.indexOf(current);
  const prevStepIdx = steps.indexOf(previous);

  const currMap = buildLabelMap(stepIdx);
  const prevMap = buildLabelMap(prevStepIdx);

  if (currMap.size === 0) return null;

  const GAP      = nodeRadius + 14;
  const fontSize = 15;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 5 }}>
      {Array.from(currMap.entries()).map(([key, label]) => {
        const pos = positionMap[label.nodeId];
        if (!pos) return null;

        const cx = pos.x * areaWidth;
        const cy = pos.y * areaHeight;

        const prevLabel = prevMap.get(key);
        const isNew = !prevLabel || prevLabel.text !== label.text || prevLabel.color !== label.color;
        const p       = isNew ? spring({ frame: localFrame, fps, config: springPresets.enter }) : 1;
        const scale   = isNew ? interpolate(p, [0, 1], [0.7, 1]) : 1;
        const opacity = isNew ? interpolate(p, [0, 0.25], [0, 1], { extrapolateRight: "clamp" }) : 1;

        // Deterministic idle phase per label — same frequency as nodes (0.055)
        const phase = key.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) * 0.7;
        const idleY = Math.sin(frame * 0.055 + phase) * 5;

        const pillW = label.text.length * 9 + 24;
        const pillH = fontSize + 16;

        const pillStyle: React.CSSProperties = {
          position:    "absolute",
          background:  "rgba(8, 10, 18, 0.88)",
          border:      `1.5px solid ${label.color}66`,
          borderRadius: 8,
          padding:     "4px 12px",
          fontFamily:  fonts.sans,
          fontWeight:  700,
          fontSize,
          color:       label.color,
          textShadow:  `0 0 10px ${label.color}88`,
          boxShadow:   `0 0 12px ${label.color}33`,
          whiteSpace:  "nowrap",
          opacity,
          transform:   `translateY(${idleY}px) scale(${scale})`,
        };

        if (label.side === "above") {
          return (
            <div key={key} style={{ ...pillStyle, left: cx - pillW / 2, top: cy - GAP - pillH, transformOrigin: "bottom center" }}>
              {label.text}
            </div>
          );
        }
        if (label.side === "below") {
          return (
            <div key={key} style={{ ...pillStyle, left: cx - pillW / 2, top: cy + GAP, transformOrigin: "top center" }}>
              {label.text}
            </div>
          );
        }
        if (label.side === "left") {
          return (
            <div key={key} style={{ ...pillStyle, right: areaWidth - (cx - GAP), top: cy - pillH / 2, transformOrigin: "right center" }}>
              {label.text}
            </div>
          );
        }
        return (
          <div key={key} style={{ ...pillStyle, left: cx + GAP, top: cy - pillH / 2, transformOrigin: "left center" }}>
            {label.text}
          </div>
        );
      })}
    </div>
  );
};

// ── SubtreeOverlay ─────────────────────────────────────────────────────────────

const SubtreeOverlay: React.FC<{
  steps:       SceneStep[];
  positionMap: Record<string, { x: number; y: number }>;
  areaWidth:   number;
  areaHeight:  number;
  nodeRadius:  number;
}> = ({ steps, positionMap, areaWidth, areaHeight, nodeRadius }) => {
  const { fps } = useVideoConfig();
  const { current, localFrame } = useStepTransition(steps);
  const stepIdx = steps.indexOf(current);

  if (stepIdx !== 6) return null;

  const opacity = spring({ frame: localFrame, fps, config: springPresets.enter });

  // Separate paddings so every node circle sits well inside — not touching the edges.
  // P_top must be large enough that the two sides clear n2's circle at n2's y-level.
  const P_top    = nodeRadius * 4.5;
  const P_side   = nodeRadius * 3;
  const P_bottom = nodeRadius * 2;

  const n2 = positionMap["n2"];
  const n4 = positionMap["n4"];
  const n5 = positionMap["n5"];
  if (!n2 || !n4 || !n5) return null;

  const apex = { x: n2.x * areaWidth,              y: n2.y * areaHeight - P_top    };
  const botL = { x: n4.x * areaWidth - P_side,     y: n4.y * areaHeight + P_bottom };
  const botR = { x: n5.x * areaWidth + P_side,     y: n5.y * areaHeight + P_bottom };
  const points = `${apex.x},${apex.y} ${botL.x},${botL.y} ${botR.x},${botR.y}`;

  return (
    <svg
      style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none", zIndex: 4 }}
      width={areaWidth}
      height={areaHeight}
    >
      <polygon
        points={points}
        fill={`${colors.blue}12`}
        stroke={colors.blue}
        strokeWidth={2.5}
        strokeDasharray="14 8"
        strokeLinejoin="round"
        opacity={opacity}
      />
    </svg>
  );
};

// ── LevelLinesOverlay ──────────────────────────────────────────────────────────

const LevelLinesOverlay: React.FC<{
  steps:       SceneStep[];
  positionMap: Record<string, { x: number; y: number }>;
  areaWidth:   number;
  areaHeight:  number;
  nodeRadius:  number;
}> = ({ steps, positionMap, areaWidth, areaHeight, nodeRadius }) => {
  const { fps } = useVideoConfig();
  const { current, localFrame } = useStepTransition(steps);
  const stepIdx = steps.indexOf(current);

  if (stepIdx !== 10) return null;

  const stagger = 6;
  const p0 = spring({ frame: localFrame,               fps, config: springPresets.gentle });
  const p1 = spring({ frame: localFrame - stagger,     fps, config: springPresets.gentle });
  const p2 = spring({ frame: localFrame - stagger * 2, fps, config: springPresets.gentle });
  const opacities = [p0, p1, p2];

  const n1 = positionMap["n1"];
  const n2 = positionMap["n2"];
  const n4 = positionMap["n4"];
  if (!n1 || !n2 || !n4) return null;

  // Offset lines below the node bottom edge so they don't cross the circles
  const lineOffset = nodeRadius + 10;
  const yLevels    = [
    n1.y * areaHeight + lineOffset,
    n2.y * areaHeight + lineOffset,
    n4.y * areaHeight + lineOffset,
  ];
  const lineColors = [colors.yellow, colors.blue, colors.green];
  const labelTexts = ["Level 0", "Level 1", "Level 2"];
  const lineX1     = nodeRadius * 2;
  const lineX2     = areaWidth - 220;
  const labelLeft  = areaWidth - 205;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 3 }}>
      <svg style={{ position: "absolute", inset: 0 }} width={areaWidth} height={areaHeight}>
        {yLevels.map((y, i) => (
          <line
            key={i}
            x1={lineX1} y1={y}
            x2={lineX2} y2={y}
            stroke={lineColors[i]}
            strokeWidth={2}
            strokeDasharray="14 8"
            opacity={opacities[i]}
          />
        ))}
      </svg>
      {yLevels.map((y, i) => (
        <div
          key={i}
          style={{
            position:     "absolute",
            left:         labelLeft,
            top:          y - 14,
            opacity:      opacities[i],
            color:        lineColors[i],
            fontFamily:   fonts.sans,
            fontWeight:   700,
            fontSize:     18,
            background:   "rgba(8,10,18,0.85)",
            border:       `1.5px solid ${lineColors[i]}66`,
            borderRadius: 6,
            padding:      "3px 12px",
            whiteSpace:   "nowrap",
          }}
        >
          {labelTexts[i]}
        </div>
      ))}
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
            display:        "flex",
            alignItems:     "center",
            gap:            10,
            background:     "rgba(10,10,10,0.82)",
            border:         `1px solid ${color}44`,
            borderRadius:   14,
            padding:        "10px 20px",
            boxShadow:      `0 0 18px ${glow}, inset 0 0 10px ${glow}`,
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

// ── Main component ────────────────────────────────────────────────────────────

export interface IntroTreesProps {
  tokens: ThemedToken[][];
  format?: "youtube" | "reel" | "reel-anim";
}

export const IntroTrees: React.FC<IntroTreesProps> = ({ tokens, format = "youtube" }) => {
  const { width, height, fps } = useVideoConfig();
  const isReel     = format === "reel" || format === "reel-anim";
  const isAnim     = format === "reel-anim";
  const isReelOnly = format === "reel";

  const safeW = width  - REEL_SAFE.left - REEL_SAFE.right;
  const safeH = height - REEL_SAFE.top  - REEL_SAFE.bottom;

  const steps   = isAnim ? compressStepsForAnim(makeSteps()) : makeSteps();
  const { current, localFrame } = useStepTransition(steps);
  const stepIdx    = steps.indexOf(current);
  const showCode   = !isAnim && stepIdx >= CODE_START_STEP;
  const isTransitionStep = !isAnim && stepIdx === CODE_START_STEP;
  const complexityInfo = current.snapshot.complexityInfo;

  const diagramAreaW = isAnim
    ? width
    : isReel
      ? safeW
      : showCode ? width * 0.60 : width;

  const diagramAreaH = isAnim
    ? ANIM_DIAGRAM_HEIGHT
    : isReel
      ? (showCode ? Math.round(safeH * REEL_TOP_RATIO) : safeH)
      : height;

  const nodeScale = isAnim ? 1.3 : isReel ? 0.82 : 1;
  const posMap    = makePositionMap(format, showCode);

  const diagram = (
    <div
      style={{
        width:    diagramAreaW,
        height:   isAnim ? diagramAreaH : isReelOnly ? diagramAreaH : height,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <TreeDiagram
        steps={steps}
        positionMap={posMap}
        areaWidth={diagramAreaW}
        areaHeight={diagramAreaH}
        nodeScale={nodeScale}
      />
      <TermLabelsOverlay
        steps={steps}
        positionMap={posMap}
        areaWidth={diagramAreaW}
        areaHeight={diagramAreaH}
        nodeRadius={30 * nodeScale}
      />
      <SubtreeOverlay
        steps={steps}
        positionMap={posMap}
        areaWidth={diagramAreaW}
        areaHeight={diagramAreaH}
        nodeRadius={30 * nodeScale}
      />
      <LevelLinesOverlay
        steps={steps}
        positionMap={posMap}
        areaWidth={diagramAreaW}
        areaHeight={diagramAreaH}
        nodeRadius={30 * nodeScale}
      />
    </div>
  );

  const codeAreaH = isReelOnly
    ? Math.round(safeH * (1 - REEL_TOP_RATIO)) - 30
    : height;

  const code = (
    <CodeWindow title="TreeNode.java" hideTitle={isReel}>
      <CodeBlock
        tokens={tokens}
        steps={steps}
        fontSize={isReel ? 22 : 26}
        padding={isReel ? 24 : 28}
        centered={isReel}
        centerWidth={isReel ? safeW : undefined}
        containerHeight={codeAreaH}
      />
    </CodeWindow>
  );

  // Code panel slide-in spring (used only at CODE_START_STEP)
  const codeSlideP     = spring({ frame: localFrame, fps, config: springPresets.slide });
  const codeOpacity    = interpolate(codeSlideP, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });
  const codeTranslateX = interpolate(codeSlideP, [0, 1], [width - diagramAreaW, 0]);
  const codeTranslateY = interpolate(codeSlideP, [0, 1], [safeH * (1 - REEL_TOP_RATIO) + 60, 0]);

  const reelDividerTop = REEL_SAFE.top + safeH * REEL_TOP_RATIO;
  const reelCenterLeft = REEL_SAFE.left + safeW / 2;

  let layout: React.ReactNode;

  if (isAnim) {
    layout = <AnimationOnlyLayout>{diagram}</AnimationOnlyLayout>;
  } else if (isReelOnly) {
    if (isTransitionStep) {
      // Code slides up from below
      layout = (
        <>
          <div style={{ position: "absolute", left: REEL_SAFE.left, top: REEL_SAFE.top, width: safeW, height: Math.round(safeH * REEL_TOP_RATIO) }}>
            {diagram}
          </div>
          <div style={{
            position: "absolute",
            left: REEL_SAFE.left,
            top: reelDividerTop,
            width: safeW,
            height: codeAreaH,
            transform: `translateY(${codeTranslateY}px)`,
            opacity: codeOpacity,
          }}>
            {code}
          </div>
        </>
      );
    } else if (showCode) {
      layout = <StackedLayout top={diagram} bottom={code} safeArea={REEL_SAFE} topRatio={REEL_TOP_RATIO} />;
    } else {
      layout = (
        <div style={{ position: "absolute", left: REEL_SAFE.left, top: REEL_SAFE.top, width: safeW, height: safeH }}>
          {diagram}
        </div>
      );
    }
  } else {
    // YouTube
    if (isTransitionStep) {
      // Code slides in from the right
      layout = (
        <div style={{ width, height, position: "relative" }}>
          <div style={{ position: "absolute", top: 0, left: 0, width: diagramAreaW, height }}>
            {diagram}
          </div>
          <div style={{
            position: "absolute",
            top: 0,
            left: diagramAreaW,
            width: width - diagramAreaW,
            height,
            transform: `translateX(${codeTranslateX}px)`,
            opacity: codeOpacity,
            overflow: "hidden",
          }}>
            {code}
          </div>
        </div>
      );
    } else if (showCode) {
      layout = <SplitLayout left={diagram} right={code} leftWidth="60%" />;
    } else {
      layout = (
        <div style={{ width, height, position: "relative" }}>
          {diagram}
        </div>
      );
    }
  }

  return (
    <>
      {layout}
      <AmbientLayer />
      {!isAnim && <SfxLayer steps={steps} duckVolume={0.45} />}
      {!isAnim && <NarrationLayer sceneId="intro-trees" steps={steps} />}
      {complexityInfo && (
        <ComplexityCard
          time={complexityInfo.time}
          space={complexityInfo.space}
          localFrame={Math.max(0, localFrame - 20)}
          style={
            isAnim
              ? { position: "absolute", top: 1460, left: "50%", transform: "translateX(-50%)" }
              : isReelOnly
              ? { position: "absolute", top: reelDividerTop - 160, left: reelCenterLeft, transform: "translateX(-50%)" }
              : { position: "absolute", top: 28, left: 28 }
          }
        />
      )}
    </>
  );
};
