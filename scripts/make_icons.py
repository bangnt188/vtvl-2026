#!/usr/bin/env python3
"""Generate VTVL 360 favicons, PWA icons and the social share image."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
NAVY = "#0f2e2b"
MINT = "#8ee0b7"
GOLD = "#e9b949"
WHITE = "#ffffff"
PAPER = "#f4f7f5"
BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
REGULAR = "/System/Library/Fonts/Supplemental/Arial.ttf"


def icon(size: int, rounded: bool = True, scale: float = 1.0) -> Image.Image:
    scale = max(0.01, min(scale, 1.0))
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    pad = round(size * (1 - scale) / 2)
    box = (pad, pad, size - pad, size - pad)
    radius = round(size * 0.22) if rounded else 0
    d.rounded_rectangle(box, radius=radius, fill=NAVY)
    w = size * 0.105 * scale
    base = size * 0.79
    bars = [(0.23, 0.44), (0.42, 0.31), (0.61, 0.19)]
    for x, top in bars:
        d.rounded_rectangle(
            (size * x, size * top, size * x + w, base),
            radius=round(w / 2),
            fill=MINT,
        )
    d.ellipse((size * 0.72, size * 0.22, size * 0.84, size * 0.34), fill=GOLD)
    return img


def main() -> None:
    PUBLIC.mkdir(parents=True, exist_ok=True)

    # SVG source used by modern browsers.
    (PUBLIC / "favicon.svg").write_text(
        """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#0f2e2b"/>
  <rect x="15" y="28" width="7" height="20" rx="3.5" fill="#8ee0b7"/>
  <rect x="27" y="20" width="7" height="28" rx="3.5" fill="#8ee0b7"/>
  <rect x="39" y="12" width="7" height="36" rx="3.5" fill="#8ee0b7"/>
  <circle cx="49" cy="15" r="5" fill="#e9b949"/>
</svg>
""",
        encoding="utf-8",
    )

    icon(180, rounded=True).save(PUBLIC / "apple-touch-icon.png")
    icon(192, rounded=False).save(PUBLIC / "icon-192.png")
    icon(512, rounded=False).save(PUBLIC / "icon-512.png")
    icon(512, rounded=False, scale=0.78).save(PUBLIC / "icon-maskable-512.png")
    icon(48, rounded=True).save(
        PUBLIC / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)]
    )

    # Social card: 1200x630, readable in Twitter/Facebook/Zalo previews.
    og = Image.new("RGB", (1200, 630), NAVY)
    d = ImageDraw.Draw(og)
    d.rectangle((0, 0, 14, 630), fill=GOLD)
    mark = icon(300, rounded=True, scale=1.0)
    og.paste(mark, (890, 78), mark)

    d.text((78, 82), "VỊ TRÍ VIỆC LÀM", font=ImageFont.truetype(BOLD, 34), fill=MINT)
    d.text((72, 128), "360", font=ImageFont.truetype(BOLD, 188), fill=WHITE)
    d.text(
        (80, 344),
        "Tạo tệp · Bấm giờ · Rà soát 9 biểu",
        font=ImageFont.truetype(BOLD, 42),
        fill=WHITE,
    )
    d.text(
        (82, 414),
        "Kỳ số liệu 01/10/2025 – 30/09/2026 · Dự báo 2027–2031",
        font=ImageFont.truetype(REGULAR, 28),
        fill="#b7d3c6",
    )
    d.line((82, 500, 760, 500), fill="#426962", width=2)
    d.text(
        (82, 526),
        "vtvl.captain-solution.tech",
        font=ImageFont.truetype(BOLD, 32),
        fill=GOLD,
    )
    og.save(PUBLIC / "og-image.png", optimize=True)
    print("icons written to", PUBLIC)


if __name__ == "__main__":
    main()