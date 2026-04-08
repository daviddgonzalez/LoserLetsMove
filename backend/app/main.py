"""
PKE Backend — FastAPI Application Factory.

Lifespan context manager handles startup/shutdown:
  - Startup: initialize Supabase client, load ML model (when available)
  - Shutdown: cleanup resources
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes_calibration import router as calibration_router
from app.api.routes_evaluate import router as evaluate_router
from app.api.routes_upload import router as upload_router
from app.api.ws_live import router as ws_router
from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage application startup and shutdown lifecycle."""
    # ── Startup ──────────────────────────────────────────
    print(f" PKE Backend starting on {settings.api_host}:{settings.api_port}")
    print(f"   Device: {settings.model_device}")
    print(f"   Embedding dim: {settings.embedding_dim}")
    print(f"   Deviation threshold: {settings.deviation_threshold}")

    # Store shared state in app.state for access in routes
    app.state.model = None  # Will hold ST-GCN model once loaded
    app.state.device = settings.model_device

    # TODO (Phase 4): Load ST-GCN model from checkpoint
    # TODO (Phase 1): Initialize Supabase client singleton

    yield

    # ── Shutdown ─────────────────────────────────────────
    print(" PKE Backend shutting down")
    # Cleanup resources if needed


def create_app() -> FastAPI:
    """Build and configure the FastAPI application."""
    application = FastAPI(
        title="PKE — Personalized Kinematic Evaluator",
        description=(
            "Asynchronous CV pipeline for evaluating human movement "
            "against a user-calibrated biomechanical baseline."
        ),
        version="0.1.0",
        lifespan=lifespan,
    )

    # ── CORS ─────────────────────────────────────────────
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Tighten in production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Routers ──────────────────────────────────────────
    application.include_router(upload_router, prefix="/api/v1", tags=["Upload"])
    application.include_router(calibration_router, prefix="/api/v1", tags=["Calibration"])
    application.include_router(evaluate_router, prefix="/api/v1", tags=["Evaluation"])
    application.include_router(ws_router, prefix="/ws/v1", tags=["WebSocket"])

    # ── Health Check ─────────────────────────────────────
    @application.get("/health", tags=["System"])
    async def health_check():
        """Liveness probe for Docker / load balancers."""
        return {
            "status": "healthy",
            "device": settings.model_device,
            "model_loaded": application.state.model is not None,
        }

    return application


# Module-level app instance for uvicorn
app = create_app()
