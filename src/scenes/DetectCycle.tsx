import React from "react";
import { useVideoConfig } from "remotion";
import type { ThemedToken } from "shiki";
import type { SceneStep } from "../lib/types";
import { SplitLayout } from "../components/SplitLayout";
import { StackedLayout, type SafeArea } from "../components/StackedLayout";
import { LinkedListDiagram } from "../components/LinkedListDiagram";
import { CodeBlock } from "../components/CodeBlock";
import { CodeWindow } from "../components/CodeWindow";
import { SfxLayer } from "../components/SfxLayer";
import { NarrationLayer } from "../components/NarrationLayer";
import { AmbientLayer } from "../components/AmbientLayer";

/*
 * Code lines (0-indexed) for detectCycleCode:
 *   0: public boolean hasCycle() {
 *   1:     Node slow = head;
 *   2:     Node fast = head;
 *   3:     while (fast != null && fast.next != null) {
 *   4:         slow = slow.next;
 *   5:         fast = fast.next.next;
 *   6:         if (slow == fast) {
 *   7:             return true;
 *   8:         }
 *   9:     }
 *  10:     return false;
 *  11: }
 */

const SLOW_COLOR = "#10B981";
const FAST_COLOR = "#8B5CF6";

const ADDRESSES: Record<string, string> = {
  n1: "1028",
  n2: "3947",
  n3: "2716",
  n4: "4321",
  n5: "7687",
};

const baseNodes = [
  { id: "n1", value: 1, address: ADDRESSES.n1 },
  { id: "n2", value: 2, address: ADDRESSES.n2 },
  { id: "n3", value: 3, address: ADDRESSES.n3 },
  { id: "n4", value: 4, address: ADDRESSES.n4 },
  { id: "n5", value: 5, address: ADDRESSES.n5 },
];

const linearArrows = [
  { from: "n1", to: "n2" },
  { from: "n2", to: "n3" },
  { from: "n3", to: "n4" },
  { from: "n4", to: "n5" },
];

const cycleArrow = { from: "n5", to: "n3", dashed: true, curved: true };
const cycleArrowHighlight = { ...cycleArrow, highlight: true };

// startFrame[n] = startFrame[n-1] + frames[n-1] + 10
// Durations from public/narration/detect-cycle/durations.json
// Sub-step 7b is animation-only — offset within parent audio window
//
// Floyd's trace with 5 nodes, cycle 5->3:
//   Init: slow=1, fast=1
//   Iter 1: slow=2, fast=3
//   Iter 2: slow=3, fast=5
//   Iter 3: slow=4, fast wraps 5->3->4 — MEET at n4
const steps: SceneStep[] = [
  // ─── Phase 0: INTRO — what is a cycle? ────────────────────────────────────
  // Audio 0: 263 frames
  {
    startFrame: 0,
    highlightLines: { startLine: 0, endLine: 0 },
    snapshot: {
      nodes: baseNodes.map((n) => ({ ...n })),
      pointers: [],
      arrows: [...linearArrows],
    },
  },

  // Step 1: Show the cycle arrow (5 -> 3)
  // Audio 1: 363 frames
  {
    startFrame: 273,
    highlightLines: { startLine: 0, endLine: 0 },
    snapshot: {
      hideEndNull: true,
      nodes: baseNodes.map((n) => ({ ...n })),
      pointers: [],
      arrows: [...linearArrows, cycleArrow],
    },
  },

  // ─── Phase 1: CONCEPT — Floyd's algorithm setup ──────────────────────────
  // Step 2: slow = head, fast = head
  // Audio 2: 283 frames
  {
    startFrame: 646,
    highlightLines: { startLine: 1, endLine: 2 },
    snapshot: {
      hideEndNull: true,
      nodes: baseNodes.map((n) => ({ ...n })),
      pointers: [
        { label: "slow", targetNodeId: "n1", color: SLOW_COLOR },
        { label: "fast", targetNodeId: "n1", color: FAST_COLOR },
      ],
      arrows: [...linearArrows, cycleArrow],
    },
  },

  // ─── Phase 2: ITERATION 1 — slow=2, fast=3 ──────────────────────────────
  // Step 3: Move pointers
  // Audio 3: 169 frames
  {
    startFrame: 939,
    highlightLines: { startLine: 4, endLine: 5 },
    snapshot: {
      hideEndNull: true,
      nodes: baseNodes.map((n) => ({ ...n })),
      pointers: [
        { label: "slow", targetNodeId: "n2", color: SLOW_COLOR },
        { label: "fast", targetNodeId: "n3", color: FAST_COLOR },
      ],
      arrows: [...linearArrows, cycleArrow],
    },
  },

  // Step 4: Check slow != fast
  // Audio 4: 167 frames
  {
    startFrame: 1118,
    highlightLines: { startLine: 6, endLine: 6 },
    snapshot: {
      hideEndNull: true,
      nodes: baseNodes.map((n) => ({ ...n })),
      pointers: [
        { label: "slow", targetNodeId: "n2", color: SLOW_COLOR },
        { label: "fast", targetNodeId: "n3", color: FAST_COLOR },
      ],
      arrows: [...linearArrows, cycleArrow],
    },
  },

  // ─── Phase 3: ITERATION 2 — slow=3, fast=5 ──────────────────────────────
  // Step 5: Move pointers
  // Audio 5: 130 frames
  {
    startFrame: 1295,
    highlightLines: { startLine: 4, endLine: 5 },
    snapshot: {
      hideEndNull: true,
      nodes: baseNodes.map((n) => ({ ...n })),
      pointers: [
        { label: "slow", targetNodeId: "n3", color: SLOW_COLOR },
        { label: "fast", targetNodeId: "n5", color: FAST_COLOR },
      ],
      arrows: [...linearArrows, cycleArrow],
    },
  },

  // Step 6: Check slow != fast
  // Audio 6: 136 frames
  {
    startFrame: 1435,
    highlightLines: { startLine: 6, endLine: 6 },
    snapshot: {
      hideEndNull: true,
      nodes: baseNodes.map((n) => ({ ...n })),
      pointers: [
        { label: "slow", targetNodeId: "n3", color: SLOW_COLOR },
        { label: "fast", targetNodeId: "n5", color: FAST_COLOR },
      ],
      arrows: [...linearArrows, cycleArrow],
    },
  },

  // ─── Phase 4: ITERATION 3 — slow=4, fast wraps (5->3->4) — MEET! ───────
  // Step 7: slow=4, fast=4 (fast.next.next: 5->3->4). Cycle arrow highlighted.
  // Audio 7: 300 frames
  {
    startFrame: 1581,
    highlightLines: { startLine: 4, endLine: 5 },
    snapshot: {
      hideEndNull: true,
      nodes: baseNodes.map((n) => {
        if (n.id === "n4") return { ...n, highlight: "found" as const };
        return { ...n };
      }),
      pointers: [
        { label: "slow", targetNodeId: "n4", color: SLOW_COLOR },
        { label: "fast", targetNodeId: "n4", color: FAST_COLOR },
      ],
      arrows: [...linearArrows, cycleArrowHighlight],
    },
  },

  // Step 8: slow == fast — return true
  // Audio 8: 129 frames
  {
    startFrame: 1891,
    highlightLines: { startLine: 6, endLine: 7 },
    snapshot: {
      hideEndNull: true,
      nodes: baseNodes.map((n) => {
        if (n.id === "n4") return { ...n, highlight: "found" as const };
        return { ...n };
      }),
      pointers: [
        { label: "slow", targetNodeId: "n4", color: SLOW_COLOR },
        { label: "fast", targetNodeId: "n4", color: FAST_COLOR },
      ],
      arrows: [...linearArrows, cycleArrow],
    },
  },

  // ─── Phase 5: NO-CYCLE CASE ──────────────────────────────────────────────
  // Step 9: No cycle — reset pointers
  // Audio 9: 178 frames
  {
    startFrame: 2030,
    highlightLines: { startLine: 3, endLine: 3 },
    snapshot: {
      nodes: baseNodes.map((n) => ({ ...n })),
      pointers: [
        { label: "slow", targetNodeId: "n1", color: SLOW_COLOR },
        { label: "fast", targetNodeId: "n1", color: FAST_COLOR },
      ],
      arrows: [...linearArrows],
    },
  },

  // Step 10: fast reaches null — return false
  // Audio 10: 201 frames
  {
    startFrame: 2218,
    highlightLines: { startLine: 10, endLine: 10 },
    snapshot: {
      nodes: baseNodes.map((n) => ({ ...n })),
      pointers: [
        { label: "slow", targetNodeId: "n3", color: SLOW_COLOR },
        { label: "fast", targetNodeId: null, color: FAST_COLOR },
      ],
      arrows: [...linearArrows],
    },
  },

  // ─── Phase 6: WHY IT WORKS ───────────────────────────────────────────────
  // Audio 11: 351 frames
  {
    startFrame: 2429,
    highlightLines: { startLine: 3, endLine: 8 },
    snapshot: {
      hideEndNull: true,
      nodes: baseNodes.map((n) => ({ ...n, highlight: "found" as const })),
      pointers: [],
      arrows: [...linearArrows, cycleArrow],
    },
  },

  // ─── Phase 7: COMPLEXITY ─────────────────────────────────────────────────
  // Audio 12: 258 frames
  {
    startFrame: 2790,
    highlightLines: { startLine: 0, endLine: 11 },
    snapshot: {
      hideEndNull: true,
      nodes: baseNodes.map((n) => ({ ...n, highlight: "found" as const })),
      pointers: [],
      arrows: [...linearArrows, cycleArrow],
    },
  },

  // ─── CTA ──────────────────────────────────────────────────────────────────
  // Audio 13: 189 frames
  {
    startFrame: 3058,
    highlightLines: { startLine: 0, endLine: 11 },
    snapshot: {
      hideEndNull: true,
      nodes: baseNodes.map((n) => ({ ...n, highlight: "found" as const })),
      pointers: [],
      arrows: [...linearArrows, cycleArrow],
    },
  },
];

export const DETECT_CYCLE_SCENE_FRAMES = 3247;

const REEL_SAFE: SafeArea = { top: 150, bottom: 380, left: 30, right: 30 };
const REEL_TOP_RATIO = 0.42;

export interface DetectCycleProps {
  tokens: ThemedToken[][];
  format?: "youtube" | "reel";
}

export const DetectCycle: React.FC<DetectCycleProps> = ({ tokens, format = "youtube" }) => {
  const { width, height } = useVideoConfig();
  const isReel = format === "reel";

  const safeW = width - REEL_SAFE.left - REEL_SAFE.right;
  const safeH = height - REEL_SAFE.top - REEL_SAFE.bottom;

  const diagramAreaW = isReel ? safeW : width * 0.62;
  const diagramAreaH = isReel ? Math.round(safeH * REEL_TOP_RATIO) : height;
  const nodeScale = isReel ? 0.85 : 1;
  const codeFontSize = isReel ? 24 : 24;

  const diagram = (
    <LinkedListDiagram
      steps={steps}
      areaWidth={diagramAreaW}
      areaHeight={diagramAreaH}
      nodeScale={nodeScale}
    />
  );

  const code = (
    <CodeWindow title="LinkedList.java" hideTitle={isReel}>
      <CodeBlock
        tokens={tokens}
        steps={steps}
        fontSize={codeFontSize}
        centered={isReel}
        centerWidth={isReel ? safeW : undefined}
      />
    </CodeWindow>
  );

  return (
    <>
      {isReel ? (
        <StackedLayout top={diagram} bottom={code} safeArea={REEL_SAFE} topRatio={REEL_TOP_RATIO} />
      ) : (
        <SplitLayout left={diagram} right={code} leftWidth="58%" />
      )}
      <AmbientLayer />
      <SfxLayer steps={steps} duckVolume={0.5} />
      <NarrationLayer sceneId="detect-cycle" steps={steps} />
    </>
  );
};
