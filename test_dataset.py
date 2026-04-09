#!/usr/bin/env python3

import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_dir))

from ml.dataset import Fit3DDataset

def test_dataset():
    print("Testing dataset loading...")

    try:
        dataset = Fit3DDataset(
            root="dataset/fit3d_train/train",
            exercises=["squat"],
            use_rep_boundaries=True
        )

        print(f"Found {len(dataset)} squat samples")
        print(f"Exercises: {dataset.exercise_to_label}")
        print(f"Labels: {dataset.label_to_exercise}")

        if len(dataset) > 0:
            sample, label = dataset[0]
            print(f"Sample shape: {sample.shape}, label: {label}")
            print("Dataset loaded successfully!")
        else:
            print("No samples found!")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_dataset()