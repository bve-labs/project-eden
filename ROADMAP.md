# Project EDEN: Master Context Summary (MCS)

This document serves as the comprehensive architectural blueprint, infrastructure overview, and operational summary for **Project EDEN (Epigenetic Data Encoding Network)**. It captures the engineering decisions, technical stack, and data paradigms established for development, benchmarking, website write-ups, or technical blogging.

---

## 1. The Core Architectural Innovation

Project EDEN is a highly constrained language model framework designed to fit strictly under a **16MB hardware footprint limit**. It completely re-imagines how neural network weights are handled by introducing an **Epigenetic Implicit Neural Representation**:

* **The Genome (Fixed DNA):** Instead of storing massive weight matrices on a storage drive, the model utilizes fixed, deterministic random seeds to instantiate large pseudo-random weight buffers (`base_weight`) directly inside VRAM at initialization. These base weights are frozen (`requires_grad=False`) and are never saved to disk.

* **The Epigenome (Chromatin Routing):** The only parameters the model trains and saves are ultra-lean fold gates (`chromatin_gate`), fold-level `mixing_coeffs`, and standard biases. During the forward pass, `EdenFoldLayer` routes each byte context across fixed pseudo-random DNA folds with `torch.einsum`.

* **The Result:** The model achieves extreme compression. A completed local pre-training run yields a final saved checkpoint (`eden_artifact.pt`) of just **2,805.87 KB (roughly 2.8 MB)**. This easily satisfies the strict 16MB threshold while preserving an active working expression of 709,921 parameters.

---

## 2. The Data & Tokenization Pipeline

To maximize computational efficiency and bypass structural bloat, the data layer eliminates vocabulary layers and tokenization overhead:

* **Zero-Vocab Byte Tokenizer:** The architecture does not use traditional tokenizers (like SentencePiece or Tiktoken). It implements a literal **ByteTokenizer** where the vocabulary size is fixed exactly at **256** (representing the raw integer values of UTF-8 encoded bytes from 0 to 255). The tokenizer file footprint is exactly 0 bytes.

* **Zero-Latency Data Fetching:** The dataset pipeline utilizes a memory-mapped binary array (`np.memmap`) via the `EdenByteDataset` class. This enables non-blocking, zero-latency streaming of raw byte sequences straight from disk storage into memory.

* **Current Slice:** For initial evaluation and correctness testing, the training pipeline uses an isolated local text corpus ("The Independent Jane") compiled into a raw binary stream (`fineweb.bin`).

* OLD MODEL
* **The Result:** The model achieves extreme compression. A completed local pre-training run yields a final saved checkpoint (`eden_artifact.pt`) of just **2,805.87 KB (roughly 2.8 MB)**. This easily satisfies the strict 16MB threshold while preserving an active working expression of 709,921 parameters.

---

## 3. The Telemetry & Infrastructure Stack

The logging engine is engineered to support distributed cloud scaling natively, avoiding the network latency bottlenecks common to edge training loops:

* **Asynchronous Logging Engine:** Built with a thread-isolated Python design, database operations are decoupled from execution. Telemetry data payloads (`run_id`, `step`, `loss`, `val_bpb`, `step_time`) are pushed to a background `ThreadPoolExecutor`. This allows the primary GPU training loop on Apple Silicon (`device: mps`) to process subsequent tensor batches continuously without idling for database acknowledgments.

* **Serverless Azure SQL Database:** The persistence layer is hosted via a **Serverless Azure SQL instance** deployed in the **Central US region** to maintain low-latency, round-trip times from Florida development environments. It leverages an auto-pausing free allowance tier capped safely via a hard infrastructure ceiling (**Overage billing: Disabled**) to eliminate unexpected cloud bill scaling.

* **Production Portability & Environment:**
* **Local Mac Stack:** Powered by Apple Silicon hardware utilizing Homebrew-backed database management drivers (`unixodbc` and `msodbcsql18`) connected directly to Cursor IDE using a streamlined Node.js database client extension to bypass heavy local virtual machine dependencies.
* **Cloud Docker Stack:** The container build (`Dockerfile`) combines optimized `nvidia/cuda` image bases with explicit upstream Microsoft package keys. This builds the runtime dependencies (`msodbcsql18` and `unixodbc-dev`) straight into the deployment layer, guaranteeing zero-configuration environment portability when spinning up headless nodes across alternative decentralized or traditional clouds (e.g., Spheron).

---

## 4. Operational Metrics & Conversational Roadmap

* **Pre-Training Verifiability:** To evaluate learning capability, cross-entropy validation loss is continuously transformed into a normalized **Validation Bits-Per-Byte (val_bpb)** score ($val\_bpb = \frac{loss}{\ln(2)}$). Local training logs document structural convergence, with loss scaling down cleanly from an initial **5.75** down to **2.70**, and $val\_bpb$ stabilizing below **3.90**.

* **Downstream Chat-Instruction Plan:** Because the model lacks structural token slots for distinct prompt markers, conversation engineering relies on raw ASCII markers injected into the raw byte-stream text layout (`<|USER|>\n...\n<|BOT|>\n...\n<|END|>`). The updated inference configuration (`generate.py`) enforces sliding multi-byte sequence checks to stream decoded UTF-8 string data directly to standard output, terminating dynamically the instant the sliding tracking array identifies the literal trailing byte values of the closing `<|END|>` delimiter.