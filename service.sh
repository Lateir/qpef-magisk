#!/system/bin/sh
MODDIR=${0%/*}
LOG="$MODDIR/qpef.log"
ENGINE=/odm/lib64/libtrackingengines.so
EXPECTED_SHA256=0fb6f54a3e190bec791d757ea18d32a8ecc1af4a861992d04b1703c93293cd03

log() {
  printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >> "$LOG"
}

# This hook uses an offset verified only against this exact engine build.
if [ ! -r "$ENGINE" ]; then
  log "Engine missing: $ENGINE"
  exit 1
fi
ACTUAL_SHA256=$(sha256sum "$ENGINE" 2>/dev/null)
ACTUAL_SHA256=${ACTUAL_SHA256%% *}
if [ "$ACTUAL_SHA256" != "$EXPECTED_SHA256" ]; then
  log "Unsupported engine SHA256: $ACTUAL_SHA256"
  exit 1
fi

log 'QPEF service started'
if ! cp "$MODDIR/lib/libqpef_filter.so" /data/local/tmp/qpef-filter.so; then
  log 'Could not stage filter library'
  exit 1
fi
chmod 0644 /data/local/tmp/qpef-filter.so
while true; do
  PID=$(pidof trackingservice 2>/dev/null)
  if [ -z "$PID" ]; then
    sleep 2
    continue
  fi
  PID=${PID%% *}
  log "Attaching to trackingservice PID $PID"
  "$MODDIR/bin/frida-inject" -p "$PID" -s "$MODDIR/src/filter.js" >> "$LOG" 2>&1
  log "Injector exited; retrying after 3 seconds"
  sleep 3
done
