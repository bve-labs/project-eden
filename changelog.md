# Project EDEN: Mutation & Git Changelog

This ledger tracks all manual architectural shifts, hyperparameter adjustments, and autonomous agent interventions. Every deployment checkpoint must map cleanly back to an explicit branch configuration.

---

## [2026-06-09] - Branch: feat/amoeba-routing (Markdown Security Updates)

* **Status:** Security updates made to `SPHERON_DEPLOYMENT.md` with the date 2026-06-09.
* **Status:** Security updates made to `project-eden-mcs.md` with the date 2026-06-09.
* **Status:** Security updates made to `README.md` with the date 2026-06-09.
* **Status:** Security updates made to `planupdates.md` with the date 2026-06-09.
* **Status:** Security updates made to `changelog.md` with the date 2026-06-09.
* **Security Delta:** Removed public operational identifiers from Markdown docs, replaced weak SSH guidance, and made secret-bearing Docker examples reference local environment variables instead of committed values.

---

## [2026-06-09] - Branch: feat/amoeba-routing (Persistent Device Clarification)

* **Status:** Clarifying the Spheron device map for the active dev node.
* **Architectural Delta:** Marking `/dev/vdb` as the 750GB ephemeral instance disk and `/dev/vdc` as the 50GB `project-eden-test-v2-cnd` persistent volume in `SPHERON_DEPLOYMENT.md`.
* **Engineering Intent:** Prevent accidental formatting or mounting of the ephemeral disk when preparing the durable EDEN workspace.

---

## [2026-06-09] - Branch: feat/amoeba-routing (Persistent Volume First-Attach Notes)

* **Status:** Adding first-attach storage instructions for the Spheron dev volume.
* **Architectural Delta:** Documenting the `project-eden-test-v2-cnd` persistent storage name, 50GB size, `lsblk` verification, mount commands, and the destructive nature of `mkfs.ext4`.
* **Engineering Intent:** Prevent accidental formatting of an existing persistent EDEN volume while keeping fresh-node setup repeatable.

---

## [2026-06-09] - Branch: feat/amoeba-routing (Spheron Persistent Storage)

* **Status:** Documenting the active Spheron persistent-volume layout for dev testing.
* **Architectural Delta:** Updating `SPHERON_DEPLOYMENT.md` with the provider-assigned persistent backing store, `/mnt/project-eden-test-v2-cnd` symlink, MVP1 archive step, and direct Docker launch path mounted from persistent storage.
* **Engineering Intent:** Ensure new Amoeba checkpoints, datasets, and logs are written to the durable project volume instead of ephemeral home or root disk locations.

---

## [2026-06-09] - Branch: feat/amoeba-routing (Pipeline Removal)

* **Status:** Retiring the legacy pipeline runner after reviewing whether it improves the current A/B workflow.
* **Architectural Delta:** Removing `run_pipeline.sh` as a supported launch surface and documenting explicit smoke, build, pre-training, and chat fine-tuning commands instead.
* **Engineering Intent:** Reduce operational ambiguity before H100 runs. The script did not accelerate training and added a second path that could drift from the strict `eden-folds` / `eden-amoeba` comparison contract.

---

## [2026-06-09] - Branch: feat/amoeba-routing (Pipeline Safety Review)

* **Status:** Hardening the legacy pipeline runner after reviewing it against the current checkpoint, dataset, and A/B flow.
* **Architectural Delta:** Adding repository-root resolution, host dataset preflight, optional checkpoint smoke validation, explicit pre-training/chat protocol separation, and a chat-run toggle to `run_pipeline.sh`.
* **Engineering Intent:** Prevent stale container mounts, hidden Docker build artifacts, dummy-data runs, and mislabeled chat fine-tuning from corrupting Phase 1 A/B results.

---

## [2026-06-09] - Branch: feat/amoeba-routing (Docs Alignment)

* **Status:** Updating user-facing documentation after the Amoeba routing implementation pass.
* **Architectural Delta:** Aligning the roadmap, master context, README, and deployment commands with the wrapped checkpoint contract, loss-aware Amoeba vitality, real-dataset guardrails, semantic Docker tags, and checkpoint smoke verification.
* **Engineering Intent:** Make the next A/B run reproducible from the docs before spending H100 time on `eden-amoeba` validation.

---

## [2026-06-09] - Branch: feat/amoeba-routing (Checkpoint Verification Smokes)

* **Status:** Adding lightweight local verification for the wrapped checkpoint contract before long H100 runs.
* **Architectural Delta:** Introducing a standalone smoke script that validates wrapped and legacy checkpoint reloads, 1-fold and 4-fold reconstruction, non-persistent DNA buffers, and artifact size guardrails.
* **Engineering Intent:** Catch checkpoint topology, persistence, and file-size regressions locally before spending compute on Amoeba A/B training.

---

## [2026-06-09] - Branch: feat/amoeba-routing (A/B Preflight)

* **Status:** Hardening strict A/B execution before the next H100 run.
* **Architectural Delta:** Adding explicit protocol run labeling, real `fineweb.bin` dataset-size guardrails, and semantic Docker image tag controls for the Amoeba pipeline.
* **Engineering Intent:** Prevent accidental dummy-data or `:latest` container runs so `eden-folds` and `eden-amoeba` measurements stay attributable to the same corpus, hyperparameters, and image lineage.

---

## [2026-06-09] - Branch: feat/amoeba-routing (Loss-Aware Vitality)

* **Status:** Implementing loss-improvement feedback for Amoeba fold vitality.
* **Architectural Delta:** Moving `fold_vitality` mutation out of the forward pass and into an explicit post-batch training-loop update that reinforces recently used folds only when loss improves against an EMA baseline.
* **Engineering Intent:** Preserve the proven two-step folded `einsum` routing path while making pathway decay/reinforcement depend on training signal instead of raw fold utilization alone.

---

## [2026-06-09] - Branch: feat/amoeba-routing (Reader/Writer Sync)

* **Status:** Synchronizing checkpoint readers and writers across pre-training, generation, and chat fine-tuning.
* **Architectural Delta:** Centralizing EDEN artifact load/save semantics in `train_gpt.py`, including wrapped checkpoints, current bare 4-fold state dictionaries, and legacy single-fold state dictionaries.
* **Engineering Intent:** Ensure `eden_artifact.pt` and `eden_artifact_chat.pt` can be reconstructed from their own topology metadata while generation and chat fine-tuning consume the same compatibility path.

---

## [2026-06-09] - Branch: feat/amoeba-routing (Checkpoint Contract)

* **Status:** Implementing self-describing checkpoint compatibility for Phase 1 Amoeba routing.
* **Architectural Delta:** `eden_artifact.pt` and chat artifacts will save a compact metadata wrapper containing `model_state`, exact model `config`, and training `metrics` instead of a bare `state_dict`.
* **Engineering Intent:** Allow generation and chat fine-tuning to reconstruct 1-fold, 4-fold, and future routed topologies from the artifact itself while still loading legacy bare checkpoints by inferring tensor shapes where possible.

---

## [2026-06-09] - Branch: feat/amoeba-routing (Pre-Implementation Hygiene)

* **Status:** Branch hygiene completed before the next Amoeba routing mutation pass.
* **Architectural Delta:** Preparing to replace bare checkpoint serialization with a metadata-wrapped artifact contract (`model_state`, `config`, `metrics`) and shared dynamic loading across pre-training, chat fine-tuning, and generation while keeping deterministic DNA buffers non-persistent.
* **Routing Intent:** Preserve the proven two-step folded projection path while moving `fold_vitality` toward loss-aware Amoeba reinforcement/decay so pathways that help lower loss strengthen and stale routes decay without bloating the checkpoint.
* **A/B Intent:** Keep Phase 1 measurements tied to the real 232MB `fineweb.bin`, fixed `eden-folds` hyperparameters, and explicit `eden-amoeba` run metadata so any improvement beyond the static ~1.68 loss floor can be attributed cleanly.

---

## [2026-06-08] - Branch: feat/amoeba-routing (Amoeba Protocol)

* **Status:** Implementing Phase 1 Routing Mutation.
* **Architectural Delta:** Upgrading `EdenFoldLayer` with a non-persistent `fold_vitality` EMA buffer and `decay_rate` control. The chromatin gate probabilities will be scaled by recent fold utilization, then renormalized before projection weighting so routing remains probabilistic while unused pathways decay.
* **Engineering Intent:** Preserve checkpoint compactness and PyTorch autograd safety while testing whether slime-mold decay routing can beat the static `eden-folds` baseline on the same 232MB dataset.

---

## [2026-06-08] - Branch: feat/eden-folds (Active Pre-Training)

* **Status:** In-Progress Baseline Run (Passed Step 16,650+).
* **Architectural Delta:** Migrated from a 1D scalar mixing vector to an 8-layer `EdenFoldLayer` MoE matrix. Optimized the heavy contraction path by breaking the single `torch.einsum` allocation into a two-step sequence (`bti -> btfo -> bto`), successfully eliminating the 192GB allocation bottleneck.
* **Telemetry Control:** Target loss floor shifted to 1.5 - 1.7. Tracked via Azure SQL under a run-specific identifier that should remain out of public docs.

---

## [Staging] - Branch: feat/eden-amoeba

* **Status:** Draft Spec / Staged
* **Architectural Delta:** Injecting non-persistent EMA buffer `fold_vitality` (decay rate: 0.99) into the chromatin gate routing layer. Intended to dynamically scale fold selection probabilities based on historical selection runtime arrays.

---

## [Staging] - Branch: feat/eden-neuroplasticity

* **Status:** Draft Spec / Staged
* **Architectural Delta:** Integrating Hebbian learning mechanics via an EMA-backed `pathway_strength` routing bias matrix. Implements an explicit mathematical gradient energy cost to resurrect underutilized or dormant DNA weight folds.

---

## [2026-06-08] - Branch: feat/eden-folds (Active Pre-Training Milestone)

* **Event:** Breaking the 1.80 Loss Barrier on H100 PCIe.
* **Telemetry Highlights (Step 23,000 - 23,550):**
  * `Step 23210` | Loss: 1.7966 | val_bpb: 2.5919
  * `Step 23420` | Loss: 1.7960 | val_bpb: 2.5910
  * `Step 23540` | Loss: 1.7953 | val_bpb: 2.5901 (Current Absolute Floor)
* **Architectural Validation:** The 8-layer Chromatin MoE matrix has officially surpassed the MVP 1.0 foundational baseline (which bottomed at 1.89 loss / 2.72 val_bpb over 50k steps). By breaking 1.7953 at only step 23,540, the spatial routing mechanism is proving that deterministic multi-fold data ingestion fundamentally outperforms static, single-vector scaling without increasing the 16MB file footprint.
* **Hardware Stability:** Processing cadence remains locked at a flat 10.56s per 10-steps. Azure SQL telemetry offloading is successfully handling high-frequency writes via the decoupled `ThreadPoolExecutor` with zero compute bottlenecks.

### [2026-06-08] - Branch: feat/eden-folds (The Sub-1.70 Breakthrough)

* **Event:** Epigenetic INR matrix officially breaches the 1.70 threshold.
* **Telemetry Highlight:** `Step 38680` | Loss: 1.6886 | val_bpb: 2.4362 | Time: 10.56s
* **Architectural Note:** At nearly 39,000 steps, the model continues to find deep syntactic routing efficiencies without any parameter bloat or disk expansion. The static multi-fold ingestion is vastly outperforming traditional single-vector architectures, proving the baseline viability of the VRAM-generated deterministic "Genome" framework.

---

## [2026-06-08] - Branch: feat/eden-folds (Telemetry & Command Surface)

* **Status:** Deployed / Wired
* **Dashboard (`apps/project-eden-dash`):**
  * `GET /api/telemetry` — pooled `mssql` connection to Azure SQL `training_logs`; returns latest KPI row + per-run history series for Recharts convergence graph.
  * `POST /api/revalidate` — authenticated on-demand ISR trigger (`REVALIDATION_TOKEN`); forces static rebuild of `/` without draining the serverless SQL pool on every page visit.
  * `app/page.tsx` split into server-rendered telemetry loader + `CommandCenter` client component (glassmorphism UI, live loss / val_bpb / step time).
* **Pipeline Hook:** `train_gpt.py` and `train_chat.py` call `/api/revalidate` after `log_executor.shutdown(wait=True)`; `run_pipeline.sh` passes `EDEN_DASHBOARD_REVALIDATE_URL` and `REVALIDATION_TOKEN` into Docker containers.
* **Landing Page (`bvelabs.com/project-eden`):**
  * Route added to `bvelabs-site-v4` at `app/project-eden/page.tsx`.
  * `.eden-theme` CSS scope swaps BVE Labs orange accent for icy cyan `oklch(0.72 0.18 215)` — bridges the dark engineering aesthetic to the glassmorphism dashboard palette.
  * Split-pane hero: left clinical copy + protocol milestones; right Command Terminal card with live telemetry status rows and CTA to `project-eden-dash.vercel.app`.
* **Required Env Vars:**
  * Vercel dashboard: `AZURE_SQL_CONNECTION_STRING`, `REVALIDATION_TOKEN`
  * Training container: `EDEN_DASHBOARD_REVALIDATE_URL`, `REVALIDATION_TOKEN`
  