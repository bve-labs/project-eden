# Project EDEN 🧬

**Epigenetic Data Encoding Network** _An Epigenetic Implicit Neural Representation (INR) Architecture by BVE LABS._

[![Parameter Golf Challenge](https://img.shields.io/badge/OpenAI-Parameter_Golf-blue.svg)](#)
[![Artifact Size](https://img.shields.io/badge/Artifact_Size-16MB-success.svg)](#)
[![Framework](https://img.shields.io/badge/Framework-PyTorch-orange.svg)](#)

## The 16MB Bottleneck

Modern LLMs are severely memory-bound. Storing weights for even a small transformer requires hundreds of megabytes, making extreme low-storage environments impossible for standard architectures.

## The EDEN Solution

EDEN is a biologically-inspired approach to Neural Scaling Laws. Instead of storing massive static weight files, EDEN initializes a vast virtual neural network in VRAM from a 4-byte genetic seed.

During training, EDEN does not learn new weights; it only updates the "epigenetic" mixing coefficients. This allows the framework to train and run highly complex language models while keeping the total artifact size strictly under a few hundred kilobytes—completely bypassing the 16MB storage constraint.

### Key Innovations

- **The Epigenetic Layer (`EdenLayer`):** Replaces standard `nn.Linear` layers. Expands a hardcoded seed into a massive, static base matrix, while only saving a tiny `~1KB` vector of learnable mixing coefficients.
- **Zero-Vocab Tokenization:** Bypasses bloated 5MB vocabulary tables by utilizing a raw UTF-8 Byte-Level Tokenizer. The model learns language directly from the 256 atomic bytes.
- **RAM-Disk Pipeline:** Uses `np.memmap` to stream raw binary training data directly from the SSD with zero latency, ensuring the GPUs are never starved during the 10-minute training window.
- **Native `val_bpb` Calculation:** Because the tokens _are_ bytes, standard cross-entropy loss cleanly converts to Validation Bits-Per-Byte (`loss / ln(2)`), providing mathematically pure scoring.

## Quickstart

This repository contains the monolithic `train_gpt.py` script required to reproduce the EDEN architecture.

### Prerequisites

- PyTorch 2.0+
- NumPy
- _Hardware:_ Apple Silicon (MPS) for local testing, or NVIDIA GPU (CUDA) for production scaling.
- Running Sphereon GPUs during testing on singular H100 for model validity and performance https://www.spheron.network/pricing/

### Run the Sandbox

1. Clone the repository.
2. Run the master script to initialize the dummy data, map it to memory, and begin the epigenetic training loop:

```bash
python train_gpt.py
```

### IMPORTANT NOTE:

- This is a BETA model being tested. All are welcome, but caveat emptor. Use at your own risk.
