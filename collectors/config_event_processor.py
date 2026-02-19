import json
import sys
from datetime import datetime
from pathlib import Path

RAW_LOG = "reports/raw/config_events.log"
RUN_INDEX = "reports/processed/run_index.json"
SUMMARY_FILE = "reports/processed/file_summary.json"

def load_start_time(filename):
    with open(RUN_INDEX) as f:
        return datetime.fromisoformat(json.load(f)[filename])

def load_events_after(start):
    events = []
    if not Path(RAW_LOG).exists():
        return events

    with open(RAW_LOG) as f:
        for line in f:
            e = json.loads(line)
            if datetime.fromisoformat(e["timestamp"]) >= start:
                events.append(e)
    return events

def main():
    if len(sys.argv) != 2:
        return

    filename = sys.argv[1]
    start = load_start_time(filename)
    events = load_events_after(start)

    data = {}
    if Path(SUMMARY_FILE).exists():
        with open(SUMMARY_FILE) as f:
            data = json.load(f)

    data.setdefault(filename, {})
    data[filename]["config"] = {
        "config_changes": len(events)
    }

    with open(SUMMARY_FILE, "w") as f:
        json.dump(data, f, indent=2)

    print("[agent] Config summary updated")

if __name__ == "__main__":
    main()

