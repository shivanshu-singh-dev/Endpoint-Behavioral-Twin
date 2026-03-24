from datetime import datetime, timedelta


def build_run_filters(
    run_id: int | None,
    event_type: str | None,
    filename: str | None,
    verdict: str | None,
    min_score: int | None,
    max_score: int | None,
    remote_ip: str | None,
    remote_port: int | None,
    process_name: str | None,
    date_range: str | None,
):
    where_clauses: list[str] = []
    params: list[object] = []
    joins: list[str] = ["LEFT JOIN file_analysis a ON r.run_id = a.run_id"]

    if run_id is not None:
        where_clauses.append("r.run_id = %s")
        params.append(run_id)
    if event_type:
        joins.append("JOIN event e_type ON r.run_id = e_type.run_id")
        where_clauses.append("e_type.category = %s")
        params.append(event_type)
    if filename:
        where_clauses.append("r.filename LIKE %s")
        params.append(f"%{filename}%")
    if verdict:
        where_clauses.append("a.verdict = %s")
        params.append(verdict)
    if min_score is not None:
        where_clauses.append("a.risk_score >= %s")
        params.append(min_score)
    if max_score is not None:
        where_clauses.append("a.risk_score <= %s")
        params.append(max_score)
    if remote_ip:
        joins.append("JOIN event e_net ON r.run_id = e_net.run_id")
        joins.append("JOIN network_event n ON e_net.event_id = n.event_id")
        where_clauses.append("n.remote_ip = %s")
        params.append(remote_ip)
    if remote_port is not None:
        if not any("network_event" in join for join in joins):
            joins.append("JOIN event e_net ON r.run_id = e_net.run_id")
            joins.append("JOIN network_event n ON e_net.event_id = n.event_id")
        where_clauses.append("n.remote_port = %s")
        params.append(remote_port)
    if process_name:
        joins.append("JOIN event e_proc ON r.run_id = e_proc.run_id")
        joins.append("JOIN process_event p ON e_proc.event_id = p.event_id")
        where_clauses.append("p.process_name LIKE %s")
        params.append(f"%{process_name}%")
    if date_range:
        now = datetime.utcnow()
        lower_bound = None
        if date_range == "24h":
            lower_bound = now - timedelta(hours=24)
        elif date_range == "7d":
            lower_bound = now - timedelta(days=7)
        elif date_range == "30d":
            lower_bound = now - timedelta(days=30)

        if lower_bound:
            where_clauses.append("r.start_time >= %s")
            params.append(lower_bound)

    where_sql = ""
    if where_clauses:
        where_sql = "WHERE " + " AND ".join(where_clauses)

    return {
        "joins": " ".join(joins),
        "where": where_sql,
        "params": params,
    }

