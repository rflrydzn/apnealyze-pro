#include <SparkFun_Bio_Sensor_Hub_Library.h>
#include <WiFiNINA.h>
#include <Wire.h>

// Wi-Fi credentials
const char* ssid = "HUAWEI-2.4G-x5Ya";
const char* password = "17B6R3R2L";

// Server details
const char* server = "192.168.100.225"; // Replace with your Flask server's IP
const int port = 5001;

// Sensor pins
int resPin = 4;
int mfioPin = 5;
int buttonPin = 6; // Pin connected to your physical button

// Sensor instance
SparkFun_Bio_Sensor_Hub bioHub(resPin, mfioPin);
bioData body;

WiFiClient client;

// Debouncing and triple press variables
unsigned long lastButtonPress = 0;
const unsigned long debounceDelay = 200;  // Delay for debouncing (200ms)
int pressCount = 0;  // Counter for the number of button presses
bool sendingData = false;  // Flag to track whether data sending is on or off
unsigned long buttonHoldStart = 0;  // Track when button hold starts

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

  // Set button pin mode
  pinMode(buttonPin, INPUT_PULLUP);  // Use internal pull-up resistor

  // Connect to Wi-Fi
  Serial.print("Connecting to Wi-Fi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println("Connected to Wi-Fi");
}

void loop() {
  int buttonState = digitalRead(buttonPin);  // Read the button state

  // Check if the button is pressed (LOW when pressed due to INPUT_PULLUP)
  if (buttonState == LOW && (millis() - lastButtonPress > debounceDelay)) {
    lastButtonPress = millis();  // Update the last button press time
    pressCount++;  // Increment the press count

    Serial.print("Button pressed, press count: ");
    Serial.println(pressCount);

    // If button has been pressed 3 times, trigger the data collection
    if (pressCount == 3) {
      Serial.println("Three presses detected! Starting data collection...");
      sendingData = true;  // Set flag to start sending data
      pressCount = 0;  // Reset press count after the action
    }

    delay(500);  // Small delay to avoid multiple detections from the same press
  }

  // If data sending is triggered, continuously send data every 2 seconds
  if (sendingData) {
    sendDataToServer();  // Send the data to the server
    delay(2000); // Wait 2 seconds before sending data again
  }

  // If the button is being held down for more than 4 seconds, stop sending data
  if (buttonState == LOW && buttonHoldStart == 0) {
    buttonHoldStart = millis();  // Start counting the hold time
  }

  if (buttonState == HIGH && buttonHoldStart > 0) {
    // Check if the button was held for 4 seconds
    if (millis() - buttonHoldStart >= 4000) {
      // Stop sending data if held for 4 seconds
      sendingData = false;
      Serial.println("Button held for 4 seconds. Stopping data collection.");
    }
    buttonHoldStart = 0;  // Reset the button hold timer when released
  }
}

// Function to send data to the server
void sendDataToServer() {
  Serial.println("Sensor is turned ON and sending data to the server...");

  // Read sensor data
  body = bioHub.readBpm();
  String data = "heartrate=" + String(body.heartRate) + 
                "&oxygen=" + String(body.oxygen) + 
                "&confidence=" + String(body.confidence);

  // Send the data to the server
  if (client.connect(server, port)) {
    client.println("POST /data HTTP/1.1");
    client.println("Host: " + String(server));
    client.println("Content-Type: application/x-www-form-urlencoded");
    client.print("Content-Length: ");
    client.println(data.length());
    client.println();
    client.print(data);
    client.stop();  // Close the connection
    Serial.println("Data sent to server.");
  } else {
    Serial.println("Failed to connect to server.");
  }
}
