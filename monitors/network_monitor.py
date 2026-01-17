import psutil
import json
import time
from datetime import datetime, timezone
from pathlib import Path

LOG_FILE = "reports/raw/network_events.log"
seen = set()

Path("reports/raw").mkdir(parents=True, exist_ok=True)

print("[agent] Network monitor started")

try:
    while True:
        for c in psutil.net_connections(kind="inet"):
            if not c.raddr:
                continue

            key = (c.pid, c.raddr.ip, c.raddr.port)
            if key in seen:
                continue

            seen.add(key)

            event = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "pid": c.pid,
                "remote_ip": c.raddr.ip,
                "remote_port": c.raddr.port
            }

            with open(LOG_FILE, "a") as f:
                f.write(json.dumps(event) + "\n")

        time.sleep(0.3)

except KeyboardInterrupt:
    print("[agent] Network monitor stopped")

