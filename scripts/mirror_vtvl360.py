#!/usr/bin/env python3
"""Mirror the public Vị trí việc làm 360 site into public/vtvl360.

The site is a static browser-only app. This script keeps the implementation
byte-for-byte except for three privacy/offline changes:
- CSP only allows same-origin connections;
- the usage-log script is not copied;
- Bấm giờ loads SheetJS from this clone instead of cdnjs.
"""
from __future__ import annotations

import hashlib
import re
from pathlib import Path
from urllib.parse import urljoin
from urllib.request import Request, urlopen

SOURCE = "https://vtvl.tranghoaivu.vn/"
ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "public" / "vtvl360"

PAGES = ("index.html", "tao-tep.html", "ra-soat.html", "bam-gio.html")
SHARED = (
    "css/chung.css",
    "js/bam-gio.js",
    "js/cau-hinh.js",
    "js/du-lieu-dvsn.js",
    "js/du-lieu-ngach.js",
    "js/du-lieu-pl3.js",
    "js/du-lieu-sldv.js",
    "js/du-lieu-tg.js",
    "js/du-lieu-xa.js",
    "js/engine.js",
    "js/goiy-core.js",
    "js/khung.js",
    "js/mau.js",
    "js/nap-core.js",
    "js/ngach-core.js",
    "js/ra-soat.js",
    "js/split-core.js",
    "js/tao-tep.js",
    "lib/jszip-3.10.1.min.js",
    "lib/xlsx-0.18.5.full.min.js",
)
DOWNLOADS = (
    "tai-ve/tao-tep-don-vi.html",
    "tai-ve/ra-soat-9-bieu.html",
    "tai-ve/bam-gio-cong-viec.html",
)

HEAD_EXTRA = """<meta name="theme-color" content="#0f2e2b">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="application-name" content="VTVL 360">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="VTVL 360">
<link rel="canonical" href="https://vtvl.captain-solution.tech/vtvl360/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="VTVL 360">
<meta property="og:locale" content="vi_VN">
<meta property="og:title" content="Vị trí việc làm 360">
<meta property="og:description" content="Tạo tệp đơn vị, bấm giờ, nạp phiếu và rà soát 9 biểu VTVL ngay trên trình duyệt. Dữ liệu không rời khỏi máy.">
<meta property="og:url" content="https://vtvl.captain-solution.tech/vtvl360/">
<meta property="og:image" content="https://vtvl.captain-solution.tech/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
"""

def fetch(url: str) -> bytes:
    req = Request(url, headers={"User-Agent": "vtvl360-mirror/1.0"})
    with urlopen(req, timeout=120) as response:
        return response.read()


def main() -> None:
    DEST.mkdir(parents=True, exist_ok=True)
    downloaded = 0
    mau = fetch(urljoin(SOURCE, "js/mau.js")).decode("utf-8")
    template_urls = re.findall(r'"url":\s*"([^"]+\.xlsx[^"]*)"', mau)
    assets = [*PAGES, *SHARED, *DOWNLOADS, *template_urls]
    seen: set[str] = set()
    for path in assets:
        clean = path.split("?", 1)[0]
        if clean in seen:
            continue
        seen.add(clean)
        target = DEST / clean
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(fetch(urljoin(SOURCE, path)))
        downloaded += 1
        print(f"GET {path} -> {target.relative_to(ROOT)} ({target.stat().st_size} B)")

    for page in [*PAGES, *DOWNLOADS]:
        path = DEST / page
        html = path.read_text(encoding="utf-8")
        html = re.sub(r"connect-src 'self' https://[^;]+", "connect-src 'self'", html)
        html = re.sub(r'<script[^>]+js/nhat-ky\.js[^>]*>\s*</script>\s*', "", html)
        html = html.replace(
            "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
            "lib/xlsx-0.18.5.full.min.js",
        )
        if page in PAGES and 'rel="manifest"' not in html:
            html = html.replace("<title>", HEAD_EXTRA + "<title>", 1)
        path.write_text(html, encoding="utf-8")

    bam_gio = DEST / "js" / "bam-gio.js"
    bam_gio.write_text(
        bam_gio.read_text(encoding="utf-8").replace(
            "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
            "lib/xlsx-0.18.5.full.min.js",
        ),
        encoding="utf-8",
    )

    config = DEST / "js" / "cau-hinh.js"
    config.write_text(
        config.read_text(encoding="utf-8").replace("NHAT_KY: true", "NHAT_KY: false"),
        encoding="utf-8",
    )

    manifest = {
        "source": SOURCE,
        "pages": list(PAGES),
        "downloads": list(DOWNLOADS),
        "template_count": len(template_urls),
        "files": sorted(
            str(p.relative_to(DEST)) for p in DEST.rglob("*") if p.is_file()
        ),
    }
    (DEST / "mirror-manifest.json").write_text(
        __import__("json").dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"done: {downloaded} files, {len(manifest['files'])} total")


if __name__ == "__main__":
    main()