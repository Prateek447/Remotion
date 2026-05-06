import React from "react";
import { Audio, staticFile, useVideoConfig } from "remotion";

interface AmbientLayerProps {
  volume?: number;
  animOnly?: boolean;
}

export const AmbientLayer: React.FC<AmbientLayerProps> = ({ volume, animOnly = false }) => {
  const effectiveVolume = volume ?? (animOnly ? 0.18 : 0.06);
  return <Audio src={staticFile("sfx/ambient-pad.mp3")} volume={effectiveVolume} loop />;
};
