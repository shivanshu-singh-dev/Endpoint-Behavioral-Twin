import os
import json
import time
from pathlib import Path
import hashlib

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db import db_cursor
from utils.time_utils import now_ist

WATCH_DIR = "/home/lab/lab_docs/lab_config"
RUN_ID_ENV = "EBT_RUN_ID"

run_id = os.environ.get(RUN_ID_ENV)
if not run_id:
    raise RuntimeError("EBT_RUN_ID is required to start config monitor")
run_id = int(run_id)

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


def log_event(config_type):
    event_timestamp = now_ist()
    with db_cursor() as (conn, cursor):
        cursor.execute(
            """
            INSERT INTO event (run_id, timestamp, category)
            VALUES (%s, %s, %s)
            """,
            (run_id, event_timestamp, "config")
        )
        event_id = cursor.lastrowid
        cursor.execute(
            """
            INSERT INTO config_event (event_id, config_type)
            VALUES (%s, %s)
            """,
            (event_id, config_type)
        )
        conn.commit()

try:
    while True:
        now = snapshot()
        if now != last:
            log_event("config_change")
            last = now
        time.sleep(1)
except KeyboardInterrupt:
    print("[agent] Config monitor stopped")
