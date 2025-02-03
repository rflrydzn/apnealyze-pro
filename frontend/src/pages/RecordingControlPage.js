// src/pages/RecordingControlPage.js
import React, { useState } from 'react';
import axios from 'axios';

const RecordingControlPage = () => {
  const [recording, setRecording] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [message, setMessage] = useState('');

  const startRecording = async () => {
    try {
      const response = await axios.post('http://localhost:5001/recording/start');
      const { session_id } = response.data;
      setSessionId(session_id);
      setRecording(true);
      setMessage(`Recording started (Session ID: ${session_id}).`);
    } catch (err) {
      setMessage('Error starting recording.');
      console.error(err);
    }
  };

  const stopRecording = async () => {
    if (!sessionId) return;
    try {
      const response = await axios.post('http://localhost:5001/recording/stop', { session_id: sessionId });
      setRecording(false);
      setMessage('Recording stopped.');
      setSessionId(null);
    } catch (err) {
      setMessage('Error stopping recording.');
      console.error(err);
    }
  };

  return (
    <div>
      <h1>Recording Control</h1>
      {message && <p>{message}</p>}
      {!recording ? (
        <button onClick={startRecording}>Start Recording</button>
      ) : (
        <button onClick={stopRecording}>Stop Recording</button>
      )}
    </div>
  );
};

export default RecordingControlPage;
