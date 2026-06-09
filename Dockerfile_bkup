# Use an official NVIDIA CUDA base optimized for PyTorch deep learning
FROM nvidia/cuda:12.1.1-runtime-ubuntu22.04

# Prevent interactive prompts during installation
ENV DEBIAN_FRONTEND=noninteractive

# 1. Install standard system dependencies including curl and gnupg
RUN apt-get update && apt-get install -y \
    python3-pip \
    python3-dev \
    git \
    curl \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# 2. Add Microsoft repository and install the ODBC 18 Driver
RUN curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add - \
    && curl https://packages.microsoft.com/config/ubuntu/22.04/prod.list > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y msodbcsql18 unixodbc-dev \
    && rm -rf /var/lib/apt/lists/*

# Set the operational working directory inside the container
WORKDIR /app

# Copy dependency specifications and install cleanly
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy the core architecture scripts and binary assets into the image
COPY train_gpt.py .
COPY prepare_data.py .
COPY generate.py .
COPY fineweb.bin .

# Set environment variables for optimized CUDA performance
ENV PYTHONUNBUFFERED=1

# By default, trigger the pre-training loop when the container spins up
CMD ["python3", "train_gpt.py"]