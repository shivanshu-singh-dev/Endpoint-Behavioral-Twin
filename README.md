# 🛡️ Endpoint Behavioral Twin (EBT)

> A local, behavior-based endpoint analysis system designed to safely execute, observe, and evaluate untrusted programs based on their actions, not their appearance.

---

## 📖 Description

Most malware analysis systems either detonate real malware in cloud environments or rely on opaque machine-learning decisions. Endpoint Behavioral Twin (EBT) takes a different approach by treating a local virtual machine as a **behavioral twin** of an endpoint.

EBT safely executes untrusted files inside an isolated, controlled sandbox. Multiple behavioral monitors simultaneously observe the execution, scoping all activity strictly to the execution window. The result is a transparent, explainable behavioral profile and risk verdict, explicitly built for learning, SOC demonstrations, and ethical simulations.

**Problem it solves:** Providing a clear, rule-based, and explainable alternative to signature-based detection and opaque ML models, functioning entirely offline and locally.

---

## ⚡ Tech Stack

EBT spans a standalone Python agent, a specialized security backend, and a modern reactive dashboard.

- **Agent & Monitors:** Python 3, `psutil`, `watchdog`
- **Backend API:** FastAPI, Uvicorn, Python, `cryptography`
- **Database:** MySQL
- **Frontend Dashboard:** React, Vite, Highcharts (for interactive data visualizations)

---

## ✨ Features

- **🔍 Behavioral Monitors:** Captures file activity, process spawning, network connections, configuration shifts, and persistence mechanisms.
- **🧠 Explainable Detection Philosophy:** Utilizes transparent, rule-based heuristics. Each rule contributes a risk score supported by a human-readable reason. (No signatures, no ML).
- **📊 Dynamic Risk Scoring:** Files are given verdicts (`Benign`, `Suspicious`, `High Risk`) driven by cumulative threshold-based metrics.
- **🛡️ Local Sandboxing:** Files are executed safely utilizing `systemd` transient paths with strict privilege reductions and execution time limits.
- **💻 Interactive Security Dashboard:** A comprehensive SOC-like web interface offering verdict distribution charts, recent activity timelines, and granular filter tuning.

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
mysql -u root -p < schema.sql

# 4. Install Frontend dependencies
cd ui/frontend
npm install
```

---

## 💻 Usage

To fully bring the environment online, you will need to start the backend, the frontend, and the local agent process.

**1. Start the Backend API:**
```bash
cd ui/backend
source .venv/bin/activate # If utilizing a localized venv
uvicorn app.main:app --host 0.0.0.0 --port 5000
```

**2. Start the Frontend UI:**
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
- `EBT_DB_PASSWORD` : Database password (default: `ebt`)
- `EBT_DB_NAME` : Database schema (default: `ebt`)

### Agent Settings
- `INPUT_FOLDER` : The gateway directory where untrusted files are queued (default: `/home/lab/Test Folder`)
- `TARGET_PATH` : The pathway utilized by the target sandbox (default: `/home/lab/lab_docs`)

---

> **Note:** EBT is intended for academic projects, security coursework, and behavioral analysis demonstrations. It is not intended to replace enterprise EDR platforms.
