from flask import Flask, request, jsonify
import pickle
import numpy as np
from sklearn.preprocessing import StandardScaler
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enables CORS globally for all routes

model = pickle.load(open('random_forest_classifier_BalancedData1_model.pkl', 'rb'))
standard_to = StandardScaler()

@app.route("/predict", methods=['POST'])
def predict():
    try:
        data = request.get_json()  # Accepting JSON data

        BQ = int(data.get('BQ', 0))
        ESS = int(data.get('ESS', 0))
        BMI = float(data.get('BMI', 0))
        Weight = int(data.get('Weight', 0))
        Height = int(data.get('Height', 0))
        Head = float(data.get('Head', 0))
        Neck = int(data.get('Neck', 0))
        Waist = int(data.get('Waist', 0))
        Buttock = int(data.get('Buttock', 0))
        Age = int(data.get('Age', 0))
        M = int(data.get('Gender', 0))

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

    except Exception as e:
        return jsonify({"error": str(e)}), 500  # Return error message in JSON

if __name__ == "__main__":
    app.run(debug=True)
