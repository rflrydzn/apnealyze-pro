#include <SparkFun_Bio_Sensor_Hub_Library.h>
#include <WiFiNINA.h>
#include <Wire.h>
#include <Arduino_LSM6DS3.h>

// Wi‑Fi credentials
const char* ssid = "HUAWEI-2.4G-x5Ya";
const char* password = "17B6R3R2L";

// Server details (update with your Flask server IP and port)
const char* server = "192.168.100.151";
const int port = 5001;

// Sensor pins for the SparkFun Bio Sensor Hub
int resPin = 4;
int mfioPin = 5;

// Create an instance for the bio sensor
SparkFun_Bio_Sensor_Hub bioHub(resPin, mfioPin);
bioData body;

// Function to detect sleep position using IMU acceleration values
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
    return "Sitting / Upright"; // Ensures upright detection
  } else {
    return "Lying on Back (Supine)";  // Default to supine instead of unknown
  }
}

// Function to check recording status from the backend via the /recording/status endpoint.
bool checkRecordingStatus() {
  WiFiClient statusClient;
  if (statusClient.connect(server, port)) {
    statusClient.println("GET /recording/status HTTP/1.1");
    statusClient.println("Host: " + String(server));
    statusClient.println("Connection: close");
    statusClient.println();
    
    unsigned long timeout = millis() + 5000;
    while (!statusClient.available()) {
      if (millis() > timeout) {
        Serial.println("Status request timeout.");
        statusClient.stop();
        return false;
      }
    }
    
    String response = "";
    while (statusClient.available()) {
      response += statusClient.readString();
    }
    statusClient.stop();
    
    response.trim();
    Serial.print("Recording status response: ");
    Serial.println(response);
    
    if (response.indexOf("true") != -1) {
      return true;
    }
  } else {
    Serial.println("Failed to connect for status check.");
  }
  return false;
}

/* -------------------- Thermistor + Flex Sensor Definitions -------------------- */
// Thermistor
const int THERMISTOR_PIN = A7;
const float R_FIXED = 10000.0;  // 10k
const float THERMISTOR_NOMINAL = 10000.0; // 10k at 25°C
const float TEMPERATURE_NOMINAL = 25.0;
const float B_COEFFICIENT = 3950.0;
const float ABSOLUTE_ZERO = 273.15;
const float ADC_MAX = 1023.0;
const float V_SUPPLY = 3.3;
const float TEMP_CHANGE_THRESHOLD = 0.1;

float prevTempCelsius = 0.0;
int lastBreathState = -1; // -1 = exhale, +1 = inhale
int pendingCandidate = 0;

// Flex sensor
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

// Function to send sensor data to the backend via the /data endpoint.
// The data string includes heart rate, oxygen saturation, confidence, and the detected sleep position.
void sendDataToServer(String airflowState, String chestMovementState) {
  Serial.println("Sending sensor data to the server...");
  
  // Read bio sensor data
  body = bioHub.readBpm();
  
  // Determine sleep position using the IMU (if acceleration data is available)
  String position = "Unknown Position";
  float x, y, z;
  if (IMU.accelerationAvailable()) {
    IMU.readAcceleration(x, y, z);
    position = detectSleepPosition(x, y, z);
  }
  
  // Construct the URL-encoded data string
  String data = "heartrate=" + String(body.heartRate) +
                "&oxygen=" + String(body.oxygen) +
                "&confidence=" + String(body.confidence) +
                "&position=" + position +
                "&airflow_state=" + airflowState +
                "&chest_movement_state=" + chestMovementState;
  
  WiFiClient dataClient;
  if (dataClient.connect(server, port)) {
    dataClient.println("POST /data HTTP/1.1");
    dataClient.println("Host: " + String(server));
    dataClient.println("Content-Type: application/x-www-form-urlencoded");
    dataClient.print("Content-Length: ");
    dataClient.println(data.length());
    dataClient.println();
    dataClient.print(data);
    dataClient.stop();
    Serial.println("Data sent to server.");
  } else {
    Serial.println("Failed to connect for data sending.");
  }
}


void setup() {
  Serial.begin(115200);
  while (!Serial);  // Wait for Serial to initialize

  // Initialize I2C
  Wire.begin();

  // Initialize the bio sensor
  int result = bioHub.begin();
  if (result != 0) {
    Serial.println("Failed to initialize bio sensor!");
    while (1);
  }
  bioHub.configBpm(MODE_ONE);

  // Connect to Wi‑Fi
  Serial.print("Connecting to Wi‑Fi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println("\nConnected to Wi‑Fi");

  // Initialize the IMU for sleep position detection
  if (!IMU.begin()) {
    Serial.println("Failed to initialize IMU!");
    while (1);
  }
  Serial.println("IMU initialized. Sleeping Position Detection enabled.");
  // ---- Wait before starting flex sensor calibration ----
  Serial.println("Get ready for Flex Sensor calibration...");
  Serial.println("Calibration will begin in 7 seconds.");
  delay(7000);

  // ----- Flex Sensor Calibration -----
  Serial.println("=== Flex Sensor Breathing Calibration ===");
  Serial.println("We will do 5 inhale-exhale rounds for calibration.");
  Serial.println("Please follow the instructions on the Serial Monitor.");
  Serial.println();

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

  // Compute average and threshold for flex sensor
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
  float tempCelsius = tempKelvin - ABSOLUTE_ZERO;
  prevTempCelsius = tempCelsius;

  // Default thermistor state: exhale = -1
  lastBreathState = -1;
}

void loop() {
  // Poll the /recording/status endpoint.
  // If recording is active, send sensor and position data every 1 second.
  if (checkRecordingStatus()) {
    // --- 1) Read IMU for Sleep Position (optional debug) ---
    float x, y, z;
    if (IMU.accelerationAvailable()) {
      IMU.readAcceleration(x, y, z);
      String pos = detectSleepPosition(x, y, z);
      Serial.print("Detected Position: ");
      Serial.println(pos);
      // You can pass 'pos' to sendDataToServer() if needed
    }

    // --- 2) Thermistor for Airflow Detection ---
    int rawValue = filteredRead(THERMISTOR_PIN);
    float vOut = (V_SUPPLY * rawValue) / ADC_MAX;
    float rThermistor = R_FIXED * (V_SUPPLY - vOut) / vOut;
    float t0Kelvin = TEMPERATURE_NOMINAL + ABSOLUTE_ZERO;
    float lnRatio = log(rThermistor / THERMISTOR_NOMINAL);
    float tempKelvin = 1.0 / ((1.0 / t0Kelvin) + (lnRatio / B_COEFFICIENT));
    float tempCelsius = tempKelvin - ABSOLUTE_ZERO;
    
    // Compare with previous temperature to detect "inhale" (cooler) or "exhale" (warmer)
    float diff = tempCelsius - prevTempCelsius;
    int confirmedState = lastBreathState;  // Default: no change
    
    if (pendingCandidate == 0) {
      if (diff > TEMP_CHANGE_THRESHOLD) {
        pendingCandidate = +1; // Warmer → "exhale"
      } else if (diff < -TEMP_CHANGE_THRESHOLD) {
        pendingCandidate = -1; // Cooler → "inhale"
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
    
    prevTempCelsius = tempCelsius;
    lastBreathState = confirmedState;
    
    // Convert final state to a string
    // (swap them if you prefer +1 = "inhale" and -1 = "exhale")
    String airflowState = (confirmedState == +1) ? "inhale" : "exhale";

    // --- 3) Flex Sensor for Chest Movement Detection ---
    int flexValue = analogRead(FLEX_PIN);
    // Compare flexValue with your calibrated threshold
    String chestMovementState = (flexValue > threshold) ? "exhaling" : "inhaling";

    // --- 4) Print Both States for Debugging ---
    Serial.print("Airflow: ");
    Serial.print(airflowState);
    Serial.print(" | Chest: ");
    Serial.println(chestMovementState);

    // --- 5) Send Data to Server ---
    // Make sure sendDataToServer(...) can handle the new fields
    sendDataToServer(airflowState, chestMovementState);

    // Wait 1 second before next reading
    delay(1000);

  } else {
    // If not recording, just wait 1 second
    delay(1000);
  }
}
