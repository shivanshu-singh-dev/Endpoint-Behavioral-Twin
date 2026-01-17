import json
import sys
from datetime import datetime
from pathlib import Path

RAW_LOG = "reports/raw/process_events.log"
RUN_INDEX = "reports/processed/run_index.json"
SUMMARY_FILE = "reports/processed/file_summary.json"


def load_start_time(filename):
    with open(RUN_INDEX) as f:
        return datetime.fromisoformat(json.load(f)[filename])


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


def analyze_processes(events):
    children = set()
    parents = {}

    for e in events:
        parents.setdefault(e["ppid"], []).append(e["pid"])
        children.add(e["pid"])

    max_depth = max((len(v) for v in parents.values()), default=0)

    return {
        "child_count": len(children),
        "max_depth": max_depth
    }


def main():
    if len(sys.argv) != 2:
        print("Usage: python3 process_event_processor.py <filename>")
        return

    filename = sys.argv[1]
    start = load_start_time(filename)
    events = load_events_after(start)
    proc_summary = analyze_processes(events)

    data = {}
    if Path(SUMMARY_FILE).exists():
        with open(SUMMARY_FILE) as f:
            data = json.load(f)

    data.setdefault(filename, {})
    data[filename]["process"] = proc_summary

    with open(SUMMARY_FILE, "w") as f:
        json.dump(data, f, indent=2)

    print("[agent] Process summary updated")


if __name__ == "__main__":
    main()

