from contextlib import contextmanager
from typing import Iterator

import pymysql
from pymysql.cursors import DictCursor
from dbutils.pooled_db import PooledDB

from .config import settings

_ui_pool = None
_ebt_pool = None

def _get_pool(database: str, pool_var: PooledDB | None) -> PooledDB:
    if pool_var is None:
        pool_var = PooledDB(
            creator=pymysql,
            maxconnections=10,
            mincached=2,
            maxcached=5,
            blocking=True,
            host=settings.host,
            user=settings.user,
            password=settings.password,
            database=database,
            port=settings.port,
            cursorclass=DictCursor,
            autocommit=False,
        )
    return pool_var

@contextmanager
def ui_db() -> Iterator[pymysql.connections.Connection]:
    global _ui_pool
    _ui_pool = _get_pool(settings.ui_database, _ui_pool)
    conn = _ui_pool.connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

@contextmanager
def ebt_db() -> Iterator[pymysql.connections.Connection]:
    global _ebt_pool
    _ebt_pool = _get_pool(settings.ebt_database, _ebt_pool)
    conn = _ebt_pool.connection()
    try:
        yield conn
    finally:
        conn.close()
