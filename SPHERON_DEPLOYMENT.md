Project EDEN: Spheron GPU Deployment Guide
This document maps out the end-to-end execution pipeline for spinning up a high-performance dedicated GPU instance (like an NVIDIA H100) on Spheron AI, configuring access, syncing code, and executing the Project EDEN pre-training Docker runtime.

Phase 1: Security Handshake & Architecture Lock-In
1. Generate an Access Key
Before launching an instance, your local MacBook must have a secure cryptographic identity to handshake with the remote cloud cluster. Run this command in your local terminal:

ssh-keygen -t ed25519 -C "eden-h100-key"

Prompt Actions: Press Enter to accept the default storage location (~/.ssh/id_ed25519). Press Enter twice more to leave the passphrase empty for seamless terminal automations.

2. Copy the Public Padlock
Extract your public key string directly to your clipboard:

Bash
pbcopy < ~/.ssh/id_ed25519.pub

(Never share the accompanying private file id_ed25519—it remains permanently on your MacBook).

3. Provision the Spheron Instance
Log in to the Spheron Dashboard.

Select Dedicated Instances (Guaranteed runtime prevents unexpected cluster termination).

Choose Spheron AI as the provider and select your hardware (e.g., 1x H100 PCIe or higher-tier parallel GPU configs).

Crucial Operating System Choice: Select Ubuntu Server 24.04 LTS R570 CUDA 12.8 with Docker. This pre-injects the required NVIDIA Container Toolkit and host kernel drivers, saving hours of manual driver compilation.

Paste your copied public SSH key into the attached key layout to clear the configuration warning and activate the blue Deploy Instance button.

Note on Storage: Utilize Spheron's persistent volume features to attach high-capacity storage cheaply across long training epochs.


Phase 2: Database Firewall Whitelisting
Project EDEN streams sub-second hardware telemetry and validation Bits-Per-Byte (val_bpb) metrics to a serverless Azure SQL database via asynchronous thread pools.

Once the Spheron instance status switches to Active, copy its assigned public IP Address.

Navigate to your Azure Portal -> SQL Server configuration.

Go to Networking / Firewalls.

Add a new firewall rule pasting the Spheron Instance IP into both the Start IP and End IP fields.

Save changes. Failing to update this whitelist will cause the pyodbc driver inside the container to hang or throw authentication rejections on step zero.


Phase 3: Code Transport Protocol
Because local Docker configurations on Apple Silicon cannot natively pass through host resources to a guest Linux VM, code must be built natively on the remote host.

1. Authenticate with the Cloud Node
Open a terminal on your Mac and initiate the secure shell handshake using the instance username (ubuntu or root) provided by Spheron:
ssh -i ~/.ssh/id_ed25519 ubuntu@YOUR_SPHERON_IP
Type yes when prompted to verify the authenticity of the host.

2. Push Code Assets via SCP
Open a new tab in your local Mac terminal, navigate to your local GitHub repository path, and run scp to copy your architecture directory directly over the wire, skipping bulky local virtual environments:

cd ~/Github/project-eden
scp -i ~/.ssh/id_ed25519 -r Dockerfile requirements.txt *.py ubuntu@YOUR_SPHERON_IP:/home/ubuntu/


Phase 4: Container Build & Runtime Launch
Switch back to your remote Spheron terminal window. Verify that Docker is healthy (docker --version).

1. Native Image Compilation
Run the build engine. This downloads the optimized NVIDIA CUDA foundation base layer, installs the Microsoft ODBC SQL Driver 18 infrastructure, pulls your project dependencies (datasets, pyodbc, numpy, tokenizers), and automatically processes the 1M Sample FineWeb dataset pre-compilation pipeline completely inside the image layers:

docker build -t project-eden:latest .

2. Ignite the Hopper Core
Unleash the container into the GPU stack. The --gpus all flag exposes the raw physical graphics hardware directly to the underlying PyTorch execution loop:

docker run --gpus all \
  -e AZURE_SQL_CONNECTION_STRING="your_actual_connection_string_here" \
  project-eden:latest


  Tracking the Parallel FrontiersYou are currently executing two parallel compute runs across your BVE Labs infrastructure:Compute TrackHardwareTarget Optimization FocusMVP 1.0 Run1x H100 PCIeVerifying basic telemetry loops, linear epigenetic mixing coefficients, and closing out the FineWeb training curves.MVP 2.0 RunHigh-Power Dedicated GPUDeveloping and benchmarking Dynamic Spatial Folding (replacing flat random matrices with fractal weight generation and conditional epigenetic gating networks).