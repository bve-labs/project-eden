# Project EDEN: Mutation & Git Changelog

This ledger tracks all manual architectural shifts, hyperparameter adjustments, and autonomous agent interventions. Every deployment checkpoint must map cleanly back to an explicit branch configuration.

---

## [2026-06-08] - Branch: feat/eden-folds (Active Pre-Training)

* **Status:** In-Progress Baseline Run (Passed Step 16,650+).
* **Architectural Delta:** Migrated from a 1D scalar mixing vector to an 8-layer `EdenFoldLayer` MoE matrix. Optimized the heavy contraction path by breaking the single `torch.einsum` allocation into a two-step sequence (`bti -> btfo -> bto`), successfully eliminating the 192GB allocation bottleneck.
* **Telemetry Control:** Target loss floor shifted to 1.5 - 1.7. Tracked via Azure SQL under Run ID: `7d68697de8e1`.

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
  