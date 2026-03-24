import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db import db_cursor


def analyze(summary):
    score = 0
    reasons = []

    total = summary["total_events"]
    duration = summary["duration_seconds"] or 1
    ops_per_sec = total / duration

    if ops_per_sec >= 25:
        score += 35
        reasons.append(f"Extreme automation rate ({ops_per_sec:.1f} ops/sec)")
    elif ops_per_sec >= 10:
        score += 20
        reasons.append(f"Automated file activity ({ops_per_sec:.1f} ops/sec)")

    network = summary["network"]
    process = summary["process"]

    if network.get("total_connections", 0) >= 10:
        score += 20
        reasons.append("High volume outbound network activity")
    elif network.get("total_connections", 0) >= 3:
        score += 10
        reasons.append("Repeated outbound network activity")

    if network.get("unique_ips", 0) >= 5:
        score += 10
        reasons.append("Connections to many unique remote IPs")

    uncommon_ports = [
        port for port in network.get("ports_used", [])
        if port not in (53, 80, 443)
    ]
    if uncommon_ports:
        score += 10
        reasons.append(f"Uncommon remote ports used: {sorted(set(uncommon_ports))}")

    if process.get("child_count", 0) >= 30:
        score += 20
        reasons.append("Large child process burst detected")
    elif process.get("child_count", 0) >= 10:
        score += 10
        reasons.append("Elevated child process creation detected")

    if process.get("max_depth", 0) >= 10:
        score += 10
        reasons.append("Deep process fan-out pattern detected")

    if summary.get("persistence", {}).get("total_events", 0) > 0:
        score += 35
        reasons.append("Persistence behavior observed")

    if summary.get("config", {}).get("total_events", 0) > 0:
        score += 5
        reasons.append("Configuration changes observed")

    score = min(score, 100)

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

def get_file_summary(run_id):
    summary = {
        "created": 0,
        "modified": 0,
        "deleted": 0,
        "renamed": 0,
        "total_events": 0,
        "duration_seconds": 0,
        "network": {},
        "process": {},
        "persistence": {"total_events": 0, "mechanisms": []},
        "config": {"total_events": 0, "types": []}
    }

    with db_cursor() as (_, cursor):
        cursor.execute(
            """
            SELECT MIN(e.timestamp) AS min_ts,
                   MAX(e.timestamp) AS max_ts,
                   COUNT(*) AS total_events
            FROM event e
            JOIN file_event fe ON fe.event_id = e.event_id
            WHERE e.run_id = %s
            """,
            (run_id,)
        )
        row = cursor.fetchone()
        if row and row["total_events"]:
            summary["total_events"] = row["total_events"]
            if row["min_ts"] and row["max_ts"]:
                summary["duration_seconds"] = (
                    row["max_ts"] - row["min_ts"]
                ).total_seconds()

        cursor.execute(
            """
            SELECT fe.event_type, COUNT(*) AS count
            WHERE e.run_id = %s
            """,
            (run_id,)
        )
        proc_row = cursor.fetchone() or {}
        cursor.execute(
            """
            SELECT MAX(cnt) AS max_depth
            FROM (
                SELECT COUNT(*) AS cnt
                FROM process_event pe
                JOIN event e ON pe.event_id = e.event_id
                WHERE e.run_id = %s
                GROUP BY pe.ppid
            ) AS parent_counts
            """,
            (run_id,)
        )
        depth_row = cursor.fetchone() or {}

        summary["process"] = {
            "child_count": proc_row.get("child_count", 0) or 0,
            "max_depth": depth_row.get("max_depth", 0) or 0
        }

        cursor.execute(
            """
            SELECT COUNT(*) AS total_events
            FROM persistence_event pe
            JOIN event e ON pe.event_id = e.event_id
            WHERE e.run_id = %s
            """,
            (run_id,)
        )
        persistence_total = cursor.fetchone() or {}

        cursor.execute(
            """
            SELECT DISTINCT pe.mechanism_type
            FROM persistence_event pe
            JOIN event e ON pe.event_id = e.event_id
            WHERE e.run_id = %s
            ORDER BY pe.mechanism_type
            """,
            (run_id,)
        )
        persistence_mechanisms = [row["mechanism_type"] for row in cursor.fetchall()]
        summary["persistence"] = {
            "total_events": persistence_total.get("total_events", 0) or 0,
            "mechanisms": persistence_mechanisms
        }

        cursor.execute(
            """
            SELECT COUNT(*) AS total_events
            FROM config_event ce
            JOIN event e ON ce.event_id = e.event_id
            WHERE e.run_id = %s
            """,
            (run_id,)
        )
        config_total = cursor.fetchone() or {}

        cursor.execute(
            """
            SELECT DISTINCT ce.config_type
            FROM config_event ce
            JOIN event e ON ce.event_id = e.event_id
            WHERE e.run_id = %s
            ORDER BY ce.config_type
            """,
            (run_id,)
        )
        config_types = [row["config_type"] for row in cursor.fetchall()]

        summary["config"] = {
            "total_events": config_total.get("total_events", 0) or 0,
            "types": config_types
        }

    return summary


def store_analysis(run_id, analysis):
    with db_cursor() as (conn, cursor):
        cursor.execute(
            """
            INSERT INTO file_analysis (run_id, verdict, risk_score, confidence)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                verdict = VALUES(verdict),
                risk_score = VALUES(risk_score),
                confidence = VALUES(confidence)
            """,
            (
                run_id,
                analysis["verdict"],
                analysis["risk_score"],
                analysis["confidence"]
            )
        )
        cursor.execute(
            "DELETE FROM analysis_reason WHERE run_id = %s",
            (run_id,)
        )
