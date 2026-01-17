import json
import sys
from datetime import datetime
from pathlib import Path
from collections import Counter

RAW_LOG = "reports/raw/network_events.log"
RUN_INDEX = "reports/processed/run_index.json"
SUMMARY_FILE = "reports/processed/file_summary.json"


def load_start_time(filename):
    with open(RUN_INDEX) as f:
        return datetime.fromisoformat(json.load(f)[filename])


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


def summarize(events):
    ip_counts = Counter(e["remote_ip"] for e in events)
    ports = set(e["remote_port"] for e in events)

    return {
        "total_connections": len(events),
        "unique_ips": len(ip_counts),
        "max_conn_to_single_ip": max(ip_counts.values(), default=0),
        "ports_used": sorted(list(ports))
    }


def main():
    if len(sys.argv) != 2:
        print("Usage: python3 network_event_processor.py <filename>")
        return

    filename = sys.argv[1]
    start = load_start_time(filename)
    events = load_events_after(start)
    net_summary = summarize(events)

    data = {}
    if Path(SUMMARY_FILE).exists():
        with open(SUMMARY_FILE) as f:
            data = json.load(f)

    data.setdefault(filename, {})
    data[filename]["network"] = net_summary

    with open(SUMMARY_FILE, "w") as f:
        json.dump(data, f, indent=2)

    print("[agent] Network summary updated")


if __name__ == "__main__":
    main()

