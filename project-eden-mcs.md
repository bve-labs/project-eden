# Project EDEN: Master Context Summary (MCS) & Technical Specification

**Epigenetic Data Encoding Network** — An Epigenetic Implicit Neural Representation (INR) Architecture by BVE LABS.

This document serves as the comprehensive architectural blueprint, operational diary, and strategic infrastructure roadmap for Project EDEN. It aggregates our engineering decisions, runtime telemetry milestones, and algorithmic breakthroughs as we transition from foundational baseline testing into parallel MVP 2.0/3.0 edge-frontier research.

## 1. The Core Architectural Innovation

Project EDEN is a highly constrained, token-less language model framework engineered to run strictly under a **16MB hardware footprint limit**. It completely re-imagines how neural network parameters are handled by introducing an **Epigenetic Implicit Neural Representation (INR)**:

* **The Genome (Fixed DNA):** Large pseudo-random weight buffers (`base_weight`) are instantiated deterministically directly inside VRAM at initialization using a 4-byte seed. These base weights are permanently frozen (`requires_grad=False`) and consume **0 bytes** of storage space on disk.
* **The Epigenome (Dynamic Expression):** The network exclusively trains and stores an ultra-lean array of scaling coefficients (`mixing_coeffs`), fold gates (`chromatin_gate`), and standard biases. During the forward pass, the model weights are dynamically scaled or routed via optimized tensor core calculations.
* **The Architectural Metric:** A completed baseline pre-training run yields an exceptionally compressed saved checkpoint (`eden_artifact.pt`) of just **~2.8 MB**, comfortably clearing the 16MB threshold while preserving an active, expressive VRAM footprint.

## 2. Data Layer & Tokenization Pipeline

To bypass vocabulary-table overhead and prevent GPU compute starvation, the data ingestion architecture operates at the atomic level of code:

* **Zero-Vocab Byte Tokenizer:** Eliminates traditional semantic tokenizers (e.g., Tiktoken, SentencePiece). It implements a literal `ByteTokenizer` mapping raw UTF-8 text directly to integers `0–255`. Vocabulary size is exactly **256**, reducing the tokenizer file footprint to **0 bytes**.
* **RAM-Disk Fetching Engine:** Data is streamed non-blockingly via memory-mapped binary arrays (`np.memmap`) using the `EdenByteDataset` class. This ensures zero-latency tensor delivery straight to the execution pipeline.
* **The Datasets:**
  * **Pre-Training:** The model digests a 50,000-sample slice of the FineWeb-Edu corpus compiled into a **232 MB** stream (`fineweb.bin`).
  * **Instruction Tuning:** It utilizes a 10,000-sample clean Alpaca layout mapped into a **7 MB** chat stream (`instructions.bin`) using explicit conversational boundaries:

```text
<|USER|>
...
<|BOT|>
...
<|END|>
```

---

## 3. Telemetry, Infrastructure, & Bug Post-Mortems

Our logging engine natively uncouples hardware compute loops from data-persistence networks to completely eliminate latency overhead:

* **Asynchronous Logging Engine:** Built with a thread-isolated Python design, database persistence operations are completely decoupled from training execution. Telemetry payloads (`run_id`, `step`, `loss`, `val_bpb`, `step_time`) are pushed to a background single-worker `ThreadPoolExecutor`, preventing network round-trip lag from idling primary GPU operations.
* **Serverless Azure SQL Database:** The persistence store is hosted via a Serverless Azure SQL instance (Central US Region) configured with a hard infrastructure ceiling (**Overage billing: Disabled**) to mitigate unexpected cloud bill scaling.

### Environment Optimizations Applied

During cloud cluster deployment, three major environment friction points were encountered and successfully resolved:

1. **ODBC GPG Key Signatures:** Fixed an Ubuntu 22.04 `apt` repository signature error (`NO_PUBKEY EB3E94ADBE1229CF`) by migrating Microsoft's dearmored key execution pathway from the restricted `/etc/apt/keyrings/` folder straight into the globally trusted `/etc/apt/trusted.gpg.d/` directory.
2. **NumPy 2.x ABI Clash:** Resolved an environment conflict between PyTorch compilation layers and strict NumPy 2.x ABI breaking changes by pinning container dependencies to `numpy<2.0.0` inside `requirements.txt`.
3. **Database Firewall Boundary:** Resolved transient login timeout errors (`HYT00`) and server access errors (`42000`) on the serverless endpoint by explicitly whitelisting the Spheron cluster's external host IP node (`185.216.21.98`).

---

## 4. Pre-Training Verifiability & Baseline Telemetry

To measure phenotypic validation, cross-entropy loss is mathematically transformed into a normalized **Validation Bits-Per-Byte (val_bpb)** score:

$$val\_bpb = \frac{loss}{\ln(2)}$$

### Performance Benchmarks (H100 PCIe Baseline)

* **Initial Target Roadmaps:** Anticipated a baseline loss scaling down to 2.70 and a $val\_bpb$ stabilizing under 3.90.
* **Active Performance Logs:** The foundational architecture shattered these targets. Over an extended training marathon on a single H100 PCIe node, execution speed stabilized at ~1.63 seconds per step, driving the loss floor down to an impressive **1.89 - 1.93** range and a $val\_bpb$ down to **2.72 - 2.79**.

---

## 5. The Ephemerality Playbook & Persistent Storage

Because default Docker run clusters are completely ephemeral, we engineered a rigorous data preservation sequence to protect weights from dissolving upon container exit:

* **Extraction Routing:** Established a host-level post-training routine utilizing `docker cp` to pull the raw `eden_artifact.pt` file straight out of the exited workspace container filesystem.
* **Decoupled Seed Vault:** Provisioned an isolated **10 GB** Spheron AI Persistent Storage Volume ($0.00010219 / GB·hr). This volume completely decouples storage from the cluster compute lifecycle, allowing us to safely spin down expensive H100 nodes while keeping checkpoints intact for downstream staging.
* **Pipeline Automation:** Formulated an orchestration script (`run_pipeline.sh`) to sequentially execute dataset synthesis, foundational pre-training, and reduced-learning-rate chat fine-tuning (`train_chat.py`) inside isolated container lifecycles that auto-mount to the host file structure.

---

## 6. The Frontier: MVP 2.0 Spatial Folding

To optimize the model's degrees of freedom without increasing the 16MB storage footprint, we leverage a parallel sandbox instance on a server-grade **H100 SXM5 node** running a secure, isolated host-key identity (`id_eden_sxm5`). This configuration tests the mechanics of **MVP 2.0 Spatial Folding**:

### 1. Chromatin MoE Folding (`EdenFoldLayer`)

Instead of scaling static weights with a rigid 1-dimensional vector, the architecture maps an algorithmic Mixture of Experts (MoE) directly onto the virtual parameters.

* The model instantiates `num_folds` of distinct pseudo-random matrices from the fixed integer seeds into VRAM (`requires_grad=False`).
* An ultra-lightweight, trainable `chromatin_gate` layer reads the incoming byte token sequence, calculates a routing path, and dynamically "unfolds" and weights specific structural folds via an optimized, two-step Einstein summation contraction (`torch.einsum`) to maintain low memory overhead.
* **The Goal:** Drive the model's ultimate loss floor down into an unprecedented **1.5 range (~2.16 bits-per-byte)**.

### 2. Karpathy Agentic Swarm Integration

Following successful validation of the chromatin folding layers, codebase optimization is handed off to an autonomous, closed-loop **Agentic Swarm**:

* The swarm treats the codebase strictly as editable DNA, executing automated code mutations on hyperparameters, folding matrices, and optimization gates.
* **Guardrails:** The swarm is strictly bound to single-file mutations, fixed 1,000-step training window evaluation caps, and mandatory pre-execution markdown logging (`reasoning.md`) to prevent infinite code deviation or cloud budget overruns.

---

## 7. The Frontier: MVP 3.0 Biological Routing Protocols

To push the parameter-to-size ratio to its absolute biological and mathematical limit, Project EDEN is transitioning from static routing to dynamic, self-optimizing biological algorithms. We are testing two parallel branch methodologies to evaluate extreme VRAM efficiency and dynamic pruning:

### Branch Alpha: The Amoeba Protocol (Slime-Mold Routing)

Inspired by the spatial routing efficiency of *Physarum polycephalum* (slime molds), this protocol introduces localized decay routing to the MoE gate.

* **Mechanism:** Folds that successfully capture data patterns maintain their structural integrity, while unutilized folds experience active decay.
* **Objective:** Allow the architecture to organically discover the most efficient routing paths through the fixed DNA matrix without requiring a heavy gradient push to correct bad static initializations.

### Branch Beta: The Neuroplasticity Protocol (Hebbian Pruning)

Modeled directly on biological neuroplasticity ("neurons that fire together, wire together"), this protocol introduces a synaptic energy cost to the routing layer.

* **Mechanism:** Introduces an Exponential Moving Average (EMA) `pathway_strength` buffer. Folds that are frequently utilized build "myelin," adding a positive bias that makes them mathematically effortless to activate. Unused folds undergo synaptic pruning—their strength decays into a negative bias, requiring a massive gradient energy expenditure from the gating network to wake them back up.
* **Objective:** Enable true self-pruning. The model can be instantiated with an excessively large number of folds (e.g., 64 or 128), and it will organically prune itself down to the precise number of folds required to solve the dataset, completely eliminating VRAM bloat.

---

## Repository Files Reference

| File | Purpose |
| --- | --- |
| `train_gpt.py` | Foundational pre-training loop on `fineweb.bin` |
| `train_chat.py` | Instruction fine-tuning loop on `instructions.bin` |
| `prepare_data.py` | Downloads 50,000 FineWeb-Edu samples → `fineweb.bin` |
| `prepare_instruct.py` | Downloads 10,000 Alpaca-Cleaned samples → `instructions.bin` |
| `generate.py` | CLI inference with chat-format streaming and stop-token detection |
| `Dockerfile` | NVIDIA CUDA container with ODBC driver for cloud GPU deployment |
| `requirements.txt` | Pinned Python dependencies |

---

## Quickstart Pipeline

### 1. Clone and Set Up Environment

```bash
git clone https://github.com/bve-labs/project-eden.git
cd project-eden
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Prepare Training Context

```bash
# Pre-training data (~232 MB)
python prepare_data.py

# Instruction fine-tuning data (~7 MB)
python prepare_instruct.py
```

### 3. Execute Infrastructure Launch

```bash
# Foundation Pre-training
python train_gpt.py

# Alignment Fine-tuning
python train_chat.py
```

---

## License

**AGPL-3.0** — see `LICENSE` for complete terms.

**BETA:** This is an active research project. Use at your own risk.
