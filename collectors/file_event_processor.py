import json
import sys
from datetime import datetime
from pathlib import Path

from db import db_cursor

RAW_LOG = "reports/raw/file_events.log"


def load_events_after(start_time):
    events = []
    with open(RAW_LOG, "r") as f:
        for line in f:
            e = json.loads(line)
            ts = datetime.fromisoformat(e["timestamp"])
            if ts >= start_time:
                events.append(e)
    return events


def map_event_type(event_type):
    if event_type == "moved":
        return "renamed"
    return event_type


def main():
    if len(sys.argv) != 2:
        print("Usage: python3 file_event_processor.py <run_id>")
        sys.exit(1)

    run_id = int(sys.argv[1])

    Path("reports/processed").mkdir(parents=True, exist_ok=True)

    with db_cursor() as (_, cursor):
        cursor.execute(
            "SELECT start_time FROM run_index WHERE run_id = %s",
            (run_id,)
        )
        row = cursor.fetchone()
        if not row:
            raise RuntimeError(f"No start time recorded for run_id={run_id}")
        start_time = row["start_time"]

    events = load_events_after(start_time)

    with db_cursor() as (conn, cursor):
        for e in events:
            cursor.execute(
                """
                INSERT INTO event (run_id, timestamp, category)
                VALUES (%s, %s, %s)
                """,
                (run_id, datetime.fromisoformat(e["timestamp"]), "file")
            )
            event_id = cursor.lastrowid
            cursor.execute(
                """
                INSERT INTO file_event (event_id, event_type, src_path, dest_path)
                VALUES (%s, %s, %s, %s)
                """,
                (
                    event_id,
                    map_event_type(e["event_type"]),
                    e["src_path"],
                    e.get("dest_path")
                )
            )
        conn.commit()

    print(f"[agent] File events stored for run_id={run_id}")


if __name__ == "__main__":
    main()

