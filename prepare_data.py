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


DATASET_NAME = "HuggingFaceFW/fineweb-edu"
DATASET_CONFIG = "sample-10BT"
DATASET_SPLIT = "train"
SAMPLE_COUNT = 50_000
OUTPUT_FILE = "fineweb.bin"


def main() -> None:
    print(
        f"Streaming exactly {SAMPLE_COUNT:,} samples from "
        f"{DATASET_NAME}/{DATASET_CONFIG}..."
    )
    dataset = load_dataset(
        DATASET_NAME,
        name=DATASET_CONFIG,
        split=DATASET_SPLIT,
        streaming=True,
    )

    texts = []
    for sample_index, sample in enumerate(islice(dataset, SAMPLE_COUNT), start=1):
        text = sample.get("text")
        if not isinstance(text, str):
            raise ValueError(
                f"Sample {sample_index} is missing a string `text` field."
            )
        texts.append(text)

        if sample_index % 10_000 == 0:
            print(f"Loaded {sample_index:,} samples...")

    if len(texts) != SAMPLE_COUNT:
        raise RuntimeError(
            f"Expected {SAMPLE_COUNT:,} samples, but only loaded {len(texts):,}."
        )

    tokenizer = ByteTokenizer()
    combined_text = "\n".join(texts)
    tokens = tokenizer.encode(combined_text)
    byte_array = np.array(tokens, dtype=np.uint8)
    byte_array.tofile(OUTPUT_FILE)

    file_size_bytes = os.path.getsize(OUTPUT_FILE)
    file_size_mb = file_size_bytes / (1024 * 1024)
    print(
        f"Success: processed {byte_array.size:,} bytes from {SAMPLE_COUNT:,} "
        f"samples and saved {OUTPUT_FILE} ({file_size_mb:.2f} MB)."
    )


if __name__ == "__main__":
    main()
