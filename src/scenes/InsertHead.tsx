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
import { colors } from "../lib/theme";

/*
 * Code lines:
 *   0: public void insertAtHead(int val) {
 *   1:     Node newNode = new Node(val);
 *   2:     newNode.next = head;
 *   3:     head = newNode;
 *   4:     size++;
 *   5: }
 */

const HEAD_COLOR = "#2196F3";
const NEWNODE_COLOR = colors.mauve;

const steps: SceneStep[] = [
  // Phase 1: CONTEXT — explain what a node is
  {
    startFrame: 0,
    highlightLines: { startLine: 0, endLine: 0 },
    snapshot: {
      nodes: [{ id: "n3", value: 3 }],
      pointers: [],
      arrows: [],
    },
  },
  // Show the full linked list with head
  {
    startFrame: 273,
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

  // Phase 2: PROBLEM STATEMENT — show what we want to do
  {
    startFrame: 477,
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
      newNode: { id: "n1", value: 1, highlight: "new" },
    },
  },

  // Phase 3: THE WRONG WAY — intermediate: head moves first (no link)
  {
    startFrame: 624,
    highlightLines: { startLine: 3, endLine: 3 },
    snapshot: {
      nodes: [
        { id: "n1", value: 1, highlight: "new" },
        { id: "n3", value: 3 },
        { id: "n7", value: 7 },
        { id: "n9", value: 9 },
      ],
      pointers: [{ label: "head", targetNodeId: "n1", color: HEAD_COLOR }],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
      ],
    },
  },
  // Error state: old nodes unreachable
  {
    startFrame: 771,
    highlightLines: { startLine: 3, endLine: 3 },
    snapshot: {
      nodes: [
        { id: "n1", value: 1, highlight: "new" },
        { id: "n3", value: 3, highlight: "error" },
        { id: "n7", value: 7, highlight: "error" },
        { id: "n9", value: 9, highlight: "error" },
      ],
      pointers: [{ label: "head", targetNodeId: "n1", color: HEAD_COLOR }],
      arrows: [],
    },
  },
  // Recovery: reset and explain correct order
  {
    startFrame: 997,
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

  // Phase 4: CORRECT APPROACH
  // Step 1: Create new node (with "newNode" label)
  {
    startFrame: 1157,
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
      newNode: { id: "n1", value: 1, highlight: "new" },
    },
  },
  // Step 2: newNode.next = head (with "newNode" label + dashed arrow)
  {
    startFrame: 1284,
    highlightLines: { startLine: 2, endLine: 2 },
    snapshot: {
      nodes: [
        { id: "n1", value: 1, highlight: "new" },
        { id: "n3", value: 3 },
        { id: "n7", value: 7 },
        { id: "n9", value: 9 },
      ],
      pointers: [
        { label: "head", targetNodeId: "n3", color: HEAD_COLOR },
        { label: "newNode", targetNodeId: "n1", color: NEWNODE_COLOR },
      ],
      arrows: [
        { from: "n1", to: "n3", dashed: true, highlight: true },
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
      ],
    },
  },
  // Step 3: head = newNode
  {
    startFrame: 1483,
    highlightLines: { startLine: 3, endLine: 3 },
    snapshot: {
      nodes: [
        { id: "n1", value: 1 },
        { id: "n3", value: 3 },
        { id: "n7", value: 7 },
        { id: "n9", value: 9 },
      ],
      pointers: [{ label: "head", targetNodeId: "n1", color: HEAD_COLOR }],
      arrows: [
        { from: "n1", to: "n3" },
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
      ],
    },
  },
  // Done! size++
  {
    startFrame: 1638,
    highlightLines: { startLine: 4, endLine: 5 },
    snapshot: {
      nodes: [
        { id: "n1", value: 1, highlight: "found" },
        { id: "n3", value: 3 },
        { id: "n7", value: 7 },
        { id: "n9", value: 9 },
      ],
      pointers: [{ label: "head", targetNodeId: "n1", color: HEAD_COLOR }],
      arrows: [
        { from: "n1", to: "n3" },
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
      ],
    },
  },

  // Phase 5: WHY O(1)?
  {
    startFrame: 1817,
    highlightLines: { startLine: 0, endLine: 5 },
    snapshot: {
      nodes: [
        { id: "n1", value: 1, highlight: "active" },
        { id: "n3", value: 3 },
        { id: "n7", value: 7 },
        { id: "n9", value: 9 },
      ],
      pointers: [{ label: "head", targetNodeId: "n1", color: HEAD_COLOR }],
      arrows: [
        { from: "n1", to: "n3" },
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
      ],
    },
  },

  // Phase 6: EDGE CASE — empty list
  {
    startFrame: 2089,
    highlightLines: { startLine: 1, endLine: 3 },
    snapshot: {
      nodes: [{ id: "e1", value: 1, highlight: "new" }],
      pointers: [{ label: "head", targetNodeId: "e1", color: HEAD_COLOR }],
      arrows: [],
    },
  },

  // Phase 7: RECAP — three simple steps
  {
    startFrame: 2313,
    highlightLines: { startLine: 1, endLine: 3 },
    snapshot: {
      nodes: [
        { id: "n1", value: 1, highlight: "active" },
        { id: "n3", value: 3 },
        { id: "n7", value: 7 },
        { id: "n9", value: 9 },
      ],
      pointers: [{ label: "head", targetNodeId: "n1", color: HEAD_COLOR }],
      arrows: [
        { from: "n1", to: "n3" },
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
      ],
    },
  },

  // SUBSCRIBE CTA
  {
    startFrame: 2534,
    highlightLines: { startLine: 0, endLine: 5 },
    snapshot: {
      nodes: [
        { id: "n1", value: 1, highlight: "found" },
        { id: "n3", value: 3, highlight: "found" },
        { id: "n7", value: 7, highlight: "found" },
        { id: "n9", value: 9, highlight: "found" },
      ],
      pointers: [{ label: "head", targetNodeId: "n1", color: HEAD_COLOR }],
      arrows: [
        { from: "n1", to: "n3" },
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
      ],
    },
  },
];

export const INSERT_HEAD_SCENE_FRAMES = 2756;

export interface InsertHeadProps {
  tokens: ThemedToken[][];
  format?: "youtube" | "reel";
}

// Instagram Reel safe area insets (px) — content outside this gets covered by UI
const REEL_SAFE: SafeArea = { top: 150, bottom: 380, left: 60, right: 160 };

export const InsertHead: React.FC<InsertHeadProps> = ({ tokens, format = "youtube" }) => {
  const { width, height } = useVideoConfig();
  const isReel = format === "reel";

  // Dimensions of the safe inner area for the reel
  const safeW = width - REEL_SAFE.left - REEL_SAFE.right;
  const safeH = height - REEL_SAFE.top - REEL_SAFE.bottom;

  const diagramAreaW = isReel ? safeW : width * 0.62;
  const diagramAreaH = isReel ? Math.round(safeH * STACKED_TOP_RATIO) : height;
  const nodeScale = isReel ? 1.2 : 1;
  const codeFontSize = isReel ? 30 : 24;

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
        <StackedLayout top={diagram} bottom={code} safeArea={REEL_SAFE} />
      ) : (
        <SplitLayout left={diagram} right={code} />
      )}
      <AmbientLayer />
      <SfxLayer steps={steps} duckVolume={0.5} />
      <NarrationLayer sceneId="insert-head" steps={steps} />
    </>
  );
};
