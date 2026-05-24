import React from "react";
import { useVideoConfig } from "remotion";
import type { ThemedToken } from "shiki";
import type { SceneStep } from "../lib/types";
import { SplitLayout } from "../components/SplitLayout";
import { StackedLayout, STACKED_TOP_RATIO, type SafeArea } from "../components/StackedLayout";
import { LinkedListDiagram } from "../components/LinkedListDiagram";
import { CodeBlock } from "../components/CodeBlock";
import { CodeWindow } from "../components/CodeWindow";
import { SfxLayer } from "../components/SfxLayer";
import { NarrationLayer } from "../components/NarrationLayer";
import { AmbientLayer } from "../components/AmbientLayer";
import { AnimationOnlyLayout, ANIM_DIAGRAM_HEIGHT } from "../components/AnimationOnlyLayout";
import { compressStepsForAnim } from "../lib/animSteps";

/*
 * Code lines:
 *   0: public void insertAtTail(int val) {
 *   1:     Node newNode = new Node(val);
 *   2:     if (head == null) {
 *   3:         head = newNode;
 *   4:         return;
 *   5:     }
 *   6:     Node curr = head;
 *   7:     while (curr.next != null) {
 *   8:         curr = curr.next;
 *   9:     }
 *  10:     curr.next = newNode;
 *  11:     size++;
 *  12: }
 */

const HEAD_COLOR = "#1565C0";
const CURR_COLOR = "#2E7D32";

const steps: SceneStep[] = [
  // Phase 1: CONTEXT — show existing list
  {
    excludeFromAnim: true,
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

  // Phase 2: PROBLEM — insert 5 at end
  {
    startFrame: 166,
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
      newNode: { id: "n5", value: 5, highlight: "new" },
    },
  },

  // Phase 3: THE CHALLENGE — need to traverse
  {
    startFrame: 323,
    highlightLines: { startLine: 6, endLine: 9 },
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
      newNode: { id: "n5", value: 5, highlight: "new" },
    },
  },

  // Phase 4: EDGE CASE — empty list
  {
    startFrame: 559,
    highlightLines: { startLine: 2, endLine: 5 },
    snapshot: {
      nodes: [{ id: "e5", value: 5, highlight: "new" }],
      pointers: [{ label: "head", targetNodeId: "e5", color: HEAD_COLOR }],
      arrows: [],
    },
  },

  // Phase 5: CORRECT APPROACH
  // Step 1: Create new node
  {
    startFrame: 753,
    highlightLines: { startLine: 1, endLine: 1 },
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
      newNode: { id: "n5", value: 5, highlight: "new" },
    },
  },

  // Step 2: curr = head
  {
    startFrame: 907,
    highlightLines: { startLine: 6, endLine: 6 },
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "active" },
        { id: "n7", value: 7 },
        { id: "n9", value: 9 },
      ],
      pointers: [
        { label: "head", targetNodeId: "n3", color: HEAD_COLOR },
        { label: "curr", targetNodeId: "n3", color: CURR_COLOR },
      ],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
      ],
      newNode: { id: "n5", value: 5, highlight: "new" },
    },
  },

  // Traverse: curr moves to n7
  {
    startFrame: 1040,
    highlightLines: { startLine: 7, endLine: 8 },
    snapshot: {
      nodes: [
        { id: "n3", value: 3 },
        { id: "n7", value: 7, highlight: "active" },
        { id: "n9", value: 9 },
      ],
      pointers: [
        { label: "head", targetNodeId: "n3", color: HEAD_COLOR },
        { label: "curr", targetNodeId: "n7", color: CURR_COLOR },
      ],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
      ],
      newNode: { id: "n5", value: 5, highlight: "new" },
    },
  },

  // Traverse: curr moves to n9
  {
    startFrame: 1238,
    highlightLines: { startLine: 7, endLine: 8 },
    snapshot: {
      nodes: [
        { id: "n3", value: 3 },
        { id: "n7", value: 7 },
        { id: "n9", value: 9, highlight: "active" },
      ],
      pointers: [
        { label: "head", targetNodeId: "n3", color: HEAD_COLOR },
        { label: "curr", targetNodeId: "n9", color: CURR_COLOR },
      ],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
      ],
      newNode: { id: "n5", value: 5, highlight: "new" },
    },
  },

  // Found tail: curr.next == null
  {
    startFrame: 1410,
    highlightLines: { startLine: 7, endLine: 7 },
    snapshot: {
      nodes: [
        { id: "n3", value: 3 },
        { id: "n7", value: 7 },
        { id: "n9", value: 9, highlight: "found" },
      ],
      pointers: [
        { label: "head", targetNodeId: "n3", color: HEAD_COLOR },
        { label: "curr", targetNodeId: "n9", color: CURR_COLOR },
      ],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
      ],
      newNode: { id: "n5", value: 5, highlight: "new" },
    },
  },

  // Step 3: curr.next = newNode (dashed arrow)
  {
    startFrame: 1603,
    highlightLines: { startLine: 10, endLine: 10 },
    snapshot: {
      nodes: [
        { id: "n3", value: 3 },
        { id: "n7", value: 7 },
        { id: "n9", value: 9 },
        { id: "n5", value: 5, highlight: "new" },
      ],
      pointers: [
        { label: "head", targetNodeId: "n3", color: HEAD_COLOR },
        { label: "curr", targetNodeId: "n9", color: CURR_COLOR },
      ],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
        { from: "n9", to: "n5", dashed: true, highlight: true },
      ],
    },
  },

  // Done! size++
  {
    startFrame: 1783,
    highlightLines: { startLine: 11, endLine: 12 },
    snapshot: {
      nodes: [
        { id: "n3", value: 3 },
        { id: "n7", value: 7 },
        { id: "n9", value: 9 },
        { id: "n5", value: 5 },
      ],
      pointers: [{ label: "head", targetNodeId: "n3", color: HEAD_COLOR }],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
        { from: "n9", to: "n5" },
      ],
    },
  },

  // Phase 6: COMPLEXITY — O(n)
  {
    startFrame: 1970,
    highlightLines: { startLine: 0, endLine: 12 },
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "active" },
        { id: "n7", value: 7, highlight: "active" },
        { id: "n9", value: 9, highlight: "active" },
        { id: "n5", value: 5 },
      ],
      pointers: [{ label: "head", targetNodeId: "n3", color: HEAD_COLOR }],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
        { from: "n9", to: "n5" },
      ],
    },
  },

  // Phase 7: COMPARE — vs Insert at Head
  {
    startFrame: 2222,
    highlightLines: { startLine: 6, endLine: 9 },
    snapshot: {
      nodes: [
        { id: "n3", value: 3 },
        { id: "n7", value: 7 },
        { id: "n9", value: 9 },
        { id: "n5", value: 5 },
      ],
      pointers: [{ label: "head", targetNodeId: "n3", color: HEAD_COLOR }],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
        { from: "n9", to: "n5" },
      ],
    },
  },

  // Phase 8: RECAP
  {
    excludeFromAnim: true,
    startFrame: 2492,
    highlightLines: { startLine: 1, endLine: 10 },
    snapshot: {
      nodes: [
        { id: "n3", value: 3 },
        { id: "n7", value: 7 },
        { id: "n9", value: 9 },
        { id: "n5", value: 5 },
      ],
      pointers: [{ label: "head", targetNodeId: "n3", color: HEAD_COLOR }],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
        { from: "n9", to: "n5" },
      ],
    },
  },

  // SUBSCRIBE CTA
  {
    excludeFromAnim: true,
    startFrame: 2689,
    highlightLines: { startLine: 0, endLine: 12 },
    snapshot: {
      nodes: [
        { id: "n3", value: 3 },
        { id: "n7", value: 7 },
        { id: "n9", value: 9 },
        { id: "n5", value: 5 },
      ],
      pointers: [{ label: "head", targetNodeId: "n3", color: HEAD_COLOR }],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
        { from: "n9", to: "n5" },
      ],
    },
  },
];

export const INSERT_TAIL_SCENE_FRAMES = 2911;

const REEL_SAFE: SafeArea = { top: 150, bottom: 380, left: 60, right: 160 };

export interface InsertTailProps {
  tokens: ThemedToken[][];
  format?: "youtube" | "reel" | "reel-anim";
}

export const InsertTail: React.FC<InsertTailProps> = ({ tokens, format = "youtube" }) => {
  const { width, height } = useVideoConfig();
  const isReel = format === "reel";
  const isAnim = format === "reel-anim";
  const activeSteps = isAnim ? compressStepsForAnim(steps) : steps;

  const safeW = width - REEL_SAFE.left - REEL_SAFE.right;
  const safeH = height - REEL_SAFE.top - REEL_SAFE.bottom;

  // InsertTail has 13 code lines — use a smaller topRatio to give the code panel more room
  const reelTopRatio = 0.45;

  const diagramAreaW = isAnim ? width : isReel ? safeW : width * 0.62;
  const diagramAreaH = isAnim ? ANIM_DIAGRAM_HEIGHT : isReel ? Math.round(safeH * reelTopRatio) : height;
  const nodeScale = isAnim ? 1.4 : isReel ? 1.2 : 1;
  const codeFontSize = isReel ? 26 : 24;

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
        <StackedLayout top={diagram} bottom={code} safeArea={REEL_SAFE} topRatio={reelTopRatio} />
      ) : (
        <SplitLayout left={diagram} right={code} />
      )}
      <AmbientLayer animOnly={isAnim} />
      <SfxLayer steps={activeSteps} duckVolume={0.5} animOnly={isAnim} />
      {!isAnim && <NarrationLayer sceneId="insert-tail" steps={activeSteps} />}
    </>
  );
};
