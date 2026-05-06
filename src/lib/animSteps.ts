import type { SceneStep } from "./types";

export const ANIM_FRAMES_PER_STEP = 50;

export function compressStepsForAnim(steps: SceneStep[]): SceneStep[] {
  return steps.map((step, i) => ({ ...step, startFrame: i * ANIM_FRAMES_PER_STEP }));
}
