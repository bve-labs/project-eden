import math
import torch
import torch.nn as nn
from torch.nn import functional as F

class EdenFoldLayer(nn.Module):
    def __init__(self, in_features, out_features, num_folds=4, seed=42, is_ribosome=False):
        super().__init__()
        self.in_features = in_features
        self.out_features = out_features
        self.num_folds = num_folds
        self.is_ribosome = is_ribosome  # Organelle Segregation Flag
        
        self.chromatin_gate = nn.Linear(in_features, num_folds)
        self.mixing_coeffs = nn.Parameter(torch.ones(num_folds, 1))
        self.bias = nn.Parameter(torch.zeros(out_features))

        generator = torch.Generator().manual_seed(seed)
        base_weight = torch.randn((num_folds, out_features, in_features), generator=generator) / math.sqrt(in_features)
        base_weight.requires_grad_(False)
        self.register_buffer('base_weight', base_weight, persistent=False)

        # Neuroplasticity Buffers (Not saved to disk)
        # Tracks the learned synaptic bias (myelin vs. decay)
        self.register_buffer('synaptic_bias', torch.zeros(num_folds), persistent=False)
        # Tracks current batch utilization for post-batch updates
        self.register_buffer('batch_utilization', torch.zeros(num_folds), persistent=False)

    def forward(self, x):
        # A. Calculate Chemical Signal
        gate_logits = self.chromatin_gate(x)
        
        # B. Apply Hebbian Penalty (Only to Nucleus/Deep Layers)
        if not self.is_ribosome:
            # Add synaptic bias to logits before softmax. 
            # Negative bias mathematically starves the pathway.
            gate_logits = gate_logits + self.synaptic_bias.view(1, 1, -1)
            
        fold_probs = F.softmax(gate_logits, dim=-1)

        # Track utilization for the training loop update
        if self.training and not self.is_ribosome:
            # Average utilization across batch and sequence length
            util = fold_probs.mean(dim=(0, 1)).detach()
            self.batch_utilization.copy_(util)
        
        # C. Unfold and Project (Preserving exact einsum dimensions)
        dynamic_folds = self.base_weight * self.mixing_coeffs.view(self.num_folds, 1, 1)
        x_projected = torch.einsum('bti, foi -> btfo', x, dynamic_folds)
        out = torch.einsum('btfo, btf -> bto', x_projected, fold_probs)
        
        return out + self.bias