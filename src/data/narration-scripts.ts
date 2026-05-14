export interface NarrationLine {
  stepIndex: number;
  text: string;
  voice?: string;
  rate?: string;
}

export interface SceneNarration {
  sceneId: string;
  lines: NarrationLine[];
}

export const insertHeadNarration: SceneNarration = {
  sceneId: "insert-head",
  lines: [
    { stepIndex: 0, text: "So, a linked list. It's basically a chain of nodes. Each node has two parts. A value, and a next pointer that points to the following node." },
    { stepIndex: 1, text: "Here's our linked list. Three, seven, nine. And this head pointer right here? That marks the start." },
    { stepIndex: 2, text: "Now, what we want to do, is insert the value one, at the very beginning of this list." },
    { stepIndex: 3, text: "But here's the thing. What if we move the head pointer to the new node first?" },
    { stepIndex: 4, text: "See the problem? We lost the connection to three, seven, and nine. Those nodes are completely unreachable now." },
    { stepIndex: 5, text: "So, the order matters. We have to link the new node first, before touching head." },
    { stepIndex: 6, text: "Alright, step one. We create a brand new node, with value one." },
    { stepIndex: 7, text: "Step two. We point new node's next, to the current head. This links it into the existing chain." },
    { stepIndex: 8, text: "Step three. Now it's safe to move head to the new node. Nothing is lost." },
    { stepIndex: 9, text: "And we're done! We increment the size. The list is now one, three, seven, nine." },
    { stepIndex: 10, text: "Now here's the beautiful part. We never had to walk through the list. No matter how long it is, this is always O of one. Constant time." },
    { stepIndex: 11, text: "What about an empty list though? Well, the same code just works. New node's next is null, and head moves to the new node." },
    { stepIndex: 12, text: "So remember. Three simple steps. Create the node. Link it to head. Then move head. That's it." },
    { stepIndex: 13, text: "If this helped you understand linked lists better, hit that subscribe button and drop a like. More data structures coming soon!" },
  ],
};

export const insertTailNarration: SceneNarration = {
  sceneId: "insert-tail",
  lines: [
    { stepIndex: 0, text: "Alright, here's our linked list again. Three, seven, nine, with head pointing to the start." },
    { stepIndex: 1, text: "This time, we want to insert the value five, at the very end of this list. At the tail." },
    { stepIndex: 2, text: "But unlike insert at head, we don't have a direct pointer to the last node. So we need to walk through the entire list to find it." },
    { stepIndex: 3, text: "But first, what if the list is empty? If head is null, the new node just becomes the head. Simple." },
    { stepIndex: 4, text: "Back to our list. Step one. Create a brand new node, with value five." },
    { stepIndex: 5, text: "Step two. We create a pointer called curr, and set it to head." },
    { stepIndex: 6, text: "Now we check. Node three's next points to seven. Not null. So curr moves forward to seven." },
    { stepIndex: 7, text: "Node seven's next points to nine. Still not null. So curr advances to nine." },
    { stepIndex: 8, text: "Now we check node nine's next. It's null! We've found the last node. We exit the loop." },
    { stepIndex: 9, text: "Step three. We set curr dot next to the new node. This links five to the end of our chain." },
    { stepIndex: 10, text: "And we're done! We increment the size. The list is now three, seven, nine, five." },
    { stepIndex: 11, text: "Now why is this O of n? Because we had to walk through every single node to reach the tail. The longer the list, the more steps it takes." },
    { stepIndex: 12, text: "Compare that to insert at head, which was O of one. With a tail pointer, we could make this O of one too. But that's a topic for another video." },
    { stepIndex: 13, text: "So remember. Create the node. Walk to the end. Link it up. That's insert at tail." },
    { stepIndex: 14, text: "If this helped you understand linked lists better, hit that subscribe button and drop a like. More data structures coming soon!" },
  ],
};

export const deleteNodeNarration: SceneNarration = {
  sceneId: "delete-node",
  lines: [
    // Phase 0: Context
    { stepIndex: 0, text: "Okay so here's our linked list. Three, seven, nine, five. Four nodes chained together. Today we're removing one of them." },
    // Phase 1: Empty list
    { stepIndex: 1, text: "But before anything, what if the list is already empty? Head is null. There's literally nothing there. So we just return immediately. No crash, no drama." },
    // Phase 2: Delete head setup
    { stepIndex: 2, text: "Now the first real case. What if the node we want to delete is right at the front? The head itself." },
    // Phase 3: Mark head for removal
    { stepIndex: 3, text: "Let's say we're deleting three. We check, head dot val equals three. Yep, that's it." },
    // Phase 4: head = head.next
    { stepIndex: 4, text: "All we do is move head forward to the next node. That's it. Three is gone. No traversal needed. This is O of one." },
    // Phase 5: Reset for middle delete
    { stepIndex: 5, text: "Alright, now the trickier one. What if the node is somewhere in the middle? We can't just jump to it. We have to walk the list." },
    // Phase 6: curr = head
    { stepIndex: 6, text: "We create a pointer called curr and start it at head. We're going to use this to scan the chain one node at a time." },
    // Phase 7: Found it
    { stepIndex: 7, text: "We check curr dot next dot val. And there it is, seven. We found the node right in front of us." },
    // Phase 8: Bypass arrow
    { stepIndex: 8, text: "Here's the key move. We set curr dot next to curr dot next dot next. So instead of pointing to seven, three now skips straight to nine. Seven is bypassed." },
    // Phase 9: Clean list
    { stepIndex: 9, text: "And seven is gone. The list is now three, nine, five. No gaps, perfectly connected." },
    // Phase 10: Delete tail setup
    { stepIndex: 10, text: "Last case. What if it's the tail? The very last node. Same idea, we just need to walk further." },
    // Phase 11: Traversal starts
    { stepIndex: 11, text: "Curr starts at three. We check, three's next is seven, not the target. Keep going." },
    // Phase 12: curr advances
    { stepIndex: 12, text: "Curr moves to seven. Seven's next is nine, still not it. Move again." },
    // Phase 13: Found predecessor
    { stepIndex: 13, text: "Now curr is at nine. And nine's next is five, which is what we want to delete. We're in the right spot." },
    // Phase 14: Tail removed
    { stepIndex: 14, text: "We set nine dot next to null. Five is detached. The tail is gone. Clean." },
    // Phase 15: Complexity recap
    { stepIndex: 15, text: "So the big picture. Deleting the head is O of one, super fast. But deleting anything else means walking the list, which is O of n. The longer the list, the more steps." },
    // CTA
    { stepIndex: 16, text: "If this clicked for you, hit subscribe. Next up is searching a linked list." },
  ],
};

export const removeNthNarration: SceneNarration = {
  sceneId: "remove-nth-from-end",
  lines: [
    // Phase 0: Problem intro
    { stepIndex: 0, text: "The problem is to remove the nth node from the end of a linked list — we have nodes one through five with n equals two, so we need to delete the second node from the end which is four, and the result should be one, two, three, five." },
    // Phase 1: Naive
    { stepIndex: 1, text: "The obvious approach is two passes — a first pass to count the total length, then a second pass to walk to the right spot and splice the node out." },
    { stepIndex: 2, text: "In the first pass we walk a pointer through the whole list bumping a counter at each step — one, two, three, four, five — so the total length is five." },
    { stepIndex: 3, text: "Now the target — length minus n is three, but we count from zero, so index three is actually the fourth node which holds four, and that's what we're removing, so we reset curr to head and walk two steps to land on node three, the predecessor." },
    { stepIndex: 4, text: "Then we splice by setting curr dot next to curr dot next dot next, so four gets bypassed and we're done — but that was two passes, so can we do it in just one?" },
    // Phase 2: Optimal
    { stepIndex: 5, text: "Here's the two-pointer trick — we start by adding a dummy node in front of head, and that one small detail is going to matter a lot when we hit edge cases." },
    { stepIndex: 6, text: "Now two pointers, fast and slow, both starting at dummy — we move fast forward by n plus one steps, and with n equals two, fast advances three times and lands on node three." },
    { stepIndex: 7, text: "Here's where the magic happens — we move fast and slow together one step at a time, and they maintain that exact gap of n plus one between them the entire way." },
    { stepIndex: 8, text: "When fast falls off the end and becomes null, slow is sitting right before the node we want to remove — exactly the predecessor, every single time." },
    { stepIndex: 9, text: "It's a single line — slow dot next equals slow dot next dot next — four is bypassed, we return dummy dot next and we're done in one pass with no counting at all." },
    // Phase 3: Edge case - remove head
    { stepIndex: 10, text: "Now let me show you why that dummy node matters — what if n equals five? We're removing the head itself, node one." },
    { stepIndex: 11, text: "Fast advances six steps, walks right through every node and lands on null, while slow never moves and stays at dummy." },
    { stepIndex: 12, text: "slow dot next dot next just skips past the old head — no null checks, no special cases needed, because the dummy node absorbs what would otherwise be a crash." },
    // Phase 4: Complexity
    { stepIndex: 13, text: "Both versions are O of n time and O of one space, but the two-pointer version does it in a single pass with no length counting, which makes it the cleaner and more elegant solution." },
    // Phase 5: CTA
    { stepIndex: 14, text: "If this two-pointer trick clicked for you, smash that subscribe because more LeetCode patterns are on the way." },
  ],
};

export const reverseNarration: SceneNarration = {
  sceneId: "reverse",
  lines: [
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
    { stepIndex: 13, text: "Here's the beauty of it. We touched every node exactly once. No extra memory, no recursion. O of n time, O of one space. Clean." },
    { stepIndex: 14, text: "If this helped you visualize linked list reversal, hit subscribe. More data structures and algorithms coming soon." },
  ],
};

export const detectCycleNarration: SceneNarration = {
  sceneId: "detect-cycle",
  lines: [
    { stepIndex: 0, text: "Here's a tricky problem — how do you even know if a linked list has a cycle, where some node's next pointer loops back to an earlier node and creates an infinite loop?" },
    { stepIndex: 1, text: "Here's our list, nodes one through five, but five's next doesn't point to null — it points back to three, and if you tried to traverse this list you'd loop forever with no way out." },
    { stepIndex: 2, text: "The trick is Floyd's algorithm, which uses two pointers called slow and fast, both starting at head — slow moves one step at a time while fast moves two steps at a time." },
    { stepIndex: 3, text: "Let's run it — slow moves to two and fast jumps ahead to three, so they're already at different nodes after just one iteration." },
    { stepIndex: 4, text: "We check if slow equals fast — slow is at two and fast is at three, they're not equal so we continue looping." },
    { stepIndex: 5, text: "Slow moves to three and fast jumps two steps to land on five." },
    { stepIndex: 6, text: "Still not equal — slow is at three and fast is at five — so we go around one more time." },
    { stepIndex: 7, text: "Now watch the fast pointer — slow moves to four, and fast follows the cycle arrow from five back to three then hops one more step to four, so now they're both at node four." },
    { stepIndex: 8, text: "Slow equals fast, which means a cycle was detected and we return true right here." },
    { stepIndex: 9, text: "But what if there's no cycle? Say the list is just one through five with null at the end and no loop anywhere in it." },
    { stepIndex: 10, text: "Fast would reach null before slow ever catches up, the while condition fails and we return false — clean and simple." },
    { stepIndex: 11, text: "Why does this actually work? Think of two runners on a circular track — the fast one will always eventually lap the slow one, so if there's a cycle they must meet, and if there's no cycle fast just falls off the end." },
    { stepIndex: 12, text: "Time complexity is O of n and space is O of one — no hash sets, no extra memory, just two pointers doing all the work, which makes this one of the most elegant solutions in all of DSA." },
    { stepIndex: 13, text: "If Floyd's algorithm clicked for you, hit that subscribe button because more algorithm breakdowns are on the way." },
  ],
};

export const mergeListsNarration: SceneNarration = {
  sceneId: "merge-lists",
  lines: [
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
    { stepIndex: 10, text: "Time complexity? O of n plus m, where n and m are the lengths of the two lists. We visit every node exactly once. Space is O of one, we're just rearranging pointers." },
    { stepIndex: 11, text: "If this merge technique made sense to you, smash that subscribe. More algorithm deep dives are coming." },
  ],
};

export const bstInsertNarration: SceneNarration = {
  sceneId: "bst-insert",
  lines: [
    // Hook + intro
    { stepIndex: 0,  text: "BST insertion feels complicated because of recursion… but the actual algorithm is just repeating one tiny decision again and again — left or right. And once you see the return phase visually, the whole thing finally clicks. Alright, Binary Search Tree. One simple rule — smaller values go left, larger values go right. Right now our root is fifty. Thirty is on the left, seventy on the right, and below thirty we already have twenty and forty. Now let's insert thirty-five." },
    // Phase 1 – Normal insert
    { stepIndex: 1,  text: "The public insert function just calls a recursive helper. So we start at node fifty. First question — is this node null? No. So now we compare." },
    { stepIndex: 2,  text: "Thirty-five is smaller than fifty… so we move left. That means the value belongs somewhere inside the left subtree. Now recursion takes us to thirty." },
    { stepIndex: 3,  text: "At node thirty now. Thirty-five is greater than thirty… so this time we go right. And we land on forty." },
    { stepIndex: 4,  text: "Now watch carefully. Thirty-five is smaller than forty… so we try going left. But forty doesn't even have a left child." },
    { stepIndex: 5,  text: "And there it is — null. That's the base case. This is exactly where the new node should be created. So recursion creates a brand new node containing thirty-five… and returns it." },
    { stepIndex: 6,  text: "Now comes the important part. That returned node bubbles back up the recursive calls… and gets attached to forty's left pointer automatically. We never manually connected thirty-five ourselves. Recursion handled the insertion during the return phase. And just like that… thirty-five is now part of the BST." },
    // Phase 2 – Empty tree
    { stepIndex: 7,  text: "Now let's look at a completely empty tree. No root. Nothing. What happens if we insert ten?" },
    { stepIndex: 8,  text: "insertRec gets called immediately with null. Same base case as before. But this time it happens at the very top. No comparisons. No moving left or right. Nothing." },
    { stepIndex: 9,  text: "So recursion creates the new node… returns it… and that returned node becomes the root itself. That's the cool part. The exact same recursive logic handled a deep insertion and a completely empty tree. One base case… covers everything." },
    // Phase 3 – Duplicate
    { stepIndex: 10, text: "Alright, last case. What if we try inserting a duplicate? Let's insert forty again." },
    { stepIndex: 11, text: "Forty starts at the root. Forty is smaller than fifty — so we go left." },
    { stepIndex: 12, text: "Now at node thirty. Forty is greater than thirty — so this time we go right." },
    { stepIndex: 13, text: "And we land on node forty. Here's the key moment — forty equals forty. Neither the less-than condition nor the greater-than condition fires." },
    { stepIndex: 14, text: "So neither branch runs. The recursion simply returns the current node… unchanged. No new node gets created. That means this BST ignores duplicates silently." },
    // Ending / CTA
    { stepIndex: 15, text: "And that's BST insertion. At every step, recursion just asks one question: left or right? Eventually it hits null… creates the node… and the return phase reconnects everything automatically. Time complexity is O of h — O of log n in a balanced tree, O of n in the worst case. And honestly… once the return phase clicks, BST insertion suddenly feels way simpler." },
  ],
};

export const allNarrations: SceneNarration[] = [
  insertHeadNarration,
  insertTailNarration,
  deleteNodeNarration,
  removeNthNarration,
  reverseNarration,
  detectCycleNarration,
  mergeListsNarration,
  bstInsertNarration,
];

export interface NarrationDuration {
  // Scene-step index this narration line is anchored to (for its startFrame).
  step: number;
  duration: number;
  frames: number;
  // Optional override for the audio filename (step-<audioStep>.mp3). Defaults to `step`.
  // Use when scene-step indices are expanded with animation-only steps so the audio
  // files keep their original narration-line numbering.
  audioStep?: number;
}

export const insertHeadDurations: NarrationDuration[] = [
  { step: 0, duration: 8.74, frames: 263 },
  { step: 1, duration: 6.46, frames: 194 },
  { step: 2, duration: 4.56, frames: 137 },
  { step: 3, duration: 4.56, frames: 137 },
  { step: 4, duration: 7.18, frames: 216 },
  { step: 5, duration: 4.97, frames: 150 },
  { step: 6, duration: 3.89, frames: 117 },
  { step: 7, duration: 6.29, frames: 189 },
  { step: 8, duration: 4.82, frames: 145 },
  { step: 9, duration: 5.62, frames: 169 },
  { step: 10, duration: 8.71, frames: 262 },
  { step: 11, duration: 7.13, frames: 214 },
  { step: 12, duration: 7.01, frames: 211 },
  { step: 13, duration: 7.06, frames: 212 },
];

export const insertTailDurations: NarrationDuration[] = [
  { step: 0, duration: 5.18, frames: 156 },
  { step: 1, duration: 4.9, frames: 147 },
  { step: 2, duration: 7.51, frames: 226 },
  { step: 3, duration: 6.12, frames: 184 },
  { step: 4, duration: 4.8, frames: 144 },
  { step: 5, duration: 4.08, frames: 123 },
  { step: 6, duration: 6.26, frames: 188 },
  { step: 7, duration: 5.38, frames: 162 },
  { step: 8, duration: 6.07, frames: 183 },
  { step: 9, duration: 5.66, frames: 170 },
  { step: 10, duration: 5.88, frames: 177 },
  { step: 11, duration: 8.04, frames: 242 },
  { step: 12, duration: 8.66, frames: 260 },
  { step: 13, duration: 6.22, frames: 187 },
  { step: 14, duration: 7.06, frames: 212 },
];

export const deleteNodeDurations: NarrationDuration[] = [
  { step: 0,  duration: 8.976, frames: 270 },
  { step: 1,  duration: 10.008, frames: 301 },
  { step: 2,  duration: 6.12,  frames: 184 },
  { step: 3,  duration: 5.856, frames: 176 },
  { step: 4,  duration: 8.784, frames: 264 },
  { step: 5,  duration: 7.536, frames: 227 },
  { step: 6,  duration: 7.416, frames: 223 },
  { step: 7,  duration: 5.808, frames: 175 },
  { step: 8,  duration: 9.624, frames: 289 },
  { step: 9,  duration: 6.024, frames: 181 },
  { step: 10, duration: 5.904, frames: 178 },
  { step: 11, duration: 5.112, frames: 154 },
  { step: 12, duration: 5.28,  frames: 159 },
  { step: 13, duration: 6.576, frames: 198 },
  { step: 14, duration: 5.52,  frames: 166 },
  { step: 15, duration: 12.36, frames: 371 },
  { step: 16, duration: 4.512, frames: 136 },
];

export const deleteHeadDurations: NarrationDuration[] = [
  { step: 0, duration: 8.976, frames: 270 },
  { step: 1, duration: 10.008, frames: 301 },
  { step: 2, duration: 6.12, frames: 184 },
  { step: 3, duration: 5.856, frames: 176 },
  { step: 4, duration: 8.784, frames: 264 },
];

export const deleteMiddleDurations: NarrationDuration[] = [
  { step: 0, duration: 8.976, frames: 270 },
  { step: 1, duration: 7.536, frames: 227 },
  { step: 2, duration: 7.416, frames: 223 },
  { step: 3, duration: 5.808, frames: 175 },
  { step: 4, duration: 9.624, frames: 289 },
  { step: 5, duration: 6.024, frames: 181 },
];

export const deleteTailDurations: NarrationDuration[] = [
  { step: 0, duration: 8.976, frames: 270 },
  { step: 1, duration: 5.904, frames: 178 },
  { step: 2, duration: 5.112, frames: 154 },
  { step: 3, duration: 5.28, frames: 159 },
  { step: 4, duration: 6.576, frames: 198 },
  { step: 5, duration: 5.52, frames: 166 },
];

// Animation-only scene steps (no dedicated audio line of their own):
//   2..6   length counter walking n1 -> n5
//   8..9   curr walking to the target's predecessor in the naive phase
//   11     clean-up beat where n4 is fully removed before the optimal phase
// The narration audio files still number 0..14 (one per script line), so we
// use `audioStep` to decouple them from the expanded scene step indices.
export const removeNthDurations: NarrationDuration[] = [
  { step: 0,  audioStep: 0,  duration: 12.68, frames: 381 },
  { step: 1,  audioStep: 1,  duration: 8.00,  frames: 240 },
  { step: 2,  audioStep: 2,  duration: 10.92, frames: 328 },
  { step: 7,  audioStep: 3,  duration: 14.64, frames: 440 },
  { step: 10, audioStep: 4,  duration: 9.80,  frames: 294 },
  { step: 12, audioStep: 5,  duration: 8.24,  frames: 248 },
  { step: 13, audioStep: 6,  duration: 11.20, frames: 336 },
  { step: 17, audioStep: 7,  duration: 8.92,  frames: 268 },
  { step: 20, audioStep: 8,  duration: 8.20,  frames: 246 },
  { step: 21, audioStep: 9,  duration: 8.88,  frames: 267 },
  { step: 22, audioStep: 10, duration: 7.00,  frames: 210 },
  { step: 23, audioStep: 11, duration: 7.64,  frames: 230 },
  { step: 24, audioStep: 12, duration: 8.84,  frames: 266 },
  { step: 25, audioStep: 13, duration: 9.80,  frames: 294 },
  { step: 26, audioStep: 14, duration: 5.32,  frames: 160 },
];

// Scene step 3 (curr = head) is animation-only — no dedicated audio.
// Audio files are numbered 0..14; audioStep decouples them from scene indices.
export const reverseDurations: NarrationDuration[] = [
  { step: 0,  audioStep: 0,  duration: 8.16,  frames: 245 },
  { step: 1,  audioStep: 1,  duration: 9.50,  frames: 286 },
  { step: 2,  audioStep: 2,  duration: 10.22, frames: 307 },
  { step: 4,  audioStep: 3,  duration: 7.37,  frames: 222 },
  { step: 6,  audioStep: 4,  duration: 8.90,  frames: 268 },
  { step: 7,  audioStep: 5,  duration: 8.40,  frames: 252 },
  { step: 8,  audioStep: 6,  duration: 3.62,  frames: 109 },
  { step: 10, audioStep: 7,  duration: 4.32,  frames: 130 },
  { step: 11, audioStep: 8,  duration: 4.39,  frames: 132 },
  { step: 12, audioStep: 9,  duration: 5.14,  frames: 155 },
  { step: 14, audioStep: 10, duration: 3.38,  frames: 102 },
  { step: 15, audioStep: 11, duration: 6.29,  frames: 189 },
  { step: 17, audioStep: 12, duration: 9.12,  frames: 274 },
  { step: 18, audioStep: 13, duration: 10.01, frames: 301 },
  { step: 19, audioStep: 14, duration: 6.89,  frames: 207 },
];

// Animation-only scene step: Step 8 (7b: fast meets slow at n4)
// Audio files numbered 0..13; audioStep decouples them from scene step indices.
export const detectCycleDurations: NarrationDuration[] = [
  { step: 0,  audioStep: 0,  duration: 8.72,  frames: 262 },
  { step: 1,  audioStep: 1,  duration: 9.92,  frames: 298 },
  { step: 2,  audioStep: 2,  duration: 9.88,  frames: 297 },
  { step: 3,  audioStep: 3,  duration: 6.52,  frames: 196 },
  { step: 4,  audioStep: 4,  duration: 7.36,  frames: 221 },
  { step: 5,  audioStep: 5,  duration: 3.88,  frames: 117 },
  { step: 6,  audioStep: 6,  duration: 5.44,  frames: 164 },
  { step: 7,  audioStep: 7,  duration: 10.60, frames: 318 },
  { step: 9,  audioStep: 8,  duration: 5.72,  frames: 172 },
  { step: 10, audioStep: 9,  duration: 8.44,  frames: 254 },
  { step: 11, audioStep: 10, duration: 6.36,  frames: 191 },
  { step: 12, audioStep: 11, duration: 11.44, frames: 344 },
  { step: 13, audioStep: 12, duration: 13.20, frames: 396 },
  { step: 14, audioStep: 13, duration: 5.56,  frames: 167 },
];

export const mergeListsDurations: NarrationDuration[] = [
  { step: 0,  duration: 9.43,  frames: 283 },
  { step: 1,  duration: 10.22, frames: 307 },
  { step: 2,  duration: 10.90, frames: 327 },
  { step: 3,  duration: 10.61, frames: 319 },
  { step: 4,  duration: 7.15,  frames: 215 },
  { step: 5,  duration: 7.30,  frames: 219 },
  { step: 6,  duration: 7.37,  frames: 222 },
  { step: 7,  duration: 4.49,  frames: 135 },
  { step: 8,  duration: 6.36,  frames: 191 },
  { step: 9,  duration: 10.30, frames: 309 },
  { step: 10, duration: 11.71, frames: 352 },
  { step: 11, duration: 5.95,  frames: 179 },
];

export const constantTimeDurations: NarrationDuration[] = [
  { step: 0, duration: 12.72, frames: 382 },
  { step: 1, duration: 10.04, frames: 302 },
  { step: 2, duration: 10.48, frames: 315 },
  { step: 3, duration:  8.60, frames: 258 },
  { step: 4, duration:  7.64, frames: 230 },
  { step: 5, duration: 11.48, frames: 345 },
];

export const linearSearchDurations: NarrationDuration[] = [
  { step: 0, duration: 10.76, frames: 323 },
  { step: 1, duration: 13.16, frames: 395 },
  { step: 2, duration: 15.44, frames: 464 },
  { step: 3, duration:  8.24, frames: 248 },
  { step: 4, duration:  8.36, frames: 251 },
];

export const binarySearchDurations: NarrationDuration[] = [
  { step: 0, duration: 13.36, frames: 401 },
  { step: 1, duration: 11.64, frames: 350 },
  { step: 2, duration: 14.04, frames: 422 },
  { step: 3, duration:  9.04, frames: 272 },
  { step: 4, duration:  9.00, frames: 270 },
];

export const bubbleSortDurations: NarrationDuration[] = [
  { step: 0, duration:  7.80, frames: 234 },
  { step: 1, duration:  6.60, frames: 198 },
  { step: 2, duration:  6.16, frames: 185 },
  { step: 3, duration: 11.20, frames: 336 },
  { step: 4, duration: 12.40, frames: 372 },
  { step: 5, duration:  9.24, frames: 278 },
];

export const mergeSortDurations: NarrationDuration[] = [
  { step: 0, duration:  9.36, frames: 281 },
  { step: 1, duration: 10.24, frames: 308 },
  { step: 2, duration:  5.80, frames: 174 },
  { step: 3, duration: 13.48, frames: 405 },
  { step: 4, duration: 12.68, frames: 381 },
  { step: 5, duration:  8.04, frames: 242 },
];

export const exponentialDurations: NarrationDuration[] = [
  { step: 0, duration:  9.48, frames: 285 },
  { step: 1, duration:  8.84, frames: 266 },
  { step: 2, duration: 11.56, frames: 347 },
  { step: 3, duration: 14.72, frames: 442 },
];

export const factorialDurations: NarrationDuration[] = [
  { step: 0, duration: 13.20, frames: 396 },
  { step: 1, duration:  9.80, frames: 294 },
  { step: 2, duration: 10.80, frames: 324 },
  { step: 3, duration:  9.40, frames: 282 },
  { step: 4, duration: 10.64, frames: 320 },
  { step: 5, duration: 11.28, frames: 339 },
];

export const tlsHandshakeDurations: NarrationDuration[] = [
  { step: 0, duration: 14.52, frames: 436 },
  { step: 1, duration: 14.52, frames: 436 },
  { step: 2, duration: 13.64, frames: 410 },
  { step: 3, duration: 16.64, frames: 500 },
  { step: 4, duration: 15.80, frames: 474 },
  { step: 5, duration: 15.96, frames: 479 },
  { step: 6, duration: 13.56, frames: 407 },
  { step: 7, duration: 12.96, frames: 389 },
  { step: 8, duration: 16.20, frames: 486 },
];

export const bstInsertDurations: NarrationDuration[] = [
  { step: 0,  duration: 27.34, frames: 821 },
  { step: 1,  duration: 9.98,  frames: 300 },
  { step: 2,  duration: 9.29,  frames: 279 },
  { step: 3,  duration: 6.82,  frames: 205 },
  { step: 4,  duration: 7.66,  frames: 230 },
  { step: 5,  duration: 10.80, frames: 324 },
  { step: 6,  duration: 18.07, frames: 543 },
  { step: 7,  duration: 6.26,  frames: 188 },
  { step: 8,  duration: 11.33, frames: 340 },
  { step: 9,  duration: 14.16, frames: 425 },
  { step: 10, duration: 5.62,  frames: 169 },
  { step: 11, duration: 4.54,  frames: 137 },
  { step: 12, duration: 4.56,  frames: 137 },
  { step: 13, duration: 8.50,  frames: 255 },
  { step: 14, duration: 10.25, frames: 308 },
  { step: 15, duration: 23.88, frames: 717 },
];

export const narrationDurationsByScene: Record<string, NarrationDuration[]> = {
  "insert-head": insertHeadDurations,
  "insert-tail": insertTailDurations,
  "delete-node": deleteNodeDurations,
  "delete-head": deleteHeadDurations,
  "delete-middle": deleteMiddleDurations,
  "delete-tail": deleteTailDurations,
  "remove-nth-from-end": removeNthDurations,
  "reverse": reverseDurations,
  "detect-cycle": detectCycleDurations,
  "merge-lists": mergeListsDurations,
  "o-1":           constantTimeDurations,
  "o-n":           linearSearchDurations,
  "o-log-n":       binarySearchDurations,
  "o-n-squared":   bubbleSortDurations,
  "o-n-log-n":     mergeSortDurations,
  "o-2n":          exponentialDurations,
  "o-n-factorial":  factorialDurations,
  "tls-handshake":  tlsHandshakeDurations,
  "bst-insert":     bstInsertDurations,
};
