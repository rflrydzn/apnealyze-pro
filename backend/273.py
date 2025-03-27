import random
import mysql.connector
from datetime import datetime, timedelta
import math

# === Session 273 Parameters ===
SESSION_ID = 273
START_STR = "2025-03-25 00:47:02"  # Start time
TOTAL_DURATION_SEC = 6874         # 1:54:34 => 6874 s
SAMPLES_PER_SECOND = 4
TOTAL_SAMPLES = TOTAL_DURATION_SEC * SAMPLES_PER_SECOND

# Override at 1:49:55 => 6595 s => sample idx=26380 => airflow forced "Exhale"
OVERRIDE_TIME_SEC = 6595
OVERRIDE_SAMPLE_IDX = OVERRIDE_TIME_SEC * SAMPLES_PER_SECOND

# === Toggling & Event Params (for More AHI) ===
AIRFLOW_SKIP_PROB = 0.02   # Very low => toggles nearly every 3 s => more events
AIRFLOW_EVENT_THRESHOLD  = 32  # 8 s at 4 Hz => easier to trigger events

CHEST_SKIP_PROB   = 0.2   # chest toggling skip probability
CHEST_DELAY_PROB  = 0.3   # 30% chance chest is delayed 1–2 samples

# Apnea/Hypopnea Probabilities
APNEA_INHALE_CHANCE = 0.15  # 15% chance on Inhale
HYPO_EXHALE_CHANCE  = 0.80  # 80% Hypopnea on Exhale, 20% Apnea

# Hypopnea => O₂ drop 3–4% for 10 s => 40 samples
HYPO_DROP_SAMPLES = 40
HYPO_DROP_MIN     = 3
HYPO_DROP_MAX     = 4

# === Sleep Position Timeline (seconds) ===
#  0–27    => "Sitting / Upright"
#  27–59   => "Lying on Back (Supine)"
#  59–101  => "Sitting / Upright"
#  101–6835 => "Lying on Back (Supine)"
#  6835–6874 => "Sitting / Upright"
def build_position_timeline():
    pos_array = [None] * TOTAL_SAMPLES

    def fill_pos(start_sec, end_sec, pos):
        start_i = int(start_sec * SAMPLES_PER_SECOND)
        end_i   = int(end_sec * SAMPLES_PER_SECOND)
        for idx in range(start_i, min(end_i, TOTAL_SAMPLES)):
            pos_array[idx] = pos

    fill_pos(0,    27,   "Sitting / Upright")
    fill_pos(27,   59,   "Lying on Back (Supine)")
    fill_pos(59,   101,  "Sitting / Upright")
    fill_pos(101,  6835, "Lying on Back (Supine)")
    fill_pos(6835, TOTAL_DURATION_SEC, "Sitting / Upright")

    for i in range(TOTAL_SAMPLES):
        if pos_array[i] is None:
            pos_array[i] = "Sitting / Upright"
    return pos_array

# === Build chunk-based sensor lines (HR, O₂, Confidence) ===
def build_chunked_sensors(total_minutes):
    hr_list   = []
    oxy_list  = []
    conf_list = []
    used = 0
    while used < total_minutes:
        seg_len = random.randint(20, 60)  # 20–60 min chunks
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

def generate_session_273_data_mysql():
    # 1) MySQL Connection
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

    # 3) Build position timeline
    position_array = build_position_timeline()

    # 4) Build chunk-based sensor lines
    total_minutes = int(math.ceil(total_seconds / 60.0))
    hr_mins, oxy_mins, conf_mins = build_chunked_sensors(total_minutes)

    hr_timeline   = []
    oxy_timeline  = []
    conf_timeline = []
    for m in range(total_minutes):
        count = 60 * SAMPLES_PER_SECOND
        hr_timeline.extend([hr_mins[m]] * count)
        oxy_timeline.extend([oxy_mins[m]] * count)
        conf_timeline.extend([conf_mins[m]] * count)

    # Trim/pad to EXACT total samples
    hr_timeline   = hr_timeline[:TOTAL_SAMPLES]
    oxy_timeline  = oxy_timeline[:TOTAL_SAMPLES]
    conf_timeline = conf_timeline[:TOTAL_SAMPLES]
    while len(hr_timeline) < TOTAL_SAMPLES:
        hr_timeline.append(hr_timeline[-1])
        oxy_timeline.append(oxy_timeline[-1])
        conf_timeline.append(conf_timeline[-1])

    # 5) Separate toggles: Airflow & Chest
    # Airflow toggles => events (apnea/hypopnea)
    # Chest toggles => normal inhaling/exhaling to the end
    airflow_array = [None]*TOTAL_SAMPLES
    chest_array   = [None]*TOTAL_SAMPLES

    # Start states
    airflow_state = "Exhale"
    chest_state   = "exhaling"

    # Toggling counters
    airflow_toggle_counter = 0
    chest_toggle_counter   = 0

    # Delay counters
    airflow_chest_delay_counter = 0  # used for airflow? We can keep it separate if you want
    chest_delay_counter = 0

    # We'll keep the approach of chest toggling every ~3s with skip prob, ignoring override
    # We'll keep airflow toggling only if i < override => else forced exhale

    consecutive_same_airflow = 0

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

        # ========== Chest Toggling (always toggles to the end) ==========
        chest_toggle_counter += 1
        if chest_toggle_counter >= 12:  # ~3s at 4Hz
            if random.random() > CHEST_SKIP_PROB:
                # Toggle chest
                new_chest = "inhaling" if chest_state == "exhaling" else "exhaling"
                # Possibly add delay
                if random.random() < CHEST_DELAY_PROB:
                    chest_delay_counter = random.randint(1,2)
                    chest_pending = new_chest
                else:
                    chest_state = new_chest
            chest_toggle_counter = 0
        else:
            # chest_delay logic
            if chest_delay_counter > 0:
                chest_delay_counter -= 1
                if chest_delay_counter == 0:
                    chest_state = chest_pending

        # ========== Airflow Toggling & Events ==========
        if i < OVERRIDE_SAMPLE_IDX:
            # Normal toggling => can trigger events
            airflow_toggle_counter += 1
            if airflow_toggle_counter >= 12:  # ~3s
                if random.random() > AIRFLOW_SKIP_PROB:
                    # Toggle airflow
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
            if (pos_now != "Sitting / Upright") and (i >= forcedHypopneaEnd) and (consecutive_same_airflow >= AIRFLOW_EVENT_THRESHOLD):
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
        else:
            # After override => forced exhale, no events
            airflow_state = "Exhale"
            consecutive_same_airflow = 0

        # ========== Store final states in arrays ==========
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
            airflow_array[i],  # toggled or forced exhale
            chest_array[i],    # chest always toggling
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
    generate_session_273_data_mysql()
