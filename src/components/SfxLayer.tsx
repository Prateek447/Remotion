import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import type { SceneStep } from "../lib/types";

const sfx = {
  pop: staticFile("sfx/pop.mp3"),
  swoosh: staticFile("sfx/swoosh.mp3"),
  tick: staticFile("sfx/tick.mp3"),
  ding: staticFile("sfx/ding.mp3"),
  success: staticFile("sfx/success.mp3"),
  whoosh: staticFile("sfx/whoosh.mp3"),
  keystroke: staticFile("sfx/keystroke.mp3"),
  slide: staticFile("sfx/slide.mp3"),
  remove: staticFile("sfx/remove.mp3"),
  connect: staticFile("sfx/connect.mp3"),
  codeslide: staticFile("sfx/codeslide.mp3"),
  alert: staticFile("sfx/alert.mp3"),
  focus: staticFile("sfx/focus.mp3"),
  resolve: staticFile("sfx/resolve.mp3"),
  errorBuzz: staticFile("sfx/error-buzz.mp3"),
  typingBurst: staticFile("sfx/typing-burst.mp3"),
  phaseTransition: staticFile("sfx/phase-transition.mp3"),
  successChime: staticFile("sfx/success-chime.mp3"),
  mouseClick: staticFile("sfx/mouseClick.mp3"),
};

interface SfxEvent {
  src: string;
  volume: number;
  offset: number;
  duration?: number;
  startFrom?: number;
}

const PHASE_GAP_THRESHOLD = 150;

function detectEvents(
  step: SceneStep,
  prevStep: SceneStep | null,
  isFirst: boolean,
  isLast: boolean,
  animOnly = false,
): SfxEvent[] {
  const v = animOnly ? 1.5 : 1.0;
  const events: SfxEvent[] = [];
  const snap = step.snapshot;
  const prev = prevStep?.snapshot;

  if (isLast) {
    events.push({ src: sfx.successChime, volume: animOnly ? 0.7 : 0.4, offset: 0 });
    return events;
  }

  if (animOnly) {
    // Consistent beat on every step so viewers can follow the rhythm
    events.push({ src: sfx.ding, volume: 0.38, offset: 0 });
    // Phase transition: highlight line jumps backward = new loop iteration
    if (prevStep) {
      const lineDiff = step.highlightLines.startLine - prevStep.highlightLines.startLine;
      if (lineDiff < -1) {
        events.push({ src: sfx.phaseTransition, volume: 0.35, offset: 2 });
      }
    }
  } else {
    const isPhaseTransition =
      prevStep && step.startFrame - prevStep.startFrame >= PHASE_GAP_THRESHOLD;
    if (isPhaseTransition) {
      events.push({ src: sfx.phaseTransition, volume: 0.25, offset: 0 });
    }
    const codeLineMoved =
      !prevStep || prevStep.highlightLines.startLine !== step.highlightLines.startLine;
    if (codeLineMoved) {
      events.push({ src: sfx.mouseClick, volume: 0.45, offset: 0 });
    }
  }

  if (!prev) {
    if (isFirst) {
      events.push({ src: sfx.focus, volume: animOnly ? 0.45 : 0.25, offset: 5 });
    }
    return events;
  }

  if (snap.newNode && !prev.newNode) {
    events.push({ src: sfx.pop, volume: 0.6 * v, offset: 5 });
  }

  if (!snap.newNode && prev.newNode) {
    events.push({ src: sfx.connect, volume: 0.55 * v, offset: 4 });
  }

  const currNodeCount = snap.nodes.length;
  const prevNodeCount = prev.nodes.length;
  if (currNodeCount > prevNodeCount && !snap.newNode) {
    events.push({ src: sfx.pop, volume: 0.35 * v, offset: 3 });
  }
  if (currNodeCount < prevNodeCount) {
    events.push({ src: sfx.remove, volume: 0.35 * v, offset: 3 });
  }

  const newArrowCount = snap.arrows.length;
  const oldArrowCount = prev.arrows.length;
  if (newArrowCount > oldArrowCount) {
    events.push({ src: sfx.swoosh, volume: 0.45 * v, offset: 6 });
  }
  if (newArrowCount < oldArrowCount) {
    events.push({ src: sfx.remove, volume: 0.4 * v, offset: 5 });
  }

  const pointerMoved = snap.pointers.some((ptr) => {
    const old = prev.pointers.find((p) => p.label === ptr.label);
    return old && old.targetNodeId !== ptr.targetNodeId;
  });
  if (pointerMoved) {
    events.push({ src: sfx.slide, volume: 0.5 * v, offset: 0, duration: 55, startFrom: 5 });
  }

  const newPointer = snap.pointers.some(
    (ptr) => !prev.pointers.find((p) => p.label === ptr.label),
  );
  if (newPointer) {
    events.push({ src: sfx.focus, volume: 0.25 * v, offset: 4 });
  }

  const removedPointer = prev.pointers.some(
    (ptr) => !snap.pointers.find((p) => p.label === ptr.label),
  );
  if (removedPointer) {
    events.push({ src: sfx.remove, volume: 0.15 * v, offset: 3 });
  }

  const hasNewHighlight = snap.nodes.some((n) => {
    if (!n.highlight || n.highlight === "none") return false;
    const prevNode = prev.nodes.find((p) => p.id === n.id);
    return !prevNode || prevNode.highlight !== n.highlight;
  });

  if (hasNewHighlight) {
    const highlightType = snap.nodes.find((n) => {
      if (!n.highlight || n.highlight === "none") return false;
      const prevNode = prev.nodes.find((p) => p.id === n.id);
      return !prevNode || prevNode.highlight !== n.highlight;
    })?.highlight;

    if (highlightType === "found") {
      events.push({ src: sfx.resolve, volume: 0.35 * v, offset: 4 });
    } else if (highlightType === "removing") {
      events.push({ src: sfx.alert, volume: 0.3 * v, offset: 3 });
    } else if (highlightType === "error") {
      events.push({ src: sfx.errorBuzz, volume: 0.4 * v, offset: 3 });
    } else if (highlightType === "active") {
      events.push({ src: sfx.ding, volume: 0.3 * v, offset: 3 });
    } else if (highlightType === "new") {
      events.push({ src: sfx.pop, volume: 0.35 * v, offset: 4 });
    }
  }

  if (!animOnly) {
    const baseCount = events.filter(
      (e) => e.src === sfx.mouseClick || e.src === sfx.phaseTransition,
    ).length;
    if (events.length === baseCount) {
      events.push({ src: sfx.tick, volume: 0.2, offset: 0 });
    }
  }

  return events;
}

interface SfxLayerProps {
  steps: SceneStep[];
  duckVolume?: number;
  animOnly?: boolean;
}

export const SfxLayer: React.FC<SfxLayerProps> = ({ steps, duckVolume = 1, animOnly = false }) => {
  return (
    <>
      {steps.map((step, i) => {
        const events = detectEvents(
          step,
          i > 0 ? steps[i - 1] : null,
          i === 0,
          i === steps.length - 1,
          animOnly,
        );
        return events.map((evt, j) => (
          <Sequence
            key={`${i}-${j}`}
            from={step.startFrame + evt.offset}
            durationInFrames={evt.duration ?? 30}
          >
            <Audio src={evt.src} volume={evt.volume * duckVolume} startFrom={evt.startFrom ?? 0} />
          </Sequence>
        ));
      })}
    </>
  );
};

export const TitleSfx: React.FC = () => (
  <Audio src={sfx.whoosh} volume={0.3} />
);
