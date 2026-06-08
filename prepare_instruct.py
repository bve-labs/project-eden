import os
from itertools import islice

import numpy as np

from train_gpt import ByteTokenizer

try:
    from datasets import load_dataset
except ImportError as exc:
    raise SystemExit(
        "Missing dependency: datasets. Install it with `pip install datasets` "
        "or run `pip install -r requirements.txt`."
    ) from exc


DATASET_NAME = "yahma/alpaca-cleaned"
DATASET_SPLIT = "train"
SAMPLE_COUNT = 10_000
OUTPUT_FILE = "instructions.bin"


def format_sample(sample: dict) -> str:
    instruction = sample.get("instruction", "")
    input_text = sample.get("input", "")
    output = sample.get("output", "")

    if not all(isinstance(value, str) for value in (instruction, input_text, output)):
        raise ValueError("Expected instruction, input, and output fields to be strings.")

    return f"<|USER|>\n{instruction} {input_text}\n<|BOT|>\n{output}\n<|END|>"


def main() -> None:
    print(f"Loading exactly {SAMPLE_COUNT:,} samples from {DATASET_NAME}...")
    dataset = load_dataset(DATASET_NAME, split=DATASET_SPLIT)

    formatted_samples = []
    for sample_index, sample in enumerate(islice(dataset, SAMPLE_COUNT), start=1):
        formatted_samples.append(format_sample(sample))

        if sample_index % 2_000 == 0:
            print(f"Formatted {sample_index:,} samples...")

    if len(formatted_samples) != SAMPLE_COUNT:
        raise RuntimeError(
            f"Expected {SAMPLE_COUNT:,} samples, but only loaded "
            f"{len(formatted_samples):,}."
        )

    tokenizer = ByteTokenizer()
    combined_text = "\n".join(formatted_samples)
    tokens = tokenizer.encode(combined_text)
    byte_array = np.array(tokens, dtype=np.uint8)
    byte_array.tofile(OUTPUT_FILE)

    file_size_mb = os.path.getsize(OUTPUT_FILE) / (1024 * 1024)
    print(f"Success: saved {OUTPUT_FILE} ({file_size_mb:.2f} MB).")


if __name__ == "__main__":
    main()
