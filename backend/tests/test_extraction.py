"""
Unit tests for the extraction service.

Tests the frame converter (Path A/B format parity) using synthetic data.
Video extraction is tested via integration tests with real video files.
"""

import numpy as np
import pytest

from app.services.extraction import extract_landmarks_from_frames


class TestExtractLandmarksFromFrames:
    """Tests for the WebSocket frame → numpy converter."""

    def test_basic_conversion(self):
        """Convert a list of frame dicts to (T, 25, 4) array."""
        frames = [
            {
                "frame_idx": 0,
                "landmarks": [[float(j), float(j + 1), float(j + 2)] for j in range(25)],
            },
            {
                "frame_idx": 1,
                "landmarks": [[float(j + 10), float(j + 11), float(j + 12)] for j in range(25)],
            },
        ]
        result = extract_landmarks_from_frames(frames)
        assert result.shape == (2, 25, 4)
        assert result.dtype == np.float32

    def test_visibility_defaults_to_one(self):
        """When landmarks have 3 values (x,y,z), visibility should default to 1.0."""
        frames = [
            {
                "frame_idx": 0,
                "landmarks": [[1.0, 2.0, 3.0] for _ in range(25)],
            }
        ]
        result = extract_landmarks_from_frames(frames)
        assert result[0, 0, 3] == 1.0  # visibility

    def test_visibility_preserved_when_provided(self):
        """When landmarks have 4 values, visibility should be preserved."""
        frames = [
            {
                "frame_idx": 0,
                "landmarks": [[1.0, 2.0, 3.0, 0.85] for _ in range(25)],
            }
        ]
        result = extract_landmarks_from_frames(frames)
        assert result[0, 0, 3] == pytest.approx(0.85)

    def test_empty_frames(self):
        """Empty frame list should return (0, ...) array."""
        result = extract_landmarks_from_frames([])
        assert result.shape[0] == 0
