import psutil
import json
import time
from datetime import datetime, timezone
from pathlib import Path

LOG_FILE = "reports/raw/process_events.log"

seen = set()

Path("reports/raw").mkdir(parents=True, exist_ok=True)

print("[agent] Process monitor started")

try:
    while True:
        for p in psutil.process_iter(attrs=["pid", "ppid", "name", "create_time"]):
            pid = p.info["pid"]
            if pid in seen:
                continue

            seen.add(pid)

            event = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "pid": pid,
                "ppid": p.info["ppid"],
                "name": p.info["name"]
            }

            with open(LOG_FILE, "a") as f:
                f.write(json.dumps(event) + "\n")

        time.sleep(0.2)

except KeyboardInterrupt:
    print("[agent] Process monitor stopped")

