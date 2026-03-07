from contextlib import contextmanager
from typing import Iterator

import pymysql
from pymysql.cursors import DictCursor

from .config import settings


def _connect(database: str):
    return pymysql.connect(
        host=settings.host,
        user=settings.user,
        password=settings.password,
        database=database,
        port=settings.port,
        cursorclass=DictCursor,
        autocommit=False,
    )


@contextmanager
def ui_db() -> Iterator[pymysql.connections.Connection]:
    conn = _connect(settings.ui_database)
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
    conn = _connect(settings.ebt_database)
    try:
        yield conn
    finally:
        conn.close()
