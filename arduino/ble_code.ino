#include <FlashStorage.h>
#include <ArduinoBLE.h>
#include <SparkFun_Bio_Sensor_Hub_Library.h>
#include <Arduino_LSM6DS3.h>
#include <Wire.h>
#include <math.h>

// ----- BLE Service & Characteristics Definitions -----
BLEService sensorService("19B10000-E8F2-537E-4F6C-D104768A1214");

BLEIntCharacteristic heartRateChar("19B10001-E8F2-537E-4F6C-D104768A1214", BLERead | BLENotify);
BLEIntCharacteristic oxygenChar("19B10002-E8F2-537E-4F6C-D104768A1214", BLERead | BLENotify);
BLEIntCharacteristic confidenceChar("19B10003-E8F2-537E-4F6C-D104768A1214", BLERead | BLENotify);
BLEStringCharacteristic positionChar("19B10004-E8F2-537E-4F6C-D104768A1214", BLERead | BLENotify, 32);
BLEStringCharacteristic airflowStateChar("19B10005-E8F2-537E-4F6C-D104768A1214", BLERead | BLENotify, 16);
BLEStringCharacteristic chestMovementStateChar("19B10006-E8F2-537E-4F6C-D104768A1214", BLERead | BLENotify, 16);
BLEIntCharacteristic apneaFlagChar("19B10007-E8F2-537E-4F6C-D104768A1214", BLERead | BLENotify);
BLEIntCharacteristic hypopneaFlagChar("19B10008-E8F2-537E-4F6C-D104768A1214", BLERead | BLENotify);

// ----- Sensor & Global Variables -----
int resPin = 4;
int mfioPin = 5;
SparkFun_Bio_Sensor_Hub bioHub(resPin, mfioPin);
bioData body;

// Function to detect sleep position using IMU acceleration values
String detectSleepPosition(float x, float y, float z) {
  Serial.print("IMU Readings -> X: ");
  Serial.print(x);
  Serial.print(" Y: ");
  Serial.print(y);
  Serial.print(" Z: ");
  Serial.println(z);
  if (z > 0.8) return "Lying on Back (Supine)";
  else if (z < -0.8) return "Lying on Stomach (Prone)";
  else if (x > 0.8) return "Lying on Right Side";
  else if (x < -0.8) return "Lying on Left Side";
  else if (y > 0.8) return "Sitting / Upright";
  else return "Lying on Back (Supine)";
}

/* -------------------- New Thermistor Logic -------------------- */
// Thermistor on A0
const int THERMISTOR_PIN = A0;
const float R_FIXED = 10000.0;
const float THERMISTOR_NOMINAL = 10000.0;
const float TEMPERATURE_NOMINAL = 25.0;
const float B_COEFFICIENT = 3950.0;
const float ABSOLUTE_ZERO = 273.15;
const float ADC_MAX = 1023.0;
const float V_SUPPLY = 3.3;
const float TEMP_CHANGE_THRESHOLD = 0.1;

float prevTempCelsius = 0.0;
int lastBreathState = 0;   // +1 means "Exhale", -1 means "Inhale"
int pendingCandidate = 0;

/* -------------------- Flex Sensor Definitions -------------------- */
// Flex sensor is on A7 (to avoid conflict with thermistor on A0)
#define FLEX_PIN A7
#define NUM_TRAINING_ROUNDS 5
int inhaleValues[NUM_TRAINING_ROUNDS];
int exhaleValues[NUM_TRAINING_ROUNDS];
float avgInhale = 0.0;
float avgExhale = 0.0;
float threshold = 0.0;

// Calibration timestamp (milliseconds since boot)
unsigned long calibrationTimestamp = 0;

/* -------------------- Utility: Filtered ADC Read -------------------- */
int filteredRead(int pin, int samples = 10) {
  long sum = 0;
  for (int i = 0; i < samples; i++) {
    sum += analogRead(pin);
    delay(5);
  }
  return sum / samples;
}

/* -------------------- FlashStorage for Calibration Data -------------------- */
struct CalibrationData {
  float avgInhale;
  float avgExhale;
  float threshold;
  unsigned long timestamp;
};

FlashStorage(flexCalibration, CalibrationData);

// Load calibration from flash; returns true if valid calibration is found (threshold != 0)
bool loadCalibration() {
  CalibrationData savedData;
  flexCalibration.read(&savedData);  // Pass pointer to savedData
  if (savedData.threshold == 0) {
    return false;
  } else {
    avgInhale = savedData.avgInhale;
    avgExhale = savedData.avgExhale;
    threshold = savedData.threshold;
    calibrationTimestamp = savedData.timestamp;
    Serial.println("Loaded calibration values from flash:");
    Serial.print("Average Inhale: "); Serial.println(avgInhale);
    Serial.print("Average Exhale: "); Serial.println(avgExhale);
    Serial.print("Threshold: "); Serial.println(threshold);
    Serial.print("Calibration Timestamp: "); Serial.println(calibrationTimestamp);
    return true;
  }
}

// Save calibration values to flash
void saveCalibration() {
  CalibrationData data = { avgInhale, avgExhale, threshold, millis() };
  flexCalibration.write(data);
  Serial.println("Calibration data saved to flash.");
}

void performFlexCalibration() {
  Serial.println("Prepare for Flex Sensor calibration...");
  Serial.println("Calibration will begin in 7 seconds.");
  delay(7000);
  
  Serial.println("=== Flex Sensor Breathing Calibration ===");
  for (int i = 0; i < NUM_TRAINING_ROUNDS; i++) {
    Serial.print("Round ");
    Serial.print(i + 1);
    Serial.println(" - Inhale fully and hold...");
    delay(2000);
    int inhaleReading = analogRead(FLEX_PIN);
    inhaleValues[i] = inhaleReading;
    Serial.print("Captured Inhale Reading: ");
    Serial.println(inhaleReading);
    delay(1000);
    
    Serial.println("Now exhale fully and hold...");
    delay(2000);
    int exhaleReading = analogRead(FLEX_PIN);
    exhaleValues[i] = exhaleReading;
    Serial.print("Captured Exhale Reading: ");
    Serial.println(exhaleReading);
    Serial.println("----------------------------------------");
    delay(2000);
  }
  
  long sumInhale = 0, sumExhale = 0;
  for (int i = 0; i < NUM_TRAINING_ROUNDS; i++) {
    sumInhale += inhaleValues[i];
    sumExhale += exhaleValues[i];
  }
  avgInhale = (float)sumInhale / NUM_TRAINING_ROUNDS;
  avgExhale = (float)sumExhale / NUM_TRAINING_ROUNDS;
  threshold = (avgInhale + avgExhale) / 2.0;
  calibrationTimestamp = millis();
  
  Serial.println("=== Calibration Completed ===");
  Serial.print("Average Inhale: "); Serial.println(avgInhale);
  Serial.print("Average Exhale: "); Serial.println(avgExhale);
  Serial.print("Threshold set at: "); Serial.println(threshold);
  Serial.print("Calibration Timestamp: "); Serial.println(calibrationTimestamp);
  Serial.println("Begin real-time monitoring...");
  delay(2000);
  
  saveCalibration();
}

// NEW FLAG IMPLEMENTATION - Global variables for event flags and baseline oxygen
unsigned long lastAirflowChangeTime = 0;
bool apneaFlag = false;
bool hypopneaFlag = false;
float baselineOxygen = 0;  // Baseline oxygen level

void setup() {
  Serial.begin(115200);
  //while (!Serial);  // Open Serial Monitor for calibration feedback

  Wire.begin();

  // ----- Initialize BLE -----
  if (!BLE.begin()) {
    Serial.println("Failed to initialize BLE!");
    while (1);
  }
  BLE.setLocalName("Nano33IoT_SensorHub");
  BLE.setAdvertisedService(sensorService);
  sensorService.addCharacteristic(heartRateChar);
  sensorService.addCharacteristic(oxygenChar);
  sensorService.addCharacteristic(confidenceChar);
  sensorService.addCharacteristic(positionChar);
  sensorService.addCharacteristic(airflowStateChar);
  sensorService.addCharacteristic(chestMovementStateChar);
  sensorService.addCharacteristic(apneaFlagChar);
  sensorService.addCharacteristic(hypopneaFlagChar);
  BLE.addService(sensorService);
  BLE.advertise();
  Serial.println("BLE SensorHub is now advertising...");

  // ----- Initialize the Bio Sensor -----
  int result = bioHub.begin();
  if (result != 0) {
    Serial.println("Failed to initialize bio sensor!");
    while (1);
  }
  bioHub.configBpm(MODE_ONE);

  // ----- Initialize the IMU for Sleep Position Detection -----
  if (!IMU.begin()) {
    Serial.println("Failed to initialize IMU!");
    while (1);
  }
  Serial.println("IMU initialized. Sleep position detection enabled.");

  // ----- Flex Sensor Calibration or Load Saved Calibration -----
  if (!loadCalibration()) {
    Serial.println("No valid calibration found. Starting calibration...");
    performFlexCalibration();
  }
  
  // ----- Initialize Thermistor Baseline -----
  int rawValue = filteredRead(THERMISTOR_PIN);
  float vOut = (V_SUPPLY * rawValue) / ADC_MAX;
  float rThermistor = R_FIXED * (V_SUPPLY - vOut) / vOut;
  float t0Kelvin = TEMPERATURE_NOMINAL + ABSOLUTE_ZERO;
  float lnRatio = log(rThermistor / THERMISTOR_NOMINAL);
  float tempKelvin = 1.0 / ((1.0 / t0Kelvin) + (lnRatio / B_COEFFICIENT));
  float tempCelsius = tempKelvin - ABSOLUTE_ZERO;
  prevTempCelsius = tempCelsius;
  
  // Assume initial breathing state is Inhale (-1)
  lastBreathState = -1;
  lastAirflowChangeTime = millis();
  
  // Initialize baseline oxygen level from bio sensor
  body = bioHub.readBpm();
  baselineOxygen = body.oxygen;
}

void loop() {
  unsigned long loopStart = millis();
  
  // Save previous state for flag updates
  int previousBreathState = lastBreathState;
  
  BLEDevice central = BLE.central();
  if (central) {
    // 1) Read IMU for Sleep Position
    String position = "Unknown Position";
    float x, y, z;
    if (IMU.accelerationAvailable()) {
      IMU.readAcceleration(x, y, z);
      position = detectSleepPosition(x, y, z);
      Serial.print("Detected Position: ");
      Serial.println(position);
    }
    
    // 2) Thermistor Logic for Airflow Detection (Inhale/Exhale)
    int rawValue = filteredRead(THERMISTOR_PIN);
    float vOut = (V_SUPPLY * rawValue) / ADC_MAX;
    float rThermistor = R_FIXED * (V_SUPPLY - vOut) / vOut;
    float t0Kelvin = TEMPERATURE_NOMINAL + ABSOLUTE_ZERO;
    float lnRatio = log(rThermistor / THERMISTOR_NOMINAL);
    float tempKelvin = 1.0 / ((1.0 / t0Kelvin) + (lnRatio / B_COEFFICIENT));
    float tempCelsius = tempKelvin - ABSOLUTE_ZERO;
    float diff = tempCelsius - prevTempCelsius;
    int confirmedState = lastBreathState;
    
    if (pendingCandidate == 0) {
      if (diff > TEMP_CHANGE_THRESHOLD) {
        pendingCandidate = +1;  // Candidate for Exhale
      } else if (diff < -TEMP_CHANGE_THRESHOLD) {
        pendingCandidate = -1;  // Candidate for Inhale
      }
    } else {
      if ((pendingCandidate == +1) && (diff > TEMP_CHANGE_THRESHOLD)) {
        confirmedState = +1; // Exhale
        pendingCandidate = 0;
      } else if ((pendingCandidate == -1) && (diff < -TEMP_CHANGE_THRESHOLD)) {
        confirmedState = -1; // Inhale
        pendingCandidate = 0;
      } else {
        pendingCandidate = 0;
      }
    }
    
    // Modified Apnea Detection:
    // Instead of checking for no state change, we now set the apnea flag only when the breathing state remains Inhale continuously for 10 seconds.
    if (confirmedState == +1 && (millis() - lastAirflowChangeTime >= 10000)) {
      apneaFlag = true;
    } else {
      apneaFlag = false;
    }
    
    // Update airflow change timer if state changes
    if (confirmedState != previousBreathState) {
      lastAirflowChangeTime = millis();
    }
    
    prevTempCelsius = tempCelsius;
    lastBreathState = confirmedState;
    
    // 3) Flex Sensor for Chest Movement Detection
    int flexValue = analogRead(FLEX_PIN);
    String chestMovementState = (flexValue > threshold) ? "exhaling" : "inhaling";
    
    // 4) Read Bio Sensor Data (Heart Rate, Oxygen, Confidence)
    body = bioHub.readBpm();
    
    // Hypopnea Detection: Check if oxygen level drops 3% below baseline
    if (body.oxygen > 0 && body.oxygen <= baselineOxygen - 3) {
      hypopneaFlag = true;
    } else {
      hypopneaFlag = false;
    }
    
    // 5) Update BLE Characteristics with Sensor Data
    heartRateChar.writeValue(body.heartRate);
    oxygenChar.writeValue(body.oxygen);
    confidenceChar.writeValue(body.confidence);
    positionChar.writeValue(position);
    String airflowState = (confirmedState == +1) ? "Inhale" : "Exhale";
    airflowStateChar.writeValue(airflowState);
    chestMovementStateChar.writeValue(chestMovementState);
    apneaFlagChar.writeValue(apneaFlag ? 1 : 0);
    hypopneaFlagChar.writeValue(hypopneaFlag ? 1 : 0);
    
    // Print data to Serial Monitor
    Serial.print("Airflow: ");
    Serial.print(airflowState);
    Serial.print(" | Chest: ");
    Serial.print(chestMovementState);
    Serial.print(" | HR: ");
    Serial.print(body.heartRate);
    Serial.print(" | O2: ");
    Serial.print(body.oxygen);
    Serial.print(" | Apnea: ");
    Serial.print(apneaFlag ? "1" : "0");
    Serial.print(" | Hypopnea: ");
    Serial.println(hypopneaFlag ? "1" : "0");
  }
  
  unsigned long elapsed = millis() - loopStart;
  if (elapsed < 250) {
    delay(250 - elapsed);
  }
}