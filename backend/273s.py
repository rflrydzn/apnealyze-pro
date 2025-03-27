import random
import mysql.connector
from datetime import datetime, timedelta

def insert_snore_data(
    session_id,
    start_str,
    duration_seconds,
    aggregator_interval=3,
    snore_probability=0.02
):
    """
    Inserts snore data for a given session into snore_readings.
    
    Args:
      session_id (int): The session's ID in the DB
      start_str (str): The session's start datetime, e.g. "2025-03-25 00:47:02"
      duration_seconds (int): total session duration in seconds
      aggregator_interval (int): how many seconds to group before inserting one row
      snore_probability (float): chance of snoring each second, e.g. 0.02 => 2%

    Behavior:
      - We step through each second of the session.
      - For each second, we randomly decide if user is snoring (1) or not (0).
      - We “aggregate” over aggregator_interval seconds. If ANY second in that block has snoring=1, we store snore=1 for that row, else 0.
      - The row’s timestamp is the block’s end time in the session timeline, ensuring snore timestamps align with your real session timeline.
    """
    # 1) Connect to MySQL
    import mysql.connector
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

    # 2) Parse the session start time
    start_dt = datetime.strptime(start_str, "%Y-%m-%d %H:%M:%S")

    # 3) We'll step from second=0..(duration_seconds-1)
    aggregator_count = 0
    aggregator_snore = 0
    inserted_count = 0

    current_time = start_dt

    insert_query = """
        INSERT INTO snore_readings (session_id, timestamp, snore)
        VALUES (%s, %s, %s)
    """

    for sec in range(duration_seconds):
        # Decide if user is snoring this second
        #  (We do it once per second)
        is_snoring = 1 if random.random() < snore_probability else 0

        # If we see snoring at any second in this aggregator block => aggregator_snore=1
        if is_snoring == 1:
            aggregator_snore = 1

        aggregator_count += 1

        # If we've reached aggregator_interval => insert a row
        if aggregator_count >= aggregator_interval:
            ts_str = current_time.strftime("%Y-%m-%d %H:%M:%S")
            # aggregator_snore => 0 or 1
            cursor.execute(insert_query, (session_id, ts_str, aggregator_snore))

            inserted_count += 1
            # Reset aggregator
            aggregator_count = 0
            aggregator_snore = 0

        # Advance time by 1 second
        current_time += timedelta(seconds=1)

    # If there's a leftover block
    if aggregator_count > 0:
        ts_str = current_time.strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute(insert_query, (session_id, ts_str, aggregator_snore))
        inserted_count += 1

    connection.commit()
    cursor.close()
    connection.close()

    print(f"[Session {session_id}] Inserted {inserted_count} snore rows with aggregator={aggregator_interval}s, snore_prob={snore_probability}.")
    print(f"Start: {start_dt}, Duration={duration_seconds}s => ~{duration_seconds/3600:.2f} hours.")


if __name__ == "__main__":
    # === Example usage: session 273, aggregator=3s, snore_prob=4% => more snore


    # === Example usage: session 275, aggregator=4s, snore_prob=2%
    insert_snore_data(
        session_id=275,
        start_str="2025-03-25 23:32:04",
        duration_seconds=23210,    # 6:26:50 => 23210s
        aggregator_interval=4,
        snore_probability=0.001
    )

    # === Example usage: session 279, aggregator=4s, snore_prob=1%
    insert_snore_data(
        session_id=279,
        start_str="2025-03-27 01:21:36",
        duration_seconds=20995,    # 5:49:55 => 20995s
        aggregator_interval=4,
        snore_probability=0.001
    )
