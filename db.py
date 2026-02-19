import os
from contextlib import contextmanager

import mysql.connector
from dotenv import load_dotenv


load_dotenv()


def get_connection():
    return mysql.connector.connect(
        host=os.environ.get("EBT_DB_HOST", "localhost"),
        port=int(os.environ.get("EBT_DB_PORT", "3306")),
        user=os.environ.get("EBT_DB_USER", "ebt"),
        password=os.environ.get("EBT_DB_PASSWORD", "ebt"),
        database=os.environ.get("EBT_DB_NAME", "ebt")
    )


@contextmanager
def db_cursor():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        yield conn, cursor
    finally:
        cursor.close()
        conn.close()
