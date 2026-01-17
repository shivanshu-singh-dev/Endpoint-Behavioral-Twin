import os
import time
import json
import subprocess
import signal
from datetime import datetime, timezone
from pathlib import Path

TEST_FOLDER = "/home/lab/Test Folder"
RUN_INDEX = "reports/processed/run_index.json"

ATTACK_USER = "lab"
PYTHON_BIN = "/usr/bin/python3"

PROCESSOR = "collectors/file_event_processor.py"
ANALYZER = "collectors/file_analyzer.py"

def start_monitors():
    print("[agent] Starting monitors")
    monitors = []

    file_mon = subprocess.Popen(
        [PYTHON_BIN, "monitors/file_monitor.py"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    monitors.append(file_mon)

    proc_mon = subprocess.Popen(
        [PYTHON_BIN, "monitors/process_monitor.py"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    monitors.append(proc_mon)

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
    Path("reports/processed").mkdir(parents=True, exist_ok=True)

    data = {}
    if Path(RUN_INDEX).exists():
        with open(RUN_INDEX) as f:
            data = json.load(f)

    data[filename] = datetime.now(timezone.utc).isoformat()

    with open(RUN_INDEX, "w") as f:
        json.dump(data, f, indent=2)

    print(f"[agent] Start time recorded for {filename}")


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



def process_results(filename):
    # File processor
    subprocess.run(
        [PYTHON_BIN, PROCESSOR, filename],
        check=True
    )

    # Process processor
    try:
        subprocess.run(
            [PYTHON_BIN, "collectors/process_event_processor.py", filename],
            check=True
        )
    except subprocess.CalledProcessError:
        print("[agent] Process processor failed — continuing")

    # Analyzer
    subprocess.run(
        [PYTHON_BIN, ANALYZER, filename],
        check=True
    )



def main():
    monitors = start_monitors()
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

                record_start_time(f)
                run_in_sandbox(filepath)

                # buffer to make sure all file/process events are logged
                time.sleep(1)

                process_results(f)

                print(f"[agent] Analysis complete for {f}")
                return  #one file per agent run

            time.sleep(1)

    except Exception as e:
        print("[agent] Error:", e)

    finally:
        stop_monitors(monitors)

if __name__ == "__main__":
    main()
