import React from 'react';
import { BrowserRouter as Router, Route, Link, Routes } from 'react-router-dom'; // Use Routes instead of Switch
import MLPredictionPage from './pages/MLPredictionPage';
import SensorDataPage from './pages/SensorStatusPage';

function App() {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/ml-predict">Machine Learning Prediction</Link>
            </li>
            <li>
              <Link to="/sensor-data">Sensor Data Collection</Link>
            </li>
          </ul>
        </nav>

        <Routes> {/* Use Routes instead of Switch */}
          <Route path="/" element={<h1>Welcome to the Home Page</h1>} />
          <Route path="/ml-predict" element={<MLPredictionPage />} />
          <Route path="/sensor-data" element={<SensorDataPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
