import asyncio
from bleak import BleakClient, BleakScanner
import aiohttp

# UUIDs for the BLE characteristics (must match Arduino)
UUID_HEART_RATE = "19B10001-E8F2-537E-4F6C-D104768A1214"
UUID_OXYGEN = "19B10002-E8F2-537E-4F6C-D104768A1214"
UUID_CONFIDENCE = "19B10003-E8F2-537E-4F6C-D104768A1214"
UUID_POSITION = "19B10004-E8F2-537E-4F6C-D104768A1214"
UUID_AIRFLOW = "19B10005-E8F2-537E-4F6C-D104768A1214"
UUID_CHEST = "19B10006-E8F2-537E-4F6C-D104768A1214"

# Global dictionary to store sensor data
sensor_data = {
    "heartrate": 0,
    "oxygen": 0,
    "confidence": 0,
    "position": "",
    "airflow_state": "",
    "chest_movement_state": ""
}

# Notification callbacks for each characteristic
def heart_rate_callback(sender, data):
    sensor_data["heartrate"] = int.from_bytes(data, byteorder='little')
    
def oxygen_callback(sender, data):
    sensor_data["oxygen"] = int.from_bytes(data, byteorder='little')
    
def confidence_callback(sender, data):
    sensor_data["confidence"] = int.from_bytes(data, byteorder='little')
    
def position_callback(sender, data):
    sensor_data["position"] = data.decode('utf-8').strip()
    
def airflow_callback(sender, data):
    sensor_data["airflow_state"] = data.decode('utf-8').strip()
    
def chest_callback(sender, data):
    sensor_data["chest_movement_state"] = data.decode('utf-8').strip()

# ----------------------------------------------------------------------------
# NEW FUNCTION: Checks the Flask server's /recording/status endpoint
# ----------------------------------------------------------------------------
async def check_recording_status(session, status_url):
    try:
        async with session.get(status_url) as resp:
            if resp.status == 200:
                text = await resp.text()
                return text.strip() == "true"
    except Exception as e:
        print("Error checking recording status:", e)
    return False

# Function to send sensor data to the backend using aiohttp
async def send_data_to_backend(session, backend_url):
    payload = {
        "heartrate": sensor_data["heartrate"],
        "oxygen": sensor_data["oxygen"],
        "confidence": sensor_data["confidence"],
        "position": sensor_data["position"],
        "airflow_state": sensor_data["airflow_state"],
        "chest_movement_state": sensor_data["chest_movement_state"],
    }
    try:
        async with session.post(backend_url, data=payload) as resp:
            if resp.status != 200:
                print("Failed to send data, status:", resp.status)
            else:
                print("Data sent:", payload)
    except Exception as e:
        print("Error sending data:", e)

# ----------------------------------------------------------------------------
# MODIFIED data_sender to only send data if /recording/status == "true"
# ----------------------------------------------------------------------------
async def data_sender(backend_url, status_url):
    async with aiohttp.ClientSession() as session:
        while True:
            # 1) Check if recording is active
            is_active = await check_recording_status(session, status_url)
            
            # 2) If active, send data; otherwise skip
            if is_active:
                await send_data_to_backend(session, backend_url)
            else:
                # Optionally print a debug message
                # print("Recording not active, skipping data send.")
                pass
            
            # Wait 250ms before checking again
            await asyncio.sleep(0.25)

async def scan_for_device(timeout=10):
    devices = await BleakScanner.discover(timeout=timeout)
    for d in devices:
        print("Found device:", d.name, d.address)
    return devices

async def run():
    # Scan for the BLE device with name "Nano33IoT_SensorHub"
    print("Scanning for BLE devices...")
    devices = await BleakScanner.discover()
    target_device = None
    for d in devices:
        # Adjust as needed: if your device's name is "Nano33IoT_SensorHub",
        # use that string. If it shows up as "Arduino", keep it as is.
        if d.name == "Arduino":
            target_device = d
            break
    if not target_device:
        print("Device not found!")
        return
    print("Found device:", target_device)

    # Adjust these as needed:
    backend_url = "http://192.168.100.151:5001/data"  
    status_url = "http://192.168.100.151:5001/recording/status"

    async with BleakClient(target_device.address) as client:
        if not client.is_connected:
            print("Failed to connect to the device.")
            return
        print("Connected to", target_device.address)
        
        # Start notifications for all characteristics
        await client.start_notify(UUID_HEART_RATE, heart_rate_callback)
        await client.start_notify(UUID_OXYGEN, oxygen_callback)
        await client.start_notify(UUID_CONFIDENCE, confidence_callback)
        await client.start_notify(UUID_POSITION, position_callback)
        await client.start_notify(UUID_AIRFLOW, airflow_callback)
        await client.start_notify(UUID_CHEST, chest_callback)
        
        # Run the periodic data sender (checks server status every 250ms)
        await data_sender(backend_url, status_url)

if __name__ == "__main__":
    asyncio.run(run())