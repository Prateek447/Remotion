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

const removeNthLines = [
  // Phase 0: Problem intro (optimal code dimmed)
  { stepIndex: 0, text: "Today's problem. Remove the nth node from the end of a linked list. Here's our list. One, two, three, four, five. And n equals two. So we have to delete the second node counting from the end — which means four. The result should be one, two, three, five." },
  // Phase 1: Naive approach (naive code active)
  { stepIndex: 1, text: "The obvious idea? Do it in two passes. First pass, count the length. Second pass, walk to the right spot and splice." },
  { stepIndex: 2, text: "Pass one. Walk a pointer through the list, bumping a counter. One, two, three, four, five. Length is five." },
  { stepIndex: 3, text: "Now the target. Length minus n is three. But we count from zero — so index three is actually the fourth node, which holds four. That's what we're removing. We reset curr to head, and walk two steps, landing on node three — the predecessor, at index two." },
  { stepIndex: 4, text: "And splice. curr dot next equals curr dot next dot next. Four is bypassed. Done. But that was two passes. Can we do better?", rate: "+5%" },
  // Phase 2: Optimal (optimal code active)
  { stepIndex: 5, text: "Enter the two-pointer trick. Step one, we add a dummy node in front of head. This matters — I'll show you why in a minute." },
  { stepIndex: 6, text: "Now two pointers, fast and slow, both starting at dummy. We move fast forward by n plus one steps. With n equals two, fast advances three times and lands on node three." },
  { stepIndex: 7, text: "Now the magic. We move fast and slow together, one step at a time. They keep that same gap — always n plus one apart." },
  { stepIndex: 8, text: "When fast falls off the end and becomes null, slow is sitting right before the node we want to remove. Exactly the predecessor. Every single time." },
  { stepIndex: 9, text: "One line. slow dot next equals slow dot next dot next. Four is bypassed. Return dummy dot next, and we're done. One pass, no counting." },
  // Phase 3: Edge case - remove head
  { stepIndex: 10, text: "Now let me show you why that dummy node matters. What if n equals five? We're removing the head itself — node one." },
  { stepIndex: 11, text: "Fast advances six steps. It walks through every node and lands on null immediately. Slow never moves, still at dummy." },
  { stepIndex: 12, text: "slow dot next dot next just skips past the old head. No null checks, no special case. The dummy absorbs what would otherwise be a crash." },
  // Phase 4: Complexity
  { stepIndex: 13, text: "Both versions are O of n time and O of one space. But the two-pointer version does it in a single pass, no length counting. Elegant.", rate: "+5%" },
  // Phase 5: CTA
  { stepIndex: 14, text: "If this two-pointer trick clicked for you, smash that subscribe. More LeetCode patterns coming up." },
];

const reverseLines = [
  { stepIndex: 0, text: "Alright, here's our linked list. Three, seven, nine. Three nodes, each pointing to the next. Today we're flipping the whole thing around." },
  { stepIndex: 1, text: "So what does reversing actually mean? Instead of three pointing to seven pointing to nine, we want nine pointing to seven pointing to three. Every arrow flips direction." },
  { stepIndex: 2, text: "To pull this off, we need three pointers. Prev starts at null. Curr starts at head, which is three. And next, we'll use that to save our place before we break any links." },
  { stepIndex: 3, text: "First thing, we save curr dot next into next. That's seven. We need this because we're about to destroy the link from three to seven." },
  { stepIndex: 4, text: "Now the key move. We set curr dot next to prev. So three no longer points to seven. It points to null. We just reversed our first link." },
  { stepIndex: 5, text: "Time to advance. Prev moves to curr, which is three. And curr moves to next, which is seven. We slide everything forward by one." },
  { stepIndex: 6, text: "Same pattern again. Save next. That's nine." },
  { stepIndex: 7, text: "Reverse the link. Seven's next now points to three instead of nine." },
  { stepIndex: 8, text: "Advance again. Prev moves to seven, curr moves to nine." },
  { stepIndex: 9, text: "One more time. Save next. It's null this time. We're at the last node." },
  { stepIndex: 10, text: "Reverse the link. Nine now points back to seven." },
  { stepIndex: 11, text: "Advance. Prev is nine, curr is null. The loop condition fails. We're done iterating." },
  { stepIndex: 12, text: "Last step. We set head to prev. And prev is nine. So the list now starts at nine, goes to seven, then three. Fully reversed." },
  { stepIndex: 13, text: "Here's the beauty of it. We touched every node exactly once. No extra memory, no recursion. O of n time, O of one space. Clean.", rate: "+5%" },
  { stepIndex: 14, text: "If this helped you visualize linked list reversal, hit subscribe. More data structures and algorithms coming soon." },
];

const detectCycleLines = [
  { stepIndex: 0, text: "Here's a tricky one. How do you know if a linked list has a cycle? Meaning, some node's next pointer loops back to an earlier node, creating an infinite loop." },
  { stepIndex: 1, text: "Here's our list. One, two, three, four, five. But look, five's next doesn't point to null. It points back to three. That's a cycle. If you tried to traverse this list, you'd loop forever." },
  { stepIndex: 2, text: "The trick is called Floyd's algorithm. Two pointers, slow and fast, both starting at head. Slow moves one step at a time. Fast moves two steps." },
  { stepIndex: 3, text: "Let's run it. Slow moves to two. Fast jumps to three. They're at different nodes." },
  { stepIndex: 4, text: "We check. Slow is at two, fast is at three. Not equal. Keep going." },
  { stepIndex: 5, text: "Slow moves to three. Fast jumps two steps and lands on five." },
  { stepIndex: 6, text: "Still not equal. Slow is three, fast is five. Continue." },
  { stepIndex: 7, text: "Now watch the fast pointer carefully. Slow moves to four. Fast follows the cycle arrow from five back to three, then hops one more to four. They're both at four." },
  { stepIndex: 8, text: "Slow equals fast. Cycle detected. We return true." },
  { stepIndex: 9, text: "But what if there's no cycle? Say the list is just one through five with null at the end. No loop." },
  { stepIndex: 10, text: "Fast would reach null before slow catches up. The while condition fails, and we return false. Simple." },
  { stepIndex: 11, text: "Why does this work? Think of it like two runners on a circular track. The fast one will always lap the slow one. If there's a cycle, they must meet. If not, fast hits the end.", rate: "+5%" },
  { stepIndex: 12, text: "Time complexity, O of n. Space, O of one. No hash sets, no extra memory. Just two pointers. Elegant." },
  { stepIndex: 13, text: "If Floyd's algorithm clicked for you, hit that subscribe button. More algorithm breakdowns on the way." },
];

const mergeListsLines = [
  { stepIndex: 0, text: "Two sorted linked lists. List A has one, four, six. List B has two, three, five. We need to merge them into one sorted list." },
  { stepIndex: 1, text: "The trick? A dummy node. We create a fake node with value zero. It won't be in the final answer, but it gives us a stable starting point. Tail points to dummy." },
  { stepIndex: 2, text: "Now we compare. A is at one, B is at two. One is smaller, so we take from A. Tail dot next equals A. Then we advance A to four, and tail to one." },
  { stepIndex: 3, text: "Compare again. A is four, B is two. Two is smaller. Take from B. Tail dot next equals B. Advance B to three, tail to two." },
  { stepIndex: 4, text: "A is four, B is three. Three is smaller. Take from B. Advance B to five, tail to three." },
  { stepIndex: 5, text: "A is four, B is five. Four is smaller. Take from A. Advance A to six, tail to four." },
  { stepIndex: 6, text: "A is six, B is five. Five is smaller. Take from B. Advance B to null, tail to five." },
  { stepIndex: 7, text: "B is null now. The while loop ends. But A still has six left." },
  { stepIndex: 8, text: "We just attach whatever's remaining. Tail dot next equals A. Six gets linked to the end." },
  { stepIndex: 9, text: "And we're done. The merged list is one, two, three, four, five, six. Perfectly sorted. We return dummy dot next to skip that fake zero node." },
  { stepIndex: 10, text: "Time complexity? O of n plus m, where n and m are the lengths of the two lists. We visit every node exactly once. Space is O of one, we're just rearranging pointers.", rate: "+5%" },
  { stepIndex: 11, text: "If this merge technique made sense to you, smash that subscribe. More algorithm deep dives are coming." },
];

const allNarrations = [
  { sceneId: "insert-head", lines: insertHeadLines },
  { sceneId: "insert-tail", lines: insertTailLines },
  { sceneId: "delete-node", lines: deleteNodeLines },
  { sceneId: "remove-nth-from-end", lines: removeNthLines },
  { sceneId: "reverse", lines: reverseLines },
  { sceneId: "detect-cycle", lines: detectCycleLines },
  { sceneId: "merge-lists", lines: mergeListsLines },
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

function generateWithEdgeTts(text, outputPath, voice, rate) {
  const escaped = text.replace(/"/g, '\\"');
  execSync(
    `edge-tts --voice "${voice}" --rate="${rate}" --text "${escaped}" --write-media "${outputPath}"`,
    { encoding: "utf-8", stdio: "pipe" },
  );
}

function main() {
  const filterScene = process.argv[2];

  const scenes = filterScene
    ? allNarrations.filter((n) => n.sceneId === filterScene)
    : allNarrations;

  if (scenes.length === 0) {
    console.error(`Unknown scene: ${filterScene}`);
    console.error(`Available: ${allNarrations.map((n) => n.sceneId).join(", ")}`);
    process.exit(1);
  }

  console.log("Generating narration audio files...\n");

  const onlyScene = process.env.SCENE_ID;
  const target = onlyScene
    ? allNarrations.filter((n) => n.sceneId === onlyScene)
    : allNarrations;

  if (onlyScene && target.length === 0) {
    console.error(`No narration found for scene id: ${onlyScene}`);
    process.exit(1);
  }

  for (const narration of target) {
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

    // Print startFrame suggestions (each step = prev startFrame + prev frames + 10 buffer)
    console.log("Suggested startFrame values:");
    let sf = 0;
    for (let i = 0; i < durations.length; i++) {
      console.log(`  Step ${durations[i].step}: startFrame: ${sf}`);
      sf += durations[i].frames + 10;
    }
    console.log(`  Total scene frames: ${sf}\n`);
  }

  console.log("Done!");
}

main();
