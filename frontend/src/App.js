// src/app.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MLPredictionPage from './pages/MLPredictionPage';
import SessionsPage from './pages/SessionsPage';
import RecordingControlPage from './pages/RecordingControlPage';
import ReportPage from './pages/ReportPage'; // new
import GraphsPage from './pages/GraphsPage'; // new

import HomePage from './pages/HomePage';
import SleepReport from './pages/SleepReport';
import SleepGraph from './pages/SleepGraph'
import "bootstrap/dist/css/bootstrap.min.css";
import FullReport from './pages/FullReport';
import NewHomePage from './pages/NewHomePage'
import About from './pages/About'
import Header from './components/Header'

function App() {
  return (
    <Router>
      <div className='container py-4'>
        
        <Header />

        <Routes>
          <Route path="/" element={<NewHomePage />} />
          <Route path="/ml-predict" element={<MLPredictionPage />} />
          <Route path="/recording" element={<RecordingControlPage />} />
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/session/:sessionId/report" element={<FullReport />} />
          
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
