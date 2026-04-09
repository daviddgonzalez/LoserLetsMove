from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Iterable, Optional

import numpy as np
import torch
from torch.utils.data import Dataset


def load_fit3d_sequence(file_path: Path) -> np.ndarray:
    """Load a Fit3D joint JSON file and return a NumPy array.

    The Fit3D files in this repository contain a single top-level key
    such as "joints3d_25" and a list of frames. Each frame is a list of
    25 joints, and each joint is a 3-element [x, y, z] coordinate.
    """
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, dict):
        raise ValueError(f"Expected JSON object in {file_path}, got {type(data)}")

    if "joints3d_25" not in data:
        raise ValueError(f"Expected 'joints3d_25' key in {file_path}")

    seq = np.asarray(data["joints3d_25"], dtype=np.float32)
    if seq.ndim != 3 or seq.shape[2] != 3:
        raise ValueError(
            f"Expected sequence shape (T, J, 3) in {file_path}, got {seq.shape}"
        )

    return seq


def _resample_temporal(coords: np.ndarray, target_length: int) -> np.ndarray:
    t, j, c = coords.shape
    if t == target_length:
        return coords

    source_indices = np.linspace(0, t - 1, t)
    target_indices = np.linspace(0, t - 1, target_length)
    flat = coords.reshape(t, j * c)
    resampled_flat = np.zeros((target_length, j * c), dtype=coords.dtype)
    for col in range(j * c):
        resampled_flat[:, col] = np.interp(target_indices, source_indices, flat[:, col])

    return resampled_flat.reshape(target_length, j, c)


def normalize_sequence(coords: np.ndarray, sequence_length: int = 64) -> np.ndarray:
    """Normalize Fit3D joint sequences for training.

    This generic normalization is intentionally simple: it centers each frame,
    scales the skeleton to a stable range, and resamples to a fixed length.
    It is a good first step for Fit3D pretraining. If you later verify the
    exact joint ordering, you can make this anatomical normalization instead.
    """
    coords = coords.astype(np.float32)

    # Center each frame so the mean joint location is at the origin.
    coords = coords - coords.mean(axis=1, keepdims=True)

    # Scale by the maximum joint distance across the sequence.
    max_norm = np.max(np.linalg.norm(coords, axis=2))
    max_norm = max(max_norm, 1e-6)
    coords = coords / max_norm

    coords = _resample_temporal(coords, sequence_length)
    tensor = coords.transpose(2, 0, 1)  # (3, T, J)
    return tensor


def _segment_reps(seq_len: int, boundaries: list[int], min_frames: int = 8) -> list[tuple[int, int]]:
    boundaries = [int(b) for b in boundaries]
    segments: list[tuple[int, int]] = []
    start = 0
    for boundary in boundaries:
        end = min(boundary, seq_len)
        if end <= start:
            continue
        if end - start >= min_frames:
            segments.append((start, end))
        start = end

    # Optionally include a remaining tail segment if it is long enough.
    if seq_len - start >= min_frames:
        segments.append((start, seq_len))

    return segments


class Fit3DDataset(Dataset):
    """PyTorch dataset for Fit3D rep / exercise sequences."""

    def __init__(
        self,
        root: str | Path,
        subjects: Optional[Iterable[str]] = None,
        sequence_length: int = 64,
        use_rep_boundaries: bool = True,
        min_frames: int = 8,
        exercises: Optional[list[str]] = None,
    ) -> None:
        self.root = Path(root)
        self.sequence_length = sequence_length
        self.use_rep_boundaries = use_rep_boundaries
        self.min_frames = min_frames
        self.exercises = exercises
        self.samples: list[dict[str, Any]] = []
        self.exercise_to_label: dict[str, int] = {}
        self.label_to_exercise: dict[int, str] = {}

        self._build_index(subjects)

    def _build_index(self, subjects: Optional[Iterable[str]]) -> None:
        if subjects is None:
            subjects = sorted(
                [p.name for p in self.root.iterdir() if p.is_dir()]
            )

        for subject in subjects:
            subject_dir = self.root / subject
            if not subject_dir.exists():
                continue

            rep_ann_path = subject_dir / "rep_ann.json"
            rep_ann = self._load_rep_ann(rep_ann_path)
            joints_dir = subject_dir / "joints3d_25"
            if not joints_dir.exists():
                continue

            for json_path in sorted(joints_dir.glob("*.json")):
                exercise = json_path.stem
                if self.exercises is not None and exercise not in self.exercises:
                    continue
                label = self.exercise_to_label.setdefault(
                    exercise, len(self.exercise_to_label)
                )
                self.label_to_exercise[label] = exercise

                seq = load_fit3d_sequence(json_path)
                segments = [(0, len(seq))]

                if self.use_rep_boundaries and exercise in rep_ann:
                    segments = _segment_reps(len(seq), rep_ann[exercise], self.min_frames)

                for start, end in segments:
                    if end - start < self.min_frames:
                        continue
                    self.samples.append(
                        {
                            "path": json_path,
                            "exercise": exercise,
                            "label": label,
                            "start": start,
                            "end": end,
                        }
                    )

    def _load_rep_ann(self, path: Path) -> dict[str, list[int]]:
        if not path.exists():
            return {}
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, dict):
            return {}
        return {k: [int(x) for x in v] for k, v in data.items() if isinstance(v, list)}

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, index: int) -> tuple[torch.Tensor, int]:
        sample = self.samples[index]
        seq = load_fit3d_sequence(sample["path"])
        start, end = sample["start"], sample["end"]
        seq = seq[start:end]

        if seq.shape[0] < self.sequence_length:
            last_frame = seq[-1:]
            pad_count = self.sequence_length - seq.shape[0]
            seq = np.concatenate([seq, np.repeat(last_frame, pad_count, axis=0)], axis=0)

        tensor = normalize_sequence(seq, sequence_length=self.sequence_length)
        return torch.from_numpy(tensor), sample["label"]


def collate_fn(batch: list[tuple[torch.Tensor, int]]) -> tuple[torch.Tensor, torch.Tensor]:
    tensors, labels = zip(*batch)
    return torch.stack(tensors, dim=0), torch.tensor(labels, dtype=torch.long)
