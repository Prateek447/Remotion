#!/usr/bin/env python3
"""scene.yaml → skeleton `<scene>.narration.yaml`

Generates a one-chunk-per-step starter for chunked narration authoring. Each
step's `narration` text becomes the chunk's `text`; the step's `arc` seeds
default params from the ARC_DEFAULTS palette. The author (Claude or human)
then refines:

  - Splits any step whose emotion shifts within it into multiple chunks
    (a setup chunk + an arithmetic chunk + a reveal chunk, etc.)
  - Tunes per-chunk params against the param tier legend in
    `pipeline/design-system/teaching.md` "Chunked narration"
  - Sets `pauseAfter` values between chunks where pauses matter

Refuses to overwrite an existing sidecar unless `--force` is passed.

Usage:
    python3 pipeline/stages/03-narration/scaffold.py <scene.yaml> [--force]
"""

import argparse
import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("ERROR: pyyaml required. Install with: pip install pyyaml",
          file=sys.stderr)
    sys.exit(2)

# Per-arc starting params. Source of truth lives in
# `pipeline/design-system/teaching.md` param tier legend. These are
# middle-of-the-road values for each arc; authors are expected to tune.
ARC_DEFAULTS: dict[str, dict[str, float]] = {
    "opening":    {"exaggeration": 0.55, "cfg_weight": 0.58, "temperature": 0.88},
    "methodical": {"exaggeration": 0.58, "cfg_weight": 0.58, "temperature": 0.88},
    "peak":       {"exaggeration": 0.82, "cfg_weight": 0.40, "temperature": 0.93},
    "closing":    {"exaggeration": 0.72, "cfg_weight": 0.50, "temperature": 0.90},
}

# Strip [pause:Xs] markers if present — those belong to the deprecated AUTO
# mode. The chunk text should be the actual words to speak; pauses live in
# pauseAfter between chunks.
PAUSE_PATTERN = re.compile(r"\[pause:\d+(?:\.\d+)?\]")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("scene_yaml", help="Path to scene.yaml")
    ap.add_argument("--force", "-f", action="store_true",
                    help="Overwrite existing sidecar if present")
    args = ap.parse_args()

    scene_path = Path(args.scene_yaml)
    if not scene_path.exists():
        print(f"Not found: {scene_path}", file=sys.stderr)
        sys.exit(2)

    sidecar_path = scene_path.with_suffix("").with_suffix(".narration.yaml")
    if sidecar_path.exists() and not args.force:
        print(
            f"Sidecar already exists: {sidecar_path}\n"
            f"Refusing to overwrite. Pass --force to regenerate from scene yaml,\n"
            f"or just edit the existing file.",
            file=sys.stderr,
        )
        sys.exit(2)

    scene = yaml.safe_load(scene_path.read_text())
    sid = scene["sceneId"]
    persona = scene.get("voice", {}).get("persona", "teacher-energetic")

    skeleton: dict = {
        "schemaVersion": 0.1,
        "sceneId": sid,
        "sourceScene": str(scene_path),
        "voice": {
            "reference": "scripts/my-voice.wav",
            "model": "chatterbox-tts",
        },
        "output": {
            "baseDir": f"public/narration/{sid}",
            "perChunkDebug": True,
        },
        "steps": [],
    }

    for step in scene["steps"]:
        idx = step["stepIndex"]
        arc = step.get("arc", "methodical")
        narration = (step.get("narration") or "").strip()
        # Clean any legacy AUTO-mode artifacts.
        text = PAUSE_PATTERN.sub("", narration).strip()
        text = re.sub(r"\s+", " ", text)

        params = ARC_DEFAULTS.get(arc, ARC_DEFAULTS["methodical"])
        skeleton["steps"].append({
            "stepIndex": idx,
            "intent": step.get("intent", f"Step {idx} ({arc})"),
            "chunks": [
                {
                    "id": f"{idx}.0",
                    "intent": f"{arc} (single chunk — split if multiple beats)",
                    "text": text,
                    "params": dict(params),
                    "pauseAfter": 0.0,
                },
            ],
        })

    # YAML write — preserve insertion order, block style, no aliases.
    header_lines = [
        f"# Skeleton chunked narration for {sid} — produced by",
        f"# pipeline/stages/03-narration/scaffold.py from {scene_path}",
        f"#",
        f"# Author chunks: split any step whose emotion shifts within it,",
        f"# tune per-chunk params against the tier legend in",
        f"# pipeline/design-system/teaching.md 'Chunked narration'.",
        f"#",
        f"# Persona at scaffold time: {persona}",
        f"# Arc → starting params:",
    ]
    for arc_name, params in ARC_DEFAULTS.items():
        header_lines.append(
            f"#   {arc_name:<10} ex={params['exaggeration']:.2f} "
            f"cw={params['cfg_weight']:.2f} t={params['temperature']:.2f}"
        )

    body = yaml.safe_dump(skeleton, sort_keys=False, default_flow_style=False)
    sidecar_path.write_text("\n".join(header_lines) + "\n\n" + body)

    print(f"Wrote {sidecar_path}")
    print(f"  {len(skeleton['steps'])} step(s), 1 chunk each.")
    print(f"  Defaults seeded by arc; param tier legend in the file header.")
    print()
    print("Next:")
    print(f"  1. Edit {sidecar_path} — split high-emotion steps into")
    print(f"     multiple chunks, tune params per chunk, set pauseAfter values.")
    print(f"  2. python3 pipeline/stages/03-narration/preview.py {scene_path}")
    print(f"  3. python3 pipeline/stages/05-audio/generate.py {scene_path}")


if __name__ == "__main__":
    main()
