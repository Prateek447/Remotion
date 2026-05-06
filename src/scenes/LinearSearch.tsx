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
      caption: "Time complexity answers: if the input has n elements, how many operations run? We look at each part of the code, count how it scales with n, then combine.",
    },
  },

  // Step 1 — the for loop: one iteration per element → O(n)
  {
    startFrame: 301,
    highlightLines: { startLine: 1, endLine: 3 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      caption: "The loop runs once per element — n elements means n iterations. Double the array, iterations double too. That's linear growth → O(n). The setup 'i=0' runs once and is dropped: a constant added to n still grows at the same rate.",
      arrowLabel: "O(n)",
      arrowAnchorLine: 1,
    },
  },

  // Step 2 — the body: constant work per iteration
  {
    startFrame: 857,
    highlightLines: { startLine: 2, endLine: 2 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      caption: "One comparison per pass — always exactly 1 step, whether n=10 or n=10,000,000. Code whose step count never changes as n grows is defined as O(1). Even O(5) is still O(1): the exact constant is irrelevant, only the growth rate matters.",
      arrowLabel: "O(1)",
      arrowAnchorLine: 2,
    },
  },

  // Step 3 — return -1 outside the loop
  {
    startFrame: 1388,
    highlightLines: { startLine: 4, endLine: 4 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      caption: "Outside the loop — executes at most once, completely independent of n. Whether n=1 or n=1,000,000, still just 1 operation. Anything with a fixed step count, no matter the input, is O(1).",
      arrowLabel: "O(1)",
      arrowAnchorLine: 4,
    },
  },

  // Step 4 — combine: O(n) × O(1) + O(1) = O(n)
  {
    startFrame: 1591,
    highlightLines: { startLine: 0, endLine: 5 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      complexityDerivation: "O(n) × O(1) + O(1) = O(n)",
      simplifyAtFrame: 375, // fires when narrator says "simplifies to"
    },
  },
];

export const LINEAR_SEARCH_SCENE_FRAMES = 2625;

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
