"""Cut a painting off its paper backdrop: removes the low-saturation light tones
(paper + floor shadow) connected to the border, plus an artist signature box.
Usage: python3 tools/cutout_paper.py SRC MASK_OUT [x0,y0,x1,y1]  (optional signature box, pixels)"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

src = Image.open(sys.argv[1]).convert("RGB")
a = np.asarray(src).astype(np.int16)
sat = a.max(axis=2) - a.min(axis=2)
lum = a.mean(axis=2)
paper = ((sat <= 8) & (lum >= 190)).astype(np.uint8) * 255
mask = Image.fromarray(paper, "L").copy()
w, h = mask.size
for pt in [(x, 0) for x in range(0, w, 3)] + [(x, h - 1) for x in range(0, w, 3)] + \
          [(0, y) for y in range(0, h, 3)] + [(w - 1, y) for y in range(0, h, 3)]:
    if mask.getpixel(pt) == 255:
        ImageDraw.floodfill(mask, pt, 128)
bg = (np.asarray(mask) == 128)
# floor shadow: a second, looser pass in the bottom strip, grown from the backdrop
y0 = int(h * 0.86)
loose = ((sat <= 26) & (lum >= 150))
grow = bg.copy()
for _ in range(60):
    nb = grow.copy()
    nb[1:, :] |= grow[:-1, :]; nb[:-1, :] |= grow[1:, :]; nb[:, 1:] |= grow[:, :-1]; nb[:, :-1] |= grow[:, 1:]
    nb &= loose; nb[:y0] = grow[:y0]
    if (nb == grow).all(): break
    grow = nb
bg = grow
# optional artist signature box
if len(sys.argv) > 3:
    sx0, sy0, sx1, sy1 = map(int, sys.argv[3].split(","))
    bg[sy0:sy1, sx0:sx1] = True
# close tiny specks inside the backdrop
bgimg = Image.fromarray(bg.astype(np.uint8) * 255, "L").filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))
alpha = (255 - np.asarray(bgimg.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1.3)))).astype(np.float32)
# fade the paper-white fringe hugging the figures
band = np.asarray(bgimg.filter(ImageFilter.MaxFilter(9))) > 0
paperness = np.clip((lum - 205) / 30, 0, 1) * np.clip((14 - sat) / 14, 0, 1)
alpha = np.where(band, alpha * (1 - paperness), alpha)
Image.fromarray(alpha.astype(np.uint8), "L").save(sys.argv[2])
