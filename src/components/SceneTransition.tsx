import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { springPresets } from "../lib/theme";

interface SceneTransitionProps {
  durationInFrames: number;
  children: React.ReactNode;
}

const ENTER_FRAMES = 18;
const EXIT_FRAMES = 22;

export const SceneTransition: React.FC<SceneTransitionProps> = ({
  durationInFrames,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterP = spring({
    frame,
    fps,
    config: springPresets.slide,
  });
  const enterOpacity = interpolate(enterP, [0, 1], [0, 1]);
  const enterScale = interpolate(enterP, [0, 1], [0.97, 1]);
  const enterY = interpolate(enterP, [0, 1], [12, 0]);

  const exitStart = durationInFrames - EXIT_FRAMES;
  const exitT =
    frame >= exitStart
      ? interpolate(frame, [exitStart, durationInFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;
  const exitOpacity = interpolate(exitT, [0, 1], [1, 0]);
  const exitScale = interpolate(exitT, [0, 1], [1, 0.97]);
  const exitY = interpolate(exitT, [0, 1], [0, -8]);

  const opacity = enterOpacity * exitOpacity;
  const scale = enterScale * exitScale;
  const translateY = enterY + exitY;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        opacity,
        transform: `scale(${scale}) translateY(${translateY}px)`,
        transformOrigin: "center center",
      }}
    >
      {children}
    </div>
  );
};
