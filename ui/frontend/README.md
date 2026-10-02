# 🛡️ EBT Frontend Console (React + Vite)

The web dashboard for the **Endpoint Behavioral Twin** (EBT) platform.

---

## ⚡ Tech Stack & Libraries
- **Framework:** React 18 + Vite
- **Routing:** React Router v6
- **Visual Analytics:** Highcharts, Highcharts 3D, Highcharts-React
- **Icons:** Lucide React
- **Audio Feedback:** Web Audio API synthesis
- **Effects:** Canvas Confetti

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

## ✨ Views & Features

### 1. 📊 Security Dashboard
- **Threat Summary Banner:** Real-time summary based on recorded high and medium risk runs.
- **Interactive 3D Highcharts Analytics:**
  - 3D Donut Verdict Breakdown with click-to-filter navigation.
  - 3D Risk Severity Column Chart.
  - Real-time Area Spline Activity & Risk Timeline with zoom and point inspection.
- **Recent Runs Table:** Search and filter recent runs by filename or verdict.

### 2. 🧪 Analysis Runs & Filter Panel
- Filter by Run ID, Filename, Event Category, Verdict, Score Range, Process Name, Remote IP/Port, and Time Range.
- Quick Presets (*High Risk*, *Medium Risk*, *Last 24 Hours*, *Persistence Events*).
- Multi-column sorting (Run ID, Filename, Timestamp, Verdict, Risk Score).
- Risk meter progress bars and pagination controls.

### 3. 🔬 Run Detail View
- **Visual Analytics:** Interactive 3D Donut (Event Category Mix), Velocity Timeline (zoom & filter), and 3D Column charts.
- **Verdict Explanation & Narrative:** Explainable detection reasons, attack sequence narrative, and category risk contribution bars.
- **Process Hierarchy Tree:** Interactive tree diagram showing parent-child process relationships with PIDs.
- **Sequential Behavior Timeline:** Chronological event rail with color-coded category markers.
- **Raw Event Logs:** Searchable event telemetry with formatted JSON viewer and one-click copy.
- **Exporters:** Structured JSON and CSV ZIP archive downloads.

### 4. ⚙️ Rule Tuning Console
- Sensitivity sliders with live numeric inputs.
- **Weight Distribution Ratio Bar:** Stacked bar displaying the relative percentage contribution of each behavioral vector.
- Quick tuning profiles (*Balanced*, *Persistence Focused*, *Network Focused*, *Malware Tuning*).

### 5. 🧰 Administration Center
- User account management with role tiers (*Guest*, *Researcher*, *Administrator*).
- Password-protected log hygiene purge action for database sanitization.

### 6. 🔐 Authentication (Login)
- Clean login console with role presets (Admin, Researcher, Analyst) for testing.

### 7. 🔊 Audio Feedback & Toast Notifications
- Lightweight synthesized audio for clicks, alerts, and confirmations (with a mute toggle).
- Floating toast notifications with auto-dismiss timers.
