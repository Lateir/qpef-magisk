#!/usr/bin/env python3
"""Validate a release tag and publish its Magisk update manifest."""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSET = "qpef-magisk.zip"
REPO = "Lateir/qpef-magisk"


def properties(path):
    return dict(line.split("=", 1) for line in path.read_text(encoding="utf-8").splitlines()
                if line and not line.startswith("#"))


def main(command, tag):
    if not re.fullmatch(r"v[0-9]+\.[0-9]+(?:\.[0-9]+)?", tag):
        raise SystemExit(f"Invalid release tag: {tag}")
    prop = properties(ROOT / "module.prop")
    path = ROOT / "update.json"
    manifest = json.loads(path.read_text(encoding="utf-8"))
    if prop["version"] != tag:
        raise SystemExit("Tag and module.prop version differ")
    if command == "validate":
        if int(prop["versionCode"]) < int(manifest["versionCode"]):
            raise SystemExit("Release versionCode is older than update.json")
        return
    if command != "update":
        raise SystemExit("Usage: release.py validate|update TAG")
    if int(prop["versionCode"]) < int(manifest["versionCode"]):
        raise SystemExit("Release versionCode is older than update.json")
    manifest["version"] = tag
    manifest["versionCode"] = int(prop["versionCode"])
    manifest["zipUrl"] = f"https://github.com/{REPO}/releases/download/{tag}/{ASSET}"
    path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: release.py validate|update TAG")
    main(sys.argv[1], sys.argv[2])
