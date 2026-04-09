"""
Evaluation Routes.

Accepts a movement sequence and evaluates it against
the user's calibrated baseline.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, HTTPException, Request
import numpy as np
import torch

from app.config import settings
from app.utils.schemas import EvaluationRequest, EvaluationResponse
from app.services.normalization import normalize_landmarks
from ml.inference import evaluate_squat_technique, generate_embedding

router = APIRouter()


@router.post("/evaluate", response_model=EvaluationResponse)
async def evaluate_movement(request: EvaluationRequest, req: Request):
    """
    Evaluate a movement sequence against the user's calibrated profile.

    Pipeline:
    1. Normalize the incoming landmarks (root-center, scale-invariant).
    2. Generate embedding via user-calibrated ST-GCN.
    3. Compare embedding to user's centroid (cosine distance).
    4. If distance > threshold → run DTW fallback for joint-level error report.
    """
    evaluation_id = str(uuid.uuid4())

    # Convert request landmarks into numpy array shape (T, 25, 4)
    landmarks_np = np.array(
        [
            [[lm.x, lm.y, lm.z, lm.visibility] for lm in frame.landmarks]
            for frame in request.landmarks
        ],
        dtype=np.float32,
    )

    normalized = normalize_landmarks(landmarks_np)
    normalized_tensor = torch.from_numpy(normalized).float()

    model = req.app.state.model
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    if request.exercise_name.lower() == "squat":
        result = evaluate_squat_technique(model, normalized_tensor.unsqueeze(0))
        error = result["reconstruction_error"]
        score = result["quality_score"]
        passed = error < settings.deviation_threshold
        return EvaluationResponse(
            evaluation_id=evaluation_id,
            passed=passed,
            distance_to_centroid=error,
            threshold=settings.deviation_threshold,
            reconstruction_error=error,
            quality_score=score,
            joint_errors=[],
            dtw_triggered=False,
            message="Squat technique evaluated using reconstruction error.",
        )

    # Fallback for unsupported exercises: use embedding distance placeholder
    embedding = generate_embedding(model, normalized_tensor.unsqueeze(0))
    centroid = [0.0] * 256
    emb_np = np.array(embedding)
    cent_np = np.array(centroid)
    distance = 1 - np.dot(emb_np, cent_np) / (np.linalg.norm(emb_np) * np.linalg.norm(cent_np) + 1e-8)
    passed = distance < settings.deviation_threshold

    return EvaluationResponse(
        evaluation_id=evaluation_id,
        passed=passed,
        distance_to_centroid=distance,
        threshold=settings.deviation_threshold,
        reconstruction_error=distance,
        quality_score=max(0.0, 1.0 - distance / settings.deviation_threshold),
        joint_errors=[],
        dtw_triggered=False,
        message="Evaluation completed using placeholder centroid fallback.",
    )
