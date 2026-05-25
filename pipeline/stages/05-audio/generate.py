#!/usr/bin/env python3
"""Pipeline-native chunked-narration audio generator.

Reads `pipeline/scenes/<sid>.narration.yaml` (the chunked narration sidecar)
and renders one MP3 per step by running ChatterboxTTS.generate() once per
chunk with per-chunk (exaggeration, cfg_weight, temperature), splicing
torch.zeros silence between chunks per each chunk's `pauseAfter`.

This is the ONLY audio path. There is no AUTO-mode fallback to inline
`[pause:Xs]` markers in scene.yaml's `narration` field — that approach was
deprecated in favor of chunked authoring because a single Chatterbox call
has one acoustic identity for its full duration, and the persona × arc
preset can't crescendo within a step. The chunk boundary IS the emotion
boundary.

Required input layout:
    pipeline/scenes/<sid>.yaml             — for sceneId + step count cross-check
    pipeline/scenes/<sid>.narration.yaml   — the authoritative audio source

Outputs:
    public/narration/<sid>/step-N.mp3      — one per step, concatenated chunks
    public/narration/<sid>/durations.json  — consumed by stage 06 apply.py
    public/narration/<sid>/chunks/step-N-N.M.wav
                                            — per-chunk debug WAVs
                                              (gated on sidecar output.perChunkDebug)

Usage:
    python3 pipeline/stages/05-audio/generate.py <scene.yaml>
                  [--force]              Overwrite existing MP3s
                  [--step N]             Regenerate only step N
                  [--reference WAV]      Override reference audio for voice cloning

See `pipeline/design-system/teaching.md` for chunk authoring rules,
`pipeline/scenes/count-tree-nodes.narration.yaml` for a working example.
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

DEFAULT_REFERENCE_WAV = "scripts/my-voice.wav"
FPS = 30


def find_sidecar(scene_path: Path) -> Path:
    """Locate `<scene>.narration.yaml` next to `<scene>.yaml`.

    Errors if the sidecar is missing — chunked narration is the only audio
    path; there is no fallback to inline scene.yaml narration.
    """
    sidecar = scene_path.with_suffix("").with_suffix(".narration.yaml")
    if not sidecar.exists():
        print(
            f"ERROR: chunked-narration sidecar not found at {sidecar}\n"
            f"  This is the only audio path. Author a sidecar with:\n"
            f"    python3 pipeline/stages/03-narration/scaffold.py {scene_path}\n"
            f"  then tune chunk params per pipeline/design-system/teaching.md.",
            file=sys.stderr,
        )
        sys.exit(2)
    return sidecar


def load_sidecar(sidecar_path: Path) -> tuple[dict, dict[int, dict]]:
    """Parse a narration sidecar. Returns (top_level_dict, {stepIndex: step_dict}).

    Performs minimal schema validation — full validation is stage 03's job.
    Hard-errors only on conditions that would crash the generator.
    """
    data = yaml.safe_load(sidecar_path.read_text())
    if not isinstance(data, dict) or "steps" not in data:
        raise ValueError(f"Sidecar {sidecar_path} missing 'steps' key")
    steps_by_idx: dict[int, dict] = {}
    for s in data["steps"]:
        if "stepIndex" not in s or "chunks" not in s:
            raise ValueError(
                f"Sidecar {sidecar_path} step missing stepIndex/chunks: {s!r}"
            )
        chunks = s["chunks"]
        if not isinstance(chunks, list) or len(chunks) == 0:
            raise ValueError(
                f"Sidecar {sidecar_path} step {s['stepIndex']} has no chunks"
            )
        for c in chunks:
            for required in ("id", "text", "params"):
                if required not in c:
                    raise ValueError(
                        f"Sidecar {sidecar_path} step {s['stepIndex']} "
                        f"chunk missing {required!r}: {c!r}"
                    )
            params = c["params"]
            for required in ("exaggeration", "cfg_weight", "temperature"):
                if required not in params:
                    raise ValueError(
                        f"Sidecar {sidecar_path} step {s['stepIndex']} "
                        f"chunk {c['id']} params missing {required!r}"
                    )
        steps_by_idx[s["stepIndex"]] = s
    return data, steps_by_idx


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


def generate_chunked_speech(
    model,
    chunks: list[dict],
    output_mp3: str,
    reference_wav: str,
    debug_dir: Path | None = None,
    debug_prefix: str = "",
) -> None:
    """Synthesize a list of hand-authored chunks → single MP3.

    Each chunk runs ChatterboxTTS.generate() with its own (exaggeration,
    cfg_weight, temperature). Between chunks, `pauseAfter` seconds of
    torch.zeros silence are spliced in. If `seed` is set on a chunk, the
    PyTorch RNG is seeded before that chunk for reproducibility.

    Per-chunk debug WAVs land at `{debug_dir}/{debug_prefix}{chunk.id}.wav`
    when `debug_dir` is provided.

    Chunk schema (validated at load):
      { id: str, text: str,
        params: {exaggeration, cfg_weight, temperature},
        pauseAfter: float (optional, default 0),
        seed: int (optional — locks the random draw for this chunk) }
    """
    import torch
    import torchaudio

    audio_segments: list = []
    ref_segment = None
    has_reference = bool(reference_wav) and Path(reference_wav).exists()

    if debug_dir is not None:
        debug_dir.mkdir(parents=True, exist_ok=True)

    for chunk in chunks:
        text = (chunk.get("text") or "").strip()
        if not text:
            continue

        # Per-chunk seed lock: reproducibility for "this take is the keeper".
        if "seed" in chunk and chunk["seed"] is not None:
            torch.manual_seed(int(chunk["seed"]))

        params = chunk["params"]
        wav = model.generate(
            text=text,
            audio_prompt_path=reference_wav if has_reference else None,
            exaggeration=params["exaggeration"],
            cfg_weight=params["cfg_weight"],
            temperature=params["temperature"],
        )
        if ref_segment is None:
            ref_segment = wav
        audio_segments.append(wav)

        # Save this chunk alone for surgical inspection / regenerate.
        if debug_dir is not None:
            chunk_wav_path = debug_dir / f"{debug_prefix}{chunk['id']}.wav"
            torchaudio.save(str(chunk_wav_path), wav.cpu(), model.sr)

        # Splice the pause that follows this chunk.
        pause_after = float(chunk.get("pauseAfter", 0) or 0)
        if pause_after > 0:
            n_samples = int(pause_after * model.sr)
            if n_samples > 0:
                silence = torch.zeros(
                    *ref_segment.shape[:-1], n_samples,
                    dtype=ref_segment.dtype, device=ref_segment.device,
                )
                audio_segments.append(silence)

    if not audio_segments:
        raise ValueError("No audio produced — every chunk's text was empty.")

    final_wav = torch.cat(audio_segments, dim=-1).cpu()

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_wav = tmp.name
    try:
        torchaudio.save(tmp_wav, final_wav, model.sr)
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
    ap.add_argument("scene_yaml", help="Path to scene.yaml (sidecar discovered alongside)")
    ap.add_argument("--force", "-f", action="store_true",
                    help="Overwrite existing MP3 files")
    ap.add_argument("--step", type=int, default=None,
                    help="Regenerate only this step (others left in place)")
    ap.add_argument("--reference", default=DEFAULT_REFERENCE_WAV,
                    help=f"Reference WAV for voice cloning (default: {DEFAULT_REFERENCE_WAV})")
    args = ap.parse_args()

    scene_path = Path(args.scene_yaml)
    if not scene_path.exists():
        print(f"Not found: {scene_path}", file=sys.stderr)
        sys.exit(2)

    scene = yaml.safe_load(scene_path.read_text())
    sid = scene["sceneId"]
    scene_step_indices = {s["stepIndex"] for s in scene["steps"]}

    sidecar_path = find_sidecar(scene_path)
    try:
        sidecar_top, sidecar_steps = load_sidecar(sidecar_path)
    except ValueError as e:
        print(f"ERROR loading sidecar: {e}", file=sys.stderr)
        sys.exit(2)

    # Sanity: every scene step must have a chunked entry. Single-path means
    # there's no AUTO fallback — if a step is missing from the sidecar we
    # can't render it.
    missing = scene_step_indices - set(sidecar_steps.keys())
    if missing:
        print(
            f"ERROR: sidecar is missing chunked narration for step(s): "
            f"{sorted(missing)}\n"
            f"  Author entries for these steps in {sidecar_path}.\n"
            f"  See pipeline/design-system/teaching.md 'Chunked narration'.",
            file=sys.stderr,
        )
        sys.exit(2)
    extra = set(sidecar_steps.keys()) - scene_step_indices
    if extra:
        print(
            f"WARNING: sidecar has chunked entries for stepIndex(es) "
            f"not in scene yaml: {sorted(extra)} — ignored.",
            file=sys.stderr,
        )

    out_dir = Path("public") / "narration" / sid
    out_dir.mkdir(parents=True, exist_ok=True)

    per_chunk_debug = bool(
        (sidecar_top or {}).get("output", {}).get("perChunkDebug")
    )
    debug_dir = (out_dir / "chunks") if per_chunk_debug else None

    target_indices = (
        {args.step} if args.step is not None
        else set(sidecar_steps.keys())
    )

    needs_gen = any(
        idx in target_indices
        and (args.force or not (out_dir / f"step-{idx}.mp3").exists())
        for idx in sidecar_steps
    )

    model = None
    if needs_gen:
        print("Loading Chatterbox model (first run downloads ~1.5 GB)...")
        from chatterbox.tts import ChatterboxTTS
        device = "cuda" if _has_cuda() else "cpu"
        print(f"Using device: {device}")
        model = ChatterboxTTS.from_pretrained(device=device)
        print("Model loaded.\n")

        if args.reference and not Path(args.reference).exists():
            print(f"WARNING: reference WAV not found at {args.reference} — "
                  f"generating without voice cloning.")

    print(f"Scene: {sid}")
    print(f"Sidecar: {sidecar_path}")
    print(f"Chunked steps: {len(sidecar_steps)}  "
          f"Total chunks: {sum(len(s['chunks']) for s in sidecar_steps.values())}")
    print("=" * 60)

    durations: list[dict] = []
    for idx in sorted(sidecar_steps.keys()):
        sidecar_step = sidecar_steps[idx]
        out_path = out_dir / f"step-{idx}.mp3"

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

        chunks = sidecar_step["chunks"]
        intent = sidecar_step.get("intent", "")
        print(f"  Step {idx} [{len(chunks)} chunks]: {intent!r}")
        for c in chunks:
            p = c["params"]
            pa = float(c.get("pauseAfter", 0) or 0)
            short = c["text"][:48] + ("..." if len(c["text"]) > 48 else "")
            seed_marker = f" seed={c['seed']}" if c.get("seed") is not None else ""
            print(
                f"      {c['id']:<5} ex={p['exaggeration']:.2f} "
                f"cw={p['cfg_weight']:.2f} t={p['temperature']:.2f} "
                f"+{pa:.2f}s{seed_marker}  \"{short}\""
            )

        generate_chunked_speech(
            model, chunks, str(out_path),
            reference_wav=args.reference,
            debug_dir=debug_dir,
            debug_prefix=f"step-{idx}-",
        )

        d = get_audio_duration(str(out_path))
        durations.append({
            "step": idx, "duration": d, "frames": math.ceil(d * FPS),
        })
        print(f"    -> {out_path} ({d:.2f}s, {math.ceil(d * FPS)} frames)")

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
