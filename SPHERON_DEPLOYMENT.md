# Project EDEN: Spheron GPU Deployment Guide

This document maps out the end-to-end execution pipeline for spinning up a high-performance dedicated GPU instance (like an NVIDIA H100) on Spheron AI, configuring access, syncing code, and executing the Project EDEN pre-training Docker runtime.

## Phase 1: Security Handshake & Architecture Lock-In

### 1. Generate an Access Key

Before launching an instance, your local MacBook must have a secure cryptographic identity to handshake with the remote cloud cluster. Run this command in your local terminal:

```bash
ssh-keygen -t ed25519 -a 100 -f ~/.ssh/project_eden_spheron_ed25519 -C "project-eden-spheron"
```

Prompt Actions: Use a strong passphrase and load the key into `ssh-agent` for automation instead of creating an unencrypted private key. Keep this key dedicated to the Spheron instance so it can be rotated or revoked without affecting personal GitHub or workstation access.

### 2. Copy the Public Padlock

Extract your public key string directly to your clipboard:

```bash
pbcopy < ~/.ssh/project_eden_spheron_ed25519.pub
```

Never share, commit, paste, or copy the accompanying private key file. Keep its permissions locked down:

```bash
chmod 600 ~/.ssh/project_eden_spheron_ed25519
```

### 3. Provision the Spheron Instance

Log in to the Spheron Dashboard.

Select Dedicated Instances (Guaranteed runtime prevents unexpected cluster termination).

Choose Spheron AI as the provider and select your hardware (e.g., 1x H100 PCIe or higher-tier parallel GPU configs).

Crucial Operating System Choice: Select Ubuntu Server 24.04 LTS R570 CUDA 12.8 with Docker. This pre-injects the required NVIDIA Container Toolkit and host kernel drivers, saving hours of manual driver compilation.

Paste your copied public SSH key into the attached key layout to clear the configuration warning and activate the blue Deploy Instance button.

Note on Storage: Always run Project EDEN from the attached persistent volume, not from `/home/ubuntu`, `/`, or any ephemeral mount. For the current dev node, the canonical project root is:

```text
/mnt/project-eden-test-v2-cnd/project-eden
```

That path is a symlink into the attached provider-mounted volume. Do not commit provider-assigned mount IDs, public IPs, or firewall rules to the public repository:

```text
/mnt/project-eden-test-v2-cnd -> /mnt/volume_PROVIDER_ID/project-eden-test-v2-cnd
```

## Phase 2: Persistent Storage Setup

Persistent storage identity:

```text
Name: project-eden-test-v2-cnd
Size: 50GB
Canonical project path: /mnt/project-eden-test-v2-cnd/project-eden
```

The current Spheron H100 node exposed a layout like this:

```text
NAME    MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS
vda     253:0    0  100G  0 disk
├─vda1  253:1    0   99G  0 part /
├─vda14 253:14   0    4M  0 part
├─vda15 253:15   0  106M  0 part /boot/efi
└─vda16 259:0    0  913M  0 part /boot
vdb     253:16   0  750G  0 disk /mnt/volume
                                 /ephemeral
vdc     253:32   0   50G  0 disk /mnt/volume
                                 /mnt/volume_PROVIDER_ID
```

On this node, `/dev/vdb` is the 750GB ephemeral instance disk. The EDEN persistent storage is the 50GB `/dev/vdc` device mounted through the provider-assigned persistent volume mount.

### First Attach Mount Instructions

Use these only when attaching a fresh persistent volume for the first time. When reattaching an existing `project-eden-test-v2-cnd` volume, skip the format step and mount the existing filesystem instead.

1. Identify the attached device:

```bash
lsblk
```

Look for the 50GB persistent storage device. On the current node, the persistent 50GB volume appeared as `/dev/vdc`; `/dev/vdb` was the 750GB ephemeral disk. Provider examples may show `/dev/vdb`; do not assume that device name is correct without checking `lsblk`.

1. Format the volume, first attach only:

🚨🚨🚨 DANGER: `mkfs.ext4` destroys the filesystem on the target device. Do not run this on a reattached persistent volume, and do not run it until `lsblk` confirms the target is the empty 50GB `project-eden-test-v2-cnd` storage device. On this node, that device is `/dev/vdc`; `/dev/vdb` is ephemeral. Running this against the wrong device can wipe datasets, checkpoints, or the OS disk.

```bash
# FIRST ATTACH ONLY. Replace /dev/vdc if lsblk shows a different 50GB persistent device.
sudo mkfs.ext4 /dev/vdc
```

1. Create the mount point:

```bash
sudo mkdir -p /mnt/volume
```

1. Mount the volume:

```bash
# Replace /dev/vdc if lsblk shows a different persistent device.
sudo mount /dev/vdc /mnt/volume
```

After mounting, create the EDEN project path and symlink described below.

Initialize the durable EDEN workspace once per fresh node:

```bash
export EDEN_VOLUME_MOUNT=/mnt/volume_PROVIDER_ID
sudo chown -R ubuntu:ubuntu "$EDEN_VOLUME_MOUNT"
mkdir -p "$EDEN_VOLUME_MOUNT/project-eden-test-v2-cnd"
sudo ln -sfn "$EDEN_VOLUME_MOUNT/project-eden-test-v2-cnd" /mnt/project-eden-test-v2-cnd
mkdir -p /mnt/project-eden-test-v2-cnd/project-eden/logs
```

Archive any old MVP1 files from the home directory before syncing the new branch. This keeps prior artifacts available and prevents accidental overwrite by new Amoeba files:

```bash
mkdir -p /mnt/project-eden-test-v2-cnd/archive-mvp1
mv ~/*.py ~/*.txt ~/*.pt ~/Dockerfile /mnt/project-eden-test-v2-cnd/archive-mvp1/ 2>/dev/null || true
```

After this point, all commands should run from:

```bash
cd /mnt/project-eden-test-v2-cnd/project-eden
```

Expected durable outputs:

```text
/mnt/project-eden-test-v2-cnd/project-eden/fineweb.bin
/mnt/project-eden-test-v2-cnd/project-eden/eden_artifact.pt
/mnt/project-eden-test-v2-cnd/project-eden/eden_artifact_chat.pt
/mnt/project-eden-test-v2-cnd/project-eden/logs/
/mnt/project-eden-test-v2-cnd/archive-mvp1/
```

## Phase 3: Database Firewall Whitelisting

Project EDEN streams sub-second hardware telemetry and validation Bits-Per-Byte (val_bpb) metrics to a serverless Azure SQL database via asynchronous thread pools.

Once the Spheron instance status switches to Active, copy its assigned public IP Address.

Navigate to your Azure Portal -> SQL Server configuration.

Go to Networking / Firewalls.

Add a temporary, least-privilege firewall rule using the Spheron instance IP in both the Start IP and End IP fields. Treat public IPs and rule names as operational details: do not commit the actual values to public docs, issues, screenshots, or logs.

Save changes. Failing to update this whitelist will cause the pyodbc driver inside the container to hang or throw authentication rejections on step zero. Remove or rotate the rule after the training window closes.

## Phase 4: Code Transport Protocol

Because local Docker configurations on Apple Silicon cannot natively pass through host resources to a guest Linux VM, code must be built natively on the remote host.

### 1. Authenticate with the Cloud Node

Open a terminal on your Mac and initiate the secure shell handshake using the instance username (ubuntu or root) provided by Spheron:

```bash
ssh -i ~/.ssh/project_eden_spheron_ed25519 ubuntu@YOUR_SPHERON_IP
```

Verify the host fingerprint against the provider console before accepting the prompt. Do not blindly type `yes` for a new host key on a public network.

### 2. Push Code Assets via SCP

Open a new tab in your local Mac terminal, navigate to your local GitHub repository path, and run scp to copy your architecture directory directly over the wire, skipping bulky local virtual environments:

```bash
cd ~/Github/project-eden
ssh -i ~/.ssh/project_eden_spheron_ed25519 ubuntu@YOUR_SPHERON_IP "mkdir -p /mnt/project-eden-test-v2-cnd/project-eden"
scp -i ~/.ssh/project_eden_spheron_ed25519 -r Dockerfile requirements.txt *.py *.md ubuntu@YOUR_SPHERON_IP:/mnt/project-eden-test-v2-cnd/project-eden/
scp -i ~/.ssh/project_eden_spheron_ed25519 fineweb.bin ubuntu@YOUR_SPHERON_IP:/mnt/project-eden-test-v2-cnd/project-eden/fineweb.bin
```

## Phase 5: Container Build & Runtime Launch

Switch back to your remote Spheron terminal window. Verify that Docker is healthy (docker --version).

### 1. Native Image Compilation

Run the build engine. This downloads the optimized NVIDIA CUDA foundation base layer, installs the Microsoft ODBC SQL Driver 18 infrastructure, pulls your project dependencies (datasets, pyodbc, numpy, tokenizers), and automatically processes the 1M Sample FineWeb dataset pre-compilation pipeline completely inside the image layers:

```bash
cd /mnt/project-eden-test-v2-cnd/project-eden
set -o pipefail
mkdir -p logs
docker build -t project-eden:v2-amoeba .
```

Verification smoke:

Before spending H100 time, run the CPU-only checkpoint smoke. It validates wrapped checkpoints, legacy bare state dicts, 1-fold and 4-fold reconstruction, non-persistent DNA buffers, and the 16MB artifact limit:

```bash
docker run --rm \
  -v /mnt/project-eden-test-v2-cnd/project-eden:/workspace \
  project-eden:v2-amoeba python smoke_checkpoint_contract.py
```

Confirm the mounted FineWeb corpus is the real A/B corpus before training:

```bash
python3 - <<'PY'
from pathlib import Path

p = Path("/mnt/project-eden-test-v2-cnd/project-eden/fineweb.bin")
size = p.stat().st_size if p.exists() else 0
print(f"fineweb.bin: {size:,} bytes")
assert size >= 220_000_000, "fineweb.bin missing or too small"
PY
```

Hopper launch:

Unleash the container into the GPU stack. The --gpus all flag exposes the raw physical graphics hardware directly to the underlying PyTorch execution loop:

```bash
docker run --gpus all --rm \
  -v /mnt/project-eden-test-v2-cnd/project-eden:/workspace \
  -e AZURE_SQL_CONNECTION_STRING="${AZURE_SQL_CONNECTION_STRING:?set locally, do not commit}" \
  -e EDEN_FINEWEB_MIN_BYTES=220000000 \
  -e EDEN_PROTOCOL=eden-amoeba \
  project-eden:v2-amoeba python train_gpt.py 2>&1 | tee "logs/eden-amoeba-$(date +%Y%m%d-%H%M%S).log"
```

For strict pre-training-only A/B runs, launch each protocol directly against the same mounted `fineweb.bin`:

```bash
docker run --gpus all --rm \
  -v /mnt/project-eden-test-v2-cnd/project-eden:/workspace \
  -e AZURE_SQL_CONNECTION_STRING="${AZURE_SQL_CONNECTION_STRING:?set locally, do not commit}" \
  -e EDEN_FINEWEB_MIN_BYTES=220000000 \
  -e EDEN_PROTOCOL=eden-folds \
  project-eden:v2-amoeba python train_gpt.py 2>&1 | tee "logs/eden-folds-$(date +%Y%m%d-%H%M%S).log"

docker run --gpus all --rm \
  -v /mnt/project-eden-test-v2-cnd/project-eden:/workspace \
  -e AZURE_SQL_CONNECTION_STRING="${AZURE_SQL_CONNECTION_STRING:?set locally, do not commit}" \
  -e EDEN_FINEWEB_MIN_BYTES=220000000 \
  -e EDEN_PROTOCOL=eden-amoeba \
  project-eden:v2-amoeba python train_gpt.py 2>&1 | tee "logs/eden-amoeba-$(date +%Y%m%d-%H%M%S).log"
```

Important: `EDEN_PROTOCOL` labels the run metadata. On the Amoeba branch it does not disable Amoeba routing. Use a true static-fold branch or artifact for a clean `eden-folds` baseline.
