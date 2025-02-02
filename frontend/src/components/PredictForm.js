import React, { useState } from 'react';

const PredictForm = () => {
    // Initial state with all form values
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
        Gender: 0
    });

    const [predictionResult, setPredictionResult] = useState('');

    // Handle changes in the form fields
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    // Handle form submission and send data to the Flask backend
    const handleSubmit = async (e) => {
        e.preventDefault();
        const response = await fetch('http://localhost:5000/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        setPredictionResult(result.result); // Set the prediction result
    };

    return (
        <div>
            <h2>Enter the required information</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>BQ</label>
                    <input
                        type="number"
                        name="BQ"
                        value={formData.BQ}
                        onChange={handleChange}
                        placeholder="BQ"
                    />
                </div>
                <div>
                    <label>ESS</label>
                    <input
                        type="number"
                        name="ESS"
                        value={formData.ESS}
                        onChange={handleChange}
                        placeholder="ESS"
                    />
                </div>
                <div>
                    <label>BMI</label>
                    <input
                        type="number"
                        name="BMI"
                        value={formData.BMI}
                        onChange={handleChange}
                        placeholder="BMI"
                    />
                </div>
                <div>
                    <label>Weight (kg)</label>
                    <input
                        type="number"
                        name="Weight"
                        value={formData.Weight}
                        onChange={handleChange}
                        placeholder="Weight"
                    />
                </div>
                <div>
                    <label>Height (cm)</label>
                    <input
                        type="number"
                        name="Height"
                        value={formData.Height}
                        onChange={handleChange}
                        placeholder="Height"
                    />
                </div>
                <div>
                    <label>Head (cm)</label>
                    <input
                        type="number"
                        name="Head"
                        value={formData.Head}
                        onChange={handleChange}
                        placeholder="Head"
                    />
                </div>
                <div>
                    <label>Neck (cm)</label>
                    <input
                        type="number"
                        name="Neck"
                        value={formData.Neck}
                        onChange={handleChange}
                        placeholder="Neck"
                    />
                </div>
                <div>
                    <label>Waist (cm)</label>
                    <input
                        type="number"
                        name="Waist"
                        value={formData.Waist}
                        onChange={handleChange}
                        placeholder="Waist"
                    />
                </div>
                <div>
                    <label>Buttock (cm)</label>
                    <input
                        type="number"
                        name="Buttock"
                        value={formData.Buttock}
                        onChange={handleChange}
                        placeholder="Buttock"
                    />
                </div>
                <div>
                    <label>Age</label>
                    <input
                        type="number"
                        name="Age"
                        value={formData.Age}
                        onChange={handleChange}
                        placeholder="Age"
                    />
                </div>
                <div>
                    <label>Gender (Male-1; Female-0)</label>
                    <input
                        type="number"
                        name="Gender"
                        value={formData.Gender}
                        onChange={handleChange}
                        placeholder="Gender"
                    />
                </div>
                <button type="submit">Submit</button>
            </form>

            <div>{predictionResult}</div> {/* Display prediction result */}
        </div>
    );
};

export default PredictForm;
