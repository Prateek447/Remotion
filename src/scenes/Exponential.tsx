import React from "react";
import type { ThemedToken } from "shiki";
import type { SceneStep } from "../lib/types";
import { CodeOnlyLayout } from "../components/CodeOnlyLayout";
import { SfxLayer } from "../components/SfxLayer";
import { NarrationLayer } from "../components/NarrationLayer";
import { AmbientLayer } from "../components/AmbientLayer";

/*
 * Code lines (0-indexed):
 *   0: int fib(int n) {
 *   1:     if (n <= 1) return n;
 *   2:     return fib(n - 1) + fib(n - 2);
 *   3: }
 *
 * startFrame values are placeholders — recalculate after audio generation.
 */

const steps: SceneStep[] = [
  // Step 0 — show the full function
  {
    startFrame: 0,
    highlightLines: { startLine: 0, endLine: 3 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
    },
  },

  // Step 1 — base case: O(1) per leaf
  {
    startFrame: 295,
    highlightLines: { startLine: 1, endLine: 1 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      arrowLabel: "O(1)",
      arrowAnchorLine: 1,
    },
  },

  // Step 2 — two recursive calls → 2^n total
  {
    startFrame: 571,
    highlightLines: { startLine: 2, endLine: 2 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      arrowLabel: "2^n calls",
      arrowAnchorLine: 2,
    },
  },

  // Step 3 — conclusion
  {
    startFrame: 928,
    highlightLines: { startLine: 0, endLine: 3 },
    snapshot: {
      nodes: [], pointers: [], arrows: [],
      complexityDerivation: "O(2^n) × O(1) = O(2^n)",
      simplifyAtFrame: 380,
    },
  },
];

export const EXPONENTIAL_SCENE_FRAMES = 1380;

export interface ExponentialProps {
  tokens: ThemedToken[][];
  format?: "youtube" | "reel";
}

export const Exponential: React.FC<ExponentialProps> = ({ tokens, format = "youtube" }) => (
  <>
    <CodeOnlyLayout steps={steps} tokens={tokens} format={format} filename="Fibonacci.java" />
    <AmbientLayer />
    <SfxLayer steps={steps} duckVolume={0.5} />
    <NarrationLayer sceneId="o-2n" steps={steps} />
  </>
);
