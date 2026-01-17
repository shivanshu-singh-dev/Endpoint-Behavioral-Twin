import json
import sys
from pathlib import Path

SUMMARY_FILE = "reports/processed/file_summary.json"
FINAL_FILE = "reports/final/file_analysis.json"


def analyze(summary):
    score = 0
    reasons = []

    created = summary["created"]
    modified = summary["modified"]
    deleted = summary["deleted"]
    renamed = summary["renamed"]
    total = summary["total_events"]
    duration = summary["duration_seconds"] or 1

    ops_per_sec = total / duration

    #Network addon
    network = summary.get("network", {})
    total = network.get("total_connections", 0)
    max_ip = network.get("max_conn_to_single_ip", 0)
    ports = network.get("ports_used", [])
    #Network addon end

    #Adding Process here
    process = summary.get("process", {})
    child_count = process.get("child_count", 0)
    max_depth = process.get("max_depth", 0)

    if child_count >= 1:
        score += 5
        reasons.append("Process execution observed")


    if child_count >= 5:
        score += 20
        reasons.append(f"Process burst ({child_count} children)")

    if child_count >= 3 and duration <= 2:
        score += 25
        reasons.append("Rapid process spawning")

    if max_depth >= 5:
        score += 30
        reasons.append("Very deep process tree")
    elif max_depth >= 3:
        score += 20
        reasons.append("Deep process tree")


    if child_count >= 5 and summary["renamed"] == 0 and summary["deleted"] == 0:
        score -= 15
        reasons.append("Process burst without destructive file behavior")

    #Process ends

    #Adding Network
    if total >= 1:
        score += 5
        reasons.append("Outbound network activity observed")

    # Repeated beaconing
    if max_ip >= 5:
        score += 20
        reasons.append("Repeated connections to same IP")

    if total >= 3 and duration <= 3:
        score += 25
        reasons.append("Rapid outbound connections")

    # Uncommon ports
    if any(p >= 1024 for p in ports):
        score += 15
        reasons.append("Uncommon destination port used")

    # High volume
    if total >= 10:
        score += 30
        reasons.append("High volume outbound connections")

    # Dampening: network-only
    if total >= 5 and summary["renamed"] == 0 and summary["deleted"] == 0:
        score -= 15
        reasons.append("Network activity without destructive file behavior")
    #Network Ends

    if renamed >= 5:
        score += 45
        reasons.append(f"{renamed} files renamed")

    if renamed >= 3 and duration <= 3:
        score += 30
        reasons.append(f"Rapid renaming ({renamed} files in {duration:.2f}s)")

    if deleted >= 5:
        score += 30
        reasons.append(f"{deleted} files deleted")

    if deleted >= 3 and duration <= 3:
        score += 25
        reasons.append(f"Rapid deletion ({deleted} files in {duration:.2f}s)")

    if created + modified >= 15:
        score += 20
        reasons.append("High volume file writes")

    if ops_per_sec >= 25:
        score += 35
        reasons.append(f"Extreme automation rate ({ops_per_sec:.1f} ops/sec)")
    elif ops_per_sec >= 10:
        score += 20
        reasons.append(f"Automated file activity ({ops_per_sec:.1f} ops/sec)")

    if score >= 70:
        verdict = "High Risk"
        confidence = "High"
    elif score >= 40:
        verdict = "Suspicious"
        confidence = "Medium"
    else:
        verdict = "Benign"
        confidence = "Low"

    return {
        "verdict": verdict,
        "risk_score": score,
        "confidence": confidence,
        "reasons": reasons
    }


def main():
    if len(sys.argv) != 2:
        print("Usage: python3 file_analyzer.py <input_filename>")
        sys.exit(1)

    filename = sys.argv[1]

    if not Path(SUMMARY_FILE).exists():
        raise RuntimeError("file_summary.json not found")

    with open(SUMMARY_FILE) as f:
        summaries = json.load(f)

    if filename not in summaries:
        raise RuntimeError(f"No summary found for {filename}")

    result = analyze(summaries[filename])

    Path("reports/final").mkdir(parents=True, exist_ok=True)

    final_data = {}
    if Path(FINAL_FILE).exists():
        with open(FINAL_FILE) as f:
            final_data = json.load(f)

    final_data[filename] = result

    with open(FINAL_FILE, "w") as f:
        json.dump(final_data, f, indent=2)

    print(f"[agent] Updated analysis for {filename}")


if __name__ == "__main__":
    main()
