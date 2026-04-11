import React from "react";
import { Series } from "remotion";
import type { ThemedToken } from "shiki";
import type { TransitionPair } from "./Root";
import { TitleCard } from "./components/TitleCard";
import { TitleSfx } from "./components/SfxLayer";
import { SceneTransition } from "./components/SceneTransition";
import { CodeMagicMove } from "./components/CodeMagicMove";
import { InsertHead } from "./scenes/InsertHead";
import { InsertTail } from "./scenes/InsertTail";
import { DeleteNode } from "./scenes/DeleteNode";
import { SearchNode } from "./scenes/SearchNode";
import { Traverse } from "./scenes/Traverse";
import { Reverse } from "./scenes/Reverse";
import { DetectCycle } from "./scenes/DetectCycle";
import { MergeLists } from "./scenes/MergeLists";

export interface FullVideoProps {
  insertHeadTokens: ThemedToken[][];
  insertTailTokens: ThemedToken[][];
  deleteTokens: ThemedToken[][];
  searchTokens: ThemedToken[][];
  traverseTokens: ThemedToken[][];
  reverseTokens: ThemedToken[][];
  detectCycleTokens: ThemedToken[][];
  mergeTokens: ThemedToken[][];
  transitions: TransitionPair[];
}

const TITLE_FRAMES = 60;
const TRANSITION_FRAMES = 45;

const scenes = [
  { title: "Insert at Head", complexity: "O(1)", frames: 2756, key: "insertHead" },
  { title: "Insert at Tail", complexity: "O(n)", frames: 2911, key: "insertTail" },
  { title: "Delete Node", complexity: "O(n)", frames: 315, key: "delete" },
  { title: "Search", complexity: "O(n)", frames: 315, key: "search" },
  { title: "Traverse", complexity: "O(n)", frames: 280, key: "traverse" },
  { title: "Reverse", complexity: "O(n)", frames: 400, key: "reverse" },
  { title: "Detect Cycle", complexity: "O(n)", subtitle: "Floyd's Algorithm", frames: 360, key: "detectCycle" },
  { title: "Merge Sorted Lists", complexity: "O(n + m)", frames: 400, key: "merge" },
] as const;

function renderScene(key: string, props: FullVideoProps) {
  switch (key) {
    case "insertHead": return <InsertHead tokens={props.insertHeadTokens} />;
    case "insertTail": return <InsertTail tokens={props.insertTailTokens} />;
    case "delete": return <DeleteNode tokens={props.deleteTokens} />;
    case "search": return <SearchNode tokens={props.searchTokens} />;
    case "traverse": return <Traverse tokens={props.traverseTokens} />;
    case "reverse": return <Reverse tokens={props.reverseTokens} />;
    case "detectCycle": return <DetectCycle tokens={props.detectCycleTokens} />;
    case "merge": return <MergeLists tokens={props.mergeTokens} />;
    default: return null;
  }
}

export const FullVideo: React.FC<FullVideoProps> = (props) => {
  return (
    <Series>
      <Series.Sequence durationInFrames={90}>
        <SceneTransition durationInFrames={90}>
          <TitleCard
            title="Linked List Operations"
            subtitle="A visual guide to fundamental data structures"
          />
        </SceneTransition>
        <TitleSfx />
      </Series.Sequence>

      {scenes.flatMap((scene, idx) => {
        const items: React.ReactNode[] = [
          <Series.Sequence key={`title-${scene.key}`} durationInFrames={TITLE_FRAMES}>
            <SceneTransition durationInFrames={TITLE_FRAMES}>
              <TitleCard
                title={scene.title}
                complexity={scene.complexity}
                subtitle={"subtitle" in scene ? (scene as any).subtitle : undefined}
              />
            </SceneTransition>
            <TitleSfx />
          </Series.Sequence>,

          <Series.Sequence key={`scene-${scene.key}`} durationInFrames={scene.frames}>
            <SceneTransition durationInFrames={scene.frames}>
              {renderScene(scene.key, props)}
            </SceneTransition>
          </Series.Sequence>,
        ];

        if (idx < scenes.length - 1 && props.transitions[idx]) {
          items.push(
            <Series.Sequence key={`transition-${scene.key}`} durationInFrames={TRANSITION_FRAMES}>
              <CodeMagicMove
                fromInfo={props.transitions[idx].from}
                toInfo={props.transitions[idx].to}
              />
            </Series.Sequence>,
          );
        }

        return items;
      })}
    </Series>
  );
};

export const FULL_VIDEO_DURATION =
  90 +
  scenes.reduce((sum, s, idx) => {
    const sceneTotal = TITLE_FRAMES + s.frames;
    const transitionTotal = idx < scenes.length - 1 ? TRANSITION_FRAMES : 0;
    return sum + sceneTotal + transitionTotal;
  }, 0);
