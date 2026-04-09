"""
ST-GCN Model for Pose Embedding Generation.

Implements a Spatial-Temporal Graph Convolutional Network to generate
256-dimensional embeddings from normalized pose sequences.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F


class STGCN(nn.Module):
    """
    Spatial-Temporal Graph Convolutional Network for skeleton-based action recognition.

    Input: (batch, 3, T, 25) - normalized pose tensor (channels, frames, joints)
    Output: (batch, 256) - embedding vector
    """

    def __init__(self, num_joints=25, num_channels=3, num_frames=64, embedding_dim=256, num_layers=6):
        super(STGCN, self).__init__()
        self.num_joints = num_joints
        self.num_frames = num_frames
        self.num_channels = num_channels

        # Adjacency matrix for MediaPipe pose graph
        self.adj = self._build_adjacency_matrix()

        # ST-GCN layers
        self.layers = nn.ModuleList()
        in_channels = num_channels
        for _ in range(num_layers):
            self.layers.append(
                STGCNBlock(in_channels, 64, self.adj)
            )
            in_channels = 64

        # Global pooling and embedding projection
        self.global_pool = nn.AdaptiveAvgPool2d((1, 1))  # Pool over frames and joints
        self.fc = nn.Linear(64, embedding_dim)

        # Decoder for reconstruction tasks
        self.decoder = nn.Sequential(
            nn.Linear(embedding_dim, 512),
            nn.ReLU(),
            nn.Linear(512, num_channels * num_frames * num_joints),
        )

    def _build_adjacency_matrix(self):
        """Build adjacency matrix for OpenPose pose (25 joints)."""
        adj = torch.zeros(self.num_joints, self.num_joints)

        # Define bone connections for OpenPose 25 joints
        connections = [
            # Torso
            [1, 2], [1, 5], [2, 3], [3, 4], [5, 6], [6, 7],  # Neck to shoulders, shoulders to elbows, elbows to wrists
            [1, 8], [8, 9], [9, 10], [10, 11], [8, 12], [12, 13], [13, 14],  # Neck to midhip, midhip to hips, hips to knees, knees to ankles
            # Face
            [0, 1], [0, 15], [15, 17], [0, 16], [16, 18],  # Nose to neck, nose to eyes, eyes to ears
            # Feet
            [11, 22], [22, 23], [11, 24], [14, 19], [19, 20], [14, 21],  # Ankles to toes and heels
        ]

        for i, j in connections:
            if i < self.num_joints and j < self.num_joints:
                adj[i, j] = 1
                adj[j, i] = 1  # Undirected

        # Self-loops
        adj += torch.eye(self.num_joints)

        return adj

    def forward(self, x, reconstruct: bool = False):
        """
        Forward pass.

        Args:
            x: Tensor of shape (batch, 3, T, 25)
            reconstruct: If true, decode the embedding back to pose tensor shape.

        Returns:
            If reconstruct is False: embedding tensor of shape (batch, 256)
            If reconstruct is True: reconstructed tensor of shape (batch, 3, T, 25)
        """
        for layer in self.layers:
            x = layer(x)

        # Global average pooling: (batch, 64, T, 25) -> (batch, 64, 1, 1)
        x = self.global_pool(x)

        # Flatten and project: (batch, 64) -> (batch, 256)
        x = x.view(x.size(0), -1)
        embedding = self.fc(x)

        if reconstruct:
            decoded = self.decoder(embedding)
            decoded = decoded.view(x.size(0), self.num_channels, self.num_frames, self.num_joints)
            return decoded

        return embedding


class STGCNBlock(nn.Module):
    """Single ST-GCN block with spatial and temporal convolutions."""

    def __init__(self, in_channels, out_channels, adj):
        super(STGCNBlock, self).__init__()
        self.adj = adj

        # Spatial graph convolution
        self.spatial_conv = nn.Conv2d(in_channels, out_channels, kernel_size=1)

        # Temporal convolution
        self.temporal_conv = nn.Conv2d(out_channels, out_channels, kernel_size=(3, 1), padding=(1, 0))

        self.bn = nn.BatchNorm2d(out_channels)
        self.relu = nn.ReLU()

    def forward(self, x):
        # x: (batch, in_channels, T, joints)

        # Spatial conv with graph adjacency
        x = self.spatial_conv(x)  # (batch, out_channels, T, joints)

        # Apply adjacency matrix (graph conv)
        batch, channels, t, joints = x.size()
        x_reshaped = x.view(batch * t, channels, joints)
        x_graph = torch.matmul(x_reshaped, self.adj)  # (batch*t, channels, joints)
        x = x_graph.view(batch, channels, t, joints)

        # Temporal conv
        x = self.temporal_conv(x)  # (batch, out_channels, T, joints)

        x = self.bn(x)
        x = self.relu(x)
        return x