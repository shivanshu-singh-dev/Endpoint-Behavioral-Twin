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
    raise RuntimeError("EBT_RUN_ID is required to start network monitor")
run_id = int(run_id)

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

            event_timestamp = datetime.now(timezone.utc)
            with db_cursor() as (conn, cursor):
                cursor.execute(
                    """
                    INSERT INTO event (run_id, timestamp, category)
                    VALUES (%s, %s, %s)
                    """,
                    (run_id, event_timestamp, "network")
                )
                event_id = cursor.lastrowid
                cursor.execute(
                    """
                    INSERT INTO network_event (event_id, pid, remote_ip, remote_port)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (event_id, c.pid, c.raddr.ip, c.raddr.port)
                )
                conn.commit()

        time.sleep(0.3)

except KeyboardInterrupt:
    print("[agent] Network monitor stopped")
