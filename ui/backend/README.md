# EBT UI Backend (FastAPI)

This API is isolated under `ui/` and does not modify core EBT agent logic.

## Features
- JWT authentication with bcrypt password hashing
- Role-based authorization (`admin`, `researcher`, `guest`)
- Parameterized query-based run search (no raw SQL from user)
- Dashboard, run details, timeline, narrative, risk breakdown
- Admin endpoints for user management and event table cleanup

## Setup
```bash
cd ui/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create UI schema:
```bash
mysql -u root -p < ../schema_ui.sql
```

Run API:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Bootstrap admin:
```bash
python create_admin.py
```

## Important security notes
- Passwords are stored as bcrypt hashes.
- API queries use parameterized SQL.
- UI users are stored in dedicated `ebt_ui` database.
- Core analysis tables in `ebt` are only read by normal roles; cleanup endpoint is admin-only.
