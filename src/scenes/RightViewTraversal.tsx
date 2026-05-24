import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
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

export const RIGHT_VIEW_SCENE_FRAMES = 4500;

const BASE_EDGES: ArrowData[] = [
  { from: "n1", to: "n2" },
  { from: "n1", to: "n3" },
  { from: "n2", to: "n4" },
  { from: "n2", to: "n5" },
  { from: "n3", to: "n6" },
  { from: "n3", to: "n7" },
  { from: "n4", to: "n8" },
];

function buildNodes(
  activeId?: string,
  printedIds: string[] = [],
  activeIsPrinted = false,
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
        ? activeIsPrinted
          ? "found"
          : "active"
        : printedIds.includes(node.id)
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

// Right view nodes (rightmost per level): n1, n3, n7, n8 → output [1, 3, 7, 8]
const P1    = ["n1"];
const P13   = ["n1", "n3"];
const P137  = ["n1", "n3", "n7"];
const P1378 = ["n1", "n3", "n7", "n8"];
const V2    = ["n2"];
const V2456 = ["n2", "n4", "n5", "n6"];

function makeSteps(): SceneStep[] {
  return [
    // ── Step 0: Intro ─────────────────────────────────────────────────────────
    {
      excludeFromAnim: true,
      startFrame: 0,
      highlightLines: { startLine: 0, endLine: 0 },
      visibleLines: 1,
      snapshot: {
        nodes: buildNodes(),
        pointers: [],
        arrows: buildEdges(),
        outputLabel: "Right View",
        outputValues: [],
        queueItems: [],
      },
    },
    // ── Step 1: Null check ─────────────────────────────────────────────────────
    {
      startFrame: 200,
      highlightLines: { startLine: 1, endLine: 1 },
      visibleLines: 2,
      snapshot: {
        nodes: buildNodes(),
        pointers: [],
        arrows: buildEdges(),
        outputLabel: "Right View",
        outputValues: [],
        queueItems: [],
      },
    },
    // ── Step 2: Create queue + add root ───────────────────────────────────────
    {
      startFrame: 400,
      highlightLines: { startLine: 2, endLine: 3 },
      visibleLines: 4,
      snapshot: {
        nodes: buildNodes("n1"),
        pointers: [],
        arrows: buildEdges(),
        outputLabel: "Right View",
        outputValues: [],
        queueItems: [{ value: 1, highlight: "new" }],
      },
    },
    // ── Step 3: While loop + levelSize = 1 ────────────────────────────────────
    {
      startFrame: 600,
      highlightLines: { startLine: 4, endLine: 5 },
      visibleLines: 6,
      snapshot: {
        nodes: buildNodes("n1"),
        pointers: [],
        arrows: buildEdges(),
        outputLabel: "Right View",
        outputValues: [],
        queueItems: [{ value: 1, highlight: "new" }],
      },
    },
    // ── Step 4: For loop + poll node 1 — i=0=size-1 → print ──────────────────
    {
      startFrame: 800,
      highlightLines: { startLine: 6, endLine: 8 },
      visibleLines: 9,
      snapshot: {
        nodes: buildNodes("n1", [], true),
        pointers: [],
        arrows: buildEdges(),
        outputLabel: "Right View",
        outputValues: [1],
        queueItems: [{ value: 1, highlight: "active" }],
      },
    },
    // ── Step 5: Push children 2 and 3 ─────────────────────────────────────────
    {
      startFrame: 1000,
      highlightLines: { startLine: 9, endLine: 10 },
      visibleLines: 11,
      snapshot: {
        nodes: buildNodes("n2", P1),
        pointers: [],
        arrows: buildEdges(["n1-n2", "n1-n3"]),
        outputLabel: "Right View",
        outputValues: [1],
        queueItems: [
          { value: 2, highlight: "new" },
          { value: 3, highlight: "new" },
        ],
      },
    },
    // ── Step 6: While loop, levelSize = 2 ────────────────────────────────────
    {
      startFrame: 1200,
      highlightLines: { startLine: 4, endLine: 5 },
      visibleLines: 14,
      snapshot: {
        nodes: buildNodes("n2", P1),
        pointers: [],
        arrows: buildEdges(),
        outputLabel: "Right View",
        outputValues: [1],
        queueItems: [{ value: 2, highlight: "new" }, { value: 3, highlight: "new" }],
      },
    },
    // ── Step 7: i=0, poll node 2, i≠size-1 → skip ────────────────────────────
    {
      startFrame: 1400,
      highlightLines: { startLine: 6, endLine: 8 },
      visibleLines: 14,
      snapshot: {
        nodes: buildNodes(undefined, P1, false, V2),
        pointers: [],
        arrows: buildEdges(["n1-n2"]),
        outputLabel: "Right View",
        outputValues: [1],
        queueItems: [{ value: 2, highlight: "visited" }, { value: 3 }],
      },
    },
    // ── Step 8: Push children 4 and 5 ─────────────────────────────────────────
    {
      startFrame: 1600,
      highlightLines: { startLine: 9, endLine: 10 },
      visibleLines: 14,
      snapshot: {
        nodes: buildNodes("n4", P1, false, V2),
        pointers: [],
        arrows: buildEdges(["n2-n4", "n2-n5"]),
        outputLabel: "Right View",
        outputValues: [1],
        queueItems: [
          { value: 3 },
          { value: 4, highlight: "new" },
          { value: 5, highlight: "new" },
        ],
      },
    },
    // ── Step 9: i=1=size-1, poll node 3 → print 3 ────────────────────────────
    {
      startFrame: 1800,
      highlightLines: { startLine: 6, endLine: 8 },
      visibleLines: 14,
      snapshot: {
        nodes: buildNodes("n3", P13, true, V2),
        pointers: [],
        arrows: buildEdges(["n1-n3"]),
        outputLabel: "Right View",
        outputValues: [1, 3],
        queueItems: [{ value: 3, highlight: "active" }, { value: 4, highlight: "new" }, { value: 5, highlight: "new" }],
      },
    },
    // ── Step 10: Push children 6 and 7 ────────────────────────────────────────
    {
      startFrame: 2000,
      highlightLines: { startLine: 9, endLine: 10 },
      visibleLines: 14,
      snapshot: {
        nodes: buildNodes("n6", P13, false, V2),
        pointers: [],
        arrows: buildEdges(["n3-n6", "n3-n7"]),
        outputLabel: "Right View",
        outputValues: [1, 3],
        queueItems: [
          { value: 4 },
          { value: 5 },
          { value: 6, highlight: "new" },
          { value: 7, highlight: "new" },
        ],
      },
    },
    // ── Step 11: While loop, levelSize = 4 ───────────────────────────────────
    {
      startFrame: 2200,
      highlightLines: { startLine: 4, endLine: 5 },
      visibleLines: 14,
      snapshot: {
        nodes: buildNodes("n4", P13, false, V2),
        pointers: [],
        arrows: buildEdges(),
        outputLabel: "Right View",
        outputValues: [1, 3],
        queueItems: [{ value: 4 }, { value: 5 }, { value: 6, highlight: "new" }, { value: 7, highlight: "new" }],
      },
    },
    // ── Step 12: i=0, poll node 4, i≠size-1 → skip ───────────────────────────
    {
      startFrame: 2400,
      highlightLines: { startLine: 6, endLine: 8 },
      visibleLines: 14,
      snapshot: {
        nodes: buildNodes(undefined, P13, false, ["n2", "n4"]),
        pointers: [],
        arrows: buildEdges(["n2-n4"]),
        outputLabel: "Right View",
        outputValues: [1, 3],
        queueItems: [{ value: 4, highlight: "visited" }, { value: 5 }, { value: 6 }, { value: 7 }],
      },
    },
    // ── Step 13: Push child 8 ─────────────────────────────────────────────────
    {
      startFrame: 2600,
      highlightLines: { startLine: 9, endLine: 9 },
      visibleLines: 14,
      snapshot: {
        nodes: buildNodes("n8", P13, false, ["n2", "n4"]),
        pointers: [],
        arrows: buildEdges(["n4-n8"]),
        outputLabel: "Right View",
        outputValues: [1, 3],
        queueItems: [
          { value: 5 },
          { value: 6 },
          { value: 7 },
          { value: 8, highlight: "new" },
        ],
      },
    },
    // ── Step 14: i=1, poll node 5, i≠size-1 → skip ───────────────────────────
    {
      startFrame: 2750,
      highlightLines: { startLine: 6, endLine: 8 },
      visibleLines: 14,
      snapshot: {
        nodes: buildNodes(undefined, P13, false, ["n2", "n4", "n5"]),
        pointers: [],
        arrows: buildEdges(["n2-n5"]),
        outputLabel: "Right View",
        outputValues: [1, 3],
        queueItems: [{ value: 5, highlight: "visited" }, { value: 6 }, { value: 7 }, { value: 8, highlight: "new" }],
      },
    },
    // ── Step 15: i=2, poll node 6, i≠size-1 → skip ───────────────────────────
    {
      startFrame: 2900,
      highlightLines: { startLine: 6, endLine: 8 },
      visibleLines: 14,
      snapshot: {
        nodes: buildNodes(undefined, P13, false, ["n2", "n4", "n5", "n6"]),
        pointers: [],
        arrows: buildEdges(["n3-n6"]),
        outputLabel: "Right View",
        outputValues: [1, 3],
        queueItems: [{ value: 6, highlight: "visited" }, { value: 7 }, { value: 8 }],
      },
    },
    // ── Step 16: i=3=size-1, poll node 7 → print 7 ───────────────────────────
    {
      startFrame: 3050,
      highlightLines: { startLine: 6, endLine: 8 },
      visibleLines: 14,
      snapshot: {
        nodes: buildNodes("n7", P137, true, V2456),
        pointers: [],
        arrows: buildEdges(["n3-n7"]),
        outputLabel: "Right View",
        outputValues: [1, 3, 7],
        queueItems: [{ value: 7, highlight: "active" }, { value: 8 }],
      },
    },
    // ── Step 17: While loop, levelSize = 1 ───────────────────────────────────
    {
      startFrame: 3200,
      highlightLines: { startLine: 4, endLine: 5 },
      visibleLines: 14,
      snapshot: {
        nodes: buildNodes("n8", P137, false, V2456),
        pointers: [],
        arrows: buildEdges(),
        outputLabel: "Right View",
        outputValues: [1, 3, 7],
        queueItems: [{ value: 8 }],
      },
    },
    // ── Step 18: i=0=size-1, poll node 8 → print 8 ───────────────────────────
    {
      startFrame: 3350,
      highlightLines: { startLine: 6, endLine: 8 },
      visibleLines: 14,
      snapshot: {
        nodes: buildNodes("n8", P137, true, V2456),
        pointers: [],
        arrows: buildEdges(["n4-n8"]),
        outputLabel: "Right View",
        outputValues: [1, 3, 7, 8],
        queueItems: [{ value: 8, highlight: "active" }],
      },
    },
    // ── Step 19: No children for n8 ───────────────────────────────────────────
    {
      startFrame: 3500,
      highlightLines: { startLine: 9, endLine: 10 },
      visibleLines: 14,
      snapshot: {
        nodes: buildNodes(undefined, P1378, false, V2456),
        pointers: [],
        arrows: buildEdges(),
        outputLabel: "Right View",
        outputValues: [1, 3, 7, 8],
        queueItems: [],
      },
    },
    // ── Step 20: While ends ───────────────────────────────────────────────────
    {
      startFrame: 3650,
      highlightLines: { startLine: 4, endLine: 4 },
      visibleLines: 14,
      snapshot: {
        nodes: buildNodes(undefined, P1378, false, V2456),
        pointers: [],
        arrows: buildEdges(),
        outputLabel: "Right View",
        outputValues: [1, 3, 7, 8],
        queueItems: [],
      },
    },
    // ── Step 21: Complexity ───────────────────────────────────────────────────
    {
      excludeFromAnim: true,
      startFrame: 3800,
      highlightLines: { startLine: 0, endLine: 13 },
      visibleLines: 14,
      snapshot: {
        nodes: buildNodes(undefined, P1378, false, V2456),
        pointers: [],
        arrows: buildEdges(),
        complexityInfo: { time: "O(n)", space: "O(n)" },
        outputLabel: "Right View",
        outputValues: [1, 3, 7, 8],
        queueItems: [],
      },
    },
  ];
}

function makePositionMap(format: "youtube" | "reel" | "reel-anim"): Record<string, { x: number; y: number }> {
  if (format === "reel-anim") {
    return {
      n1: { x: 0.50, y: 0.16 },
      n2: { x: 0.32, y: 0.33 },
      n3: { x: 0.68, y: 0.33 },
      n4: { x: 0.20, y: 0.50 },
      n5: { x: 0.40, y: 0.50 },
      n6: { x: 0.60, y: 0.50 },
      n7: { x: 0.78, y: 0.50 },
      n8: { x: 0.12, y: 0.67 },
    };
  }
  return format === "reel"
    ? {
        n1: { x: 0.50, y: 0.23 },
        n2: { x: 0.34, y: 0.37 },
        n3: { x: 0.66, y: 0.37 },
        n4: { x: 0.24, y: 0.50 },
        n5: { x: 0.43, y: 0.50 },
        n6: { x: 0.57, y: 0.50 },
        n7: { x: 0.74, y: 0.50 },
        n8: { x: 0.18, y: 0.63 },
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

export interface RightViewTraversalProps {
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

export const RightViewTraversal: React.FC<RightViewTraversalProps> = ({
  tokens,
  format = "youtube",
}) => {
  const { width, height } = useVideoConfig();
  const isReel = format === "reel" || format === "reel-anim";
  const isAnim = format === "reel-anim";
  const isReelOnly = format === "reel";

  const safeW = width - REEL_SAFE.left - REEL_SAFE.right;
  const safeH = height - REEL_SAFE.top - REEL_SAFE.bottom;
  const diagramAreaW = isAnim ? width : isReel ? safeW : width * 0.62;
  const diagramAreaH = isAnim ? ANIM_DIAGRAM_HEIGHT : isReel ? Math.round(safeH * REEL_TOP_RATIO) : height;
  const nodeScale = isAnim ? 1.4 : isReel ? 0.82 : 1;
  const steps = isAnim ? compressStepsForAnim(makeSteps()) : makeSteps();
  const { current, localFrame } = useStepTransition(steps);
  const complexityInfo = current.snapshot.complexityInfo;

  const diagram = (
    <div
      style={{
        width: diagramAreaW,
        height: isAnim ? diagramAreaH : isReelOnly ? diagramAreaH : height,
        position: "relative",
        overflow: "hidden",
        margin: isReelOnly ? "0 auto" : undefined,
      }}
    >
      <TreeDiagram
        steps={steps}
        positionMap={makePositionMap(format)}
        areaWidth={diagramAreaW}
        areaHeight={diagramAreaH}
        nodeScale={nodeScale}
        ringNodeIds={["n1", "n3", "n7", "n8"]}
      />
      <QueueVisualization
        steps={steps}
        itemSize={isAnim ? 54 : isReel ? 50 : 52}
        style={{
          position: "absolute",
          bottom: isAnim ? 24 : isReelOnly ? 24 : 110,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 5,
        }}
      />
    </div>
  );

  const code = (
    <CodeWindow title="BinaryTree.java" hideTitle={isReel}>
      <CodeBlock
        tokens={tokens}
        steps={steps}
        fontSize={isReel ? 22 : 24}
        padding={isReel ? 24 : 20}
        centered={isReel}
        centerWidth={isReel ? safeW : undefined}
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
        <SplitLayout left={diagram} right={code} leftWidth="54%" />
      )}
      <AmbientLayer />
      {!isAnim && <SfxLayer steps={steps} duckVolume={0.45} />}
      {!isAnim && <NarrationLayer sceneId="right-view" steps={steps} />}
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
