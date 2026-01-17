import json
import sys
from datetime import datetime
from pathlib import Path

RAW_LOG = "reports/raw/file_events.log"
RUN_INDEX = "reports/processed/run_index.json"
SUMMARY_FILE = "reports/processed/file_summary.json"


def load_run_index():
    if not Path(RUN_INDEX).exists():
        raise RuntimeError("run_index.json not found")
    with open(RUN_INDEX) as f:
        return json.load(f)


def load_events_after(start_time):
    events = []
    with open(RAW_LOG, "r") as f:
        for line in f:
            e = json.loads(line)
            ts = datetime.fromisoformat(e["timestamp"])
            if ts >= start_time:
                events.append(e)
    return events


def summarize(events, filename):
    summary = {
        "created": 0,
        "modified": 0,
        "deleted": 0,
        "renamed": 0,
        "total_events": len(events),
        "duration_seconds": 0
    }

    timestamps = []

    for e in events:
        et = e["event_type"]
        if et == "moved":
            summary["renamed"] += 1
        else:
            summary[et] += 1
        timestamps.append(datetime.fromisoformat(e["timestamp"]))

    if timestamps:
        summary["duration_seconds"] = (
            max(timestamps) - min(timestamps)
        ).total_seconds()

    return summary


def main():
    if len(sys.argv) != 2:
        print("Usage: python3 file_event_processor.py <input_filename>")
        sys.exit(1)

    filename = sys.argv[1]

    Path("reports/processed").mkdir(parents=True, exist_ok=True)

    run_index = load_run_index()
    if filename not in run_index:
        raise RuntimeError(f"No start time recorded for {filename}")

    start_time = datetime.fromisoformat(run_index[filename])
    events = load_events_after(start_time)
    summary = summarize(events, filename)


    data = {}
    if Path(SUMMARY_FILE).exists():
        with open(SUMMARY_FILE) as f:
            data = json.load(f)

    data[filename] = summary

    with open(SUMMARY_FILE, "w") as f:
        json.dump(data, f, indent=2)

    print(f"[agent] Updated summary for {filename}")


if __name__ == "__main__":
    main()

