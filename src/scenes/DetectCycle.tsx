import React from "react";
import type { ThemedToken } from "shiki";
import type { SceneStep } from "../lib/types";
import { SplitLayout } from "../components/SplitLayout";
import { LinkedListDiagram } from "../components/LinkedListDiagram";
import { CodeBlock } from "../components/CodeBlock";
import { CodeWindow } from "../components/CodeWindow";
import { SfxLayer } from "../components/SfxLayer";
import { colors } from "../lib/theme";

interface DetectCycleProps {
  tokens: ThemedToken[][];
}

const steps: SceneStep[] = [
  {
    startFrame: 0,
    snapshot: {
      nodes: [
        { id: "n1", value: 1, highlight: "none" },
        { id: "n2", value: 2, highlight: "none" },
        { id: "n3", value: 3, highlight: "none" },
        { id: "n4", value: 4, highlight: "none" },
      ],
      pointers: [
        { label: "slow", targetNodeId: "n1", color: colors.green },
        { label: "fast", targetNodeId: "n1", color: colors.red },
      ],
      arrows: [
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n4" },
        { from: "n4", to: "n2", dashed: true },
      ],
      caption: "Detect cycle — Floyd's algorithm",
    },
    highlightLines: { startLine: 0, endLine: 2 },
  },
  {
    startFrame: 45,
    snapshot: {
      nodes: [
        { id: "n1", value: 1, highlight: "none" },
        { id: "n2", value: 2, highlight: "none" },
        { id: "n3", value: 3, highlight: "none" },
        { id: "n4", value: 4, highlight: "none" },
      ],
      pointers: [
        { label: "slow", targetNodeId: "n2", color: colors.green },
        { label: "fast", targetNodeId: "n3", color: colors.red },
      ],
      arrows: [
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n4" },
        { from: "n4", to: "n2", dashed: true },
      ],
      caption: "slow moves 1 step, fast moves 2",
    },
    highlightLines: { startLine: 3, endLine: 5 },
  },
  {
    startFrame: 90,
    snapshot: {
      nodes: [
        { id: "n1", value: 1, highlight: "none" },
        { id: "n2", value: 2, highlight: "none" },
        { id: "n3", value: 3, highlight: "none" },
        { id: "n4", value: 4, highlight: "none" },
      ],
      pointers: [
        { label: "slow", targetNodeId: "n2", color: colors.green },
        { label: "fast", targetNodeId: "n3", color: colors.red },
      ],
      arrows: [
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n4" },
        { from: "n4", to: "n2", dashed: true },
      ],
      caption: "slow(2) != fast(3), continue",
    },
    highlightLines: { startLine: 6, endLine: 6 },
  },
  {
    startFrame: 135,
    snapshot: {
      nodes: [
        { id: "n1", value: 1, highlight: "none" },
        { id: "n2", value: 2, highlight: "none" },
        { id: "n3", value: 3, highlight: "none" },
        { id: "n4", value: 4, highlight: "none" },
      ],
      pointers: [
        { label: "slow", targetNodeId: "n3", color: colors.green },
        { label: "fast", targetNodeId: "n2", color: colors.red },
      ],
      arrows: [
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n4" },
        { from: "n4", to: "n2", dashed: true },
      ],
      caption: "slow=3, fast wraps to 2",
    },
    highlightLines: { startLine: 4, endLine: 5 },
  },
  {
    startFrame: 180,
    snapshot: {
      nodes: [
        { id: "n1", value: 1, highlight: "none" },
        { id: "n2", value: 2, highlight: "none" },
        { id: "n3", value: 3, highlight: "none" },
        { id: "n4", value: 4, highlight: "none" },
      ],
      pointers: [
        { label: "slow", targetNodeId: "n3", color: colors.green },
        { label: "fast", targetNodeId: "n2", color: colors.red },
      ],
      arrows: [
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n4" },
        { from: "n4", to: "n2", dashed: true },
      ],
      caption: "slow(3) != fast(2), continue",
    },
    highlightLines: { startLine: 6, endLine: 6 },
  },
  {
    startFrame: 225,
    snapshot: {
      nodes: [
        { id: "n1", value: 1, highlight: "none" },
        { id: "n2", value: 2, highlight: "none" },
        { id: "n3", value: 3, highlight: "none" },
        { id: "n4", value: 4, highlight: "found" },
      ],
      pointers: [
        { label: "slow", targetNodeId: "n4", color: colors.green },
        { label: "fast", targetNodeId: "n4", color: colors.red },
      ],
      arrows: [
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n4" },
        { from: "n4", to: "n2", dashed: true },
      ],
      caption: "slow=4, fast=4",
    },
    highlightLines: { startLine: 4, endLine: 5 },
  },
  {
    startFrame: 270,
    snapshot: {
      nodes: [
        { id: "n1", value: 1, highlight: "none" },
        { id: "n2", value: 2, highlight: "none" },
        { id: "n3", value: 3, highlight: "none" },
        { id: "n4", value: 4, highlight: "found" },
      ],
      pointers: [
        { label: "slow", targetNodeId: "n4", color: colors.green },
        { label: "fast", targetNodeId: "n4", color: colors.red },
      ],
      arrows: [
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n4" },
        { from: "n4", to: "n2", dashed: true },
      ],
      caption: "slow == fast — cycle detected!",
    },
    highlightLines: { startLine: 6, endLine: 7 },
  },
  {
    startFrame: 320,
    snapshot: {
      nodes: [
        { id: "n1", value: 1, highlight: "none" },
        { id: "n2", value: 2, highlight: "none" },
        { id: "n3", value: 3, highlight: "none" },
        { id: "n4", value: 4, highlight: "found" },
      ],
      pointers: [
        { label: "slow", targetNodeId: "n4", color: colors.green },
        { label: "fast", targetNodeId: "n4", color: colors.red },
      ],
      arrows: [
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n4" },
        { from: "n4", to: "n2", dashed: true },
      ],
      caption: "return true",
    },
    highlightLines: { startLine: 7, endLine: 7 },
  },
];

export const DetectCycle: React.FC<DetectCycleProps> = ({ tokens }) => {
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
