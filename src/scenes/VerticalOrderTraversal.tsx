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
const REEL_TOP_RATIO = 0.60;

export const VERTICAL_ORDER_SCENE_FRAMES = 6420;

// Tree: 7 nodes
//        1 (n1)       col  0
//       / \
//      2   3          col -1, col +1
//     / \   \
//    4   5   6        col -2, col 0, col +2
//         \
//          7 (n7)     col +1
// Each column: x fraction matches position map, color groups nodes in that column
// topY/botY are the y-fracs (from position map) of the topmost/bottommost node in each column,
// per format — used to anchor column indicator lines and labels to actual node positions.
const COLUMN_GROUPS = [
  { label: "−2", xFrac: 0.14, color: "#5CE8D4",
    topY: { youtube: 0.46, reel: 0.49 }, botY: { youtube: 0.46, reel: 0.49 } },
  { label: "−1", xFrac: 0.30, color: "#6EE7A0",
    topY: { youtube: 0.27, reel: 0.31 }, botY: { youtube: 0.27, reel: 0.31 } },
  { label: " 0", xFrac: 0.48, color: "#6E9BFF",
    topY: { youtube: 0.10, reel: 0.13 }, botY: { youtube: 0.46, reel: 0.49 } },
  { label: "+1", xFrac: 0.64, color: "#FFD666",
    topY: { youtube: 0.27, reel: 0.31 }, botY: { youtube: 0.64, reel: 0.67 } },
  { label: "+2", xFrac: 0.82, color: "#B07EFF",
    topY: { youtube: 0.46, reel: 0.49 }, botY: { youtube: 0.46, reel: 0.49 } },
];

const BASE_EDGES: ArrowData[] = [
  { from: "n1", to: "n2" },
  { from: "n1", to: "n3" },
  { from: "n2", to: "n4" },
  { from: "n2", to: "n5" },
  { from: "n3", to: "n6" },
  { from: "n5", to: "n7" },
];


function buildNodes(
  activeId?: string,
  printedIds: string[] = [],
  activeIsPrinted = false,
  visitedIds: string[] = [],
  newIds: string[] = [],
): ListNodeData[] {
  const values: Array<{ id: string; value: number }> = [
    { id: "n1", value: 1 },
    { id: "n2", value: 2 },
    { id: "n3", value: 3 },
    { id: "n4", value: 4 },
    { id: "n5", value: 5 },
    { id: "n6", value: 6 },
    { id: "n7", value: 7 },
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
            ? ("visited" as any)
            : newIds.includes(node.id)
              ? ("new" as any)
              : "none",
  }));
}

function buildEdges(highlighted: string[] = []): ArrowData[] {
  return BASE_EDGES.map((edge) => ({
    ...edge,
    highlight: highlighted.includes(`${edge.from}-${edge.to}`),
  }));
}

const ALL_FOUND = ["n1", "n2", "n3", "n4", "n5", "n6", "n7"];

function makeSteps(): SceneStep[] {
  return [
    // ── Step 0: Output preview — column connector arrows ──────────────────────
    {
      excludeFromAnim: true,
      startFrame: 0,
      highlightLines: { startLine: 0, endLine: 0 },
      visibleLines: 1,
      snapshot: {
        nodes: buildNodes(),
        pointers: [],
        arrows: buildEdges(),
        caption: "HashMap gives wrong order. TreeMap fixes it. Why DFS breaks — coming up.",
        outputLabel: "Result",
        outputValues: [4, 2, 1, 5, 3, 7, 6],
        queueItems: [],
      },
    },
    // ── Step 1: Intuition ─────────────────────────────────────────────────────
    {
      excludeFromAnim: true,
      startFrame: 544,
      highlightLines: { startLine: 0, endLine: 0 },
      visibleLines: 1,
      snapshot: {
        nodes: buildNodes(),
        pointers: [],
        arrows: buildEdges(),
        caption: "Left → col−1.  Right → col+1.  Root = col 0.  BFS fills the buckets.",
        outputLabel: "Result",
        outputValues: [],
        queueItems: [],
      },
    },
    // ── Step 2: Null guard ────────────────────────────────────────────────────
    {
      excludeFromAnim: true,
      startFrame: 1038,
      highlightLines: { startLine: 1, endLine: 1 },
      visibleLines: 2,
      snapshot: {
        nodes: buildNodes(),
        pointers: [],
        arrows: buildEdges(),
        caption: "Null root → return empty list",
        outputLabel: "Result",
        outputValues: [],
        queueItems: [],
      },
    },
    // ── Step 3: Init colMap, colOf, queue; seed root at col 0 ─────────────────
    {
      startFrame: 1162,
      highlightLines: { startLine: 2, endLine: 7 },
      visibleLines: 8,
      snapshot: {
        nodes: buildNodes("n1"),
        pointers: [],
        arrows: buildEdges(),
        caption: "TreeMap (not HashMap) — sorted keys = free column order. Seed root at col 0.",
        outputLabel: "Result",
        outputValues: [],
        queueItems: [{ value: 1, highlight: "new" }],
      },
    },
    // ── Step 4: Poll 1 (col 0); add to colMap[0] ─────────────────────────────
    {
      startFrame: 1873,
      highlightLines: { startLine: 8, endLine: 12 },
      visibleLines: 13,
      snapshot: {
        nodes: buildNodes("n1", [], true),
        pointers: [],
        arrows: buildEdges(),
        caption: "Poll 1 — col 0. Add to colMap[0]. ↓ Subscribe if this is clearer than other explanations.",
        outputLabel: "Result",
        outputValues: [1],
        queueItems: [],
      },
    },
    // ── Step 5: Left=2→col−1; Right=3→col+1; both queued ─────────────────────
    {
      startFrame: 2383,
      highlightLines: { startLine: 13, endLine: 17 },
      visibleLines: 18,
      snapshot: {
        nodes: buildNodes("n1", [], true, [], ["n2", "n3"]),
        pointers: [],
        arrows: buildEdges(["n1-n2", "n1-n3"]),
        caption: "Left 2 → col −1.  Right 3 → col +1.  Both queued.",
        outputLabel: "Result",
        outputValues: [1],
        queueItems: [
          { value: 2, highlight: "new" },
          { value: 3, highlight: "new" },
        ],
      },
    },
    // ── Step 6: Poll 2 (col−1); add to colMap[−1] ────────────────────────────
    {
      startFrame: 2745,
      highlightLines: { startLine: 8, endLine: 12 },
      visibleLines: 13,
      snapshot: {
        nodes: buildNodes("n2", ["n1"], true),
        pointers: [],
        arrows: buildEdges(),
        caption: "Poll 2 — col −1. Add to colMap[−1].",
        outputLabel: "Result",
        outputValues: [2, 1],
        queueItems: [{ value: 3 }],
      },
    },
    // ── Step 7: Left=4→col−2; Right=5→col 0; both queued ────────────────────
    {
      startFrame: 2938,
      highlightLines: { startLine: 13, endLine: 17 },
      visibleLines: 18,
      snapshot: {
        nodes: buildNodes("n2", ["n1"], true, [], ["n4", "n5"]),
        pointers: [],
        arrows: buildEdges(["n2-n4", "n2-n5"]),
        caption: "Left 4 → col −2.  Right 5 → col 0 (same as root — won't show until TreeMap is read).",
        outputLabel: "Result",
        outputValues: [2, 1],
        queueItems: [
          { value: 3 },
          { value: 4, highlight: "new" },
          { value: 5, highlight: "new" },
        ],
      },
    },
    // ── Step 8: Poll 3 (col+1); add; Right=6→col+2 ───────────────────────────
    {
      startFrame: 3365,
      highlightLines: { startLine: 8, endLine: 22 },
      visibleLines: 23,
      snapshot: {
        nodes: buildNodes("n3", ["n1", "n2"], true, [], ["n6"]),
        pointers: [],
        arrows: buildEdges(["n3-n6"]),
        caption: "Poll 3 — col +1. Add. Right 6 → col +2. ↓ Why DFS breaks — 2 steps away.",
        outputLabel: "Result",
        outputValues: [2, 1, 3],
        queueItems: [
          { value: 4 },
          { value: 5 },
          { value: 6, highlight: "new" },
        ],
      },
    },
    // ── Step 9: Poll 4 (col−2); no children ──────────────────────────────────
    {
      startFrame: 3853,
      highlightLines: { startLine: 8, endLine: 12 },
      visibleLines: 13,
      snapshot: {
        nodes: buildNodes("n4", ["n1", "n2", "n3"], true),
        pointers: [],
        arrows: buildEdges(),
        caption: "Poll 4 — col −2. Add to colMap[−2]. No children.",
        outputLabel: "Result",
        outputValues: [4, 2, 1, 3],
        queueItems: [
          { value: 5 },
          { value: 6 },
        ],
      },
    },
    // ── Step 10: Poll 5 (col 0); colMap[0]=[1,5]; Right=7→col+1 ─────────────
    {
      startFrame: 4013,
      highlightLines: { startLine: 8, endLine: 22 },
      visibleLines: 23,
      snapshot: {
        nodes: buildNodes("n5", ["n1", "n2", "n3", "n4"], true, [], ["n7"]),
        pointers: [],
        arrows: buildEdges(["n5-n7"]),
        caption: "Poll 5 — col 0. colMap[0] = [1, 5]. BFS level-order guarantees 1 before 5. DFS can't.",
        outputLabel: "Result",
        outputValues: [4, 2, 1, 5, 3],
        queueItems: [
          { value: 6 },
          { value: 7, highlight: "new" },
        ],
      },
    },
    // ── Step 11: Poll 6 (col+2); no children ─────────────────────────────────
    {
      startFrame: 4737,
      highlightLines: { startLine: 8, endLine: 12 },
      visibleLines: 13,
      snapshot: {
        nodes: buildNodes("n6", ["n1", "n2", "n3", "n4", "n5"], true),
        pointers: [],
        arrows: buildEdges(),
        caption: "Poll 6 — col +2. Add to colMap[+2]. No children.",
        outputLabel: "Result",
        outputValues: [4, 2, 1, 5, 3, 6],
        queueItems: [{ value: 7 }],
      },
    },
    // ── Step 12: Poll 7 (col+1); queue empty ─────────────────────────────────
    {
      startFrame: 4877,
      highlightLines: { startLine: 8, endLine: 12 },
      visibleLines: 13,
      snapshot: {
        nodes: buildNodes("n7", ["n1", "n2", "n3", "n4", "n5", "n6"], true),
        pointers: [],
        arrows: buildEdges(),
        caption: "Poll 7 — col +1. colMap[+1] = [3, 7]. Queue empty. ↓ Does HashMap work here?",
        outputLabel: "Result",
        outputValues: [4, 2, 1, 5, 3, 7, 6],
        queueItems: [],
      },
    },
    // ── Step 13: Return sorted columns ───────────────────────────────────────
    {
      startFrame: 5269,
      highlightLines: { startLine: 23, endLine: 25 },
      visibleLines: 26,
      snapshot: {
        nodes: buildNodes(undefined, ALL_FOUND),
        pointers: [],
        arrows: buildEdges(),
        caption: "Zero sorting code. Zero second loop. TreeMap sorted −2→+2 automatically.",
        outputLabel: "Result",
        outputValues: [4, 2, 1, 5, 3, 7, 6],
        queueItems: [],
      },
    },
    // ── Step 14: Complexity ───────────────────────────────────────────────────
    {
      excludeFromAnim: true,
      startFrame: 5823,
      highlightLines: { startLine: 0, endLine: 25 },
      visibleLines: 26,
      snapshot: {
        nodes: buildNodes(undefined, ALL_FOUND),
        pointers: [],
        arrows: buildEdges(),
        caption: "O(n log n) — each insertion costs log n in TreeMap. DFS fails: no top-to-bottom guarantee.",
        complexityInfo: { time: "O(n log n)", space: "O(n)" },
        outputLabel: "Result",
        outputValues: [4, 2, 1, 5, 3, 7, 6],
        queueItems: [],
      },
    },
  ];
}

function makePositionMap(format: "youtube" | "reel" | "reel-anim"): Record<string, { x: number; y: number }> {
  if (format === "reel-anim") {
    return {
      n1: { x: 0.48, y: 0.11 },
      n2: { x: 0.30, y: 0.28 },
      n3: { x: 0.64, y: 0.28 },
      n4: { x: 0.14, y: 0.47 },
      n5: { x: 0.48, y: 0.47 },
      n6: { x: 0.82, y: 0.47 },
      n7: { x: 0.64, y: 0.63 },
    };
  }
  return format === "reel"
    ? {
        n1: { x: 0.48, y: 0.13 },
        n2: { x: 0.30, y: 0.31 },
        n3: { x: 0.64, y: 0.31 },
        n4: { x: 0.14, y: 0.49 },
        n5: { x: 0.48, y: 0.49 },
        n6: { x: 0.82, y: 0.49 },
        n7: { x: 0.64, y: 0.67 },
      }
    : {
        n1: { x: 0.48, y: 0.10 },
        n2: { x: 0.30, y: 0.27 },
        n3: { x: 0.64, y: 0.27 },
        n4: { x: 0.14, y: 0.46 },
        n5: { x: 0.48, y: 0.46 },
        n6: { x: 0.82, y: 0.46 },
        n7: { x: 0.64, y: 0.64 },
      };
}

export interface VerticalOrderTraversalProps {
  tokens: ThemedToken[][];
  format?: "youtube" | "reel" | "reel-anim";
}

const ColumnIndicators: React.FC<{
  areaW: number;
  areaH: number;
  format: "youtube" | "reel";
  localFrame: number;
}> = ({ areaW, areaH, format, localFrame }) => {
  const { fps } = useVideoConfig();
  const p = spring({ frame: localFrame, fps, config: { damping: 20, stiffness: 90 } });
  const opacity = interpolate(p, [0, 1], [0, 1], { extrapolateRight: "clamp" });
  const nodeR = format === "reel" ? 31 : 38;
  const pillH = 28;
  const pillGap = 8;

  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: areaW,
        height: areaH,
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {COLUMN_GROUPS.map(({ label, xFrac, color, topY, botY }) => {
        const cx = xFrac * areaW;
        const lineStart = topY[format] * areaH - nodeR;
        const lineEnd   = botY[format] * areaH + nodeR;
        const pillTop   = lineStart - pillGap - pillH;
        return (
          <g key={label} opacity={opacity}>
            <line
              x1={cx} y1={lineStart}
              x2={cx} y2={lineEnd}
              stroke={color}
              strokeWidth={4}
              strokeDasharray="3 12"
              strokeOpacity={0.55}
            />
            <rect
              x={cx - 24} y={pillTop}
              width={48} height={pillH}
              rx={6}
              fill={`${color}18`}
              stroke={`${color}55`}
              strokeWidth={1}
            />
            <text
              x={cx} y={pillTop + 20}
              textAnchor="middle"
              fill={color}
              fontSize={17}
              fontWeight={700}
              fontFamily="monospace"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
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

export const VerticalOrderTraversal: React.FC<VerticalOrderTraversalProps> = ({
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
  const { current, localFrame, stepIndex } = useStepTransition(steps);
  const complexityInfo = current.snapshot.complexityInfo;
  const treeTransition = stepIndex >= steps.length - 3 ? "blob" : "flip";

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
      {(stepIndex === 0 || stepIndex === 13) && !isAnim && (
        <ColumnIndicators
          areaW={diagramAreaW}
          areaH={diagramAreaH}
          format={isReelOnly ? "reel" : "youtube"}
          localFrame={localFrame}
        />
      )}
      <TreeDiagram
        steps={steps}
        positionMap={makePositionMap(format)}
        areaWidth={diagramAreaW}
        areaHeight={diagramAreaH}
        nodeScale={nodeScale}
        ringNodeIds={[]}
        transitionStyle={treeTransition}
      />
      <QueueVisualization
        steps={steps}
        itemSize={isAnim ? 72 : isReel ? 60 : 70}
        style={{
          position: "absolute",
          bottom: isAnim ? 14 : isReelOnly ? 16 : 48,
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
        fontSize={isReel ? 16 : 20}
        lineHeight={isReel ? 1.5 : 1.75}
        padding={isReel ? 20 : 20}
        centered={isReel}
        centerWidth={isReel ? safeW : undefined}
        autoScroll={isReel}
        containerHeight={isReel ? Math.round(safeH * (1 - REEL_TOP_RATIO) - 56) : height - 58}
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
      {!isAnim && <NarrationLayer sceneId="vertical-order" steps={steps} />}
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
