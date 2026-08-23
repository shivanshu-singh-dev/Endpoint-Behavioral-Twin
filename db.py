import os
from contextlib import contextmanager

import mysql.connector
from mysql.connector.pooling import MySQLConnectionPool
from dotenv import load_dotenv


load_dotenv()


_pool = None

def get_connection():
    global _pool
    if _pool is None:
        db_password = os.environ.get("EBT_DB_PASSWORD")
        if not db_password:
            raise RuntimeError("EBT_DB_PASSWORD environment variable must be set")
            
        _pool = MySQLConnectionPool(
            pool_name="ebt_pool",
            pool_size=5,
            pool_reset_session=True,
            host=os.environ.get("EBT_DB_HOST", "localhost"),
            port=int(os.environ.get("EBT_DB_PORT", "3306")),
            user=os.environ.get("EBT_DB_USER", "ebt"),
            password=db_password,
            database=os.environ.get("EBT_DB_NAME", "ebt")
        )
    return _pool.get_connection()


@contextmanager
def db_cursor():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        yield conn, cursor
    finally:
        cursor.close()
        conn.close()
