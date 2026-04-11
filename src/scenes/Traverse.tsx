import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { ThemedToken } from "shiki";
import type { SceneStep } from "../lib/types";
import { SplitLayout } from "../components/SplitLayout";
import { LinkedListDiagram } from "../components/LinkedListDiagram";
import { CodeBlock } from "../components/CodeBlock";
import { CodeWindow } from "../components/CodeWindow";
import { SfxLayer } from "../components/SfxLayer";
import { colors } from "../lib/theme";

interface TraverseProps {
  tokens: ThemedToken[][];
}

const steps: SceneStep[] = [
  {
    startFrame: 0,
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "active" },
        { id: "n7", value: 7, highlight: "none" },
        { id: "n9", value: 9, highlight: "none" },
        { id: "n5", value: 5, highlight: "none" },
      ],
      pointers: [{ label: "curr", targetNodeId: "n3", color: colors.peach }],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
        { from: "n9", to: "n5" },
      ],
      caption: "Traverse linked list",
    },
    highlightLines: { startLine: 0, endLine: 1 },
  },
  {
    startFrame: 40,
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "active" },
        { id: "n7", value: 7, highlight: "none" },
        { id: "n9", value: 9, highlight: "none" },
        { id: "n5", value: 5, highlight: "none" },
      ],
      pointers: [{ label: "curr", targetNodeId: "n3", color: colors.peach }],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
        { from: "n9", to: "n5" },
      ],
      caption: "Print 3",
    },
    highlightLines: { startLine: 2, endLine: 3 },
  },
  {
    startFrame: 80,
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "none" },
        { id: "n7", value: 7, highlight: "active" },
        { id: "n9", value: 9, highlight: "none" },
        { id: "n5", value: 5, highlight: "none" },
      ],
      pointers: [{ label: "curr", targetNodeId: "n7", color: colors.peach }],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
        { from: "n9", to: "n5" },
      ],
      caption: "curr = curr.next",
    },
    highlightLines: { startLine: 4, endLine: 4 },
  },
  {
    startFrame: 120,
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "none" },
        { id: "n7", value: 7, highlight: "active" },
        { id: "n9", value: 9, highlight: "none" },
        { id: "n5", value: 5, highlight: "none" },
      ],
      pointers: [{ label: "curr", targetNodeId: "n7", color: colors.peach }],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
        { from: "n9", to: "n5" },
      ],
      caption: "Print 7",
    },
    highlightLines: { startLine: 2, endLine: 3 },
  },
  {
    startFrame: 160,
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "none" },
        { id: "n7", value: 7, highlight: "none" },
        { id: "n9", value: 9, highlight: "active" },
        { id: "n5", value: 5, highlight: "none" },
      ],
      pointers: [{ label: "curr", targetNodeId: "n9", color: colors.peach }],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
        { from: "n9", to: "n5" },
      ],
      caption: "Print 9",
    },
    highlightLines: { startLine: 2, endLine: 3 },
  },
  {
    startFrame: 200,
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "none" },
        { id: "n7", value: 7, highlight: "none" },
        { id: "n9", value: 9, highlight: "none" },
        { id: "n5", value: 5, highlight: "active" },
      ],
      pointers: [{ label: "curr", targetNodeId: "n5", color: colors.peach }],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
        { from: "n9", to: "n5" },
      ],
      caption: "Print 5",
    },
    highlightLines: { startLine: 2, endLine: 3 },
  },
  {
    startFrame: 240,
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "none" },
        { id: "n7", value: 7, highlight: "none" },
        { id: "n9", value: 9, highlight: "none" },
        { id: "n5", value: 5, highlight: "none" },
      ],
      pointers: [],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
        { from: "n9", to: "n5" },
      ],
      caption: "Print null — done!",
    },
    highlightLines: { startLine: 6, endLine: 6 },
  },
];

export const Traverse: React.FC<TraverseProps> = ({ tokens }) => {
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
