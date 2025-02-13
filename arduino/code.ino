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
    return "Sitting / Upright";
  } else {
    return "Unknown Position";
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

// Function to send sensor data to the backend via the /data endpoint.
// The data string includes heart rate, oxygen saturation, confidence, and the detected sleep position.
void sendDataToServer() {
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
                "&position=" + position;
  
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
}

void loop() {
  // Poll the /recording/status endpoint.
  // If recording is active, send sensor and position data every 3 seconds.
  if (checkRecordingStatus()) {
    sendDataToServer();
    
    // Also print the detected sleep position to Serial for debugging.
    float x, y, z;
    if (IMU.accelerationAvailable()) {
      IMU.readAcceleration(x, y, z);
      String pos = detectSleepPosition(x, y, z);
      Serial.print("Detected Position: ");
      Serial.println(pos);
    }
    delay(3000);
  } else {
    delay(1000);
  }
}
