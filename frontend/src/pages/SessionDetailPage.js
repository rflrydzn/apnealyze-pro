// frontend/pages/SessionDetailPage.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const SessionDetailPage = () => {
  const { sessionId } = useParams();
  const [readings, setReadings] = useState([]);

  useEffect(() => {
    const fetchSessionData = async () => {
      const response = await axios.get(`http://localhost:5001/session/${sessionId}`);
      setReadings(response.data.readings);
    };
    fetchSessionData();
  }, [sessionId]);

  // Prepare data for chart (for example, plotting heart rate over time)
  const chartData = {
    labels: readings.map((r, i) => i + 1),
    datasets: [
      {
        label: 'Heart Rate',
        data: readings.map((r) => r.heartrate),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  return (
    <div>
      <h1>Session {sessionId} Details</h1>
      {readings.length === 0 ? (
        <p>No readings found.</p>
      ) : (
        <div>
          <Line data={chartData} />
          {/* You can add more charts for oxygen, confidence, etc. */}
        </div>
      )}
    </div>
  );
};

export default SessionDetailPage;
