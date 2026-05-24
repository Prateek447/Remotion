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
        "opening":    {"exaggeration": 0.60, "cfg_weight": 0.55, "temperature": 0.90},
        "methodical": {"exaggeration": 0.55, "cfg_weight": 0.60, "temperature": 0.88},
        "peak":       {"exaggeration": 0.80, "cfg_weight": 0.40, "temperature": 0.95},
        "closing":    {"exaggeration": 0.70, "cfg_weight": 0.50, "temperature": 0.92},
    },
    "measured": {
        "opening":    {"exaggeration": 0.50, "cfg_weight": 0.60, "temperature": 0.85},
        "methodical": {"exaggeration": 0.35, "cfg_weight": 0.65, "temperature": 0.80},
        "peak":       {"exaggeration": 0.65, "cfg_weight": 0.50, "temperature": 0.92},
        "closing":    {"exaggeration": 0.55, "cfg_weight": 0.55, "temperature": 0.88},
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

# Connector vocabulary — the production prosody mechanism is the connector-pause
# pattern: a real-English connector word followed by [pause:Xs] (see
# teaching.md "Natural prosody — the connector-pause pattern" and
# pipeline/experiments/filler-lab/README.md for empirical rejection of non-word
# fillers). These connectors render fine in Chatterbox because they're normal
# English words, not the short-segment failure mode that killed Um/Ah/Hmm.
#
# Counted in the prosody summary so authors can see how many connector beats
# the scene contains. Matched too loosely to gate the warning on (so/now/right
# also appear as regular content words) — the warning gates on [pause:Xs] and
# ellipsis count only.
CONNECTORS = {"so", "and", "but", "now", "then", "okay", "right", "well"}
CONNECTOR_RE = re.compile(
    r"\b(" + "|".join(sorted(CONNECTORS, key=len, reverse=True)) + r")\b",
    re.IGNORECASE,
)

# Pause marker syntax: [pause:0.5] inserts 500ms of digital silence at that
# position via silence-splicing in pipeline/stages/05-audio/generate.py.
# These markers are NOT TTS hazards (they're stripped before the digit/bracket
# checks below). See teaching.md "Natural prosody" for placement rules.
PAUSE_PATTERN = re.compile(r"\[pause:(\d+(?:\.\d+)?)\]")


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
    # Strip [pause:Xs] markers before the digit/bracket checks — they're
    # intentional prosody markers handled by silence-splicing, not literal
    # text Chatterbox will read.
    text_without_pauses = PAUSE_PATTERN.sub("", narration)
    if re.search(r"\b\d+\b", text_without_pauses):
        issues.append("contains digits — spell as words")
    if "[" in text_without_pauses or "]" in text_without_pauses:
        issues.append("contains [brackets] — Chatterbox reads them literally")
    for hazard, fix in TTS_HAZARDS:
        if hazard in text_without_pauses:
            issues.append(f"{hazard!r} → say {fix!r}")
    # Breath-group boundaries: period/!/?, em-dash, ellipsis (… or ...),
    # and [pause:Xs] markers (which inject silence at the audio level).
    # All of these reset the breath count.
    bg_split_re = r"—|--|…|\.\.\.|\[pause:\d+(?:\.\d+)?\]"
    for sentence in re.split(r"[.!?]", narration):
        for bg in re.split(bg_split_re, sentence):
            wc = len(bg.strip().split())
            if wc > 12:
                issues.append(f"breath group of {wc} words > 12: {bg.strip()!r}")
    return issues


def count_prosody_markers(scene: dict) -> tuple[int, int, int, float]:
    """Return (ellipses, connectors, pause_markers, pause_seconds_total)
    across all step narrations.

    Used for the scene-level zero-prosody warning. Connectors (So/And/But/
    Now/Then/Okay/Right/Well) are matched case-insensitively — they're the
    real-English vocabulary that pairs with [pause:Xs] in the production
    prosody pattern. Pause markers (`[pause:Xs]`) are counted alongside
    their total injected silence duration for visibility — they're the
    strongest prosody signal because they render as exact silence regardless
    of model behavior.
    """
    total_ellipses = 0
    total_connectors = 0
    total_pauses = 0
    total_pause_seconds = 0.0
    for step in scene.get("steps", []) or []:
        text = step.get("narration", "")
        if not isinstance(text, str):
            continue
        total_ellipses += text.count("…") + text.count("...")
        total_connectors += len(CONNECTOR_RE.findall(text))
        for dur in PAUSE_PATTERN.findall(text):
            total_pauses += 1
            total_pause_seconds += float(dur)
    return total_ellipses, total_connectors, total_pauses, total_pause_seconds


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

    # Scene-level prosody heuristic. `[pause:Xs]` markers are the strongest
    # signal — they render as deterministic silence at exact durations via
    # silence-splicing in generate.py. Ellipses (…) are softer (Chatterbox-
    # honored at high cfg_weight, ~500-700ms typical). Connectors (So/And/
    # But/Now/etc.) are reported but match loosely so they don't gate the
    # warning. See pipeline/design-system/teaching.md.
    step_count = len(scene.get("steps") or [])
    ellipses, connectors, pauses, pause_seconds = count_prosody_markers(scene)
    print(
        f"\nProsody markers: {pauses} [pause:Xs] ({pause_seconds:.1f}s total), "
        f"{ellipses} ellipses, {connectors} connector words "
        f"across {step_count} steps."
    )
    if step_count >= 8 and pauses == 0 and ellipses == 0:
        print(
            "⚠  Zero prosody markers detected. Narration likely reads scripted.\n"
            "   Primary tool: [pause:Xs] — exact silence via splicing in generate.py.\n"
            "   Secondary:    … (ellipsis) — soft pause honored at cfg_weight ≥ 0.55.\n"
            "   Add ~1 [pause:Xs] per 3-4 steps at emotional pause points\n"
            "   (before reveals, pre-arithmetic, mid-thought reconsiderations).\n"
            "   See pipeline/design-system/teaching.md 'Natural prosody'."
        )

    print(
        f"\nNext: python3 pipeline/stages/05-audio/generate.py {path}"
        f"\n      (or: bash pipeline/run.sh {path} audio)"
    )


if __name__ == "__main__":
    main()
