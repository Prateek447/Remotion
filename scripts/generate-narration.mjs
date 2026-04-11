import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const VOICE = "en-US-BrianMultilingualNeural";
const DEFAULT_RATE = "+10%";
const DEFAULT_PITCH = "+0Hz";

const insertHeadLines = [
  { stepIndex: 0, text: "So, a linked list. It's basically a chain of nodes. Each node has two parts. A value, and a next pointer that points to the following node." },
  { stepIndex: 1, text: "Here's our linked list. Three, seven, nine. And this head pointer right here? That marks the start." },
  { stepIndex: 2, text: "Now, what we want to do, is insert the value one, at the very beginning of this list." },
  { stepIndex: 3, text: "But here's the thing. What if we move the head pointer to the new node first?", rate: "+5%" },
  { stepIndex: 4, text: "See the problem? We lost the connection to three, seven, and nine. Those nodes are completely unreachable now.", rate: "+5%" },
  { stepIndex: 5, text: "So, the order matters. We have to link the new node first, before touching head.", rate: "+5%" },
  { stepIndex: 6, text: "Alright, step one. We create a brand new node, with value one." },
  { stepIndex: 7, text: "Step two. We point new node's next, to the current head. This links it into the existing chain." },
  { stepIndex: 8, text: "Step three. Now it's safe to move head to the new node. Nothing is lost." },
  { stepIndex: 9, text: "And we're done! We increment the size. The list is now one, three, seven, nine." },
  { stepIndex: 10, text: "Now here's the beautiful part. We never had to walk through the list. No matter how long it is, this is always O of one. Constant time.", rate: "+5%" },
  { stepIndex: 11, text: "What about an empty list though? Well, the same code just works. New node's next is null, and head moves to the new node." },
  { stepIndex: 12, text: "So remember. Three simple steps. Create the node. Link it to head. Then move head. That's it." },
  { stepIndex: 13, text: "If this helped you understand linked lists better, hit that subscribe button and drop a like. More data structures coming soon!" },
];

const insertTailLines = [
  { stepIndex: 0, text: "Alright, here's our linked list again. Three, seven, nine, with head pointing to the start." },
  { stepIndex: 1, text: "This time, we want to insert the value five, at the very end of this list. At the tail." },
  { stepIndex: 2, text: "But unlike insert at head, we don't have a direct pointer to the last node. So we need to walk through the entire list to find it.", rate: "+5%" },
  { stepIndex: 3, text: "But first, what if the list is empty? If head is null, the new node just becomes the head. Simple." },
  { stepIndex: 4, text: "Back to our list. Step one. Create a brand new node, with value five." },
  { stepIndex: 5, text: "Step two. We create a pointer called curr, and set it to head." },
  { stepIndex: 6, text: "Now we check. Node three's next points to seven. Not null. So curr moves forward to seven." },
  { stepIndex: 7, text: "Node seven's next points to nine. Still not null. So curr advances to nine." },
  { stepIndex: 8, text: "Now we check node nine's next. It's null! We've found the last node. We exit the loop." },
  { stepIndex: 9, text: "Step three. We set curr dot next to the new node. This links five to the end of our chain." },
  { stepIndex: 10, text: "And we're done! We increment the size. The list is now three, seven, nine, five." },
  { stepIndex: 11, text: "Now why is this O of n? Because we had to walk through every single node to reach the tail. The longer the list, the more steps it takes.", rate: "+5%" },
  { stepIndex: 12, text: "Compare that to insert at head, which was O of one. With a tail pointer, we could make this O of one too. But that's a topic for another video.", rate: "+5%" },
  { stepIndex: 13, text: "So remember. Create the node. Walk to the end. Link it up. That's insert at tail." },
  { stepIndex: 14, text: "If this helped you understand linked lists better, hit that subscribe button and drop a like. More data structures coming soon!" },
];

const deleteNodeLines = [
  { stepIndex: 0,  text: "Okay so here's our linked list. Three, seven, nine, five. Four nodes, each one pointing to the next. Today we're removing one of them." },
  { stepIndex: 1,  text: "But first. What if the list is already empty? Head is null. There's literally nothing there. So we just return. No crash, no extra logic. Done." },
  { stepIndex: 2,  text: "Now the first real case. What if the node we want to delete is right at the front? The head itself." },
  { stepIndex: 3,  text: "Say we're deleting three. We check — head dot val equals three. Yep, that's our node." },
  { stepIndex: 4,  text: "All we do is move head one step forward. That's it. Three is gone. We never even walked the rest of the list. O of one. Instant." },
  { stepIndex: 5,  text: "Alright, now the trickier part. What if the node is somewhere in the middle? We can't jump straight to it. We have to walk the chain." },
  { stepIndex: 6,  text: "We create a pointer called curr, and start it at head. This is our scanner. It moves through the list one node at a time." },
  { stepIndex: 7,  text: "We check curr dot next dot val. And there it is — seven. We found the node we want to remove." },
  { stepIndex: 8,  text: "Here's the key move. We set curr dot next to curr dot next dot next. So three no longer points to seven — it skips straight to nine. Seven is bypassed.", rate: "+5%" },
  { stepIndex: 9,  text: "And seven is gone. The list reconnects cleanly. Three, nine, five. No gaps." },
  { stepIndex: 10, text: "Last case. What if it's the tail — the very last node? Same approach, we just walk a bit further." },
  { stepIndex: 11, text: "Curr starts at three. Three's next is seven — not our target. Keep moving." },
  { stepIndex: 12, text: "Now curr is at seven. Seven's next is nine — still not it. One more step." },
  { stepIndex: 13, text: "Curr lands on nine. And nine's next is five — which is exactly what we want to delete. We're in the right spot." },
  { stepIndex: 14, text: "We set nine dot next to null. Five is detached. The tail is gone. Clean." },
  { stepIndex: 15, text: "So here's the full picture. Deleting the head is O of one — fast, no walking needed. But deleting anything else means traversing the list, and that's O of n. The longer the list, the longer it takes.", rate: "+5%" },
  { stepIndex: 16, text: "If this clicked for you, hit subscribe. Next up — searching a linked list." },
];

const allNarrations = [
  { sceneId: "insert-head", lines: insertHeadLines },
  { sceneId: "insert-tail", lines: insertTailLines },
  { sceneId: "delete-node", lines: deleteNodeLines },
];

function getAudioDuration(filePath) {
  try {
    const result = execSync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`,
      { encoding: "utf-8" },
    );
    return parseFloat(result.trim());
  } catch {
    return 3;
  }
}

function buildSsml(text, voice, rate, pitch) {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-IN">
  <voice name="${voice}">
    <prosody rate="${rate}" pitch="${pitch}">
      ${escaped}
    </prosody>
  </voice>
</speak>`;
}

function generateWithSsml(ssml, outputPath) {
  const tmpSsml = outputPath + ".ssml";
  fs.writeFileSync(tmpSsml, ssml, "utf-8");
  execSync(
    `edge-tts --voice "${VOICE}" -f "${tmpSsml}" --write-media "${outputPath}"`,
    { encoding: "utf-8", stdio: "pipe" },
  );
  fs.unlinkSync(tmpSsml);
}

function generateWithEdgeTts(text, outputPath, voice, rate) {
  const escaped = text.replace(/"/g, '\\"');
  execSync(
    `edge-tts --voice "${voice}" --rate="${rate}" --text "${escaped}" --write-media "${outputPath}"`,
    { encoding: "utf-8", stdio: "pipe" },
  );
}

async function main() {
  console.log("Generating narration audio files...\n");

  for (const narration of allNarrations) {
    const outDir = path.join("public", "narration", narration.sceneId);
    fs.mkdirSync(outDir, { recursive: true });

    console.log(`Scene: ${narration.sceneId}`);
    console.log(`Voice: ${VOICE}`);
    console.log("=".repeat(40));

    const durations = [];

    for (const line of narration.lines) {
      const outputPath = path.join(outDir, `step-${line.stepIndex}.mp3`);
      const rate = line.rate || DEFAULT_RATE;
      const shortText = line.text.length > 60 ? line.text.slice(0, 60) + "..." : line.text;

      console.log(`  Step ${line.stepIndex} [rate=${rate}]: "${shortText}"`);

      generateWithEdgeTts(line.text, outputPath, VOICE, rate);

      const duration = getAudioDuration(outputPath);
      const frames = Math.ceil(duration * 30);
      durations.push({ step: line.stepIndex, duration, frames });

      console.log(`    -> ${outputPath} (${duration.toFixed(2)}s, ${frames} frames)`);
    }

    console.log(`\nDuration summary for ${narration.sceneId}:`);
    let totalFrames = 0;
    for (const d of durations) {
      console.log(`  Step ${d.step}: ${d.duration.toFixed(2)}s (${d.frames} frames)`);
      totalFrames += d.frames;
    }
    console.log(`  Total audio: ${totalFrames} frames (${(totalFrames / 30).toFixed(1)}s)`);

    const durationsPath = path.join(outDir, "durations.json");
    fs.writeFileSync(durationsPath, JSON.stringify(durations, null, 2));
    console.log(`  Saved durations to ${durationsPath}\n`);
  }

  console.log("Done!");
}

main().catch(console.error);
