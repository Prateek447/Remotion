#!/usr/bin/env python3
"""Pipeline-native timing reconciliation (stage 3c).

Reads scene.yaml + public/narration/<sceneId>/durations.json, patches:
  - src/scenes/<TitleCase>.tsx (rewrites every `startFrame: N` + the
    *_SCENE_FRAMES constant)
  - src/data/narration-scripts.ts (replaces or inserts the *Durations array,
    ensures narrationDurationsByScene registers the sceneId)

Pipeline isolation note: this script does NOT import from or invoke
scripts/apply-narration-updates.py. The legacy script remains as an ad-hoc
tool for non-pipeline scenes; pipeline-driven scenes use THIS script.

All identifiers are derived from scene.yaml's `sceneId` by convention.
scene.yaml may override via optional top-level fields:

    componentName:    "BSTInsert"               # overrides PascalCase derivation
    sceneConstName:   "BST_INSERT_SCENE_FRAMES" # overrides UPPER_SNAKE
    durationsVarName: "bstInsertDurations"      # overrides camelCase

(These overrides exist for compatibility with legacy scene naming that doesn't
follow the kebab-to-PascalCase convention — e.g. "bst-insert" → "BSTInsert"
not "BstInsert".)

Usage:
    python3 pipeline/stages/06-apply/apply.py <scene.yaml> [--dry-run]
"""

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("ERROR: pyyaml required. Install with: pip install pyyaml", file=sys.stderr)
    sys.exit(2)

BUFFER = 10
FPS = 30
NARRATION_TS = Path("src/data/narration-scripts.ts")


# ─── identifier derivation ───────────────────────────────────────────────────

def kebab_to_pascal(sid: str) -> str:
    return "".join(part.capitalize() for part in sid.split("-"))


def kebab_to_upper_snake(sid: str) -> str:
    return sid.upper().replace("-", "_")


def kebab_to_camel(sid: str) -> str:
    parts = sid.split("-")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


def derive_identifiers(scene: dict) -> dict:
    sid = scene["sceneId"]
    component = scene.get("componentName") or kebab_to_pascal(sid)
    return {
        "sceneId":          sid,
        "componentName":    component,
        "tsxPath":          Path("src/scenes") / f"{component}.tsx",
        "sceneConstName":   scene.get("sceneConstName")
                            or f"{kebab_to_upper_snake(sid)}_SCENE_FRAMES",
        "durationsVarName": scene.get("durationsVarName")
                            or f"{kebab_to_camel(sid)}Durations",
    }


# ─── core helpers ────────────────────────────────────────────────────────────

def load_durations(scene_id: str):
    p = Path("public") / "narration" / scene_id / "durations.json"
    if not p.exists():
        return None
    return json.loads(p.read_text())


def compute_start_frames(durations):
    sf = 0
    out = []
    for d in durations:
        out.append(sf)
        sf += d["frames"] + BUFFER
    return out, sf


def load_narration_sidecar(scene_yaml_path: Path, scene_id: str):
    """Convention: <scene_dir>/<sceneId>.narration.yaml. Returns None if absent."""
    sidecar_path = scene_yaml_path.parent / f"{scene_id}.narration.yaml"
    if not sidecar_path.exists():
        return None
    return yaml.safe_load(sidecar_path.read_text())


def ffprobe_duration_seconds(p: Path) -> float:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", str(p)],
        capture_output=True, text=True, check=True,
    )
    return float(result.stdout.strip())


def compute_visual_offsets(sidecar, scene_id: str, n_steps: int) -> list[int]:
    """Return per-step visualOffset in frames (default 0).

    For each step with visualEnterChunk: K (>0), sum the in-MP3 section length
    of chunks [0..K-1]: each chunk's per-wav audio frames plus its pauseAfter
    silence frames. The visual transition lands at the start of chunk K.
    """
    offsets = [0] * n_steps
    if sidecar is None:
        return offsets
    chunks_dir = Path("public") / "narration" / scene_id / "chunks"
    for step in sidecar.get("steps", []):
        idx = step.get("stepIndex")
        if idx is None or idx >= n_steps:
            continue
        K = step.get("visualEnterChunk", 0)
        if K <= 0:
            continue
        chunks = step.get("chunks", [])
        if K > len(chunks):
            print(
                f"  WARNING: step {idx} visualEnterChunk={K} but only {len(chunks)} chunks; clamping",
                file=sys.stderr,
            )
            K = len(chunks)
        total = 0
        ok = True
        for chunk in chunks[:K]:
            # generate.py names per-chunk wavs `step-<stepIndex>-<chunkId>.wav`,
            # e.g. `step-4-4.0.wav`.
            chunk_id = chunk.get("id")
            if chunk_id is None:
                print(
                    f"  WARNING: step {idx} chunk missing id; leaving visualOffset=0",
                    file=sys.stderr,
                )
                ok = False
                break
            wav = chunks_dir / f"step-{idx}-{chunk_id}.wav"
            if not wav.exists():
                print(
                    f"  WARNING: missing {wav}; leaving step {idx} visualOffset=0",
                    file=sys.stderr,
                )
                ok = False
                break
            audio_frames = round(ffprobe_duration_seconds(wav) * FPS)
            pause_frames = round(float(chunk.get("pauseAfter", 0.0)) * FPS)
            total += audio_frames + pause_frames
        if ok:
            offsets[idx] = total
    return offsets


# Captures `startFrame: N` plus an OPTIONAL adjacent `visualOffset: N` line.
# The non-capturing `(?:...)?` group lets us rewrite both atomically per step:
# either keep both, replace both, or strip the visualOffset when it returns to 0.
_STEP_FIELDS_RE = re.compile(
    r"(?P<indent>[ \t]*)startFrame:\s*\d+,?"
    r"(?:[ \t]*\r?\n[ \t]*visualOffset:\s*\d+,?)?",
    re.MULTILINE,
)


def patch_scene_tsx(
    path: Path,
    new_start_frames,
    new_visual_offsets,
    scene_frames_const: str,
    new_total: int,
    dry: bool,
) -> str:
    src = path.read_text()
    matches = list(_STEP_FIELDS_RE.finditer(src))
    if len(matches) != len(new_start_frames):
        return (
            f"step-count mismatch: file has {len(matches)} startFrame entries, "
            f"durations.json has {len(new_start_frames)}"
        )

    pieces = []
    last_end = 0
    for m, new_sf, new_vo in zip(matches, new_start_frames, new_visual_offsets):
        pieces.append(src[last_end:m.start()])
        indent = m.group("indent")
        block = f"{indent}startFrame: {new_sf},"
        if new_vo > 0:
            block += f"\n{indent}visualOffset: {new_vo},"
        pieces.append(block)
        last_end = m.end()
    pieces.append(src[last_end:])
    new_src = "".join(pieces)

    # Update *_SCENE_FRAMES constant.
    const_pattern = rf"({re.escape(scene_frames_const)}\s*=\s*)\d+"
    if not re.search(const_pattern, new_src):
        return f"could not locate '{scene_frames_const} = N' in {path}"
    new_src = re.sub(const_pattern, rf"\g<1>{new_total}", new_src)

    if dry:
        n_offsets = sum(1 for vo in new_visual_offsets if vo > 0)
        suffix = f" + {n_offsets} visualOffsets" if n_offsets else ""
        return (
            f"would patch {len(new_start_frames)} startFrames + "
            f"{scene_frames_const}={new_total}{suffix}"
        )

    path.write_text(new_src)
    n_offsets = sum(1 for vo in new_visual_offsets if vo > 0)
    suffix = f" + {n_offsets} visualOffsets" if n_offsets else ""
    return (
        f"patched {len(new_start_frames)} startFrames + "
        f"{scene_frames_const}={new_total}{suffix}"
    )


def render_durations_array(var_name: str, durations) -> str:
    lines = [f"export const {var_name}: NarrationDuration[] = ["]
    for d in durations:
        lines.append(
            f"  {{ step: {d['step']}, duration: {d['duration']}, frames: {d['frames']} }},"
        )
    lines.append("];")
    return "\n".join(lines)


def patch_narration_scripts(
    scene_id: str, var_name: str, durations, dry: bool,
) -> str:
    src = NARRATION_TS.read_text()
    new_block = render_durations_array(var_name, durations)

    block_re = re.compile(
        rf"export const {re.escape(var_name)}\s*:\s*NarrationDuration\[\]\s*=\s*\[[^\]]*\];",
        re.DOTALL,
    )

    if block_re.search(src):
        new_src = block_re.sub(new_block, src)
        action = "replaced"
    else:
        insert_at = src.find("export const narrationDurationsByScene")
        if insert_at < 0:
            return "could not locate narrationDurationsByScene to insert before"
        new_src = src[:insert_at] + new_block + "\n\n" + src[insert_at:]
        action = "inserted"

    map_entry_re = re.compile(rf'"{re.escape(scene_id)}"\s*:\s*\w+')
    if not map_entry_re.search(new_src):
        map_re = re.compile(
            r"export const narrationDurationsByScene[^=]*=\s*\{",
            re.DOTALL,
        )
        m = map_re.search(new_src)
        if not m:
            return f"{action} array but could not locate narrationDurationsByScene map"
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


# ─── CLI ─────────────────────────────────────────────────────────────────────

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("scene_yaml", help="Path to scene.yaml")
    ap.add_argument("--dry-run", action="store_true",
                    help="Preview changes, don't write files")
    args = ap.parse_args()

    path = Path(args.scene_yaml)
    if not path.exists():
        print(f"Not found: {path}", file=sys.stderr)
        sys.exit(2)

    scene = yaml.safe_load(path.read_text())
    ids = derive_identifiers(scene)
    durations = load_durations(ids["sceneId"])

    print(f"[{ids['sceneId']}]")

    if durations is None:
        print(
            f"  durations.json missing at "
            f"public/narration/{ids['sceneId']}/durations.json"
        )
        print(f"  → run stage 3a (audio generation) first")
        sys.exit(1)

    start_frames, total = compute_start_frames(durations)
    print(f"  steps={len(durations)}  total_scene_frames={total}  (~{total/FPS:.1f}s)")
    print(f"  tsx={ids['tsxPath']}")
    print(f"  const={ids['sceneConstName']}")
    print(f"  var={ids['durationsVarName']}")

    if not ids["tsxPath"].exists():
        print(f"  ERROR: {ids['tsxPath']} not found — run stage 2b (scaffold) first")
        sys.exit(1)

    sidecar = load_narration_sidecar(path, ids["sceneId"])
    visual_offsets = compute_visual_offsets(sidecar, ids["sceneId"], len(durations))
    nonzero = [(i, o) for i, o in enumerate(visual_offsets) if o > 0]
    if nonzero:
        pretty = ", ".join(f"step{i}={o}f" for i, o in nonzero)
        print(f"  visualOffsets: {pretty}")

    res_tsx = patch_scene_tsx(
        ids["tsxPath"], start_frames, visual_offsets,
        ids["sceneConstName"], total, args.dry_run,
    )
    print(f"  {ids['tsxPath']}: {res_tsx}")
    if "mismatch" in res_tsx or "could not" in res_tsx:
        sys.exit(1)

    if not NARRATION_TS.exists():
        print(f"  ERROR: {NARRATION_TS} not found")
        sys.exit(1)

    res_ts = patch_narration_scripts(
        ids["sceneId"], ids["durationsVarName"], durations, args.dry_run,
    )
    print(f"  {NARRATION_TS}: {res_ts}")
    if "could not" in res_ts:
        sys.exit(1)

    print(f"\n{'Dry run' if args.dry_run else 'Done'}.")


if __name__ == "__main__":
    main()
