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
        pose_tensor: Normalized tensor of shape (1, 3, T, 33).

    Returns:
        Embedding as list of floats.
    """
    with torch.no_grad():
        pose_tensor = pose_tensor.to(settings.model_device)
        embedding = model(pose_tensor)
        return embedding.squeeze().cpu().tolist()


def save_checkpoint(model: STGCN, optimizer: torch.optim.Optimizer, epoch: int, path: str):
    """Save model checkpoint."""
    torch.save({
        'epoch': epoch,
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
    }, path)