from pydantic import BaseModel
import os


class Settings(BaseModel):
    host: str = os.getenv("EBT_DB_HOST", "127.0.0.1")
    port: int = int(os.getenv("EBT_DB_PORT", "3306"))
    user: str = os.getenv("EBT_DB_USER", "root")
    password: str = os.getenv("EBT_DB_PASSWORD", "")
    ebt_database: str = os.getenv("EBT_DB_NAME", "ebt")
    ui_database: str = os.getenv("EBT_UI_DB_NAME", "ebt_ui")
    jwt_secret: str = os.getenv("EBT_UI_JWT_SECRET", "change-me")
    jwt_algorithm: str = "HS256"
    token_expiry_minutes: int = int(os.getenv("EBT_UI_TOKEN_EXPIRY_MINUTES", "180"))


settings = Settings()
