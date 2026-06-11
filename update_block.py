class EdenBlock(nn.Module):
    def __init__(self, d_model, n_heads, seed, num_folds=4, layer_idx=0):
        super().__init__()
        # Organelle Segregation: First 3 layers are dense "Ribosomes"
        is_ribosome = layer_idx < 3 
        
        self.ln_1 = nn.LayerNorm(d_model)
        self.attn_qkv = EdenFoldLayer(d_model, 3 * d_model, num_folds=num_folds, seed=seed+1, is_ribosome=is_ribosome)
        self.attn_proj = EdenFoldLayer(d_model, d_model, num_folds=num_folds, seed=seed+2, is_ribosome=is_ribosome)
        self.n_heads = n_heads
        
        self.ln_2 = nn.LayerNorm(d_model)
        self.mlp_fc1 = EdenFoldLayer(d_model, 4 * d_model, num_folds=num_folds, seed=seed+3, is_ribosome=is_ribosome)
        self.mlp_fc2 = EdenFoldLayer(4 * d_model, d_model, num_folds=num_folds, seed=seed+4, is_ribosome=is_ribosome)
        # ... rest of forward pass remains identical