import serial
import serial.tools.list_ports
import urllib.parse
import mysql.connector
from mysql.connector import Error

# MySQL configuration – update these with your MySQL credentials
db_host = 'localhost'
database = 'sensor_data'
db_user = 'root'
db_password = 'dizon0019'

def insert_data(heartrate, oxygen, confidence, position, airflow_state, chest_movement_state):
    try:
        connection = mysql.connector.connect(
            host=db_host,
            database=database,
            user=db_user,
            password=db_password
        )
        if connection.is_connected():
            cursor = connection.cursor()
            query = """
                INSERT INTO readings (heartrate, oxygen_level, confidence, position, airflow_state, chest_movement_state)
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            cursor.execute(query, (heartrate, oxygen, confidence, position, airflow_state, chest_movement_state))
            connection.commit()
            cursor.close()
            print("Data inserted:", heartrate, oxygen, confidence, position, airflow_state, chest_movement_state)
    except Error as e:
        print("Error inserting data into MySQL:", e)
    finally:
        if connection.is_connected():
            connection.close()

def process_line(line):
    # Expecting a URL‑encoded string like:
    # "heartrate=xx&oxygen=xx&confidence=xx&position=xxx&airflow_state=xxx&chest_movement_state=xxx"
    data = urllib.parse.parse_qs(line)
    try:
        heartrate = data.get('heartrate', [None])[0]
        oxygen = data.get('oxygen', [None])[0]
        confidence = data.get('confidence', [None])[0]
        position = data.get('position', [None])[0]
        airflow_state = data.get('airflow_state', [None])[0]
        chest_movement_state = data.get('chest_movement_state', [None])[0]

        if None in (heartrate, oxygen, confidence, position, airflow_state, chest_movement_state):
            print("Incomplete data:", data)
        else:
            insert_data(heartrate, oxygen, confidence, position, airflow_state, chest_movement_state)
    except Exception as e:
        print("Error processing line:", line, e)

def main():
    # Optionally list ports to help identify the correct one
    ports = serial.tools.list_ports.comports()
    for port in ports:
        print(f"Found port: {port.device}")
    
    # Replace with your detected Arduino port (e.g., "/dev/cu.usbmodem14301")
    serial_port = "/dev/cu.usbmodem101"
    baud_rate = 115200
    
    try:
        ser = serial.Serial(serial_port, baud_rate, timeout=1)
        print(f"Connected to {serial_port}")
    except serial.SerialException as e:
        print(f"Error: Could not open {serial_port} - {e}")
        return

    # Wait for user input to start the session
    input("Press Enter to start session...")
    ser.write(b"start\n")
    
    # Now, continuously read sensor data from the Arduino
    while True:
        try:
            if ser.in_waiting:
                line = ser.readline().decode('utf-8').strip()
                if line:
                    print("Received:", line)
                    # Ignore confirmation messages from the Arduino
                    if "Session started" in line:
                        continue
                    process_line(line)
        except Exception as e:
            print("Error reading from serial:", e)

if __name__ == "__main__":
    main()