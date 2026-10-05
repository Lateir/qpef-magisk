# Quest Pro Eye Filter (QPEF)

QPEF is a standalone Magisk module for Quest Pro eye tracking. It smooths abrupt differences between the two gaze directions, particularly the brief inward motion during a blink. Movement back toward parallel gaze passes through immediately. A sustained nonparallel gaze catches up with increasing speed. The midpoint of the two gaze directions is preserved.

The filter uses the values verified in the live test: difference acceleration **900°/s²**, initial resistance **0.8**, maximum difference speed **90°/s**, and follow time **45 ms**. These values are compiled into `src/gaze_damper.c`.

## Compatibility and operation

QPEF is separate from the independent gaze module. It does not replace its model, overlay, scripts, or properties. Magisk starts `service.sh`, which waits for `trackingservice` and attaches `frida-inject` with `src/filter.js`. The service stages its native library at `/data/local/tmp/qpef-filter.so` so the target process can load it; the script then edits paired eye directions in the running process. If trackingservice restarts, QPEF attaches again.

The injection point is specific to `/odm/lib64/libtrackingengines.so` SHA-256 `0fb6f54a3e190bec791d757ea18d32a8ecc1af4a861992d04b1703c93293cd03`. On any other engine build, QPEF refuses to attach and writes the reason to `/data/adb/modules/qpef/qpef.log`. This prevents an unverified offset from being used after a headset update.

This module requires Magisk root and the tested Quest Pro tracking service. The bundled `frida-inject` is the official Frida 17.17.0 Android ARM64 release executable. Its source and license are available from [Frida](https://github.com/frida/frida/tree/17.17.0). QPEF's own source is under the included `LICENSE`.

## Install

Install `qpef-magisk.zip` in Magisk and reboot the headset. Keep the independent gaze module installed if you use its model. Check `/data/adb/modules/qpef/qpef.log` for `Attaching to trackingservice` and periodic processed-pair counts. To disable QPEF, disable only the QPEF module in Magisk and reboot.

The module ZIP does not contain a model or modify the original eye module. The 53 MB injector binary compresses to roughly 16 MB in the ZIP.

## Build

An Android NDK with `aarch64-linux-android29-clang` and Python 3 are required:

```sh
aarch64-linux-android29-clang -O2 -fPIC -shared src/gaze_damper.c -lm -o lib/libqpef_filter.so
python3 build_module.py
```

The official Android ARM64 `frida-inject` 17.17.0 binary is kept in `bin/` so the module build is reproducible without fetching an executable during the GitHub Actions run. The original download is `https://github.com/frida/frida/releases/download/17.17.0/frida-inject-17.17.0-android-arm64.xz`.

## Releases

See [RELEASING.md](RELEASING.md). The `updateJson` URL assumes the GitHub repository will be `Lateir/qpef-magisk`; change the repository name in `module.prop`, `update.json`, and `scripts/release.py` before publishing if needed.
