import React from "react";
import type { ThemedToken } from "shiki";
import type { SceneStep } from "../lib/types";
import { CodeOnlyLayout } from "../components/CodeOnlyLayout";
import { SfxLayer } from "../components/SfxLayer";
import { NarrationLayer } from "../components/NarrationLayer";
import { AmbientLayer } from "../components/AmbientLayer";

/*
 * Code lines (0-indexed):
 *   0: int linearSearch(int[] arr, int target) {
 *   1:     for (int i = 0; i < arr.length; i++) {
 *   2:         if (arr[i] == target) return i;
 *   3:     }
 *   4:     return -1;
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

  // Step 1 — the for loop: one iteration per element → O(n)
  {
    startFrame: 333,
    highlightLines: { startLine: 1, endLine: 3 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      arrowLabel: "O(n)",
      arrowAnchorLine: 1,
    },
  },

  // Step 2 — the body: constant work per iteration
  {
    startFrame: 738,
    highlightLines: { startLine: 2, endLine: 2 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      arrowLabel: "O(1)",
      arrowAnchorLine: 2,
    },
  },

  // Step 3 — return -1 outside the loop
  {
    startFrame: 1212,
    highlightLines: { startLine: 4, endLine: 4 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      arrowLabel: "O(1)",
      arrowAnchorLine: 4,
    },
  },

  // Step 4 — combine: O(n) × O(1) + O(1) = O(n)
  {
    startFrame: 1470,
    highlightLines: { startLine: 0, endLine: 5 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      complexityDerivation: "O(n) × O(1) + O(1) = O(n)",
      simplifyAtFrame: 375, // fires when narrator says "simplifies to"
    },
  },
];

export const LINEAR_SEARCH_SCENE_FRAMES = 1731;

export interface LinearSearchProps {
  tokens: ThemedToken[][];
  format?: "youtube" | "reel";
}

export const LinearSearch: React.FC<LinearSearchProps> = ({ tokens, format = "youtube" }) => (
  <>
    <CodeOnlyLayout steps={steps} tokens={tokens} format={format} filename="LinearSearch.java" arrowEndOffset={120} />
    <AmbientLayer />
    <SfxLayer steps={steps} duckVolume={0.5} />
    <NarrationLayer sceneId="o-n" steps={steps} />
  </>
);
