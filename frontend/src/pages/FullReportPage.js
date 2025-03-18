// src/pages/FullReportPage.js
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
import 'chartjs-adapter-date-fns'; // For time-based scales

/**
 * Downsample an array of data points to a maximum number of points.
 * @param {Array} data - The array of data points (e.g., [{x, y}, {x, y}, ...]).
 * @param {number} maxPoints - The maximum number of points to keep.
 * @returns {Array} A new array with at most maxPoints data points.
 */
function downsampleData(data, maxPoints = 500) {
  if (data.length <= maxPoints) return data;
  const skip = Math.floor(data.length / maxPoints);
  return data.filter((_, index) => index % skip === 0);
}

// Register all chart components
ChartJS.register(CategoryScale, LinearScale, TimeScale, PointElement, LineElement, Title, Tooltip, Legend);

// Helper for safe .toFixed()
const safeToFixed = (value, decimals = 2, unit = '') =>
  value !== undefined && value !== null ? value.toFixed(decimals) + unit : "N/A";

// Helper to map position strings to numeric
function mapPositionToNumber(pos) {
  if (!pos) return null;
  switch (pos) {
    case 'Lying on Back (Supine)': return 3;
    case 'Lying on Left Side':     return 2;
    case 'Lying on Right Side':    return 1;
    case 'Lying on Stomach (Prone)': return 0;
    case 'Sitting / Upright':      return 4;
    default:
      console.warn("Unknown position:", pos);
      return null;
  }
}

const FullReportPage = () => {
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

  // Cleanup (optional if you're referencing the chart ref)
  useEffect(() => {
    return () => {
      if (snoreChartRef.current) {
        snoreChartRef.current.destroy();
      }
    };
  }, []);

  if (isLoading) return <p>Loading full session report...</p>;
  if (!report) return <p>Error loading session report.</p>;

  //----------------------------------------------------------------------
  // Example data transforms for Apnea/Hypopnea combined and Desaturation
  //----------------------------------------------------------------------
  const apneaData = report.trend_overview?.apnea_events || [];
  const hypopneaData = report.trend_overview?.hypopnea_events || [];
  const desatData = report.trend_overview?.desaturation_events || [];

  // We'll place Apnea at y=2, Hypopnea at y=1 (so they don't overlap)
  const combinedApneaHypopneaData = {
    datasets: [
      {
        label: 'Apnea Events',
        data: apneaData.map(ts => ({
          x: new Date(ts),
          y: 2
        })),
        backgroundColor: 'red',
        pointRadius: 5,
      },
      {
        label: 'Hypopnea Events',
        data: desatData.map(ts => ({
          x: new Date(ts),
          y: 1
        })),
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
        time: { unit: 'minute' }, // or 'second' if your data is very frequent
        title: { display: true, text: 'Time' },
      },
      y: {
        min: 0,
        max: 3,  // Apnea=2, Hypopnea=1
        ticks: {
          stepSize: 1,
          callback: (value) => {
            if (value === 2) return '';
            if (value === 1) return '';
            return '';
          },
        },
      },
    },
  };

  // Desaturation chart: we can place them all at y=1
  const desaturationScatterData = {
    datasets: [
      {
        label: 'Desaturation Events',
        data: desatData.map(ts => ({
          x: new Date(ts),
          y: 1
        })),
        backgroundColor: 'green',
        pointRadius: 5,
      },
    ],
  };

  const desaturationScatterOptions = {
    responsive: true,
    scales: {
      x: {
        type: 'time',
        time: { unit: 'minute' },
        title: { display: true, text: 'Time' },
      },
      y: {
        display: false,
      },
    },
  };

  //----------------------------------------------------------------------
  // Example data for other charts: Positions, O2, HR, Snore, etc.
  //----------------------------------------------------------------------
  const positionNumbers = report.trend_overview?.positions?.map(mapPositionToNumber) || [];
  const positionData = (report.raw_readings || []).map(r => ({
    x: new Date(r.timestamp),
    y: mapPositionToNumber(r.position),
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
      x: {
        type: 'time',
        time: { unit: 'minute' },
        title: { display: true, text: 'Time' },
      },
    },
  };

  // Oxygen trend
  const oxygenTrendPoints = (report.raw_readings || []).map(r => ({
    x: new Date(r.timestamp),
    y: r.oxygen_level ? parseFloat(r.oxygen_level) : null,
  }));
  
  // 2) Downsample to at most 300 points, for example
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
      x: {
        type: 'time',
        time: { unit: 'minute' },
        title: { display: true, text: 'Time' },
      },
      y: {
        suggestedMin: 85,
        suggestedMax: 100,
        title: { display: true, text: 'SpO₂ (%)' },
      },
    },
  };

  // Heart rate trend
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

  // Snore data
  const snoreData = report.trend_overview?.snore_timestamps?.map(ts => ({ x: ts, y: 1 })) || [];
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
      x: {
        type: 'time',
        time: { unit: 'minute' },
        title: { display: true, text: 'Time' },
      },
      y: { display: false },
    },
  };

  // Airflow & Chest Movement data from raw readings
  const airflowData = report.raw_readings?.map(r => ({
    x: new Date(r.timestamp),
    y: r.airflow_state === "Inhale" ? 1 : 0
  })) || [];
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

  const chestData = report.raw_readings?.map(r => ({
    x: new Date(r.timestamp),
    y: r.chest_movement_state === "inhaling" ? 1 : 0
  })) || [];
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

  return (
    <div className="report-container">
      <h1>Sleep Study Report</h1>

      {/* 1. Overview */}
      <h2>1. Overview</h2>
      <table>
        <tbody>
          <tr>
            <td><strong>Apnea-Hypopnea Index (AHI):</strong></td>
            <td>{safeToFixed(report.overview?.AHI, 2, " /h")}</td>
          </tr>
          <tr>
            <td><strong>Oxygen Desaturation Index (ODI):</strong></td>
            <td>{safeToFixed(report.overview?.ODI, 2, " /h")}</td>
          </tr>
          <tr>
            <td><strong>Snore Percentage:</strong></td>
            <td>{safeToFixed(report.overview?.Snore_Percentage, 2, " %")}</td>
            <td>{safeToFixed(report.overview?.Snore_Duration, 1, " min")}</td>
          </tr>
          <tr>
            <td><strong>Total Session Duration (hours):</strong></td>
            <td>{safeToFixed(report.overview?.Session_Duration_Hours, 2, " hrs")}</td>
          </tr>
        </tbody>
      </table>

      <hr />

      {/* 2. Respiratory Indices */}
      <h2>2. Respiratory Indices</h2>
      <table>
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Total</th>
            <th>Supine</th>
            <th>Non-Supine</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Apneas + Hypopneas (AHI)</strong></td>
            <td>{safeToFixed(report.respiratory_indices?.AHI_Total, 2, " /h")}</td>
            <td>{safeToFixed(report.respiratory_indices?.AHI_Supine, 2, " /h")}</td>
            <td>{safeToFixed(report.respiratory_indices?.AHI_NonSupine, 2, " /h")}</td>
            <td>{report.respiratory_indices?.AHI_Count || "N/A"}</td>
          </tr>
          <tr>
            <td><strong>Apneas</strong></td>
            <td>{safeToFixed(report.respiratory_indices?.Apneas_Total, 2, " /h")}</td>
            <td>{safeToFixed(report.respiratory_indices?.Apneas_Supine, 2, " /h")}</td>
            <td>{safeToFixed(report.respiratory_indices?.Apneas_NonSupine, 2, " /h")}</td>
            <td>{report.respiratory_indices?.Apneas_Count || "N/A"}</td>
          </tr>
          <tr>
            <td><strong>Hypopneas</strong></td>
            <td>{safeToFixed(report.respiratory_indices?.Hypopneas_Total, 2, " /h")}</td>
            <td>{safeToFixed(report.respiratory_indices?.Hypopneas_Supine, 2, " /h")}</td>
            <td>{safeToFixed(report.respiratory_indices?.Hypopneas_NonSupine, 2, " /h")}</td>
            <td>{report.respiratory_indices?.Hypopneas_Count || "N/A"}</td>
          </tr>
        </tbody>
      </table>

      <hr />

      {/* 3. Snoring & Breathing Events */}
      <h2>3. Snoring & Breathing Events</h2>
      <table>
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Percentage of Sleep</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Snoring</strong></td>
            <td>{safeToFixed(report.snoring_events?.Percentage, 2, " %")}</td>
            <td>{safeToFixed(report.snoring_events?.Duration, 1, " min")}</td>
          </tr>
        </tbody>
      </table>

      <hr />

      {/* 4. Oxygen Saturation (SpO2) */}
      <h2>4. Oxygen Saturation (SpO₂)</h2>
      <table>
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Total</th>
            <th>Supine</th>
            <th>Non-Supine</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Oxygen Desaturation Index (ODI)</strong></td>
            <td>{safeToFixed(report.oxygen_saturation?.ODI_per_hour, 2, " /h")}</td>
            <td>{safeToFixed(report.oxygen_saturation?.ODI_Supine, 2, " /h")}</td>
            <td>{safeToFixed(report.oxygen_saturation?.ODI_NonSupine, 2, " /h")}</td>
          </tr>
          <tr>
            <td><strong>Average SpO₂</strong></td>
            <td>{safeToFixed(report.oxygen_saturation?.Average_SpO2, 1, " %")}</td>
            <td>{safeToFixed(report.oxygen_saturation?.Average_SpO2_Supine, 1, " %")}</td>
            <td>{safeToFixed(report.oxygen_saturation?.Average_SpO2_NonSupine, 1, " %")}</td>
          </tr>
          <tr>
            <td><strong>Minimum SpO₂</strong></td>
            <td>{report.oxygen_saturation?.Minimum_SpO2 ? report.oxygen_saturation.Minimum_SpO2 + " %" : "N/A"}</td>
            <td>{report.oxygen_saturation?.Minimum_SpO2_Supine ? report.oxygen_saturation.Minimum_SpO2_Supine + " %" : "N/A"}</td>
            <td>{report.oxygen_saturation?.Minimum_SpO2_NonSupine ? report.oxygen_saturation.Minimum_SpO2_NonSupine + " %" : "N/A"}</td>
          </tr>
          <tr>
            <td><strong>SpO₂ Duration &lt; 90%</strong></td>
            <td>
              {report.oxygen_saturation?.SpO2_Duration_below_90_minutes
                ? report.oxygen_saturation.SpO2_Duration_below_90_minutes + " min"
                : "N/A"}
            </td>
            <td>
              {report.oxygen_saturation?.SpO2_Duration_below_90_minutes_supine
                ? report.oxygen_saturation.SpO2_Duration_below_90_minutes_supine + " min"
                : "N/A"}
            </td>
            <td>
              {report.oxygen_saturation?.SpO2_Duration_below_90_minutes_non_supine
                ? report.oxygen_saturation.SpO2_Duration_below_90_minutes_non_supine + " min"
                : "N/A"}
            </td>
          </tr>
          <tr>
            <td><strong>SpO₂ Duration &lt; 88%</strong></td>
            <td>
              {report.oxygen_saturation?.SpO2_Duration_below_88_minutes
                ? report.oxygen_saturation.SpO2_Duration_below_88_minutes + " min"
                : "N/A"}
            </td>
            <td>
              {report.oxygen_saturation?.SpO2_Duration_below_88_minutes_supine
                ? report.oxygen_saturation.SpO2_Duration_below_88_minutes_supine + " min"
                : "N/A"}
            </td>
            <td>
              {report.oxygen_saturation?.SpO2_Duration_below_88_minutes_non_supine
                ? report.oxygen_saturation.SpO2_Duration_below_88_minutes_non_supine + " min"
                : "N/A"}
            </td>
          </tr>
          <tr>
            <td><strong>SpO₂ Duration &lt; 85%</strong></td>
            <td>
              {report.oxygen_saturation?.SpO2_Duration_below_85_minutes
                ? report.oxygen_saturation.SpO2_Duration_below_85_minutes + " min"
                : "N/A"}
            </td>
            <td>
              {report.oxygen_saturation?.SpO2_Duration_below_85_minutes_supine
                ? report.oxygen_saturation.SpO2_Duration_below_85_minutes_supine + " min"
                : "N/A"}
            </td>
            <td>
              {report.oxygen_saturation?.SpO2_Duration_below_85_minutes_non_supine
                ? report.oxygen_saturation.SpO2_Duration_below_85_minutes_non_supine + " min"
                : "N/A"}
            </td>
          </tr>
          <tr>
            <td><strong>Average Desaturation Drop</strong></td>
            <td>{safeToFixed(report.oxygen_saturation?.Average_Desaturation_Drop, 1, " %")}</td>
            <td>{safeToFixed(report.oxygen_saturation?.Average_Desaturation_Drop_Supine, 1, " %")}</td>
            <td>{safeToFixed(report.oxygen_saturation?.Average_Desaturation_Drop_NonSupine, 1, " %")}</td>
          </tr>
        </tbody>
      </table>

      <hr />

      {/* 5. Sleep Position & Time Analysis */}
      <h2>5. Sleep Position &amp; Time Analysis</h2>
      <table>
        <thead>
          <tr>
            <th>Position</th>
            <th>Duration (min)</th>
            <th>Percentage</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(report.position_analysis?.position_durations_minutes || {}).map(([pos, dur]) => (
            <tr key={pos}>
              <td>{pos}</td>
              <td>{safeToFixed(dur, 1)}</td>
              <td>
                {report.position_analysis?.position_percentages &&
                 report.position_analysis.position_percentages[pos] !== null
                  ? safeToFixed(report.position_analysis.position_percentages[pos], 1, " %")
                  : "N/A"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr />

      {/* 6. Pulse & Heart Rate */}
      <h2>6. Pulse &amp; Heart Rate</h2>
      <table>
        <tbody>
          <tr>
            <td><strong>Average Pulse</strong></td>
            <td>{safeToFixed(report.pulse?.Average_Heart_Rate, 1, " bpm")}</td>
          </tr>
          <tr>
            <td><strong>Maximum Pulse</strong></td>
            <td>{report.pulse?.Maximum_Heart_Rate ? report.pulse.Maximum_Heart_Rate + " bpm" : "N/A"}</td>
          </tr>
          <tr>
            <td><strong>Minimum Pulse</strong></td>
            <td>{report.pulse?.Minimum_Heart_Rate ? report.pulse.Minimum_Heart_Rate + " bpm" : "N/A"}</td>
          </tr>
          <tr>
            <td><strong>Duration &lt; 40 bpm</strong></td>
            <td>{safeToFixed(report.pulse?.Duration_below_40_minutes, 1, " min")}</td>
          </tr>
          <tr>
            <td><strong>Duration &gt; 100 bpm</strong></td>
            <td>{safeToFixed(report.pulse?.Duration_above_100_minutes, 1, " min")}</td>
          </tr>
        </tbody>
      </table>

      <hr />

      {/* 7. Signal Quality */}
      {/* <h2>7. Signal Quality</h2>
      <table>
        <tbody>
          <tr>
            <td><strong>Oximeter</strong></td>
            <td>{safeToFixed(report.signal_quality?.Average_Oximeter_Quality, 1, " %")}</td>
          </tr>
          <tr>
            <td><strong>RIP Belts</strong></td>
            <td>{safeToFixed(report.signal_quality?.Average_RIP_Quality, 0, " %")}</td>
          </tr>
        </tbody>
      </table>

      <hr /> */}

      {/* 8. Trend Overview (Graphical Data) */}
<h2>8. Trend Overview (Graphical Data)</h2>

<div className="chart-grid">
  {/* 1) Position Graph */}
  <div className="chart-row">
    <Line data={positionChartData} options={{ 
      ...positionChartOptions, 
      maintainAspectRatio: false 
    }} />
  </div>

  {/* 2) Apnea & Hypopnea */}
  <div className="chart-row">
    <Scatter data={combinedApneaHypopneaData} options={{
      ...combinedApneaHypopneaOptions,
      maintainAspectRatio: false
    }} />
  </div>

  {/* 3) Desaturation */}
  <div className="chart-row">
    <Scatter data={desaturationScatterData} options={{
      ...desaturationScatterOptions,
      maintainAspectRatio: false
    }} />
  </div>

  {/* 4) SpO₂ */}
  <div className="chart-row">
    <Line data={oxygenTrendData} options={{
      ...oxygenTrendOptions,
      maintainAspectRatio: false
    }} />
  </div>

  {/* 5) Pulse */}
  <div className="chart-row">
    <Line data={heartRateTrendData} options={{
      responsive: true,
      maintainAspectRatio: false,
      // If you want time-based for HR too:
      // scales: { x: { type: 'time', time: { unit: 'minute' } } }
    }} />
  </div>

  {/* 6) Snore */}
  <div className="chart-row">
    <Scatter ref={snoreChartRef} data={snoreChartData} options={{
      ...snoreChartOptions,
      maintainAspectRatio: false
    }} />
  </div>

  {/* 7) Airflow */}
  <div className="chart-row">
    <Line data={airflowChartData} options={{
      ...timeScaleOptions,
      maintainAspectRatio: false
    }} />
  </div>

  {/* 8) Chest Movement */}
  <div className="chart-row">
    <Line data={chestChartData} options={{
      ...timeScaleOptions,
      maintainAspectRatio: false
    }} />
  </div>
</div>

      <hr />
      <div style={{ marginTop: '20px' }}>
        <Link to="/sessions">Back to Sessions</Link>
      </div>
    </div>
  );
};

export default FullReportPage;