import React from "react";
import type { ThemedToken } from "shiki";
import type { SceneStep } from "../lib/types";
import { SplitLayout } from "../components/SplitLayout";
import { LinkedListDiagram } from "../components/LinkedListDiagram";
import { CodeBlock } from "../components/CodeBlock";
import { CodeWindow } from "../components/CodeWindow";
import { SfxLayer } from "../components/SfxLayer";
import { colors } from "../lib/theme";

interface ReverseProps {
  tokens: ThemedToken[][];
}

const steps: SceneStep[] = [
  {
    startFrame: 0,
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "none" },
        { id: "n7", value: 7, highlight: "none" },
        { id: "n9", value: 9, highlight: "none" },
      ],
      pointers: [
        { label: "prev", targetNodeId: null, color: colors.peach },
        { label: "curr", targetNodeId: "n3", color: colors.teal },
      ],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
      ],
      caption: "Reverse linked list",
    },
    highlightLines: { startLine: 0, endLine: 2 },
  },
  {
    startFrame: 40,
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "active" },
        { id: "n7", value: 7, highlight: "none" },
        { id: "n9", value: 9, highlight: "none" },
      ],
      pointers: [
        { label: "prev", targetNodeId: null, color: colors.peach },
        { label: "curr", targetNodeId: "n3", color: colors.teal },
        { label: "next", targetNodeId: "n7", color: colors.sapphire },
      ],
      arrows: [
        { from: "n3", to: "n7" },
        { from: "n7", to: "n9" },
      ],
      caption: "next = curr.next (7)",
    },
    highlightLines: { startLine: 3, endLine: 4 },
  },
  {
    startFrame: 80,
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "active" },
        { id: "n7", value: 7, highlight: "none" },
        { id: "n9", value: 9, highlight: "none" },
      ],
      pointers: [
        { label: "prev", targetNodeId: null, color: colors.peach },
        { label: "curr", targetNodeId: "n3", color: colors.teal },
        { label: "next", targetNodeId: "n7", color: colors.sapphire },
      ],
      arrows: [{ from: "n7", to: "n9" }],
      caption: "curr.next = prev (null)",
    },
    highlightLines: { startLine: 5, endLine: 5 },
  },
  {
    startFrame: 120,
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "none" },
        { id: "n7", value: 7, highlight: "none" },
        { id: "n9", value: 9, highlight: "none" },
      ],
      pointers: [
        { label: "prev", targetNodeId: "n3", color: colors.peach },
        { label: "curr", targetNodeId: "n7", color: colors.teal },
        { label: "next", targetNodeId: "n7", color: colors.sapphire },
      ],
      arrows: [{ from: "n7", to: "n9" }],
      caption: "Advance: prev=3, curr=7",
    },
    highlightLines: { startLine: 6, endLine: 7 },
  },
  {
    startFrame: 160,
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "none" },
        { id: "n7", value: 7, highlight: "active" },
        { id: "n9", value: 9, highlight: "none" },
      ],
      pointers: [
        { label: "prev", targetNodeId: "n3", color: colors.peach },
        { label: "curr", targetNodeId: "n7", color: colors.teal },
        { label: "next", targetNodeId: "n9", color: colors.sapphire },
      ],
      arrows: [{ from: "n7", to: "n9" }],
      caption: "next = curr.next (9)",
    },
    highlightLines: { startLine: 4, endLine: 4 },
  },
  {
    startFrame: 200,
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "none" },
        { id: "n7", value: 7, highlight: "active" },
        { id: "n9", value: 9, highlight: "none" },
      ],
      pointers: [
        { label: "prev", targetNodeId: "n3", color: colors.peach },
        { label: "curr", targetNodeId: "n7", color: colors.teal },
        { label: "next", targetNodeId: "n9", color: colors.sapphire },
      ],
      arrows: [{ from: "n7", to: "n3" }],
      caption: "curr.next = prev (3)",
    },
    highlightLines: { startLine: 5, endLine: 5 },
  },
  {
    startFrame: 240,
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "none" },
        { id: "n7", value: 7, highlight: "none" },
        { id: "n9", value: 9, highlight: "none" },
      ],
      pointers: [
        { label: "prev", targetNodeId: "n7", color: colors.peach },
        { label: "curr", targetNodeId: "n9", color: colors.teal },
        { label: "next", targetNodeId: "n9", color: colors.sapphire },
      ],
      arrows: [{ from: "n7", to: "n3" }],
      caption: "Advance: prev=7, curr=9",
    },
    highlightLines: { startLine: 6, endLine: 7 },
  },
  {
    startFrame: 280,
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "none" },
        { id: "n7", value: 7, highlight: "none" },
        { id: "n9", value: 9, highlight: "active" },
      ],
      pointers: [
        { label: "prev", targetNodeId: "n7", color: colors.peach },
        { label: "curr", targetNodeId: "n9", color: colors.teal },
        { label: "next", targetNodeId: null, color: colors.sapphire },
      ],
      arrows: [{ from: "n7", to: "n3" }],
      caption: "next = curr.next (null)",
    },
    highlightLines: { startLine: 4, endLine: 4 },
  },
  {
    startFrame: 320,
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "none" },
        { id: "n7", value: 7, highlight: "none" },
        { id: "n9", value: 9, highlight: "active" },
      ],
      pointers: [
        { label: "prev", targetNodeId: "n7", color: colors.peach },
        { label: "curr", targetNodeId: "n9", color: colors.teal },
        { label: "next", targetNodeId: null, color: colors.sapphire },
      ],
      arrows: [
        { from: "n7", to: "n3" },
        { from: "n9", to: "n7" },
      ],
      caption: "curr.next = prev (7)",
    },
    highlightLines: { startLine: 5, endLine: 5 },
  },
  {
    startFrame: 360,
    snapshot: {
      nodes: [
        { id: "n3", value: 3, highlight: "none" },
        { id: "n7", value: 7, highlight: "none" },
        { id: "n9", value: 9, highlight: "none" },
      ],
      pointers: [{ label: "head", targetNodeId: "n9", color: colors.lavender }],
      arrows: [
        { from: "n7", to: "n3" },
        { from: "n9", to: "n7" },
      ],
      caption: "head = prev — reversed!",
    },
    highlightLines: { startLine: 9, endLine: 9 },
  },
];

export const Reverse: React.FC<ReverseProps> = ({ tokens }) => {
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

