#!/usr/bin/env python3
"""Build the installable QPEF Magisk ZIP."""
import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "qpef-magisk.zip"
FILES = (
    "module.prop", "customize.sh", "service.sh", "src/filter.js",
    "bin/frida-inject", "lib/libqpef_filter.so",
)


def properties(path):
    return dict(line.split("=", 1) for line in path.read_text(encoding="utf-8").splitlines()
                if line and not line.startswith("#"))


prop = properties(ROOT / "module.prop")
manifest = json.loads((ROOT / "update.json").read_text(encoding="utf-8"))
if int(manifest["versionCode"]) > int(prop["versionCode"]):
    raise SystemExit("update.json advertises a newer version")
if int(manifest["versionCode"]) == int(prop["versionCode"]):
    if manifest["version"] != prop["version"]:
        raise SystemExit("module.prop and update.json version differ")
if not (ROOT / "bin/frida-inject").read_bytes().startswith(b"\x7fELF"):
    raise SystemExit("Missing Android ARM64 frida-inject binary")
if not (ROOT / "lib/libqpef_filter.so").read_bytes().startswith(b"\x7fELF"):
    raise SystemExit("Missing Android ARM64 filter library")

with ZipFile(OUTPUT, "w", ZIP_DEFLATED) as archive:
    for name in FILES:
        data = (ROOT / name).read_bytes()
        if name.endswith((".sh", ".prop", ".js")) and b"\r" in data:
            raise SystemExit(f"{name} must use LF line endings")
        info = ZipInfo(name)
        info.compress_type = ZIP_DEFLATED
        info.create_system = 3
        info.external_attr = ((0o755 if name.endswith((".sh", "frida-inject"))
                               else 0o644) << 16)
        archive.writestr(info, data)
print(OUTPUT)
