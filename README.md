# 🛌 APNEA-LYZE PRO – User Manual

Welcome to the APNEA-LYZE PRO System! This guide will help you set up, run, and interpret results from your hardware and web application.

---
## 📦 Prerequisites

Ensure the following are installed **before** running the system:

- [Node.js (v18+)](https://nodejs.org/)
- [Python (3.10)](https://www.python.org/downloads/release/python-3100/)
- [MySQL Server](https://dev.mysql.com/downloads/mysql/)
- [MySQL Workbench](https://dev.mysql.com/downloads/workbench/)

---

## 🗃️ MySQL Database Setup

1. Install MySQL and MySQL Workbench using the links above.
2. Open **MySQL Workbench**.
3. Create a new connection and log in to your local server.
4. Run the following SQL script to initialize the database:

```sql
-- Database and Tables
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
```

---

## 🛠️ DEVICE SETUP

### 1. Check Connections
- ✅ Ensure all sensor cables are securely connected.

### 2. Wear the Device Properly
- 🫁 Wear the **chest belt**
- 🩸 Wear the **oximeter**
- 👃 Wear the **nasal cannula**

### 3. Connect to Laptop
- Plug the device into your **laptop's USB port**.

---

## 💻 ARDUINO SETUP

### 4. Navigate to Arduino Folder
```bash
cd arduino
```

### 5. Upload Code to Arduino
- Open `ble_code.ino`
- Copy the code
- Launch **Arduino IDE**
- Paste the code
- Upload to the board

### 6. Flex Sensor Calibration
- Open **Serial Monitor**
- Follow the instructions to calibrate the flex sensor.

### 7. Power Option
- After calibration, you may disconnect from the laptop and connect to a **powerbank**.

---

## 🧠 BACKEND SETUP

### 8. Navigate to Backend Folder
```bash
cd backend
```

### 9. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 10. Run Backend Server
```bash
python backend.py
```
> Copy the IP from the output (e.g. `http://192.168.100.225:5001`) and paste into the `.env` in the **root folder** as:
```
FLASK_IP_ADDRESS=192.168.100.225
```

### 11. Run BLE Backend
```bash
python ble_backend.py
```
- Should say **“Device connected”**.

### 12. (Optional) Run Snoring Detection
```bash
python mic.py
```

---

## 🌐 FRONTEND SETUP

### 13. Navigate to Frontend Folder
```bash
cd frontend
```

### 14. Install Node.js Dependencies
```bash
npm install
```

### 15. Start the Web App
```bash
npm start
```

---

## 📋 USAGE INSTRUCTIONS

### ➤ Start Recording
- Go to the **Recording Control** page.
- Click **Start Recording**.
- Verify data in the **backend.py** terminal.

### 💤 While Sleeping
- System records data as you sleep.

### 🛑 After Waking Up
- Click **Stop Recording**.
- Or unplug the device from powerbank.

### 📊 View Report
- Go to **Recording Sessions** to view detailed reports.

---

## 🧠 MACHINE LEARNING PREDICTION

### ➤ Run ML API (Python 3.10)
```bash
cd backend
python app.py
```

### ➤ Predict Severity
- Navigate to **Machine Learning Prediction** in the app.
- Input features.
- Click **Submit** to receive prediction.

> ⚠️ This ML model is **not a diagnostic tool**. It offers estimates based on your input.  
> Achieved **91% accuracy**, but may misclassify **mild/moderate** due to data imbalance.  
> **Don’t panic** if it shows "Severe" — consult a professional.

---

© 2025 Team 1 – Rafael Roy Dizon, Enrico Miguel Velasquez, Russel Ian Samson