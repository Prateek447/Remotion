import React from "react";
import type { ThemedToken } from "shiki";
import type { SceneStep } from "../lib/types";
import { SplitLayout } from "../components/SplitLayout";
import { LinkedListDiagram } from "../components/LinkedListDiagram";
import { CodeBlock } from "../components/CodeBlock";
import { CodeWindow } from "../components/CodeWindow";
import { SfxLayer } from "../components/SfxLayer";
import { colors } from "../lib/theme";

interface MergeListsProps {
  tokens: ThemedToken[][];
}

const steps: SceneStep[] = [
  {
    startFrame: 0,
    snapshot: {
      nodes: [
        { id: "dummy", value: 0, highlight: "none" },
        { id: "a1", value: 1, highlight: "none" },
        { id: "a4", value: 4, highlight: "none" },
        { id: "a6", value: 6, highlight: "none" },
        { id: "b2", value: 2, highlight: "none" },
        { id: "b3", value: 3, highlight: "none" },
        { id: "b5", value: 5, highlight: "none" },
      ],
      pointers: [
        { label: "a", targetNodeId: "a1", color: colors.blue },
        { label: "b", targetNodeId: "b2", color: colors.peach },
        { label: "tail", targetNodeId: "dummy", color: colors.teal },
      ],
      arrows: [
        { from: "a1", to: "a4" },
        { from: "a4", to: "a6" },
        { from: "b2", to: "b3" },
        { from: "b3", to: "b5" },
      ],
      caption: "Merge two sorted lists",
    },
    highlightLines: { startLine: 0, endLine: 2 },
  },
  {
    startFrame: 40,
    snapshot: {
      nodes: [
        { id: "dummy", value: 0, highlight: "none" },
        { id: "a1", value: 1, highlight: "active" },
        { id: "a4", value: 4, highlight: "none" },
        { id: "a6", value: 6, highlight: "none" },
        { id: "b2", value: 2, highlight: "none" },
        { id: "b3", value: 3, highlight: "none" },
        { id: "b5", value: 5, highlight: "none" },
      ],
      pointers: [
        { label: "a", targetNodeId: "a1", color: colors.blue },
        { label: "b", targetNodeId: "b2", color: colors.peach },
        { label: "tail", targetNodeId: "dummy", color: colors.teal },
      ],
      arrows: [
        { from: "dummy", to: "a1" },
        { from: "a1", to: "a4" },
        { from: "a4", to: "a6" },
        { from: "b2", to: "b3" },
        { from: "b3", to: "b5" },
      ],
      caption: "1 <= 2, take from A",
    },
    highlightLines: { startLine: 4, endLine: 6 },
  },
  {
    startFrame: 80,
    snapshot: {
      nodes: [
        { id: "dummy", value: 0, highlight: "none" },
        { id: "a1", value: 1, highlight: "none" },
        { id: "a4", value: 4, highlight: "none" },
        { id: "a6", value: 6, highlight: "none" },
        { id: "b2", value: 2, highlight: "none" },
        { id: "b3", value: 3, highlight: "none" },
        { id: "b5", value: 5, highlight: "none" },
      ],
      pointers: [
        { label: "a", targetNodeId: "a4", color: colors.blue },
        { label: "b", targetNodeId: "b2", color: colors.peach },
        { label: "tail", targetNodeId: "a1", color: colors.teal },
      ],
      arrows: [
        { from: "dummy", to: "a1" },
        { from: "a1", to: "a4" },
        { from: "a4", to: "a6" },
        { from: "b2", to: "b3" },
        { from: "b3", to: "b5" },
      ],
      caption: "Advance a and tail",
    },
    highlightLines: { startLine: 6, endLine: 11 },
  },
  {
    startFrame: 120,
    snapshot: {
      nodes: [
        { id: "dummy", value: 0, highlight: "none" },
        { id: "a1", value: 1, highlight: "none" },
        { id: "a4", value: 4, highlight: "none" },
        { id: "a6", value: 6, highlight: "none" },
        { id: "b2", value: 2, highlight: "active" },
        { id: "b3", value: 3, highlight: "none" },
        { id: "b5", value: 5, highlight: "none" },
      ],
      pointers: [
        { label: "a", targetNodeId: "a4", color: colors.blue },
        { label: "b", targetNodeId: "b2", color: colors.peach },
        { label: "tail", targetNodeId: "a1", color: colors.teal },
      ],
      arrows: [
        { from: "dummy", to: "a1" },
        { from: "a1", to: "b2" },
        { from: "b2", to: "b3" },
        { from: "b3", to: "b5" },
        { from: "a4", to: "a6" },
      ],
      caption: "2 <= 4, take from B",
    },
    highlightLines: { startLine: 4, endLine: 9 },
  },
  {
    startFrame: 160,
    snapshot: {
      nodes: [
        { id: "dummy", value: 0, highlight: "none" },
        { id: "a1", value: 1, highlight: "none" },
        { id: "a4", value: 4, highlight: "none" },
        { id: "a6", value: 6, highlight: "none" },
        { id: "b2", value: 2, highlight: "none" },
        { id: "b3", value: 3, highlight: "active" },
        { id: "b5", value: 5, highlight: "none" },
      ],
      pointers: [
        { label: "a", targetNodeId: "a4", color: colors.blue },
        { label: "b", targetNodeId: "b3", color: colors.peach },
        { label: "tail", targetNodeId: "b2", color: colors.teal },
      ],
      arrows: [
        { from: "dummy", to: "a1" },
        { from: "a1", to: "b2" },
        { from: "b2", to: "b3" },
        { from: "b3", to: "b5" },
        { from: "a4", to: "a6" },
      ],
      caption: "3 <= 4, take from B",
    },
    highlightLines: { startLine: 4, endLine: 9 },
  },
  {
    startFrame: 200,
    snapshot: {
      nodes: [
        { id: "dummy", value: 0, highlight: "none" },
        { id: "a1", value: 1, highlight: "none" },
        { id: "a4", value: 4, highlight: "active" },
        { id: "a6", value: 6, highlight: "none" },
        { id: "b2", value: 2, highlight: "none" },
        { id: "b3", value: 3, highlight: "none" },
        { id: "b5", value: 5, highlight: "none" },
      ],
      pointers: [
        { label: "a", targetNodeId: "a4", color: colors.blue },
        { label: "b", targetNodeId: "b5", color: colors.peach },
        { label: "tail", targetNodeId: "b3", color: colors.teal },
      ],
      arrows: [
        { from: "dummy", to: "a1" },
        { from: "a1", to: "b2" },
        { from: "b2", to: "b3" },
        { from: "b3", to: "a4" },
        { from: "a4", to: "a6" },
      ],
      caption: "4 <= 5, take from A",
    },
    highlightLines: { startLine: 4, endLine: 6 },
  },
  {
    startFrame: 240,
    snapshot: {
      nodes: [
        { id: "dummy", value: 0, highlight: "none" },
        { id: "a1", value: 1, highlight: "none" },
        { id: "a4", value: 4, highlight: "none" },
        { id: "a6", value: 6, highlight: "none" },
        { id: "b2", value: 2, highlight: "none" },
        { id: "b3", value: 3, highlight: "none" },
        { id: "b5", value: 5, highlight: "active" },
      ],
      pointers: [
        { label: "a", targetNodeId: "a6", color: colors.blue },
        { label: "b", targetNodeId: "b5", color: colors.peach },
        { label: "tail", targetNodeId: "a4", color: colors.teal },
      ],
      arrows: [
        { from: "dummy", to: "a1" },
        { from: "a1", to: "b2" },
        { from: "b2", to: "b3" },
        { from: "b3", to: "a4" },
        { from: "a4", to: "b5" },
      ],
      caption: "5 <= 6, take from B",
    },
    highlightLines: { startLine: 4, endLine: 9 },
  },
  {
    startFrame: 280,
    snapshot: {
      nodes: [
        { id: "dummy", value: 0, highlight: "none" },
        { id: "a1", value: 1, highlight: "none" },
        { id: "a4", value: 4, highlight: "none" },
        { id: "a6", value: 6, highlight: "none" },
        { id: "b2", value: 2, highlight: "none" },
        { id: "b3", value: 3, highlight: "none" },
        { id: "b5", value: 5, highlight: "none" },
      ],
      pointers: [
        { label: "a", targetNodeId: "a6", color: colors.blue },
        { label: "tail", targetNodeId: "b5", color: colors.teal },
      ],
      arrows: [
        { from: "dummy", to: "a1" },
        { from: "a1", to: "b2" },
        { from: "b2", to: "b3" },
        { from: "b3", to: "a4" },
        { from: "a4", to: "b5" },
      ],
      caption: "b is null, attach remaining a",
    },
    highlightLines: { startLine: 3, endLine: 13 },
  },
  {
    startFrame: 320,
    snapshot: {
      nodes: [
        { id: "dummy", value: 0, highlight: "none" },
        { id: "a1", value: 1, highlight: "none" },
        { id: "a4", value: 4, highlight: "none" },
        { id: "a6", value: 6, highlight: "none" },
        { id: "b2", value: 2, highlight: "none" },
        { id: "b3", value: 3, highlight: "none" },
        { id: "b5", value: 5, highlight: "none" },
      ],
      pointers: [
        { label: "a", targetNodeId: "a6", color: colors.blue },
        { label: "tail", targetNodeId: "b5", color: colors.teal },
      ],
      arrows: [
        { from: "dummy", to: "a1" },
        { from: "a1", to: "b2" },
        { from: "b2", to: "b3" },
        { from: "b3", to: "a4" },
        { from: "a4", to: "b5" },
        { from: "b5", to: "a6" },
      ],
      caption: "Merged: 1→2→3→4→5→6",
    },
    highlightLines: { startLine: 13, endLine: 14 },
  },
  {
    startFrame: 370,
    snapshot: {
      nodes: [
        { id: "dummy", value: 0, highlight: "none" },
        { id: "a1", value: 1, highlight: "none" },
        { id: "a4", value: 4, highlight: "none" },
        { id: "a6", value: 6, highlight: "none" },
        { id: "b2", value: 2, highlight: "none" },
        { id: "b3", value: 3, highlight: "none" },
        { id: "b5", value: 5, highlight: "none" },
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
      caption: "return dummy.next",
    },
    highlightLines: { startLine: 14, endLine: 14 },
  },
];

export const MergeLists: React.FC<MergeListsProps> = ({ tokens }) => {
  return (
    <>
      <SplitLayout
        left={<LinkedListDiagram steps={steps} />}
        right={
          <CodeWindow title="LinkedList.java">
            <CodeBlock tokens={tokens} steps={steps} />
          </CodeWindow>
        }
      />
      <SfxLayer steps={steps} />
    </>
  );
};
