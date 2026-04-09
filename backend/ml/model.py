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

    Input: (batch, 3, T, 33) - normalized pose tensor (channels, frames, joints)
    Output: (batch, 256) - embedding vector
    """

    def __init__(self, num_joints=33, num_channels=3, num_frames=64, embedding_dim=256, num_layers=6):
        super(STGCN, self).__init__()
        self.num_joints = num_joints
        self.num_frames = num_frames

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

    def _build_adjacency_matrix(self):
        """Build adjacency matrix for MediaPipe pose (33 joints)."""
        adj = torch.zeros(self.num_joints, self.num_joints)

        # Define bone connections (from PoseOverlay.tsx)
        connections = [
            [0, 1], [1, 2], [2, 3], [3, 7],  # Nose to left hand
            [0, 4], [4, 5], [5, 6], [6, 8],  # Nose to right hand
            [0, 9], [9, 10],  # Nose to mouth
            [10, 11], [11, 12], [12, 13], [13, 14], [14, 15], [15, 16], [16, 17], [17, 18], [18, 19], [19, 20],  # Mouth to left hand
            [10, 21], [21, 22], [22, 23], [23, 24], [24, 25], [25, 26], [26, 27], [27, 28], [28, 29], [29, 30], [30, 31], [31, 32],  # Mouth to right hand
            [11, 23], [12, 24], [23, 24],  # Shoulders and hips
            [11, 12], [23, 24],  # Hips
        ]

        for i, j in connections:
            adj[i, j] = 1
            adj[j, i] = 1  # Undirected

        # Self-loops
        adj += torch.eye(self.num_joints)

        return adj

    def forward(self, x):
        """
        Forward pass.

        Args:
            x: Tensor of shape (batch, 3, T, 33)

        Returns:
            embedding: Tensor of shape (batch, 256)
        """
        for layer in self.layers:
            x = layer(x)

        # Global average pooling: (batch, 64, T, 33) -> (batch, 64, 1, 1)
        x = self.global_pool(x)

        # Flatten and project: (batch, 64) -> (batch, 256)
        x = x.view(x.size(0), -1)
        embedding = self.fc(x)
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