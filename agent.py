import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import time
import subprocess
import signal
import shutil
import tempfile
from pathlib import Path

from db import db_cursor
from utils.time_utils import now_ist

InputFolder = os.environ.get("INPUT_FOLDER", "/home/lab/Test Folder")
TargetPath = Path(os.environ.get("TARGET_PATH", "/home/lab/lab_docs"))

ATTACK_USER = "lab"
BASE_DIR = Path(__file__).resolve().parent
PYTHON_BIN = sys.executable

ANALYZER_SCRIPT = str(BASE_DIR / "collectors" / "file_analyzer.py")


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
        ["sudo", "rsync", "-a", "--delete", f"--chown={ATTACK_USER}:{ATTACK_USER}", f"{snapshot}/", f"{target}/"],
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

    monitor_scripts = [
        "monitors/file_monitor.py",
        "monitors/process_monitor.py",
        "monitors/network_monitor.py",
        "monitors/persistence_monitor.py",
        "monitors/config_monitor.py",
    ]

    for script in monitor_scripts:
        script_path = str(BASE_DIR / script)
        monitors.append(subprocess.Popen([PYTHON_BIN, script_path], env=env))

    time.sleep(0.5)

    failed = False
    for monitor in monitors:
        if monitor.poll() is not None:
            failed = True
            print("[agent] Critical: A monitor failed to start")
            break

    if failed:
        stop_monitors(monitors)
        raise RuntimeError("Monitor startup failure")

    return monitors


def stop_monitors(monitors):
    print("[agent] Stopping monitors")
    for monitor in monitors:
        if monitor.poll() is None:
            monitor.send_signal(signal.SIGINT)
            monitor.wait()


def set_run_status(run_id, status):
    with db_cursor() as (conn, cursor):
        cursor.execute("UPDATE run_index SET status = %s WHERE run_id = %s", (status, run_id))
        conn.commit()
    print(f"[agent] Run {run_id} status -> {status}")


def record_start_time(filename):
    start_time = now_ist()
    created_at = start_time

    with db_cursor() as (conn, cursor):
        cursor.execute(
            """
            INSERT INTO run_index (filename, start_time, created_at, status)
            VALUES (%s, %s, %s, %s)
            """,
            (filename, start_time, created_at, "PENDING")
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
        f"--property=ReadWritePaths={TargetPath}",
        "--property=NoNewPrivileges=yes",
        "--property=RuntimeMaxSec=30s",
        PYTHON_BIN,
        filepath
    ]

    try:
        result = subprocess.run(
            cmd,
            timeout=40,
            capture_output=True,
            text=True
        )

        output = result.stdout + result.stderr

        if "Finished with result: timeout" in output:
            print("[agent] Sandbox stopped: execution exceeded 30s limit")

        elif "status=15/TERM" in output:
            print("[agent] Sandbox stopped: process terminated by systemd")

        elif result.returncode == 0:
            print("[agent] Sandbox execution completed normally")

        else:
            print(f"[agent] Sandbox exited with code {result.returncode}")

    except subprocess.TimeoutExpired:
        print("[agent] Sandbox controller timeout (python timeout reached before systemd limit)")

    except Exception as e:
        print(f"[agent] Sandbox error: {e}")


def process_results(run_id):
    subprocess.run(
        [PYTHON_BIN, ANALYZER_SCRIPT, str(run_id)],
        check=True
    )


def main():
    import logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[
            logging.FileHandler("agent.log"),
            logging.StreamHandler()
        ]
    )

    print("[agent] Waiting for file in Test Folder...")

    monitors = []

    seen = set()

    while True:
        try:
            files = [
                f for f in os.listdir(InputFolder)
                if os.path.isfile(os.path.join(InputFolder, f))
            ]

            for f in files:
                if f in seen:
                    continue

                seen.add(f)
                filepath = os.path.join(InputFolder, f)
                
                # Sanity check to prevent path traversal outside InputFolder
                if not os.path.realpath(filepath).startswith(os.path.realpath(InputFolder)):
                    print(f"[agent] Warning: file path out of bounds for {f}")
                    continue

                # File extension check
                if not f.endswith(".py"):
                    print(f"[agent] Rejecting {f}: only .py files are currently supported")
                    continue

                print(f"[agent] New file detected: {f}")

                run_id = record_start_time(f)
                snapshot_path = snapshot_target_directory(TargetPath)
                monitors = []
                
                try:
                    set_run_status(run_id, "MONITORING")
                    monitors = start_monitors(run_id)
                    
                    set_run_status(run_id, "EXECUTING")
                    run_in_sandbox(filepath)
                    time.sleep(1)
                    
                    set_run_status(run_id, "PROCESSING")
                    process_results(run_id)
                    
                    set_run_status(run_id, "COMPLETED")
                except Exception as e:
                    set_run_status(run_id, "FAILED")
                    raise e
                finally:
                    stop_monitors(monitors)
                    monitors = []
                    restore_target_directory(TargetPath, snapshot_path)

                print(f"[agent] Analysis complete for {f}")

            time.sleep(1)

        except Exception as e:
            logging.exception("[agent] Error in main loop (will retry in 5s):")
            if 'monitors' in locals() and monitors:
                stop_monitors(monitors)
                monitors = []
            time.sleep(5)


if __name__ == "__main__":
    main()
