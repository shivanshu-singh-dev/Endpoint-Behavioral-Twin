import json
import sys
from datetime import datetime
from pathlib import Path

from db import db_cursor

RAW_LOG = "reports/raw/network_events.log"


def load_events_after(start_time):
    events = []
    if not Path(RAW_LOG).exists():
        return events

    with open(RAW_LOG) as f:
        for line in f:
            e = json.loads(line)
            if datetime.fromisoformat(e["timestamp"]) >= start_time:
                events.append(e)
    return events


def main():
    if len(sys.argv) != 2:
        print("Usage: python3 network_event_processor.py <run_id>")
        return

    run_id = int(sys.argv[1])
    with db_cursor() as (_, cursor):
        cursor.execute(
            "SELECT start_time FROM run_index WHERE run_id = %s",
            (run_id,)
        )
        row = cursor.fetchone()
        if not row:
            raise RuntimeError(f"No start time recorded for run_id={run_id}")
        start = row["start_time"]
    events = load_events_after(start)
    if not events:
        print("[agent] No network events to store")
        return

    with db_cursor() as (conn, cursor):
        for e in events:
            cursor.execute(
                """
                INSERT INTO event (run_id, timestamp, category)
                VALUES (%s, %s, %s)
                """,
                (run_id, datetime.fromisoformat(e["timestamp"]), "network")
            )
            event_id = cursor.lastrowid
            cursor.execute(
                """
                INSERT INTO network_event (event_id, pid, remote_ip, remote_port)
                VALUES (%s, %s, %s, %s)
                """,
                (event_id, e["pid"], e["remote_ip"], e["remote_port"])
            )
        conn.commit()

    print("[agent] Network events stored")


if __name__ == "__main__":
    main()

