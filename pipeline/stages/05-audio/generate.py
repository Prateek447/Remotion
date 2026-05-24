#!/usr/bin/env python3
"""Pipeline-native audio generator. Reads scene.yaml directly.

Computes per-step Chatterbox knobs from `voice.persona × step.arc` per
`pipeline/design-system/voice/two-axis-model.md`, then synthesizes MP3s.

Pipeline isolation note: this script intentionally does NOT import from
`scripts/generate-narration-chatterbox.py`. The legacy script is the editorial
ancestor of this pipeline but is preserved untouched. All pipeline-driven scenes
use this script; existing scenes continue using the legacy one.

Outputs:
  - public/narration/<sceneId>/step-N.mp3        (one per step)
  - public/narration/<sceneId>/durations.json    (consumed by apply-narration-updates.py)

Usage:
    python3 pipeline/stages/05-audio/generate.py <scene.yaml>
                  [--force]              Overwrite existing MP3s
                  [--step N]             Regenerate only step N
                  [--reference WAV]      Override reference audio for voice cloning
"""

import argparse
import json
import math
import os
import subprocess
import sys
import tempfile
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

DEFAULT_REFERENCE_WAV = "scripts/my-voice.wav"
FPS = 30


def resolve_preset(persona: str, step: dict) -> dict:
    """persona × arc → (exaggeration, cfg_weight, temperature), honoring voiceOverride."""
    arc = step["arc"]
    base = dict(PRESET_MATRIX[persona][arc])
    override = step.get("voiceOverride") or {}
    base.update({k: v for k, v in override.items() if k in base})
    return base


def get_audio_duration(file_path: str) -> float:
    try:
        result = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "csv=p=0", file_path],
            capture_output=True, text=True, check=True,
        )
        return float(result.stdout.strip())
    except Exception:
        return 3.0


def wav_to_mp3(wav_path: str, mp3_path: str) -> None:
    subprocess.run(
        ["ffmpeg", "-y", "-i", wav_path,
         "-codec:a", "libmp3lame", "-q:a", "2", mp3_path],
        check=True, capture_output=True,
    )


def generate_speech(
    model,
    text: str,
    output_mp3: str,
    reference_wav: str,
    exaggeration: float,
    cfg_weight: float,
    temperature: float,
) -> None:
    import torchaudio
    wav = model.generate(
        text=text,
        audio_prompt_path=reference_wav if reference_wav else None,
        exaggeration=exaggeration,
        cfg_weight=cfg_weight,
        temperature=temperature,
    )
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_wav = tmp.name
    try:
        torchaudio.save(tmp_wav, wav, model.sr)
        wav_to_mp3(tmp_wav, output_mp3)
    finally:
        os.unlink(tmp_wav)


def _has_cuda() -> bool:
    try:
        import torch
        return torch.cuda.is_available()
    except ImportError:
        return False


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("scene_yaml", help="Path to scene.yaml")
    ap.add_argument("--force", "-f", action="store_true",
                    help="Overwrite existing MP3 files")
    ap.add_argument("--step", type=int, default=None,
                    help="Regenerate only this step (others left in place)")
    ap.add_argument("--reference", default=DEFAULT_REFERENCE_WAV,
                    help=f"Reference WAV for voice cloning (default: {DEFAULT_REFERENCE_WAV})")
    args = ap.parse_args()

    path = Path(args.scene_yaml)
    if not path.exists():
        print(f"Not found: {path}", file=sys.stderr)
        sys.exit(2)

    scene = yaml.safe_load(path.read_text())
    sid = scene["sceneId"]
    persona = scene["voice"]["persona"]

    if persona not in PRESET_MATRIX:
        print(f"Unknown persona: {persona!r}. Allowed: {list(PRESET_MATRIX)}",
              file=sys.stderr)
        sys.exit(2)

    out_dir = Path("public") / "narration" / sid
    out_dir.mkdir(parents=True, exist_ok=True)

    all_steps = scene["steps"]
    target_indices = (
        {args.step} if args.step is not None
        else {s["stepIndex"] for s in all_steps}
    )

    # Decide whether we need the model loaded.
    needs_gen = any(
        s["stepIndex"] in target_indices
        and (args.force or not (out_dir / f"step-{s['stepIndex']}.mp3").exists())
        for s in all_steps
    )

    model = None
    if needs_gen:
        print(f"Loading Chatterbox model (first run downloads ~1.5 GB)...")
        from chatterbox.tts import ChatterboxTTS
        device = "cuda" if _has_cuda() else "cpu"
        print(f"Using device: {device}")
        model = ChatterboxTTS.from_pretrained(device=device)
        print("Model loaded.\n")

        if args.reference and not Path(args.reference).exists():
            print(f"WARNING: reference WAV not found at {args.reference} — "
                  f"generating without voice cloning.")

    print(f"Scene: {sid}  persona: {persona}")
    print("=" * 60)

    durations: list[dict] = []
    for step in all_steps:
        idx = step["stepIndex"]
        out_path = out_dir / f"step-{idx}.mp3"

        # If not targeted, still measure existing file (so durations.json is complete).
        if idx not in target_indices:
            if out_path.exists():
                d = get_audio_duration(str(out_path))
                durations.append({
                    "step": idx, "duration": d, "frames": math.ceil(d * FPS),
                })
            continue

        if out_path.exists() and not args.force:
            d = get_audio_duration(str(out_path))
            durations.append({
                "step": idx, "duration": d, "frames": math.ceil(d * FPS),
            })
            print(f"  Step {idx} [skip — exists]")
            continue

        text = step["narration"]
        short = text[:60] + "..." if len(text) > 60 else text
        preset = resolve_preset(persona, step)
        arc = step["arc"]

        print(
            f"  Step {idx} [{arc:10s} ex={preset['exaggeration']} "
            f"cw={preset['cfg_weight']} t={preset['temperature']}]: \"{short}\""
        )

        generate_speech(
            model, text, str(out_path),
            reference_wav=args.reference,
            exaggeration=preset["exaggeration"],
            cfg_weight=preset["cfg_weight"],
            temperature=preset["temperature"],
        )

        d = get_audio_duration(str(out_path))
        durations.append({
            "step": idx, "duration": d, "frames": math.ceil(d * FPS),
        })
        print(f"    -> {out_path} ({d:.2f}s, {math.ceil(d * FPS)} frames)")

    # Write durations.json (sorted by step).
    durations.sort(key=lambda x: x["step"])
    (out_dir / "durations.json").write_text(json.dumps(durations, indent=2))

    print()
    total = 0
    for d in durations:
        print(f"  Step {d['step']}: {d['duration']:.2f}s ({d['frames']} frames)")
        total += d["frames"]
    print(f"  Total audio: {total} frames (~{total / FPS:.1f}s)")
    print(f"  Saved durations to {out_dir / 'durations.json'}")

    print(f"\nNext: python3 pipeline/stages/06-apply/apply.py {args.scene_yaml}")


if __name__ == "__main__":
    main()
