#!/usr/bin/env python3
"""VoxCPM2 POC — render one step from a chunked narration sidecar.

Small experiment to compare VoxCPM2 voice quality against the production
Chatterbox path (`pipeline/stages/05-audio/generate.py`). Reads the same
`pipeline/scenes/<sid>.narration.yaml` sidecar the production generator
consumes, picks one step, and renders each chunk through VoxCPM2 — splicing
`pauseAfter` silence between chunks exactly like the production path.

Engine knob mismatch (intentional):
    Chatterbox chunks carry (exaggeration, cfg_weight, temperature). VoxCPM2
    has (cfg_value, inference_timesteps) instead — there is no direct mapping.
    The POC ignores per-chunk Chatterbox params and applies one VoxCPM2 setting
    across the whole step. The goal is to hear *baseline* VoxCPM2 quality, not
    a per-emotion-tuned arc. If VoxCPM2 sounds promising, the next step is to
    extend the sidecar with engine-specific param blocks.

Setup:
    pip install voxcpm soundfile pyyaml numpy
    ffmpeg on PATH

Usage:
    # Default: step 0 of count-tree-nodes with reference voice
    python3 pipeline/experiments/voxcpm-poc/poc.py

    # Different step / scene
    python3 pipeline/experiments/voxcpm-poc/poc.py --step 5
    python3 pipeline/experiments/voxcpm-poc/poc.py \\
        --scene pipeline/scenes/count-tree-nodes.yaml --step 12

    # Tune VoxCPM2 knobs
    python3 pipeline/experiments/voxcpm-poc/poc.py --cfg-value 2.5 \\
        --inference-timesteps 16

    # No voice cloning — use voice description prompt instead
    python3 pipeline/experiments/voxcpm-poc/poc.py --no-clone

Outputs:
    pipeline/experiments/voxcpm-poc/output/<sid>-step-N.mp3
    pipeline/experiments/voxcpm-poc/output/chunks/<sid>-step-N-id.wav

A/B compare against:
    public/narration/<sid>/step-N.mp3   (Chatterbox production take)
"""

import argparse
import os
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np

try:
    import yaml
except ImportError:
    print("ERROR: pyyaml required. Install with: pip install pyyaml", file=sys.stderr)
    sys.exit(2)

DEFAULT_SCENE = "pipeline/scenes/count-tree-nodes.yaml"
DEFAULT_REFERENCE = "scripts/my-voice.wav"
DEFAULT_STEP = 0
DEFAULT_CFG_VALUE = 2.0
DEFAULT_INFERENCE_TIMESTEPS = 10
VOICE_DESC = (
    "(A young male educator, clear and energetic articulation, conversational tone)"
)


def wav_to_mp3(wav_path: str, mp3_path: str) -> None:
    subprocess.run(
        ["ffmpeg", "-y", "-i", wav_path,
         "-codec:a", "libmp3lame", "-q:a", "2", mp3_path],
        check=True, capture_output=True,
    )


def to_numpy_1d(x) -> np.ndarray:
    if hasattr(x, "cpu"):
        x = x.cpu().numpy()
    arr = np.asarray(x)
    return arr.squeeze()


def find_sidecar(scene_path: Path) -> Path:
    sidecar = scene_path.with_suffix("").with_suffix(".narration.yaml")
    if not sidecar.exists():
        print(f"ERROR: sidecar not found at {sidecar}", file=sys.stderr)
        sys.exit(2)
    return sidecar


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--scene", default=DEFAULT_SCENE,
                    help=f"Scene YAML (sidecar discovered alongside). "
                         f"Default: {DEFAULT_SCENE}")
    ap.add_argument("--step", type=int, default=DEFAULT_STEP,
                    help=f"stepIndex to render. Default: {DEFAULT_STEP}")
    ap.add_argument("--reference", default=DEFAULT_REFERENCE,
                    help=f"Reference WAV for voice cloning. "
                         f"Default: {DEFAULT_REFERENCE}")
    ap.add_argument("--cfg-value", type=float, default=DEFAULT_CFG_VALUE,
                    help=f"VoxCPM2 cfg_value. Default: {DEFAULT_CFG_VALUE}")
    ap.add_argument("--inference-timesteps", type=int,
                    default=DEFAULT_INFERENCE_TIMESTEPS,
                    help=f"VoxCPM2 inference_timesteps. "
                         f"Default: {DEFAULT_INFERENCE_TIMESTEPS}")
    ap.add_argument("--no-clone", action="store_true",
                    help="Skip reference voice cloning, use voice description instead")
    args = ap.parse_args()

    scene_path = Path(args.scene)
    if not scene_path.exists():
        print(f"Scene not found: {scene_path}", file=sys.stderr)
        sys.exit(2)

    sidecar_path = find_sidecar(scene_path)
    data = yaml.safe_load(sidecar_path.read_text())
    sid = data.get("sceneId") or scene_path.stem

    step = next(
        (s for s in data["steps"] if s["stepIndex"] == args.step),
        None,
    )
    if step is None:
        avail = sorted(s["stepIndex"] for s in data["steps"])
        print(f"Step {args.step} not in sidecar. Available: {avail}",
              file=sys.stderr)
        sys.exit(2)

    chunks = step["chunks"]
    use_reference = (not args.no_clone) and Path(args.reference).exists()

    print(f"Scene: {sid}")
    print(f"Sidecar: {sidecar_path}")
    print(f"Step: {args.step}  Chunks: {len(chunks)}")
    print(f"Intent: {step.get('intent', '')}")
    print(f"VoxCPM2: cfg_value={args.cfg_value} "
          f"inference_timesteps={args.inference_timesteps}")
    if use_reference:
        print(f"Voice: cloned from {args.reference}")
    else:
        reason = "no-clone flag" if args.no_clone else f"missing: {args.reference}"
        print(f"Voice: description prompt ({reason})")
    print("=" * 60)

    print("Loading VoxCPM2 (first run downloads ~4 GB)...")
    from voxcpm import VoxCPM
    import soundfile as sf

    model = VoxCPM.from_pretrained("openbmb/VoxCPM2", load_denoiser=False)
    sr = model.tts_model.sample_rate
    print(f"Model loaded. Sample rate: {sr}\n")

    out_dir = Path(__file__).parent / "output"
    chunks_dir = out_dir / "chunks"
    chunks_dir.mkdir(parents=True, exist_ok=True)

    segments: list[np.ndarray] = []
    for chunk in chunks:
        text = (chunk.get("text") or "").strip()
        if not text:
            continue
        short = text[:60] + ("..." if len(text) > 60 else "")
        print(f"  {chunk['id']:<5}  \"{short}\"")

        if use_reference:
            wav = model.generate(
                text=text,
                reference_wav_path=args.reference,
                cfg_value=args.cfg_value,
                inference_timesteps=args.inference_timesteps,
            )
        else:
            wav = model.generate(
                text=f"{VOICE_DESC}{text}",
                cfg_value=args.cfg_value,
                inference_timesteps=args.inference_timesteps,
            )

        wav_np = to_numpy_1d(wav)
        chunk_path = chunks_dir / f"{sid}-step-{args.step}-{chunk['id']}.wav"
        sf.write(str(chunk_path), wav_np, sr)
        segments.append(wav_np)

        pause = float(chunk.get("pauseAfter", 0) or 0)
        if pause > 0:
            n = int(pause * sr)
            if n > 0:
                segments.append(np.zeros(n, dtype=wav_np.dtype))

    if not segments:
        print("ERROR: no audio produced (every chunk text was empty)",
              file=sys.stderr)
        sys.exit(2)

    final_wav = np.concatenate(segments, axis=-1)
    mp3_path = out_dir / f"{sid}-step-{args.step}.mp3"

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_wav = tmp.name
    try:
        sf.write(tmp_wav, final_wav, sr)
        wav_to_mp3(tmp_wav, str(mp3_path))
    finally:
        os.unlink(tmp_wav)

    duration = len(final_wav) / sr
    print()
    print(f"  -> {mp3_path} ({duration:.2f}s)")
    print(f"  -> per-chunk WAVs: {chunks_dir}/")
    print()
    chatterbox_ref = Path("public/narration") / sid / f"step-{args.step}.mp3"
    if chatterbox_ref.exists():
        print(f"A/B compare against Chatterbox take: {chatterbox_ref}")
    else:
        print(f"(no Chatterbox take found at {chatterbox_ref} for A/B)")


if __name__ == "__main__":
    main()
