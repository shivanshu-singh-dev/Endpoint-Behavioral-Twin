import os
import json
import time
from datetime import datetime, timezone
from pathlib import Path
import hashlib

WATCH_DIR = "/home/lab/ebt_config"
LOG_FILE = "reports/raw/config_events.log"

Path("reports/raw").mkdir(parents=True, exist_ok=True)

def snapshot():
    state = {}
    if os.path.isdir(WATCH_DIR):
        for root, _, files in os.walk(WATCH_DIR):
            for f in files:
                p = os.path.join(root, f)
                try:
                    state[p] = os.stat(p).st_mtime
                except FileNotFoundError:
                    pass
    return hashlib.sha256(json.dumps(state, sort_keys=True).encode()).hexdigest()

last = snapshot()
print("[agent] Config monitor started")

try:
    while True:
        now = snapshot()
        if now != last:
            event = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "type": "config_change"
            }
            with open(LOG_FILE, "a") as f:
                f.write(json.dumps(event) + "\n")
            last = now
        time.sleep(1)
except KeyboardInterrupt:
    print("[agent] Config monitor stopped")

