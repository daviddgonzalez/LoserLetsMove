"""
Path B: Video Upload Routes (MVP Fallback).

Handles pre-recorded .mp4 uploads → Supabase Storage → async extraction.
"""

from __future__ import annotations

import uuid
from typing import Dict

from fastapi import APIRouter, HTTPException, UploadFile, File

from app.utils.schemas import TaskStatus, TaskStatusResponse, UploadResponse

router = APIRouter()

# In-memory task registry (swap for Redis/DB in production)
_tasks: Dict[str, TaskStatusResponse] = {}


@router.post("/upload", response_model=UploadResponse)
async def upload_video(file: UploadFile = File(...)):
    """
    Upload an .mp4 video for asynchronous pose extraction.

    The video is stored in Supabase Storage, and a background task
    extracts MediaPipe landmarks frame-by-frame.
    """
    # Validate file type
    if file.content_type not in ("video/mp4", "video/mpeg", "video/quicktime"):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Only .mp4 is accepted.",
        )

    task_id = str(uuid.uuid4())

    # Register the task
    _tasks[task_id] = TaskStatusResponse(
        task_id=task_id,
        status=TaskStatus.PENDING,
        message="Video received. Queued for pose extraction.",
    )

    # TODO (Phase 2): Upload file bytes to Supabase Storage
    # TODO (Phase 2): Enqueue async extraction task
    #   - Download from storage
    #   - Run MediaPipe extraction
    #   - Store landmarks in DB
    #   - Update task status to COMPLETE

    return UploadResponse(
        task_id=task_id,
        status=TaskStatus.PENDING,
        message=f"Video '{file.filename}' received. Task ID: {task_id}",
    )


@router.get("/upload/{task_id}/status", response_model=TaskStatusResponse)
async def get_upload_status(task_id: str):
    """Poll the status of a video extraction task."""
    if task_id not in _tasks:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found.")
    return _tasks[task_id]
