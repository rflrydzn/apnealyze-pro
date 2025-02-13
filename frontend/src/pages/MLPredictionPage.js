// src/pages/MLPredictionPage.js
import React, { useState } from 'react';
import PredictForm from '../components/PredictForm';

const MLPredictionPage = () => {
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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
    } catch (error) {
      console.error('Error:', error);
      setPrediction('Error: Unable to get prediction');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>Machine Learning Prediction</h1>
      <PredictForm onSubmit={handleFormSubmit} />
      {isLoading && <p>Loading...</p>}
      {prediction && (
        <div>
          <h2>Prediction Result:</h2>
          <p>{prediction}</p>
        </div>
      )}
    </div>
  );
};

export default MLPredictionPage;
