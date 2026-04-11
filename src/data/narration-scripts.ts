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

export const allNarrations: SceneNarration[] = [insertHeadNarration, insertTailNarration, deleteNodeNarration];

export interface NarrationDuration {
  step: number;
  duration: number;
  frames: number;
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

export const narrationDurationsByScene: Record<string, NarrationDuration[]> = {
  "insert-head": insertHeadDurations,
  "insert-tail": insertTailDurations,
  "delete-node": deleteNodeDurations,
  "delete-head": deleteHeadDurations,
  "delete-middle": deleteMiddleDurations,
  "delete-tail": deleteTailDurations,
};
