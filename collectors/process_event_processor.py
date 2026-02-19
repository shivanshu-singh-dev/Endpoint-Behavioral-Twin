import json
import sys
from datetime import datetime
from pathlib import Path

from db import db_cursor

RAW_LOG = "reports/raw/process_events.log"


def load_events_after(start_time):
    events = []

    if not Path(RAW_LOG).exists():
        # No process activity recorded
        return events

    with open(RAW_LOG) as f:
        for line in f:
            e = json.loads(line)
            if datetime.fromisoformat(e["timestamp"]) >= start_time:
                events.append(e)

    return events


def main():
    if len(sys.argv) != 2:
        print("Usage: python3 process_event_processor.py <run_id>")
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
        print("[agent] No process events to store")
        return

    with db_cursor() as (conn, cursor):
        for e in events:
            cursor.execute(
                """
                INSERT INTO event (run_id, timestamp, category)
                VALUES (%s, %s, %s)
                """,
                (run_id, datetime.fromisoformat(e["timestamp"]), "process")
            )
            event_id = cursor.lastrowid
            cursor.execute(
                """
                INSERT INTO process_event (event_id, pid, ppid, process_name)
                VALUES (%s, %s, %s, %s)
                """,
                (event_id, e["pid"], e["ppid"], e["name"])
            )
        conn.commit()

    print("[agent] Process events stored")


if __name__ == "__main__":
    main()
