# 🛡️ Endpoint Behavioral Twin (EBT)

> A local, behavior-based endpoint analysis system designed to safely execute, observe, and evaluate untrusted programs based on their actions, not their appearance.

---

## 📖 Description

Many malware analysis systems either detonate real malware in cloud environments or rely on machine-learning classifiers. Endpoint Behavioral Twin (EBT) takes a different approach by treating a local virtual machine as a **behavioral twin** of an endpoint.

EBT safely executes untrusted files inside an isolated, controlled sandbox. Multiple behavioral monitors simultaneously observe the execution, scoping all activity strictly to the execution window. The result is a transparent, rule-based behavioral profile and risk verdict, explicitly built for learning, SOC demonstrations, and ethical simulations.

**Problem it solves:** Provides a transparent, rule-based detection approach that runs entirely offline and locally for academic and demonstration purposes. It is not designed for production environments and does not utilize machine learning or compete with commercial EDR solutions.

---

## ⚡ Tech Stack

EBT spans a standalone Python agent, a specialized security backend, and an ultra-modern reactive SOC dashboard.

- **Agent & Monitors:** Python 3, psutil, watchdog
- **Backend API:** FastAPI, Uvicorn, Python, cryptography, PyMySQL, DBUtils
- **Database:** MySQL
- **Frontend Dashboard:** React 18, Vite, Highcharts 3D, Lucide Icons, Web Audio API synthesis, Canvas Confetti

---

## ✨ Features

- **🔍 Behavioral Monitors:** Captures file activity, process spawning, network connections, configuration shifts, and persistence mechanisms.
- **🧠 Explainable Detection Philosophy:** Utilizes transparent, rule-based heuristics. Each rule contributes a risk score supported by a human-readable reason. (No signatures, no ML).
- **📊 Dynamic Risk Scoring & Live DEFCON Posture:** Files receive transparent verdicts (`Unlikely`, `Medium Risk`, `High Risk`) driven by cumulative threshold-based metrics.
- **🛡️ Local Sandboxing:** Files are executed safely utilizing `systemd` transient paths with strict privilege reductions and execution time limits.
- **💻 Ultra-Modern Cyber SOC Dashboard:** 
  - Dynamic 3D Highcharts visualizations (3D Donut verdict breakdown, 3D risk severity profile, real-time spline area trend).
  - Multi-tab investigation workbench (process execution hierarchy tree, chronological behavior timeline rails, cyber terminal attack narratives, and raw JSON telemetry inspector).
  - Multi-dimension behavioral filter engine with instant presets and active tag chips.
  - Interactive rule tuner with real-time vector weight distribution ratio bars.
  - Web Audio API synthesized cyber feedback and floating toast alert system.
- **📥 Comprehensive Reporting:** Export behavioral analysis data as structured JSON or CSV-ZIP archives with one click.

---

## 🚀 Installation

Follow these steps to set up EBT locally:

```bash
# 1. Clone the repository
git clone https://github.com/shivanshu-singh-dev/Endpoint-Behavioral-Twin.git
cd Endpoint-Behavioral-Twin

# 2. Install overarching Python dependencies
# It's recommended to do this inside a virtual environment
pip install -r requirements.txt

# 3. Setup the MySQL Database
./scripts/setup_db.sh

# 4. Install Backend dependencies
cd ui/backend
pip install -r requirements.txt
cd ../..

# 5. Install Frontend dependencies
cd ui/frontend
npm install
```

---

## 💻 Usage

To fully bring the environment online, you will need to start the backend, the frontend, and the local agent process.

**1. Start the Backend API (localhost:5000):**
```bash
cd ui/backend
source .venv/bin/activate # If utilizing a localized venv
uvicorn app.main:app --host 0.0.0.0 --port 5000
```

**2. Start the Frontend UI (localhost:5173):**
```bash
cd ui/frontend
npm run dev
```

**3. Start the execution Agent:**
```bash
# From the project root
python3 agent.py
```

Once running, any executable dropped into your configured `INPUT_FOLDER` will automatically be detoured into the sandbox, monitored, and displayed instantly on the UI.

---

## 📂 Folder Structure

```text
Endpoint-Behavioral-Twin/
├── agent.py               # Main EBT execution agent
├── collectors/            # Log and event aggregation scripts
├── monitors/              # System behavior monitors (File, Net, Process, etc.)
├── schema.sql             # Relational schema for the MySQL database
├── requirements.txt       # Unified Python dependencies
├── ui/                    
│   ├── backend/           # FastAPI backend server
│   └── frontend/          # React + Vite SOC dashboard
└── utils/                 # Utilities (e.g., localized time formatting)
```

---

## ⚙️ Environment Variables

The agent and database connections can be heavily parameterized.
Create a `.env` file or export them out directly:

### Database Settings
- `EBT_DB_HOST` : Database host (default: `localhost`)
- `EBT_DB_PORT` : Database port (default: `3306`)
- `EBT_DB_USER` : Database user (default: `ebt`)
- `EBT_DB_PASSWORD` : Database password (default: `ebt`) [example]
- `EBT_DB_NAME` : Database schema (default: `ebt`)

### Agent Settings
- `INPUT_FOLDER` : The gateway directory where untrusted files are queued (default: `/home/lab/Test Folder`)
- `TARGET_PATH` : The pathway utilized by the target sandbox (default: `/home/lab/lab_docs`)

---

> **Note:** EBT is intended for academic projects, security coursework, and behavioral analysis demonstrations. It is not intended to replace enterprise EDR platforms.
