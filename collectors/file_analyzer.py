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
        "process": {}
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
            FROM file_event fe
            JOIN event e ON fe.event_id = e.event_id
            WHERE e.run_id = %s
            GROUP BY fe.event_type
            """,
            (run_id,)
        )
        for row in cursor.fetchall():
            summary[row["event_type"]] = row["count"]

        cursor.execute(
            """
            SELECT COUNT(*) AS total_connections,
                   COUNT(DISTINCT ne.remote_ip) AS unique_ips
            FROM network_event ne
            JOIN event e ON ne.event_id = e.event_id
            WHERE e.run_id = %s
            """,
            (run_id,)
        )
        net_row = cursor.fetchone() or {}
        max_conn = 0
        cursor.execute(
            """
            SELECT MAX(cnt) AS max_conn
            FROM (
                SELECT COUNT(*) AS cnt
                FROM network_event ne
                JOIN event e ON ne.event_id = e.event_id
                WHERE e.run_id = %s
                GROUP BY ne.remote_ip
            ) AS ip_counts
            """,
            (run_id,)
        )
        max_row = cursor.fetchone()
        if max_row and max_row["max_conn"]:
            max_conn = max_row["max_conn"]

        cursor.execute(
            """
            SELECT DISTINCT ne.remote_port
            FROM network_event ne
            JOIN event e ON ne.event_id = e.event_id
            WHERE e.run_id = %s
            ORDER BY ne.remote_port
            """,
            (run_id,)
        )
        ports = [row["remote_port"] for row in cursor.fetchall()]

        summary["network"] = {
            "total_connections": net_row.get("total_connections", 0) or 0,
            "unique_ips": net_row.get("unique_ips", 0) or 0,
            "max_conn_to_single_ip": max_conn or 0,
            "ports_used": ports
        }

        cursor.execute(
            """
            SELECT COUNT(DISTINCT pe.pid) AS child_count
            FROM process_event pe
            JOIN event e ON pe.event_id = e.event_id
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
        for reason in analysis["reasons"]:
            cursor.execute(
                """
                INSERT INTO analysis_reason (run_id, reason_text)
                VALUES (%s, %s)
                """,
                (run_id, reason)
            )
        conn.commit()


def main():
    if len(sys.argv) != 2:
        print("Usage: python3 file_analyzer.py <run_id>")
        sys.exit(1)

    run_id = int(sys.argv[1])
    summary = get_file_summary(run_id)
    result = analyze(summary)
    store_analysis(run_id, result)

    print(f"[agent] Updated analysis for run_id={run_id}")


if __name__ == "__main__":
    main()
