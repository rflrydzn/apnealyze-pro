import random
import mysql.connector
from datetime import datetime, timedelta
import math

# === SESSION 275 PARAMETERS ===
SESSION_ID = 275
START_STR  = "2025-03-25 23:32:04"   # Start: March 25, 2025 11:32:04 PM
# 6:26:50 => 6*3600 + 26*60 + 50 = 23210 seconds
TOTAL_DURATION_SEC = 23210
SAMPLES_PER_SECOND = 4
TOTAL_SAMPLES = TOTAL_DURATION_SEC * SAMPLES_PER_SECOND

# === Hard-coded intervals in SECONDS ===
#  0–162s => Sitting / Upright
#  162–23196s => random positions (majority supine, last chunk supine)
#  23196–23200s => Sitting / Upright
#  23200–23210s => Supine

# === Toggling & Event Probability for More AHI ===
SKIP_TOGGLE_PROB   = 0.02   # Very low => toggles nearly every 3 s
EVENT_THRESHOLD    = 32     # ~8 s of same airflow => event
CHEST_DELAY_PROB   = 0.3    # 30% chest delay

# Apnea/Hypopnea logic
APNEA_INHALE_CHANCE = 0.15  # 15% on Inhale
HYPO_EXHALE_CHANCE  = 0.80  # 80% => Hypopnea, 20% => Apnea
HYPO_DROP_SAMPLES   = 40    # 10 s forced O₂ drop
HYPO_DROP_MIN       = 3
HYPO_DROP_MAX       = 4

# Weights for random positions: 70% supine, 15% left, 15% right
POSITION_WEIGHTS = {
    "Lying on Back (Supine)": 0.70,
    "Lying on Left Side":      0.15,
    "Lying on Right Side":     0.15
}

# ========== Build Middle Positions (162–23196) in minutes ==========

def pick_weighted_position():
    """Return a random position among supine, left, right with 70% supine."""
    r = random.random()
    if r < 0.70:
        return "Lying on Back (Supine)"
    elif r < 0.85:
        return "Lying on Left Side"
    else:
        return "Lying on Right Side"

def build_middle_positions(total_minutes):
    """
    Build a minute-based array from 0..(total_minutes),
    chunk-based 20–60 min segments with 70% supine, 15% left, 15% right,
    forcing the last chunk to be supine.
    """
    timeline = []
    used = 0
    while used < total_minutes:
        seg_len = random.randint(20, 60)
        if used + seg_len > total_minutes:
            seg_len = total_minutes - used

        # Pick a random position
        pos = pick_weighted_position()
        # We'll fill seg_len minutes with pos
        timeline.extend([pos]*seg_len)
        used += seg_len

    # Force the final chunk to supine
    if len(timeline) > 0:
        timeline[-1] = "Lying on Back (Supine)"

    return timeline[:total_minutes]

# ========== Build Full Position Timeline (0..23210 s) ==========

def build_position_timeline():
    positions = [None]*TOTAL_SAMPLES

    # 1) Fill 0..162 => Sitting
    for s in range(0, 162*SAMPLES_PER_SECOND):
        if s < TOTAL_SAMPLES:
            positions[s] = "Sitting / Upright"

    # 2) Fill 23196..23200 => Sitting
    for s in range(23196*SAMPLES_PER_SECOND, 23200*SAMPLES_PER_SECOND):
        if s < TOTAL_SAMPLES:
            positions[s] = "Sitting / Upright"

    # 3) Fill 23200..23210 => Supine
    for s in range(23200*SAMPLES_PER_SECOND, TOTAL_SAMPLES):
        positions[s] = "Lying on Back (Supine)"

    # Middle portion => 162..23196
    # Convert to minutes => (23196-162)/60 => 23034/60 => ~383.9 => int => 383 or 384
    middle_sec = 23196 - 162  # 23034
    middle_minutes = math.ceil(middle_sec / 60.0)  # e.g. 384
    # Build chunk-based minute array for that portion
    mid_positions_minutes = build_middle_positions(middle_minutes)

    # Expand mid_positions_minutes => seconds => fill positions array
    # from second=162..(162+middle_sec)
    start_mid_sec = 162
    end_mid_sec   = 162 + middle_sec  # 23196
    # We'll do an index for the minute-based array
    #  0..(middle_minutes-1) => each index => 1 minute => 60 seconds
    # But the last minute might not be fully 60 if middle_sec isn't multiple of 60
    # We'll do a second-based approach
    minute_idx = 0
    for sec in range(start_mid_sec, end_mid_sec):
        if sec >= TOTAL_DURATION_SEC:
            break
        # The minute index => (sec - 162)//60 => 
        minute_idx = (sec - 162)//60
        if minute_idx >= middle_minutes:
            minute_idx = middle_minutes-1
        pos = mid_positions_minutes[minute_idx]
        s_idx = sec * SAMPLES_PER_SECOND
        # fill this second
        for ss in range(s_idx, s_idx+SAMPLES_PER_SECOND):
            if ss < TOTAL_SAMPLES:
                positions[ss] = pos

    # Fill any None => default "Sitting / Upright"
    for i in range(TOTAL_SAMPLES):
        if positions[i] is None:
            positions[i] = "Sitting / Upright"

    return positions

# ========== Build chunk-based sensors ==========

def build_chunked_sensors(total_minutes):
    hr_list   = []
    oxy_list  = []
    conf_list = []
    used = 0
    while used < total_minutes:
        seg_len = random.randint(20, 60)
        if used + seg_len > total_minutes:
            seg_len = total_minutes - used

        hr_val  = random.randint(60, 100)
        oxy_val = random.randint(90, 99)
        cf_val  = random.randint(70, 100)

        hr_list.extend([hr_val]*seg_len)
        oxy_list.extend([oxy_val]*seg_len)
        conf_list.extend([cf_val]*seg_len)
        used += seg_len

    return hr_list, oxy_list, conf_list

def generate_session_275_data_mysql():
    # 1) Connect to MySQL
    import math
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

    # 2) Session timing
    start_dt = datetime.strptime(START_STR, "%Y-%m-%d %H:%M:%S")
    end_dt   = start_dt + timedelta(seconds=TOTAL_DURATION_SEC)
    total_seconds = (end_dt - start_dt).total_seconds()
    hours = total_seconds / 3600.0
    sample_delta = timedelta(seconds=1.0 / SAMPLES_PER_SECOND)

    # 3) Positions
    position_array = build_position_timeline()

    # 4) Sensors
    total_minutes = math.ceil(total_seconds / 60.0)
    hr_mins, oxy_mins, conf_mins = build_chunked_sensors(total_minutes)

    hr_timeline   = []
    oxy_timeline  = []
    conf_timeline = []
    for m in range(total_minutes):
        count = 60 * SAMPLES_PER_SECOND
        hr_timeline.extend([hr_mins[m]] * count)
        oxy_timeline.extend([oxy_mins[m]] * count)
        conf_timeline.extend([conf_mins[m]] * count)

    # Trim/pad
    hr_timeline   = hr_timeline[:TOTAL_SAMPLES]
    oxy_timeline  = oxy_timeline[:TOTAL_SAMPLES]
    conf_timeline = conf_timeline[:TOTAL_SAMPLES]
    while len(hr_timeline) < TOTAL_SAMPLES:
        hr_timeline.append(hr_timeline[-1])
        oxy_timeline.append(oxy_timeline[-1])
        conf_timeline.append(conf_timeline[-1])

    # 5) Toggling & event simulation
    airflow_array = [None]*TOTAL_SAMPLES
    chest_array   = [None]*TOTAL_SAMPLES

    airflow_state = "Exhale"
    chest_state   = "exhaling"

    consecutive_same_airflow = 0
    airflow_toggle_counter = 0
    chest_toggle_counter   = 0

    forcedHypopneaEnd   = -1
    forcedDropBaseline  = None
    forcedDropAmount    = 0

    apnea_flags    = [0]*TOTAL_SAMPLES
    hypopnea_flags = [0]*TOTAL_SAMPLES

    for i in range(TOTAL_SAMPLES):
        pos_now = position_array[i]
        # If forced O₂ drop ongoing
        if i < forcedHypopneaEnd:
            forced_val = forcedDropBaseline - forcedDropAmount
            if forced_val < 80:
                forced_val = 80
            oxy_timeline[i] = forced_val
        else:
            forcedHypopneaEnd = -1

        # ========== Chest toggling (always, entire session) ==========
        chest_toggle_counter += 1
        if chest_toggle_counter >= 12:  # ~3s
            #  We can do a simple skip prob => 0.2
            if random.random() > 0.2:
                new_chest = "inhaling" if chest_state == "exhaling" else "exhaling"
                chest_state = new_chest
            chest_toggle_counter = 0

        # ========== Airflow toggling & events (entire session, no override) ==========
        airflow_toggle_counter += 1
        if airflow_toggle_counter >= 12:  # ~3s
            if random.random() > SKIP_TOGGLE_PROB:
                new_airflow = "Inhale" if airflow_state == "Exhale" else "Exhale"
                airflow_state = new_airflow
                consecutive_same_airflow = 1
                forcedHypopneaEnd = -1
            else:
                consecutive_same_airflow += 12
            airflow_toggle_counter = 0
        else:
            consecutive_same_airflow += 1

        # If position is upright => reset consecutive & forced block
        if pos_now == "Sitting / Upright":
            consecutive_same_airflow = 0
            forcedHypopneaEnd = -1

        # If same airflow >= threshold => event
        if (pos_now != "Sitting / Upright") and (i >= forcedHypopneaEnd) and (consecutive_same_airflow >= EVENT_THRESHOLD):
            if airflow_state == "Inhale":
                # 15% => Apnea
                if random.random() < APNEA_INHALE_CHANCE:
                    apnea_flags[i] = 1
            else:
                # Exhale => 80% => Hypopnea, 20% => Apnea
                if random.random() < HYPO_EXHALE_CHANCE and oxy_timeline[i] != 0:
                    hypopnea_flags[i] = 1
                    forcedHypopneaEnd = i + HYPO_DROP_SAMPLES
                    forcedDropBaseline = oxy_timeline[i]
                    forcedDropAmount   = random.randint(HYPO_DROP_MIN, HYPO_DROP_MAX)
                else:
                    apnea_flags[i] = 1
            consecutive_same_airflow = 0

        # Store final states
        airflow_array[i] = airflow_state
        chest_array[i]   = chest_state

    # 6) Insert into MySQL
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
    generate_session_275_data_mysql()
