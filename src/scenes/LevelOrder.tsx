import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
import type { ThemedToken } from "shiki";
import type { ArrowData, ListNodeData, SceneStep } from "../lib/types";
import { useStepTransition } from "../lib/useStepTransition";
import { colors, fonts, springPresets } from "../lib/theme";
import { AmbientLayer } from "../components/AmbientLayer";
import { compressStepsForAnim } from "../lib/animSteps";
import { CodeBlock } from "../components/CodeBlock";
import { CodeWindow } from "../components/CodeWindow";
import { NarrationLayer } from "../components/NarrationLayer";
import { SfxLayer } from "../components/SfxLayer";
import { SplitLayout } from "../components/SplitLayout";
import { StackedLayout, type SafeArea } from "../components/StackedLayout";
import { AnimationOnlyLayout, ANIM_DIAGRAM_HEIGHT } from "../components/AnimationOnlyLayout";
import { TreeDiagram } from "../components/TreeDiagram";
import { QueueVisualization } from "../components/QueueVisualization";

const REEL_SAFE: SafeArea = { top: 150, bottom: 380, left: 90, right: 130 };
const REEL_TOP_RATIO = 0.52;

export const LEVEL_ORDER_SCENE_FRAMES = 2400;

// ── Tree structure ────────────────────────────────────────────────────────────
// 7-node complete binary tree: n1(1) root, n2(2)/n3(3) level-1, n4-n7(4-7) level-2

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

// ── Steps ─────────────────────────────────────────────────────────────────────

function makeSteps(): SceneStep[] {
  const F1  = ["n1"];
  const F12 = ["n1", "n2"];
  const F123 = ["n1", "n2", "n3"];
  const F1234 = ["n1", "n2", "n3", "n4"];
  const F12345 = ["n1", "n2", "n3", "n4", "n5"];
  const F123456 = ["n1", "n2", "n3", "n4", "n5", "n6"];
  const FALL = ["n1", "n2", "n3", "n4", "n5", "n6", "n7"];

  return [
    // Step 0 — Hook: full tree, no highlights
    {
      startFrame: 0,
      highlightLines: { startLine: 0, endLine: 0 },
      snapshot: {
        nodes: buildNodes(),
        pointers: [],
        arrows: buildEdges(),
        caption: "Level Order — visit every node row by row",
        queueItems: [],
        outputValues: [],
        outputLabel: "Level Order",
      },
    },
    // Step 1 — Null check
    {
      startFrame: 150,
      highlightLines: { startLine: 2, endLine: 2 },
      snapshot: {
        nodes: buildNodes(),
        pointers: [],
        arrows: buildEdges(),
        caption: "root == null? No — continue",
        queueItems: [],
        outputValues: [],
        outputLabel: "Level Order",
      },
    },
    // Step 2 — Init queue, offer root
    {
      startFrame: 300,
      highlightLines: { startLine: 3, endLine: 4 },
      snapshot: {
        nodes: buildNodes([], [], ["n1"]),
        pointers: [],
        arrows: buildEdges(),
        caption: "Init queue, offer root",
        queueItems: [{ value: 1, highlight: "new" }],
        outputValues: [],
        outputLabel: "Level Order",
      },
    },
    // Step 3 — While loop check (queue non-empty)
    {
      startFrame: 450,
      highlightLines: { startLine: 5, endLine: 5 },
      snapshot: {
        nodes: buildNodes(["n1"]),
        pointers: [],
        arrows: buildEdges(),
        caption: "Queue not empty — enter loop",
        queueItems: [{ value: 1, highlight: "active" }],
        outputValues: [],
        outputLabel: "Level Order",
      },
    },
    // Step 4 — Poll n1, add to result
    {
      startFrame: 600,
      highlightLines: { startLine: 6, endLine: 7 },
      snapshot: {
        nodes: buildNodes([], F1),
        pointers: [],
        arrows: buildEdges(),
        caption: "Poll 1, add to result",
        queueItems: [],
        outputValues: [1],
        outputLabel: "Level Order",
      },
    },
    // Step 5 — Offer n2, n3
    {
      startFrame: 750,
      highlightLines: { startLine: 8, endLine: 9 },
      snapshot: {
        nodes: buildNodes([], F1, ["n2", "n3"]),
        pointers: [],
        arrows: buildEdges(["n1-n2", "n1-n3"]),
        caption: "Offer n2 and n3",
        queueItems: [{ value: 2, highlight: "new" }, { value: 3, highlight: "new" }],
        outputValues: [1],
        outputLabel: "Level Order",
      },
    },
    // Step 6 — Poll n2, add to result
    {
      startFrame: 900,
      highlightLines: { startLine: 6, endLine: 7 },
      snapshot: {
        nodes: buildNodes([], F12),
        pointers: [],
        arrows: buildEdges(),
        caption: "Poll 2, add to result",
        queueItems: [{ value: 3, highlight: "none" }],
        outputValues: [1, 2],
        outputLabel: "Level Order",
      },
    },
    // Step 7 — Offer n4, n5
    {
      startFrame: 1050,
      highlightLines: { startLine: 8, endLine: 9 },
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
        outputValues: [1, 2],
        outputLabel: "Level Order",
      },
    },
    // Step 8 — Poll n3, add to result
    {
      startFrame: 1200,
      highlightLines: { startLine: 6, endLine: 7 },
      snapshot: {
        nodes: buildNodes([], F123),
        pointers: [],
        arrows: buildEdges(),
        caption: "Poll 3, add to result",
        queueItems: [
          { value: 4, highlight: "none" },
          { value: 5, highlight: "none" },
        ],
        outputValues: [1, 2, 3],
        outputLabel: "Level Order",
      },
    },
    // Step 9 — Offer n6, n7
    {
      startFrame: 1350,
      highlightLines: { startLine: 8, endLine: 9 },
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
        outputValues: [1, 2, 3],
        outputLabel: "Level Order",
      },
    },
    // Step 10 — Poll n4, add (leaf)
    {
      startFrame: 1500,
      highlightLines: { startLine: 6, endLine: 9 },
      snapshot: {
        nodes: buildNodes([], F1234),
        pointers: [],
        arrows: buildEdges(),
        caption: "Poll 4 — leaf, nothing to offer",
        queueItems: [
          { value: 5, highlight: "none" },
          { value: 6, highlight: "none" },
          { value: 7, highlight: "none" },
        ],
        outputValues: [1, 2, 3, 4],
        outputLabel: "Level Order",
      },
    },
    // Step 11 — Poll n5, add (leaf)
    {
      startFrame: 1650,
      highlightLines: { startLine: 6, endLine: 9 },
      snapshot: {
        nodes: buildNodes([], F12345),
        pointers: [],
        arrows: buildEdges(),
        caption: "Poll 5 — leaf",
        queueItems: [
          { value: 6, highlight: "none" },
          { value: 7, highlight: "none" },
        ],
        outputValues: [1, 2, 3, 4, 5],
        outputLabel: "Level Order",
      },
    },
    // Step 12 — Poll n6, add (leaf)
    {
      startFrame: 1800,
      highlightLines: { startLine: 6, endLine: 9 },
      snapshot: {
        nodes: buildNodes([], F123456),
        pointers: [],
        arrows: buildEdges(),
        caption: "Poll 6 — leaf",
        queueItems: [{ value: 7, highlight: "none" }],
        outputValues: [1, 2, 3, 4, 5, 6],
        outputLabel: "Level Order",
      },
    },
    // Step 13 — Poll n7, add (leaf), queue empty
    {
      startFrame: 1950,
      highlightLines: { startLine: 6, endLine: 9 },
      snapshot: {
        nodes: buildNodes([], FALL),
        pointers: [],
        arrows: buildEdges(),
        caption: "Poll 7 — queue drains",
        queueItems: [],
        outputValues: [1, 2, 3, 4, 5, 6, 7],
        outputLabel: "Level Order",
      },
    },
    // Step 14 — Loop exits
    {
      startFrame: 2100,
      highlightLines: { startLine: 5, endLine: 5 },
      snapshot: {
        nodes: buildNodes([], FALL),
        pointers: [],
        arrows: buildEdges(),
        caption: "Queue empty — exit while",
        queueItems: [],
        outputValues: [1, 2, 3, 4, 5, 6, 7],
        outputLabel: "Level Order",
      },
    },
    // Step 15 — Return + complexity
    {
      startFrame: 2250,
      highlightLines: { startLine: 11, endLine: 11 },
      snapshot: {
        nodes: buildNodes([], FALL),
        pointers: [],
        arrows: buildEdges(),
        caption: "Level order complete",
        queueItems: [],
        outputValues: [1, 2, 3, 4, 5, 6, 7],
        outputLabel: "Level Order",
        complexityInfo: { time: "O(n)", space: "O(n)" },
      },
    },
  ];
}

// ── Position maps ─────────────────────────────────────────────────────────────

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
    // Queue + Output moved to code panel → full diagram height available for the tree
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
  // reel-anim — queue/output still inside diagram, keep leaves higher
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

// ── OutputDisplay ─────────────────────────────────────────────────────────────

const OutputDisplay: React.FC<{
  steps: SceneStep[];
  style: React.CSSProperties;
  circleSize?: number;
}> = ({ steps, style, circleSize = 34 }) => {
  const { fps } = useVideoConfig();
  const { current, previous, t, localFrame } = useStepTransition(steps);

  const currVals = current.snapshot.outputValues ?? [];
  const prevVals = previous.snapshot.outputValues ?? [];
  const prevValSet = new Set(prevVals.map((_, i) => i));

  const isComplexity = !!current.snapshot.complexityInfo;
  const hideT = isComplexity
    ? interpolate(t, [0, 0.4], [1, 0], { extrapolateRight: "clamp" })
    : 1;

  if (currVals.length === 0) return null;

  return (
    <div
      style={{
        ...style,
        opacity: hideT,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      {/* Label */}
      <span
        style={{
          fontFamily:    fonts.sans,
          fontSize:      13,
          fontWeight:    700,
          letterSpacing: 1.4,
          textTransform: "uppercase" as const,
          color:         colors.teal,
          textShadow:    `0 0 14px ${colors.teal}88`,
          whiteSpace:    "nowrap" as const,
        }}
      >
        Level Order
      </span>

      {/* Circles pill */}
      <div
        style={{
          display:      "flex",
          gap:          6,
          alignItems:   "center",
          flexWrap:     "wrap" as const,
          background:   `${colors.teal}12`,
          border:       `1px solid ${colors.teal}55`,
          borderRadius: 14,
          padding:      "8px 14px",
          boxShadow:    `0 0 20px ${colors.teal}18`,
        }}
      >
        {currVals.map((val, i) => {
          const isNew = i >= prevVals.length;
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
                background:     colors.teal,
                border:         `2px solid ${colors.teal}`,
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                transform:      `scale(${popScale})`,
                opacity:        popOpacity,
                boxShadow:      glowStr > 0.05
                  ? `0 0 ${Math.round(18 * glowStr)}px ${colors.teal}, 0 0 6px ${colors.teal}99`
                  : `0 0 8px ${colors.teal}66`,
              }}
            >
              <span
                style={{
                  fontFamily: fonts.mono,
                  fontSize:   Math.round(circleSize * 0.40),
                  fontWeight: 800,
                  color:      "#0a0a12",
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

export interface LevelOrderProps {
  tokens: ThemedToken[][];
  format?: "youtube" | "reel" | "reel-anim";
}

export const LevelOrder: React.FC<LevelOrderProps> = ({ tokens, format = "youtube" }) => {
  const { width, height } = useVideoConfig();
  const isReel = format === "reel" || format === "reel-anim";
  const isAnim = format === "reel-anim";
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
      <TreeDiagram
        steps={steps}
        positionMap={makePositionMap(format)}
        areaWidth={diagramAreaW}
        areaHeight={diagramAreaH}
        nodeScale={nodeScale}
      />
      {/* Queue + Output inside diagram only for youtube and reel-anim */}
      {!isReelOnly && (
        <div
          style={{
            position:       "absolute",
            bottom:         isAnim ? 30 : 50,
            left:           0,
            right:          0,
            display:        "flex",
            flexDirection:  "column",
            alignItems:     "center",
            gap:            16,
            zIndex:         5,
          }}
        >
          <QueueVisualization
            steps={steps}
            itemSize={isAnim ? 44 : 52}
          />
          <OutputDisplay
            steps={steps}
            circleSize={isAnim ? 42 : 50}
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
      />
    </CodeWindow>
  );

  // For reel: wrap code + a Queue/Output row below it in the code panel
  const reelBottom = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {code}
      <div
        style={{
          display:        "flex",
          gap:            32,
          justifyContent: "center",
          alignItems:     "flex-start",
          paddingTop:     28,
          flexShrink:     0,
        }}
      >
        <QueueVisualization steps={steps} itemSize={42} />
        <OutputDisplay
          steps={steps}
          circleSize={32}
          style={{ position: "relative" }}
        />
      </div>
    </div>
  );

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
      {!isAnim && <NarrationLayer sceneId="level-order" steps={steps} />}
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
