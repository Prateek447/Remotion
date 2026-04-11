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

interface SearchNodeProps {
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
      caption: "Search for value 9",
    },
    highlightLines: { startLine: 0, endLine: 1 },
  },
  {
    startFrame: 45,
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
      caption: "curr.val(3) != 9",
    },
    highlightLines: { startLine: 2, endLine: 3 },
  },
  {
    startFrame: 90,
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
    highlightLines: { startLine: 6, endLine: 6 },
  },
  {
    startFrame: 135,
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
      caption: "curr.val(7) != 9",
    },
    highlightLines: { startLine: 2, endLine: 3 },
  },
  {
    startFrame: 180,
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
      caption: "curr = curr.next",
    },
    highlightLines: { startLine: 6, endLine: 6 },
  },
  {
    startFrame: 225,
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "none" },
        { id: "n7", value: 7, highlight: "none" },
        { id: "n9", value: 9, highlight: "found" },
        { id: "n5", value: 5, highlight: "none" },
      ],
      pointers: [{ label: "curr", targetNodeId: "n9", color: colors.peach }],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
        { from: "n9", to: "n5" },
      ],
      caption: "Found! return true",
    },
    highlightLines: { startLine: 3, endLine: 4 },
  },
  {
    startFrame: 280,
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "none" },
        { id: "n7", value: 7, highlight: "none" },
        { id: "n9", value: 9, highlight: "found" },
        { id: "n5", value: 5, highlight: "none" },
      ],
      pointers: [{ label: "curr", targetNodeId: "n9", color: colors.peach }],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
        { from: "n9", to: "n5" },
      ],
      caption: "Value 9 found at node",
    },
    highlightLines: { startLine: 4, endLine: 4 },
  },
];

export const SearchNode: React.FC<SearchNodeProps> = ({ tokens }) => {
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
