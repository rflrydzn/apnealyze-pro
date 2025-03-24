// src/app.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MLPredictionPage from './pages/MLPredictionPage';
import SessionsPage from './pages/SessionsPage';
import FullReportPage from './pages/FullReportPage';
import RecordingControlPage from './pages/RecordingControlPage';
import ReportPage from './pages/ReportPage'; // new
import GraphsPage from './pages/GraphsPage'; // new
import './App.css';
import HomePage from './pages/HomePage';

function App() {
  return (
    <Router>
      <div className="app-container">
        <nav>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/ml-predict">Machine Learning Prediction</Link></li>
            <li><Link to="/recording">Recording Control</Link></li>
            <li><Link to="/sessions">Recording Sessions</Link></li>
          </ul>
        </nav>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/ml-predict" element={<MLPredictionPage />} />
          <Route path="/recording" element={<RecordingControlPage />} />
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/session/:sessionId" element={<FullReportPage />} />
          <Route path="/session/:sessionId/report" element={<ReportPage />} />
          <Route path="/session/:sessionId/graphs" element={<GraphsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
