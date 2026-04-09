from __future__ import annotations

import argparse
import sys
from pathlib import Path

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader

# Ensure backend root is on sys.path when running this script directly.
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from ml.dataset import Fit3DDataset, collate_fn
from ml.inference import save_checkpoint
from ml.model import STGCN


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Train ST-GCN on Fit3D dataset sequences."
    )
    parser.add_argument(
        "--data-root",
        type=str,
        default=str(ROOT.parent.parent / "dataset" / "fit3d_train" / "train"),
        help="Path to the Fit3D dataset root",
    )
    parser.add_argument(
        "--checkpoint-dir",
        type=str,
        default=str(ROOT / "../checkpoints"),
        help="Directory to save model checkpoints",
    )
    parser.add_argument("--num-joints", type=int, default=25, help="Number of joints in the dataset")
    parser.add_argument("--sequence-length", type=int, default=64, help="Number of frames per sequence")
    parser.add_argument("--embedding-dim", type=int, default=256, help="Dimension of the embedding vector")
    parser.add_argument("--batch-size", type=int, default=16, help="Training batch size")
    parser.add_argument("--epochs", type=int, default=10, help="Number of training epochs")
    parser.add_argument(
        "--learning-rate",
        type=float,
        default=1e-3,
        help="Learning rate for optimizer",
    )
    parser.add_argument(
        "--loss",
        choices=["classification", "contrastive", "reconstruction"],
        default="classification",
        help="Training objective used for pretraining",
    )
    parser.add_argument(
        "--use-rep-boundaries",
        action="store_true",
        help="Split each exercise file into rep segments using rep_ann.json",
    )
    parser.add_argument(
        "--exercises",
        type=str,
        nargs="+",
        default=None,
        help="List of exercise names to train on (e.g., 'squat'). If not specified, train on all exercises.",
    )
    return parser


def train_classification(
    model: STGCN,
    head: nn.Module,
    loader: DataLoader,
    optimizer: optim.Optimizer,
    criterion: nn.Module,
    device: torch.device,
) -> float:
    model.train()
    head.train()
    running_loss = 0.0

    for batch, labels in loader:
        batch = batch.to(device)
        labels = labels.to(device)

        optimizer.zero_grad()
        embeddings = model(batch)
        logits = head(embeddings)
        loss = criterion(logits, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item() * batch.size(0)

    return running_loss / len(loader.dataset)


def train_reconstruction(
    model: STGCN,
    loader: DataLoader,
    optimizer: optim.Optimizer,
    criterion: nn.Module,
    device: torch.device,
) -> float:
    model.train()
    running_loss = 0.0

    for batch, _ in loader:
        batch = batch.to(device)
        optimizer.zero_grad()
        reconstruction = model(batch, reconstruct=True)
        loss = criterion(reconstruction, batch)
        loss.backward()
        optimizer.step()
        running_loss += loss.item() * batch.size(0)

    return running_loss / len(loader.dataset)


def train_contrastive(
    model: STGCN,
    loader: DataLoader,
    optimizer: optim.Optimizer,
    criterion: nn.Module,
    device: torch.device,
) -> float:
    model.train()
    running_loss = 0.0

    for batch, labels in loader:
        batch = batch.to(device)
        labels = labels.to(device)
        embeddings = model(batch)

        pair_a = []
        pair_b = []
        targets = []

        for i in range(embeddings.size(0)):
            positive = torch.where(labels == labels[i])[0]
            negative = torch.where(labels != labels[i])[0]

            positive = positive[positive != i]
            if positive.numel() > 0:
                j = positive[torch.randint(positive.size(0), (1,))].item()
                pair_a.append(embeddings[i])
                pair_b.append(embeddings[j])
                targets.append(1.0)

            if negative.numel() > 0:
                j = negative[torch.randint(negative.size(0), (1,))].item()
                pair_a.append(embeddings[i])
                pair_b.append(embeddings[j])
                targets.append(-1.0)

        if not pair_a:
            continue

        pair_a = torch.stack(pair_a, dim=0)
        pair_b = torch.stack(pair_b, dim=0)
        targets = torch.tensor(targets, device=device)

        loss = criterion(pair_a, pair_b, targets)
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        running_loss += loss.item() * batch.size(0)

    return running_loss / len(loader.dataset)


def main() -> None:
    parser = build_arg_parser()
    args = parser.parse_args()

    print(f"Args: {args}")
    print(f"Data root: {args.data_root}")
    print(f"Checkpoint dir: {args.checkpoint_dir}")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    dataset = Fit3DDataset(
        root=args.data_root,
        sequence_length=args.sequence_length,
        use_rep_boundaries=args.use_rep_boundaries,
        exercises=args.exercises,
    )

    print(f"Dataset size: {len(dataset)}")
    print(f"Exercise mapping: {dataset.exercise_to_label}")

    if len(dataset) == 0:
        raise RuntimeError(f"No Fit3D samples found in {args.data_root}")

    loader = DataLoader(
        dataset,
        batch_size=args.batch_size,
        shuffle=True,
        collate_fn=collate_fn,
        num_workers=0,
        pin_memory=True,
    )

    model = STGCN(
        num_joints=args.num_joints,
        num_frames=args.sequence_length,
        embedding_dim=args.embedding_dim,
        num_layers=6,
    ).to(device)

    optimizer = optim.Adam(model.parameters(), lr=args.learning_rate)

    if args.loss == "classification":
        head = nn.Linear(args.embedding_dim, len(dataset.exercise_to_label)).to(device)
        optimizer = optim.Adam(list(model.parameters()) + list(head.parameters()), lr=args.learning_rate)
        criterion = nn.CrossEntropyLoss()
    elif args.loss == "contrastive":
        head = None
        criterion = nn.CosineEmbeddingLoss(margin=0.5)
    else:
        head = None
        criterion = nn.MSELoss()

    for epoch in range(1, args.epochs + 1):
        if args.loss == "classification":
            epoch_loss = train_classification(model, head, loader, optimizer, criterion, device)
        elif args.loss == "contrastive":
            epoch_loss = train_contrastive(model, loader, optimizer, criterion, device)
        else:
            epoch_loss = train_reconstruction(model, loader, optimizer, criterion, device)

        print(f"Epoch {epoch}/{args.epochs} - loss: {epoch_loss:.4f}")

    print("Training completed, saving checkpoint...")
    checkpoint_dir = Path(args.checkpoint_dir)
    checkpoint_dir.mkdir(parents=True, exist_ok=True)
    checkpoint_path = checkpoint_dir / "stgcn_checkpoint.pth"

    print(f"Saving to: {checkpoint_path}")
    torch.save(
        {
            "model_state_dict": model.state_dict(),
            "optimizer_state_dict": optimizer.state_dict(),
            "args": vars(args),
            "exercise_to_label": dataset.exercise_to_label,
        },
        checkpoint_path,
    )

    print(f"Saved checkpoint: {checkpoint_path}")


if __name__ == "__main__":
    main()
