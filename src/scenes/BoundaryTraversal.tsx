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
const REEL_TOP_RATIO = 0.48;

export const BOUNDARY_SCENE_FRAMES = 3800;

// ── Tree structure ─────────────────────────────────────────────────────────────
//           1  (n1)
//         /   \
//        2     3
//       / \   / \
//      4   5 6   7
//     / \   \
//    8   9  10
// n5 is the only interior node (not a leaf, not on any boundary path)

const BASE_EDGES: ArrowData[] = [
  { from: "n1",  to: "n2"  },
  { from: "n1",  to: "n3"  },
  { from: "n2",  to: "n4"  },
  { from: "n2",  to: "n5"  },
  { from: "n3",  to: "n6"  },
  { from: "n3",  to: "n7"  },
  { from: "n4",  to: "n8"  },
  { from: "n4",  to: "n9"  },
  { from: "n5",  to: "n10" },
];

const NODE_VALUES: Array<{ id: string; value: number }> = [
  { id: "n1",  value: 1  },
  { id: "n2",  value: 2  },
  { id: "n3",  value: 3  },
  { id: "n4",  value: 4  },
  { id: "n5",  value: 5  },
  { id: "n6",  value: 6  },
  { id: "n7",  value: 7  },
  { id: "n8",  value: 8  },
  { id: "n9",  value: 9  },
  { id: "n10", value: 10 },
];

function buildNodes(
  foundIds: string[] = [],
  activeId?: string,
  visitedIds: string[] = [],
): ListNodeData[] {
  return NODE_VALUES.map((node) => ({
    ...node,
    highlight: node.id === activeId
      ? "active"
      : foundIds.includes(node.id)
        ? "found"
        : visitedIds.includes(node.id)
          ? "visited"
          : "none",
  }));
}

function buildEdges(highlighted: string[] = []): ArrowData[] {
  return BASE_EDGES.map((e) => ({
    ...e,
    highlight: highlighted.includes(`${e.from}-${e.to}`),
  }));
}

// Accumulated found-id sets matching each output step
const P1        = ["n1"];
const P12       = ["n1", "n2"];
const P124      = ["n1", "n2", "n4"];
const P1248     = ["n1", "n2", "n4", "n8"];
const P12489    = ["n1", "n2", "n4", "n8", "n9"];
const P124810   = ["n1", "n2", "n4", "n8", "n9", "n10"];
const P1248106  = ["n1", "n2", "n4", "n8", "n9", "n10", "n6"];
const P12481067 = ["n1", "n2", "n4", "n8", "n9", "n10", "n6", "n7"];
const PBND      = ["n1", "n2", "n3", "n4", "n6", "n7", "n8", "n9", "n10"];
const PALL      = ["n1", "n2", "n3", "n4", "n5", "n6", "n7", "n8", "n9", "n10"];

// Boundary traversal order: 1→2→4→8→9→10→6→7→3
// Each segment appears when its `triggerValue` enters outputValues.
// cpFrac: quadratic bezier control point (fractional) — pushed outward from tree center.
const BOUNDARY_SEGMENTS: Array<{
  fromId: string; toId: string; triggerValue: number;
  cpFrac: { x: number; y: number };
}> = [
  { fromId: "n1",  toId: "n2",  triggerValue: 2,  cpFrac: { x: 0.22, y: 0.23 } },
  { fromId: "n2",  toId: "n4",  triggerValue: 4,  cpFrac: { x: 0.09, y: 0.38 } },
  { fromId: "n4",  toId: "n8",  triggerValue: 8,  cpFrac: { x: 0.02, y: 0.55 } },
  { fromId: "n8",  toId: "n9",  triggerValue: 9,  cpFrac: { x: 0.155, y: 0.74 } },
  { fromId: "n9",  toId: "n10", triggerValue: 10, cpFrac: { x: 0.31,  y: 0.74 } },
  { fromId: "n10", toId: "n6",  triggerValue: 6,  cpFrac: { x: 0.50,  y: 0.78 } },
  { fromId: "n6",  toId: "n7",  triggerValue: 7,  cpFrac: { x: 0.70,  y: 0.60 } },
  { fromId: "n7",  toId: "n3",  triggerValue: 3,  cpFrac: { x: 0.90,  y: 0.37 } },
];

// boundaryCode line map (0-indexed, 36 lines):
//  0-9  : boundary() main   11-17: addLeft (11=comment)
//  19-27: addLeaves (19=comment)  29-35: addRight (29=comment)

function makeSteps(): SceneStep[] {
  return [
    // Step 0 — Intro: show tree, 9 rings, n5 has no ring
    {
      excludeFromAnim: true,
      startFrame: 0,
      highlightLines: { startLine: 0, endLine: 0 },
      snapshot: {
        nodes:        buildNodes(),
        pointers:     [],
        arrows:       buildEdges(),
        outputLabel:  "Boundary",
        outputValues: [],
      },
    },
    // Step 1 — null check
    {
      startFrame: 200,
      highlightLines: { startLine: 1, endLine: 1 },
      snapshot: {
        nodes:        buildNodes(),
        pointers:     [],
        arrows:       buildEdges(),
        outputLabel:  "Boundary",
        outputValues: [],
      },
    },
    // Step 2 — root has children → add root
    {
      startFrame: 400,
      highlightLines: { startLine: 2, endLine: 4 },
      snapshot: {
        nodes:        buildNodes(P1),
        pointers:     [],
        arrows:       buildEdges(),
        outputLabel:  "Boundary",
        outputValues: [1],
      },
    },
    // Step 3 — call addLeft(root.left = n2)
    {
      startFrame: 600,
      highlightLines: { startLine: 5, endLine: 5 },
      snapshot: {
        nodes:        buildNodes(P1, "n2"),
        pointers:     [],
        arrows:       buildEdges(["n1-n2"]),
        outputLabel:  "Boundary",
        outputValues: [1],
      },
    },
    // Step 4 — addLeft(n2): not leaf → add; recurse addLeft(n4)
    {
      startFrame: 800,
      highlightLines: { startLine: 13, endLine: 16 },
      snapshot: {
        nodes:        buildNodes(P12, "n4"),
        pointers:     [],
        arrows:       buildEdges(["n2-n4"]),
        outputLabel:  "Boundary",
        outputValues: [1, 2],
      },
    },
    // Step 5 — addLeft(n4): not leaf → add; recurse addLeft(n8)
    {
      startFrame: 1000,
      highlightLines: { startLine: 13, endLine: 16 },
      snapshot: {
        nodes:        buildNodes(P124, "n8"),
        pointers:     [],
        arrows:       buildEdges(["n4-n8"]),
        outputLabel:  "Boundary",
        outputValues: [1, 2, 4],
      },
    },
    // Step 6 — addLeft(n8): IS leaf → base case → return without adding
    {
      startFrame: 1200,
      highlightLines: { startLine: 13, endLine: 14 },
      snapshot: {
        nodes:        buildNodes(P124),
        pointers:     [],
        arrows:       buildEdges(["n4-n8"]),
        outputLabel:  "Boundary",
        outputValues: [1, 2, 4],
      },
    },
    // Step 7 — call addLeaves(root)
    {
      startFrame: 1400,
      highlightLines: { startLine: 6, endLine: 6 },
      snapshot: {
        nodes:        buildNodes(P124),
        pointers:     [],
        arrows:       buildEdges(),
        outputLabel:  "Boundary",
        outputValues: [1, 2, 4],
      },
    },
    // Step 8 — addLeaves: n8 is leaf → add
    {
      startFrame: 1600,
      highlightLines: { startLine: 22, endLine: 23 },
      snapshot: {
        nodes:        buildNodes(P1248),
        pointers:     [],
        arrows:       buildEdges(["n4-n8"]),
        outputLabel:  "Boundary",
        outputValues: [1, 2, 4, 8],
      },
    },
    // Step 9 — addLeaves: n9 is leaf → add
    {
      startFrame: 1800,
      highlightLines: { startLine: 22, endLine: 23 },
      snapshot: {
        nodes:        buildNodes(P12489),
        pointers:     [],
        arrows:       buildEdges(["n4-n9"]),
        outputLabel:  "Boundary",
        outputValues: [1, 2, 4, 8, 9],
      },
    },
    // Step 10 — addLeaves: n5 NOT leaf → recurse through n5; n5=active
    {
      startFrame: 2000,
      highlightLines: { startLine: 25, endLine: 26 },
      snapshot: {
        nodes:        buildNodes(P12489, "n5"),
        pointers:     [],
        arrows:       buildEdges(["n2-n5"]),
        outputLabel:  "Boundary",
        outputValues: [1, 2, 4, 8, 9],
      },
    },
    // Step 11 — addLeaves: n10 is leaf → add; n5 fades to visited
    {
      startFrame: 2200,
      highlightLines: { startLine: 22, endLine: 23 },
      snapshot: {
        nodes:        buildNodes(P124810, undefined, ["n5"]),
        pointers:     [],
        arrows:       buildEdges(["n5-n10"]),
        outputLabel:  "Boundary",
        outputValues: [1, 2, 4, 8, 9, 10],
      },
    },
    // Step 12 — addLeaves: n6 is leaf → add
    {
      startFrame: 2400,
      highlightLines: { startLine: 22, endLine: 23 },
      snapshot: {
        nodes:        buildNodes(P1248106, undefined, ["n5"]),
        pointers:     [],
        arrows:       buildEdges(["n1-n3", "n3-n6"]),
        outputLabel:  "Boundary",
        outputValues: [1, 2, 4, 8, 9, 10, 6],
      },
    },
    // Step 13 — addLeaves: n7 is leaf → add
    {
      startFrame: 2600,
      highlightLines: { startLine: 22, endLine: 23 },
      snapshot: {
        nodes:        buildNodes(P12481067, undefined, ["n5"]),
        pointers:     [],
        arrows:       buildEdges(["n1-n3", "n3-n7"]),
        outputLabel:  "Boundary",
        outputValues: [1, 2, 4, 8, 9, 10, 6, 7],
      },
    },
    // Step 14 — call addRight(n3); recurse first: addRight(n7) → leaf → return
    {
      startFrame: 2800,
      highlightLines: { startLine: 30, endLine: 33 },
      snapshot: {
        nodes:        buildNodes(P12481067, "n3", ["n5"]),
        pointers:     [],
        arrows:       buildEdges(["n1-n3", "n3-n7"]),
        outputLabel:  "Boundary",
        outputValues: [1, 2, 4, 8, 9, 10, 6, 7],
      },
    },
    // Step 15 — addRight(n3): AFTER recursion → add n3 (post-order = bottom-up)
    {
      startFrame: 3000,
      highlightLines: { startLine: 31, endLine: 34 },
      snapshot: {
        nodes:        buildNodes(PBND, undefined, ["n5"]),
        pointers:     [],
        arrows:       buildEdges(["n1-n3"]),
        outputLabel:  "Boundary",
        outputValues: [1, 2, 4, 8, 9, 10, 6, 7, 3],
      },
    },
    // Step 16 — return res; O(n) time and space
    {
      excludeFromAnim: true,
      startFrame: 3200,
      highlightLines: { startLine: 8, endLine: 9 },
      snapshot: {
        nodes:        buildNodes(PBND, undefined, ["n5"]),
        pointers:     [],
        arrows:       buildEdges(),
        outputLabel:  "Boundary",
        outputValues: [1, 2, 4, 8, 9, 10, 6, 7, 3],
        complexityInfo: { time: "O(n)", space: "O(n)" },
      },
    },
  ];
}

function makePositionMap(format: "youtube" | "reel" | "reel-anim"): Record<string, { x: number; y: number }> {
  if (format === "reel-anim") {
    return {
      n1:  { x: 0.50, y: 0.14 },
      n2:  { x: 0.30, y: 0.30 },
      n3:  { x: 0.70, y: 0.30 },
      n4:  { x: 0.17, y: 0.46 },
      n5:  { x: 0.40, y: 0.46 },
      n6:  { x: 0.60, y: 0.46 },
      n7:  { x: 0.80, y: 0.46 },
      n8:  { x: 0.09, y: 0.61 },
      n9:  { x: 0.22, y: 0.61 },
      n10: { x: 0.40, y: 0.61 },
    };
  }
  return format === "reel"
    ? {
        n1:  { x: 0.50, y: 0.18 },
        n2:  { x: 0.30, y: 0.32 },
        n3:  { x: 0.70, y: 0.32 },
        n4:  { x: 0.17, y: 0.47 },
        n5:  { x: 0.40, y: 0.47 },
        n6:  { x: 0.60, y: 0.47 },
        n7:  { x: 0.80, y: 0.47 },
        n8:  { x: 0.09, y: 0.62 },
        n9:  { x: 0.22, y: 0.62 },
        n10: { x: 0.40, y: 0.62 },
      }
    : {
        n1:  { x: 0.50, y: 0.18 },
        n2:  { x: 0.30, y: 0.32 },
        n3:  { x: 0.70, y: 0.32 },
        n4:  { x: 0.17, y: 0.48 },
        n5:  { x: 0.40, y: 0.48 },
        n6:  { x: 0.60, y: 0.48 },
        n7:  { x: 0.80, y: 0.48 },
        n8:  { x: 0.09, y: 0.63 },
        n9:  { x: 0.22, y: 0.63 },
        n10: { x: 0.40, y: 0.63 },
      };
}

export interface BoundaryTraversalProps {
  tokens: ThemedToken[][];
  format?: "youtube" | "reel" | "reel-anim";
}

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

// Keys are startLine values from highlightLines
const PHASE_MAP: Record<number, { label: string; color: string }> = {
  13: { label: "← addLeft",       color: "#0096FF" },
  22: { label: "addLeaves (DFS)", color: "#40c057" },
  25: { label: "addLeaves (DFS)", color: "#40c057" },
  30: { label: "→ addRight",      color: "#FF6B6B" },
  31: { label: "→ addRight",      color: "#FF6B6B" },
};

const PhaseLabel: React.FC<{ startLine: number; localFrame: number }> = ({ startLine, localFrame }) => {
  const { fps } = useVideoConfig();
  const phase = PHASE_MAP[startLine];
  if (!phase) return null;

  const p         = spring({ frame: localFrame, fps, config: { damping: 18, stiffness: 110, mass: 0.8 } });
  const opacity   = interpolate(p, [0, 0.35], [0, 1], { extrapolateRight: "clamp" });
  const ty        = interpolate(p, [0, 1], [-10, 0]);

  return (
    <div
      style={{
        position:      "absolute",
        top:           18,
        left:          "50%",
        transform:     `translateX(-50%) translateY(${ty}px)`,
        opacity,
        background:    `${phase.color}18`,
        border:        `1px solid ${phase.color}55`,
        borderRadius:  20,
        padding:       "6px 20px",
        fontFamily:    fonts.sans,
        fontSize:      15,
        fontWeight:    700,
        color:         phase.color,
        letterSpacing: 1,
        textShadow:    `0 0 12px ${phase.color}88`,
        pointerEvents: "none",
        zIndex:        10,
        whiteSpace:    "nowrap",
      }}
    >
      {phase.label}
    </div>
  );
};

const StackViz: React.FC<{
  steps: SceneStep[];
  style?: React.CSSProperties;
}> = ({ steps, style }) => {
  const { fps } = useVideoConfig();
  const { current, previous, t, localFrame } = useStepTransition(steps);

  const currDefined = current.snapshot.stackItems !== undefined;
  const prevDefined = previous.snapshot.stackItems !== undefined;
  if (!currDefined && !prevDefined) return null;

  const curr = current.snapshot.stackItems ?? [];
  const prev = previous.snapshot.stackItems ?? [];

  const isComplexityStep = !!current.snapshot.complexityInfo;
  const vizOpacity = isComplexityStep
    ? interpolate(t, [0, 0.65], [1, 0], { extrapolateRight: "clamp" })
    : !currDefined && prevDefined
    ? interpolate(t, [0, 0.65], [1, 0], { extrapolateRight: "clamp" })
    : currDefined && !prevDefined
    ? interpolate(t, [0, 0.35], [0, 1], { extrapolateRight: "clamp" })
    : 1;

  const entering = curr.filter(v => !prev.includes(v));
  const leaving  = prev.filter(v => !curr.includes(v));

  const IW = 88;
  const IH = 52;
  const GAP = 6;
  const BLUE  = "#0096FF";
  const GREEN = "#40c057";

  const itemBox = (extra: React.CSSProperties): React.CSSProperties => ({
    width:          IW,
    height:         IH,
    borderRadius:   12,
    background:     `linear-gradient(145deg, rgba(64,192,87,0.15), rgba(64,192,87,0.38))`,
    border:         `2.5px solid ${GREEN}`,
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    boxShadow:      `0 0 20px ${GREEN}55, 0 4px 12px rgba(0,0,0,0.35)`,
    ...extra,
  });

  return (
    <div
      style={{
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        pointerEvents:  "none",
        opacity:        vizOpacity,
        position:       "relative",
        overflow:       "visible",
        ...style,
      }}
    >
      {/* Title */}
      <span
        style={{
          fontFamily:    fonts.sans,
          fontSize:      13,
          fontWeight:    800,
          color:         BLUE,
          letterSpacing: 2.5,
          textTransform: "uppercase" as const,
          textShadow:    `0 0 14px ${BLUE}88`,
          marginBottom:  8,
        }}
      >
        Stack
      </span>

      {/* TOP indicator — horizontal rule with label */}
      <div style={{ display: "flex", alignItems: "center", width: IW + 32, marginBottom: 3, gap: 6 }}>
        <div style={{ flex: 1, height: 2, background: `${BLUE}66`, borderRadius: 1 }} />
        <span style={{ fontFamily: fonts.mono, fontSize: 11, fontWeight: 700, color: `${BLUE}dd`, letterSpacing: 1 }}>
          TOP ↓
        </span>
        <div style={{ flex: 1, height: 2, background: `${BLUE}66`, borderRadius: 1 }} />
      </div>

      {/* Stack container — open top, closed sides + bottom */}
      <div
        style={{
          position:     "relative",
          width:        IW + 32,
          minHeight:    IH + GAP * 2,
          borderLeft:   `2.5px solid ${BLUE}55`,
          borderRight:  `2.5px solid ${BLUE}55`,
          borderBottom: `2.5px solid ${BLUE}55`,
          borderTop:    "none",
          borderRadius: "0 0 16px 16px",
          background:   `rgba(0,150,255,0.05)`,
          display:      "flex",
          flexDirection: "column",
          alignItems:   "center",
          justifyContent: "center",
          padding:      `${GAP}px 16px`,
          gap:          GAP,
          overflow:     "visible",
        }}
      >
        {/* Leaving item — flies upward out of the container */}
        {leaving.map(v => {
          const exitY  = interpolate(t, [0, 0.75], [0, -(IH * 2.8 + 50)], { extrapolateRight: "clamp" });
          const exitOp = interpolate(t, [0, 0.55], [1, 0], { extrapolateRight: "clamp" });
          const exitSc = interpolate(t, [0, 0.75], [1, 0.55], { extrapolateRight: "clamp" });
          return (
            <div
              key={`leave-${v}`}
              style={{
                ...itemBox({ position: "absolute", top: GAP, left: 16 }),
                transform: `translateY(${exitY}px) scale(${exitSc})`,
                opacity:   exitOp,
              }}
            >
              <span style={{ fontFamily: fonts.mono, fontSize: 26, fontWeight: 800, color: "#fff" }}>{v}</span>
            </div>
          );
        })}

        {/* Current items (newest = first in array = visually at top) */}
        {curr.length > 0 ? (
          curr.map(v => {
            const isNew  = entering.includes(v);
            const p      = isNew ? spring({ frame: localFrame, fps, config: springPresets.bouncy }) : 1;
            const enterY = isNew ? interpolate(p as number, [0, 1], [-(IH + 50), 0]) : 0;
            const enterOp = isNew
              ? interpolate(p as number, [0, 0.3], [0, 1], { extrapolateRight: "clamp" })
              : 1;
            return (
              <div
                key={v}
                style={{
                  ...itemBox({ transform: `translateY(${enterY}px)`, opacity: enterOp }),
                }}
              >
                <span style={{ fontFamily: fonts.mono, fontSize: 26, fontWeight: 800, color: "#fff" }}>{v}</span>
              </div>
            );
          })
        ) : leaving.length === 0 && (
          <div
            style={{
              width:          IW,
              height:         IH,
              border:         "1.5px dashed rgba(255,255,255,0.22)",
              borderRadius:   10,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontFamily: fonts.sans, fontSize: 13, color: "rgba(255,255,255,0.42)", fontStyle: "italic" }}>
              empty
            </span>
          </div>
        )}
      </div>

      {/* BOTTOM label */}
      <div style={{ display: "flex", alignItems: "center", width: IW + 32, marginTop: 3, gap: 6 }}>
        <div style={{ flex: 1, height: 2, background: `${BLUE}44`, borderRadius: 1 }} />
        <span style={{ fontFamily: fonts.mono, fontSize: 10, fontWeight: 700, color: `${BLUE}88`, letterSpacing: 1 }}>
          BOTTOM
        </span>
        <div style={{ flex: 1, height: 2, background: `${BLUE}44`, borderRadius: 1 }} />
      </div>
    </div>
  );
};

// ── BoundaryPathOverlay ───────────────────────────────────────────────────────
// Progressive dashed green arrows tracing the boundary traversal order.

const BoundaryPathOverlay: React.FC<{
  steps: SceneStep[];
  positionMap: Record<string, { x: number; y: number }>;
  areaWidth: number;
  areaHeight: number;
  nodeRadius: number;
}> = ({ steps, positionMap, areaWidth, areaHeight, nodeRadius }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const { current, previous, localFrame } = useStepTransition(steps);
  const outputValues    = current.snapshot.outputValues  ?? [];
  const prevOutputValues = previous.snapshot.outputValues ?? [];

  const GREEN       = "#40c057";
  const DASH_PERIOD = 16;
  const dashOffset  = -((frame * 0.5) % DASH_PERIOD);

  return (
    <svg
      style={{
        position: "absolute", top: 0, left: 0,
        width: "100%", height: "100%",
        overflow: "visible", pointerEvents: "none", zIndex: 2,
      }}
      viewBox={`0 0 ${areaWidth} ${areaHeight}`}
    >
      <defs>
        <marker id="bnd-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill={GREEN} />
        </marker>
      </defs>
      {BOUNDARY_SEGMENTS.map(({ fromId, toId, triggerValue, cpFrac }) => {
        const isVisible = outputValues.includes(triggerValue);
        if (!isVisible) return null;

        const fromPos = positionMap[fromId];
        const toPos   = positionMap[toId];
        if (!fromPos || !toPos) return null;

        const x1  = fromPos.x * areaWidth;
        const y1  = fromPos.y * areaHeight;
        const x2  = toPos.x  * areaWidth;
        const y2  = toPos.y  * areaHeight;
        const cpx = cpFrac.x * areaWidth;
        const cpy = cpFrac.y * areaHeight;

        // Offset start along straight line direction
        const dx = x2 - x1, dy = y2 - y1;
        const d  = Math.sqrt(dx * dx + dy * dy);
        const sx = x1 + (dx / d) * nodeRadius;
        const sy = y1 + (dy / d) * nodeRadius;

        // Offset end along bezier tangent at endpoint (cp→end)
        const cpDx = x2 - cpx, cpDy = y2 - cpy;
        const cpD  = Math.sqrt(cpDx * cpDx + cpDy * cpDy);
        const ex   = x2 - (cpDx / cpD) * nodeRadius;
        const ey   = y2 - (cpDy / cpD) * nodeRadius;

        const isNew   = !prevOutputValues.includes(triggerValue);
        const opacity = isNew
          ? spring({ frame: localFrame, fps, config: springPresets.enter })
          : 1;

        return (
          <path
            key={`${fromId}-${toId}`}
            d={`M ${sx},${sy} Q ${cpx},${cpy} ${ex},${ey}`}
            stroke={GREEN}
            strokeWidth={2.5}
            strokeDasharray="10 6"
            strokeDashoffset={dashOffset}
            fill="none"
            opacity={opacity}
            markerEnd="url(#bnd-arrow)"
            style={{ filter: "drop-shadow(0 0 5px #40c05788)" }}
          />
        );
      })}
    </svg>
  );
};

export const BoundaryTraversal: React.FC<BoundaryTraversalProps> = ({
  tokens,
  format = "youtube",
}) => {
  const { width, height } = useVideoConfig();
  const isReel     = format === "reel" || format === "reel-anim";
  const isAnim     = format === "reel-anim";
  const isReelOnly = format === "reel";

  const safeW = width - REEL_SAFE.left - REEL_SAFE.right;
  const safeH = height - REEL_SAFE.top - REEL_SAFE.bottom;
  const diagramAreaW = isAnim ? width : isReel ? safeW : width * 0.62;
  const diagramAreaH = isAnim ? ANIM_DIAGRAM_HEIGHT : isReel ? Math.round(safeH * REEL_TOP_RATIO) : height;
  const nodeScale    = isAnim ? 1.2 : isReel ? 0.75 : 0.85;
  const steps        = isAnim ? compressStepsForAnim(makeSteps()) : makeSteps();
  const { current, localFrame } = useStepTransition(steps);
  const complexityInfo = current.snapshot.complexityInfo;

  const diagram = (
    <div
      style={{
        width:    diagramAreaW,
        height:   isAnim ? diagramAreaH : isReelOnly ? diagramAreaH : height,
        position: "relative",
        overflow: "hidden",
        margin:   isReelOnly ? "0 auto" : undefined,
      }}
    >
      <TreeDiagram
        steps={steps}
        positionMap={makePositionMap(format)}
        areaWidth={diagramAreaW}
        areaHeight={diagramAreaH}
        nodeScale={nodeScale}
        ringNodeIds={["n1", "n2", "n3", "n4", "n6", "n7", "n8", "n9", "n10"]}
      />
      <BoundaryPathOverlay
        steps={steps}
        positionMap={makePositionMap(format)}
        areaWidth={diagramAreaW}
        areaHeight={diagramAreaH}
        nodeRadius={30 * nodeScale}
      />
      {isAnim && <PhaseLabel startLine={current.highlightLines.startLine} localFrame={localFrame} />}
    </div>
  );

  // YouTube has no header (noHeader=true), reel header is ~30px
  const codeAreaH = isReelOnly
    ? Math.round(safeH * (1 - REEL_TOP_RATIO)) - 30
    : height;

  const code = (
    <CodeWindow title="BinaryTree.java" hideTitle={isReel} noHeader={!isReel}>
      <CodeBlock
        tokens={tokens}
        steps={steps}
        fontSize={isReel ? 19 : 22}
        padding={isReel ? 20 : 24}
        centered={isReel}
        centerWidth={isReel ? safeW : undefined}
        autoScroll
        containerHeight={codeAreaH}
      />
    </CodeWindow>
  );

  const reelDividerTop = REEL_SAFE.top + safeH * REEL_TOP_RATIO;
  const reelCenterLeft = REEL_SAFE.left + safeW / 2;

  return (
    <>
      {isAnim ? (
        <AnimationOnlyLayout>{diagram}</AnimationOnlyLayout>
      ) : isReelOnly ? (
        <StackedLayout top={diagram} bottom={code} safeArea={REEL_SAFE} topRatio={REEL_TOP_RATIO} />
      ) : (
        <SplitLayout left={diagram} right={code} leftWidth="58%" />
      )}
      <AmbientLayer />
      {!isAnim && <SfxLayer steps={steps} duckVolume={0.45} />}
      {!isAnim && <NarrationLayer sceneId="boundary" steps={steps} />}
      <StackViz
        steps={steps}
        style={
          isAnim
            ? { position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", zIndex: 5 }
            : isReelOnly
            ? { position: "absolute", top: reelDividerTop - 220, left: reelCenterLeft, transform: "translateX(-50%)", zIndex: 5 }
            : { position: "absolute", bottom: 80, left: width * 0.27, transform: "translateX(-50%)", zIndex: 5 }
        }
      />
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
