import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import type { SceneStep } from "../lib/types";
import { narrationDurationsByScene } from "../data/narration-scripts";

interface NarrationTrack {
  stepIndex: number;
  audioFile: string;
  startFrame: number;
  durationFrames: number;
}

function buildTracks(sceneId: string, steps: SceneStep[]): NarrationTrack[] {
  const durations = narrationDurationsByScene[sceneId];
  if (!durations) return [];

  return durations
    .map((d) => {
      const step = steps[d.step];
      if (!step) return null;
      return {
        stepIndex: d.step,
        audioFile: `narration/${sceneId}/step-${d.step}.mp3`,
        startFrame: step.startFrame,
        durationFrames: d.frames + 5,
      };
    })
    .filter((t): t is NarrationTrack => t !== null);
}

interface NarrationLayerProps {
  sceneId: string;
  steps: SceneStep[];
  volume?: number;
}

export const NarrationLayer: React.FC<NarrationLayerProps> = ({
  sceneId,
  steps,
  volume = 0.85,
}) => {
  const tracks = buildTracks(sceneId, steps);

  return (
    <>
      {tracks.map((track) => (
        <Sequence
          key={`narr-${track.stepIndex}`}
          from={track.startFrame}
          durationInFrames={track.durationFrames}
        >
          <Audio src={staticFile(track.audioFile)} volume={volume} />
        </Sequence>
      ))}
    </>
  );
};
