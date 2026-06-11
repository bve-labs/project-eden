self.blocks = nn.Sequential(*[
            EdenBlock(d_model, n_heads, seed=1337 + i*10, num_folds=num_folds, layer_idx=i) for i in range(n_layers)
        ])