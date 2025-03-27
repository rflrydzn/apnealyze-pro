import random
import mysql.connector
from datetime import datetime, timedelta
import math

# === Session 279 Parameters ===
SESSION_ID = 279
START_STR  = "2025-03-27 01:21:36"   # Session start time
# Duration: 5:49:55 → 5*3600 + 49*60 + 55 = 20995 seconds
TOTAL_DURATION_SEC = 20995
SAMPLES_PER_SECOND = 4
TOTAL_SAMPLES = TOTAL_DURATION_SEC * SAMPLES_PER_SECOND

# === Toggling & Event Parameters (Lower event frequency for AHI 5-12) ===
# With a higher skip probability, toggles occur more frequently.
AIRFLOW_SKIP_PROB = 0.10       # Increased skip probability so state changes more often
EVENT_THRESHOLD  = 50         # 50 samples = ~12.5 seconds required for event trigger
CHEST_SKIP_PROB  = 0.2         # 20% chance to skip chest toggling
CHEST_DELAY_PROB = 0.3         # 30% chance chest delay 1–2 samples

# Apnea/Hypopnea probabilities:
APNEA_INHALE_CHANCE = 0.15     # 15% chance for apnea when airflow is Inhale
HYPO_EXHALE_CHANCE  = 0.80     # 80% chance for hypopnea when airflow is Exhale, else 20% apnea

# Forced O2 drop for Hypopnea: drop by 3-4% for 10 s (40 samples)
HYPO_DROP_SAMPLES = 40
HYPO_DROP_MIN     = 3
HYPO_DROP_MAX     = 4

# === Sleep Position Timeline for Session 279 ===
# The intervals are given as seconds from session start:
#  0:00:01 - 0:00:06                -> Sitting / Upright
#  0:00:06 - 24:01                  -> Supine
#  24:01 - 51:00                   -> Left Side
#  51:00 - 56:00                   -> Supine
#  56:00 - 1:04:00                 -> Left Side
#  1:04:00 - 1:18:44               -> Supine
#  1:18:44 - 1:20:00               -> Left Side
#  1:20:00 - 1:57:00               -> Supine
#  1:57:00 - 1:57:02               -> Supine (fill gap)
#  1:57:02 - 3:02:04               -> Left Side
#  3:02:04 - 3:25:18               -> Supine
#  3:25:18 - 3:46:22               -> Left Side
#  3:46:22 - 5:01:45               -> Supine
#  5:01:45 - 5:25:02               -> Right Side
#  5:25:02 - 5:49:36               -> Supine
#  5:49:36 - End (5:49:55)         -> Supine
position_intervals = [
    (1,       6,      "Sitting / Upright"),
    (6,       1441,   "Lying on Back (Supine)"),
    (1441,    3060,   "Lying on Left Side"),
    (3060,    3360,   "Lying on Back (Supine)"),
    (3360,    3840,   "Lying on Left Side"),
    (3840,    4724,   "Lying on Back (Supine)"),
    (4724,    4800,   "Lying on Left Side"),
    (4800,    7020,   "Lying on Back (Supine)"),
    (7020,    7022,   "Lying on Back (Supine)"),  # fill gap
    (7022,    10924,  "Lying on Left Side"),
    (10924,   12318,  "Lying on Back (Supine)"),
    (12318,   13582,  "Lying on Left Side"),
    (13582,   18105,  "Lying on Back (Supine)"),
    (18105,   19502,  "Lying on Right Side"),
    (19502,   20976,  "Lying on Back (Supine)"),
    (20976,   20995,  "Lying on Back (Supine)")
]

def build_position_timeline():
    positions = [None] * TOTAL_SAMPLES
    for (start_sec, end_sec, pos) in position_intervals:
        start_idx = int(start_sec * SAMPLES_PER_SECOND)
        end_idx = int(end_sec * SAMPLES_PER_SECOND)
        for i in range(start_idx, min(end_idx, TOTAL_SAMPLES)):
            positions[i] = pos
    for i in range(TOTAL_SAMPLES):
        if positions[i] is None:
            positions[i] = "Sitting / Upright"
    return positions

# === Build Chunk-Based Sensor Values ===
def build_chunked_sensors(total_minutes):
    hr_list = []
    oxy_list = []
    conf_list = []
    used = 0
    while used < total_minutes:
        seg_len = random.randint(20, 60)  # each chunk lasts 20-60 minutes
        if used + seg_len > total_minutes:
            seg_len = total_minutes - used
        hr_val  = random.randint(60, 100)
        oxy_val = random.randint(90, 99)
        cf_val  = random.randint(70, 100)
        hr_list.extend([hr_val] * seg_len)
        oxy_list.extend([oxy_val] * seg_len)
        conf_list.extend([cf_val] * seg_len)
        used += seg_len
    return hr_list, oxy_list, conf_list

def generate_session_279_data_mysql():
    try:
        connection = mysql.connector.connect(
            host="localhost",
            user="root",
            password="dizon0019",
            database="sensor_data",
            auth_plugin='mysql_native_password'
        )
    except mysql.connector.Error as err:
        print("MySQL connection error:", err)
        return
    cursor = connection.cursor()

    # 1) Session timing
    start_dt = datetime.strptime(START_STR, "%Y-%m-%d %H:%M:%S")
    end_dt = start_dt + timedelta(seconds=TOTAL_DURATION_SEC)
    total_seconds = (end_dt - start_dt).total_seconds()
    hours = total_seconds / 3600.0
    sample_delta = timedelta(seconds=1.0 / SAMPLES_PER_SECOND)

    # 2) Build position timeline from given intervals
    position_array = build_position_timeline()

    # 3) Generate sensor values (per minute) and expand to sample-level arrays
    total_minutes = math.ceil(total_seconds / 60)
    hr_chunk, oxy_chunk, conf_chunk = build_chunked_sensors(total_minutes)
    hr_timeline = []
    oxy_timeline = []
    conf_timeline = []
    for m in range(total_minutes):
        count = 60 * SAMPLES_PER_SECOND
        hr_timeline.extend([hr_chunk[m]] * count)
        oxy_timeline.extend([oxy_chunk[m]] * count)
        conf_timeline.extend([conf_chunk[m]] * count)
    hr_timeline   = hr_timeline[:TOTAL_SAMPLES]
    oxy_timeline  = oxy_timeline[:TOTAL_SAMPLES]
    conf_timeline = conf_timeline[:TOTAL_SAMPLES]
    while len(hr_timeline) < TOTAL_SAMPLES:
        hr_timeline.append(hr_timeline[-1])
        oxy_timeline.append(oxy_timeline[-1])
        conf_timeline.append(conf_timeline[-1])

    # 4) Toggling & Event Simulation (both airflow and chest toggle normally throughout)
    airflow_array = [None] * TOTAL_SAMPLES
    chest_array   = [None] * TOTAL_SAMPLES

    # Initial states
    airflow_state = "Exhale"
    chest_state   = "exhaling"

    airflow_toggle_counter = 0
    chest_toggle_counter = 0

    consecutive_same_airflow = 0

    forcedHypopneaEnd = -1
    forcedDropBaseline = None
    forcedDropAmount = 0

    apnea_flags = [0] * TOTAL_SAMPLES
    hypopnea_flags = [0] * TOTAL_SAMPLES

    for i in range(TOTAL_SAMPLES):
        pos_now = position_array[i]

        # Forced O₂ drop for hypopnea events
        if i < forcedHypopneaEnd:
            forced_val = forcedDropBaseline - forcedDropAmount
            if forced_val < 80:
                forced_val = 80
            oxy_timeline[i] = forced_val
        else:
            forcedHypopneaEnd = -1

        # If in Sitting/Upright, reset consecutive counter
        if pos_now == "Sitting / Upright":
            consecutive_same_airflow = 0
            forcedHypopneaEnd = -1

        # --- Chest toggling (always normal throughout) ---
        chest_toggle_counter += 1
        if chest_toggle_counter >= 12:  # ~3 seconds
            if random.random() > CHEST_SKIP_PROB:
                chest_state = "inhaling" if chest_state == "exhaling" else "exhaling"
            chest_toggle_counter = 0

        # --- Airflow toggling & event simulation ---
        airflow_toggle_counter += 1
        if airflow_toggle_counter >= 12:  # ~3 seconds
            if random.random() > AIRFLOW_SKIP_PROB:
                new_airflow = "Inhale" if airflow_state == "Exhale" else "Exhale"
                airflow_state = new_airflow
                consecutive_same_airflow = 1
                forcedHypopneaEnd = -1
            else:
                consecutive_same_airflow += 12
            airflow_toggle_counter = 0
        else:
            consecutive_same_airflow += 1

        # If same airflow persists for EVENT_THRESHOLD samples (50 samples = ~12.5s) then trigger event (if not in Sitting/Upright)
        if (pos_now != "Sitting / Upright") and (consecutive_same_airflow >= EVENT_THRESHOLD):
            if airflow_state == "Inhale":
                if random.random() < APNEA_INHALE_CHANCE:
                    apnea_flags[i] = 1
            else:
                if random.random() < HYPO_EXHALE_CHANCE and oxy_timeline[i] != 0:
                    hypopnea_flags[i] = 1
                    forcedHypopneaEnd = i + HYPO_DROP_SAMPLES
                    forcedDropBaseline = oxy_timeline[i]
                    forcedDropAmount = random.randint(HYPO_DROP_MIN, HYPO_DROP_MAX)
                else:
                    apnea_flags[i] = 1
            consecutive_same_airflow = 0

        # Store toggled states in arrays
        airflow_array[i] = airflow_state
        chest_array[i] = chest_state

    # 5) Insert generated rows into MySQL
    insert_query = """
    INSERT INTO readings (
      heartrate, oxygen_level, confidence, position,
      airflow_state, chest_movement_state,
      apnea_flag, hypopnea_flag, session_id, timestamp
    )
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    current_time = start_dt
    inserted_count = 0

    for i in range(TOTAL_SAMPLES):
        ts_str = current_time.strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
        data_tuple = (
            hr_timeline[i],
            oxy_timeline[i],
            conf_timeline[i],
            position_array[i],
            airflow_array[i],
            chest_array[i],
            apnea_flags[i],
            hypopnea_flags[i],
            SESSION_ID,
            ts_str
        )
        cursor.execute(insert_query, data_tuple)
        inserted_count += 1
        current_time += sample_delta
        if inserted_count % 1000 == 0:
            connection.commit()

    connection.commit()
    cursor.close()
    connection.close()

    print(f"[Session {SESSION_ID}] Inserted {inserted_count} rows (~{hours:.2f} hours).")
    print(f"Start: {start_dt}, End: {end_dt}")

if __name__ == "__main__":
    generate_session_279_data_mysql()
