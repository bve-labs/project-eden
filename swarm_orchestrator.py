"""
Project EDEN Swarm Alpha Orchestrator.

Native Karpathy-style micro-window runner for Phase 1.5 Neuroplasticity.
It mutates Hebbian routing hyperparameters, executes train_gpt.py, and resolves
the mutation via Git based on exit code. train_gpt.py owns Azure SQL telemetry.
"""
import argparse
import json
import math
import os
import random
import subprocess
import sys
import uuid
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent
CONFIG_PATH = REPO_ROOT / "swarm_config.json"
RUN_LOG_DIR = REPO_ROOT / "training_output" / "swarm_runs"
DEFAULT_BASELINE = 1.6886

AGENTS = {
    "alpha": "Swarm_Alpha_Biologist",
    "beta": "Swarm_Beta_Synthesizer",
}


def mutate_config(agent_key, rng):
    decay_penalty = math.exp(rng.uniform(math.log(0.001), math.log(0.1)))
    growth_reward = math.exp(rng.uniform(math.log(0.01), math.log(0.2)))

    # Beta stays inside the same train_gpt.py contract but explores gentler growth.
    if agent_key == "beta":
        growth_reward *= 0.75

    return {
        "max_iters": 1000,
        "decay_penalty": round(decay_penalty, 6),
        "growth_reward": round(growth_reward, 6),
        "target_baseline": DEFAULT_BASELINE,
    }


def write_config(config):
    CONFIG_PATH.write_text(json.dumps(config, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def run_training(run_id, agent_id, dry_run):
    if dry_run:
        print(f"[dry-run] Would execute train_gpt.py for run_id={run_id}, agent_id={agent_id}")
        return 0, "[dry-run] training skipped\n", ""

    env = os.environ.copy()
    env["EDEN_RUN_ID"] = run_id
    env["EDEN_AGENT_ID"] = agent_id
    env["EDEN_SWARM_CONFIG"] = str(CONFIG_PATH)

    completed = subprocess.run(
        [sys.executable, "train_gpt.py"],
        cwd=REPO_ROOT,
        env=env,
        text=True,
        capture_output=True,
        check=False,
    )
    RUN_LOG_DIR.mkdir(parents=True, exist_ok=True)
    (RUN_LOG_DIR / f"{run_id}.log").write_text(
        completed.stdout + "\n--- STDERR ---\n" + completed.stderr,
        encoding="utf-8",
    )
    return completed.returncode, completed.stdout, completed.stderr


def git_success_resolution(dry_run):
    commands = [
        ["git", "add", "."],
        ["git", "commit", "-m", "Swarm: Neuroplasticity improvement"],
    ]
    for command in commands:
        if dry_run:
            print(f"[dry-run] Would run: {' '.join(command)}")
            continue
        subprocess.run(command, cwd=REPO_ROOT, check=True)


def git_failure_resolution(dry_run):
    commands = [
        ["git", "reset", "--hard"],
        ["git", "clean", "-fd"],
    ]
    for command in commands:
        if dry_run:
            print(f"[dry-run] Would run: {' '.join(command)}")
            continue
        subprocess.run(command, cwd=REPO_ROOT, check=True)


def run_one(agent_key, rng, dry_run):
    agent_id = AGENTS[agent_key]
    run_id = uuid.uuid4().hex[:12]
    config = mutate_config(agent_key, rng)
    write_config(config)

    print(f"\n=== {agent_id} | run_id={run_id} ===")
    print(json.dumps(config, indent=2, sort_keys=True))

    exit_code, stdout, stderr = run_training(run_id, agent_id, dry_run)

    if stdout:
        print(stdout[-4000:])
    if stderr:
        print(stderr[-4000:], file=sys.stderr)

    if exit_code == 0:
        git_success_resolution(dry_run)
        resolution = "would be committed" if dry_run else "was committed"
        print(f"Swarm run {run_id} succeeded and {resolution}.")
    elif exit_code == 1:
        git_failure_resolution(dry_run)
        resolution = "would be reverted" if dry_run else "was reverted"
        print(f"Swarm run {run_id} failed the baseline and {resolution}.")
    else:
        git_failure_resolution(dry_run)
        resolution = "would be reverted" if dry_run else "was reverted"
        print(f"Swarm run {run_id} crashed with exit code {exit_code} and {resolution}.")

    return exit_code


def main():
    parser = argparse.ArgumentParser(description="Run Project EDEN Neuroplasticity swarm windows.")
    parser.add_argument("--agent", choices=sorted(AGENTS), default="alpha")
    parser.add_argument("--runs", type=int, default=1)
    parser.add_argument("--seed", type=int, default=None)
    parser.add_argument("--dry-run", action="store_true", help="Generate config and print actions without training or Git changes.")
    args = parser.parse_args()

    rng = random.Random(args.seed)
    exit_codes = []

    for _ in range(args.runs):
        exit_codes.append(run_one(args.agent, rng, args.dry_run))

    return 0 if all(code == 0 for code in exit_codes) else 1


if __name__ == "__main__":
    sys.exit(main())
