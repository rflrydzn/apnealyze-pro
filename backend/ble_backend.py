import asyncio
from bleak import BleakClient, BleakScanner
import aiohttp
from dotenv import load_dotenv
import os
from pathlib import Path

# UUIDs for the BLE characteristics (must match Arduino)
UUID_HEART_RATE = "19B10001-E8F2-537E-4F6C-D104768A1214"
UUID_OXYGEN = "19B10002-E8F2-537E-4F6C-D104768A1214"
UUID_CONFIDENCE = "19B10003-E8F2-537E-4F6C-D104768A1214"
UUID_POSITION = "19B10004-E8F2-537E-4F6C-D104768A1214"
UUID_AIRFLOW = "19B10005-E8F2-537E-4F6C-D104768A1214"
UUID_CHEST = "19B10006-E8F2-537E-4F6C-D104768A1214"
UUID_APNEA = "19B10007-E8F2-537E-4F6C-D104768A1214"
UUID_HYPOPNOEA = "19B10008-E8F2-537E-4F6C-D104768A1214"

# Load .env from the parent of the backend folder
env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Access the IP address from .env
backend_ip = os.getenv("FLASK_IP_ADDRESS")

# Global dictionary to store sensor data
sensor_data = {
    "heartrate": 0,
    "oxygen": 0,
    "confidence": 0,
    "position": "",
    "airflow_state": "",
    "chest_movement_state": "",
    "apnea_flag": 0,
    "hypopnea_flag": 0
}

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

async def apnea_callback(sender, data):
    sensor_data["apnea_flag"] = int.from_bytes(data, byteorder='little')

async def hypopnea_callback(sender, data):
    sensor_data["hypopnea_flag"] = int.from_bytes(data, byteorder='little')

# In your BLE backend, you must also have a way to get the apnea and hypopnea flags.
# This could be via additional BLE characteristics, or if you're sending them as part of the data payload.
# For simplicity, assume that sensor_data is updated accordingly.

async def check_recording_status(session, status_url):
    try:
        async with session.get(status_url) as resp:
            if resp.status == 200:
                text = await resp.text()
                return text.strip() == "true"
    except Exception as e:
        print("Error checking recording status:", e)
    return False

async def send_data_to_backend(session, backend_url):
    payload = {
        "heartrate": sensor_data["heartrate"],
        "oxygen": sensor_data["oxygen"],
        "confidence": sensor_data["confidence"],
        "position": sensor_data["position"],
        "airflow_state": sensor_data["airflow_state"],
        "chest_movement_state": sensor_data["chest_movement_state"],
        "apnea_flag": sensor_data["apnea_flag"],
        "hypopnea_flag": sensor_data["hypopnea_flag"],
    }
    try:
        async with session.post(backend_url, data=payload) as resp:
            if resp.status != 200:
                print("Failed to send data, status:", resp.status)
            else:
                print("Data sent:", payload)
    except Exception as e:
        print("Error sending data:", e)

async def data_sender(backend_url, status_url):
    async with aiohttp.ClientSession() as session:
        while True:
            is_active = await check_recording_status(session, status_url)
            if is_active:
                await send_data_to_backend(session, backend_url)
            await asyncio.sleep(0.25)

async def run():
    print("Scanning for BLE devices...")
    devices = await BleakScanner.discover()
    target_device = None
    for d in devices:
        if d.name == "Nano33IoT_SensorHub":
            target_device = d
            break
    if not target_device:
        print("Device not found!")
        return
    print("Found device:", target_device)

    backend_url = f"http://{backend_ip}:5001/data" 
    status_url = f"http://{backend_ip}:5001/recording/status"

    async with BleakClient(target_device.address) as client:
        if not client.is_connected:
            print("Failed to connect to the device.")
            return
        print("Connected to", target_device.address)
        
        await client.start_notify(UUID_HEART_RATE, heart_rate_callback)
        await client.start_notify(UUID_OXYGEN, oxygen_callback)
        await client.start_notify(UUID_CONFIDENCE, confidence_callback)
        await client.start_notify(UUID_POSITION, position_callback)
        await client.start_notify(UUID_AIRFLOW, airflow_callback)
        await client.start_notify(UUID_CHEST, chest_callback)
        await client.start_notify(UUID_APNEA, apnea_callback)
        await client.start_notify(UUID_HYPOPNOEA, hypopnea_callback)
        
        await data_sender(backend_url, status_url)

if __name__ == "__main__":
    asyncio.run(run())