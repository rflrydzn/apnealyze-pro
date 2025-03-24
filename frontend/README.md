# 🛌 Sleep Apnea Detection System – User Manual

Welcome to the Sleep Apnea Detection System! This guide will help you set up, run, and interpret results from your hardware and web application.

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