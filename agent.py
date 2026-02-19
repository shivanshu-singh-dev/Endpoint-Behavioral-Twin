import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import time
import subprocess
import signal
from datetime import datetime, timezone
from pathlib import Path

from db import db_cursor

TEST_FOLDER = "/home/lab/Test Folder"

ATTACK_USER = "lab"
PYTHON_BIN = "/usr/bin/python3"

ANALYZER = "collectors/file_analyzer.py"

def start_monitors(run_id):
    print("[agent] Starting monitors")
    monitors = []
    env = os.environ.copy()
    env["EBT_RUN_ID"] = str(run_id)

    file_mon = subprocess.Popen(
        [PYTHON_BIN, "monitors/file_monitor.py"],
        env=env
    )
    monitors.append(file_mon)

    proc_mon = subprocess.Popen(
        [PYTHON_BIN, "monitors/process_monitor.py"],
        env=env
    )
    monitors.append(proc_mon)

    net_mon = subprocess.Popen(
        [PYTHON_BIN, "monitors/network_monitor.py"],
        env=env
    )
    monitors.append(net_mon)

    time.sleep(0.5) #allow starup

    for m in monitors:
        if m.poll() is not None:
            print("[agent] Warning: a monitor failed to start")

    return monitors

def stop_monitors(monitors):
    print("[agent] Stopping monitors")
    for m in monitors:
        m.send_signal(signal.SIGINT)
        m.wait()

def record_start_time(filename):
    start_time = datetime.now(timezone.utc)
    created_at = start_time

    with db_cursor() as (conn, cursor):
        cursor.execute(
            """
            INSERT INTO run_index (filename, start_time, created_at)
            VALUES (%s, %s, %s)
            """,
            (filename, start_time, created_at)
        )
        run_id = cursor.lastrowid
        conn.commit()

    print(f"[agent] Start time recorded for {filename} (run_id={run_id})")
    return run_id


def run_in_sandbox(filepath):
    print("[agent] Running file in sandbox")

    cmd = [
        "sudo", "systemd-run",
        f"--uid={ATTACK_USER}",
        f"--gid={ATTACK_USER}",
        "--property=ProtectSystem=strict",
        "--property=ProtectHome=read-only",
        "--property=ReadWritePaths=/home/lab/lab_docs",
        "--property=NoNewPrivileges=yes",
        PYTHON_BIN,
        filepath
    ]

    try:
        subprocess.run(cmd, check=True, timeout=10)
    except subprocess.TimeoutExpired:
        print("[agent] Sandbox execution timed out")



def process_results(run_id):
    # Analyzer
    subprocess.run(
        [PYTHON_BIN, ANALYZER, str(run_id)],
        check=True
    )



def main():
    print("[agent] Waiting for file in Test Folder...")

    try:
        seen = set()

        while True:
            files = [
                f for f in os.listdir(TEST_FOLDER)
                if os.path.isfile(os.path.join(TEST_FOLDER, f))
            ]

            for f in files:
                if f in seen:
                    continue

                seen.add(f)
                filepath = os.path.join(TEST_FOLDER, f)

                print(f"[agent] New file detected: {f}")

                run_id = record_start_time(f)
                monitors = start_monitors(run_id)
                run_in_sandbox(filepath)

                # buffer to make sure all file/process events are logged
                time.sleep(1)

                process_results(run_id)

                stop_monitors(monitors)
                print(f"[agent] Analysis complete for {f}")
                return  #one file per agent run

            time.sleep(1)

    except Exception as e:
        print("[agent] Error:", e)

    finally:
        if "monitors" in locals():
            stop_monitors(monitors)

if __name__ == "__main__":
    main()
