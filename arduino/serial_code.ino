#include <SparkFun_Bio_Sensor_Hub_Library.h>
#include <Wire.h>
#include <Arduino_LSM6DS3.h>

// Sensor pins for the SparkFun Bio Sensor Hub
int resPin = 4;
int mfioPin = 5;

// Create an instance for the bio sensor
SparkFun_Bio_Sensor_Hub bioHub(resPin, mfioPin);
bioData body;

// Global flag to control session state
bool sessionActive = false;

// Function to detect sleep position using IMU acceleration values
String detectSleepPosition(float x, float y, float z) {
  if (z > 0.8) {
    return "Lying on Back (Supine)";
  } else if (z < -0.8) {
    return "Lying on Stomach (Prone)";
  } else if (x > 0.8) {
    return "Lying on Right Side";
  } else if (x < -0.8) {
    return "Lying on Left Side";
  } else if (y > 0.8) {
    return "Sitting / Upright"; // Ensures upright detection
  } else {
    return "Lying on Back (Supine)";  // Default to supine instead of unknown
  }
}

/* -------------------- Thermistor + Flex Sensor Definitions -------------------- */
// Thermistor parameters
const int THERMISTOR_PIN = A7;
const float R_FIXED = 10000.0;  // 10k ohm
const float THERMISTOR_NOMINAL = 10000.0; // 10k ohm at 25°C
const float TEMPERATURE_NOMINAL = 25.0;
const float B_COEFFICIENT = 3950.0;
const float ABSOLUTE_ZERO = 273.15;
const float ADC_MAX = 1023.0;
const float V_SUPPLY = 3.3;
const float TEMP_CHANGE_THRESHOLD = 0.1;

// Flex sensor parameters
#define FLEX_PIN A0
#define NUM_TRAINING_ROUNDS 5
int inhaleValues[NUM_TRAINING_ROUNDS];
int exhaleValues[NUM_TRAINING_ROUNDS];
float avgInhale = 0.0;
float avgExhale = 0.0;
float threshold = 0.0;

// Timing and state tracking for thermistor-based airflow detection
float prevTempCelsius = 0.0;
int lastBreathState = 0;

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
  while (!Serial);  // Wait for Serial connection

  // Initialize I2C
  Wire.begin();

  // Initialize the bio sensor
  int result = bioHub.begin();
  if (result != 0) {
    Serial.println("Failed to initialize bio sensor!");
    while (1);
  }
  bioHub.configBpm(MODE_ONE);

  // Initialize the IMU for sleep position detection
  if (!IMU.begin()) {
    Serial.println("Failed to initialize IMU!");
    while (1);
  }

  // ---- Flex Sensor Calibration ----
  Serial.println("Get ready for Flex Sensor calibration...");
  Serial.println("Calibration will begin in 7 seconds.");
  delay(7000);

  Serial.println("=== Flex Sensor Breathing Calibration ===");
  for (int i = 0; i < NUM_TRAINING_ROUNDS; i++) {
    // Inhale calibration
    Serial.print("Round ");
    Serial.print(i + 1);
    Serial.println(" - Inhale fully and hold...");
    delay(2000);
    int inhaleReading = analogRead(FLEX_PIN);
    inhaleValues[i] = inhaleReading;
    Serial.print("Captured Inhale Reading: ");
    Serial.println(inhaleReading);
    delay(1000);

    // Exhale calibration
    Serial.println("Now exhale fully and hold...");
    delay(2000);
    int exhaleReading = analogRead(FLEX_PIN);
    exhaleValues[i] = exhaleReading;
    Serial.print("Captured Exhale Reading: ");
    Serial.println(exhaleReading);
    Serial.println("----------------------------------------");
    delay(2000);
  }

  // Compute averages and threshold for the flex sensor
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

  // ----- Thermistor Baseline -----
  int rawValue = filteredRead(THERMISTOR_PIN);
  float vOut = (V_SUPPLY * rawValue) / ADC_MAX;
  float rThermistor = R_FIXED * (V_SUPPLY - vOut) / vOut;
  float t0Kelvin = TEMPERATURE_NOMINAL + ABSOLUTE_ZERO;
  float lnRatio = log(rThermistor / THERMISTOR_NOMINAL);
  float tempKelvin = 1.0 / ((1.0 / t0Kelvin) + (lnRatio / B_COEFFICIENT));
  prevTempCelsius = tempKelvin - ABSOLUTE_ZERO;

  lastBreathState = -1;

  Serial.println("Waiting for session start command...");
}

void loop() {
  // Check for incoming serial commands ("start" or "stop")
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    if (command.equalsIgnoreCase("start")) {
      sessionActive = true;
      Serial.println("Session started");
    } else if (command.equalsIgnoreCase("stop")) {
      sessionActive = false;
      Serial.println("Session stopped");
    }
  }

  // Only send sensor data if a session is active
  if (sessionActive) {
    // 1) Read bio sensor data
    body = bioHub.readBpm();

    // 2) Determine sleep position using IMU data
    String position = "Unknown Position";
    float x, y, z;
    if (IMU.accelerationAvailable()) {
      IMU.readAcceleration(x, y, z);
      position = detectSleepPosition(x, y, z);
    }
    
    // 3) Thermistor-based airflow detection
    int rawValue = filteredRead(THERMISTOR_PIN);
    float vOut = (V_SUPPLY * rawValue) / ADC_MAX;
    float rThermistor = R_FIXED * (V_SUPPLY - vOut) / vOut;
    float t0Kelvin = TEMPERATURE_NOMINAL + ABSOLUTE_ZERO;
    float lnRatio = log(rThermistor / THERMISTOR_NOMINAL);
    float tempKelvin = 1.0 / ((1.0 / t0Kelvin) + (lnRatio / B_COEFFICIENT));
    float tempCelsius = tempKelvin - ABSOLUTE_ZERO;
    
    int confirmedState = (tempCelsius - prevTempCelsius > TEMP_CHANGE_THRESHOLD) ? +1 :
                         (tempCelsius - prevTempCelsius < -TEMP_CHANGE_THRESHOLD) ? -1 : lastBreathState;
    prevTempCelsius = tempCelsius;
    lastBreathState = confirmedState;
    String airflowState = (confirmedState == +1) ? "INHALE" : "EXHALE";
    
    // 4) Flex sensor for chest movement detection
    int flexValue = analogRead(FLEX_PIN);
    String chestMovementState = (flexValue > threshold) ? "exhaling" : "inhaling";
    
    // 5) Construct the data string (URL‑encoded format)
    String dataString = "heartrate=" + String(body.heartRate) +
                        "&oxygen=" + String(body.oxygen) +
                        "&confidence=" + String(body.confidence) +
                        "&position=" + position +
                        "&airflow_state=" + airflowState +
                        "&chest_movement_state=" + chestMovementState;
    
    // Send sensor data over serial
    Serial.println(dataString);
  }
  
  delay(250);  // 250ms delay => ~4 rows per second when sessionActive
}