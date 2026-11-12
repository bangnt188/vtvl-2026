#!/usr/bin/env python3
"""Download the Excel fixtures shared for the HD07 VTVL review.

Only .xlsx files are fetched; video/PDF/DOCX/ZIP and .xlsb files are skipped.
Files are kept under 04_LAM_VIEC/du_lieu_drive_hd07/<folder>/<drive path>.
"""
from __future__ import annotations

import hashlib
import json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import gdown

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "04_LAM_VIEC" / "du_lieu_drive_hd07"
SOURCES = {
    "hd07": "https://drive.google.com/drive/folders/1bRO7tggZ2tzIFxHCUfMOlvOY8LLRiH73",
    "mt-ttq": "https://drive.google.com/drive/folders/1UrlirrrBOsS4NSzwF0bFKukGG1GsTASJ",
    "th-thcs-mn": "https://drive.google.com/drive/folders/18YDrDip3-6tJBbKiXg1znWQMgN7lz460",
    "bo-mon-y-te": "https://drive.google.com/drive/folders/1dLRcBUmfZrdDmgc82b5VEEbjPb4vjhES",
}


def main() -> None:
    DEST.mkdir(parents=True, exist_ok=True)
    jobs = []
    for folder, url in SOURCES.items():
        files = gdown.download_folder(
            url=url, output=str(DEST / folder), quiet=True,
            use_cookies=True, skip_download=True,
        )
        for item in files:
            if item.path.lower().endswith((".xlsx", ".xlsm")):
                jobs.append((folder, item))

    def fetch(job: tuple[str, object]) -> dict:
        folder, item = job
        target = Path(item.local_path)
        if target.exists() and target.stat().st_size > 0:
            pass
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            gdown.download(
                id=item.id, output=str(target), quiet=True,
                use_cookies=True, cookies_file=None,
            )
        data = target.read_bytes()
        return {
            "folder": folder,
            "path": item.path,
            "file": str(target.relative_to(ROOT)),
            "bytes": len(data),
            "sha256": hashlib.sha256(data).hexdigest(),
        }

    with ThreadPoolExecutor(max_workers=4) as pool:
        manifest = list(pool.map(fetch, jobs))
    manifest.sort(key=lambda x: (x["folder"], x["path"]))
    (DEST / "tai_nguyen.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    total = sum(x["bytes"] for x in manifest)
    print(f"downloaded {len(manifest)} Excel files, {total / 1024 / 1024:.1f} MiB")


if __name__ == "__main__":
    main()