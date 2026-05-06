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
import { AnimationOnlyLayout, ANIM_DIAGRAM_HEIGHT } from "../components/AnimationOnlyLayout";
import { compressStepsForAnim } from "../lib/animSteps";

/*
 * Code lines (0-indexed) for reverseCode:
 *   0: public void reverse() {
 *   1:     Node prev = null;
 *   2:     Node curr = head;
 *   3:     while (curr != null) {
 *   4:         Node next = curr.next;
 *   5:         curr.next = prev;
 *   6:         prev = curr;
 *   7:         curr = next;
 *   8:     }
 *   9:     head = prev;
 *  10: }
 */

const PREV_COLOR = "#E87B35";
const CURR_COLOR = "#8B5CF6";
const NEXT_COLOR = "#2563EB";
const HEAD_COLOR = "#3B82F6";

// startFrame[n] = startFrame[n-1] + frames[n-1] + 10
// Durations from public/narration/reverse/durations.json
const steps: SceneStep[] = [
  // ─── Phase 0: INTRO ──────────────────────────────────────────────────────
  {
    startFrame: 0,
    highlightLines: { startLine: 0, endLine: 0 },
    snapshot: {
      nodes: [
        { id: "n3", value: 3 },
        { id: "n7", value: 7 },
        { id: "n9", value: 9 },
      ],
      pointers: [{ label: "head", targetNodeId: "n3", color: HEAD_COLOR }],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
      ],
    },
  },

  // ─── Phase 1: CONCEPT — explain the goal ──────────────────────────────────
  {
    startFrame: 255,
    highlightLines: { startLine: 0, endLine: 0 },
    snapshot: {
      nodes: [
        { id: "n3", value: 3 },
        { id: "n7", value: 7 },
        { id: "n9", value: 9 },
      ],
      pointers: [{ label: "head", targetNodeId: "n3", color: HEAD_COLOR }],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
      ],
    },
  },

  // ─── Phase 2: SETUP — Node prev = null ─────────────────────────────────────
  {
    startFrame: 551,
    highlightLines: { startLine: 1, endLine: 1 },
    snapshot: {
      nodes: [
        { id: "n3", value: 3 },
        { id: "n7", value: 7 },
        { id: "n9", value: 9 },
      ],
      pointers: [
        { label: "prev", targetNodeId: null, color: PREV_COLOR },
      ],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
      ],
    },
  },

  // Node curr = head
  {
    startFrame: 700,
    highlightLines: { startLine: 2, endLine: 2 },
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "active" },
        { id: "n7", value: 7 },
        { id: "n9", value: 9 },
      ],
      pointers: [
        { label: "prev", targetNodeId: null, color: PREV_COLOR },
        { label: "curr", targetNodeId: "n3", color: CURR_COLOR },
      ],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
      ],
    },
  },

  // ─── Phase 3: ITERATION 1 — node 3 ───────────────────────────────────────
  // Step 3a: next appears on same node as curr
  {
    startFrame: 868,
    highlightLines: { startLine: 4, endLine: 4 },
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "active" },
        { id: "n7", value: 7 },
        { id: "n9", value: 9 },
      ],
      pointers: [
        { label: "prev", targetNodeId: null, color: PREV_COLOR },
        { label: "curr", targetNodeId: "n3", color: CURR_COLOR },
        { label: "next", targetNodeId: "n3", color: NEXT_COLOR },
      ],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
      ],
    },
  },

  // Step 3b: next slides forward to n7
  {
    startFrame: 888,
    highlightLines: { startLine: 4, endLine: 4 },
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "active" },
        { id: "n7", value: 7 },
        { id: "n9", value: 9 },
      ],
      pointers: [
        { label: "prev", targetNodeId: null, color: PREV_COLOR },
        { label: "curr", targetNodeId: "n3", color: CURR_COLOR },
        { label: "next", targetNodeId: "n7", color: NEXT_COLOR },
      ],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
      ],
    },
  },

  // Step 4: curr.next = prev (3 -> null — node 3 flips)
  {
    startFrame: 1100,
    highlightLines: { startLine: 5, endLine: 5 },
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "active", reversed: true },
        { id: "n7", value: 7 },
        { id: "n9", value: 9 },
      ],
      pointers: [
        { label: "prev", targetNodeId: null, color: PREV_COLOR },
        { label: "curr", targetNodeId: "n3", color: CURR_COLOR },
        { label: "next", targetNodeId: "n7", color: NEXT_COLOR },
      ],
      arrows: [
        { from: "n3", to: "__null__", highlight: true },
      ],
    },
  },

  // Step 5: advance prev=3, curr=7
  {
    startFrame: 1378,
    highlightLines: { startLine: 6, endLine: 7 },
    snapshot: {
      nodes: [
        { id: "n3", value: 3, reversed: true },
        { id: "n7", value: 7, highlight: "active" },
        { id: "n9", value: 9 },
      ],
      pointers: [
        { label: "prev", targetNodeId: "n3", color: PREV_COLOR },
        { label: "curr", targetNodeId: "n7", color: CURR_COLOR },
      ],
      arrows: [
        { from: "n3", to: "__null__" },
        { from: "n7", to: "n9" },
      ],
    },
  },

  // ─── Phase 4: ITERATION 2 — node 7 ───────────────────────────────────────
  // Step 6a: next appears on same node as curr (n7)
  {
    startFrame: 1640,
    highlightLines: { startLine: 4, endLine: 4 },
    snapshot: {
      nodes: [
        { id: "n3", value: 3, reversed: true },
        { id: "n7", value: 7, highlight: "active" },
        { id: "n9", value: 9 },
      ],
      pointers: [
        { label: "prev", targetNodeId: "n3", color: PREV_COLOR },
        { label: "curr", targetNodeId: "n7", color: CURR_COLOR },
        { label: "next", targetNodeId: "n7", color: NEXT_COLOR },
      ],
      arrows: [
        { from: "n3", to: "__null__" },
        { from: "n7", to: "n9" },
      ],
    },
  },

  // Step 6b: next slides forward to n9
  {
    startFrame: 1660,
    highlightLines: { startLine: 4, endLine: 4 },
    snapshot: {
      nodes: [
        { id: "n3", value: 3, reversed: true },
        { id: "n7", value: 7, highlight: "active" },
        { id: "n9", value: 9 },
      ],
      pointers: [
        { label: "prev", targetNodeId: "n3", color: PREV_COLOR },
        { label: "curr", targetNodeId: "n7", color: CURR_COLOR },
        { label: "next", targetNodeId: "n9", color: NEXT_COLOR },
      ],
      arrows: [
        { from: "n3", to: "__null__" },
        { from: "n7", to: "n9" },
      ],
    },
  },

  // Step 7: curr.next = prev (7 -> 3 — node 7 flips)
  {
    startFrame: 1759,
    highlightLines: { startLine: 5, endLine: 5 },
    snapshot: {
      nodes: [
        { id: "n3", value: 3, reversed: true },
        { id: "n7", value: 7, highlight: "active", reversed: true },
        { id: "n9", value: 9 },
      ],
      pointers: [
        { label: "prev", targetNodeId: "n3", color: PREV_COLOR },
        { label: "curr", targetNodeId: "n7", color: CURR_COLOR },
        { label: "next", targetNodeId: "n9", color: NEXT_COLOR },
      ],
      arrows: [
        { from: "n3", to: "__null__" },
        { from: "n7", to: "n3", highlight: true },
      ],
    },
  },

  // Step 8: advance prev=7, curr=9
  {
    startFrame: 1899,
    highlightLines: { startLine: 6, endLine: 7 },
    snapshot: {
      nodes: [
        { id: "n3", value: 3, reversed: true },
        { id: "n7", value: 7, reversed: true },
        { id: "n9", value: 9, highlight: "active" },
      ],
      pointers: [
        { label: "prev", targetNodeId: "n7", color: PREV_COLOR },
        { label: "curr", targetNodeId: "n9", color: CURR_COLOR },
      ],
      arrows: [
        { from: "n3", to: "__null__" },
        { from: "n7", to: "n3" },
      ],
    },
  },

  // ─── Phase 5: ITERATION 3 — node 9 ───────────────────────────────────────
  // Step 9a: next appears on same node as curr (n9)
  {
    startFrame: 2041,
    highlightLines: { startLine: 4, endLine: 4 },
    snapshot: {
      nodes: [
        { id: "n3", value: 3, reversed: true },
        { id: "n7", value: 7, reversed: true },
        { id: "n9", value: 9, highlight: "active" },
      ],
      pointers: [
        { label: "prev", targetNodeId: "n7", color: PREV_COLOR },
        { label: "curr", targetNodeId: "n9", color: CURR_COLOR },
        { label: "next", targetNodeId: "n9", color: NEXT_COLOR },
      ],
      arrows: [
        { from: "n3", to: "__null__" },
        { from: "n7", to: "n3" },
      ],
    },
  },

  // Step 9b: next slides forward to null
  {
    startFrame: 2061,
    highlightLines: { startLine: 4, endLine: 4 },
    snapshot: {
      nodes: [
        { id: "n3", value: 3, reversed: true },
        { id: "n7", value: 7, reversed: true },
        { id: "n9", value: 9, highlight: "active" },
      ],
      pointers: [
        { label: "prev", targetNodeId: "n7", color: PREV_COLOR },
        { label: "curr", targetNodeId: "n9", color: CURR_COLOR },
        { label: "next", targetNodeId: null, color: NEXT_COLOR },
      ],
      arrows: [
        { from: "n3", to: "__null__" },
        { from: "n7", to: "n3" },
      ],
    },
  },

  // Step 10: curr.next = prev (9 -> 7 — node 9 flips)
  {
    startFrame: 2206,
    highlightLines: { startLine: 5, endLine: 5 },
    snapshot: {
      hideEndNull: true,
      nodes: [
        { id: "n3", value: 3, reversed: true },
        { id: "n7", value: 7, reversed: true },
        { id: "n9", value: 9, highlight: "active", reversed: true },
      ],
      pointers: [
        { label: "prev", targetNodeId: "n7", color: PREV_COLOR },
        { label: "curr", targetNodeId: "n9", color: CURR_COLOR },
        { label: "next", targetNodeId: null, color: NEXT_COLOR },
      ],
      arrows: [
        { from: "n3", to: "__null__" },
        { from: "n7", to: "n3" },
        { from: "n9", to: "n7", highlight: true },
      ],
    },
  },

  // Step 11: advance prev=9, curr=null (loop done)
  {
    startFrame: 2318,
    highlightLines: { startLine: 6, endLine: 8 },
    snapshot: {
      hideEndNull: true,
      nodes: [
        { id: "n3", value: 3, reversed: true },
        { id: "n7", value: 7, reversed: true },
        { id: "n9", value: 9, reversed: true },
      ],
      pointers: [
        { label: "prev", targetNodeId: "n9", color: PREV_COLOR },
        { label: "curr", targetNodeId: null, color: CURR_COLOR },
      ],
      arrows: [
        { from: "n3", to: "__null__" },
        { from: "n7", to: "n3" },
        { from: "n9", to: "n7" },
      ],
    },
  },

  // ─── Phase 6: FINAL — head = prev ────────────────────────────────────────
  // Step 12a: show head still on n3 alongside prev on n9
  {
    startFrame: 2517,
    highlightLines: { startLine: 9, endLine: 9 },
    snapshot: {
      hideEndNull: true,
      nodes: [
        { id: "n3", value: 3, reversed: true },
        { id: "n7", value: 7, reversed: true },
        { id: "n9", value: 9, reversed: true },
      ],
      pointers: [
        { label: "prev", targetNodeId: "n9", color: PREV_COLOR },
        { label: "head", targetNodeId: "n3", color: HEAD_COLOR },
      ],
      arrows: [
        { from: "n3", to: "__null__" },
        { from: "n7", to: "n3" },
        { from: "n9", to: "n7" },
      ],
    },
  },

  // Step 12b: head slides from n3 to n9 (head = prev)
  {
    startFrame: 2547,
    highlightLines: { startLine: 9, endLine: 9 },
    snapshot: {
      hideEndNull: true,
      nodes: [
        { id: "n3", value: 3, highlight: "found", reversed: true },
        { id: "n7", value: 7, highlight: "found", reversed: true },
        { id: "n9", value: 9, highlight: "found", reversed: true },
      ],
      pointers: [{ label: "head", targetNodeId: "n9", color: HEAD_COLOR }],
      arrows: [
        { from: "n3", to: "__null__" },
        { from: "n7", to: "n3" },
        { from: "n9", to: "n7" },
      ],
    },
  },

  // ─── Phase 7: COMPLEXITY ──────────────────────────────────────────────────
  {
    startFrame: 2801,
    highlightLines: { startLine: 0, endLine: 10 },
    snapshot: {
      hideEndNull: true,
      nodes: [
        { id: "n3", value: 3, highlight: "found", reversed: true },
        { id: "n7", value: 7, highlight: "found", reversed: true },
        { id: "n9", value: 9, highlight: "found", reversed: true },
      ],
      pointers: [{ label: "head", targetNodeId: "n9", color: HEAD_COLOR }],
      arrows: [
        { from: "n3", to: "__null__" },
        { from: "n7", to: "n3" },
        { from: "n9", to: "n7" },
      ],
    },
  },

  // ─── CTA ──────────────────────────────────────────────────────────────────
  {
    startFrame: 3112,
    highlightLines: { startLine: 0, endLine: 10 },
    snapshot: {
      hideEndNull: true,
      nodes: [
        { id: "n3", value: 3, highlight: "found", reversed: true },
        { id: "n7", value: 7, highlight: "found", reversed: true },
        { id: "n9", value: 9, highlight: "found", reversed: true },
      ],
      pointers: [{ label: "head", targetNodeId: "n9", color: HEAD_COLOR }],
      arrows: [
        { from: "n3", to: "__null__" },
        { from: "n7", to: "n3" },
        { from: "n9", to: "n7" },
      ],
    },
  },
];

export const REVERSE_SCENE_FRAMES = 3329;

const REEL_SAFE: SafeArea = { top: 150, bottom: 380, left: 30, right: 30 };
const REEL_TOP_RATIO = 0.45;

export interface ReverseProps {
  tokens: ThemedToken[][];
  format?: "youtube" | "reel" | "reel-anim";
}

export const Reverse: React.FC<ReverseProps> = ({ tokens, format = "youtube" }) => {
  const { width, height } = useVideoConfig();
  const isReel = format === "reel";
  const isAnim = format === "reel-anim";
  const activeSteps = isAnim ? compressStepsForAnim(steps) : steps;

  const safeW = width - REEL_SAFE.left - REEL_SAFE.right;
  const safeH = height - REEL_SAFE.top - REEL_SAFE.bottom;

  const diagramAreaW = isAnim ? width : isReel ? safeW : width * 0.62;
  const diagramAreaH = isAnim ? ANIM_DIAGRAM_HEIGHT : isReel ? Math.round(safeH * REEL_TOP_RATIO) : height;
  const nodeScale = isAnim ? 1.2 : isReel ? 0.9 : 1;
  const codeFontSize = isReel ? 26 : 24;

  const diagram = (
    <LinkedListDiagram
      steps={activeSteps}
      areaWidth={diagramAreaW}
      areaHeight={diagramAreaH}
      nodeScale={nodeScale}
      verticalOffset={isReel || isAnim ? -30 : 0}
    />
  );

  const code = (
    <CodeWindow title="LinkedList.java" hideTitle={isReel}>
      <CodeBlock
        tokens={tokens}
        steps={activeSteps}
        fontSize={codeFontSize}
        centered={isReel}
        centerWidth={isReel ? safeW : undefined}
      />
    </CodeWindow>
  );

  return (
    <>
      {isAnim ? (
        <AnimationOnlyLayout>{diagram}</AnimationOnlyLayout>
      ) : isReel ? (
        <StackedLayout top={diagram} bottom={code} safeArea={REEL_SAFE} topRatio={REEL_TOP_RATIO} />
      ) : (
        <SplitLayout left={diagram} right={code} />
      )}
      <AmbientLayer animOnly={isAnim} />
      <SfxLayer steps={activeSteps} duckVolume={0.5} animOnly={isAnim} />
      {!isAnim && <NarrationLayer sceneId="reverse" steps={activeSteps} />}
    </>
  );
};
