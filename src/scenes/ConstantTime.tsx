import React from "react";
import type { ThemedToken } from "shiki";
import type { SceneStep } from "../lib/types";
import { CodeOnlyLayout } from "../components/CodeOnlyLayout";
import { SfxLayer } from "../components/SfxLayer";
import { NarrationLayer } from "../components/NarrationLayer";
import { AmbientLayer } from "../components/AmbientLayer";

/*
 * Code lines (0-indexed):
 *   0: public void insertAtHead(int val) {
 *   1:     Node newNode = new Node(val);
 *   2:     newNode.next = head;
 *   3:     head = newNode;
 *   4:     size++;
 *   5: }
 *
 * startFrame values are placeholders — recalculate after audio generation.
 */

const steps: SceneStep[] = [
  // Step 0 — show the full function
  {
    startFrame: 0,
    highlightLines: { startLine: 0, endLine: 5 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
    },
  },

  // Step 1 — line 1: Node newNode = new Node(val)
  {
    startFrame: 392,
    highlightLines: { startLine: 1, endLine: 1 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      arrowLabel: "O(1)",
      arrowAnchorLine: 1,
    },
  },

  // Step 2 — line 2: newNode.next = head
  {
    startFrame: 704,
    highlightLines: { startLine: 2, endLine: 2 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      arrowLabel: "O(1)",
      arrowAnchorLine: 2,
    },
  },

  // Step 3 — line 3: head = newNode
  {
    startFrame: 1029,
    highlightLines: { startLine: 3, endLine: 3 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      arrowLabel: "O(1)",
      arrowAnchorLine: 3,
    },
  },

  // Step 4 — line 4: size++
  {
    startFrame: 1297,
    highlightLines: { startLine: 4, endLine: 4 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      arrowLabel: "O(1)",
      arrowAnchorLine: 4,
    },
  },

  // Step 5 — combine: O(1) + O(1) + O(1) + O(1) = O(1)
  {
    startFrame: 1537,
    highlightLines: { startLine: 0, endLine: 5 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      complexityDerivation: "O(1) + O(1) + O(1) + O(1) = O(1)",
      simplifyAtFrame: 300,
    },
  },
];

export const CONSTANT_TIME_SCENE_FRAMES = 1892;

export interface ConstantTimeProps {
  tokens: ThemedToken[][];
  format?: "youtube" | "reel";
}

export const ConstantTime: React.FC<ConstantTimeProps> = ({ tokens, format = "youtube" }) => (
  <>
    <CodeOnlyLayout steps={steps} tokens={tokens} format={format} filename="LinkedList.java" arrowEndOffset={120} />
    <AmbientLayer />
    <SfxLayer steps={steps} duckVolume={0.5} />
    <NarrationLayer sceneId="o-1" steps={steps} />
  </>
);
