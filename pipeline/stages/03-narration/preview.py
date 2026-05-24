#!/usr/bin/env python3
"""Preview narration: persona × arc preset resolution + TTS-readiness lint.

This is a *read-only* preview — it does not write any files. Use before running
the pipeline-native audio generator (stage 5) to catch:

  - TTS-unreadable narration (digits, [bracket-tags], `O(n)`, `.next`, etc.)
  - Long breath groups that will sound bot-read
  - Per-step preset values the audio generator will apply

Usage:
    python3 pipeline/stages/03-narration/preview.py <scene.yaml>
"""

import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("ERROR: pyyaml required. Install with: pip install pyyaml", file=sys.stderr)
    sys.exit(2)

# Source of truth: pipeline/design-system/voice/two-axis-model.md
PRESET_MATRIX: dict[str, dict[str, dict[str, float]]] = {
    "teacher-energetic": {
        "opening":    {"exaggeration": 0.60, "cfg_weight": 0.45, "temperature": 0.85},
        "methodical": {"exaggeration": 0.55, "cfg_weight": 0.50, "temperature": 0.83},
        "peak":       {"exaggeration": 0.80, "cfg_weight": 0.30, "temperature": 0.93},
        "closing":    {"exaggeration": 0.70, "cfg_weight": 0.40, "temperature": 0.90},
    },
    "measured": {
        "opening":    {"exaggeration": 0.50, "cfg_weight": 0.50, "temperature": 0.80},
        "methodical": {"exaggeration": 0.35, "cfg_weight": 0.60, "temperature": 0.75},
        "peak":       {"exaggeration": 0.65, "cfg_weight": 0.40, "temperature": 0.90},
        "closing":    {"exaggeration": 0.55, "cfg_weight": 0.45, "temperature": 0.85},
    },
    "casual": {
        "opening":    {"exaggeration": 0.55, "cfg_weight": 0.45, "temperature": 0.85},
        "methodical": {"exaggeration": 0.50, "cfg_weight": 0.50, "temperature": 0.82},
        "peak":       {"exaggeration": 0.70, "cfg_weight": 0.35, "temperature": 0.90},
        "closing":    {"exaggeration": 0.60, "cfg_weight": 0.45, "temperature": 0.87},
    },
}

TTS_HAZARDS = [
    ("O(",       "O of n / O of one / O of log n"),
    (".next",    "dot next"),
    (".val",     "dot val"),
    (".size",    "dot size"),
    (".left",    "dot left"),
    (".right",   "dot right"),
    ("n+1",      "n plus one"),
    ("n-1",      "n minus one"),
    ("i+1",      "i plus one"),
    ("->",       "arrow / points to"),
    ("==",       "equals / equal to"),
    ("!=",       "not equal to"),
    ("<=",       "less than or equal to"),
    (">=",       "greater than or equal to"),
]


def resolve_preset(persona: str, step: dict) -> dict:
    arc = step["arc"]
    base = dict(PRESET_MATRIX[persona][arc])
    override = step.get("voiceOverride") or {}
    base.update({k: v for k, v in override.items() if k in base})
    return base


def lint_tts(narration: str) -> list[str]:
    issues: list[str] = []
    if not isinstance(narration, str):
        return issues
    if re.search(r"\b\d+\b", narration):
        issues.append("contains digits — spell as words")
    if "[" in narration or "]" in narration:
        issues.append("contains [brackets] — Chatterbox reads them literally")
    for hazard, fix in TTS_HAZARDS:
        if hazard in narration:
            issues.append(f"{hazard!r} → say {fix!r}")
    for sentence in re.split(r"[.!?]", narration):
        for bg in re.split(r"—|--", sentence):
            wc = len(bg.strip().split())
            if wc > 12:
                issues.append(f"breath group of {wc} words > 12: {bg.strip()!r}")
    return issues


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: preview.py <scene.yaml>", file=sys.stderr)
        sys.exit(2)

    path = Path(sys.argv[1])
    if not path.exists():
        print(f"Not found: {path}", file=sys.stderr)
        sys.exit(2)

    scene = yaml.safe_load(path.read_text())
    sid = scene["sceneId"]
    persona = scene["voice"]["persona"]

    if persona not in PRESET_MATRIX:
        print(f"Unknown persona: {persona!r}. Allowed: {list(PRESET_MATRIX)}", file=sys.stderr)
        sys.exit(2)

    print("=" * 78)
    print(f"NARRATION PREVIEW — sceneId={sid}  persona={persona}")
    print("=" * 78)

    # Per-step preset table
    print(f"\n{'step':>4}  {'arc':<11}  {'exagg':>6}  {'cfg_w':>6}  {'temp':>5}  text")
    print("-" * 78)
    any_lint = False
    for step in scene["steps"]:
        idx = step["stepIndex"]
        arc = step["arc"]
        preset = resolve_preset(persona, step)
        narration = step.get("narration", "")
        short = narration if len(narration) <= 40 else narration[:37] + "..."

        print(
            f"{idx:>4}  {arc:<11}  "
            f"{preset['exaggeration']:>6.2f}  {preset['cfg_weight']:>6.2f}  {preset['temperature']:>5.2f}  "
            f"{short}"
        )

        issues = lint_tts(narration)
        if issues:
            any_lint = True
            for issue in issues:
                print(f"        ⚠ {issue}")

    print()
    if any_lint:
        print("⚠  TTS-readiness warnings above — fix narration in scene.yaml before audio gen.")
    else:
        print("✅ No TTS-readiness issues detected.")

    print(
        f"\nNext: python3 pipeline/stages/05-audio/generate.py {path}"
        f"\n      (or: bash pipeline/run.sh {path} audio)"
    )


if __name__ == "__main__":
    main()
