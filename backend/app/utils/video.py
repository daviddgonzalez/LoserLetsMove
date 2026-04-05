"""
Video utility functions.

Handles downloading videos from Supabase Storage and local file management
for the Path B (MVP) extraction pipeline.
"""

from __future__ import annotations

import os
import tempfile
from pathlib import Path

from app.config import settings
from app.db.supabase_client import get_supabase_client


def download_video_from_storage(storage_path: str, local_dir: str | None = None) -> str:
    """
    Download a video from Supabase Storage to a local temporary file.

    Args:
        storage_path: Path within the Supabase Storage bucket (e.g., "user123/squat_01.mp4").
        local_dir: Optional directory for the downloaded file. Defaults to system temp.

    Returns:
        Absolute path to the downloaded local file.
    """
    client = get_supabase_client()
    storage = client.storage.from_(settings.storage_bucket)

    # Create download directory
    if local_dir is None:
        local_dir = tempfile.mkdtemp(prefix="pke_video_")
    os.makedirs(local_dir, exist_ok=True)

    # Download file bytes
    file_bytes = storage.download(storage_path)

    # Write to local file
    filename = Path(storage_path).name
    local_path = os.path.join(local_dir, filename)
    with open(local_path, "wb") as f:
        f.write(file_bytes)

    return local_path


async def upload_video_to_storage(
    file_bytes: bytes,
    filename: str,
    user_id: str = "anonymous",
) -> str:
    """
    Upload a video file to Supabase Storage.

    Args:
        file_bytes: Raw bytes of the video file.
        filename: Original filename (e.g., "squat_01.mp4").
        user_id: User ID for organizing uploads into folders.

    Returns:
        The storage path (key) in the bucket.
    """
    client = get_supabase_client()
    storage = client.storage.from_(settings.storage_bucket)

    # Organize by user: videos/{user_id}/{filename}
    storage_path = f"{user_id}/{filename}"

    storage.upload(
        path=storage_path,
        file=file_bytes,
        file_options={"content-type": "video/mp4"},
    )

    return storage_path


def cleanup_local_video(local_path: str) -> None:
    """Remove a temporary local video file after extraction."""
    try:
        if os.path.exists(local_path):
            os.remove(local_path)
    except OSError:
        pass  # Best-effort cleanup
