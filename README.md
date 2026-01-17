Endpoint Behavioral Twin (EBT)

A local, behavior-based endpoint analysis system for safely executing and evaluating untrusted programs inside an isolated environment.

EBT focuses on how a program behaves, not what it looks like.
It correlates file, process, network, persistence, and configuration activity into a single, explainable risk assessment.

Why EBT?

Most malware sandboxes either:

detonate real malware in the cloud, or

rely on opaque machine-learning decisions

EBT takes a different approach:

Runs entirely on a local machine

Uses controlled, ethical simulations

Produces transparent, explainable results

Designed for learning, demos, and academic evaluation

High-Level Concept

EBT treats a virtual machine as a behavioral twin of an endpoint.

A submitted file is executed inside a restricted sandbox while multiple monitors observe its actions.
All observations are scoped to the execution window and aggregated into a file-centric behavioral profile.

One file in → one verdict out.

What EBT Monitors
File Activity

File creation, modification, renaming, deletion

High-rate or patterned operations (ransomware-like behavior)

Process Activity

Process creation

Parent → child relationships

Burst spawning and deep process trees

Network Activity

Outbound connections

Repeated connections to the same destination

Uncommon or suspicious ports
(Connection-level only, no packet capture)

Persistence Mechanisms

User-level crontab changes

Autostart entry creation

Configuration Changes

Changes inside a lab-owned configuration directory

No system configuration is modified

Detection Philosophy

EBT uses rule-based, explainable heuristics, not signatures or ML models.

Examples:

Rapid file renaming increases risk

Large numbers of child processes increase risk

Repeated outbound connections increase risk

Persistence creation is a high-confidence signal

Configuration changes provide supporting context

Each rule contributes both score and reason, making decisions easy to explain and defend.

Risk Levels

Benign – expected or low-impact behavior

Suspicious – automated or unusual behavior

High Risk – strongly malicious behavioral patterns

Scores are aggregated but verdicts are threshold-based, not arbitrary.

Intended Use

EBT is suitable for:

Academic projects

Security coursework

Behavioral analysis demonstrations

Understanding endpoint detection concepts

It is not intended to replace enterprise EDR platforms.

Limitations and Future Work

Current limitations:

No kernel telemetry

No packet-level network inspection

Snapshot revert is manual

Persistence detection is change-based

Possible future extensions:

Automated VM snapshot restore

Timeline visualization

MITRE ATT&CK mapping

Additional behavioral sensors

Summary

Endpoint Behavioral Twin demonstrates that meaningful endpoint detection can be achieved through careful behavior observation, safe execution, and clear reasoning, without relying on opaque models or unsafe techniques.
