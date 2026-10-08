"""Turn the white backgrounds of the painted artwork into transparency.

Usage: python3 tools/prepare_art.py SRC_IMAGE OUT_PNG [--max-width 1400]

Uses "colour to alpha" against white, so soft watercolour edges keep
their gradient instead of getting a hard cut-out halo.
"""
import argparse

import numpy as np
from PIL import Image


def white_to_alpha(img: Image.Image) -> Image.Image:
    rgb = np.asarray(img.convert("RGB")).astype(np.float32) / 255.0
    # paper-white threshold: treat anything this bright as fully transparent
    lift = 0.04
    dist = np.clip((1.0 - rgb - lift) / (1.0 - lift), 0, 1)
    alpha = dist.max(axis=2)
    safe = np.where(alpha > 1e-4, alpha, 1)[..., None]
    out_rgb = 1.0 - dist / safe
    out = np.dstack([np.clip(out_rgb, 0, 1), alpha])
    return Image.fromarray((out * 255).round().astype(np.uint8), "RGBA")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("--max-width", type=int, default=1400)
    a = ap.parse_args()
    img = Image.open(a.src)
    if img.width > a.max_width:
        img = img.resize((a.max_width, round(img.height * a.max_width / img.width)), Image.LANCZOS)
    white_to_alpha(img).save(a.out, optimize=True)


if __name__ == "__main__":
    main()
