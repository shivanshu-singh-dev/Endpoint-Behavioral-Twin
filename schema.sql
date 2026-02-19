CREATE TABLE IF NOT EXISTS run_index (
    run_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    start_time DATETIME NOT NULL,
    created_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS event (
    event_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    run_id BIGINT NOT NULL,
    timestamp DATETIME NOT NULL,
    category VARCHAR(50) NOT NULL,
    CONSTRAINT fk_event_run
        FOREIGN KEY (run_id) REFERENCES run_index(run_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS file_event (
    event_id BIGINT PRIMARY KEY,
    event_type ENUM('created', 'modified', 'deleted', 'renamed') NOT NULL,
    src_path TEXT NOT NULL,
    dest_path TEXT,
    CONSTRAINT fk_file_event_event
        FOREIGN KEY (event_id) REFERENCES event(event_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS process_event (
    event_id BIGINT PRIMARY KEY,
    pid BIGINT NOT NULL,
    ppid BIGINT NOT NULL,
    process_name VARCHAR(255),
    CONSTRAINT fk_process_event_event
        FOREIGN KEY (event_id) REFERENCES event(event_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS network_event (
    event_id BIGINT PRIMARY KEY,
    pid BIGINT,
    remote_ip VARCHAR(45) NOT NULL,
    remote_port INT NOT NULL,
    CONSTRAINT fk_network_event_event
        FOREIGN KEY (event_id) REFERENCES event(event_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS persistence_event (
    event_id BIGINT PRIMARY KEY,
    mechanism_type VARCHAR(100) NOT NULL,
    CONSTRAINT fk_persistence_event_event
        FOREIGN KEY (event_id) REFERENCES event(event_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS config_event (
    event_id BIGINT PRIMARY KEY,
    config_type VARCHAR(100) NOT NULL,
    CONSTRAINT fk_config_event_event
        FOREIGN KEY (event_id) REFERENCES event(event_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS file_analysis (
    run_id BIGINT PRIMARY KEY,
    verdict VARCHAR(50) NOT NULL,
    risk_score INT NOT NULL,
    confidence VARCHAR(50) NOT NULL,
    CONSTRAINT fk_file_analysis_run
        FOREIGN KEY (run_id) REFERENCES run_index(run_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS analysis_reason (
    reason_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    run_id BIGINT NOT NULL,
    reason_text TEXT NOT NULL,
    CONSTRAINT fk_analysis_reason_run
        FOREIGN KEY (run_id) REFERENCES run_index(run_id)
        ON DELETE CASCADE
);
