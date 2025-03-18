from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error

app = Flask(__name__)
CORS(app)

# MySQL configuration – update these with your MySQL credentials
db_host = 'localhost'
database = 'sensor_data'
db_user = 'root'
db_password = 'dizon0019'

# Global variables for session control
recording_active = False
current_session_id = None

###########################################
# Helper Function: Insert Sensor Reading
###########################################
def insert_data(heartrate, oxygen, confidence, position, airflow_state, chest_movement_state, apnea_flag, hypopnea_flag, session_id=None):
    try:
        connection = mysql.connector.connect(
            host=db_host,
            database=database,
            user=db_user,
            password=db_password
        )
        if connection.is_connected():
            cursor = connection.cursor()
            query = """
                INSERT INTO readings (heartrate, oxygen_level, confidence, position, 
                                      airflow_state, chest_movement_state, apnea_flag, hypopnea_flag, session_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(query, (heartrate, oxygen, confidence, position, 
                                   airflow_state, chest_movement_state, apnea_flag, hypopnea_flag, session_id))
            connection.commit()
            cursor.close()
            print("Data inserted:", heartrate, oxygen, confidence, position, 
                  airflow_state, chest_movement_state, apnea_flag, hypopnea_flag, session_id)
    except Error as e:
        print("Error while inserting data into MySQL:", e)
    finally:
        if connection.is_connected():
            connection.close()

###########################################
# Helper Function: Count Desaturation Events
###########################################
def count_desaturation_events(readings, threshold=3):
    """
    Counts desaturation events where the drop from the previous reading is >= threshold.
    This avoids counting prolonged low SpO₂ as multiple events.
    """
    desat_events = 0
    prev_spo2 = None
    for r in readings:
        if r.get('oxygen_level') is None:
            continue
        current_spo2 = float(r['oxygen_level'])
        if prev_spo2 is not None and (prev_spo2 - current_spo2) >= threshold:
            desat_events += 1
        prev_spo2 = current_spo2
    return desat_events

###########################################
# Endpoint: Start Recording
###########################################
@app.route('/recording/start', methods=['POST'])
def start_recording():
    global current_session_id, recording_active
    try:
        connection = mysql.connector.connect(
            host=db_host,
            database=database,
            user=db_user,
            password=db_password
        )
        cursor = connection.cursor()
        query = "INSERT INTO sessions (user_id) VALUES (%s)"
        cursor.execute(query, (None,))  # No user_id for now
        connection.commit()
        session_id = cursor.lastrowid
        current_session_id = session_id
        cursor.close()
        connection.close()
        recording_active = True
        return jsonify({'msg': 'Recording started', 'session_id': session_id}), 201
    except Exception as e:
        print("Error in /recording/start:", e)
        return jsonify({'msg': 'Error starting recording', 'error': str(e)}), 500

###########################################
# Endpoint: Stop Recording
###########################################
@app.route('/recording/stop', methods=['POST'])
def stop_recording():
    global recording_active, current_session_id
    data = request.get_json()
    session_id = data.get('session_id')
    if not session_id:
        return jsonify({'msg': 'Session ID is required.'}), 400

    recording_active = False
    try:
        connection = mysql.connector.connect(
            host=db_host,
            database=database,
            user=db_user,
            password=db_password
        )
        cursor = connection.cursor()
        query = "UPDATE sessions SET end_time = NOW() WHERE id = %s"
        cursor.execute(query, (session_id,))
        connection.commit()
        cursor.close()
        connection.close()
        current_session_id = None
        return jsonify({'msg': 'Recording stopped'}), 200
    except Exception as e:
        print("Error in /recording/stop:", e)
        return jsonify({'msg': 'Error stopping recording', 'error': str(e)}), 500

###########################################
# Endpoint: Recording Status
###########################################
@app.route('/recording/status', methods=['GET'])
def recording_status():
    return ("true" if recording_active else "false"), 200

###########################################
# Endpoint: Receive Sensor Data
###########################################
@app.route('/data', methods=['POST'])
def receive_data():
    try:
        heartrate = request.form.get('heartrate')
        oxygen = request.form.get('oxygen')
        confidence = request.form.get('confidence')
        position = request.form.get('position')  # New parameter from Arduino
        airflow_state = request.form.get('airflow_state')
        chest_movement_state = request.form.get('chest_movement_state')
        apnea_flag = request.form.get('apnea_flag')  # Expected as "0" or "1"
        hypopnea_flag = request.form.get('hypopnea_flag')
        session_id = request.form.get('session_id') or current_session_id

        if (heartrate is not None and oxygen is not None and confidence is not None 
            and position is not None and airflow_state is not None 
            and chest_movement_state is not None and apnea_flag is not None and hypopnea_flag is not None):
            insert_data(heartrate, oxygen, confidence, position, 
                        airflow_state, chest_movement_state, int(apnea_flag), int(hypopnea_flag), 
                        session_id)
            return "Data received and stored.", 200
        else:
            return "Invalid data.", 400
    except Exception as e:
        print("Error in /data:", e)
        return jsonify({'msg': 'Error processing data', 'error': str(e)}), 500

###########################################
# Endpoint: List Sessions
###########################################
@app.route('/sessions', methods=['GET'])
def list_sessions():
    try:
        connection = mysql.connector.connect(
            host=db_host,
            database=database,
            user=db_user,
            password=db_password
        )
        cursor = connection.cursor(dictionary=True)
        query = "SELECT * FROM sessions ORDER BY start_time DESC"
        cursor.execute(query)
        sessions = cursor.fetchall()
        cursor.close()
        connection.close()
        return jsonify({'sessions': sessions}), 200
    except Exception as e:
        print("Error in /sessions:", e)
        return jsonify({'msg': 'Error retrieving sessions', 'error': str(e)}), 500

###########################################
# Endpoint: Get Basic Session Data
###########################################
@app.route('/session/<int:session_id>', methods=['GET'])
def get_session_data(session_id):
    try:
        connection = mysql.connector.connect(
            host=db_host,
            database=database,
            user=db_user,
            password=db_password
        )
        cursor = connection.cursor(dictionary=True)
        query = "SELECT * FROM sessions WHERE id = %s"
        cursor.execute(query, (session_id,))
        session = cursor.fetchone()
        if not session:
            return jsonify({'msg': 'Session not found'}), 404

        query = "SELECT * FROM readings WHERE session_id = %s ORDER BY timestamp ASC"
        cursor.execute(query, (session_id,))
        readings = cursor.fetchall()
        cursor.close()
        connection.close()
        return jsonify({'session': session, 'readings': readings}), 200
    except Exception as e:
        print(f"Error in /session/{session_id}:", e)
        return jsonify({'msg': 'Error retrieving session data', 'error': str(e)}), 500

###########################################
# Endpoint: Full Report for a Session
###########################################
@app.route('/session/<int:session_id>/full_report', methods=['GET'])
def full_report(session_id):
    try:
        connection = mysql.connector.connect(
            host=db_host,
            database=database,
            user=db_user,
            password=db_password
        )
        cursor = connection.cursor(dictionary=True)
        query = "SELECT * FROM readings WHERE session_id = %s ORDER BY timestamp ASC"
        cursor.execute(query, (session_id,))
        readings = cursor.fetchall()
        if not readings:
            return jsonify({'msg': 'No readings found for session.'}), 404
            
        
        total_readings = len(readings)
        total_duration_seconds = total_readings * 0.25  # Each reading is 3 seconds
        total_duration_hours = total_duration_seconds / 3600.0

        # ----------------------------------------------------------------------------
        # 1) Gather timestamps for Apnea, Hypopnea, and Desaturation
        # ----------------------------------------------------------------------------
        # We'll store each event as the reading's "timestamp" whenever a new event occurs.
        apnea_events = []
        hypopnea_events = []
        desat_events = []

        # For Apnea/Hypopnea, we only want to record the moment of transition from 0→1.
        # For Desaturation, we can record any reading that has a big drop from previous or is <90, etc.
        
        prev_apnea = 0
        prev_hypopnea = 0
        prev_oxygen = None

        for row in readings:
            tstamp = row.get('timestamp')   # Make sure your DB has a 'timestamp' column
            # Apnea detection
            cur_apnea = int(row.get('apnea_flag', 0))
            if cur_apnea == 1 and prev_apnea == 0:
                # New Apnea event starts here
                apnea_events.append(tstamp)
            prev_apnea = cur_apnea

            # Hypopnea detection
            cur_hypopnea = int(row.get('hypopnea_flag', 0))
            if cur_hypopnea == 1 and prev_hypopnea == 0:
                # New Hypopnea event starts here
                hypopnea_events.append(tstamp)
            prev_hypopnea = cur_hypopnea

            # Desaturation detection
            # Option A: If oxygen < 90, or Option B: If oxygen drop from prev >= 3
            # For demonstration, let's do "if oxygen < 90"
            cur_oxy = row.get('oxygen_level')
            if cur_oxy is not None:
                cur_oxy = float(cur_oxy)
                # Desaturation detection
                if cur_oxy < 90:
                    desat_events.append(tstamp)
                    # === ADD THIS: Treat desaturation as hypopnea ===
                    row["hypopnea_flag"] = 1
                else:
                    row["hypopnea_flag"] = 0
                prev_oxygen = cur_oxy

        def count_flag_events(readings_list, flag_key='apnea_flag'):
            """
            Returns (event_count, supine_event_count, non_supine_event_count)
            - event_count: total number of distinct events
            - supine_event_count: events that happened in supine position
            - non_supine_event_count: events that happened in non-supine
            Consecutive 1's = single event. We increment count only on transition 0→1.
            """
            event_count = 0
            supine_count = 0
            non_supine_count = 0
            prev_flag = 0  # track previous reading's flag
            
            for row in readings_list:
                current_flag = int(row.get(flag_key, 0))
                # Check for new event if we see a 0→1 transition
                if current_flag == 1 and prev_flag == 0:
                    event_count += 1
                    # Determine supine or non-supine
                    if row.get('position') == "Lying on Back (Supine)":
                        supine_count += 1
                    else:
                        non_supine_count += 1
                prev_flag = current_flag
            
            return (event_count, supine_count, non_supine_count)
        
        apnea_count, apnea_supine, apnea_non_supine = count_flag_events(readings, 'apnea_flag')
        hypopnea_count, hypopnea_supine, hypopnea_non_supine = count_flag_events(readings, 'hypopnea_flag')

        # === Overview Calculations ===
        total_AH_events = apnea_count + hypopnea_count  # total Apneas + Hypopneas
        AHI = total_AH_events / total_duration_hours if total_duration_hours > 0 else None

        Apnea_rate = (apnea_count / total_duration_hours) if total_duration_hours > 0 else None
        Hypopnea_rate = (hypopnea_count / total_duration_hours) if total_duration_hours > 0 else None

        total_desat_events = sum(1 for r in readings if r.get('oxygen_level') is not None and float(r['oxygen_level']) < 90)
        all_desat_events = count_desaturation_events(readings, threshold=3)
        ODI = all_desat_events / total_duration_hours if total_duration_hours > 0 else None

        snore_count = sum(1 for r in readings if r.get('snore') and float(r.get('snore')) > 0.5)
        snore_percentage = (snore_count / total_readings * 100) if total_readings > 0 else None

        overview = {
            "AHI": AHI,
            "ODI": ODI,
            "Snore_Percentage": snore_percentage,
            "Session_Duration_Hours": total_duration_hours
        }

        # === Respiratory Indices ===
        supine_readings = [r for r in readings if r.get('position') == "Lying on Back (Supine)"]
        non_supine_readings = [r for r in readings if r.get('position') != "Lying on Back (Supine)"]
        supine_AH = sum(1 for r in supine_readings if r.get('event_type') in ['apnea', 'hypopnea'])
        non_supine_AH = sum(1 for r in non_supine_readings if r.get('event_type') in ['apnea', 'hypopnea'])
        supine_duration_hours = (len(supine_readings) * 3) / 3600.0 if supine_readings else 0
        non_supine_duration_hours = (len(non_supine_readings) * 3) / 3600.0 if non_supine_readings else 0
        supine_rate = supine_AH / supine_duration_hours if supine_duration_hours > 0 else None
        non_supine_rate = non_supine_AH / non_supine_duration_hours if non_supine_duration_hours > 0 else None

        Apnea_rate_supine = (apnea_supine / supine_duration_hours) if supine_duration_hours > 0 else None
        Apnea_rate_non_supine = (apnea_non_supine / non_supine_duration_hours) if non_supine_duration_hours > 0 else None

        Hypopnea_rate_supine = (hypopnea_supine / supine_duration_hours) if supine_duration_hours > 0 else None
        Hypopnea_rate_non_supine = (hypopnea_non_supine / non_supine_duration_hours) if non_supine_duration_hours > 0 else None

        total_AH_supine = apnea_supine + hypopnea_supine
        total_AH_non_supine = apnea_non_supine + hypopnea_non_supine
        
        AHI_supine = (total_AH_supine / supine_duration_hours) if supine_duration_hours > 0 else None
        AHI_non_supine = (total_AH_non_supine / non_supine_duration_hours) if non_supine_duration_hours > 0 else None
        
        # --- Updated Supine vs Non-Supine ODI Calculation ---
        supine_desat_events = count_desaturation_events(supine_readings, threshold=3)
        non_supine_desat_events = count_desaturation_events(non_supine_readings, threshold=3)
        ODI_Supine = supine_desat_events / supine_duration_hours if supine_duration_hours > 0 else None
        ODI_NonSupine = non_supine_desat_events / non_supine_duration_hours if non_supine_duration_hours > 0 else None

        # 2) Calculate Supine vs Non-Supine Average/Min SpO2
        supine_oxygens = [float(r['oxygen_level']) for r in supine_readings if r.get('oxygen_level')]
        non_supine_oxygens = [float(r['oxygen_level']) for r in non_supine_readings if r.get('oxygen_level')]

        Average_SpO2_Supine = sum(supine_oxygens)/len(supine_oxygens) if supine_oxygens else None
        Average_SpO2_NonSupine = sum(non_supine_oxygens)/len(non_supine_oxygens) if non_supine_oxygens else None

        Min_SpO2_Supine = min(supine_oxygens) if supine_oxygens else None
        Min_SpO2_NonSupine = min(non_supine_oxygens) if non_supine_oxygens else None

        obstructive_apnea = sum(1 for r in readings if r.get('event_type') == 'obstructive_apnea')
        obstructive_hypopnea = sum(1 for r in readings if r.get('event_type') == 'obstructive_hypopnea')
        combined_OA_OH = obstructive_apnea + obstructive_hypopnea

        respiration_rates = [float(r.get('respiration_rate', 0)) for r in readings if r.get('respiration_rate')]
        avg_respiration_rate = sum(respiration_rates) / len(respiration_rates) if respiration_rates else None

        respiratory_indices = {
            # Apneas + Hypopneas
            "AHI_Total": AHI,
            "AHI_Supine": AHI_supine,
            "AHI_NonSupine": AHI_non_supine,
            "AHI_Count": total_AH_events,  # total distinct events

            # Apneas
            "Apneas_Total": Apnea_rate,
            "Apneas_Supine": Apnea_rate_supine,
            "Apneas_NonSupine": Apnea_rate_non_supine,
            "Apneas_Count": apnea_count,

            # Hypopneas
            "Hypopneas_Total": Hypopnea_rate,
            "Hypopneas_Supine": Hypopnea_rate_supine,
            "Hypopneas_NonSupine": Hypopnea_rate_non_supine,
            "Hypopneas_Count": hypopnea_count,

            # If you want more detail on “Obstructive” or “Central,”
            # you’d need separate logic or columns in DB
            "Obstructive_Apneas_Count": None,
            "Obstructive_Hypopneas_Count": None
        }

        # === Oxygen Saturation ===
        oxygens = [float(r['oxygen_level']) for r in readings if r.get('oxygen_level') is not None]
        avg_oxygen = sum(oxygens) / len(oxygens) if oxygens else None
        min_oxygen = min(oxygens) if oxygens else None
        dur_below_90 = sum(0.25 for r in readings if r.get('oxygen_level') is not None and float(r['oxygen_level']) < 90) / 60.0
        dur_below_88 = sum(0.25 for r in readings if r.get('oxygen_level') is not None and float(r['oxygen_level']) < 88) / 60.0
        dur_below_85 = sum(0.25 for r in readings if r.get('oxygen_level') is not None and float(r['oxygen_level']) < 85) / 60.0
        desat_drops = [avg_oxygen - float(r['oxygen_level']) for r in readings if r.get('oxygen_level') is not None and avg_oxygen and float(r['oxygen_level']) < avg_oxygen]
        avg_desat_drop = sum(desat_drops) / len(desat_drops) if desat_drops else None

        # Durations below thresholds (in minutes) for supine vs. non-supine
        supine_dur_below_90 = sum(0.25 for r in supine_readings 
                                if r.get('oxygen_level') and float(r['oxygen_level']) < 90) / 60.0
        non_supine_dur_below_90 = sum(0.25 for r in non_supine_readings 
                                    if r.get('oxygen_level') and float(r['oxygen_level']) < 90) / 60.0

        supine_dur_below_88 = sum(3 for r in supine_readings 
                                if r.get('oxygen_level') and float(r['oxygen_level']) < 88) / 60.0
        non_supine_dur_below_88 = sum(3 for r in non_supine_readings 
                                    if r.get('oxygen_level') and float(r['oxygen_level']) < 88) / 60.0

        supine_dur_below_85 = sum(3 for r in supine_readings 
                                if r.get('oxygen_level') and float(r['oxygen_level']) < 85) / 60.0
        non_supine_dur_below_85 = sum(3 for r in non_supine_readings 
                                    if r.get('oxygen_level') and float(r['oxygen_level']) < 85) / 60.0
        
        # If you also want a separate average desaturation drop for supine vs. non-supine, you can do:
        supine_desat_drops = []
        for r in supine_readings:
            if r.get('oxygen_level') and avg_oxygen and float(r['oxygen_level']) < avg_oxygen:
                supine_desat_drops.append(avg_oxygen - float(r['oxygen_level']))

        non_supine_desat_drops = []
        for r in non_supine_readings:
            if r.get('oxygen_level') and avg_oxygen and float(r['oxygen_level']) < avg_oxygen:
                non_supine_desat_drops.append(avg_oxygen - float(r['oxygen_level']))

        avg_desat_drop_supine = sum(supine_desat_drops) / len(supine_desat_drops) if supine_desat_drops else None
        avg_desat_drop_non_supine = sum(non_supine_desat_drops) / len(non_supine_desat_drops) if non_supine_desat_drops else None

        oxygen_saturation = {
            "ODI_per_hour": ODI,
            "ODI_Supine": ODI_Supine,  # if you already computed it
            "ODI_NonSupine": ODI_NonSupine,
            "Average_SpO2": avg_oxygen,
            "Average_SpO2_Supine": Average_SpO2_Supine,        # if computed
            "Average_SpO2_NonSupine": Average_SpO2_NonSupine,  # if computed
            "Minimum_SpO2": min_oxygen,
            "Minimum_SpO2_Supine": Min_SpO2_Supine,            # if computed
            "Minimum_SpO2_NonSupine": Min_SpO2_NonSupine,     # if computed
            "SpO2_Duration_below_90_minutes": dur_below_90,
            "SpO2_Duration_below_88_minutes": dur_below_88,
            "SpO2_Duration_below_85_minutes": dur_below_85,
            "SpO2_Duration_below_90_minutes_supine": supine_dur_below_90,
            "SpO2_Duration_below_90_minutes_non_supine": non_supine_dur_below_90,
            "SpO2_Duration_below_88_minutes_supine": supine_dur_below_88,
            "SpO2_Duration_below_88_minutes_non_supine": non_supine_dur_below_88,
            "SpO2_Duration_below_85_minutes_supine": supine_dur_below_85,
            "SpO2_Duration_below_85_minutes_non_supine": non_supine_dur_below_85,
            "Average_Desaturation_Drop": avg_desat_drop,
            "Average_Desaturation_Drop_Supine": avg_desat_drop_supine,
            "Average_Desaturation_Drop_NonSupine": avg_desat_drop_non_supine
        }

        # === Position Analysis ===
        # Calculate total sleep time (TST) as readings with position not equal to "Sitting / Upright" (assuming upright is not sleep)
        TST_readings = [r for r in readings if r.get('position') != "Sitting / Upright"]
        TST_minutes = (len(TST_readings) * 0.25) / 60.0 if TST_readings else 0
        TRT_minutes = total_duration_seconds / 60.0

        # For each distinct position, calculate duration and percentage relative to TST (for non-upright positions)
        position_durations = {}
        for r in readings:
            pos = r.get('position', 'Unknown')
            position_durations[pos] = position_durations.get(pos, 0) + 0.25  # 3 seconds per reading

        position_durations_m = {pos: seconds / 60.0 for pos, seconds in position_durations.items()}
        # Calculate percentages (for positions other than "Sitting / Upright")
        position_percentages = {}
        for pos, minutes in position_durations_m.items():
            if pos != "Sitting / Upright" and TST_minutes > 0:
                position_percentages[pos] = (minutes / TST_minutes * 100)
            else:
                position_percentages[pos] = None

        # Also calculate upright percentage (for "Sitting / Upright")
        upright_percentage = (position_durations_m.get("Sitting / Upright", 0) / TRT_minutes * 100) if TRT_minutes > 0 else None

        position_analysis = {
            "position_durations_minutes": position_durations_m,
            "position_percentages": position_percentages,
            "Total_Sleep_Time_minutes": TST_minutes,
            "Total_Recording_Time_minutes": TRT_minutes,
            "Upright_Percentage": upright_percentage,
            "Movement_in_TST": 0,         # Simulated value (update as needed)
            "Invalid_Data_Excluded": 0,   # Simulated value (update as needed)
            "position_summary": {pos: count for pos, count in position_durations.items()}
        }

        # === Pulse ===
        heart_rates = [float(r['heartrate']) for r in readings if r.get('heartrate') is not None]
        avg_heart_rate = sum(heart_rates) / len(heart_rates) if heart_rates else None
        max_heart_rate = max(heart_rates) if heart_rates else None
        min_heart_rate = min(heart_rates) if heart_rates else None
        dur_below_40 = sum(0.25 for r in readings if r.get('heartrate') is not None and float(r['heartrate']) < 40) / 60.0
        dur_above_100 = sum(0.25 for r in readings if r.get('heartrate') is not None and float(r['heartrate']) > 100) / 60.0

        pulse = {
            "Average_Heart_Rate": avg_heart_rate,
            "Maximum_Heart_Rate": max_heart_rate,
            "Minimum_Heart_Rate": min_heart_rate,
            "Duration_below_40_minutes": dur_below_40,
            "Duration_above_100_minutes": dur_above_100
        }

        # === Signal Quality ===
        oximeter_qualities = [float(r.get('oximeter_quality', 0)) for r in readings if r.get('oximeter_quality')]
        avg_oximeter_quality = sum(oximeter_qualities) / len(oximeter_qualities) if oximeter_qualities else None
        rip_qualities = [float(r.get('rip_quality', 0)) for r in readings if r.get('rip_quality')]
        avg_rip_quality = sum(rip_qualities) / len(rip_qualities) if rip_qualities else None

        signal_quality = {
            "Average_Oximeter_Quality": avg_oximeter_quality,
            "Average_RIP_Quality": avg_rip_quality
        }

        # === Trend Overview Data ===
        trend_overview = {
            "positions": [r.get('position', 'Unknown') for r in readings],
            "oxygen_levels": [float(r['oxygen_level']) for r in readings if r.get('oxygen_level')],
            "heart_rates": [float(r['heartrate']) for r in readings if r.get('heartrate')],
            "snore_values": [float(r.get('snore', 0)) for r in readings],
            "event_types": [r.get('event_type', 'none') for r in readings],
            "airflow_states": [r.get('airflow_state', '') for r in readings],
            "chest_movement_states": [r.get('chest_movement_state', '') for r in readings],
            "apnea_events": apnea_events,
            "hypopnea_events": hypopnea_events,
            "desaturation_events": desat_events
        }

        # === Build the Full Report Dictionary ===
        report_full = {
            "overview": overview,
            "respiratory_indices": respiratory_indices,
            "oxygen_saturation": oxygen_saturation,
            "position_analysis": position_analysis,
            "pulse": pulse,
            "signal_quality": signal_quality,
            "trend_overview": trend_overview,
            "raw_readings": readings
        }
        
        cursor.close()
        connection.close()
        return jsonify(report_full), 200

    except Exception as e:
        print("Error generating full report for session {}: {}".format(session_id, e))
        return jsonify({'msg': 'Error generating full session report', 'error': str(e)}), 500
    
@app.route('/snore_data', methods=['POST'])
def receive_snore_data():
    try:
        # Use session_id from the POST data or fallback to the current session
        session_id = request.form.get('session_id') or current_session_id
        snore_value = request.form.get('snore')
        if session_id is None or snore_value is None:
            return "Missing session_id or snore value", 400

        connection = mysql.connector.connect(
            host=db_host,
            database=database,
            user=db_user,
            password=db_password
        )
        cursor = connection.cursor()
        query = "INSERT INTO snore_readings (session_id, snore) VALUES (%s, %s)"
        cursor.execute(query, (session_id, snore_value))
        connection.commit()
        cursor.close()
        connection.close()
        return "Snore data received and stored.", 200
    except Exception as e:
        print("Error in /snore_data:", e)
        return jsonify({'msg': 'Error processing snore data', 'error': str(e)}), 500

###########################################
# Run the Flask Application
###########################################
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001, debug=True)