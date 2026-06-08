# Project EDEN

**Epigenetic Data Encoding Network** — An Epigenetic Implicit Neural Representation (INR) Architecture by BVE LABS.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)
[![Framework](https://img.shields.io/badge/Framework-PyTorch-orange.svg)](#)
[![Artifact Size](https://img.shields.io/badge/Artifact_Size-~2.8MB-success.svg)](#)
[![Tokenizer](https://img.shields.io/badge/Tokenizer-Byte_Level_256-lightgrey.svg)](#)

---

## What Is EDEN?

Project EDEN is a byte-level language model designed to operate under an extreme **16MB storage constraint**. Instead of storing large weight matrices on disk, EDEN generates them deterministically at runtime from a 4-byte seed and stores only a tiny vector of learned scaling coefficients — the "epigenome."

A completed pre-training run produces a checkpoint of roughly **2.8 MB**, well under the 16MB threshold, while the model maintains 709,921 active parameters in VRAM.

---

## Architecture

### The Epigenetic Layer (`EdenLayer`)

Replaces standard `nn.Linear`. At initialization, a large pseudo-random `base_weight` matrix is expanded from a fixed integer seed directly into VRAM (`requires_grad=False`, never saved). The only trainable parameters are a scalar `mixing_coeffs` vector and a bias. During the forward pass:

```
dynamic_weight = base_weight * mixing_coeffs
```

This means the saved checkpoint contains only the mixing coefficients and biases — not the weight matrices themselves.

### Zero-Vocab Byte Tokenizer (`ByteTokenizer`)

No SentencePiece, no tiktoken, no vocabulary file. The tokenizer encodes raw UTF-8 text directly to integers `0–255`. Vocabulary size is exactly **256**. Storage cost: **0 bytes**.

Because tokens are bytes, cross-entropy loss converts cleanly to **Validation Bits-Per-Byte**:

```
val_bpb = loss / ln(2)
```

### RAM-Disk Data Pipeline (`EdenByteDataset`)

Training data is memory-mapped from disk via `np.memmap`. This streams raw byte sequences into the GPU with zero latency and no in-memory copy overhead.

---

## Repository Structure

| File | Purpose |
|---|---|
| `train_gpt.py` | Foundational pre-training loop on `fineweb.bin` |
| `train_chat.py` | Instruction fine-tuning loop on `instructions.bin` |
| `prepare_data.py` | Downloads 50,000 FineWeb-Edu samples → `fineweb.bin` |
| `prepare_instruct.py` | Downloads 10,000 Alpaca-Cleaned samples → `instructions.bin` |
| `generate.py` | CLI inference with chat-format streaming and stop-token detection |
| `Dockerfile` | NVIDIA CUDA container with ODBC driver for cloud GPU deployment |
| `requirements.txt` | Pinned Python dependencies |

---

## Quickstart

### 1. Clone and set up environment

```bash
git clone https://github.com/bve-labs/project-eden.git
cd project-eden
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```bash
AZURE_SQL_CONNECTION_STRING=your_connection_string
# or individual components:
AZURE_SQL_SERVER=your_server
AZURE_SQL_DATABASE=your_db
AZURE_SQL_USERNAME=your_user
AZURE_SQL_PASSWORD=your_password
```

If these are not set, training runs normally with logging silently disabled.

### 3. Prepare training data

```bash
# Pre-training data (~232 MB)
python prepare_data.py

# Instruction fine-tuning data (~7 MB)
python prepare_instruct.py
```

### 4. Run foundational pre-training

```bash
python train_gpt.py
```

Saves checkpoint to `eden_artifact.pt`. Training logs `run_id`, `step`, `loss`, `val_bpb`, and `step_time` to Azure SQL asynchronously — the GPU loop never blocks on database writes.

### 5. Run instruction fine-tuning (chat)

```bash
python train_chat.py
```

Loads `eden_artifact.pt`, fine-tunes on Alpaca instruction data at a reduced learning rate (`3e-5`), and saves to `eden_artifact_chat.pt` — preserving the foundational checkpoint.

### 6. Generate text

```bash
# Foundational model
python generate.py --checkpoint eden_artifact.pt --prompt "Project EDEN"

# Chat fine-tuned model
python generate.py --checkpoint eden_artifact_chat.pt --prompt "Explain what EDEN is"
```

`generate.py` wraps prompts in `<|USER|>` / `<|BOT|>` / `<|END|>` boundaries and streams decoded UTF-8 output to stdout, stopping automatically when `<|END|>` is detected.

Full options:

```bash
python generate.py --help
```

---

## Docker Deployment

The `Dockerfile` builds an NVIDIA CUDA image with the Microsoft ODBC 18 driver baked in for cloud GPU clusters.

```bash
docker build -t project-eden .
docker run --gpus all \
  -e AZURE_SQL_CONNECTION_STRING="..." \
  project-eden
```

`fineweb.bin` is included in the build context (see `.dockerignore`). Secrets and checkpoints are excluded from the image.

---

## Telemetry

Each training run generates a unique `run_id` and logs metrics to an Azure SQL `training_logs` table:

| Column | Type | Description |
|---|---|---|
| `run_id` | `text` | Unique 12-char hex identifier per run |
| `step` | `integer` | Training step number |
| `loss` | `numeric` | Cross-entropy loss |
| `val_bpb` | `numeric` | Validation Bits-Per-Byte |
| `step_time` | `numeric` | Seconds elapsed since last log |

Logging runs in a background `ThreadPoolExecutor` (1 worker). Errors are printed inline but never crash the training loop.

---

## Hardware

| Environment | Device |
|---|---|
| Local development | Apple Silicon (MPS) |
| Cloud training | NVIDIA H100 via [Spheron](https://www.spheron.network/pricing/) |
| Container target | `nvidia/cuda:12.1.1-runtime-ubuntu22.04` |

---

## License

AGPL-3.0 — see [LICENSE](LICENSE).

> **BETA:** This is an active research project. Use at your own risk.
