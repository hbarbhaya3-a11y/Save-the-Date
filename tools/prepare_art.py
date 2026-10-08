"""Turn the white backgrounds of the painted artwork into transparency.

Usage: python3 tools/prepare_art.py SRC_IMAGE OUT [--max-width 1400] [--mode alpha|flood]

--mode alpha (default): "colour to alpha" against white, so soft watercolour
    edges keep their gradient. Good for florals and scenery.
--mode flood: removes only the white backdrop connected to the image border,
    so white/ivory areas inside the subject (an ivory sherwani, white
    jasmine garlands) stay solid. Use this for people.
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


def flood_backdrop(img: Image.Image, threshold: int = 236, feather: float = 1.2) -> Image.Image:
    from PIL import ImageDraw, ImageFilter

    rgb = img.convert("RGB")
    arr = np.asarray(rgb)
    near_white = (arr.min(axis=2) >= threshold).astype(np.uint8) * 255
    mask = Image.fromarray(near_white, "L").copy()  # copy: floodfill needs writable pixels
    w, h = mask.size
    seeds = [(x, 0) for x in range(0, w, 3)] + [(x, h - 1) for x in range(0, w, 3)] + \
            [(0, y) for y in range(0, h, 3)] + [(w - 1, y) for y in range(0, h, 3)]
    for pt in seeds:
        if mask.getpixel(pt) == 255:
            ImageDraw.floodfill(mask, pt, 128)
    backdrop = (np.asarray(mask) == 128).astype(np.uint8) * 255
    # grow the backdrop by a pixel to eat the light fringe, then soften the edge
    bd = Image.fromarray(backdrop, "L").filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(feather))
    alpha = 255 - np.asarray(bd)
    return Image.fromarray(np.dstack([arr, alpha]).astype(np.uint8), "RGBA")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("--max-width", type=int, default=1400)
    ap.add_argument("--mode", choices=["alpha", "flood"], default="alpha")
    a = ap.parse_args()
    img = Image.open(a.src)
    if img.width > a.max_width:
        img = img.resize((a.max_width, round(img.height * a.max_width / img.width)), Image.LANCZOS)
    out = flood_backdrop(img) if a.mode == "flood" else white_to_alpha(img)
    out.save(a.out, optimize=True) if a.out.endswith(".png") else out.save(a.out, quality=90)


if __name__ == "__main__":
    main()
