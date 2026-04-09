"""
Inference utilities for ST-GCN embedding generation.

Loads the trained model and generates 256-dimensional embeddings
from normalized pose tensors.
"""

import torch
from pathlib import Path

from app.config import settings
from .model import STGCN


def load_model(checkpoint_path: str | None = None) -> STGCN:
    """
    Load the ST-GCN model from checkpoint.

    Args:
        checkpoint_path: Path to model checkpoint. If None, uses default.

    Returns:
        Loaded ST-GCN model.
    """
    if checkpoint_path is None:
        checkpoint_path = Path(settings.checkpoint_dir) / "stgcn_checkpoint.pth"

    model = STGCN(
        num_joints=settings.num_joints,
        num_frames=settings.sequence_length,
        embedding_dim=settings.embedding_dim,
        num_layers=6  # Configurable later
    )

    if checkpoint_path.exists():
        checkpoint = torch.load(checkpoint_path, map_location=settings.model_device)
        model.load_state_dict(checkpoint['model_state_dict'])
        print(f"✅ Loaded model from {checkpoint_path}")
    else:
        print(f"⚠️  No checkpoint found at {checkpoint_path}. Using untrained model.")

    model.to(settings.model_device)
    model.eval()
    return model


def generate_embedding(model: STGCN, pose_tensor: torch.Tensor) -> list[float]:
    """
    Generate 256-dimensional embedding from normalized pose tensor.

    Args:
        model: Loaded ST-GCN model.
        pose_tensor: Normalized tensor of shape (1, 3, T, 25).

    Returns:
        Embedding as list of floats.
    """
    with torch.no_grad():
        pose_tensor = pose_tensor.to(settings.model_device)
        embedding = model(pose_tensor)
        return embedding.squeeze().cpu().tolist()


def reconstruct_pose(model: STGCN, pose_tensor: torch.Tensor) -> torch.Tensor:
    """
    Reconstruct a normalized pose tensor using the trained ST-GCN autoencoder.

    Args:
        model: Loaded ST-GCN model.
        pose_tensor: Normalized tensor of shape (1, 3, T, 25).

    Returns:
        Reconstructed tensor of shape (1, 3, T, 25).
    """
    with torch.no_grad():
        pose_tensor = pose_tensor.to(settings.model_device)
        reconstruction = model(pose_tensor, reconstruct=True)
        return reconstruction.cpu()


def compute_reconstruction_error(
    original: torch.Tensor,
    reconstruction: torch.Tensor,
) -> float:
    """
    Compute mean squared reconstruction error between original and reconstructed tensors.

    Args:
        original: Tensor of shape (1, 3, T, 25).
        reconstruction: Tensor of shape (1, 3, T, 25).

    Returns:
        Mean squared error as a float.
    """
    return torch.mean((original - reconstruction) ** 2).item()


def compute_squat_quality_score(
    error: float,
    max_error: float = 0.15,
) -> float:
    """
    Convert reconstruction error into a 0-1 quality score.

    Args:
        error: Reconstruction MSE.
        max_error: Error threshold at which quality becomes 0.

    Returns:
        Quality score between 0.0 and 1.0.
    """
    score = max(0.0, 1.0 - error / max_error)
    return float(min(1.0, score))


def evaluate_squat_technique(model: STGCN, pose_tensor: torch.Tensor) -> dict[str, float]:
    """
    Evaluate squat technique by reconstructing the input pose tensor.

    Args:
        model: Loaded ST-GCN model.
        pose_tensor: Normalized tensor of shape (1, 3, T, 25).

    Returns:
        Dictionary with reconstruction error and quality score.
    """
    reconstruction = reconstruct_pose(model, pose_tensor)
    error = compute_reconstruction_error(pose_tensor, reconstruction)
    score = compute_squat_quality_score(error)
    return {
        "reconstruction_error": error,
        "quality_score": score,
    }


def save_checkpoint(model: STGCN, optimizer: torch.optim.Optimizer, epoch: int, path: str):
    """Save model checkpoint."""
    torch.save({
        'epoch': epoch,
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
    }, path)