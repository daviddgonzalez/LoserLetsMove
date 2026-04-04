"""
Calibration Routes.

Manages the user calibration lifecycle: create session → add sequences → finalize.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, HTTPException

from app.utils.schemas import (
    CalibrationFinalizeResponse,
    CalibrationSequenceRequest,
    CalibrationStartRequest,
    CalibrationStartResponse,
    CalibrationStatus,
)

router = APIRouter()

# In-memory session store (swap for Supabase in production)
_sessions: dict[str, dict] = {}


@router.post("/calibrate/start", response_model=CalibrationStartResponse)
async def start_calibration(request: CalibrationStartRequest):
    """
    Create a new calibration session for a user + exercise pair.

    The user will submit 3-5 sequences of correct form, after which
    the session is finalized to compute their personal baseline.
    """
    session_id = str(uuid.uuid4())

    _sessions[session_id] = {
        "user_id": request.user_id,
        "exercise_name": request.exercise_name,
        "status": CalibrationStatus.PENDING,
        "sequences": [],
    }

    return CalibrationStartResponse(
        session_id=session_id,
        status=CalibrationStatus.PENDING,
        message=f"Calibration session created for '{request.exercise_name}'.",
    )


@router.post("/calibrate/{session_id}/sequence")
async def add_calibration_sequence(session_id: str, request: CalibrationSequenceRequest):
    """
    Add a single calibration sequence to an existing session.

    Accepts either raw landmarks (from live capture) or a Supabase Storage
    path (from video upload). 3-5 sequences are needed before finalization.
    """
    if session_id not in _sessions:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found.")

    session = _sessions[session_id]

    if session["status"] == CalibrationStatus.COMPLETE:
        raise HTTPException(status_code=400, detail="Session already finalized.")

    if len(session["sequences"]) >= 5:
        raise HTTPException(status_code=400, detail="Maximum 5 calibration sequences allowed.")

    if not request.landmarks and not request.storage_path:
        raise HTTPException(
            status_code=400,
            detail="Provide either 'landmarks' or 'storage_path'.",
        )

    sequence_id = str(uuid.uuid4())
    session["sequences"].append({
        "id": sequence_id,
        "landmarks": request.landmarks,
        "storage_path": request.storage_path,
    })

    return {
        "sequence_id": sequence_id,
        "session_id": session_id,
        "total_sequences": len(session["sequences"]),
        "message": f"Sequence added. {len(session['sequences'])}/5 recorded.",
    }


@router.post("/calibrate/{session_id}/finalize", response_model=CalibrationFinalizeResponse)
async def finalize_calibration(session_id: str):
    """
    Finalize the calibration session.

    This triggers:
    1. Embedding generation for all sequences via ST-GCN
    2. Few-shot fine-tuning of the projection head
    3. Centroid computation and storage in Supabase/pgvector
    """
    if session_id not in _sessions:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found.")

    session = _sessions[session_id]

    if len(session["sequences"]) < 3:
        raise HTTPException(
            status_code=400,
            detail=f"Need at least 3 sequences to calibrate. Current: {len(session['sequences'])}.",
        )

    # TODO (Phase 5): Run calibration pipeline
    #   - Normalize all sequences
    #   - Generate embeddings via ST-GCN
    #   - Fine-tune projection head
    #   - Compute centroid
    #   - Store in Supabase

    session["status"] = CalibrationStatus.PROCESSING

    return CalibrationFinalizeResponse(
        session_id=session_id,
        status=CalibrationStatus.PROCESSING,
        centroid_stored=False,
        num_sequences=len(session["sequences"]),
        message="Calibration processing started. This may take a few minutes.",
    )
