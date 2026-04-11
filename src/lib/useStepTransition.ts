import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import type { SceneStep } from "./types";
import { springPresets } from "./theme";

export interface StepTransition {
  current: SceneStep;
  previous: SceneStep;
  t: number;
  localFrame: number;
  stepIndex: number;
}

export function useStepTransition(steps: SceneStep[]): StepTransition {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  let stepIndex = 0;
  for (let i = steps.length - 1; i >= 0; i--) {
    if (frame >= steps[i].startFrame) {
      stepIndex = i;
      break;
    }
  }

  const step = steps[stepIndex];
  const prevStep = stepIndex > 0 ? steps[stepIndex - 1] : step;
  const localFrame = frame - step.startFrame;

  const t = spring({
    frame: localFrame,
    fps,
    config: springPresets.transition,
  });

  return { current: step, previous: prevStep, t, localFrame, stepIndex };
}
