import React from "react";
import { Audio, staticFile, useVideoConfig } from "remotion";

interface AmbientLayerProps {
  volume?: number;
}

export const AmbientLayer: React.FC<AmbientLayerProps> = ({
  volume = 0.06,
}) => {
  return <Audio src={staticFile("sfx/ambient-pad.mp3")} volume={volume} loop />;
};
