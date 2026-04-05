"""
Phase 3 Verification: Test the C++ pke_cpp module.

Run from PowerShell (with venv active):
    cd C:\TLDP\LoserLetsMove\backend
    python tests/test_cpp_module.py
"""

import sys
import os
import numpy as np

# Add the C++ build output to Python's path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "cpp", "build", "Release"))

def test_import():
    """Test 1: Can we import the C++ module at all?"""
    import pke_cpp
    print("[PASS] Imported pke_cpp successfully")
    print(f"       Available functions: {[x for x in dir(pke_cpp) if not x.startswith('_')]}")
    return pke_cpp

def test_joint_angles(pke_cpp):
    """Test 2: Compute joint angles from synthetic skeleton data."""
    # Create fake skeleton: 30 frames, 33 joints, 3 coordinates (x, y, z)
    np.random.seed(42)
    coords = np.random.randn(30, 33, 3).astype(np.float32)

    angles = pke_cpp.compute_angles_from_coords(coords)

    assert angles.shape == (30, 10), f"Expected (30, 10), got {angles.shape}"
    assert angles.dtype == np.float32, f"Expected float32, got {angles.dtype}"
    assert np.all(angles >= 0.0), "Angles should be non-negative"
    assert np.all(angles <= np.pi + 1e-5), "Angles should be <= pi"
    assert not np.any(np.isnan(angles)), "No NaN values allowed"

    print(f"[PASS] compute_angles_from_coords: output shape {angles.shape}")
    print(f"       Angle range: [{angles.min():.4f}, {angles.max():.4f}] radians")
    print(f"       Angle range: [{np.degrees(angles.min()):.1f}, {np.degrees(angles.max()):.1f}] degrees")
    return angles

def test_dtw(pke_cpp):
    """Test 3: Run DTW on two synthetic joint-angle sequences."""
    np.random.seed(42)

    # Sequence A: 64 frames, 10 angles (simulating a "perfect" squat)
    seq_a = np.random.randn(64, 10).astype(np.float32)

    # Sequence B: Same as A but with some noise (simulating a "daily" squat)
    seq_b = seq_a + np.random.randn(64, 10).astype(np.float32) * 0.1

    path, cost = pke_cpp.compute_dtw(seq_a, seq_b, band_width=10)

    assert cost >= 0.0, "DTW cost should be non-negative"
    assert len(path) > 0, "Warping path should not be empty"
    assert path[0] == (0, 0), f"Path should start at (0,0), got {path[0]}"
    assert path[-1] == (63, 63), f"Path should end at (63,63), got {path[-1]}"

    print(f"[PASS] compute_dtw: cost = {cost:.6f}")
    print(f"       Warping path length: {len(path)} steps")
    print(f"       Path start: {path[0]}, Path end: {path[-1]}")

def test_dtw_identical(pke_cpp):
    """Test 4: DTW of identical sequences should have near-zero cost."""
    seq = np.random.randn(32, 10).astype(np.float32)
    path, cost = pke_cpp.compute_dtw(seq, seq, band_width=5)

    assert cost < 1e-5, f"Identical sequences should have ~0 cost, got {cost}"
    print(f"[PASS] DTW identical sequences: cost = {cost:.10f} (effectively zero)")

def test_dtw_different_lengths(pke_cpp):
    """Test 5: DTW should handle sequences of different lengths."""
    seq_a = np.random.randn(40, 10).astype(np.float32)
    seq_b = np.random.randn(60, 10).astype(np.float32)

    path, cost = pke_cpp.compute_dtw(seq_a, seq_b, band_width=25)

    assert cost >= 0.0
    assert path[0] == (0, 0)
    assert path[-1] == (39, 59)
    print(f"[PASS] DTW different lengths (40 vs 60): cost = {cost:.6f}, path length = {len(path)}")

def test_speed(pke_cpp):
    """Test 6: Benchmark — how fast is the C++ module?"""
    import time
    seq_a = np.random.randn(128, 10).astype(np.float32)
    seq_b = np.random.randn(128, 10).astype(np.float32)

    # Warm up
    pke_cpp.compute_dtw(seq_a, seq_b, band_width=15)

    # Benchmark DTW
    start = time.perf_counter()
    for _ in range(100):
        pke_cpp.compute_dtw(seq_a, seq_b, band_width=15)
    dtw_time = (time.perf_counter() - start) / 100

    # Benchmark joint angles
    coords = np.random.randn(128, 33, 3).astype(np.float32)
    pke_cpp.compute_angles_from_coords(coords)

    start = time.perf_counter()
    for _ in range(1000):
        pke_cpp.compute_angles_from_coords(coords)
    angle_time = (time.perf_counter() - start) / 1000

    print(f"[PASS] Performance benchmarks:")
    print(f"       DTW (128x128, 10 angles):       {dtw_time*1000:.3f} ms per call")
    print(f"       Joint angles (128 frames):       {angle_time*1000:.3f} ms per call")


if __name__ == "__main__":
    print("=" * 60)
    print("  PKE C++ Module Verification (Phase 3)")
    print("=" * 60)
    print()

    pke_cpp = test_import()
    print()
    test_joint_angles(pke_cpp)
    print()
    test_dtw(pke_cpp)
    print()
    test_dtw_identical(pke_cpp)
    print()
    test_dtw_different_lengths(pke_cpp)
    print()
    test_speed(pke_cpp)

    print()
    print("=" * 60)
    print("  ALL TESTS PASSED — Phase 3 C++ Module is ready!")
    print("=" * 60)
