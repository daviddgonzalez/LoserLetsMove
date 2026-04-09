"""
Evaluation Routes.

Accepts a movement sequence and evaluates it against
the user's calibrated baseline.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Request
import torch

from app.config import settings
from app.utils.schemas import EvaluationRequest, EvaluationResponse
from app.services.normalization import normalize_landmarks
from ml.inference import generate_embedding

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

    # Normalize landmarks
    landmarks = torch.tensor(request.landmarks, dtype=torch.float32)
    normalized = normalize_landmarks(landmarks.numpy())
    normalized_tensor = torch.from_numpy(normalized).float()

    # Generate embedding
    model = req.app.state.model
    if model:
        embedding = generate_embedding(model, normalized_tensor.unsqueeze(0))
    else:
        embedding = torch.randn(256).tolist()

    # TODO: Query user's centroid from Supabase
    # For now, assume centroid is zero
    centroid = [0.0] * 256

    # Compute cosine distance
    import numpy as np
    emb_np = np.array(embedding)
    cent_np = np.array(centroid)
    distance = 1 - np.dot(emb_np, cent_np) / (np.linalg.norm(emb_np) * np.linalg.norm(cent_np))

    passed = distance < settings.deviation_threshold

    # TODO: If not passed, run DTW

    return EvaluationResponse(
        evaluation_id=evaluation_id,
        passed=passed,
        distance_to_centroid=distance,
        threshold=settings.deviation_threshold,
        joint_errors=[],
        dtw_triggered=False,
        message="Evaluation completed with placeholder centroid.",
    )
    )
