"""
Evaluation Routes.

Accepts a movement sequence and evaluates it against
the user's calibrated baseline.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter

from app.config import settings
from app.utils.schemas import EvaluationRequest, EvaluationResponse

router = APIRouter()


@router.post("/evaluate", response_model=EvaluationResponse)
async def evaluate_movement(request: EvaluationRequest):
    """
    Evaluate a movement sequence against the user's calibrated profile.

    Pipeline:
    1. Normalize the incoming landmarks (root-center, scale-invariant).
    2. Generate embedding via user-calibrated ST-GCN.
    3. Compare embedding to user's centroid (cosine distance).
    4. If distance > threshold → run DTW fallback for joint-level error report.
    """
    evaluation_id = str(uuid.uuid4())

    # TODO (Phase 5): Full evaluation pipeline
    #   1. Normalize landmarks → tensor
    #   2. Load user's calibrated model weights
    #   3. Forward pass → embedding
    #   4. Query centroid from Supabase
    #   5. Compute cosine distance
    #   6. If exceeded → DTW fallback (Phase 3 C++ module)
    #   7. Store result in Supabase

    # Placeholder response
    return EvaluationResponse(
        evaluation_id=evaluation_id,
        passed=True,
        distance_to_centroid=0.0,
        threshold=settings.deviation_threshold,
        joint_errors=[],
        dtw_triggered=False,
        message="Evaluation pipeline not yet implemented. Returning placeholder.",
    )
