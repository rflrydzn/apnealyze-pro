from flask import Flask, request
from flask_cors import CORS
import threading
import time
import mysql.connector
from mysql.connector import Error
import requests  # For sending POST requests to /data

app = Flask(__name__)

# Enable CORS for all domains
CORS(app)

# This flag will store whether we should be sending data
sending_data = False
data_thread = None  # The thread will be stored here

# MySQL configuration
host = 'localhost'
database = 'sensor_data'
user = 'root'
password = 'dizon0019'

# Data insertion function into MySQL
def insert_data(heartrate, oxygen, confidence):
    try:
        connection = mysql.connector.connect(
            host=host,
            database=database,
            user=user,
            password=password
        )
        if connection.is_connected():
            cursor = connection.cursor()
            query = "INSERT INTO readings (heartrate, oxygen_level, confidence) VALUES (%s, %s, %s)"
            cursor.execute(query, (heartrate, oxygen, confidence))
            connection.commit()
            cursor.close()
            print("Data inserted:", heartrate, oxygen, confidence)
    except Error as e:
        print("Error while connecting to MySQL", e)
    finally:
        if connection.is_connected():
            connection.close()

# Data sending function that waits for the trigger from frontend
def send_data_to_db():
    global sending_data
    while sending_data:
        # Receive sensor data from Arduino (via POST request)
        # Use placeholders here; real sensor data comes from Arduino
        heartrate = 75  # Placeholder, replace with real sensor data from Arduino
        oxygen = 98     # Placeholder
        confidence = 95 # Placeholder

        # Send dynamic data to DB
        print(f"Sending data to DB: heartrate={heartrate}, oxygen={oxygen}, confidence={confidence}")

        # Send data to Flask /data endpoint using requests
        response = requests.post("http://localhost:5001/data", data={
            "heartrate": heartrate,
            "oxygen": oxygen,
            "confidence": confidence
        })

        if response.status_code == 200:
            print("Data successfully sent to the server.")
        else:
            print("Failed to send data to the server.")

        # Sleep for 2 seconds before sending the next set of data
        time.sleep(2)

# Endpoint to start sending data
@app.route('/start-sending-data', methods=['POST'])
def start_sending_data():
    global sending_data, data_thread
    if not sending_data:
        sending_data = True
        # Start sending data in a separate thread only when triggered by the frontend
        data_thread = threading.Thread(target=send_data_to_db)
        data_thread.start()
        return "Data sending started.", 200
    return "Data is already being sent.", 400

# Endpoint to stop sending data
@app.route('/stop-sending-data', methods=['POST'])
def stop_sending_data():
    global sending_data
    if sending_data:
        sending_data = False
        # Wait for the thread to stop (gracefully stop it)
        if data_thread is not None:
            data_thread.join()  # Ensure the thread has finished before stopping
        return "Data sending stopped.", 200
    return "No data is being sent.", 400

# The /data endpoint for inserting received sensor data into MySQL
@app.route('/data', methods=['POST'])
def receive_data():
    # Receive dynamic sensor data from the POST request body
    try:
        heartrate = request.form.get('heartrate')
        oxygen = request.form.get('oxygen')
        confidence = request.form.get('confidence')

        # Validate that all data is present
        if heartrate and oxygen and confidence:
            # Insert the received data into the database
            insert_data(heartrate, oxygen, confidence)
            return "Data received and stored.", 200
        else:
            return "Invalid data.", 400
    except Exception as e:
        return f"Error processing the data: {e}", 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001)
