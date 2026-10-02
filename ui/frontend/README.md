# 🛡️ EBT SOC Frontend Console (React + Vite)

A modern, high-tech Security Operations Center (SOC) web interface for the **Endpoint Behavioral Twin** (EBT) platform.

---

## ⚡ Tech Stack & Libraries
- **Framework:** React 18 + Vite
- **Routing:** React Router v6
- **Visual Analytics:** Highcharts, Highcharts 3D, Highcharts-React
- **Icons:** Lucide React
- **Audio Synthesis:** Web Audio API (zero external dependencies)
- **Effects:** Canvas Confetti, CSS Glassmorphism & Keyframe Animations

---

## 🚀 Setup & Development

```bash
# Navigate to the frontend folder
cd ui/frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

By default, the frontend connects to `http://localhost:5000/api`.

### Override API Endpoint
```bash
VITE_API_BASE=http://localhost:5000/api npm run dev
```

---

## ✨ Features & Implemented Views

### 1. 📊 SOC Threat Operations Dashboard
- **DEFCON Threat Posture Banner:** Dynamic endpoint threat posture assessment (DEFCON 1 Critical, DEFCON 3 Elevated, DEFCON 5 Nominal).
- **Interactive 3D Highcharts Analytics:**
  - 3D Donut Verdict Breakdown with slice explosion and click-to-filter runs.
  - 3D Risk Severity Column Chart with gradient cylinders.
  - Real-time Area Spline Activity & Risk Timeline with zoom and point inspection.
- **Live Recent Triage Table:** Instant search and severity chip filtering.

### 2. 🧪 Analysis Runs Repository & Multi-Dimension Filter Engine
- Filter by Run ID, Filename, Event Category, Verdict, Score Range (min/max), Process Name, Remote IP/Port, and Time Window.
- Fast Preset Badges (*High Severity*, *Medium Risk*, *Last 24 Hours*, *Persistence Threats*).
- Multi-column sorting (Run ID, Filename, Timestamp, Verdict, Risk Score).
- Animated color-coded risk meter bars and pagination controls.

### 3. 🔬 Investigation Workbench (Run Details)
- **Visual Analytics Hub:** Interactive 3D Donut (Event Mix), Velocity Timeline (zoom & scrub), and 3D Behavior Intensity columns.
- **Explain Verdict & Attack Narrative:** Cyber terminal-styled attack narrative with MITRE ATT&CK style indicators and category risk contribution bars.
- **Process Execution Hierarchy Tree:** Interactive tree diagram with PID badges, executable icons, and parent-child connector lines.
- **Sequential Behavior Timeline Rail:** Chronological rail with color-coded nodes for each behavioral vector.
- **Raw Telemetry Inspector:** Searchable event logs with JSON syntax viewer and one-click copy to clipboard.
- **One-Click Exporters:** Structured JSON and CSV ZIP archive downloads with confetti celebrations on benign verdicts.

### 4. ⚙️ Real-time Rule Tuning & Scoring Console
- Interactive sensitivity sliders with live numerical adjustments.
- **Relative Weight Distribution Bar:** Dynamic stacked visual bar displaying the percentage contribution of File, Process, Network, Persistence, and Config weights.
- Pre-configured tuning profiles (*Ideal SOC Balance*, *Ransomware Focus*, *Network Sentinel*, *Threat Hunter*).

### 5. 🧰 Security Admin Center & User Access Control
- Analyst account provisioning with role tiers (*Guest*, *Researcher*, *Administrator*).
- Password-protected telemetry hygiene purge modal for safe data sanitization.

### 6. 🔐 Cyberpunk Operations Portal (Login)
- Glassmorphic login console with simulated live telemetry status indicators.
- Quick-fill demo role presets (Admin, Researcher, Analyst) for testing.

### 7. 🔊 Synthesized Audio & Toast Alert System
- Zero-dependency synthesized Web Audio API clicks, blips, alert sirens, and success chimes.
- Global mute toggle in the top bar with persistent local storage.
- Floating toast notifications with auto-dismiss progress timers.
