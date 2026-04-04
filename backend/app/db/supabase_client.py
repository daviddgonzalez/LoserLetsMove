"""
Supabase Client Singleton.

Provides a single shared Supabase client instance for the entire application.
Uses the service role key for server-side operations (bypasses RLS).
"""

from __future__ import annotations

from functools import lru_cache

from supabase import Client, create_client

from app.config import settings


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    """
    Create and cache a Supabase client.

    Uses the service role key for full database access.
    The @lru_cache ensures only one client instance exists.
    """
    return create_client(
        supabase_url=settings.supabase_url,
        supabase_key=settings.supabase_service_role_key,
    )


def get_storage_client():
    """Get the Supabase Storage client for file uploads/downloads."""
    client = get_supabase_client()
    return client.storage.from_(settings.storage_bucket)
