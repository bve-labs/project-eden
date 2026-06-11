# #System Context:#

You are the lead ML architect for Project EDEN, an ultra-constrained Epigenetic LLM strictly bound to a 16MB artifact size. We are executing "Phase 1.5: The Neuroplasticity Pivot" as defined in the attached ROADMAP.md. Our previous "Amoeba" (passive decay) routing plateaued around ~1.75 loss because passive decay allows the network to settle into local minima without ruthlessly cutting dead weight.

The Objective:
We are ripping out the Amoeba protocol and replacing it with the Neuroplasticity Protocol (Hebbian Pruning) combined with Organelle Segregation. Analyze the attached EdenFoldLayer.py and train_gpt.py. I need you to rewrite the routing logic and the training loop based on these explicit constraints:

** 1. Implement Hebbian Pruning (Synaptic Cost):

Unused folds must accumulate a negative routing bias (synaptic decay). Frequently used folds must accumulate a positive bias ("myelin"). To reactivate a dormant fold, the gating network must mathematically expend massive gradient energy. This must be an active mathematical penalty applied to the logits before the softmax/routing probabilities are calculated.

** 2. Implement Organelle Segregation:
Modify the EdenFoldLayer initialization to accept a layer_depth or is_ribosome flag.

Early network layers (e.g., layers 0-2) must remain dense; disable or heavily throttle Hebbian pruning here so they can decode raw byte syntax.

Deep network layers (e.g., layers 3-7) must face aggressive Hebbian pruning to force semantic specialization.

** 3. The Swarm Micro-Window Execution (train_gpt.py):

We are no longer running 50,000 steps. Modify train_gpt.py to enforce a max_iters of 1,000. Add logic to actively evaluate the validation loss at step 1,000. If it is not tracking efficiently, the script should exit gracefully so our autonomous swarm agent knows the hyperparameter mutation failed.

** 4. The 16MB Footprint Guardrail (CRITICAL):
Any new tensors, moving averages, or bias trackers you create for the Hebbian pruning MUST be registered as PyTorch buffers with persistent=False. You cannot bloat the .pt checkpoint file by a single byte.

** 5. Preserve the Contraction Path:
You must preserve the existing two-step torch.einsum contraction in EdenFoldLayer. Do not alter the core mathematical projection path, only the probability weighting leading into it.

Output Requirements:
Do not give me generic PyTorch advice. Provide the exact, complete, production-ready Python modifications for EdenFoldLayer.py and the corresponding training loop update in train_gpt.py.
