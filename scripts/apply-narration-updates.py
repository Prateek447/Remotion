#!/usr/bin/env python3
"""Patch scene .tsx files and narration-scripts.ts after regenerating audio.

Reads public/narration/<sceneId>/durations.json for each scene listed below,
computes cumulative startFrames (with a 10-frame buffer between steps), then:

  - Rewrites each `startFrame: N,` in the scene .tsx in order
  - Updates the matching *_SCENE_FRAMES constant
  - Replaces (or inserts) the matching *Durations array in narration-scripts.ts
  - Ensures narrationDurationsByScene has an entry for the sceneId

Run with --dry-run to preview changes. Without --dry-run files are written.
"""

import argparse
import json
import re
import sys
from pathlib import Path

BUFFER = 10
FPS = 30
NARRATION_TS = Path("src/data/narration-scripts.ts")

# sceneId -> (tsx path, SCENE_FRAMES const, durations var name in narration-scripts.ts)
SCENES = {
    "bst-insert":         ("src/scenes/BSTInsert.tsx",            "BST_INSERT_SCENE_FRAMES",        "bstInsertDurations"),
    "diagonal-traversal": ("src/scenes/DiagonalTraversal.tsx",    "DIAGONAL_SCENE_FRAMES",          "diagonalDurations"),
    "diagonal-rl":        ("src/scenes/RightToLeftDiagonal.tsx",  "RTL_DIAGONAL_SCENE_FRAMES",      "rtlDiagonalDurations"),
    "left-view":          ("src/scenes/LeftViewTraversal.tsx",    "LEFT_VIEW_SCENE_FRAMES",         "leftViewDurations"),
    "level-order":        ("src/scenes/LevelOrder.tsx",           "LEVEL_ORDER_SCENE_FRAMES",       "levelOrderDurations"),
    "top-view":           ("src/scenes/TopViewTraversal.tsx",     "TOP_VIEW_SCENE_FRAMES",          "topViewDurations"),
}


def load_durations(scene_id: str):
    p = Path("public") / "narration" / scene_id / "durations.json"
    if not p.exists():
        return None
    return json.loads(p.read_text())


def compute_start_frames(durations):
    """Returns (list_of_startframes, total_scene_frames)."""
    sf = 0
    out = []
    for d in durations:
        out.append(sf)
        sf += d["frames"] + BUFFER
    return out, sf


def patch_scene_tsx(path: Path, new_start_frames, scene_frames_const: str, new_total: int, dry: bool):
    src = path.read_text()
    # Match `startFrame: <int>,` (in order)
    matches = list(re.finditer(r"startFrame:\s*(\d+)", src))
    if len(matches) != len(new_start_frames):
        return f"step-count mismatch: file has {len(matches)} startFrame entries, durations.json has {len(new_start_frames)}"

    # Build replacement in one pass to avoid offset drift
    pieces = []
    last_end = 0
    for m, new_sf in zip(matches, new_start_frames):
        pieces.append(src[last_end:m.start()])
        pieces.append(f"startFrame: {new_sf}")
        last_end = m.end()
    pieces.append(src[last_end:])
    new_src = "".join(pieces)

    # Update SCENE_FRAMES constant
    const_pattern = rf"({re.escape(scene_frames_const)}\s*=\s*)\d+"
    if not re.search(const_pattern, new_src):
        return f"could not locate '{scene_frames_const} = N' in {path}"
    new_src = re.sub(const_pattern, rf"\g<1>{new_total}", new_src)

    if dry:
        return f"would patch {len(new_start_frames)} startFrames + {scene_frames_const}={new_total}"

    path.write_text(new_src)
    return f"patched {len(new_start_frames)} startFrames + {scene_frames_const}={new_total}"


def render_durations_array(var_name: str, durations) -> str:
    lines = [f"export const {var_name}: NarrationDuration[] = ["]
    for d in durations:
        lines.append(f"  {{ step: {d['step']}, duration: {d['duration']}, frames: {d['frames']} }},")
    lines.append("];")
    return "\n".join(lines)


def patch_narration_scripts(scene_id: str, var_name: str, durations, dry: bool):
    src = NARRATION_TS.read_text()
    new_block = render_durations_array(var_name, durations)

    # Find existing block. Pattern: starts at `export const <var_name>: NarrationDuration[] = [` and ends at the first `];`
    block_re = re.compile(
        rf"export const {re.escape(var_name)}\s*:\s*NarrationDuration\[\]\s*=\s*\[[^\]]*\];",
        re.DOTALL,
    )

    if block_re.search(src):
        new_src = block_re.sub(new_block, src)
        action = "replaced"
    else:
        # Insert before `export const narrationDurationsByScene`
        insert_at = src.find("export const narrationDurationsByScene")
        if insert_at < 0:
            return "could not locate narrationDurationsByScene to insert before"
        new_src = src[:insert_at] + new_block + "\n\n" + src[insert_at:]
        action = "inserted"

    # Ensure entry in narrationDurationsByScene map
    map_entry_re = re.compile(rf'"{re.escape(scene_id)}"\s*:\s*\w+')
    if not map_entry_re.search(new_src):
        # Insert before closing `};` of the map
        map_re = re.compile(
            r"export const narrationDurationsByScene[^=]*=\s*\{",
            re.DOTALL,
        )
        m = map_re.search(new_src)
        if not m:
            return f"{action} array but could not locate narrationDurationsByScene map"
        # Find matching closing brace
        close_idx = new_src.find("\n};", m.end())
        if close_idx < 0:
            return f"{action} array but could not find map close"
        entry = f'  "{scene_id}": {var_name},\n'
        new_src = new_src[:close_idx + 1] + entry + new_src[close_idx + 1:]
        action += " + registered in map"

    if dry:
        return f"would have {action}"

    NARRATION_TS.write_text(new_src)
    return action


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("scene", nargs="*", help="Scene ID(s) to update (omit for all tree scenes)")
    ap.add_argument("--dry-run", action="store_true", help="Preview changes, don't write files")
    args = ap.parse_args()

    targets = args.scene or list(SCENES.keys())
    unknown = [s for s in targets if s not in SCENES]
    if unknown:
        print(f"Unknown scene(s): {', '.join(unknown)}")
        print(f"Available: {', '.join(SCENES.keys())}")
        sys.exit(1)

    failed = []
    for scene_id in targets:
        tsx_rel, const_name, var_name = SCENES[scene_id]
        tsx_path = Path(tsx_rel)
        durations = load_durations(scene_id)

        print(f"\n[{scene_id}]")
        if durations is None:
            print("  durations.json missing — skipping")
            failed.append(scene_id)
            continue

        start_frames, total = compute_start_frames(durations)
        print(f"  steps={len(durations)}  total_scene_frames={total}  (~{total/FPS:.1f}s)")

        if not tsx_path.exists():
            print(f"  ERROR: {tsx_path} not found")
            failed.append(scene_id)
            continue

        res_tsx = patch_scene_tsx(tsx_path, start_frames, const_name, total, args.dry_run)
        print(f"  {tsx_path}: {res_tsx}")
        if "mismatch" in res_tsx or "could not" in res_tsx:
            failed.append(scene_id)
            continue

        res_ts = patch_narration_scripts(scene_id, var_name, durations, args.dry_run)
        print(f"  {NARRATION_TS}: {res_ts}")
        if "could not" in res_ts:
            failed.append(scene_id)

    if failed:
        print(f"\nFailed: {', '.join(failed)}")
        sys.exit(1)
    print(f"\n{'Dry run' if args.dry_run else 'Done'}.")


if __name__ == "__main__":
    main()
