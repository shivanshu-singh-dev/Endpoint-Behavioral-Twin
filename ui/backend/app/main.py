from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Annotated
import json

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware

from .database import ebt_db, ui_db
from .query_builder import build_run_filters
from .schemas import (
    DashboardStats,
    LoginRequest,
    RuleSettings,
    RunDetail,
    RunSummary,
    TimelinePoint,
    TokenResponse,
    UserCreate,
    UserView,
)
from .security import (
    Role,
    create_access_token,
    get_current_user,
    hash_password,
    require_role,
    verify_password,
)

app = FastAPI(title="EBT UI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

RULE_SETTINGS_PATH = Path(__file__).resolve().parent.parent / "state" / "rule_settings.json"
RULE_SETTINGS_PATH.parent.mkdir(parents=True, exist_ok=True)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    with ui_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT username, password_hash, role FROM users WHERE username = %s",
                (payload.username,),
            )
            user = cursor.fetchone()

    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(user["username"], user["role"])
    return TokenResponse(access_token=token, role=user["role"])


@app.get("/api/auth/me")
def me(user: Annotated[dict, Depends(get_current_user)]):
    return user


@app.get("/api/dashboard", response_model=DashboardStats)
def dashboard(_: Annotated[dict, Depends(require_role([Role.ADMIN, Role.RESEARCHER, Role.GUEST]))]):
    with ebt_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) AS total_runs FROM run_index")
            total_runs = cursor.fetchone()["total_runs"]

            cursor.execute("SELECT COALESCE(AVG(risk_score), 0) AS avg_risk FROM file_analysis")
            avg_risk = float(cursor.fetchone()["avg_risk"])

            cursor.execute(
                "SELECT verdict, COUNT(*) AS count FROM file_analysis GROUP BY verdict ORDER BY count DESC"
            )
            verdict_distribution = cursor.fetchall()

            cursor.execute(
                """
                SELECT r.run_id, r.filename, r.start_time, a.verdict, a.risk_score
                FROM run_index r
                LEFT JOIN file_analysis a ON r.run_id = a.run_id
                ORDER BY r.start_time DESC
                LIMIT 10
                """
            )
            recent_runs = cursor.fetchall()

    return DashboardStats(
        total_runs=total_runs,
        avg_risk_score=avg_risk,
        verdict_distribution=verdict_distribution,
        recent_runs=[RunSummary(**row) for row in recent_runs],
    )


@app.get("/api/runs", response_model=list[RunSummary])
def list_runs(
    _: Annotated[dict, Depends(require_role([Role.ADMIN, Role.RESEARCHER, Role.GUEST]))],
    filename: str | None = None,
    verdict: str | None = None,
    min_score: int | None = Query(default=None, ge=0, le=100),
    max_score: int | None = Query(default=None, ge=0, le=100),
    remote_ip: str | None = None,
    remote_port: int | None = Query(default=None, ge=1, le=65535),
    process_name: str | None = None,
    date_range: str | None = Query(default=None, pattern="^(24h|7d|30d)$"),
):
    filters = build_run_filters(
        filename=filename,
        verdict=verdict,
        min_score=min_score,
        max_score=max_score,
        remote_ip=remote_ip,
        remote_port=remote_port,
        process_name=process_name,
        date_range=date_range,
    )

    sql = f"""
        SELECT DISTINCT r.run_id, r.filename, r.start_time, a.verdict, a.risk_score
        FROM run_index r
        {filters['joins']}
        {filters['where']}
        ORDER BY r.start_time DESC
        LIMIT 500
    """

    with ebt_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(sql, tuple(filters["params"]))
            rows = cursor.fetchall()

    return [RunSummary(**row) for row in rows]


@app.get("/api/runs/{run_id}", response_model=RunDetail)
def run_detail(
    run_id: int,
    _: Annotated[dict, Depends(require_role([Role.ADMIN, Role.RESEARCHER, Role.GUEST]))],
):
    with ebt_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT r.run_id, r.filename, r.start_time, a.verdict, a.risk_score, a.confidence
                FROM run_index r
                LEFT JOIN file_analysis a ON r.run_id = a.run_id
                WHERE r.run_id = %s
                """,
                (run_id,),
            )
            run = cursor.fetchone()

            if not run:
                raise HTTPException(status_code=404, detail="Run not found")

            cursor.execute("SELECT reason_text FROM analysis_reason WHERE run_id = %s", (run_id,))
            reasons = [row["reason_text"] for row in cursor.fetchall()]

            cursor.execute(
                "SELECT event_id, timestamp, category FROM event WHERE run_id = %s ORDER BY timestamp ASC",
                (run_id,),
            )
            event_rows = cursor.fetchall()

            events = []
            category_counts = defaultdict(int)
            process_nodes = {}
            for row in event_rows:
                category = row["category"]
                category_counts[category] += 1
                detail = {}
                if category == "file":
                    cursor.execute("SELECT event_type, src_path, dest_path FROM file_event WHERE event_id = %s", (row["event_id"],))
                    detail = cursor.fetchone() or {}
                elif category == "process":
                    cursor.execute("SELECT pid, ppid, process_name FROM process_event WHERE event_id = %s", (row["event_id"],))
                    detail = cursor.fetchone() or {}
                    if detail:
                        process_nodes[detail["pid"]] = {
                            "pid": detail["pid"],
                            "ppid": detail["ppid"],
                            "name": detail.get("process_name") or str(detail["pid"]),
                        }
                elif category == "network":
                    cursor.execute("SELECT pid, remote_ip, remote_port FROM network_event WHERE event_id = %s", (row["event_id"],))
                    detail = cursor.fetchone() or {}
                elif category == "persistence":
                    cursor.execute("SELECT mechanism_type FROM persistence_event WHERE event_id = %s", (row["event_id"],))
                    detail = cursor.fetchone() or {}
                elif category == "config":
                    cursor.execute("SELECT config_type FROM config_event WHERE event_id = %s", (row["event_id"],))
                    detail = cursor.fetchone() or {}

                events.append({
                    "event_id": row["event_id"],
                    "timestamp": row["timestamp"],
                    "category": category,
                    "detail": detail,
                })

    total_weight = {
        "file": 5,
        "process": 7,
        "network": 10,
        "persistence": 12,
        "config": 4,
    }
    risk_breakdown = [
        {
            "category": cat,
            "count": count,
            "score_contribution": count * total_weight.get(cat, 1),
        }
        for cat, count in category_counts.items()
    ]

    attack_narrative = (
        f"The sample '{run['filename']}' produced {len(events)} observed events. "
        f"Key activity included {category_counts.get('process', 0)} process actions, "
        f"{category_counts.get('file', 0)} file operations, "
        f"{category_counts.get('network', 0)} network connections, and "
        f"{category_counts.get('persistence', 0)} persistence attempts."
    )

    tree = defaultdict(list)
    roots = []
    for node in process_nodes.values():
        if node["ppid"] in process_nodes:
            tree[node["ppid"]].append(node["pid"])
        else:
            roots.append(node["pid"])

    def build_branch(pid):
        node = process_nodes[pid]
        return {
            "pid": pid,
            "name": node["name"],
            "children": [build_branch(child) for child in tree.get(pid, [])],
        }

    process_tree = [build_branch(root) for root in roots]

    return RunDetail(
        run_id=run["run_id"],
        filename=run["filename"],
        start_time=run["start_time"],
        verdict=run.get("verdict"),
        risk_score=run.get("risk_score"),
        confidence=run.get("confidence"),
        reasons=reasons,
        events=events,
        risk_breakdown=risk_breakdown,
        attack_narrative=attack_narrative,
        process_tree={"roots": process_tree},
    )


@app.get("/api/runs/{run_id}/timeline", response_model=list[TimelinePoint])
def run_timeline(
    run_id: int,
    _: Annotated[dict, Depends(require_role([Role.ADMIN, Role.RESEARCHER, Role.GUEST]))],
):
    with ebt_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT start_time FROM run_index WHERE run_id = %s", (run_id,))
            run = cursor.fetchone()
            if not run:
                raise HTTPException(status_code=404, detail="Run not found")
            start_time: datetime = run["start_time"]

            cursor.execute(
                "SELECT event_id, category, timestamp FROM event WHERE run_id = %s ORDER BY timestamp ASC",
                (run_id,),
            )
            rows = cursor.fetchall()

    timeline = []
    for row in rows:
        offset = (row["timestamp"] - start_time).total_seconds()
        timeline.append(
            TimelinePoint(
                event_id=row["event_id"],
                category=row["category"],
                offset_seconds=offset,
                timestamp=row["timestamp"],
            )
        )
    return timeline


@app.get("/api/settings/rules", response_model=RuleSettings)
def get_rule_settings(_: Annotated[dict, Depends(require_role([Role.ADMIN, Role.RESEARCHER]))]):
    if RULE_SETTINGS_PATH.exists():
        return RuleSettings(**json.loads(RULE_SETTINGS_PATH.read_text()))
    return RuleSettings()


@app.put("/api/settings/rules", response_model=RuleSettings)
def update_rule_settings(
    payload: RuleSettings,
    _: Annotated[dict, Depends(require_role([Role.ADMIN, Role.RESEARCHER]))],
):
    RULE_SETTINGS_PATH.write_text(payload.model_dump_json(indent=2))
    return payload


@app.get("/api/admin/users", response_model=list[UserView])
def get_users(_: Annotated[dict, Depends(require_role([Role.ADMIN]))]):
    with ui_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT user_id, username, role, created_at FROM users ORDER BY created_at DESC")
            rows = cursor.fetchall()
    return rows


@app.post("/api/admin/users", response_model=UserView)
def create_user(payload: UserCreate, _: Annotated[dict, Depends(require_role([Role.ADMIN]))]):
    with ui_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT user_id FROM users WHERE username = %s", (payload.username,))
            if cursor.fetchone():
                raise HTTPException(status_code=409, detail="Username already exists")
            cursor.execute(
                "INSERT INTO users (username, password_hash, role, created_at) VALUES (%s, %s, %s, NOW())",
                (payload.username, hash_password(payload.password), payload.role),
            )
            user_id = cursor.lastrowid
            cursor.execute(
                "SELECT user_id, username, role, created_at FROM users WHERE user_id = %s",
                (user_id,),
            )
            created_user = cursor.fetchone()
    return created_user


@app.delete("/api/admin/users/{user_id}")
def delete_user(user_id: int, _: Annotated[dict, Depends(require_role([Role.ADMIN]))]):
    with ui_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM users WHERE user_id = %s", (user_id,))
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="User not found")
    return {"deleted": user_id}


@app.post("/api/admin/cleanup")
def cleanup_logs(_: Annotated[dict, Depends(require_role([Role.ADMIN]))]):
    with ebt_db() as conn:
        with conn.cursor() as cursor:
            # Delete child tables first to satisfy FK constraints and allow reset.
            for table in [
                "analysis_reason",
                "file_analysis",
                "file_event",
                "process_event",
                "network_event",
                "persistence_event",
                "config_event",
                "event",
                "run_index",
            ]:
                cursor.execute(f"TRUNCATE TABLE {table}")
        conn.commit()
    return {"status": "cleaned"}

