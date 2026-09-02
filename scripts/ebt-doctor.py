import os
import sys
import tempfile
import pymysql
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

def check(name, condition, error_msg=""):
    if condition:
        print(f"[\033[92mPASS\033[0m] {name}")
        return True
    else:
        print(f"[\033[91mFAIL\033[0m] {name} - {error_msg}")
        return False

def check_db(host, port, user, password, db_name):
    try:
        conn = pymysql.connect(host=host, port=port, user=user, password=password, database=db_name)
        conn.close()
        return True, ""
    except Exception as e:
        return False, str(e)

def main():
    print("=== EBT Doctor Preflight Check ===")
    
    # Python & Venv
    check("Python Version (>=3.8)", sys.version_info >= (3, 8), "Requires Python 3.8+")
    check("Virtual Environment Active", sys.prefix != sys.base_prefix, "Not running inside a venv")
    
    # Packages
    try:
        import fastapi
        import watchdog
        import psutil
        import passlib
        import bcrypt
        check("Required Packages Installed", True)
    except ImportError as e:
        check("Required Packages Installed", False, str(e))

    # Dotenv
    load_dotenv(BASE_DIR / ".env")
    jwt_secret = os.environ.get("EBT_UI_JWT_SECRET")
    check("JWT Secret Set", jwt_secret and jwt_secret != "change-me", "EBT_UI_JWT_SECRET is missing or unsafe")

    # DB Connections
    db_host = os.environ.get("EBT_DB_HOST", "127.0.0.1")
    db_port = int(os.environ.get("EBT_DB_PORT", "3306"))
    db_user = os.environ.get("EBT_DB_USER", "ebt")
    db_pass = os.environ.get("EBT_DB_PASSWORD", "ebt")
    
    ebt_ok, ebt_err = check_db(db_host, db_port, db_user, db_pass, "ebt")
    check("MySQL 'ebt' DB Reachable", ebt_ok, ebt_err)
    
    ebt_ui_ok, ebt_ui_err = check_db(db_host, db_port, db_user, db_pass, "ebt_ui")
    check("MySQL 'ebt_ui' DB Reachable", ebt_ui_ok, ebt_ui_err)

    # Tables check
    if ebt_ok and ebt_ui_ok:
        try:
            conn = pymysql.connect(host=db_host, port=db_port, user=db_user, password=db_pass, database="ebt")
            with conn.cursor() as cursor:
                cursor.execute("SHOW TABLES LIKE 'run_index'")
                check("ebt 'run_index' table exists", cursor.fetchone() is not None, "Schema missing")
            conn.close()
        except Exception as e:
            check("ebt schema checks", False, str(e))
            
        try:
            conn = pymysql.connect(host=db_host, port=db_port, user=db_user, password=db_pass, database="ebt_ui")
            with conn.cursor() as cursor:
                cursor.execute("SHOW TABLES LIKE 'users'")
                check("ebt_ui 'users' table exists", cursor.fetchone() is not None, "Schema missing")
            conn.close()
        except Exception as e:
            check("ebt_ui schema checks", False, str(e))

    # Directories
    input_folder = Path(os.environ.get("INPUT_FOLDER", "/home/lab/Test Folder"))
    target_path = Path(os.environ.get("TARGET_PATH", "/home/lab/lab_docs"))
    
    if os.name == 'posix':
        check("Input Folder Writable", input_folder.exists() and os.access(input_folder, os.W_OK), "Cannot write to INPUT_FOLDER")
        check("Target Path Readable", target_path.exists() and os.access(target_path, os.R_OK), "Cannot read TARGET_PATH")
    else:
        # Basic check for Windows/testing
        check("Input Folder Exists", True, "(Skipped permission check on non-POSIX)")
        
    # Monitor scripts
    monitors = ["file_monitor.py", "process_monitor.py", "network_monitor.py", "persistence_monitor.py", "config_monitor.py"]
    missing = [m for m in monitors if not (BASE_DIR / "monitors" / m).exists()]
    check("Monitor Scripts Present", not missing, f"Missing: {missing}")

if __name__ == "__main__":
    main()
