from flask import Flask, request, jsonify
import pickle
import numpy as np
from sklearn.preprocessing import StandardScaler
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

model = pickle.load(open('random_forest_classifier_BalancedData1_model.pkl', 'rb'))
standard_to = StandardScaler()

@app.route("/predict", methods=['POST'])
def predict():
    data = request.get_json()  # Accepting JSON data
    
    BQ = int(data['BQ'])
    ESS = int(data['ESS'])
    BMI = float(data['BMI'])
    Weight = int(data['Weight'])
    Height = int(data['Height'])
    Head = float(data['Head'])
    Neck = int(data['Neck'])
    Waist = int(data['Waist'])
    Buttock = int(data['Buttock'])
    Age = int(data['Age'])
    M = int(data['Gender'])

    prediction = model.predict([[BQ, ESS, BMI, Weight, Height, Head, Neck, Waist, Buttock, Age, M]])
    prediction = round(prediction[0], 4)

    if prediction == 0:
        result = "OBSTRUCTIVE SLEEP APNEA CONDITION: NORMAL"
    elif prediction == 1:
        result = "OBSTRUCTIVE SLEEP APNEA CONDITION: MILD"
    elif prediction == 2:
        result = "OBSTRUCTIVE SLEEP APNEA CONDITION: MODERATE"
    elif prediction == 3:
        result = "OBSTRUCTIVE SLEEP APNEA CONDITION: SEVERE"
    else:
        result = "No result"

    return jsonify({"result": result})

if __name__ == "__main__":
    app.run(debug=True)
