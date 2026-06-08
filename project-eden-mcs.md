# Project EDEN: Master Context Summary (MCS) — Update v2.0

This document serves as the comprehensive architectural blueprint, operational diary, and strategic infrastructure roadmap for **Project EDEN (Epigenetic Data Encoding Network)**. It aggregates our engineering decisions, runtime telemetry milestones, and algorithmic breakthroughs as we transition from foundational baseline testing into parallel MVP 2.0 edge-frontier research.

---

## 1. The Core Architectural Framework (MVP 1.0)

Project EDEN is a highly constrained, token-less language model framework engineered to run strictly under a **16MB hardware footprint limit**. It re-imagines parameters by establishing an **Epigenetic Implicit Neural Representation (INR)**:

* **The Genome (Fixed DNA):** Large pseudo-random weight buffers (`base_weight`) are instantiated deterministically directly inside VRAM at initialization using a 4-byte seed. These base weights are permanently frozen (`requires_grad=False`) and consume **0 bytes** of storage space on disk.
* **The Epigenome (Dynamic Expression):** The network exclusively trains and stores an ultra-lean array of scaling coefficients (`mixing_coeffs`) and standard biases. During the forward pass, the model scales the massive, static genetic weights dynamically (`dynamic_weight = base_weight * mixing_coeffs`).
* **The Architectural Metric:** A completed pre-training run yields an exceptionally compressed saved checkpoint (`eden_artifact.pt`) of just **~2.8 MB**, while preserving an active, expressive VRAM footprint of 709,921 parameters.

---

## 2. Data Layer & Tokenization Pipeline

To bypass vocabulary-table overhead and prevent GPU starvation, the data ingestion architecture operates at the atomic level of code:

* **Zero-Vocab Byte Tokenizer:** Eliminates traditional semantic tokenizers (e.g., Tiktoken, SentencePiece). It utilizes a literal `ByteTokenizer` mapping raw UTF-8 text directly to integers `0–255`. Vocabulary size is exactly **256**, reducing the tokenizer file footprint to **0 bytes**.
* **RAM-Disk Fetching Engine:** Data is streamed non-blockingly via memory-mapped binary arrays (`np.memmap`) using the `EdenByteDataset` class. This ensures zero-latency tensor delivery straight to the execution pipeline.
* **The Datasets:** For full pre-training, the model digests a 50,000-sample slice of the FineWeb-Edu corpus compiled into a **232 MB** stream (`fineweb.bin`). For instruction tuning, it utilizes a 10,000-sample clean Alpaca layout mapped into a **7 MB** chat stream (`instructions.bin`) using explicit conversational boundaries (`<|USER|>\n...\n<|BOT|>\n...\n<|END|>`).

---

## 3. Telemetry, Infrastructure, & Bug Post-Mortems

Our logging layer natively uncouples compute loops from data-persistence networks:

* **Asynchronous Logging Engine:** Deployed using a thread-isolated Python design, execution layers are completely decoupled from network round-trips. Payloads (`run_id`, `step`, `loss`, `val_bpb`, `step_time`) are offloaded to a background `ThreadPoolExecutor`, preventing telemetry lag from idling primary GPU operations.
* **The Telemetry Store:** Deployed via a Serverless Azure SQL Database (Central US Region) configured with a hard infrastructure billing ceiling to mitigate unexpected cloud scaling costs.

### Infrastructure Fixes Applied

During cluster deployment, three major environment friction points were encountered and successfully resolved:

1. **ODBC GPG Key Signatures:** Fixed an Ubuntu 22.04 `apt` repository error (`NO_PUBKEY EB3E94ADBE1229CF`) by migrating Microsoft's dearmored key execution pathway from the restricted `/etc/apt/keyrings/` folder straight into the globally trusted `/etc/apt/trusted.gpg.d/` directory.
2. **NumPy 2.x ABI Clash:** Resolved an environment conflict between older PyTorch binary compilation layers and the strict NumPy 2.x ABI breaking changes by pinning container dependencies to `numpy<2.0.0` inside `requirements.txt`.
3. **Database Firewall Boundary:** Resolved transient login timeout errors (`HYT00`) and server access errors (`42000`) caused by security firewalls on the Serverless Azure SQL endpoint by explicitly whitelisting the Spheron cluster's external host IP node (`185.216.21.98`).

---

## 4. Pre-Training Verifiability & Baseline Telemetry

To measure phenotypic validation, cross-entropy loss is mathematically transformed into a normalized **Validation Bits-Per-Byte (val_bpb)** score:

$$val\_bpb = \frac{loss}{\ln(2)}$$

### Core Run Findings (H100 PCIe Baseline)

* **Initial Target Roadmaps:** Anticipated a baseline loss scaling down to 2.70 and a $val\_bpb$ stabilizing under 3.90.
* **Active Performance Logs:** The model shattered these targets. By step 24,770+, your current live training marathon on the H100 PCIe node stabilized a steady execution time of ~1.63 seconds per step, driving the loss floor down to an impressive **1.89 - 1.93** range and a $val\_bpb$ down to **2.72 - 2.79**.

---

## 5. The Ephemerality Playbook & Persistent Storage

Because default Docker run clusters are completely ephemeral, we engineered a data preservation sequence to prevent hard-earned parameter weights from dissolving upon container exit:

* **Extraction Routing:** Established a host-level post-training routine utilizing `docker cp` to pull the raw `eden_artifact.pt` file straight out of the exited workspace filesystem.
* **Decoupled Seed Vault:** Provisioned an isolated **10 GB Spheron AI Persistent Storage Volume** ($0.00010219 / GB·hr). This volume completely decouples storage from the cluster compute lifecycle, allowing you to safely spin down expensive H100 nodes while keeping the artifacts intact for downstream staging.
* **Pipeline Automation:** Formulated an orchestration script (`run_pipeline.sh`) to sequentially run dataset synthesis, foundational pre-training, and reduced-learning-rate chat fine-tuning (`train_chat.py`) inside isolated container lifecycles that auto-mount to the host file structure.

---

## 6. The Frontier: MVP 2.0 Spatial Folding

To dramatically optimize the model's degrees of freedom without increasing the 16MB storage footprint, we are launching a parallel sandbox instance on a server-grade **H100 SXM5 node ($1.49/hr via Verda)** running a secure, isolated host-key identity (`id_eden_sxm5`).

This parallel cluster tests the concepts of **MVP 2.0 Spatial Folding**:

### 1. Chromatin MoE Folding (`EdenFoldLayer`)

Instead of scaling static weights with a rigid 1-dimensional vector, the architecture maps an algorithmic **Mixture of Experts (MoE)** directly onto the virtual parameters.

* The model instantiates `num_folds` of distinct pseudo-random matrices from the fixed integer seeds into VRAM (`requires_grad=False`).
* An ultra-lightweight, trainable `chromatin_gate` layer reads the incoming byte token sequence, calculates a routing path, and dynamically "unfolds" and weights specific structural folds via an optimized Einstein summation (`torch.einsum`).
* **The Goal:** Drive the model's ultimate loss floor down to an unprecedented **1.5 range (~2.16 bits-per-byte)**.

### 2. Karpathy Agentic Swarm Integration

Following successful validation of the chromatin folding layers, the final layer of the deployment optimization will be handed off to an autonomous, closed-loop **Agentic Swarm**:

* The swarm will treat the codebase strictly as editable DNA, executing code mutations on hyperparameters, folding matrices, and optimization gates.
* **Guardrails:** The swarm is bound to single-file mutations, fixed 1,000-step training window evaluation caps, and mandatory pre-execution markdown logging (`reasoning.md`) to prevent infinite code deviation or cloud budget billing overruns.

This technical validation provides an elite proof-of-concept (POC) to establish deep authority in model optimization and hardcore AI engineering.