import math

import torch
import torch.nn as nn
from torch.nn import functional as F


class EdenFoldLayer(nn.Module):
    """
    MVP 2.0: Chromatin Remodeling Layer
    Uses an algorithmic Mixture of Experts (MoE) to dynamically unfold
    specific sections of the fixed geometric DNA based on input context.
    """
    def __init__(self, in_features, out_features, num_folds=4, seed=42):
        super().__init__()
        self.in_features = in_features
        self.out_features = out_features
        self.num_folds = num_folds
        
        # 1. The Epigenome (Trainable): 
        # A tiny gating network that decides which DNA fold to expose based on the input byte.
        self.chromatin_gate = nn.Linear(in_features, num_folds)
        
        # We now have a tiny mixing coefficient for EACH fold.
        self.mixing_coeffs = nn.Parameter(torch.ones(num_folds, 1))
        self.bias = nn.Parameter(torch.zeros(out_features))

        # 2. The Genome (Fixed): 
        # We generate 'num_folds' distinct matrices. This is our highly folded DNA.
        generator = torch.Generator().manual_seed(seed)
        base_weight = torch.randn((num_folds, out_features, in_features), generator=generator) / math.sqrt(in_features)
        base_weight.requires_grad_(False)
        
        # requires_grad=False ensures the massive folds are never saved to disk.
        self.register_buffer('base_weight', base_weight, persistent=False) 

    def forward(self, x):
        # x shape: [Batch, Tokens, in_features]
        if x.size(-1) != self.in_features:
            raise ValueError(
                f"EdenFoldLayer expected input width {self.in_features}, got {x.size(-1)}"
            )
        
        # A. Calculate the Chemical Signal (Which folds should we open?)
        # fold_probs shape: [Batch, Tokens, num_folds]
        fold_probs = F.softmax(self.chromatin_gate(x), dim=-1)
        
        # B. Unfold the Matrix
        # We weight the static DNA folds by the learned epigenetic mixing coefficients
        dynamic_folds = self.base_weight * self.mixing_coeffs.view(self.num_folds, 1, 1)
        
        # C. Apply the specific fold to the input based on the gate's routing
        # We use einsum to efficiently batch-multiply the gated folds without looping
        # fold_probs: b t f (batch, tokens, folds)
        # dynamic_folds: f o i (folds, out_features, in_features)
        # x: b t i (batch, tokens, in_features)
        
        # Step 1: Project the input sequence across all DNA folds (bti * foi -> btfo)
        x_projected = torch.einsum('bti, foi -> btfo', x, dynamic_folds)
        
        # Step 2: Weight the projections by the learned gate probabilities and collapse (btfo * btf -> bto)
        out = torch.einsum('btfo, btf -> bto', x_projected, fold_probs)
        
        return out + self.bias
