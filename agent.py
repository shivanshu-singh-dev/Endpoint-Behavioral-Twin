import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import time
import subprocess
import signal
import shutil
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from db import db_cursor

TEST_FOLDER = "/home/lab/Test Folder"

ATTACK_USER = "lab"
PYTHON_BIN = "/usr/bin/python3"

ANALYZER = "collectors/file_analyzer.py"
TARGET_SITE_DIR = Path("/home/lab/lab_docs")


def snapshot_target_directory(target_dir):
    target = Path(target_dir)
    if not target.exists():
        raise FileNotFoundError(f"Target directory does not exist: {target}")

    snapshot_dir = Path(tempfile.mkdtemp(prefix="ebt_snapshot_"))
    snapshot_path = snapshot_dir / "target_state"
    shutil.copytree(target, snapshot_path, dirs_exist_ok=False)
    print(f"[agent] Snapshot saved: {snapshot_path}")
    return snapshot_path


def restore_target_directory(target_dir, snapshot_path):
    target = Path(target_dir)
    snapshot = Path(snapshot_path)

    subprocess.run(
        f"sudo rsync -a --delete --chown=lab:lab {snapshot}/ {target}/",
        shell=True,
        check=True
    )

    print(f"[agent] Target directory restored: {target}")

    snapshot_root = snapshot.parent
    shutil.rmtree(snapshot_root, ignore_errors=True)


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

    time.sleep(0.5)

    for monitor in monitors:
        if monitor.poll() is not None:
            print("[agent] Warning: a monitor failed to start")

    return monitors


def stop_monitors(monitors):
    print("[agent] Stopping monitors")
    for monitor in monitors:
        if monitor.poll() is None:
            monitor.send_signal(signal.SIGINT)
            monitor.wait()


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
        "--wait",
        "--collect",
        f"--uid={ATTACK_USER}",
        f"--gid={ATTACK_USER}",
        "--property=ProtectSystem=strict",
        "--property=ProtectHome=read-only",
        "--property=ReadWritePaths=/home/lab/lab_docs",
        "--property=NoNewPrivileges=yes",
        "--property=RuntimeMaxSec=30s",
        PYTHON_BIN,
        filepath
    ]

    try:
        subprocess.run(cmd, check=True, timeout=20)
    except subprocess.TimeoutExpired:
        print("[agent] Sandbox execution timed out")
    except subprocess.CalledProcessError as e:
        print(f"[agent] Sandbox execution failed: {e}")


def process_results(run_id):
    subprocess.run(
        [PYTHON_BIN, ANALYZER, str(run_id)],
        check=True
    )


def main():
    print("[agent] Waiting for file in Test Folder...")

    monitors = []

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
                snapshot_path = snapshot_target_directory(TARGET_SITE_DIR)
                monitors = start_monitors(run_id)

                try:
                    run_in_sandbox(filepath)
                    time.sleep(1)
                    process_results(run_id)
                finally:
                    stop_monitors(monitors)
                    monitors = []
                    restore_target_directory(TARGET_SITE_DIR, snapshot_path)

                print(f"[agent] Analysis complete for {f}")
                return

            time.sleep(1)

    except Exception as e:
        print("[agent] Error:", e)

    finally:
        if monitors:
            stop_monitors(monitors)


if __name__ == "__main__":
    main()
