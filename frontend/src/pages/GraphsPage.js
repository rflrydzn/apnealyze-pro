// src/pages/GraphsPage.js
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { Line, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import 'chartjs-adapter-date-fns';

const timeScaleOptions = {
    responsive: true,
    scales: {
      x: {
        type: 'time',
        time: { unit: 'second' },
        title: { display: true, text: 'Time' },
      },
      y: {
        ticks: {
          stepSize: 1,
          callback: (value) => (value === 1 ? 'Inhale' : 'Exhale'),
        },
        title: { display: true, text: 'State' },
      },
    },
  };

function downsampleData(data, maxPoints = 500) {
  if (data.length <= maxPoints) return data;
  const skip = Math.floor(data.length / maxPoints);
  return data.filter((_, index) => index % skip === 0);
}

ChartJS.register(CategoryScale, LinearScale, TimeScale, PointElement, LineElement, Title, Tooltip, Legend);

const FullReportGraphsPage = () => {
  const { sessionId } = useParams();
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const snoreChartRef = useRef(null);

  useEffect(() => {
    const fetchFullReport = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/session/${sessionId}/full_report`);
        setReport(response.data);
      } catch (error) {
        console.error("Error fetching full session report:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFullReport();
  }, [sessionId]);

  useEffect(() => {
    return () => {
      if (snoreChartRef.current) {
        snoreChartRef.current.destroy();
      }
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) return <p>Loading graphs...</p>;
  if (!report) return <p>Error loading report data.</p>;

  // Data transformations (similar to before)
  const apneaData = report.trend_overview?.apnea_events || [];
  const hypopneaData = report.trend_overview?.hypopnea_events || [];
  const desatData = report.trend_overview?.desaturation_events || [];

  const combinedApneaHypopneaData = {
    datasets: [
      {
        label: 'Apnea Events',
        data: apneaData.map(ts => ({ x: new Date(ts), y: 2 })),
        backgroundColor: 'red',
        pointRadius: 5,
      },
      {
        label: 'Hypopnea Events',
        data: desatData.map(ts => ({ x: new Date(ts), y: 1 })),
        backgroundColor: 'blue',
        pointRadius: 5,
      },
    ],
  };

  const combinedApneaHypopneaOptions = {
    responsive: true,
    scales: {
      x: {
        type: 'time',
        time: { unit: 'minute' },
        title: { display: true, text: 'Time' },
      },
      y: {
        min: 0,
        max: 3,
        ticks: { stepSize: 1, callback: () => '' },
      },
    },
  };

  const desaturationScatterData = {
    datasets: [
      {
        label: 'Desaturation Events',
        data: desatData.map(ts => ({ x: new Date(ts), y: 1 })),
        backgroundColor: 'green',
        pointRadius: 5,
      },
    ],
  };

  const desaturationScatterOptions = {
    responsive: true,
    scales: {
      x: { type: 'time', time: { unit: 'minute' }, title: { display: true, text: 'Time' } },
      y: { display: false },
    },
  };

  const positionData = (report.raw_readings || []).map(r => ({
    x: new Date(r.timestamp),
    y: (() => {
      switch (r.position) {
        case 'Lying on Back (Supine)':
          return 3;
        case 'Lying on Left Side':
          return 2;
        case 'Lying on Right Side':
          return 1;
        case 'Lying on Stomach (Prone)':
          return 0;
        case 'Sitting / Upright':
          return 4;
        default:
          return null;
      }
    })(),
  }));
  const positionChartData = {
    datasets: [
      {
        label: 'Sleeping Position',
        data: positionData,
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 0.1,
        fill: false,
        stepped: 'before',
      },
    ],
  };
  const positionChartOptions = {
    responsive: true,
    scales: {
      y: {
        min: 0,
        max: 4,
        ticks: {
          stepSize: 1,
          autoSkip: false,
          callback: (value) => {
            switch (value) {
              case 4: return 'Up';
              case 3: return 'S';
              case 2: return 'L';
              case 1: return 'R';
              case 0: return 'P';
              default: return '';
            }
          },
        },
      },
      x: { type: 'time', time: { unit: 'minute' }, title: { display: true, text: 'Time' } },
    },
  };

  const oxygenTrendPoints = (report.raw_readings || []).map(r => ({
    x: new Date(r.timestamp),
    y: r.oxygen_level ? parseFloat(r.oxygen_level) : null,
  }));
  const oxygenTrendPointsDownsampled = downsampleData(oxygenTrendPoints, 300);
  const oxygenTrendData = {
    datasets: [
      {
        label: 'Oxygen Saturation (%)',
        data: oxygenTrendPointsDownsampled,
        borderColor: 'rgb(255, 99, 132)',
        borderWidth: 1,
        pointRadius: 1,
        fill: false,
      },
    ],
  };
  const oxygenTrendOptions = {
    responsive: true,
    scales: {
      x: { type: 'time', time: { unit: 'minute' }, title: { display: true, text: 'Time' } },
      y: { suggestedMin: 85, suggestedMax: 100, title: { display: true, text: 'SpO₂ (%)' } },
    },
  };

  const heartRateTrendData = {
    labels: report.trend_overview?.heart_rates?.map((_, i) => i + 1) || [],
    datasets: [
      {
        label: 'Heart Rate (BPM)',
        data: report.trend_overview?.heart_rates || [],
        borderColor: 'rgb(75, 192, 192)',
        fill: false,
      },
    ],
  };

  // Snore data: map snore timestamps to scatter points at y=1
  const snoreData = report.trend_overview?.snore_timestamps?.map(ts => ({
    x: new Date(ts),
    y: 1,
  })) || [];
  const snoreChartData = {
    datasets: [
      {
        label: 'Snore Events',
        data: snoreData,
        backgroundColor: 'red',
        pointRadius: 5,
      },
    ],
  };
  const snoreChartOptions = {
    responsive: true,
    scales: {
      x: { type: 'time', time: { unit: 'minute' }, title: { display: true, text: 'Time' } },
      y: { display: false },
    },
  };

  const airflowData = (report.raw_readings || []).map(r => ({
    x: new Date(r.timestamp),
    y: r.airflow_state === "Inhale" ? 1 : 0,
  }));
  const airflowChartData = {
    datasets: [
      {
        label: 'Airflow Trends',
        data: airflowData,
        borderColor: 'rgb(255, 159, 64)',
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
        pointRadius: 2,
        fill: false,
      },
    ],
  };

  const chestData = (report.raw_readings || []).map(r => ({
    x: new Date(r.timestamp),
    y: r.chest_movement_state === "inhaling" ? 1 : 0,
  }));
  const chestChartData = {
    datasets: [
      {
        label: 'Chest Movement Trends',
        data: chestData,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        pointRadius: 2,
        fill: false,
      },
    ],
  };

  // No scrollbars: force container to hide overflow
  const containerStyle = { overflow: "visible" };

  return (
    <div className="report-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
  <h1>Sleep Study Graphs</h1>
  <div style={{ display: 'flex', gap: '10px' }}>
  <Link to="/sessions">
      <button>Back to Sessions</button>
    </Link>
    <Link to={`/session/${sessionId}/report`}>
      <button>View Report</button>
    </Link>
    <button onClick={handlePrint}>Print Graphs</button>
    
  </div>
</div>
      <div className="chart-grid" style={containerStyle}>
        <div className="chart-row">
          <Line data={positionChartData} options={{ ...positionChartOptions, maintainAspectRatio: false }} />
        </div>
        <div className="chart-row">
          <Scatter data={combinedApneaHypopneaData} options={{ ...combinedApneaHypopneaOptions, maintainAspectRatio: false }} />
        </div>
        <div className="chart-row">
          <Scatter data={desaturationScatterData} options={{ ...desaturationScatterOptions, maintainAspectRatio: false }} />
        </div>
        <div className="chart-row">
          <Line data={oxygenTrendData} options={{ ...oxygenTrendOptions, maintainAspectRatio: false }} />
        </div>
        <div className="chart-row">
          <Line data={heartRateTrendData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
        <div className="chart-row">
          <Scatter ref={snoreChartRef} data={snoreChartData} options={{ ...snoreChartOptions, maintainAspectRatio: false }} />
        </div>
        <div className="chart-row">
          <Line data={airflowChartData} options={{ ...timeScaleOptions, maintainAspectRatio: false }} />
        </div>
        <div className="chart-row">
          <Line data={chestChartData} options={{ ...timeScaleOptions, maintainAspectRatio: false }} />
        </div>
      </div>
      <div style={{ marginTop: '20px' }}>
        <Link to="/sessions">Back to Sessions</Link>
      </div>
    </div>
  );
};

export default FullReportGraphsPage;