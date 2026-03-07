import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

from db import db_cursor
from utils.time_utils import now_ist

# ---- CONFIG ----
WATCH_PATH = "/home/lab/lab_docs"
RUN_ID_ENV = "EBT_RUN_ID"


class FileEventHandler(FileSystemEventHandler):
    def __init__(self, run_id):
        super().__init__()
        self.run_id = run_id

    def log_event(self, event_type, src_path, dest_path=None):
        event_timestamp = now_ist()
        mapped_type = "renamed" if event_type == "moved" else event_type
        with db_cursor() as (conn, cursor):
            cursor.execute(
                """
                INSERT INTO event (run_id, timestamp, category)
                VALUES (%s, %s, %s)
                """,
                (self.run_id, event_timestamp, "file")
            )
            event_id = cursor.lastrowid
            cursor.execute(
                """
                INSERT INTO file_event (event_id, event_type, src_path, dest_path)
                VALUES (%s, %s, %s, %s)
                """,
                (event_id, mapped_type, src_path, dest_path)
            )
            conn.commit()

    def on_created(self, event):
        if not event.is_directory:
            self.log_event("created", event.src_path)

    def on_modified(self, event):
        if not event.is_directory:
            self.log_event("modified", event.src_path)

    def on_deleted(self, event):
        if not event.is_directory:
            self.log_event("deleted", event.src_path)

    def on_moved(self, event):
        if not event.is_directory:
            self.log_event("moved", event.src_path, event.dest_path)


def main():
    run_id = os.environ.get(RUN_ID_ENV)
    if not run_id:
        raise RuntimeError("EBT_RUN_ID is required to start file monitor")

    event_handler = FileEventHandler(int(run_id))
    observer = Observer()
    observer.schedule(event_handler, WATCH_PATH, recursive=True)
    observer.start()

    print(f"[agent] File monitor started on {WATCH_PATH}")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()

    observer.join()


if __name__ == "__main__":
    main()
