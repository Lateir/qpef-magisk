#!/system/bin/sh
set_perm "$MODPATH/service.sh" 0 0 0755
set_perm "$MODPATH/bin/frida-inject" 0 0 0755
set_perm "$MODPATH/lib/libqpef_filter.so" 0 0 0644
set_perm "$MODPATH/src/filter.js" 0 0 0644
