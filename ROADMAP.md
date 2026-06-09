# The Objective Roadmap

To succeed, we cannot just build cool technology in a vacuum; we have to validate the core assumptions and make sure we are solving a real problem before we spend time building dashboards.

---

## Phase 1: Prove the Amoeba Protocol (Current)

We don't scale the hardware or the datasets until the core routing logic proves its worth. The static `eden-folds` baseline is currently sitting at a 1.68 cross-entropy loss. Amoeba must unequivocally crush this.

* **The Task:** We inject a decay mechanism into the `chromatin_gate`. If a fold reduces loss, its weight pathway strengthens. If it doesn't, it decays.

* **The Execution:** We run a strict A/B test. We pit the current 1.68 `eden-folds` baseline against an `eden-amoeba` branch using the exact same 232MB dataset.

* **The Milestone:** The Amoeba routing must break the **1.60 barrier** and prove a trajectory toward the **1.50 gate** on the same exact data. If it plateaus at 1.7x, the protocol is rejected.

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

We keep it iterative. We draft the Amoeba logic, push it to a new branch, and run the A/B test while your current H100 run finishes its baseline.

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
