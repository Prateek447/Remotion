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
 * Code lines (0-indexed) for mergeSortedCode:
 *   0: public static Node mergeSorted(Node a, Node b) {
 *   1:     Node dummy = new Node(0);
 *   2:     Node tail = dummy;
 *   3:     while (a != null && b != null) {
 *   4:         if (a.val <= b.val) {
 *   5:             tail.next = a;
 *   6:             a = a.next;
 *   7:         } else {
 *   8:             tail.next = b;
 *   9:             b = b.next;
 *  10:         }
 *  11:         tail = tail.next;
 *  12:     }
 *  13:     tail.next = (a != null) ? a : b;
 *  14:     return dummy.next;
 *  15: }
 */

const A_COLOR = "#3B82F6";
const B_COLOR = "#E87B35";
const TAIL_COLOR = "#14B8A6";

// startFrame[n] = startFrame[n-1] + frames[n-1] + 10
// Durations from public/narration/merge-lists/durations.json
const steps: SceneStep[] = [
  // ─── Phase 0: INTRO — show both lists ─────────────────────────────────────
  {
    excludeFromAnim: true,
    startFrame: 0,
    highlightLines: { startLine: 0, endLine: 0 },
    snapshot: {
      nodes: [
        { id: "a1", value: 1 },
        { id: "a4", value: 4 },
        { id: "a6", value: 6 },
        { id: "b2", value: 2 },
        { id: "b3", value: 3 },
        { id: "b5", value: 5 },
      ],
      pointers: [
        { label: "a", targetNodeId: "a1", color: A_COLOR },
        { label: "b", targetNodeId: "b2", color: B_COLOR },
      ],
      arrows: [
        { from: "a1", to: "a4" },
        { from: "a4", to: "a6" },
        { from: "b2", to: "b3" },
        { from: "b3", to: "b5" },
      ],
    },
  },

  // ─── Phase 1: SETUP — dummy node + tail ──────────────────────────────────
  {
    startFrame: 293,
    highlightLines: { startLine: 1, endLine: 2 },
    snapshot: {
      nodes: [
        { id: "dummy", value: 0 },
        { id: "a1", value: 1 },
        { id: "a4", value: 4 },
        { id: "a6", value: 6 },
        { id: "b2", value: 2 },
        { id: "b3", value: 3 },
        { id: "b5", value: 5 },
      ],
      pointers: [
        { label: "a", targetNodeId: "a1", color: A_COLOR },
        { label: "b", targetNodeId: "b2", color: B_COLOR },
        { label: "tail", targetNodeId: "dummy", color: TAIL_COLOR },
      ],
      arrows: [
        { from: "a1", to: "a4" },
        { from: "a4", to: "a6" },
        { from: "b2", to: "b3" },
        { from: "b3", to: "b5" },
      ],
    },
  },

  // ─── Phase 2: COMPARISONS ────────────────────────────────────────────────
  // Step 2: 1 <= 2, take from A
  {
    startFrame: 610,
    highlightLines: { startLine: 4, endLine: 6 },
    snapshot: {
      nodes: [
        { id: "dummy", value: 0 },
        { id: "a1", value: 1, highlight: "active" },
        { id: "a4", value: 4 },
        { id: "a6", value: 6 },
        { id: "b2", value: 2 },
        { id: "b3", value: 3 },
        { id: "b5", value: 5 },
      ],
      pointers: [
        { label: "a", targetNodeId: "a4", color: A_COLOR },
        { label: "b", targetNodeId: "b2", color: B_COLOR },
        { label: "tail", targetNodeId: "a1", color: TAIL_COLOR },
      ],
      arrows: [
        { from: "dummy", to: "a1" },
        { from: "a1", to: "a4" },
        { from: "a4", to: "a6" },
        { from: "b2", to: "b3" },
        { from: "b3", to: "b5" },
      ],
    },
  },

  // Step 3: 4 > 2, take from B
  {
    startFrame: 947,
    highlightLines: { startLine: 7, endLine: 9 },
    snapshot: {
      nodes: [
        { id: "dummy", value: 0 },
        { id: "a1", value: 1 },
        { id: "a4", value: 4 },
        { id: "a6", value: 6 },
        { id: "b2", value: 2, highlight: "active" },
        { id: "b3", value: 3 },
        { id: "b5", value: 5 },
      ],
      pointers: [
        { label: "a", targetNodeId: "a4", color: A_COLOR },
        { label: "b", targetNodeId: "b3", color: B_COLOR },
        { label: "tail", targetNodeId: "b2", color: TAIL_COLOR },
      ],
      arrows: [
        { from: "dummy", to: "a1" },
        { from: "a1", to: "b2" },
        { from: "b2", to: "b3" },
        { from: "b3", to: "b5" },
        { from: "a4", to: "a6" },
      ],
    },
  },

  // Step 4: 4 > 3, take from B
  {
    startFrame: 1276,
    highlightLines: { startLine: 7, endLine: 9 },
    snapshot: {
      nodes: [
        { id: "dummy", value: 0 },
        { id: "a1", value: 1 },
        { id: "a4", value: 4 },
        { id: "a6", value: 6 },
        { id: "b2", value: 2 },
        { id: "b3", value: 3, highlight: "active" },
        { id: "b5", value: 5 },
      ],
      pointers: [
        { label: "a", targetNodeId: "a4", color: A_COLOR },
        { label: "b", targetNodeId: "b5", color: B_COLOR },
        { label: "tail", targetNodeId: "b3", color: TAIL_COLOR },
      ],
      arrows: [
        { from: "dummy", to: "a1" },
        { from: "a1", to: "b2" },
        { from: "b2", to: "b3" },
        { from: "b3", to: "a4" },
        { from: "a4", to: "a6" },
      ],
    },
  },

  // Step 5: 4 <= 5, take from A
  {
    startFrame: 1501,
    highlightLines: { startLine: 4, endLine: 6 },
    snapshot: {
      nodes: [
        { id: "dummy", value: 0 },
        { id: "a1", value: 1 },
        { id: "a4", value: 4, highlight: "active" },
        { id: "a6", value: 6 },
        { id: "b2", value: 2 },
        { id: "b3", value: 3 },
        { id: "b5", value: 5 },
      ],
      pointers: [
        { label: "a", targetNodeId: "a6", color: A_COLOR },
        { label: "b", targetNodeId: "b5", color: B_COLOR },
        { label: "tail", targetNodeId: "a4", color: TAIL_COLOR },
      ],
      arrows: [
        { from: "dummy", to: "a1" },
        { from: "a1", to: "b2" },
        { from: "b2", to: "b3" },
        { from: "b3", to: "a4" },
        { from: "a4", to: "a6" },
      ],
    },
  },

  // Step 6: 6 > 5, take from B
  {
    startFrame: 1730,
    highlightLines: { startLine: 7, endLine: 9 },
    snapshot: {
      nodes: [
        { id: "dummy", value: 0 },
        { id: "a1", value: 1 },
        { id: "a4", value: 4 },
        { id: "a6", value: 6 },
        { id: "b2", value: 2 },
        { id: "b3", value: 3 },
        { id: "b5", value: 5, highlight: "active" },
      ],
      pointers: [
        { label: "a", targetNodeId: "a6", color: A_COLOR },
        { label: "b", targetNodeId: null, color: B_COLOR },
        { label: "tail", targetNodeId: "b5", color: TAIL_COLOR },
      ],
      arrows: [
        { from: "dummy", to: "a1" },
        { from: "a1", to: "b2" },
        { from: "b2", to: "b3" },
        { from: "b3", to: "a4" },
        { from: "a4", to: "b5" },
      ],
    },
  },

  // ─── Phase 3: LOOP ENDS — b is null ──────────────────────────────────────
  {
    startFrame: 1962,
    highlightLines: { startLine: 3, endLine: 12 },
    snapshot: {
      nodes: [
        { id: "dummy", value: 0 },
        { id: "a1", value: 1 },
        { id: "a4", value: 4 },
        { id: "a6", value: 6 },
        { id: "b2", value: 2 },
        { id: "b3", value: 3 },
        { id: "b5", value: 5 },
      ],
      pointers: [
        { label: "a", targetNodeId: "a6", color: A_COLOR },
        { label: "tail", targetNodeId: "b5", color: TAIL_COLOR },
      ],
      arrows: [
        { from: "dummy", to: "a1" },
        { from: "a1", to: "b2" },
        { from: "b2", to: "b3" },
        { from: "b3", to: "a4" },
        { from: "a4", to: "b5" },
      ],
    },
  },

  // Step 8: Attach remaining (tail.next = a)
  {
    startFrame: 2107,
    highlightLines: { startLine: 13, endLine: 13 },
    snapshot: {
      nodes: [
        { id: "dummy", value: 0 },
        { id: "a1", value: 1 },
        { id: "a4", value: 4 },
        { id: "a6", value: 6, highlight: "active" },
        { id: "b2", value: 2 },
        { id: "b3", value: 3 },
        { id: "b5", value: 5 },
      ],
      pointers: [
        { label: "a", targetNodeId: "a6", color: A_COLOR },
        { label: "tail", targetNodeId: "b5", color: TAIL_COLOR },
      ],
      arrows: [
        { from: "dummy", to: "a1" },
        { from: "a1", to: "b2" },
        { from: "b2", to: "b3" },
        { from: "b3", to: "a4" },
        { from: "a4", to: "b5" },
        { from: "b5", to: "a6" },
      ],
    },
  },

  // ─── Phase 4: RESULT — return dummy.next ─────────────────────────────────
  {
    startFrame: 2308,
    highlightLines: { startLine: 14, endLine: 14 },
    snapshot: {
      nodes: [
        { id: "dummy", value: 0 },
        { id: "a1", value: 1, highlight: "found" },
        { id: "b2", value: 2, highlight: "found" },
        { id: "b3", value: 3, highlight: "found" },
        { id: "a4", value: 4, highlight: "found" },
        { id: "b5", value: 5, highlight: "found" },
        { id: "a6", value: 6, highlight: "found" },
      ],
      pointers: [],
      arrows: [
        { from: "dummy", to: "a1" },
        { from: "a1", to: "b2" },
        { from: "b2", to: "b3" },
        { from: "b3", to: "a4" },
        { from: "a4", to: "b5" },
        { from: "b5", to: "a6" },
      ],
    },
  },

  // ─── Phase 5: COMPLEXITY ─────────────────────────────────────────────────
  {
    excludeFromAnim: true,
    startFrame: 2627,
    highlightLines: { startLine: 0, endLine: 15 },
    snapshot: {
      nodes: [
        { id: "a1", value: 1, highlight: "found" },
        { id: "b2", value: 2, highlight: "found" },
        { id: "b3", value: 3, highlight: "found" },
        { id: "a4", value: 4, highlight: "found" },
        { id: "b5", value: 5, highlight: "found" },
        { id: "a6", value: 6, highlight: "found" },
      ],
      pointers: [],
      arrows: [
        { from: "a1", to: "b2" },
        { from: "b2", to: "b3" },
        { from: "b3", to: "a4" },
        { from: "a4", to: "b5" },
        { from: "b5", to: "a6" },
      ],
    },
  },

  // ─── CTA ──────────────────────────────────────────────────────────────────
  {
    excludeFromAnim: true,
    startFrame: 2989,
    highlightLines: { startLine: 0, endLine: 15 },
    snapshot: {
      nodes: [
        { id: "a1", value: 1, highlight: "found" },
        { id: "b2", value: 2, highlight: "found" },
        { id: "b3", value: 3, highlight: "found" },
        { id: "a4", value: 4, highlight: "found" },
        { id: "b5", value: 5, highlight: "found" },
        { id: "a6", value: 6, highlight: "found" },
      ],
      pointers: [],
      arrows: [
        { from: "a1", to: "b2" },
        { from: "b2", to: "b3" },
        { from: "b3", to: "a4" },
        { from: "a4", to: "b5" },
        { from: "b5", to: "a6" },
      ],
    },
  },
];

export const MERGE_LISTS_SCENE_FRAMES = 3178;

const REEL_SAFE: SafeArea = { top: 150, bottom: 380, left: 60, right: 160 };
const REEL_TOP_RATIO = 0.42;

export interface MergeListsProps {
  tokens: ThemedToken[][];
  format?: "youtube" | "reel" | "reel-anim";
}

export const MergeLists: React.FC<MergeListsProps> = ({ tokens, format = "youtube" }) => {
  const { width, height } = useVideoConfig();
  const isReel = format === "reel";
  const isAnim = format === "reel-anim";
  const activeSteps = isAnim ? compressStepsForAnim(steps) : steps;

  const safeW = width - REEL_SAFE.left - REEL_SAFE.right;
  const safeH = height - REEL_SAFE.top - REEL_SAFE.bottom;

  const diagramAreaW = isAnim ? width : isReel ? safeW : width * 0.62;
  const diagramAreaH = isAnim ? ANIM_DIAGRAM_HEIGHT : isReel ? Math.round(safeH * REEL_TOP_RATIO) : height;
  const nodeScale = isAnim ? 1.4 : isReel ? 1.2 : 1;
  const codeFontSize = isReel ? 22 : 24;

  const diagram = (
    <LinkedListDiagram
      steps={activeSteps}
      areaWidth={diagramAreaW}
      areaHeight={diagramAreaH}
      nodeScale={nodeScale}
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
      {!isAnim && <NarrationLayer sceneId="merge-lists" steps={activeSteps} />}
    </>
  );
};
