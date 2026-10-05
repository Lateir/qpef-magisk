# Quest Pro Eye Filter (QPEF)

**Tired of your avatar going cross-eyed when you blink?** QPEF smooths the sudden difference between your Quest Pro's eye directions that can make a blink look like a brief squint. Your eyes can still move independently: the filter lets them return toward parallel gaze immediately and gradually follows a sustained nonparallel gaze.

QPEF runs **on the headset**, inside the Quest Pro tracking process. Once installed, it does not need a PC app or a live connection. It is a separate Magisk module and works alongside **any independent eye gaze model**: it filters eye directions without replacing or modifying the model.

https://github.com/user-attachments/assets/cca37327-d6ee-4f89-933e-8997632fad3f

## Install

1. Download `qpef-magisk.zip` from the [latest release](https://github.com/Lateir/qpef-magisk/releases/latest).
2. Install the ZIP in Magisk and reboot your Quest Pro.
3. Keep your independent gaze module installed if you use one. QPEF works beside it.

To turn QPEF off, disable only the QPEF module in Magisk and reboot. Its activity log is at `/data/adb/modules/qpef/qpef.log`.

## How it works

The filter dampens sudden changes in the difference between left and right gaze while preserving their shared direction. Changes back toward parallel gaze pass through immediately. If you deliberately hold a nonparallel gaze, the filtered directions catch up with increasing speed.

The default values verified in a live headset test are: difference acceleration **900°/s²**, initial resistance **0.8**, maximum difference speed **90°/s**, and follow time **45 ms**. They are compiled into `src/gaze_damper.c`.

Magisk starts `service.sh`, which attaches the filter to `trackingservice`. The native filter library is staged at `/data/local/tmp/qpef-filter.so` so the tracking process can load it. QPEF reconnects if the tracking service restarts. It does not change the independent gaze model, its overlay, or its settings.

### Compatibility

QPEF is independent of the **eye gaze model**, but its current injection point is specific to one Quest Pro tracking engine build: `/odm/lib64/libtrackingengines.so` with SHA-256 `0fb6f54a3e190bec791d757ea18d32a8ecc1af4a861992d04b1703c93293cd03`. If a headset update changes that library, QPEF will not attach until the new build is verified. The reason will appear in `qpef.log`.

Magisk root is required. The module includes the official Android ARM64 `frida-inject` 17.17.0 executable; its source and licensing are available from [Frida](https://github.com/frida/frida/tree/17.17.0).

## Build from source

With Python 3 and an Android NDK containing `aarch64-linux-android29-clang`:

```sh
aarch64-linux-android29-clang -O2 -fPIC -shared src/gaze_damper.c -lm -o lib/libqpef_filter.so
python3 build_module.py
```

The build creates `qpef-magisk.zip`. The official Frida executable is kept in `bin/` so GitHub Actions can build the module without fetching a new executable. Its [original download](https://github.com/frida/frida/releases/download/17.17.0/frida-inject-17.17.0-android-arm64.xz) is also available. See [RELEASING.md](RELEASING.md) for the release process.

## License

QPEF's original code is licensed under [0BSD](LICENSE). The bundled Frida executable retains its own license.
