import React from "react";
import { Series } from "remotion";
import { TitleCard } from "./components/TitleCard";
import { OutroCard } from "./components/OutroCard";
import { SceneTransition } from "./components/SceneTransition";
import { TitleSfx } from "./components/SfxLayer";

export const INTRO_FRAMES = 75;
export const OUTRO_FRAMES = 75;

interface StandaloneVideoProps {
  title: string;
  complexity: string;
  subtitle?: string;
  sceneFrames: number;
  nextTopic?: string;
  children: React.ReactNode;
}

export const StandaloneVideo: React.FC<StandaloneVideoProps> = ({
  title,
  complexity,
  subtitle,
  sceneFrames,
  nextTopic,
  children,
}) => {
  return (
    <Series>
      <Series.Sequence key="intro" durationInFrames={INTRO_FRAMES}>
        <SceneTransition durationInFrames={INTRO_FRAMES}>
          <TitleCard title={title} complexity={complexity} subtitle={subtitle} />
        </SceneTransition>
        <TitleSfx />
      </Series.Sequence>

      <Series.Sequence key="scene" durationInFrames={sceneFrames}>
        <SceneTransition durationInFrames={sceneFrames}>
          {children}
        </SceneTransition>
      </Series.Sequence>

      <Series.Sequence key="outro" durationInFrames={OUTRO_FRAMES}>
        <SceneTransition durationInFrames={OUTRO_FRAMES}>
          <OutroCard title={title} nextTopic={nextTopic} />
        </SceneTransition>
        <TitleSfx />
      </Series.Sequence>
    </Series>
  );
};

export function standaloneDuration(sceneFrames: number): number {
  return INTRO_FRAMES + sceneFrames + OUTRO_FRAMES;
}
