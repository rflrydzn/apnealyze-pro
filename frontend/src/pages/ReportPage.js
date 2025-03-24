// src/pages/ReportPage.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

const safeToFixed = (value, decimals = 2, unit = '') =>
  value !== undefined && value !== null ? value.toFixed(decimals) + unit : "N/A";

function downloadCSVFromJSON(data, filename = 'session_data.csv') {
    if (!data || data.length === 0) return;
  
    const headers = Object.keys(data[0]);
    const csvRows = [];
  
    // Add header row
    csvRows.push(headers.join(','));
  
    // Add data rows
    data.forEach(row => {
      const values = headers.map(header => {
        let value = row[header];
        if (typeof value === 'string') {
          value = `"${value.replace(/"/g, '""')}"`; // Escape quotes
        }
        return value;
      });
      csvRows.push(values.join(','));
    });
  
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

const ReportPage = () => {
  const { sessionId } = useParams();
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch report data from the backend
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

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) return <p>Loading full session report...</p>;
  if (!report) return <p>Error loading session report.</p>;

  return (
    <div className="report-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Sleep Study Report</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
        <Link to="/sessions">
            <button>Back to Sessions</button>
          </Link>
          <Link to={`/session/${sessionId}/graphs`}>
            <button>View Graphs</button>
          </Link>
          <button onClick={handlePrint}>Print Report</button>
          <button onClick={() => downloadCSVFromJSON(report.raw_readings, `session_${sessionId}_data.csv`)}>
  Download CSV
</button>
        </div>
      </div>
      
      {/* Overview */}
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
          </tr>
          <tr>
            <td><strong>Total Session Duration (hours):</strong></td>
            <td>{safeToFixed(report.overview?.Session_Duration_Hours, 2, " hrs")}</td>
          </tr>
        </tbody>
      </table>
      
      <hr />
      
      {/* Respiratory Indices */}
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
      
      {/* Snoring & Breathing Events */}
      <h2>3. Snoring & Breathing Events</h2>
      <table>
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Percentage of Sleep</th>
            <th>Duration (min)</th>
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
      
      {/* Oxygen Saturation */}
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
            <td><strong>ODI</strong></td>
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
        </tbody>
      </table>
      
      <hr />
      
      {/* Sleep Position & Time Analysis */}
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
          {report.position_analysis && Object.entries(report.position_analysis.position_durations_minutes || {}).map(([pos, dur]) => (
            <tr key={pos}>
              <td>{pos}</td>
              <td>{safeToFixed(dur, 1)}</td>
              <td>
                {report.position_analysis.position_percentages && report.position_analysis.position_percentages[pos] !== null
                  ? safeToFixed(report.position_analysis.position_percentages[pos], 1, " %")
                  : "N/A"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <hr />
      
      {/* Pulse & Heart Rate */}
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
        </tbody>
      </table>
      
      <hr />
      
      
    </div>
  );
};

export default ReportPage;