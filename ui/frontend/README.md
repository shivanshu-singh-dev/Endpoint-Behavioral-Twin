# EBT UI Frontend (React + Vite)

## Setup
```bash
cd ui/frontend
npm install
npm run dev
```

By default frontend calls `http://localhost:8000/api`.

Override API URL:
```bash
VITE_API_BASE=http://localhost:8000/api npm run dev
```

## Implemented views
- Login screen
- SOC dashboard with verdict chart
- Runs page with dynamic filter chips + quick filters
- Run detail: timeline, process tree, attack narrative, risk breakdown, event feed
- Rule tuning page (researcher/admin)
- Admin panel (user management + log cleanup)
