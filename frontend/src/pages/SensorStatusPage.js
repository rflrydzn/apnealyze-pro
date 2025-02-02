import React, { useEffect, useState } from 'react';

const SensorStatusPage = () => {
  const [sensorStatus, setSensorStatus] = useState("Sensor is off.");

  useEffect(() => {
    // Set up an interval to check for data sending status
    const interval = setInterval(() => {
      fetch('http://localhost:5001/sensor-status')  // Correct URL
        .then(response => response.json())
        .then(data => {
          if (data.status === 'on') {
            setSensorStatus("Sensor is turned ON and sending data to the DB.");
          } else {
            setSensorStatus("Sensor is off.");
          }
        })
        .catch(error => {
          console.error("Error fetching sensor status:", error);
          setSensorStatus("Error fetching sensor status.");
        });
    }, 2000);  // Every 2 seconds

    return () => clearInterval(interval);  // Cleanup the interval on unmount
  }, []);

  return (
    <div>
      <h1>Sensor Status</h1>
      <p>{sensorStatus}</p>
    </div>
  );
};

export default SensorStatusPage;
