import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { Link } from 'react-router-dom';

const JumbotronExample = () => {
    const [sessions, setSessions] = useState([]);
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
  // Mapping of session IDs to participant names
  const sessionNames = {
    232: "PARTICIPANT 1",
    234: "PARTICIPANT 2",
    238: "PARTICIPANT 3",
    240: "PARTICIPANT 4",
    273: "PARTICIPANT 5",
    275: "PARTICIPANT 6",
    280: "PARTICIPANT 7"
  };

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await axios.get('http://localhost:5001/sessions');
        setSessions(response.data.sessions);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    };
    fetchSessions();
  }, []);

  // Filter only sessions with IDs in sessionNames
  const filteredSessions = sessions.filter(session => sessionNames[session.id]);

  return (
    <div className="container py-4">
      

      

      <div className="row align-items-md-stretch">
        <div className="col-md-6">
          <div className="h-100 p-5 text-bg-dark rounded-3">
            <h2>Apnea-lyze Pro: HSAT</h2>
            <p>
            Try our affordable HSAT prototype for monitoring oxygen saturation, heart rate, sleeping position, snoring, and breathing state. Designed to detect sleep disruptions like apnea and hypopnea.
            </p>

            {!recording ? (
        <button className="btn btn-outline-light" type="button" onClick={startRecording}>Start Recording</button>
      ) : (
        <button className="btn btn-outline-light" type="button" onClick={stopRecording}>Stop Recording</button>
      )}
            {message && <p>{message}</p>}
          </div>
        </div>
        <div className="col-md-6">
          <div className="h-100 p-5 bg-body-tertiary border rounded-3">
            <h2>Apnea-lyze Pro: Classify</h2>
            <p>
              Wanna know your Obstructive Sleep Apnea severity? Try our Machine Learning model trained with real hospital data from Taipei Medical University Hospital.
            </p>
              <Link to={`/ml-predict`} class="btn btn-outline-secondary">Classify Me!</Link>
          </div>
        </div>
      </div>

      <div className="p-5 mb-4 bg-body-tertiary rounded-3 mt-4">
        <div className="container-fluid py-5">
          <h1 className="display-5 fw-bold">Sessions</h1>
          <div className="d-flex flex-wrap p-2 justify-content-center" >
                
              
                {filteredSessions.map(session => (
                <div class="card" style={{width: '15rem', margin: '15px'}} key={session.id}>
  <div class="card-body">
    <h5 class="card-title">Session {session.id}</h5>
    <p class="card-text">{session.start_time} <br /> {sessionNames[session.id]}</p>
    <Link to={`/session/${session.id}/report`} class="btn btn-dark">Sleep Report</Link>
  </div>
</div>
))}
              </div>
        </div>
      </div>

    

      <footer className="pt-3 mt-4 text-body-secondary border-top">&copy; 2025</footer>
    </div>
  );
};

export default JumbotronExample;