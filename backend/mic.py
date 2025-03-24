import pyaudio
import numpy as np
import soundfile as sf
from scipy.signal import spectrogram
import joblib
import librosa
import wave
import time
import requests
from dotenv import load_dotenv
import os
from pathlib import Path

# Load .env from the parent of the backend folder
env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Access the IP address from .env
backend_ip = os.getenv("FLASK_IP_ADDRESS")

# Load the trained model
model = joblib.load("snore_detector.pkl")

# Audio settings
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000  # Match the training sample rate
CHUNK = 16000  # 1 second of audio
THRESHOLD = 500 # Adjust if needed to filter out low noise

# Function to extract spectrogram features


def extract_features(audio_data):
    # Convert int16 to float and normalize
    audio_data = audio_data.astype(np.float32)
    audio_data = audio_data / np.max(np.abs(audio_data))  # Normalize between -1 and 1

    # Compute spectrogram (same as used in training)
    f, t, Sxx = spectrogram(audio_data, fs=RATE, nperseg=256, noverlap=128)

    # Take mean along time axis
    return np.mean(Sxx, axis=1).reshape(1, -1)



# Start real-time audio streaming
p = pyaudio.PyAudio()
stream = p.open(format=FORMAT, channels=CHANNELS, rate=RATE, input=True, frames_per_buffer=CHUNK)

print("Listening for snoring... Press Ctrl+C to stop.")

AGGREGATION_INTERVAL = 3  # seconds
snore_detected = 0  # will be set to 1 if any snore is detected during the interval
interval_start = time.time()

try:
    while True:
        audio_data = np.frombuffer(stream.read(CHUNK, exception_on_overflow=False), dtype=np.int16)
        
        # Use a threshold to ignore low-level noise
        if np.max(audio_data) > THRESHOLD:
            features = extract_features(audio_data)
            prediction = model.predict(features)
            if prediction[0] == 1:
                snore_detected = 1  # mark that a snore was detected in this interval
                print("🔴 Snoring detected!")
            else:
                print("✅ No snoring detected.")
        else:
            print("✅ No snoring detected.")

        # Check if our aggregation interval has passed
        current_time = time.time()
        if current_time - interval_start >= AGGREGATION_INTERVAL:
            # Send the aggregated snore data to the backend
            data = {
                "session_id": "",  # Optionally, pass the current session_id if known (or let backend use global)
                "snore": snore_detected
            }
            try:
                response = requests.post(f"http://{backend_ip}:5001/snore_data", data=data)
                print("Snore data sent:", response.text)
            except Exception as e:
                print("Error sending snore data:", e)
            
            # Reset for the next interval
            interval_start = current_time
            snore_detected = 0

except KeyboardInterrupt:
    print("Stopping real-time snore detection...")
    stream.stop_stream()
    stream.close()
    p.terminate()
