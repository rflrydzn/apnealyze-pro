-- 1. Create the database
CREATE DATABASE IF NOT EXISTS sensor_data;
USE sensor_data;

-- 2. Create the sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL
);

-- 3. Create the readings table
-- This table stores the main sensor data every 3 seconds.
-- It includes columns for heart rate, oxygen level, confidence, position,
-- plus two additional fields for respiratory sensor states (if you choose to send them together)
-- and two flag columns for apnea and hypopnea detection.
CREATE TABLE IF NOT EXISTS readings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    heartrate FLOAT,
    oxygen_level FLOAT,
    confidence FLOAT,
    position VARCHAR(50),
    airflow_state VARCHAR(50),          -- e.g. "Inhale" or "Exhale"
    chest_movement_state VARCHAR(50),   -- e.g. "Inhaling" or "Exhaling"
    apnea_flag INT DEFAULT 0,           -- 0 or 1 (calculated later in backend, not sent from Arduino)
    hypopnea_flag INT DEFAULT 0,        -- 0 or 1
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);


-- 4. Create the snore_readings table
-- (Optional) This table stores snore data.
CREATE TABLE IF NOT EXISTS snore_readings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    snore FLOAT,  -- for example, 1.0 means snoring detected; 0.0 means none.
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);