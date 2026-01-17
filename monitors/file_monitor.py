import time
import json
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from datetime import datetime, timezone
from pathlib import Path

# ---- CONFIG ----
WATCH_PATH = "/home/lab/lab_docs"
RAW_LOG = "/home/agent/ebt-agent/reports/raw/file_events.log"


class FileEventHandler(FileSystemEventHandler):
    def log_event(self, event_type, src_path, dest_path=None):
        event = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": event_type,
            "src_path": src_path,
            "dest_path": dest_path
        }

        with open(RAW_LOG, "a") as f:
            f.write(json.dumps(event) + "\n")

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
    Path(RAW_LOG).parent.mkdir(parents=True, exist_ok=True)

    event_handler = FileEventHandler()
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

