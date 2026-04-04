"""
Pydantic models for database records.

These represent the shapes of rows in Supabase PostgreSQL tables,
used for type-safe serialization/deserialization.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class UserProfile(BaseModel):
    """Row in user_profiles table."""
    id: str
    display_name: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Exercise(BaseModel):
    """Row in exercises table."""
    id: str
    name: str
    joint_count: int = 33
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CalibrationSession(BaseModel):
    """Row in calibration_sessions table."""
    id: str
    user_id: str
    exercise_id: str
    status: str = "pending"
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CalibrationSequence(BaseModel):
    """Row in calibration_sequences table."""
    id: str
    session_id: str
    storage_path: Optional[str] = None
    landmarks_json: Optional[dict] = None
    embedding: Optional[list[float]] = None  # vector(256)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CalibrationCentroid(BaseModel):
    """Row in calibration_centroids table."""
    id: str
    user_id: str
    exercise_id: str
    centroid: list[float]  # vector(256)
    threshold: float = 0.15
    model_version: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Evaluation(BaseModel):
    """Row in evaluations table."""
    id: str
    user_id: str
    exercise_id: str
    embedding: list[float]  # vector(256)
    distance_to_centroid: float
    passed: bool
    joint_errors: Optional[dict] = None
    dtw_details: Optional[dict] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
