#!/usr/bin/env python3
"""Erzeugt die App-Icons (3×3-Kachelraster in den Farben des Soundboards)."""
import os
from PIL import Image, ImageDraw

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "icons")
COLORS = ["#8FD3F4", "#FFE07A", "#2E3A87", "#FFB48A", "#A8E6A3",
          "#B9A2EE", "#FFC2D4", "#3B3F73", "#F7B32B"]
CREAM = "#FFF7EC"


def icon(size: int, padding_ratio: float, rounded_bg: bool) -> Image.Image:
    scale = 4  # Supersampling für glatte Kanten
    s = size * scale
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if rounded_bg:
        d.rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * 0.22), fill=CREAM)
    else:
        d.rectangle([0, 0, s, s], fill=CREAM)
    pad = s * padding_ratio
    gap = s * 0.035
    cell = (s - 2 * pad - 2 * gap) / 3
    for i, c in enumerate(COLORS):
        r, col = divmod(i, 3)
        x = pad + col * (cell + gap)
        y = pad + r * (cell + gap)
        d.rounded_rectangle([x, y, x + cell, y + cell], radius=int(cell * 0.25), fill=c)
    return img.resize((size, size), Image.LANCZOS)


def main():
    os.makedirs(OUT, exist_ok=True)
    icon(192, 0.14, True).save(os.path.join(OUT, "icon-192.png"))
    icon(512, 0.14, True).save(os.path.join(OUT, "icon-512.png"))
    icon(512, 0.22, False).save(os.path.join(OUT, "icon-maskable-512.png"))  # Safe Zone für Android
    icon(180, 0.14, False).convert("RGB").save(os.path.join(OUT, "apple-touch-icon.png"))  # iOS rundet selbst
    print("Icons erzeugt in", os.path.abspath(OUT))


if __name__ == "__main__":
    main()
