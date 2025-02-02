import React, { useState } from 'react';
import PredictForm from '../components/PredictForm'; // Import the form component

const MLPredictionPage = () => {
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = async (formData) => {
    setIsLoading(true); // Set loading to true when form is submitted

    try {
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      setPrediction(result); // Set the result to display
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false); // Set loading to false when the request is complete
    }
  };

  return (
    <div>
      <h1>Machine Learning Prediction</h1>
      <PredictForm onSubmit={handleFormSubmit} /> {/* Pass handleFormSubmit as prop */}
      
      {isLoading && <p>Loading...</p>}
      
      {prediction && (
        <div>
          <h2>Prediction Result:</h2>
          <p>{prediction.result}</p>
        </div>
      )}
    </div>
  );
};

export default MLPredictionPage;
