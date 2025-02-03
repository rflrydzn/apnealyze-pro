from flask import Flask, send_file
import pymysql
import csv
import io

app = Flask(__name__)

# Set up MySQL connection
connection = pymysql.connect(
    host='localhost',         # Your MySQL host
    user='root',              # Your MySQL username
    password='dizon0019',  # Your MySQL password
    database='sensor_data',  # Your MySQL database name
)

@app.route('/download-csv', methods=['GET'])
def download_csv():
    cursor = connection.cursor()
    
    # Write your SQL query to fetch data
    cursor.execute("SELECT * readings")  # Modify this query to your table
    rows = cursor.fetchall()

    # Create a CSV in memory
    output = io.StringIO()
    csv_writer = csv.writer(output)
    
    # Write the column names (optional)
    column_names = [desc[0] for desc in cursor.description]
    csv_writer.writerow(column_names)
    
    # Write the rows from the database
    csv_writer.writerows(rows)
    
    # Seek back to the beginning of the StringIO object for reading
    output.seek(0)

    # Send the CSV as a response
    return send_file(
        io.BytesIO(output.getvalue().encode()),  # Convert string data to bytes
        as_attachment=True,
        download_name="data.csv",  # Default name for the CSV file
        mimetype="text/csv"  # Content type
    )

if __name__ == "__main__":
    app.run(host='localhost', debug=True)
