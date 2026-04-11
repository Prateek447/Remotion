import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const SCENE_ID = "insert-head";
const NARRATION_DIR = path.join("public", "narration", SCENE_ID);
const FPS = 30;
const BUFFER = 10;

function getAudioDuration(filePath) {
  const result = execSync(
    `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`,
    { encoding: "utf-8" },
  );
  return parseFloat(result.trim());
}

const files = fs.readdirSync(NARRATION_DIR)
  .filter(f => f.match(/^step-\d+\.mp3$/))
  .sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)[0]);
    const numB = parseInt(b.match(/\d+/)[0]);
    return numA - numB;
  });

console.log(`Found ${files.length} narration files in ${NARRATION_DIR}\n`);

const durations = [];
let cumulative = 0;

for (const file of files) {
  const step = parseInt(file.match(/\d+/)[0]);
  const filePath = path.join(NARRATION_DIR, file);
  const duration = getAudioDuration(filePath);
  const frames = Math.ceil(duration * FPS);

  durations.push({ step, duration: +duration.toFixed(2), frames });

  console.log(`  Step ${step}: startFrame=${cumulative}  duration=${duration.toFixed(2)}s  frames=${frames}`);
  cumulative += frames + BUFFER;
}

const totalFrames = cumulative;
console.log(`\n  Total scene frames: ${totalFrames} (~${(totalFrames / FPS).toFixed(1)}s)`);

console.log("\n--- Copy this into src/data/narration-scripts.ts ---\n");
console.log("export const insertHeadDurations: NarrationDuration[] = [");
for (const d of durations) {
  console.log(`  { step: ${d.step}, duration: ${d.duration}, frames: ${d.frames} },`);
}
console.log("];");

console.log("\n--- Copy these startFrames into src/scenes/InsertHead.tsx ---\n");
let sf = 0;
for (const d of durations) {
  console.log(`  Step ${d.step}: startFrame: ${sf},`);
  sf += d.frames + BUFFER;
}
console.log(`\n  INSERT_HEAD_SCENE_FRAMES = ${sf};`);

const durationsPath = path.join(NARRATION_DIR, "durations.json");
fs.writeFileSync(durationsPath, JSON.stringify(durations, null, 2));
console.log(`\nSaved durations to ${durationsPath}`);
