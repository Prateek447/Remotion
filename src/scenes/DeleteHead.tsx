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

const HEAD_COLOR = "#2196F3";

const steps: SceneStep[] = [
  // Context — full list
  {
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

  // Empty list guard
  {
    startFrame: 280,
    highlightLines: { startLine: 1, endLine: 1 },
    snapshot: {
      nodes: [],
      pointers: [{ label: "head", targetNodeId: null, color: HEAD_COLOR }],
      arrows: [],
    },
  },

  // Head check — highlight head node
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

  // Mark head for removal
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

  // head = head.next — head removed
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
];

export const DELETE_HEAD_SCENE_FRAMES = 1245;

const REEL_SAFE: SafeArea = { top: 150, bottom: 380, left: 60, right: 160 };
const REEL_TOP_RATIO = 0.42;

export interface DeleteHeadProps {
  tokens: ThemedToken[][];
  format?: "youtube" | "reel";
}

export const DeleteHead: React.FC<DeleteHeadProps> = ({ tokens, format = "youtube" }) => {
  const { width, height } = useVideoConfig();
  const isReel = format === "reel";

  const safeW = width - REEL_SAFE.left - REEL_SAFE.right;
  const safeH = height - REEL_SAFE.top - REEL_SAFE.bottom;

  const diagramAreaW = isReel ? safeW : width * 0.62;
  const diagramAreaH = isReel ? Math.round(safeH * REEL_TOP_RATIO) : height;
  const nodeScale = isReel ? 1.2 : 1;
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
        <SplitLayout left={diagram} right={code} />
      )}
      <AmbientLayer />
      <SfxLayer steps={steps} duckVolume={0.5} />
      <NarrationLayer sceneId="delete-head" steps={steps} />
    </>
  );
};
