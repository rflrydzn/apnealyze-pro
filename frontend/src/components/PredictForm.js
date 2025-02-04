// src/components/PredictForm.js
import React, { useState } from 'react';

const PredictForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    BQ: 0,
    ESS: 5,
    BMI: 19,
    Weight: 50,
    Height: 160,
    Head: 45,
    Neck: 40,
    Waist: 90,
    Buttock: 85,
    Age: 25,
    Gender: 0,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>BQ</label>
      <input type="number" name="BQ" value={formData.BQ} onChange={handleChange} />
      
      <label>ESS</label>
      <input type="number" name="ESS" value={formData.ESS} onChange={handleChange} />
      
      <label>BMI</label>
      <input type="number" name="BMI" value={formData.BMI} onChange={handleChange} />
      
      <label>Weight</label>
      <input type="number" name="Weight" value={formData.Weight} onChange={handleChange} />
      
      <label>Height</label>
      <input type="number" name="Height" value={formData.Height} onChange={handleChange} />
      
      <label>Head</label>
      <input type="number" name="Head" value={formData.Head} onChange={handleChange} />
      
      <label>Neck</label>
      <input type="number" name="Neck" value={formData.Neck} onChange={handleChange} />
      
      <label>Waist</label>
      <input type="number" name="Waist" value={formData.Waist} onChange={handleChange} />
      
      <label>Buttock</label>
      <input type="number" name="Buttock" value={formData.Buttock} onChange={handleChange} />
      
      <label>Age</label>
      <input type="number" name="Age" value={formData.Age} onChange={handleChange} />
      
      <label>Gender</label>
      <input type="number" name="Gender" value={formData.Gender} onChange={handleChange} />
      
      <button type="submit">Submit</button>
    </form>
  );
};

export default PredictForm;