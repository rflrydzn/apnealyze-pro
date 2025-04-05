import "bootstrap/dist/css/bootstrap.min.css";
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

const safeToFixed = (value, decimals = 2, unit = '') =>
  value !== undefined && value !== null ? value.toFixed(decimals) + unit : "N/A";

function downloadCSVFromJSON(data, filename = 'session_data.csv') {
    if (!data || data.length === 0) return;
  
    const headers = Object.keys(data[0]);
    const csvRows = [];
  
    csvRows.push(headers.join(','));
  
    data.forEach(row => {
      const values = headers.map(header => {
        let value = row[header];
        if (typeof value === 'string') {
          value = `"${value.replace(/"/g, '""')}"`; 
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


function SleepReport() {
    const { sessionId } = useParams();
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
    <div className="container w-75">
      <h1>Overview</h1>
      <ul class="list-group list-group-horizontal w-auto justify-content-between">
        <li class="list-group-item border-0 fs-4">AHI: {safeToFixed(report.overview?.AHI, 2, " /h")}</li>
        <li class="list-group-item border-0 fs-4">ODI: {safeToFixed(report.overview?.ODI, 2, " /h")}</li>
        <li class="list-group-item border-0 fs-4">
          Snore Percentage: {safeToFixed(report.overview?.Snore_Percentage, 2, " %")}
        </li>
        <li class="list-group-item border-0 fs-4">Total Session Duration: {safeToFixed(report.overview?.Session_Duration_Hours, 2, " hrs")}</li>
      </ul>

      <table class="table table-borderless">
        <thead class="border-bottom">
          <tr>
            <th scope="col" style={{ fontSize: "22px" }}>
              Repiratory Indices
            </th>
            <th scope="col">Total</th>
            <th scope="col">Supine</th>
            <th scope="col">Non-supine</th>
            <th scope="col">Counts</th>
          </tr>
        </thead>
        <tbody class=" table-borderless">
          <tr>
            <th scope="row" className="fw-normal">
              Apneas + Hypopneas (AHI)
            </th>
            <td>{safeToFixed(report.respiratory_indices?.AHI_Total, 2, " /h")}</td>
            <td>{safeToFixed(report.respiratory_indices?.AHI_Supine, 2, " /h")}</td>
            <td>{safeToFixed(report.respiratory_indices?.AHI_NonSupine, 2, " /h")}</td>
            <td>{report.respiratory_indices?.AHI_Count || "N/A"}</td>
          </tr>
          <tr>
            <th scope="row" className="fw-normal">
              Apneas
            </th>
            <td>{safeToFixed(report.respiratory_indices?.Apneas_Total, 2, " /h")}</td>
            <td>{safeToFixed(report.respiratory_indices?.Apneas_Supine, 2, " /h")}</td>
            <td>{safeToFixed(report.respiratory_indices?.Apneas_NonSupine, 2, " /h")}</td>
            <td>{report.respiratory_indices?.Apneas_Count || "N/A"}</td>
          </tr>
          <tr>
            <th scope="row" className="fw-normal">
              Hypopneas
            </th>
            <td>{safeToFixed(report.respiratory_indices?.Hypopneas_Total, 2, " /h")}</td>
            <td>{safeToFixed(report.respiratory_indices?.Hypopneas_Supine, 2, " /h")}</td>
            <td>{safeToFixed(report.respiratory_indices?.Hypopneas_NonSupine, 2, " /h")}</td>
            <td>{report.respiratory_indices?.Hypopneas_Count || "N/A"}</td>
          </tr>
        </tbody>
        <br></br>
        <thead class="border-bottom">
          <tr>
            <th scope="col"></th>
            <th scope="col">Percentage of Sleep</th>
            <th scope="col">Duration (min)</th>
          </tr>
        </thead>
        <tbody class=" table-borderless">
          <tr>
            <th scope="row" className="fw-normal">
              Snore
            </th>
            <td>{safeToFixed(report.snoring_events?.Percentage, 2, " %")}</td>
            <td>{safeToFixed(report.snoring_events?.Duration, 1, " min")}</td>
          </tr>
        </tbody>
      </table>
      {/* SPO2 */}

      <table class="table table-borderless">
        <thead class="border-bottom">
          <tr>
            <th scope="col" style={{ fontSize: "22px" }}>
              Oxygen Saturation (SpO₂)
            </th>
            <th scope="col">Total</th>
            <th scope="col">Supine</th>
            <th scope="col">Non-supine</th>
          </tr>
        </thead>
        <tbody class=" table-borderless">
          <tr>
            <th scope="row" className="fw-normal">
              ODI
            </th>
            <td>{safeToFixed(report.oxygen_saturation?.ODI_per_hour, 2, " /h")}</td>
            <td>{safeToFixed(report.oxygen_saturation?.ODI_Supine, 2, " /h")}</td>
            <td>{safeToFixed(report.oxygen_saturation?.ODI_NonSupine, 2, " /h")}</td>
          </tr>
          <tr>
            <th scope="row" className="fw-normal">
              Average SpO₂
            </th>
            <td>{safeToFixed(report.oxygen_saturation?.Average_SpO2, 1, " %")}</td>
            <td>{safeToFixed(report.oxygen_saturation?.Average_SpO2_Supine, 1, " %")}</td>
            <td>{safeToFixed(report.oxygen_saturation?.Average_SpO2_NonSupine, 1, " %")}</td>
          </tr>
          <tr>
            <th scope="row" className="fw-normal">
              Minimum SpO₂
            </th>
            <td>{report.oxygen_saturation?.Minimum_SpO2 ? report.oxygen_saturation.Minimum_SpO2 + " %" : "N/A"}</td>
            <td>{report.oxygen_saturation?.Minimum_SpO2_Supine ? report.oxygen_saturation.Minimum_SpO2_Supine + " %" : "N/A"}</td>
            <td>{report.oxygen_saturation?.Minimum_SpO2_NonSupine ? report.oxygen_saturation.Minimum_SpO2_NonSupine + " %" : "N/A"}</td>
          </tr>
        </tbody>
      </table>

      {/* Sleep Position */}

      <table class="table table-borderless">
        <thead class="border-bottom">
          <tr>
            <th scope="col" style={{ fontSize: "22px" }}>
              Sleep Position
            </th>
            <th scope="col">Duration (min)</th>
            <th scope="col">Percentage</th>
          </tr>
        </thead>
        <tbody class=" table-borderless">
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

      {/* Pulse and Heart Rate */}
      <table class="table table-borderless">
        <thead class="border-bottom">
          <tr>
            <th scope="col" style={{ fontSize: "22px" }}>
              Pulse
            </th>
          </tr>
        </thead>
        <tbody class=" table-borderless">
          <tr>
            <th scope="row" className="fw-normal">
              Average Pulse
            </th>
            <td>{safeToFixed(report.pulse?.Average_Heart_Rate, 1, " bpm")}</td>
          </tr>
          <tr>
            <th scope="row" className="fw-normal">
              Maximum Pulse
            </th>
            <td>{report.pulse?.Maximum_Heart_Rate ? report.pulse.Maximum_Heart_Rate + " bpm" : "N/A"}</td>
          </tr>
          <tr>
            <th scope="row" className="fw-normal">
              Minimum Pulse
            </th>
            <td>{report.pulse?.Minimum_Heart_Rate ? report.pulse.Minimum_Heart_Rate + " bpm" : "N/A"}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default SleepReport;
