import os
import time
from pathlib import Path
import hashlib

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db import db_cursor
from utils.time_utils import now_ist

LAB_DOCS_DIR = "/home/lab/lab_docs"
PERSISTENCE_DIR = os.path.join(LAB_DOCS_DIR, "lab_persistence")
CRONTAB_FILE = os.path.join(PERSISTENCE_DIR, "crontab.txt")
AUTOSTART = os.path.join(PERSISTENCE_DIR, "autostart")
RUN_ID_ENV = "EBT_RUN_ID"

run_id = os.environ.get(RUN_ID_ENV)
if not run_id:
    raise RuntimeError("EBT_RUN_ID is required to start persistence monitor")
run_id = int(run_id)

Path("reports/raw").mkdir(parents=True, exist_ok=True)

def hash_data(data):
    return hashlib.sha256(data.encode()).hexdigest()

def read_crontab():
    try:
        with open(CRONTAB_FILE, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
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


def log_event(mechanism_type):
    event_timestamp = now_ist()
    with db_cursor() as (conn, cursor):
        cursor.execute(
            """
            INSERT INTO event (run_id, timestamp, category)
            VALUES (%s, %s, %s)
            """,
            (run_id, event_timestamp, "persistence")
        )
        event_id = cursor.lastrowid
        cursor.execute(
            """
            INSERT INTO persistence_event (event_id, mechanism_type)
            VALUES (%s, %s)
            """,
            (event_id, mechanism_type)
        )
        conn.commit()

try:
    while True:
        cron_now = read_crontab()
        auto_now = read_autostart()

        if hash_data(cron_now) != last_cron:
            log_event("crontab_change")
            last_cron = hash_data(cron_now)

        if hash_data(",".join(auto_now)) != last_auto:
            log_event("autostart_change")
            last_auto = hash_data(",".join(auto_now))

        time.sleep(1)

except KeyboardInterrupt:
    print("[agent] Persistence monitor stopped")
