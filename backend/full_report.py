# full_report.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error

app = Flask(__name__)
CORS(app)

# MySQL configuration – update these values with your credentials
db_host = 'localhost'
database = 'sensor_data'
db_user = 'root'
db_password = 'dizon0019'
    
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
        
        # Retrieve all sensor readings for the session (assumed sorted by time)
        query = "SELECT * FROM readings WHERE session_id = %s ORDER BY timestamp ASC"
        cursor.execute(query, (session_id,))
        readings = cursor.fetchall()
        
        if not readings:
            return jsonify({'msg': 'No readings found for session.'}), 404
        
        total_readings = len(readings)
        # Each reading represents 3 seconds (as per our Arduino delay)
        total_duration_seconds = total_readings * 3
        total_duration_hours = total_duration_seconds / 3600.0
        
        ## OVERVIEW
        # Count apnea/hypopnea events (all events in event_type that are either 'apnea' or 'hypopnea')
        total_AH_events = sum(1 for r in readings if r.get('event_type') in ['apnea', 'hypopnea'])
        AHI = total_AH_events / total_duration_hours if total_duration_hours > 0 else None
        
        # Count desaturation events (oxygen level < 90)
        total_desat_events = sum(1 for r in readings if r.get('oxygen_level') is not None and float(r['oxygen_level']) < 90)
        ODI = total_desat_events / total_duration_hours if total_duration_hours > 0 else None
        
        # Calculate Snore Percentage (percentage of readings where snore value > 0.5)
        snore_count = sum(1 for r in readings if r.get('snore') and float(r['snore']) > 0.5)
        snore_percentage = (snore_count / total_readings * 100) if total_readings > 0 else None
        
        ## RESPIRATORY INDICES
        total_apnea = sum(1 for r in readings if r.get('event_type') == 'apnea')
        total_hypopnea = sum(1 for r in readings if r.get('event_type') == 'hypopnea')
        total_obstructive_apnea = sum(1 for r in readings if r.get('event_type') == 'obstructive_apnea')
        total_obstructive_hypopnea = sum(1 for r in readings if r.get('event_type') == 'obstructive_hypopnea')
        total_OA_OH = total_obstructive_apnea + total_obstructive_hypopnea  # plus mixed if available
        
        # Calculate supine vs. non-supine event rates
        supine_readings = [r for r in readings if r.get('position') == 'supine']
        non_supine_readings = [r for r in readings if r.get('position') != 'supine']
        supine_AH = sum(1 for r in supine_readings if r.get('event_type') in ['apnea', 'hypopnea'])
        non_supine_AH = sum(1 for r in non_supine_readings if r.get('event_type') in ['apnea', 'hypopnea'])
        supine_duration_hours = (len(supine_readings) * 3) / 3600.0 if supine_readings else 0
        non_supine_duration_hours = (len(non_supine_readings) * 3) / 3600.0 if non_supine_readings else 0
        supine_rate = supine_AH / supine_duration_hours if supine_duration_hours > 0 else None
        non_supine_rate = non_supine_AH / non_supine_duration_hours if non_supine_duration_hours > 0 else None
        
        # Average respiration rate (assume each reading contains 'respiration_rate')
        respiration_rates = [float(r.get('respiration_rate', 0)) for r in readings if r.get('respiration_rate')]
        avg_respiration_rate = sum(respiration_rates) / len(respiration_rates) if respiration_rates else None
        
        ## OXYGEN SATURATION (SpO2)
        oxygens = [float(r['oxygen_level']) for r in readings if r.get('oxygen_level') is not None]
        avg_oxygen = sum(oxygens) / len(oxygens) if oxygens else None
        min_oxygen = min(oxygens) if oxygens else None
        
        # Calculate durations (in minutes) where SpO2 is below thresholds (<90, <88, <85)
        dur_below_90 = sum(3 for r in readings if r.get('oxygen_level') is not None and float(r['oxygen_level']) < 90) / 60.0
        dur_below_88 = sum(3 for r in readings if r.get('oxygen_level') is not None and float(r['oxygen_level']) < 88) / 60.0
        dur_below_85 = sum(3 for r in readings if r.get('oxygen_level') is not None and float(r['oxygen_level']) < 85) / 60.0
        
        # Average desaturation drop (difference between avg_oxygen and oxygen level for those below average)
        desat_drops = [avg_oxygen - float(r['oxygen_level']) for r in readings if r.get('oxygen_level') is not None and float(r['oxygen_level']) < avg_oxygen]
        avg_desat_drop = sum(desat_drops) / len(desat_drops) if desat_drops else None
        
        ## POSITION AND ANALYSIS TIME
        positions = ['supine', 'non-supine', 'left', 'prone', 'right', 'unknown', 'upright']
        position_durations = {pos: sum(3 for r in readings if r.get('position') == pos) for pos in positions}
        position_durations_m = {pos: duration / 60.0 for pos, duration in position_durations.items()}
        # Total Sleep Time (TST): readings with position not 'upright'
        TST_seconds = sum(3 for r in readings if r.get('position') != 'upright')
        TST_minutes = TST_seconds / 60.0
        position_percentages = {pos: (position_durations_m[pos] / TST_minutes * 100) if TST_minutes > 0 else None 
                                for pos in positions if pos != 'upright'}
        # Upright percentage (Total Recording Time, TRT)
        TRT_minutes = total_duration_seconds / 60.0
        upright_percentage = (position_durations_m.get('upright', 0) / TRT_minutes * 100) if TRT_minutes > 0 else None
        
        # Movement in TST and Invalid Data Excluded (simulate as 0 for now)
        movement_in_TST = 0
        invalid_data_excluded = 0
        
        ## PULSE
        heart_rates = [float(r['heartrate']) for r in readings if r.get('heartrate') is not None]
        avg_heart_rate = sum(heart_rates) / len(heart_rates) if heart_rates else None
        max_heart_rate = max(heart_rates) if heart_rates else None
        min_heart_rate = min(heart_rates) if heart_rates else None
        dur_below_40 = sum(3 for r in readings if r.get('heartrate') is not None and float(r['heartrate']) < 40) / 60.0
        dur_above_100 = sum(3 for r in readings if r.get('heartrate') is not None and float(r['heartrate']) > 100) / 60.0
        
        ## SIGNAL QUALITY
        oximeter_qualities = [float(r.get('oximeter_quality', 0)) for r in readings if r.get('oximeter_quality')]
        avg_oximeter_quality = sum(oximeter_qualities) / len(oximeter_qualities) if oximeter_qualities else None
        
        rip_qualities = [float(r.get('rip_quality', 0)) for r in readings if r.get('rip_quality')]
        avg_rip_quality = sum(rip_qualities) / len(rip_qualities) if rip_qualities else None
        
        ## TREND OVERVIEW DATA
        trend_data = {
            "positions": [r.get('position', 'unknown') for r in readings],
            "event_types": [r.get('event_type', 'none') for r in readings],
            "oxygen_levels": [float(r['oxygen_level']) for r in readings if r.get('oxygen_level')],
            "heart_rates": [float(r['heartrate']) for r in readings if r.get('heartrate')],
            "snore_values": [float(r.get('snore', 0)) for r in readings]
        }
        
        report = {
            "overview": {
                "AHI": AHI,
                "ODI": ODI,
                "Snore_Percentage": snore_percentage
            },
            "respiratory_indices": {
                "Total_AH": total_AH_events,
                "Supine_AH_per_hour": supine_rate,
                "NonSupine_AH_per_hour": non_supine_rate,
                "Obstructive_Apnea": total_obstructive_apnea,
                "Obstructive_Hypopnea": total_obstructive_hypopnea,
                "OA_OH_total": total_OA_OH,
                "Respiration_Rate_per_min": avg_respiration_rate
            },
            "oxygen_saturation": {
                "ODI_per_hour": ODI,
                "Average_SpO2": avg_oxygen,
                "Minimum_SpO2": min_oxygen,
                "SpO2_Duration_below_90_minutes": dur_below_90,
                "SpO2_Duration_below_88_minutes": dur_below_88,
                "SpO2_Duration_below_85_minutes": dur_below_85,
                "Average_Desaturation_Drop": avg_desat_drop
            },
            "position_analysis": {
                "position_durations_minutes": position_durations_m,
                "position_percentages": position_percentages,
                "upright_percentage": upright_percentage,
                "Total_Sleep_Time_minutes": TST_minutes,
                "Total_Recording_Time_minutes": TRT_minutes,
                "Movement_in_TST": movement_in_TST,
                "Invalid_Data_Excluded": invalid_data_excluded
            },
            "pulse": {
                "Average_Heart_Rate": avg_heart_rate,
                "Maximum_Heart_Rate": max_heart_rate,
                "Minimum_Heart_Rate": min_heart_rate,
                "Duration_below_40_minutes": dur_below_40,
                "Duration_above_100_minutes": dur_above_100
            },
            "signal_quality": {
                "Average_Oximeter_Quality": avg_oximeter_quality,
                "Average_RIP_Quality": avg_rip_quality
            },
            "trend_overview": trend_data,
            "raw_readings": readings
        }
        
        cursor.close()
        connection.close()
        return jsonify(report), 200

    except Exception as e:
        print("Error generating full report for session {}: {}".format(session_id, e))
        return jsonify({'msg': 'Error generating full session report', 'error': str(e)}), 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001, debug=True)