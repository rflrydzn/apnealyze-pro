#include <SparkFun_Bio_Sensor_Hub_Library.h>
#include <WiFiNINA.h>
#include <Wire.h>

// Wi‑Fi credentials
const char* ssid = "HUAWEI-2.4G-x5Ya";
const char* password = "17B6R3R2L";

// Server details (ensure this matches your Flask server IP)
const char* server = "192.168.100.225";
const int port = 5001;

// Sensor pins
int resPin = 4;
int mfioPin = 5;

// Sensor instance
SparkFun_Bio_Sensor_Hub bioHub(resPin, mfioPin);
bioData body;

void setup() {
  Serial.begin(115200);
  Wire.begin();

  // Initialize the sensor
  int result = bioHub.begin();
  if (result != 0) {
    Serial.println("Failed to initialize sensor!");
    while (1);
  }
  bioHub.configBpm(MODE_ONE);

  // Connect to Wi‑Fi
  Serial.print("Connecting to Wi‑Fi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println("\nConnected to Wi‑Fi");
}

/*
 * Check the recording status by calling /recording/status.
 * Returns true if the backend indicates recording is active.
 */
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
    while (statusClient.available()){
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

/*
 * Send sensor data to the server by POSTing to /data.
 */
void sendDataToServer() {
  Serial.println("Sending sensor data to the server...");
  // Read actual sensor data from the SparkFun sensor.
  body = bioHub.readBpm();
  String data = "heartrate=" + String(body.heartRate) +
                "&oxygen=" + String(body.oxygen) +
                "&confidence=" + String(body.confidence);
  
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

void loop() {
  // Poll the /recording/status endpoint to check if recording is active.
  if (checkRecordingStatus()) {
    sendDataToServer();
    delay(3000); // Send data every 3 seconds
  } else {
    delay(1000); // Check again in 1 second if not recording
  }
}
