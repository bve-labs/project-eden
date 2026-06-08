#!/bin/bash
set -e # Exit immediately if any command fails

echo "🧬 Initializing Project EDEN Bioreactor Pipeline..."

# 1. Generate Instruction Data
# We mount the current directory $(pwd) so the resulting instructions.bin stays on the host.
echo "📦 Step 1: Synthesizing Instruction Dataset..."
docker run --rm -v $(pwd):/workspace project-eden:latest python prepare_instruct.py

# 2. Foundational Pre-Training (The Genome)
# This loop runs the ~25 hour pre-training. The artifact will save directly to the host.
echo "🧠 Step 2: Executing Foundational Pre-training (train_gpt.py)..."
docker run --gpus all --rm \
  -v $(pwd):/workspace \
  -e AZURE_SQL_CONNECTION_STRING="${AZURE_SQL_CONNECTION_STRING}" \
  project-eden:latest python train_gpt.py

# 3. Chat Fine-Tuning (The Epigenome)
# This loop reads the host's eden_artifact.pt and instructions.bin to create the chat artifact.
echo "💬 Step 3: Executing Epigenetic Chat Fine-Tuning (train_chat.py)..."
docker run --gpus all --rm \
  -v $(pwd):/workspace \
  -e AZURE_SQL_CONNECTION_STRING="${AZURE_SQL_CONNECTION_STRING}" \
  project-eden:latest python train_chat.py

echo "✅ Pipeline Complete! All artifacts are safely stored on the Spheron host disk."