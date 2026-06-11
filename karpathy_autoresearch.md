
# ***KARPATHY AUTOSWARM INTEGRATIONS***

Swarm Alpha (The Biologist): This agent's sole directive is architectural efficiency. It ignores the data pipeline entirely and focuses on mutating num_folds, tweaking routing paths, and testing the Hebbian pruning penalty over short windows. Its success metric is the highest validation throughput per MB of active VRAM.

Swarm Beta (The Synthesizer): This agent ignores the biology and focuses entirely on squeezing context out of the 1GB+ dataset. It tests different batch sizes, gradient accumulation steps, and learning rate curves.

Traditional swarms operate something like this, so may want to evaluate this as well:
The Planner (GPT-5.5 xhigh): Takes user requirements and creates the architecture.
The Worker (GPT-5.5 Medium or Claude Fable): Executes focused code generation and tests functions.
The Reviewer (GPT-5.5 High): Evaluates the code against acceptance criteria.

Andrej Karpathy literally built the original autoresearch framework on and for modern NVIDIA GPUs (specifically targeting 20+ GB VRAM setups like the A100 and H100) running PyTorch. It uses the exact same val_bpb (Validation Bits-Per-Byte) metric that you are already tracking to measure efficiency.

How to Integrate It
You do not need to merge Karpathy's entire codebase into Project EDEN. The autonomous loop now lives natively in `swarm_orchestrator.py`, which maps directly to the EDEN Azure SQL telemetry contract.

Reference the Original: git clone `https://github.com/karpathy/autoresearch.git` on the Spheron node only when you want to inspect the upstream loop design.

Use the EDEN Prompt: `prompt.txt` contains the Swarm Alpha/Beta instructions. It replaces Karpathy's generic `program.md` with Neuroplasticity-specific constraints: 1,000-step windows, Hebbian `decay_penalty` / `growth_reward` mutations, Organelle Segregation, and the 16MB artifact guardrail.

Run the Native Loop: Point the swarm at Project EDEN by running:

```bash
python swarm_orchestrator.py --agent alpha --runs 1
```

The orchestrator writes `swarm_config.json`, inserts `RUNNING` into `dbo.swarm_experiments`, launches `train_gpt.py`, records the exit status, and uses Git to keep successful mutations or revert failed ones.
