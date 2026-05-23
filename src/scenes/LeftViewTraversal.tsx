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

export const LEFT_VIEW_SCENE_FRAMES = 4543;

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

// Shorthand sets reused across steps
const P1    = ["n1"];
const P12   = ["n1", "n2"];
const P124  = ["n1", "n2", "n4"];
const P1248 = ["n1", "n2", "n4", "n8"];
const V3    = ["n3"];
const V3567 = ["n3", "n5", "n6", "n7"];

function makeSteps(): SceneStep[] {
  return [
    // ── Step 0: Intro ─────────────────────────────────────────────────────────
    {
      startFrame: 0,
      highlightLines: { startLine: 0, endLine: 0 },
      visibleLines: 1,
      snapshot: {
        nodes: buildNodes(),
        pointers: [],
        arrows: buildEdges(),
        caption: "Left view of a binary tree",
        secondaryCaption: "The nodes visible from the left side — one per row.",
        outputLabel: "Left View",
        outputValues: [],
        queueItems: [],
      },
    },
    // ── Step 1: Null check ─────────────────────────────────────────────────────
    {
      startFrame: 271,
      highlightLines: { startLine: 1, endLine: 1 },
      visibleLines: 2,
      snapshot: {
        nodes: buildNodes(),
        pointers: [],
        arrows: buildEdges(),
        caption: "Guard: empty tree",
        outputLabel: "Left View",
        outputValues: [],
        queueItems: [],
      },
    },
    // ── Step 2: Create queue + add root ───────────────────────────────────────
    {
      startFrame: 410,
      highlightLines: { startLine: 2, endLine: 3 },
      visibleLines: 4,
      snapshot: {
        nodes: buildNodes("n1"),
        pointers: [],
        arrows: buildEdges(),
        caption: "Queue starts with the root",
        outputLabel: "Left View",
        outputValues: [],
        queueItems: [{ value: 1, highlight: "new" }],
      },
    },
    // ── Step 3: While loop + levelSize = 1 ────────────────────────────────────
    {
      startFrame: 635,
      highlightLines: { startLine: 4, endLine: 5 },
      visibleLines: 6,
      snapshot: {
        nodes: buildNodes("n1"),
        pointers: [],
        arrows: buildEdges(),
        caption: "Row 1  —  levelSize = 1",
        outputLabel: "Left View",
        outputValues: [],
        queueItems: [{ value: 1 }],
      },
    },
    // ── Step 4: For loop + poll node 1 ────────────────────────────────────────
    {
      startFrame: 831,
      highlightLines: { startLine: 6, endLine: 7 },
      visibleLines: 8,
      snapshot: {
        nodes: buildNodes("n1"),
        pointers: [],
        arrows: buildEdges(),
        caption: "i = 0  →  poll node 1",
        outputLabel: "Left View",
        outputValues: [],
        queueItems: [{ value: 1, highlight: "active" }],
      },
    },
    // ── Step 5: i == 0 → print 1 ──────────────────────────────────────────────
    {
      startFrame: 978,
      highlightLines: { startLine: 8, endLine: 8 },
      visibleLines: 9,
      snapshot: {
        nodes: buildNodes("n1", [], true),
        pointers: [],
        arrows: buildEdges(),
        caption: "i == 0  →  print 1",
        outputLabel: "Left View",
        outputValues: [1],
        queueItems: [],
      },
    },
    // ── Step 6: Push children 2 and 3 ─────────────────────────────────────────
    {
      startFrame: 1143,
      highlightLines: { startLine: 9, endLine: 10 },
      visibleLines: 11,
      snapshot: {
        nodes: buildNodes("n2", P1),
        pointers: [],
        arrows: buildEdges(["n1-n2", "n1-n3"]),
        caption: "Push left child, then right child",
        outputLabel: "Left View",
        outputValues: [1],
        queueItems: [
          { value: 2, highlight: "new" },
          { value: 3, highlight: "new" },
        ],
      },
    },
    // ── Step 7: While loop, levelSize = 2 ────────────────────────────────────
    {
      startFrame: 1365,
      highlightLines: { startLine: 4, endLine: 5 },
      visibleLines: 14,
      snapshot: {
        nodes: buildNodes("n2", P1),
        pointers: [],
        arrows: buildEdges(),
        caption: "Row 2  —  levelSize = 2",
        outputLabel: "Left View",
        outputValues: [1],
        queueItems: [{ value: 2 }, { value: 3 }],
      },
    },
    // ── Step 8: i = 0, poll node 2 ────────────────────────────────────────────
    {
      startFrame: 1531,
      highlightLines: { startLine: 6, endLine: 7 },
      visibleLines: 14,
      snapshot: {
        nodes: buildNodes("n2", P1),
        pointers: [],
        arrows: buildEdges(["n1-n2"]),
        caption: "i = 0  →  poll node 2",
        outputLabel: "Left View",
        outputValues: [1],
        queueItems: [{ value: 2, highlight: "active" }, { value: 3 }],
      },
    },
    // ── Step 9: i == 0 → print 2 ──────────────────────────────────────────────
    {
      startFrame: 1613,
      highlightLines: { startLine: 8, endLine: 8 },
      visibleLines: 14,
      snapshot: {
        nodes: buildNodes("n2", P1, true),
        pointers: [],
        arrows: buildEdges(["n1-n2"]),
        caption: "i == 0  →  print 2",
        outputLabel: "Left View",
        outputValues: [1, 2],
        queueItems: [{ value: 3 }],
      },
    },
    // ── Step 10: Push children 4 and 5 ────────────────────────────────────────
    {
      startFrame: 1720,
      highlightLines: { startLine: 9, endLine: 10 },
      visibleLines: 14,
      snapshot: {
        nodes: buildNodes("n4", P12),
        pointers: [],
        arrows: buildEdges(["n2-n4", "n2-n5"]),
        caption: "Push node 2's children",
        outputLabel: "Left View",
        outputValues: [1, 2],
        queueItems: [
          { value: 3 },
          { value: 4, highlight: "new" },
          { value: 5, highlight: "new" },
        ],
      },
    },
    // ── Step 11: i = 1, poll node 3 ───────────────────────────────────────────
    {
      startFrame: 1885,
      highlightLines: { startLine: 6, endLine: 7 },
      visibleLines: 14,
      snapshot: {
        nodes: buildNodes("n3", P12),
        pointers: [],
        arrows: buildEdges(["n1-n3"]),
        caption: "i = 1  →  poll node 3",
        outputLabel: "Left View",
        outputValues: [1, 2],
        queueItems: [{ value: 3, highlight: "active" }, { value: 4 }, { value: 5 }],
      },
    },
    // ── Step 12: i ≠ 0 → skip node 3 ─────────────────────────────────────────
    {
      startFrame: 1974,
      highlightLines: { startLine: 8, endLine: 8 },
      visibleLines: 14,
      snapshot: {
        nodes: buildNodes(undefined, P12, false, V3),
        pointers: [],
        arrows: buildEdges(["n1-n3"]),
        caption: "i ≠ 0  →  skip node 3",
        outputLabel: "Left View",
        outputValues: [1, 2],
        queueItems: [{ value: 4 }, { value: 5 }],
      },
    },
    // ── Step 13: Push children 6 and 7 ────────────────────────────────────────
    {
      startFrame: 2142,
      highlightLines: { startLine: 9, endLine: 10 },
      visibleLines: 14,
      snapshot: {
        nodes: buildNodes("n6", P12, false, V3),
        pointers: [],
        arrows: buildEdges(["n3-n6", "n3-n7"]),
        caption: "Push node 3's children",
        outputLabel: "Left View",
        outputValues: [1, 2],
        queueItems: [
          { value: 4 },
          { value: 5 },
          { value: 6, highlight: "new" },
          { value: 7, highlight: "new" },
        ],
      },
    },
    // ── Step 14: While loop, levelSize = 4 ───────────────────────────────────
    {
      startFrame: 2354,
      highlightLines: { startLine: 4, endLine: 5 },
      visibleLines: 14,
      snapshot: {
        nodes: buildNodes("n4", P12, false, V3),
        pointers: [],
        arrows: buildEdges(),
        caption: "Row 3  —  levelSize = 4",
        outputLabel: "Left View",
        outputValues: [1, 2],
        queueItems: [{ value: 4 }, { value: 5 }, { value: 6 }, { value: 7 }],
      },
    },
    // ── Step 15: i = 0, poll + print node 4 ──────────────────────────────────
    {
      startFrame: 2511,
      highlightLines: { startLine: 6, endLine: 8 },
      visibleLines: 14,
      snapshot: {
        nodes: buildNodes("n4", P12, true, V3),
        pointers: [],
        arrows: buildEdges(["n2-n4"]),
        caption: "i == 0  →  print 4",
        outputLabel: "Left View",
        outputValues: [1, 2, 4],
        queueItems: [
          { value: 4, highlight: "active" },
          { value: 5 },
          { value: 6 },
          { value: 7 },
        ],
      },
    },
    // ── Step 16: Push child 8 ──────────────────────────────────────────────────
    {
      startFrame: 2654,
      highlightLines: { startLine: 9, endLine: 10 },
      visibleLines: 14,
      snapshot: {
        nodes: buildNodes("n8", P124, false, V3),
        pointers: [],
        arrows: buildEdges(["n4-n8"]),
        caption: "Push node 4's only child",
        outputLabel: "Left View",
        outputValues: [1, 2, 4],
        queueItems: [
          { value: 5 },
          { value: 6 },
          { value: 7 },
          { value: 8, highlight: "new" },
        ],
      },
    },
    // ── Step 17: Nodes 5, 6, 7 all skipped ───────────────────────────────────
    {
      startFrame: 2818,
      highlightLines: { startLine: 6, endLine: 8 },
      visibleLines: 14,
      snapshot: {
        nodes: buildNodes(undefined, P124, false, V3567),
        pointers: [],
        arrows: buildEdges(),
        caption: "i = 1, 2, 3  →  skip 5, 6, 7",
        outputLabel: "Left View",
        outputValues: [1, 2, 4],
        queueItems: [
          { value: 5, highlight: "visited" },
          { value: 6, highlight: "visited" },
          { value: 7, highlight: "visited" },
          { value: 8 },
        ],
      },
    },
    // ── Step 18: While loop, levelSize = 1 ───────────────────────────────────
    {
      startFrame: 3052,
      highlightLines: { startLine: 4, endLine: 5 },
      visibleLines: 14,
      snapshot: {
        nodes: buildNodes("n8", P124, false, V3567),
        pointers: [],
        arrows: buildEdges(),
        caption: "Row 4  —  levelSize = 1",
        outputLabel: "Left View",
        outputValues: [1, 2, 4],
        queueItems: [{ value: 8 }],
      },
    },
    // ── Step 19: i = 0, poll + print node 8 ──────────────────────────────────
    {
      startFrame: 3191,
      highlightLines: { startLine: 6, endLine: 8 },
      visibleLines: 14,
      snapshot: {
        nodes: buildNodes("n8", P124, true, V3567),
        pointers: [],
        arrows: buildEdges(["n4-n8"]),
        caption: "i == 0  →  print 8",
        outputLabel: "Left View",
        outputValues: [1, 2, 4, 8],
        queueItems: [{ value: 8, highlight: "active" }],
      },
    },
    // ── Step 20: While ends ───────────────────────────────────────────────────
    {
      startFrame: 3293,
      highlightLines: { startLine: 4, endLine: 4 },
      visibleLines: 14,
      snapshot: {
        nodes: buildNodes(undefined, P1248, false, V3567),
        pointers: [],
        arrows: buildEdges(),
        caption: "Queue empty  →  loop exits",
        outputLabel: "Left View",
        outputValues: [1, 2, 4, 8],
        queueItems: [],
      },
    },
    // ── Step 21: Complexity ───────────────────────────────────────────────────
    {
      startFrame: 3380,
      highlightLines: { startLine: 0, endLine: 13 },
      visibleLines: 14,
      snapshot: {
        nodes: buildNodes(undefined, P1248, false, V3567),
        pointers: [],
        arrows: buildEdges(),
        caption: "Output: 1  2  4  8",
        complexityInfo: { time: "O(n)", space: "O(n)" },
        outputLabel: "Left View",
        outputValues: [1, 2, 4, 8],
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

export interface LeftViewTraversalProps {
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

export const LeftViewTraversal: React.FC<LeftViewTraversalProps> = ({
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
        ringNodeIds={["n1", "n2", "n4", "n8"]}
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

  const reelDividerTop  = REEL_SAFE.top + safeH * REEL_TOP_RATIO;
  const reelCenterLeft  = REEL_SAFE.left + safeW / 2;

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
      {!isAnim && <NarrationLayer sceneId="left-view" steps={steps} />}
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
