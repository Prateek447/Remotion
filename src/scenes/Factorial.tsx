import React from "react";
import type { ThemedToken } from "shiki";
import type { SceneStep } from "../lib/types";
import { CodeOnlyLayout } from "../components/CodeOnlyLayout";
import { SfxLayer } from "../components/SfxLayer";
import { NarrationLayer } from "../components/NarrationLayer";
import { AmbientLayer } from "../components/AmbientLayer";

/*
 * Code lines (0-indexed):
 *   0:  void permute(int[] arr, int start) {
 *   1:      if (start == arr.length) {
 *   2:          print(arr);
 *   3:          return;
 *   4:      }
 *   5:      for (int i = start; i < arr.length; i++) {
 *   6:          swap(arr, start, i);
 *   7:          permute(arr, start + 1);
 *   8:          swap(arr, start, i);
 *   9:      }
 *  10:  }
 *
 * startFrame values are PLACEHOLDERS — regenerate audio, run update-durations,
 * then recalculate: startFrame[n] = sum(frames[0..n-1]) + n*10
 */

const steps: SceneStep[] = [
  // Step 0 — introduce the permutation function
  {
    startFrame: 0,
    highlightLines: { startLine: 0, endLine: 10 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
    },
  },

  // Step 1 — base case: O(1) per leaf
  {
    startFrame: 406,
    highlightLines: { startLine: 1, endLine: 4 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      arrowLabel: "O(1)",
      arrowAnchorLine: 2,
    },
  },

  // Step 2 — level 0: loop runs n times → n recursive calls
  {
    startFrame: 710,
    highlightLines: { startLine: 5, endLine: 5 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      arrowLabel: "n",
      arrowAnchorLine: 5,
    },
  },

  // Step 3 — level 1: each of n calls loops n-1 times → n×(n-1) total
  {
    startFrame: 1044,
    highlightLines: { startLine: 7, endLine: 7 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      arrowLabel: "×(n−1)",
      arrowAnchorLine: 7,
    },
  },

  // Step 4 — pattern: multiply all levels down to 1 → n! total leaves
  {
    startFrame: 1336,
    highlightLines: { startLine: 5, endLine: 9 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      complexityDerivation: "n  ×  (n−1)  ×  (n−2)  ×  ⋯  ×  1  =  n!",
    },
  },

  // Step 5 — final: n! leaves × O(1) each = O(n!)
  {
    startFrame: 1666,
    highlightLines: { startLine: 0, endLine: 10 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      complexityDerivation: "O(n!) × O(1) = O(n!)",
      simplifyAtFrame: 400,
    },
  },
];

export const FACTORIAL_SCENE_FRAMES = 2015;

export interface FactorialProps {
  tokens: ThemedToken[][];
  format?: "youtube" | "reel";
}

export const Factorial: React.FC<FactorialProps> = ({ tokens, format = "youtube" }) => (
  <>
    <CodeOnlyLayout steps={steps} tokens={tokens} format={format} filename="Permutations.java" arrowEndOffset={350} />
    <AmbientLayer />
    <SfxLayer steps={steps} duckVolume={0.5} />
    <NarrationLayer sceneId="o-n-factorial" steps={steps} />
  </>
);
