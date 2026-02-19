import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import psutil
import time
from datetime import datetime, timezone

from db import db_cursor

RUN_ID_ENV = "EBT_RUN_ID"

seen = set()

run_id = os.environ.get(RUN_ID_ENV)
if not run_id:
    raise RuntimeError("EBT_RUN_ID is required to start process monitor")
run_id = int(run_id)

print("[agent] Process monitor started")

try:
    while True:
        for p in psutil.process_iter(attrs=["pid", "ppid", "name", "create_time"]):
            pid = p.info["pid"]
            if pid in seen:
                continue

            seen.add(pid)

            event_timestamp = datetime.now(timezone.utc)
            with db_cursor() as (conn, cursor):
                cursor.execute(
                    """
                    INSERT INTO event (run_id, timestamp, category)
                    VALUES (%s, %s, %s)
                    """,
                    (run_id, event_timestamp, "process")
                )
                event_id = cursor.lastrowid
                cursor.execute(
                    """
                    INSERT INTO process_event (event_id, pid, ppid, process_name)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (event_id, pid, p.info["ppid"], p.info["name"])
                )
                conn.commit()

        time.sleep(0.2)

except KeyboardInterrupt:
    print("[agent] Process monitor stopped")
