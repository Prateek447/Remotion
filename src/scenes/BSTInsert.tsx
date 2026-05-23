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

const REEL_SAFE: SafeArea = { top: 150, bottom: 380, left: 90, right: 130 };
const REEL_TOP_RATIO = 0.60;

export const BST_INSERT_SCENE_FRAMES = 5538;

// ── Base tree: 50(root), 30(left), 70(right), 20(30's left), 40(30's right) ──

const BST_BASE_EDGES: ArrowData[] = [
  { from: "n50", to: "n30" },
  { from: "n50", to: "n70" },
  { from: "n30", to: "n20" },
  { from: "n30", to: "n40" },
];

function makeBSTNodes(
  activeId?: string,
  foundIds: string[] = [],
  includeN35 = false,
  n35Highlight: "new" | "found" | "none" = "none",
): ListNodeData[] {
  const nodes: ListNodeData[] = [
    {
      id: "n50",
      value: 50,
      highlight: activeId === "n50" ? "active" : foundIds.includes("n50") ? "found" : "none",
    },
    {
      id: "n30",
      value: 30,
      highlight: activeId === "n30" ? "active" : foundIds.includes("n30") ? "found" : "none",
    },
    { id: "n70", value: 70, highlight: "none" },
    { id: "n20", value: 20, highlight: "none" },
    {
      id: "n40",
      value: 40,
      highlight: activeId === "n40" ? "active" : foundIds.includes("n40") ? "found" : "none",
    },
  ];
  if (includeN35) {
    nodes.push({ id: "n35", value: 35, highlight: n35Highlight });
  }
  return nodes;
}

function makeBSTEdges(highlighted: string[] = [], includeN35Edge = false): ArrowData[] {
  const edges = BST_BASE_EDGES.map((e) => ({
    ...e,
    highlight: highlighted.includes(`${e.from}-${e.to}`),
  }));
  if (includeN35Edge) {
    edges.push({ from: "n40", to: "n35", highlight: highlighted.includes("n40-n35") });
  }
  return edges;
}

// ── Empty-tree phase helper ────────────────────────────────────────────────────

function singleNode(id: string, value: number, highlight: "new" | "found"): ListNodeData[] {
  return [{ id, value, highlight }];
}

// ── Steps ─────────────────────────────────────────────────────────────────────

function makeSteps(): SceneStep[] {
  return [
    // ════ Phase 1: Normal Insert — 35 into BST ════════════════════════════════

    // Step 0 ─ Hook + Intro: show full BST
    {
      startFrame: 0,
      highlightLines: { startLine: 0, endLine: 0 },
      visibleLines: 1,
      snapshot: {
        nodes: makeBSTNodes(),
        pointers: [],
        arrows: makeBSTEdges(),
        caption: "BST Insert — left or right, one decision at a time",
      },
    },
    // Step 1 ─ insertRec(50, 35): null check
    {
      startFrame: 831,
      highlightLines: { startLine: 4, endLine: 5 },
      visibleLines: 7,
      snapshot: {
        nodes: makeBSTNodes("n50"),
        pointers: [],
        arrows: makeBSTEdges(),
        caption: "insertRec(50, 35) — is 50 null? No. Compare.",
      },
    },
    // Step 2 ─ 35 < 50: recurse left to 30
    {
      startFrame: 1141,
      highlightLines: { startLine: 8, endLine: 8 },
      visibleLines: 9,
      snapshot: {
        nodes: makeBSTNodes("n30"),
        pointers: [],
        arrows: makeBSTEdges(["n50-n30"]),
        caption: "35 < 50 → move left to node 30",
      },
    },
    // Step 3 ─ 35 > 30: recurse right to 40
    {
      startFrame: 1430,
      highlightLines: { startLine: 10, endLine: 10 },
      visibleLines: 11,
      snapshot: {
        nodes: makeBSTNodes("n40"),
        pointers: [],
        arrows: makeBSTEdges(["n30-n40"]),
        caption: "35 > 30 → move right to node 40",
      },
    },
    // Step 4 ─ 35 < 40: go left, 40 has no left child
    {
      startFrame: 1645,
      highlightLines: { startLine: 8, endLine: 8 },
      visibleLines: 11,
      snapshot: {
        nodes: makeBSTNodes("n40"),
        pointers: [],
        arrows: makeBSTEdges(),
        caption: "35 < 40 → go left — 40.left is null",
      },
    },
    // Step 5 ─ node == null: create Node(35)
    {
      startFrame: 1885,
      highlightLines: { startLine: 5, endLine: 6 },
      visibleLines: 13,
      snapshot: {
        nodes: makeBSTNodes(undefined, [], true, "new"),
        pointers: [],
        arrows: makeBSTEdges([], true),
        caption: "null — base case. New Node(35) created and returned.",
      },
    },
    // Step 6 ─ 35 linked as 40's left child via return phase
    {
      startFrame: 2219,
      highlightLines: { startLine: 11, endLine: 11 },
      visibleLines: 13,
      snapshot: {
        nodes: makeBSTNodes(undefined, ["n35"], true, "found"),
        pointers: [],
        arrows: makeBSTEdges(["n40-n35"], true),
        caption: "Returned node attached to 40's left — recursion linked it",
      },
    },

    // ════ Phase 2: Edge Case — Empty Tree ═════════════════════════════════════

    // Step 7 ─ empty tree: no nodes, no edges
    {
      startFrame: 2772,
      highlightLines: { startLine: 0, endLine: 1 },
      visibleLines: 3,
      snapshot: {
        nodes: [],
        pointers: [],
        arrows: [],
        caption: "Empty tree — insert 10 as first node",
      },
    },
    // Step 8 ─ insertRec(null, 10): base case fires immediately
    {
      startFrame: 2970,
      highlightLines: { startLine: 5, endLine: 6 },
      visibleLines: 7,
      snapshot: {
        nodes: singleNode("n10", 10, "new"),
        pointers: [],
        arrows: [],
        caption: "insertRec(null, 10) — base case fires at the top",
      },
    },
    // Step 9 ─ root = Node(10): one base case covers everything
    {
      startFrame: 3320,
      highlightLines: { startLine: 11, endLine: 11 },
      visibleLines: 13,
      snapshot: {
        nodes: singleNode("n10", 10, "found"),
        pointers: [],
        arrows: [],
        caption: "Returned node becomes root — one base case, covers everything",
      },
    },

    // ════ Phase 3: Edge Case — Duplicate ══════════════════════════════════════

    // Step 10 ─ reset to original BST, announce duplicate insert of 40
    {
      startFrame: 3755,
      highlightLines: { startLine: 0, endLine: 1 },
      visibleLines: 3,
      snapshot: {
        nodes: makeBSTNodes(),
        pointers: [],
        arrows: makeBSTEdges(),
        caption: "Duplicate insert — try inserting 40 again",
      },
    },
    // Step 11 ─ duplicate: at 50, 40 < 50 → go left
    {
      startFrame: 3934,
      highlightLines: { startLine: 8, endLine: 8 },
      visibleLines: 9,
      snapshot: {
        nodes: makeBSTNodes("n50"),
        pointers: [],
        arrows: makeBSTEdges(["n50-n30"]),
        caption: "40 < 50 → go left",
      },
    },
    // Step 12 ─ duplicate: at 30, 40 > 30 → go right
    {
      startFrame: 4081,
      highlightLines: { startLine: 10, endLine: 10 },
      visibleLines: 11,
      snapshot: {
        nodes: makeBSTNodes("n30"),
        pointers: [],
        arrows: makeBSTEdges(["n30-n40"]),
        caption: "40 > 30 → go right",
      },
    },
    // Step 13 ─ duplicate: arrive at 40, 40 == 40, neither condition fires
    {
      startFrame: 4228,
      highlightLines: { startLine: 7, endLine: 10 },
      visibleLines: 11,
      snapshot: {
        nodes: makeBSTNodes("n40"),
        pointers: [],
        arrows: makeBSTEdges(),
        caption: "40 == 40 — neither condition fires",
      },
    },
    // Step 14 ─ return node: duplicate silently skipped
    {
      startFrame: 4493,
      highlightLines: { startLine: 11, endLine: 11 },
      visibleLines: 13,
      snapshot: {
        nodes: makeBSTNodes(),
        pointers: [],
        arrows: makeBSTEdges(),
        caption: "return node — duplicate silently ignored",
      },
    },
    // Step 15 ─ ending: full tree, complexity card, CTA
    {
      startFrame: 4811,
      highlightLines: { startLine: 11, endLine: 12 },
      visibleLines: 13,
      snapshot: {
        nodes: makeBSTNodes(),
        pointers: [],
        arrows: makeBSTEdges(),
        caption: "BST Insert — left or right, again and again",
        complexityInfo: { time: "O(h)", space: "O(h)" },
      },
    },
  ];
}

// ── Position maps ─────────────────────────────────────────────────────────────

function makePositionMap(format: "youtube" | "reel" | "reel-anim"): Record<string, { x: number; y: number }> {
  if (format === "reel-anim") {
    return {
      n10:  { x: 0.50, y: 0.45 },
      n50:  { x: 0.50, y: 0.12 },
      n30:  { x: 0.26, y: 0.36 },
      n70:  { x: 0.74, y: 0.36 },
      n20:  { x: 0.12, y: 0.62 },
      n40:  { x: 0.42, y: 0.62 },
      n35:  { x: 0.28, y: 0.87 },
    };
  }
  if (format === "reel") {
    return {
      n10:  { x: 0.50, y: 0.42 },
      n50:  { x: 0.50, y: 0.13 },
      n30:  { x: 0.27, y: 0.38 },
      n70:  { x: 0.73, y: 0.38 },
      n20:  { x: 0.13, y: 0.63 },
      n40:  { x: 0.43, y: 0.63 },
      n35:  { x: 0.28, y: 0.87 },
    };
  }
  return {
    n10:  { x: 0.50, y: 0.42 },
    n50:  { x: 0.50, y: 0.18 },
    n30:  { x: 0.28, y: 0.38 },
    n70:  { x: 0.70, y: 0.38 },
    n20:  { x: 0.16, y: 0.57 },
    n40:  { x: 0.44, y: 0.57 },
    n35:  { x: 0.30, y: 0.76 },
  };
}

// ── Case banner — shown at the start of each new phase ───────────────────────

const PHASE_MARKERS: Record<number, { label: string; title: string }> = {
  1:  { label: "Case 1", title: "Normal Insert" },
  7:  { label: "Case 2", title: "Empty Tree" },
  10: { label: "Case 3", title: "Duplicate Key" },
};

const BANNER_HOLD  = 70;  // frames at full opacity
const BANNER_FADE  = 22;  // frames to fade out

const CaseBanner: React.FC<{ label: string; title: string; localFrame: number }> = ({
  label, title, localFrame,
}) => {
  const { fps } = useVideoConfig();

  const inP     = spring({ frame: localFrame, fps, config: { damping: 18, stiffness: 200 } });
  const slideY  = interpolate(inP, [0, 1], [36, 0]);
  const inAlpha = interpolate(inP, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });
  const outAlpha = interpolate(localFrame, [BANNER_HOLD, BANNER_HOLD + BANNER_FADE], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = inAlpha * outAlpha;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 80,
        transform: `translateY(${slideY}px)`,
        opacity,
      }}
    >
      <div
        style={{
          background: "rgba(4,4,10,0.78)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: "1px solid rgba(0,150,255,0.32)",
          borderRadius: 20,
          padding: "22px 52px",
          boxShadow: "0 0 48px rgba(0,150,255,0.18), 0 8px 40px rgba(0,0,0,0.6)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span
          style={{
            fontFamily: fonts.mono,
            fontSize: 14,
            fontWeight: 700,
            color: "#0096FF",
            letterSpacing: 3,
            textTransform: "uppercase" as const,
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: fonts.mono,
            fontSize: 34,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: 0.5,
          }}
        >
          {title}
        </span>
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

export interface BSTInsertProps {
  tokens: ThemedToken[][];
  format?: "youtube" | "reel" | "reel-anim";
}

export const BSTInsert: React.FC<BSTInsertProps> = ({ tokens, format = "youtube" }) => {
  const { width, height } = useVideoConfig();
  const isReel = format === "reel" || format === "reel-anim";
  const isAnim = format === "reel-anim";

  const safeW = width - REEL_SAFE.left - REEL_SAFE.right;
  const safeH = height - REEL_SAFE.top - REEL_SAFE.bottom;
  const diagramAreaW = isAnim ? width : isReel ? safeW : width * 0.54;
  const diagramAreaH = isAnim ? ANIM_DIAGRAM_HEIGHT : isReel ? Math.round(safeH * REEL_TOP_RATIO) : height;
  const nodeScale    = isAnim ? 1.4 : isReel ? 1.1 : 1;

  const steps = isAnim ? compressStepsForAnim(makeSteps()) : makeSteps();
  const { current, localFrame, stepIndex, t } = useStepTransition(steps);
  const complexityInfo = current.snapshot.complexityInfo;

  const reelDividerTop = REEL_SAFE.top + safeH * REEL_TOP_RATIO;
  const reelCenterLeft = REEL_SAFE.left + safeW / 2;

  // Step 0 is the hook — tree fills the screen, no code panel.
  // On the transition into step 1, shrink tree width and fade code in.
  const hookExitT  = stepIndex === 0 ? 0 : stepIndex === 1 ? t : 1;
  const isHookStep = stepIndex === 0;

  const hookTreeW  = isReel ? safeW  : width * 0.72;
  const normTreeW  = isReel ? safeW  : diagramAreaW;
  const activeTreeW = interpolate(hookExitT, [0, 1], [hookTreeW, normTreeW]);
  const codeOpacity = interpolate(hookExitT, [0, 1], [0, 1]);

  // Phase-start steps (1, 7, 10) show only the case banner — content is hidden
  // while the banner is visible, then fades in as the banner fades out.
  const isPhaseStart = !!PHASE_MARKERS[stepIndex];
  const contentOpacity = isPhaseStart
    ? interpolate(
        localFrame,
        [0, BANNER_HOLD, BANNER_HOLD + BANNER_FADE],
        [0, 0, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
      )
    : 1;

  const treeScale = isAnim ? 1 : isReel ? 0.85 : 1;

  const diagram = (
    <div
      style={{
        opacity: contentOpacity,
        width: activeTreeW,
        height: isReel ? diagramAreaH : height,
        position: "relative",
        overflow: "hidden",
        margin: isHookStep && !isReel ? "0 auto" : isReel ? "0 auto" : undefined,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${treeScale})`,
          transformOrigin: "50% 42%",
          marginTop: isReel ? 40 : 0,
        }}
      >
        <TreeDiagram
          steps={steps}
          positionMap={makePositionMap(format)}
          areaWidth={activeTreeW}
          areaHeight={diagramAreaH}
          nodeScale={nodeScale}
        />
      </div>
    </div>
  );

  const code = (
    <div style={{ opacity: codeOpacity * contentOpacity, flex: 1 }}>
      <CodeWindow title="BST.java" hideTitle={isReel}>
        <CodeBlock
          tokens={tokens}
          steps={steps}
          fontSize={isReel ? 20 : 24}
          lineHeight={isReel ? 1.65 : 2.1}
          padding={isReel ? 20 : 20}
          centered={isReel}
          centerWidth={isReel ? safeW : undefined}
          bold={isReel}
        />
      </CodeWindow>
    </div>
  );

  return (
    <>
      {isAnim ? (
        <AnimationOnlyLayout>{diagram}</AnimationOnlyLayout>
      ) : isReel ? (
        <StackedLayout top={diagram} bottom={code} safeArea={REEL_SAFE} topRatio={REEL_TOP_RATIO} />
      ) : isHookStep ? (
        <div style={{ width, height, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {diagram}
        </div>
      ) : (
        <SplitLayout left={diagram} right={code} leftWidth="54%" />
      )}
      {!isReel && PHASE_MARKERS[stepIndex] && (
        <CaseBanner
          label={PHASE_MARKERS[stepIndex].label}
          title={PHASE_MARKERS[stepIndex].title}
          localFrame={localFrame}
        />
      )}
      <AmbientLayer />
      {!isAnim && <SfxLayer steps={steps} duckVolume={0.45} />}
      {!isAnim && <NarrationLayer sceneId="bst-insert" steps={steps} />}
      {complexityInfo && (
        <ComplexityCard
          time={complexityInfo.time}
          space={complexityInfo.space}
          localFrame={Math.max(0, localFrame - 20)}
          style={
            isAnim
              ? {
                  position: "absolute",
                  top: 1460,
                  left: "50%",
                  transform: "translateX(-50%)",
                }
              : isReel
              ? {
                  position: "absolute",
                  top: reelDividerTop - 160,
                  left: reelCenterLeft,
                  transform: "translateX(-50%)",
                }
              : { position: "absolute", top: 28, left: 28 }
          }
        />
      )}
    </>
  );
};
