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

export const DIAGONAL_SCENE_FRAMES = 6791;

const BASE_EDGES: ArrowData[] = [
  { from: "n1", to: "n2" },
  { from: "n1", to: "n3" },
  { from: "n2", to: "n4" },
  { from: "n2", to: "n5" },
  { from: "n3", to: "n6" },
  { from: "n5", to: "n7" },
  { from: "n5", to: "n8" },
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
            ? ("visited" as any)
            : newIds.includes(node.id)
              ? ("new" as any)
              : "none",
  }));
}

// Right-chain edges that define each diagonal group
const D0_EDGES = ["n1-n3", "n3-n6"];
const D1_EDGES = ["n2-n5", "n5-n8"];
const D0_COLOR = "#6EE7A0"; // green — diagonal 0 done
const D1_COLOR = "#FFD666"; // yellow — diagonal 1 done

// doneDiagonals: 0 = none done, 1 = D0 done, 2 = D0+D1 done
function buildEdges(highlighted: string[] = [], doneDiagonals: 0 | 1 | 2 = 0): ArrowData[] {
  return BASE_EDGES.map((edge) => {
    const key = `${edge.from}-${edge.to}`;
    const d0done = doneDiagonals >= 1 && D0_EDGES.includes(key);
    const d1done = doneDiagonals >= 2 && D1_EDGES.includes(key);
    return {
      ...edge,
      highlight: highlighted.includes(key),
      dashed: d0done || d1done,
      color: d0done ? D0_COLOR : d1done ? D1_COLOR : undefined,
    };
  });
}

// Diagonal groupings
const D0  = ["n1", "n3", "n6"];
const D01 = ["n1", "n3", "n6", "n2", "n5", "n8"];

// Which diagonal is active at each step index
const DIAGONAL_PHASE: Record<number, { label: string; color: string }> = {
  6:  { label: "Diagonal 0", color: "#6EE7A0" },
  7:  { label: "Diagonal 0", color: "#6EE7A0" },
  8:  { label: "Diagonal 0", color: "#6EE7A0" },
  10: { label: "Diagonal 1", color: "#FFD666" },
  11: { label: "Diagonal 1", color: "#FFD666" },
  13: { label: "Diagonal 2", color: "#6E9BFF" },
  14: { label: "Diagonal 2", color: "#6E9BFF" },
};

// Diagonal group arrows shown at the end — same as the intro step 0
const DIAGONAL_RESULT_ARROWS: ArrowData[] = [
  { from: "n1", to: "n3", dashed: true, color: "#6EE7A0" },
  { from: "n3", to: "n6", dashed: true, color: "#6EE7A0" },
  { from: "n2", to: "n5", dashed: true, color: "#FFD666" },
  { from: "n5", to: "n8", dashed: true, color: "#FFD666" },
  { from: "n4", to: "n7", dashed: true, color: "#6E9BFF" },
];

const DiagonalPhaseLabel: React.FC<{
  stepIndex:  number;
  localFrame: number;
}> = ({ stepIndex, localFrame }) => {
  const { fps } = useVideoConfig();
  const phase = DIAGONAL_PHASE[stepIndex];
  if (!phase) return null;

  const p       = spring({ frame: localFrame, fps, config: { damping: 18, stiffness: 110, mass: 0.8 } });
  const opacity = interpolate(p, [0, 0.35], [0, 1], { extrapolateRight: "clamp" });
  const ty      = interpolate(p, [0, 1], [-10, 0]);

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

function makeSteps(): SceneStep[] {
  return [
    // ── Step 0: Output preview — dotted diagonal group lines ──────────────────
    {
      excludeFromAnim: true,
      startFrame: 0,
      highlightLines: { startLine: 0, endLine: 0 },
      visibleLines: 1,
      snapshot: {
        nodes: buildNodes(),
        pointers: [],
        arrows: [
          // Diagonal 0 — green
          { from: "n1", to: "n3", dashed: true, color: "#6EE7A0" },
          { from: "n3", to: "n6", dashed: true, color: "#6EE7A0" },
          // Diagonal 1 — yellow
          { from: "n2", to: "n5", dashed: true, color: "#FFD666" },
          { from: "n5", to: "n8", dashed: true, color: "#FFD666" },
          // Diagonal 2 — blue
          { from: "n4", to: "n7", dashed: true, color: "#6E9BFF" },
        ],
        caption: "Goal: 3 diagonals — [1, 3, 6]  [2, 5, 8]  [4, 7]",
        outputLabel: "Result",
        outputValues: [1, 3, 6, 2, 5, 8, 4, 7],
        queueItems: [],
      },
    },
    // ── Step 1: Intuition hook ─────────────────────────────────────────────────
    {
      excludeFromAnim: true,
      startFrame: 605,
      highlightLines: { startLine: 0, endLine: 0 },
      visibleLines: 1,
      snapshot: {
        nodes: buildNodes(),
        pointers: [],
        arrows: buildEdges(),
        caption: "Diagonal traversal — nodes only reachable by going right share the same diagonal",
        outputLabel: "Result",
        outputValues: [],
        queueItems: [],
      },
    },
    // ── Step 2: Null check ─────────────────────────────────────────────────────
    {
      startFrame: 1047,
      highlightLines: { startLine: 1, endLine: 1 },
      visibleLines: 2,
      snapshot: {
        nodes: buildNodes(),
        pointers: [],
        arrows: buildEdges(),
        caption: "Guard: null root → return empty list",
        outputLabel: "Result",
        outputValues: [],
        queueItems: [],
      },
    },
    // ── Step 3: Init result + queue, add root ─────────────────────────────────
    {
      startFrame: 1263,
      highlightLines: { startLine: 2, endLine: 4 },
      visibleLines: 5,
      snapshot: {
        nodes: buildNodes("n1"),
        pointers: [],
        arrows: buildEdges(),
        caption: "Init result and queue; seed with root",
        outputLabel: "Result",
        outputValues: [],
        queueItems: [{ value: 1, highlight: "new" }],
      },
    },
    // ── Step 4: Outer while — diagonal 0 ──────────────────────────────────────
    {
      startFrame: 1555,
      highlightLines: { startLine: 5, endLine: 6 },
      visibleLines: 7,
      snapshot: {
        nodes: buildNodes("n1"),
        pointers: [],
        arrows: buildEdges(),
        caption: "Outer while: queue not empty → start diagonal 0",
        outputLabel: "Result",
        outputValues: [],
        queueItems: [{ value: 1, highlight: "active" }],
      },
    },
    // ── Step 5: Init row and nextQ ─────────────────────────────────────────────
    {
      startFrame: 2008,
      highlightLines: { startLine: 7, endLine: 8 },
      visibleLines: 9,
      snapshot: {
        nodes: buildNodes("n1"),
        pointers: [],
        arrows: buildEdges(),
        caption: "row = [] and nextQ = [] for this diagonal",
        outputLabel: "Result",
        outputValues: [],
        queueItems: [{ value: 1 }],
      },
    },
    // ── Step 6: Poll 1; add to row; left child 2 → nextQ ──────────────────────
    {
      startFrame: 2512,
      highlightLines: { startLine: 9, endLine: 15 },
      visibleLines: 16,
      snapshot: {
        nodes: buildNodes("n1", [], true, [], ["n2"]),
        pointers: [],
        arrows: buildEdges(["n1-n2"]),
        caption: "Poll 1; add to row. Left=2 → nextQ",
        outputLabel: "Result",
        outputValues: [1],
        queueItems: [{ value: 1, highlight: "active" }],
        nextQItems: [{ value: 2, highlight: "new" }],
      },
    },
    // ── Step 7: Arrive at 3; add to row; no left child ────────────────────────
    {
      startFrame: 2918,
      highlightLines: { startLine: 11, endLine: 17 },
      visibleLines: 18,
      snapshot: {
        nodes: buildNodes("n3", ["n1"], true),
        pointers: [],
        arrows: buildEdges(["n1-n3"]),
        caption: "Right → 3 (same diagonal). Add 3. No left child.",
        outputLabel: "Result",
        outputValues: [1, 3],
        queueItems: [],
        nextQItems: [{ value: 2 }],
      },
    },
    // ── Step 8: Add 3 to row; no left child; right → 6; diagonal 0 done ───────
    {
      startFrame: 3215,
      highlightLines: { startLine: 11, endLine: 17 },
      visibleLines: 18,
      snapshot: {
        nodes: buildNodes("n6", ["n1", "n3"], true),
        pointers: [],
        arrows: buildEdges(["n3-n6"]),
        caption: "Right of 3 → 6. Add 6. No children. Diagonal 0 = [1, 3, 6]",
        outputLabel: "Result",
        outputValues: [1, 3, 6],
        queueItems: [],
        nextQItems: [{ value: 2 }],
      },
    },
    // ── Step 9: result.add([1,3,6]); q ← nextQ = [2] ─────────────────────────
    {
      startFrame: 3579,
      highlightLines: { startLine: 20, endLine: 22 },
      visibleLines: 23,
      snapshot: {
        nodes: buildNodes(undefined, [], false, D0),
        pointers: [],
        arrows: buildEdges([], 1),
        caption: "result.add([1,3,6]). Queue ← nextQ = [2]",
        outputLabel: "Result",
        outputValues: [1, 3, 6],
        queueItems: [{ value: 2, highlight: "new" }],
      },
    },
    // ── Step 10: Outer while; poll 2; start diagonal 1 ────────────────────────
    {
      startFrame: 3991,
      highlightLines: { startLine: 5, endLine: 10 },
      visibleLines: 11,
      snapshot: {
        nodes: buildNodes("n2", [], false, D0),
        pointers: [],
        arrows: buildEdges([], 1),
        caption: "Start diagonal 1 — poll node 2",
        outputLabel: "Result",
        outputValues: [1, 3, 6],
        queueItems: [{ value: 2, highlight: "active" }],
      },
    },
    // ── Step 11: Add 2; left=4→nextQ; right→5; right→8; diagonal 1 done ───────
    {
      startFrame: 4243,
      highlightLines: { startLine: 11, endLine: 17 },
      visibleLines: 18,
      snapshot: {
        nodes: buildNodes("n8", ["n2", "n5"], true, D0, ["n4", "n7"]),
        pointers: [],
        arrows: buildEdges(["n2-n4", "n5-n7", "n5-n8"], 1),
        caption: "Add 2→5→8. Left children 4,7 → nextQ. Diagonal 1 = [2, 5, 8]",
        outputLabel: "Result",
        outputValues: [1, 3, 6, 2, 5, 8],
        queueItems: [],
        nextQItems: [{ value: 4, highlight: "new" }, { value: 7, highlight: "new" }],
      },
    },
    // ── Step 12: result.add([2,5,8]); q←[4,7] ────────────────────────────────
    {
      startFrame: 4642,
      highlightLines: { startLine: 20, endLine: 22 },
      visibleLines: 23,
      snapshot: {
        nodes: buildNodes(undefined, [], false, D01),
        pointers: [],
        arrows: buildEdges([], 2),
        caption: "Diagonal 1=[2,5,8] done. result.add(row). Queue←nextQ=[4,7]",
        outputLabel: "Result",
        outputValues: [1, 3, 6, 2, 5, 8],
        queueItems: [
          { value: 4, highlight: "new" },
          { value: 7, highlight: "new" },
        ],
      },
    },
    // ── Step 13: Diagonal 2 — poll 4; no right child ─────────────────────────
    {
      startFrame: 5236,
      highlightLines: { startLine: 9, endLine: 12 },
      visibleLines: 13,
      snapshot: {
        nodes: buildNodes("n4", [], true, D01),
        pointers: [],
        arrows: buildEdges([], 2),
        caption: "Diagonal 2: poll 4, no right child",
        outputLabel: "Result",
        outputValues: [1, 3, 6, 2, 5, 8, 4],
        queueItems: [{ value: 4, highlight: "active" }, { value: 7 }],
      },
    },
    // ── Step 14: Poll 7; no right child; queue empty ──────────────────────────
    {
      startFrame: 5408,
      highlightLines: { startLine: 9, endLine: 12 },
      visibleLines: 13,
      snapshot: {
        nodes: buildNodes("n7", ["n4"], true, D01),
        pointers: [],
        arrows: buildEdges([], 2),
        caption: "Poll 7, no right child. Diagonal 2=[4,7]. Queue empty.",
        outputLabel: "Result",
        outputValues: [1, 3, 6, 2, 5, 8, 4, 7],
        queueItems: [{ value: 7, highlight: "active" }],
      },
    },
    // ── Step 15: Return result ─────────────────────────────────────────────────
    {
      startFrame: 5679,
      highlightLines: { startLine: 23, endLine: 25 },
      visibleLines: 26,
      snapshot: {
        nodes: buildNodes(undefined, ["n1", "n2", "n3", "n4", "n5", "n6", "n7", "n8"]),
        pointers: [],
        arrows: DIAGONAL_RESULT_ARROWS,
        caption: "Queue empty — return result",
        outputLabel: "Result",
        outputValues: [1, 3, 6, 2, 5, 8, 4, 7],
        queueItems: [],
      },
    },
    // ── Step 16: Callback payoff ───────────────────────────────────────────────
    {
      excludeFromAnim: true,
      startFrame: 5894,
      highlightLines: { startLine: 0, endLine: 25 },
      visibleLines: 26,
      snapshot: {
        nodes: buildNodes(undefined, ["n1", "n2", "n3", "n4", "n5", "n6", "n7", "n8"]),
        pointers: [],
        arrows: DIAGONAL_RESULT_ARROWS,
        caption: "Every right move stayed on a diagonal. Every left move opened the next one.",
        outputLabel: "Result",
        outputValues: [1, 3, 6, 2, 5, 8, 4, 7],
        queueItems: [],
      },
    },
    // ── Step 17: Complexity ────────────────────────────────────────────────────
    {
      excludeFromAnim: true,
      startFrame: 6212,
      highlightLines: { startLine: 0, endLine: 25 },
      visibleLines: 26,
      snapshot: {
        nodes: buildNodes(undefined, ["n1", "n2", "n3", "n4", "n5", "n6", "n7", "n8"]),
        pointers: [],
        arrows: DIAGONAL_RESULT_ARROWS,
        caption: "O(n) time — every node visited exactly once",
        complexityInfo: { time: "O(n)", space: "O(n)" },
        outputLabel: "Result",
        outputValues: [1, 3, 6, 2, 5, 8, 4, 7],
        queueItems: [],
      },
    },
  ];
}

function makePositionMap(format: "youtube" | "reel" | "reel-anim"): Record<string, { x: number; y: number }> {
  if (format === "reel-anim") {
    return {
      n1: { x: 0.50, y: 0.16 },
      n2: { x: 0.30, y: 0.33 },
      n3: { x: 0.70, y: 0.33 },
      n4: { x: 0.16, y: 0.50 },
      n5: { x: 0.44, y: 0.50 },
      n6: { x: 0.78, y: 0.50 },
      n7: { x: 0.34, y: 0.67 },
      n8: { x: 0.54, y: 0.67 },
    };
  }
  return format === "reel"
    ? {
        n1: { x: 0.50, y: 0.20 },
        n2: { x: 0.30, y: 0.37 },
        n3: { x: 0.70, y: 0.37 },
        n4: { x: 0.16, y: 0.54 },
        n5: { x: 0.44, y: 0.54 },
        n6: { x: 0.78, y: 0.54 },
        n7: { x: 0.34, y: 0.72 },
        n8: { x: 0.54, y: 0.72 },
      }
    : {
        n1: { x: 0.48, y: 0.12 },
        n2: { x: 0.28, y: 0.28 },
        n3: { x: 0.72, y: 0.28 },
        n4: { x: 0.14, y: 0.46 },
        n5: { x: 0.42, y: 0.46 },
        n6: { x: 0.80, y: 0.46 },
        n7: { x: 0.32, y: 0.63 },
        n8: { x: 0.52, y: 0.63 },
      };
}

export interface DiagonalTraversalProps {
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

export const DiagonalTraversal: React.FC<DiagonalTraversalProps> = ({
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
          bottom: isAnim ? 24 : isReelOnly ? 32 : 110,
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
        fontSize={isReel ? 18 : 24}
        lineHeight={isReel ? 1.55 : 1.85}
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
      {!isAnim && <NarrationLayer sceneId="diagonal-traversal" steps={steps} />}
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
