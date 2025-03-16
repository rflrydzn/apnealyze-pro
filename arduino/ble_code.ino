#include <ArduinoBLE.h>
#include <SparkFun_Bio_Sensor_Hub_Library.h>
#include <Arduino_LSM6DS3.h>
#include <Wire.h>
#include <math.h>

// ----- BLE Service & Characteristics Definitions -----
// Define a custom BLE service UUID (you can choose any unique UUID)
BLEService sensorService("19B10000-E8F2-537E-4F6C-D104768A1214");

// Define characteristics for sensor data
BLEIntCharacteristic heartRateChar("19B10001-E8F2-537E-4F6C-D104768A1214", BLERead | BLENotify);
BLEIntCharacteristic oxygenChar("19B10002-E8F2-537E-4F6C-D104768A1214", BLERead | BLENotify);
BLEIntCharacteristic confidenceChar("19B10003-E8F2-537E-4F6C-D104768A1214", BLERead | BLENotify);
BLEStringCharacteristic positionChar("19B10004-E8F2-537E-4F6C-D104768A1214", BLERead | BLENotify, 32);
BLEStringCharacteristic airflowStateChar("19B10005-E8F2-537E-4F6C-D104768A1214", BLERead | BLENotify, 16);
BLEStringCharacteristic chestMovementStateChar("19B10006-E8F2-537E-4F6C-D104768A1214", BLERead | BLENotify, 16);

// ----- Sensor & Global Variables -----
// Sensor pins for the SparkFun Bio Sensor Hub
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

  if (z > 0.8) {
    return "Lying on Back (Supine)";
  } else if (z < -0.8) {
    return "Lying on Stomach (Prone)";
  } else if (x > 0.8) {
    return "Lying on Right Side";
  } else if (x < -0.8) {
    return "Lying on Left Side";
  } else if (y > 0.8) {
    return "Sitting / Upright";
  } else {
    return "Lying on Back (Supine)";
  }
}

/* -------------------- Thermistor + Flex Sensor Definitions -------------------- */
// Thermistor constants
const int THERMISTOR_PIN = A7;
const float R_FIXED = 10000.0;  // 10k resistor
const float THERMISTOR_NOMINAL = 10000.0; // 10k at 25°C
const float TEMPERATURE_NOMINAL = 25.0;
const float B_COEFFICIENT = 3950.0;
const float ABSOLUTE_ZERO = 273.15;
const float ADC_MAX = 1023.0;
const float V_SUPPLY = 3.3;
const float TEMP_CHANGE_THRESHOLD = 0.1;

// Timing and state tracking for thermistor-based airflow detection
float prevTempCelsius = 0.0;
int lastBreathState = 0;
int pendingCandidate = 0;
const int BUFFER_SIZE = 4;
int breathBuffer[BUFFER_SIZE] = {0};
int bufferIndex = 0;

// Flex sensor definitions and calibration variables
#define FLEX_PIN A0
#define NUM_TRAINING_ROUNDS 5
int inhaleValues[NUM_TRAINING_ROUNDS];
int exhaleValues[NUM_TRAINING_ROUNDS];
float avgInhale = 0.0;
float avgExhale = 0.0;
float threshold = 0.0;

/* -------------------- Utility: Filtered ADC Read -------------------- */
int filteredRead(int pin, int samples = 10) {
  long sum = 0;
  for (int i = 0; i < samples; i++) {
    sum += analogRead(pin);
    delay(5);
  }
  return sum / samples;
}

void setup() {
  Serial.begin(115200);
  while (!Serial);  // Wait for Serial to initialize

  Wire.begin();

  // ----- Initialize BLE -----
  if (!BLE.begin()) {
    Serial.println("Failed to initialize BLE!");
    while (1);
  }
  BLE.setLocalName("Nano33IoT_SensorHub");
  BLE.setAdvertisedService(sensorService);

  // Add all characteristics to the service
  sensorService.addCharacteristic(heartRateChar);
  sensorService.addCharacteristic(oxygenChar);
  sensorService.addCharacteristic(confidenceChar);
  sensorService.addCharacteristic(positionChar);
  sensorService.addCharacteristic(airflowStateChar);
  sensorService.addCharacteristic(chestMovementStateChar);

  // Add the service and start advertising
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

  // ----- Flex Sensor Calibration -----
  Serial.println("Prepare for Flex Sensor calibration...");
  Serial.println("Calibration will begin in 7 seconds.");
  delay(7000);

  Serial.println("=== Flex Sensor Breathing Calibration ===");
  Serial.println("Perform 5 inhale-exhale rounds for calibration.");
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

  // Compute average readings and set threshold
  long sumInhale = 0, sumExhale = 0;
  for (int i = 0; i < NUM_TRAINING_ROUNDS; i++) {
    sumInhale += inhaleValues[i];
    sumExhale += exhaleValues[i];
  }
  avgInhale = (float)sumInhale / NUM_TRAINING_ROUNDS;
  avgExhale = (float)sumExhale / NUM_TRAINING_ROUNDS;
  threshold = (avgInhale + avgExhale) / 2.0;

  Serial.println("=== Calibration Completed ===");
  Serial.print("Average Inhale: ");
  Serial.println(avgInhale);
  Serial.print("Average Exhale: ");
  Serial.println(avgExhale);
  Serial.print("Threshold set at: ");
  Serial.println(threshold);
  Serial.println("Begin real-time monitoring...");
  delay(2000);

  // ----- Thermistor Baseline -----
  int rawValue = filteredRead(THERMISTOR_PIN);
  float vOut = (V_SUPPLY * rawValue) / ADC_MAX;
  float rThermistor = R_FIXED * (V_SUPPLY - vOut) / vOut;
  float t0Kelvin = TEMPERATURE_NOMINAL + ABSOLUTE_ZERO;
  float lnRatio = log(rThermistor / THERMISTOR_NOMINAL);
  float tempKelvin = 1.0 / ((1.0 / t0Kelvin) + (lnRatio / B_COEFFICIENT));
  prevTempCelsius = tempKelvin - ABSOLUTE_ZERO;

  lastBreathState = -1;
}

void loop() {
  unsigned long loopStart = millis();
  
  // Check if a BLE central (client) is connected
  BLEDevice central = BLE.central();
  if (central) {
    // ----- 1) Read IMU for Sleep Position -----
    String position = "Unknown Position";
    float x, y, z;
    if (IMU.accelerationAvailable()) {
      IMU.readAcceleration(x, y, z);
      position = detectSleepPosition(x, y, z);
      Serial.print("Detected Position: ");
      Serial.println(position);
    }

    // ----- 2) Thermistor for Airflow Detection -----
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
        pendingCandidate = +1; 
      } else if (diff < -TEMP_CHANGE_THRESHOLD) {
        pendingCandidate = -1;
      }
    } else {
      if ((pendingCandidate == +1) && (diff > TEMP_CHANGE_THRESHOLD)) {
        confirmedState = +1;
        pendingCandidate = 0;
      } else if ((pendingCandidate == -1) && (diff < -TEMP_CHANGE_THRESHOLD)) {
        confirmedState = -1;
        pendingCandidate = 0;
      } else {
        pendingCandidate = 0;
      }
    }

    breathBuffer[bufferIndex] = confirmedState;
    bufferIndex = (bufferIndex + 1) % BUFFER_SIZE;

    bool hasCycle = false;
    int firstState = breathBuffer[0];
    for (int i = 1; i < BUFFER_SIZE; i++) {
      if (breathBuffer[i] != firstState) {
        hasCycle = true;
        break;
      }
    }
    String airflowState;
    if (hasCycle) {
      airflowState = "CYCLE";
    } else if (lastBreathState == +1) {
      airflowState = "INHALE";
    } else {
      airflowState = "EXHALE";
    }
    prevTempCelsius = tempCelsius;
    lastBreathState = confirmedState;

    // ----- 3) Flex Sensor for Chest Movement Detection -----
    int flexValue = analogRead(FLEX_PIN);
    String chestMovementState = (flexValue > threshold) ? "exhaling" : "inhaling";

    // ----- 4) Read Bio Sensor Data (Heart Rate, Oxygen, Confidence) -----
    body = bioHub.readBpm();

    // ----- 5) Update BLE Characteristics with Sensor Data -----
    heartRateChar.writeValue(body.heartRate);
    oxygenChar.writeValue(body.oxygen);
    confidenceChar.writeValue(body.confidence);
    positionChar.writeValue(position);
    airflowStateChar.writeValue(airflowState);
    chestMovementStateChar.writeValue(chestMovementState);

    // Debug output to Serial Monitor
    Serial.print("Airflow: ");
    Serial.print(airflowState);
    Serial.print(" | Chest: ");
    Serial.print(chestMovementState);
    Serial.print(" | HR: ");
    Serial.print(body.heartRate);
    Serial.print(" | O2: ");
    Serial.println(body.oxygen);
  }
  
  // Enforce a 250ms loop interval (including processing time)
  unsigned long elapsed = millis() - loopStart;
  if (elapsed < 250) {
    delay(250 - elapsed);
  }
}