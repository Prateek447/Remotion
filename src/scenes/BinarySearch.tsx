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
      caption: "Binary search eliminates half the candidates each step. To find the time complexity, we ask: how many halvings does it take to go from n elements down to 1?",
    },
  },

  // Step 1 — initialization: runs once → O(1)
  {
    startFrame: 358,
    highlightLines: { startLine: 1, endLine: 1 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      caption: "Two variables set up once before the search starts. Whether n=10 or n=10,000,000, still exactly 2 assignments. We write O(1) not O(2) — the actual constant is irrelevant because it never grows with n.",
      arrowLabel: "O(1)",
      arrowAnchorLine: 1,
    },
  },

  // Step 2 — while loop: halving the range each iteration → O(log n)
  {
    startFrame: 724,
    highlightLines: { startLine: 2, endLine: 7 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      caption: "Each iteration halves the range: n → n/2 → n/4 → … → 1. Solving n ÷ 2^k = 1 gives k = log₂(n) iterations. Double the input? Just one extra step. That slow growth is exactly what O(log n) means.",
      arrowLabel: "O(log n)",
      arrowAnchorLine: 2,
    },
  },

  // Step 3 — body: constant per iteration → O(1)
  {
    startFrame: 1405,
    highlightLines: { startLine: 3, endLine: 4 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      caption: "Inside the loop: compute mid, compare, update left or right — always 2 to 3 steps per pass, no matter how large n is. This is O(1) work per iteration. It scales the constant, not the loop count.",
      arrowLabel: "O(1)",
      arrowAnchorLine: 3,
    },
  },

  // Step 4 — conclusion
  {
    startFrame: 1660,
    highlightLines: { startLine: 0, endLine: 9 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      complexityDerivation: "O(1) + O(log n) × O(1) = O(log n)",
      simplifyAtFrame: 272, // fires when narrator says "is dominated and dropped"
    },
  },
];

export const BINARY_SEARCH_SCENE_FRAMES = 2787;

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
