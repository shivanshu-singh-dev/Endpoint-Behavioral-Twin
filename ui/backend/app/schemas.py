from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=8, max_length=128)
    role: Literal["researcher", "admin", "guest"]


class UserView(BaseModel):
    user_id: int
    username: str
    role: str
    created_at: datetime


class RunSummary(BaseModel):
    run_id: int
    filename: str
    start_time: datetime
    verdict: str | None = None
    risk_score: int | None = None


class AnalysisReason(BaseModel):
    reason_text: str


class EventRecord(BaseModel):
    event_id: int
    timestamp: datetime
    category: str
    detail: dict


class RiskBreakdownItem(BaseModel):
    category: str
    count: int
    score_contribution: int


class RunDetail(BaseModel):
    run_id: int
    filename: str
    start_time: datetime
    verdict: str | None
    risk_score: int | None
    confidence: str | None
    reasons: list[str]
    events: list[EventRecord]
    risk_breakdown: list[RiskBreakdownItem]
    attack_narrative: str
    process_tree: dict


class DashboardStats(BaseModel):
    total_runs: int
    avg_risk_score: float
    verdict_distribution: list[dict]
    recent_runs: list[RunSummary]


class RuleSettings(BaseModel):
    file_weight: int = 5
    process_weight: int = 7
    network_weight: int = 10
    persistence_weight: int = 12
    config_weight: int = 4


class TimelinePoint(BaseModel):
    event_id: int
    category: str
    offset_seconds: float
    timestamp: datetime
