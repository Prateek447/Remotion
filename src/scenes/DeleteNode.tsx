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
 * Code lines (0-indexed):
 *   0: public void delete(int val) {
 *   1:     if (head == null) return;
 *   2:     if (head.val == val) {
 *   3:         head = head.next;
 *   4:         return;
 *   5:     }
 *   6:     Node curr = head;
 *   7:     while (curr.next != null) {
 *   8:         if (curr.next.val == val) {
 *   9:             curr.next = curr.next.next;
 *  10:             return;
 *  11:         }
 *  12:         curr = curr.next;
 *  13:     }
 *  14: }
 */

const HEAD_COLOR = "#1565C0";
const CURR_COLOR = "#2E7D32";

// startFrame[n] = startFrame[n-1] + frames[n-1] + 10 (buffer)
// Durations from public/narration/delete-node/durations.json
const steps: SceneStep[] = [
  // ─── Phase 0: CONTEXT ────────────────────────────────────────────────────
  // "Okay so here's our linked list..." (~1.4s in)
  {
    excludeFromAnim: true,
    startFrame: 0,
    highlightLines: { startLine: 0, endLine: 0 },
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

  // ─── Phase 1: CASE 1 — Empty list ────────────────────────────────────────
  {
    startFrame: 280,
    highlightLines: { startLine: 1, endLine: 1 },
    snapshot: {
      nodes: [],
      pointers: [{ label: "head", targetNodeId: null, color: HEAD_COLOR }],
      arrows: [],
    },
  },

  // ─── Phase 2: CASE 2 — Delete the head node ──────────────────────────────
  {
    startFrame: 591,
    highlightLines: { startLine: 2, endLine: 2 },
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "active" },
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

  {
    startFrame: 785,
    highlightLines: { startLine: 2, endLine: 2 },
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "removing" },
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

  {
    startFrame: 971,
    highlightLines: { startLine: 3, endLine: 4 },
    snapshot: {
      nodes: [
        { id: "n7", value: 7 },
        { id: "n9", value: 9 },
        { id: "n5", value: 5 },
      ],
      pointers: [{ label: "head", targetNodeId: "n7", color: HEAD_COLOR }],
      arrows: [
        { from: "n7", to: "n9" },
        { from: "n9", to: "n5" },
      ],
    },
  },

  // ─── Phase 3: CASE 3 — Delete a middle node ──────────────────────────────
  {
    startFrame: 1245,
    highlightLines: { startLine: 0, endLine: 0 },
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

  {
    startFrame: 1482,
    highlightLines: { startLine: 6, endLine: 6 },
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "active" },
        { id: "n7", value: 7 },
        { id: "n9", value: 9 },
        { id: "n5", value: 5 },
      ],
      pointers: [
        { label: "head", targetNodeId: "n3", color: HEAD_COLOR },
        { label: "curr", targetNodeId: "n3", color: CURR_COLOR },
      ],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
        { from: "n9", to: "n5" },
      ],
    },
  },

  {
    startFrame: 1715,
    highlightLines: { startLine: 7, endLine: 8 },
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "active" },
        { id: "n7", value: 7, highlight: "removing" },
        { id: "n9", value: 9 },
        { id: "n5", value: 5 },
      ],
      pointers: [
        { label: "head", targetNodeId: "n3", color: HEAD_COLOR },
        { label: "curr", targetNodeId: "n3", color: CURR_COLOR },
      ],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
        { from: "n9", to: "n5" },
      ],
    },
  },

  {
    startFrame: 1900,
    highlightLines: { startLine: 9, endLine: 10 },
    snapshot: {
      nodes: [
        { id: "n3", value: 3 },
        { id: "n7", value: 7, highlight: "removing" },
        { id: "n9", value: 9 },
        { id: "n5", value: 5 },
      ],
      pointers: [
        { label: "head", targetNodeId: "n3", color: HEAD_COLOR },
        { label: "curr", targetNodeId: "n3", color: CURR_COLOR },
      ],
      arrows: [
        { from: "n3", to: "n9", dashed: true, highlight: true },
        { from: "n9", to: "n5" },
      ],
    },
  },

  {
    startFrame: 2199,
    highlightLines: { startLine: 9, endLine: 10 },
    snapshot: {
      nodes: [
        { id: "n3", value: 3 },
        { id: "n9", value: 9 },
        { id: "n5", value: 5 },
      ],
      pointers: [{ label: "head", targetNodeId: "n3", color: HEAD_COLOR }],
      arrows: [
        { from: "n3", to: "n9" },
        { from: "n9", to: "n5" },
      ],
    },
  },

  // ─── Phase 4: CASE 4 — Delete the tail node ──────────────────────────────
  {
    startFrame: 2390,
    highlightLines: { startLine: 0, endLine: 0 },
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

  {
    startFrame: 2578,
    highlightLines: { startLine: 7, endLine: 12 },
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "active" },
        { id: "n7", value: 7 },
        { id: "n9", value: 9 },
        { id: "n5", value: 5 },
      ],
      pointers: [
        { label: "head", targetNodeId: "n3", color: HEAD_COLOR },
        { label: "curr", targetNodeId: "n3", color: CURR_COLOR },
      ],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
        { from: "n9", to: "n5" },
      ],
    },
  },

  {
    startFrame: 2742,
    highlightLines: { startLine: 7, endLine: 12 },
    snapshot: {
      nodes: [
        { id: "n3", value: 3 },
        { id: "n7", value: 7, highlight: "active" },
        { id: "n9", value: 9 },
        { id: "n5", value: 5 },
      ],
      pointers: [
        { label: "head", targetNodeId: "n3", color: HEAD_COLOR },
        { label: "curr", targetNodeId: "n7", color: CURR_COLOR },
      ],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
        { from: "n9", to: "n5" },
      ],
    },
  },

  {
    startFrame: 2911,
    highlightLines: { startLine: 8, endLine: 8 },
    snapshot: {
      nodes: [
        { id: "n3", value: 3 },
        { id: "n7", value: 7 },
        { id: "n9", value: 9, highlight: "active" },
        { id: "n5", value: 5, highlight: "removing" },
      ],
      pointers: [
        { label: "head", targetNodeId: "n3", color: HEAD_COLOR },
        { label: "curr", targetNodeId: "n9", color: CURR_COLOR },
      ],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
        { from: "n9", to: "n5" },
      ],
    },
  },

  {
    startFrame: 3119,
    highlightLines: { startLine: 9, endLine: 10 },
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

  // ─── Phase 5: COMPLEXITY & RECAP ─────────────────────────────────────────
  {
    excludeFromAnim: true,
    startFrame: 3295,
    highlightLines: { startLine: 0, endLine: 14 },
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "found" },
        { id: "n7", value: 7, highlight: "found" },
        { id: "n9", value: 9, highlight: "found" },
        { id: "n5", value: 5, highlight: "found" },
      ],
      pointers: [{ label: "head", targetNodeId: "n3", color: HEAD_COLOR }],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
        { from: "n9", to: "n5" },
      ],
    },
  },

  // ─── SUBSCRIBE CTA ────────────────────────────────────────────────────────
  {
    excludeFromAnim: true,
    startFrame: 3676,
    highlightLines: { startLine: 0, endLine: 14 },
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "found" },
        { id: "n7", value: 7, highlight: "found" },
        { id: "n9", value: 9, highlight: "found" },
        { id: "n5", value: 5, highlight: "found" },
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

export const DELETE_NODE_SCENE_FRAMES = 3822; // 3676 + 136 + 10 buffer

// Instagram Reel safe area insets (px)
const REEL_SAFE: SafeArea = { top: 150, bottom: 380, left: 60, right: 160 };

// 15 lines of code — give more room to the code panel
const REEL_TOP_RATIO = 0.42;

export interface DeleteNodeProps {
  tokens: ThemedToken[][];
  format?: "youtube" | "reel" | "reel-anim";
}

export const DeleteNode: React.FC<DeleteNodeProps> = ({ tokens, format = "youtube" }) => {
  const { width, height } = useVideoConfig();
  const isReel = format === "reel";
  const isAnim = format === "reel-anim";
  const activeSteps = isAnim ? compressStepsForAnim(steps) : steps;

  const safeW = width - REEL_SAFE.left - REEL_SAFE.right;
  const safeH = height - REEL_SAFE.top - REEL_SAFE.bottom;

  const diagramAreaW = isAnim ? width : isReel ? safeW : width * 0.62;
  const diagramAreaH = isAnim ? ANIM_DIAGRAM_HEIGHT : isReel ? Math.round(safeH * REEL_TOP_RATIO) : height;
  const nodeScale = isAnim ? 1.4 : isReel ? 1.2 : 1;
  const codeFontSize = isReel ? 24 : 24;

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
      {!isAnim && <NarrationLayer sceneId="delete-node" steps={activeSteps} />}
    </>
  );
};
