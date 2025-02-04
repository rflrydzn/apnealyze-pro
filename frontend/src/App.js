// src/app.js
import React from 'react';
import { BrowserRouter as Router, Route, Link, Routes } from 'react-router-dom';
import MLPredictionPage from './pages/MLPredictionPage';
import SessionsPage from './pages/SessionsPage';
import SessionDetailPage from './pages/SessionDetailPage';
import RecordingControlPage from './pages/RecordingControlPage';
import './App.css'; // Import the global CSS

function App() {
  return (
    <Router>
      <div className="app-container">
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/ml-predict">Machine Learning Prediction</Link>
            </li>
            <li>
              <Link to="/recording">Recording Control</Link>
            </li>
            <li>
              <Link to="/sessions">Recording Sessions</Link>
            </li>
          </ul>
        </nav>

        <Routes>
          <Route path="/" element={<h1>Welcome to the Home Page</h1>} />
          <Route path="/ml-predict" element={<MLPredictionPage />} />
          <Route path="/recording" element={<RecordingControlPage />} />
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/session/:sessionId" element={<SessionDetailPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;