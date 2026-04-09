"""
Unit tests for the normalization service.

Tests the core normalization pipeline with synthetic skeleton data
to verify mathematical correctness without needing real video input.
"""

import numpy as np
import pytest

from app.services.normalization import (
    normalize_landmarks,
    _root_center,
    _scale_normalize,
    _resample_temporal,
    compute_joint_angles,
    LEFT_HIP,
    RIGHT_HIP,
    LEFT_SHOULDER,
    RIGHT_SHOULDER,
)


def _make_synthetic_landmarks(
    num_frames: int = 30,
    num_joints: int = 25,
) -> np.ndarray:
    """
    Generate synthetic landmark data for testing.

    Creates a skeleton where key joints (hips, shoulders) are at
    known positions so normalization results are predictable.

    Returns: (T, 25, 4) array with x, y, z, visibility.
    """
    rng = np.random.RandomState(42)
    landmarks = rng.randn(num_frames, num_joints, 4).astype(np.float32)

    # Set visibility to high for all joints
    landmarks[:, :, 3] = 0.95

    # Place hips at known positions (offset from origin)
    landmarks[:, LEFT_HIP, :3] = [1.0, 2.0, 0.0]    # Left hip
    landmarks[:, RIGHT_HIP, :3] = [1.0, 2.0, 0.5]   # Right hip (0.5 apart in z)

    # Place shoulders above hips
    landmarks[:, LEFT_SHOULDER, :3] = [1.0, 1.0, 0.0]   # Left shoulder
    landmarks[:, RIGHT_SHOULDER, :3] = [1.0, 1.0, 0.5]  # Right shoulder

    return landmarks


class TestRootCenter:
    """Tests for _root_center function."""

    def test_output_shape(self):
        """Output shape should match input shape."""
        landmarks = _make_synthetic_landmarks(30)
        coords = landmarks[:, :, :3]
        result = _root_center(coords)
        assert result.shape == coords.shape

    def test_hip_midpoint_at_origin(self):
        """After centering, hip midpoint should be at (0, 0, 0) for every frame."""
        landmarks = _make_synthetic_landmarks(30)
        coords = landmarks[:, :, :3]
        centered = _root_center(coords)

        hip_mid = (centered[:, LEFT_HIP, :] + centered[:, RIGHT_HIP, :]) / 2.0
        np.testing.assert_allclose(hip_mid, 0.0, atol=1e-6)

    def test_relative_positions_preserved(self):
        """Relative distances between joints should be preserved."""
        landmarks = _make_synthetic_landmarks(10)
        coords = landmarks[:, :, :3]

        # Distance between joint 0 and joint 1 before centering
        dist_before = np.linalg.norm(coords[:, 0, :] - coords[:, 1, :], axis=1)

        centered = _root_center(coords)

        # Distance after centering
        dist_after = np.linalg.norm(centered[:, 0, :] - centered[:, 1, :], axis=1)

        np.testing.assert_allclose(dist_before, dist_after, atol=1e-6)


class TestScaleNormalize:
    """Tests for _scale_normalize function."""

    def test_output_shape(self):
        """Output shape should match input shape."""
        landmarks = _make_synthetic_landmarks(20)
        coords = landmarks[:, :, :3]
        centered = _root_center(coords)
        result = _scale_normalize(centered)
        assert result.shape == centered.shape

    def test_torso_length_is_one(self):
        """After scaling, torso length should be approximately 1.0."""
        landmarks = _make_synthetic_landmarks(20)
        coords = landmarks[:, :, :3]
        centered = _root_center(coords)
        scaled = _scale_normalize(centered)

        hip_mid = (scaled[:, LEFT_HIP, :] + scaled[:, RIGHT_HIP, :]) / 2.0
        shoulder_mid = (scaled[:, LEFT_SHOULDER, :] + scaled[:, RIGHT_SHOULDER, :]) / 2.0
        torso_length = np.linalg.norm(shoulder_mid - hip_mid, axis=1)

        np.testing.assert_allclose(torso_length, 1.0, atol=1e-5)


class TestResampleTemporal:
    """Tests for _resample_temporal function."""

    def test_output_shape(self):
        """Output should have exactly target_length frames."""
        coords = np.random.randn(50, 25, 3).astype(np.float32)
        result = _resample_temporal(coords, target_length=64)
        assert result.shape == (64, 25, 3)

    def test_identity_when_same_length(self):
        """If input length == target length, output should equal input."""
        coords = np.random.randn(64, 25, 3).astype(np.float32)
        result = _resample_temporal(coords, target_length=64)
        np.testing.assert_array_equal(result, coords)

    def test_upsample(self):
        """Upsampling from fewer frames should interpolate smoothly."""
        coords = np.zeros((10, 25, 3), dtype=np.float32)
        coords[-1, :, :] = 1.0  # Last frame all ones

        result = _resample_temporal(coords, target_length=20)
        assert result.shape == (20, 25, 3)

        # First frame should still be ~0, last should be ~1
        np.testing.assert_allclose(result[0, 0, 0], 0.0, atol=1e-5)
        np.testing.assert_allclose(result[-1, 0, 0], 1.0, atol=1e-5)

    def test_downsample(self):
        """Downsampling should reduce frame count."""
        coords = np.random.randn(128, 25, 3).astype(np.float32)
        result = _resample_temporal(coords, target_length=32)
        assert result.shape == (32, 25, 3)


class TestNormalizeLandmarks:
    """Tests for the full normalize_landmarks pipeline."""

    def test_output_shape(self):
        """Full pipeline should produce (1, 3, 64, 25) tensor."""
        landmarks = _make_synthetic_landmarks(50)
        result = normalize_landmarks(landmarks, sequence_length=64)
        assert result.shape == (1, 3, 64, 25)

    def test_output_dtype(self):
        """Output should be float32."""
        landmarks = _make_synthetic_landmarks(30)
        result = normalize_landmarks(landmarks, sequence_length=32)
        assert result.dtype == np.float32

    def test_custom_sequence_length(self):
        """Should respect custom sequence_length parameter."""
        landmarks = _make_synthetic_landmarks(100)
        result = normalize_landmarks(landmarks, sequence_length=128)
        assert result.shape == (1, 3, 128, 25)

    def test_no_nans(self):
        """Output should not contain NaN values."""
        landmarks = _make_synthetic_landmarks(40)
        result = normalize_landmarks(landmarks, sequence_length=64)
        assert not np.any(np.isnan(result))


class TestComputeJointAngles:
    """Tests for compute_joint_angles function."""

    def test_output_shape(self):
        """Should return (T, N_angles) array."""
        coords = np.random.randn(30, 25, 3).astype(np.float32)
        angles = compute_joint_angles(coords)
        assert angles.shape[0] == 30
        assert angles.shape[1] == 10  # 10 angle triplets defined

    def test_angles_in_valid_range(self):
        """All angles should be in [0, π] radians."""
        coords = np.random.randn(20, 25, 3).astype(np.float32)
        angles = compute_joint_angles(coords)
        assert np.all(angles >= 0.0)
        assert np.all(angles <= np.pi + 1e-6)
