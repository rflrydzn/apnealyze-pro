// src/pages/RecordingControlPage.js
import React, { useState } from 'react';
import axios from 'axios';
import '../App.css'; // Import the custom CSS

const RecordingControlPage = () => {
  const [recording, setRecording] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [message, setMessage] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  const startRecording = async () => {
    try {
      const response = await axios.post('http://localhost:5001/recording/start');
      const { session_id } = response.data;
      setSessionId(session_id);
      setRecording(true);
      setDarkMode(true);
      setMessage(`Recording started (Session ID: ${session_id}).`);
    } catch (err) {
      setMessage('Error starting recording.');
      console.error(err);
    }
  };

  const stopRecording = async () => {
    if (!sessionId) return;
    try {
      await axios.post('http://localhost:5001/recording/stop', { session_id: sessionId });
      setRecording(false);
      setDarkMode(false);
      setMessage('Recording stopped.');
      setSessionId(null);
    } catch (err) {
      setMessage('Error stopping recording.');
      console.error(err);
    }
  };

  return (
    <div className={`recording-page ${darkMode ? 'dark-mode' : ''}`}>
      {darkMode ? <h1 style={{color: 'white'}}>Recording Control</h1> : <h1>Recording Control</h1>}
      <div style={{ marginBottom: '20px' }}>
        <ul>
          <li>✅ Make sure <strong>backend.py</strong> and <strong>ble_backend.py</strong> are running.</li>
          <li>✅ Make sure you calibrated the <strong>flex sensor</strong>.</li>
          <li>✅ Make sure you are <strong>wearing the device</strong>.</li>
          <li>✅ Make sure the device is <strong>connected to the laptop/powerbank</strong>.</li>
          <li>🎤 If you wish to <strong>detect snoring</strong>, start <strong>mic.py</strong>.</li>
        </ul>
      </div>

      {message && <p>{message}</p>}

      {!recording ? (
        <button onClick={startRecording}>Start Recording</button>
      ) : (
        <button onClick={stopRecording}>Stop Recording</button>
      )}

      {darkMode && <div className="moon"></div>}
    </div>
  );
};

export default RecordingControlPage;