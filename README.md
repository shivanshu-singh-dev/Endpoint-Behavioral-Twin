# Endpoint Behavioral Twin (EBT)

**Endpoint Behavioral Twin (EBT)** is a local, behavior-based endpoint analysis system.

It safely executes untrusted programs inside an isolated environment and evaluates them **based on behavior, not appearance**.

---

## Why EBT?

Most malware analysis systems either:

- Detonate real malware in cloud environments
- Rely on opaque machine-learning decisions

EBT takes a different approach.

**Design principles:**
- Fully local execution
- Controlled and ethical simulations
- Transparent, explainable results
- Built for learning, demos, and academic evaluation

---

## High-Level Concept

EBT treats a virtual machine as a **behavioral twin** of an endpoint.

During execution:

- A file runs inside a restricted sandbox
- Multiple monitors observe behavior
- All activity is scoped to the execution window
- Observations are aggregated per file

The result is a **single behavioral profile and verdict**.

---

## Behavioral Monitors

### File Activity
- File creation, modification, renaming, deletion
- High-rate or patterned operations (e.g. ransomware-like behavior)

### Process Activity
- Process creation
- Parent → child relationships
- Burst spawning and deep process trees

### Network Activity
- Outbound connections only
- Repeated connections to the same destination
- Uncommon or suspicious ports  
  *(no packet capture)*

### Persistence Mechanisms
- User-level crontab modifications
- Autostart entry creation

### Configuration Changes
- Changes inside a lab-owned configuration directory
- No system configuration is modified

---

## Detection Philosophy

EBT uses **rule-based, explainable heuristics**.

There are **no signatures** and **no ML models**.

Examples:
- Rapid file renaming increases risk
- Large numbers of child processes increase risk
- Repeated outbound connections increase risk
- Persistence creation is a high-confidence signal
- Configuration changes add supporting context

Each rule contributes:
- A risk score
- A human-readable reason

---

## Risk Levels

EBT produces one of three verdicts:

- **Benign** — Expected or low-impact behavior
- **Suspicious** — Automated or unusual activity
- **High Risk** — Strongly malicious behavioral patterns

Verdicts are **threshold-based**, not arbitrary.

---

## Intended Use

EBT is suitable for:

- Academic projects
- Security coursework
- Behavioral analysis demonstrations
- Learning endpoint detection concepts

> EBT is not intended to replace enterprise EDR platforms.

---

## Limitations

- No kernel-level telemetry
- No packet-level network inspection
- Manual VM snapshot restoration
- Change-based persistence detection

---

## Future Work

- Automated snapshot restore
- Timeline visualization
- MITRE ATT&CK mapping
- Additional behavioral sensors

---

## Summary

Endpoint Behavioral Twin demonstrates that meaningful endpoint detection can be achieved through:

- Careful behavior observation
- Safe execution
- Clear, explainable reasoning

Without relying on opaque models or unsafe techniques.

