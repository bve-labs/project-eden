import argparse
import os
from typing import Optional

import torch
import torch.nn.functional as F

from train_gpt import ByteTokenizer, EdenLM


def pick_device(preferred: Optional[str] = None) -> str:
    if preferred:
        return preferred
    if torch.cuda.is_available():
        return "cuda"
    if torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def load_model(checkpoint_path: str, device: str) -> EdenLM:
    if not os.path.exists(checkpoint_path):
        raise FileNotFoundError(
            f"Checkpoint not found: {checkpoint_path}. "
            "Run `python train_gpt.py` first to create `eden_artifact.pt`."
        )

    model = EdenLM().to(device)
    state_dict = torch.load(checkpoint_path, map_location=device)
    model.load_state_dict(state_dict)
    model.eval()
    return model


def generate_chat_stream(
    model: EdenLM,
    prompt_text: str,
    max_new_bytes: int = 500,
    temperature: float = 0.8,
    top_k: int = 40,
    device: str = "cpu",
) -> None:
    tokenizer = ByteTokenizer()

    # 1. Format the raw input into explicit byte structural boundaries
    formatted_prompt = f"<|USER|>\n{prompt_text}\n<|BOT|>\n"
    
    # Encode string directly to raw integers (0-255)
    prompt_tokens = tokenizer.encode(formatted_prompt)
    idx = torch.tensor(prompt_tokens, dtype=torch.long, device=device).unsqueeze(0)

    # Pre-calculate the exact byte sequences for the stop boundary
    stop_sequence = list("<|END|>".encode("utf-8"))
    stop_len = len(stop_sequence)

    print("\n--- Prompt Structure Loaded ---")
    print(formatted_prompt, end="", flush=True)

    generated_bytes = []

    # 2. Autoregressive loop with sliding stop-window checks
    with torch.no_grad():
        for _ in range(max_new_bytes):
            idx_cond = idx[:, -1024:]  # Dynamic sliding attention window
            logits, _ = model(idx_cond)
            logits = logits[:, -1, :]

            if temperature > 0:
                logits = logits / temperature
                if top_k > 0:
                    k = min(top_k, logits.size(-1))
                    values, _ = torch.topk(logits, k)
                    logits = logits.masked_fill(logits < values[:, [-1]], float("-inf"))

                probs = F.softmax(logits, dim=-1)
                idx_next = torch.multinomial(probs, num_samples=1)
            else:
                idx_next = torch.argmax(logits, dim=-1, keepdim=True)

            # Append newest byte to working history tensor
            idx = torch.cat((idx, idx_next), dim=1)
            
            # Extract raw integer token and record it
            next_byte = idx_next.item()
            generated_bytes.append(next_byte)

            # Stream byte instantly to terminal
            try:
                char_out = bytes([next_byte]).decode("utf-8", errors="replace")
                print(char_out, end="", flush=True)
            except Exception:
                pass

            # 3. Dynamic Stop Tag Evaluation
            if len(generated_bytes) >= stop_len:
                if generated_bytes[-stop_len:] == stop_sequence:
                    print("\n\n[Match Break: Stop Sequence Observed]")
                    break
                    
    print("\n---------------------------\n")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate text with a trained EDEN model.")
    parser.add_argument(
        "--checkpoint",
        default="eden_artifact.pt",
        help="Path to a saved EDEN checkpoint.",
    )
    parser.add_argument(
        "--prompt",
        default="Who is Jane Austen?",
        help="Prompt text to feed the assistant layout.",
    )
    parser.add_argument(
        "--max-new-bytes",
        type=int,
        default=500,
        help="Maximum generation ceiling.",
    )
    parser.add_argument(
        "--temperature",
        type=float,
        default=0.7,
        help="Sampling temperature.",
    )
    parser.add_argument(
        "--top-k",
        type=int,
        default=40,
        help="Top-k sampling cutoff.",
    )
    parser.add_argument(
        "--device",
        default=None,
        help="Force hardware target override.",
    )
    args = parser.parse_args()

    device = pick_device(args.device)
    model = load_model(args.checkpoint, device)
    
    generate_chat_stream(
        model=model,
        prompt_text=args.prompt,
        max_new_bytes=args.max_new_bytes,
        temperature=args.temperature,
        top_k=args.top_k,
        device=device,
    )


if __name__ == "__main__":
    main()