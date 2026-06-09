# The Objective Roadmap

To succeed, we cannot just build cool technology in a vacuum; we have to validate the core assumptions and make sure we are solving a real problem before we spend time building dashboards.

---

## Phase 1: Prove the Amoeba Protocol (Current)

We don't scale the hardware or the datasets until the core routing logic proves its worth. The static `eden-folds` baseline is currently sitting near a 1.68 cross-entropy loss. Amoeba must beat that result on the same corpus, topology, and training budget.

* **The Task:** The `chromatin_gate` now routes through non-persistent fold vitality. Each batch records detached fold utilization during the forward pass; the training loop then reinforces recently used folds when loss improves against the EMA baseline and decays them when it does not.

* **The Execution:** Run a strict A/B test. Compare the `eden-folds` baseline against `eden-amoeba` using the same 232MB `fineweb.bin`, `block_size=256`, `batch_size=512`, `max_iters=50000`, `lr=6e-4`, `d_model=512`, `n_layers=8`, `n_heads=8`, and `num_folds=4`.

* **The Milestone:** The Amoeba routing must break the **1.60 barrier** and prove a trajectory toward the **1.50 gate** on the same exact data. If it plateaus at 1.7x, the protocol is rejected.

---

## Phase 1 Execution Contract

Before any long H100 run, prove that artifacts can survive topology changes and that the mounted dataset is the real FineWeb binary:

```bash
python smoke_checkpoint_contract.py
python prepare_data.py
```

`smoke_checkpoint_contract.py` validates wrapped checkpoint round trips, legacy bare `state_dict` loading, 1-fold and 4-fold reconstruction, non-persistent virtual DNA buffers, and the 16MB artifact size guardrail.

Every production pre-training run now saves `eden_artifact.pt` as a compact self-describing dictionary:

```text
{
  "format": "eden-checkpoint",
  "format_version": 1,
  "model_state": ...,
  "config": ...,
  "metrics": ...
}
```

`generate.py` and `train_chat.py` both load through the shared checkpoint loader, so a 1-fold legacy artifact, current 4-fold artifact, or future routed artifact reconstructs from its own metadata instead of assuming `EdenLM()` defaults.

Strict A/B launch commands:

```bash
# Static spatial-fold baseline on the same corpus/config
EDEN_PROTOCOL=eden-folds python train_gpt.py

# Amoeba routing validation on the same corpus/config
EDEN_PROTOCOL=eden-amoeba python train_gpt.py
```

Docker runs must use semantic image tags and must not use `:latest`:

```bash
docker build -t project-eden:v2-amoeba .
docker run --gpus all --rm \
  -v "$PWD:/workspace" \
  -e EDEN_FINEWEB_MIN_BYTES=220000000 \
  -e EDEN_PROTOCOL=eden-amoeba \
  project-eden:v2-amoeba python train_gpt.py
```

`train_gpt.py` refuses to train on a missing or tiny `fineweb.bin` by default. `EDEN_ALLOW_DUMMY_DATA=1` exists only for local smoke tests and must not be used for A/B results.

---

## Phase 2: Data Scaling & The Karpathy Swarm (Automation)

Once the biological routing is mathematically validated, humans step out of the hyperparameter loop.

* **The Task:** We pull down a 1GB+ high-quality instructional dataset (e.g., a massive slice of Alpaca or OpenHermes) to give the model actual reasoning context.

* **The Execution:** We deploy a single Karpathy autoresearch Swarm on a stable, dedicated instance. Its only job is to iterate on the Amoeba decay rates, learning rates, and batch sizes over 1,000-step windows.

* **The Milestone (The Super Bowl):** The swarm hits the elite **sub-1.3 loss floor**, putting this 16MB architecture in the same statistical weight class as the OpenAI parameter golf winners.

---

## Phase 3: The Dashboard & Market Discovery (Productization)

Once the model is learning efficiently, we need to expose the telemetry and figure out who actually needs a 16MB LLM.

* **The Task:** Build a lightweight telemetry dashboard to visualize the dynamic folds, decay routing, and loss curves in real-time.

* **The Execution:** This is where we focus on asking the right questions to the market. We don't pitch the tech; we investigate the problems. Who is currently blocked by hardware limits? Is it IoT device manufacturers? Edge computing networks? Mobile app developers? We use the dashboard as the ultimate proof-of-concept during discovery interviews.

* **The Milestone:** Securing the first pilot integration of the EDEN architecture in a constrained hardware environment.

---

## The Next Immediate Step

Keep it iterative: run checkpoint smokes locally, confirm the mounted `fineweb.bin` passes preflight, then launch the `eden-folds` / `eden-amoeba` A/B with explicit `EDEN_PROTOCOL` labels and semantic Docker tags.

---

## The Biological Metaphor: Moving from DNA to Cells

Right now, Project EDEN is operating at the molecular level. We have fixed "DNA" (frozen weights) and an "Epigenome" (the Chromatin gate determining which folds to read). To push this further without bloat, we need to look at cellular efficiency and biological spatial routing.

### Slime-Mold Spatial Routing

Amoebas, specifically slime molds (*Physarum polycephalum*), solve highly complex spatial routing problems (like mazes) to find food with maximum efficiency and zero brain capacity. Instead of a standard linear MoE gate, we can structure the `chromatin_gate` to use a localized, decay-based routing algorithm. If a specific fold yields a high activation (finds the "food"), the pathway strengthens; if it doesn't, the path decays.

### Organelle Segregation

Cells compartmentalize tasks. We could expand the architecture so that different transformer blocks act as distinct organelles. Early layers (the "ribosomes") only decode raw syntax, while later layers (the "nucleus") only fold for deep semantic logic.

### The Diminishing Returns Test

If we just add 10,000 folds, we are basically just building a standard LLM the hard way. The goal of MVP 3.0 must be finding the absolute maximum expressive capacity a single hardware node can handle while keeping the disk file under 16MB.

---

## MVP 3.5: The Swarm Strategy — Dual-Agent Orchestration

Using Karpathy's autoresearch repo is the perfect move, but we should not hand it a blank check yet. We need to build the "what" (the biological Organelle/Amoeba layer) manually, and let the swarm figure out the "how" (the hyperparameter routing).

Partitioning the optimization into a dual-agent orchestration layer requires tight control over agentic workflows. Managing concurrent swarm operations across your primary IDEs, like Cursor or Antigravity, will allow us to pit these architectural concepts against each other in real-time.

* **Swarm Alpha (The Biologist):** This agent's sole directive is architectural efficiency. It mutates the `num_folds`, tweaks the Einstein summation paths, and tests the "Slime Mold" decay algorithms. Its success metric is highest validation throughput per MB of active VRAM.

* **Swarm Beta (The Synthesizer):** This agent focuses entirely on the data and learning rate. It tests different batch sizes, gradient accumulation steps, and curriculum learning strategies to squeeze every drop of context out of the larger datasets.

---

## Data & The 1.5 Loss Floor

To get coherent, logical outputs to complex questions, the model cannot just read the same 50,000 samples over and over. It will overfit and memorize.

We need to scale the dataset significantly. We will compile a massive 1GB+ chunk of technical, logical, and conversational data. Because the architecture streams data directly from disk using `np.memmap`, increasing the dataset size to 10 million samples won't use a single extra byte of VRAM. The swarms will then use this expanded context to drive the loss down toward that 1.2 range.
