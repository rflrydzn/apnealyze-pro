import React, { useState } from 'react';
import PredictForm from '../components/PredictForm';
import './MLPredictionPage.css'; 

const MLPredictionPage = () => {
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const getSeverityColor = (prediction) => {
    if (!prediction) return 'gray'; 
    const lowerPrediction = prediction.toLowerCase();
    if (lowerPrediction.includes('normal')) return 'green';
    if (lowerPrediction.includes('mild')) return 'yellow';
    if (lowerPrediction.includes('moderate')) return 'orange';
    if (lowerPrediction.includes('severe')) return 'red';
    return 'gray'; 
  };

  const handleFormSubmit = async (formData) => {
    setIsLoading(true);
    setPrediction(null);
    try {
      const response = await fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      setPrediction(result.result);
      setShowModal(true);
    } catch (error) {
      console.error('Error:', error);
      setPrediction('Error: Unable to get prediction');
      setShowModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ml-container">
      <h1 className="ml-title">Machine Learning Prediction</h1>

      <div className="ml-content">
        {/* Left Section (Form) */}
        <div className="ml-left">
          <PredictForm onSubmit={handleFormSubmit} severityColor={getSeverityColor(prediction)} prediction={prediction}/>
          {isLoading && <p className="loading-text">Loading...</p>}
        </div>

      </div>

      {/* Modal for Prediction Result */}
      {showModal && (
        <div className="modal">
          <div className="modal-content" style={{ borderColor: getSeverityColor(prediction) }}>
            <h2>Prediction Result</h2>
            
            <p style={{color: getSeverityColor(prediction), fontSize: '1.5em', fontWeight: 'bold'}}>
              {prediction}
            </p>
            <button className="close-button" onClick={() => setShowModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MLPredictionPage;