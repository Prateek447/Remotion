# Review Files

User-authored feedback files for the visual and audio review gates in the pipeline.

## What lives here

For each scene, after running a review-gate stage, copy the relevant template from `../design-system/review-templates/` to this folder, named `<sceneId>-visual.md` or `<sceneId>-audio.md`, and fill it in.

```
pipeline/review/
├── README.md                            (this file)
├── count-tree-nodes-visual.md           (example: visual review for count-tree-nodes)
├── count-tree-nodes-audio.md            (example: audio review for count-tree-nodes)
└── <sceneId>-{visual,audio}.md          (one pair per scene under active review)
```

## The flow

1. Run a stage that produces output to review:
   - Visual: `bash pipeline/run.sh <yaml> preview` → renders `out/<TitleCase>-preview.mp4`
   - Audio: `bash pipeline/run.sh <yaml> audio-stage` → generates `public/narration/<sceneId>/step-*.mp3`

2. The review stage prints instructions to:
   - Copy the template from `../design-system/review-templates/` to here
   - Watch / listen
   - Fill in the file

3. When the file is complete, ask Claude:
   > "Apply fixes from pipeline/review/<sceneId>-{visual,audio}.md, then update the design-system with any propagation patterns I noted."

4. Claude:
   - Reads the issues
   - Edits scene.yaml (and any design-system docs if patterns are flagged)
   - Re-runs the stage that produced the artifact
   - Confirms and asks you to re-review

5. Iterate until the verdict is "approved." Then proceed to the next pipeline stage.

## Why files, not chat-only feedback

Two reasons:

- **Persistence**: a written record of what was wrong with a given scene lets you compare against future scenes and notice patterns. The review files become an audit trail.
- **Pattern propagation**: the "Patterns worth propagating to design-system" section in each template is the formal hand-off from scene-specific fix to system-wide learning. Without a written file, this propagation never happens.

Conversational feedback is fine for nits ("the green is too saturated") but for any issue worth fixing, write it in the file. The template makes that easy.

## After a scene ships

Once a scene is rendered and accepted (stage 4 complete), its review files can be:

- **Kept** as part of the project's audit history (recommended for the first N scenes while the design system is maturing)
- **Archived** to a subfolder like `archive/<date>/`
- **Deleted** once you trust the patterns are encoded

Delete only after confirming the propagation patterns made it into the design system.
