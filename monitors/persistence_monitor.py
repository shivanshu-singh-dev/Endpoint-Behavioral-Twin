import os
import subprocess
import json
import time
from datetime import datetime, timezone
from pathlib import Path
import hashlib

LOG_FILE = "reports/raw/persistence_events.log"
AUTOSTART = os.path.expanduser("~/.config/autostart")

Path("reports/raw").mkdir(parents=True, exist_ok=True)

def hash_data(data):
    return hashlib.sha256(data.encode()).hexdigest()

def read_crontab():
    try:
        out = subprocess.check_output(["crontab", "-l", "-u", "lab"], stderr=subprocess.DEVNULL)
        return out.decode()
    except subprocess.CalledProcessError:
        return ""

def read_autostart():
    entries = []
    if os.path.isdir(AUTOSTART):
        for f in os.listdir(AUTOSTART):
            if f.endswith(".desktop"):
                entries.append(f)
    return sorted(entries)

last_cron = hash_data(read_crontab())
last_auto = hash_data(",".join(read_autostart()))

print("[agent] Persistence monitor started")

try:
    while True:
        cron_now = read_crontab()
        auto_now = read_autostart()

        if hash_data(cron_now) != last_cron:
            event = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "type": "crontab_change"
            }
            with open(LOG_FILE, "a") as f:
                f.write(json.dumps(event) + "\n")
            last_cron = hash_data(cron_now)

        if hash_data(",".join(auto_now)) != last_auto:
            event = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "type": "autostart_change"
            }
            with open(LOG_FILE, "a") as f:
                f.write(json.dumps(event) + "\n")
            last_auto = hash_data(",".join(auto_now))

        time.sleep(1)

except KeyboardInterrupt:
    print("[agent] Persistence monitor stopped")

