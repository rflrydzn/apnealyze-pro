from flask import Flask, request, jsonify
import mysql.connector
from mysql.connector import Error

app = Flask(__name__)

# MySQL configuration – update these with your MySQL credentials
db_host = 'localhost'
database = 'sensor_data'
db_user = 'root'
db_password = 'dizon0019'

@app.route('/thermistor', methods=['POST'])
def thermistor():
    airflow_state = request.form.get('airflow_state')
    if airflow_state is None:
        return jsonify({'msg': 'Missing airflow_state parameter'}), 400
    try:
        connection = mysql.connector.connect(
            host=db_host,
            database=database,
            user=db_user,
            password=db_password
        )
        cursor = connection.cursor()
        query = "INSERT INTO airflow_state (airflow_state) VALUES (%s)"
        cursor.execute(query, (airflow_state,))
        connection.commit()
        cursor.close()
        connection.close()
        return jsonify({'msg': 'Data inserted'}), 201
    except Error as e:
        return jsonify({'msg': 'Error inserting data', 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)