-- AgriVision AI SQL Relational Schema
-- Supports PostgreSQL and SQLite

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(100) NOT NULL,
    farm_name VARCHAR(255) NOT NULL,
    region VARCHAR(255) NOT NULL,
    avatar TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pest_logs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    image_url TEXT NOT NULL,
    crop_type VARCHAR(100) NOT NULL,
    pest_name VARCHAR(255) NOT NULL,
    scientific_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    confidence NUMERIC(4, 3) NOT NULL,
    severity_level VARCHAR(32) NOT NULL,
    severity_score INTEGER NOT NULL,
    detected_count INTEGER NOT NULL,
    symptoms TEXT NOT NULL,          -- JSON array of symptom descriptions
    bounding_boxes TEXT NOT NULL,    -- JSON array of normalized [x, y, w, h] boxes
    location_name VARCHAR(255) NOT NULL,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    field_sector VARCHAR(100) NOT NULL,
    ipm_recommendations TEXT NOT NULL, -- JSON object (biological, cultural, chemical)
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(32) DEFAULT 'Active',
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS decisions (
    id VARCHAR(64) PRIMARY KEY,
    log_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    treatment_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(150),
    cost_usd NUMERIC(10, 2) DEFAULT 0.00,
    decision_rationale TEXT,
    applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(32) DEFAULT 'Applied',
    FOREIGN KEY (log_id) REFERENCES pest_logs(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS impact_assessments (
    id VARCHAR(64) PRIMARY KEY,
    decision_id VARCHAR(64) NOT NULL,
    log_id VARCHAR(64) NOT NULL,
    evaluation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    pest_reduction_percent NUMERIC(5, 2) NOT NULL,
    yield_protected_kg NUMERIC(12, 2) DEFAULT 0.00,
    estimated_loss_prevented_usd NUMERIC(12, 2) DEFAULT 0.00,
    chemical_load_reduced_percent NUMERIC(5, 2) DEFAULT 0.00,
    beneficial_insects_preserved INTEGER DEFAULT 1,
    outcome_status VARCHAR(64) NOT NULL,
    notes TEXT,
    FOREIGN KEY (decision_id) REFERENCES decisions(id),
    FOREIGN KEY (log_id) REFERENCES pest_logs(id)
);

CREATE TABLE IF NOT EXISTS regional_trends (
    id VARCHAR(64) PRIMARY KEY,
    region_name VARCHAR(255) NOT NULL,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    pest_name VARCHAR(255) NOT NULL,
    crop_type VARCHAR(100) NOT NULL,
    infestation_index NUMERIC(5, 2) NOT NULL,
    weekly_change_pct NUMERIC(5, 2) NOT NULL,
    risk_level VARCHAR(32) NOT NULL,
    active_outbreak_count INTEGER NOT NULL,
    temp_celsius NUMERIC(4, 1) NOT NULL,
    humidity_pct NUMERIC(4, 1) NOT NULL,
    spread_vector VARCHAR(150),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
