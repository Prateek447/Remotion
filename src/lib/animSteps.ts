import type { SceneStep } from "./types";

export const ANIM_FRAMES_PER_STEP = 50;

export function compressStepsForAnim(steps: SceneStep[]): SceneStep[] {
  const animSteps = steps.filter((s) => !s.excludeFromAnim);
  return animSteps.map((step, i) => ({ ...step, startFrame: i * ANIM_FRAMES_PER_STEP }));
}
