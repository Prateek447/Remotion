import React from "react";
import type { ThemedToken } from "shiki";
import type { SceneStep } from "../lib/types";
import { CodeOnlyLayout } from "../components/CodeOnlyLayout";
import { SfxLayer } from "../components/SfxLayer";
import { NarrationLayer } from "../components/NarrationLayer";
import { AmbientLayer } from "../components/AmbientLayer";

/*
 * Code lines (0-indexed):
 *   0: int binarySearch(int[] arr, int target) {
 *   1:     int left = 0, right = arr.length - 1;
 *   2:     while (left <= right) {
 *   3:         int mid = left + (right - left) / 2;
 *   4:         if (arr[mid] == target) return mid;
 *   5:         if (arr[mid] < target) left = mid + 1;
 *   6:         else right = mid - 1;
 *   7:     }
 *   8:     return -1;
 *   9: }
 *
 * startFrame values are placeholders — recalculate after audio generation.
 */

const steps: SceneStep[] = [
  // Step 0 — show the full function
  {
    startFrame: 0,
    highlightLines: { startLine: 0, endLine: 9 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
    },
  },

  // Step 1 — initialization: runs once → O(1)
  {
    startFrame: 411,
    highlightLines: { startLine: 1, endLine: 1 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      arrowLabel: "O(1)",
      arrowAnchorLine: 1,
    },
  },

  // Step 2 — while loop: halving the range each iteration → O(log n)
  {
    startFrame: 771,
    highlightLines: { startLine: 2, endLine: 7 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      arrowLabel: "O(log n)",
      arrowAnchorLine: 2,
    },
  },

  // Step 3 — body: constant per iteration → O(1)
  {
    startFrame: 1203,
    highlightLines: { startLine: 3, endLine: 4 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      arrowLabel: "O(1)",
      arrowAnchorLine: 3,
    },
  },

  // Step 4 — conclusion
  {
    startFrame: 1485,
    highlightLines: { startLine: 0, endLine: 9 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      complexityDerivation: "O(1) + O(log n) × O(1) = O(log n)",
      simplifyAtFrame: 272, // fires when narrator says "is dominated and dropped"
    },
  },
];

export const BINARY_SEARCH_SCENE_FRAMES = 1765;

export interface BinarySearchProps {
  tokens: ThemedToken[][];
  format?: "youtube" | "reel";
}

export const BinarySearch: React.FC<BinarySearchProps> = ({ tokens, format = "youtube" }) => (
  <>
    <CodeOnlyLayout steps={steps} tokens={tokens} format={format} filename="BinarySearch.java" arrowEndOffset={120} />
    <AmbientLayer />
    <SfxLayer steps={steps} duckVolume={0.5} />
    <NarrationLayer sceneId="o-log-n" steps={steps} />
  </>
);
