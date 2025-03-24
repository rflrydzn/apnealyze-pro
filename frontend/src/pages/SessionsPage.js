import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const SessionsPage = () => {
  const [sessions, setSessions] = useState([]);

  // Mapping of session IDs to participant names
  const sessionNames = {
    232: "PARTICIPANT 1",
    234: "PARTICIPANT 2",
    238: "PARTICIPANT 3",
    240: "PARTICIPANT 4"
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

  return (
    <div>
      <h1>Your Recording Sessions</h1>
      <ul className="sessions-list">
        {sessions.map(session => (
          <li key={session.id}>
            <Link to={`/session/${session.id}/report`}>
              {sessionNames[session.id] ? `${sessionNames[session.id]}, Session #${session.id}` : `Session #${session.id}`}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SessionsPage;