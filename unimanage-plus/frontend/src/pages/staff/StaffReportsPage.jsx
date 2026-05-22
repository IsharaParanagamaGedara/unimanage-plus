import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  getAssignedStaffBatches,
  getStaffReportPreview,
  downloadStaffReport,
} from "../../services/staffReportService";
import "./StaffReportsPage.css";

const reportOptions = [
  {
    value: "applications",
    label: "Course Applications Report",
    description: "Applications related to course batches coordinated by you.",
  },
  {
    value: "enrollments",
    label: "Course Enrollments Report",
    description: "Approved enrollments for your assigned course batches.",
  },
  {
    value: "submissions",
    label: "Assignment Submissions Report",
    description: "Student submissions for assignments in your coordinated batches.",
  },
  {
    value: "grades",
    label: "Grade Report",
    description: "Grades related to your coordinated course batches.",
  },
  {
    value: "service-requests",
    label: "Service Request Report",
    description: "Service requests assigned to you for review or completion.",
  },
];

const initialFilters = {
  start_date: "",
  end_date: "",
  month: "",
  year: "",
  batch_id: "",
};

const StaffReportsPage = () => {
  const [selectedReport, setSelectedReport] = useState("applications");
  const [filters, setFilters] = useState(initialFilters);
  const [batches, setBatches] = useState([]);
  const [reportData, setReportData] = useState(null);

  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingDownload, setLoadingDownload] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const currentReport = reportOptions.find(
    (report) => report.value === selectedReport
  );

  const loadBatches = async () => {
    try {
      const data = await getAssignedStaffBatches();
      setBatches(data.filter((batch) => batch.is_active));
    } catch (err) {
      setError("Failed to load assigned course batch filters.");
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const handleReportChange = (e) => {
    setSelectedReport(e.target.value);
    setReportData(null);
    setMessage("");
    setError("");
  };

  const handleFilterChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const clearFilters = () => {
    setFilters(initialFilters);
  };

  const handleViewReport = async () => {
    try {
      setLoadingPreview(true);
      setError("");
      setMessage("");

      const data = await getStaffReportPreview(selectedReport, filters);
      setReportData(data);

      setMessage("Report preview loaded successfully.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load report preview.");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDownload = async () => {
    try {
      setLoadingDownload(true);
      setError("");
      setMessage("");

      await downloadStaffReport(selectedReport, filters);

      setMessage("CSV report downloaded successfully.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to download report.");
    } finally {
      setLoadingDownload(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="staff-reports-page">
        <div className="page-header-row">
          <div>
            <h1>Staff Reports</h1>
            <p>
              Preview and export reports for your coordinated batches and assigned workflows.
            </p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <div className="report-control-card">
          <div className="report-selector-row">
            <div className="form-group">
              <label>Select Report</label>
              <select value={selectedReport} onChange={handleReportChange}>
                {reportOptions.map((report) => (
                  <option key={report.value} value={report.value}>
                    {report.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="selected-report-info">
              <h3>{currentReport?.label}</h3>
              <p>{currentReport?.description}</p>
            </div>
          </div>

          <div className="filter-title-row">
            <h3>Filters</h3>
            <button type="button" className="secondary-btn" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>

          <div className="report-filter-grid">
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                name="start_date"
                value={filters.start_date}
                onChange={handleFilterChange}
              />
            </div>

            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                name="end_date"
                value={filters.end_date}
                onChange={handleFilterChange}
              />
            </div>

            <div className="form-group">
              <label>Month</label>
              <select
                name="month"
                value={filters.month}
                onChange={handleFilterChange}
              >
                <option value="">All Months</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>

            <div className="form-group">
              <label>Year</label>
              <input
                type="number"
                name="year"
                placeholder="2026"
                value={filters.year}
                onChange={handleFilterChange}
              />
            </div>

            <div className="form-group">
              <label>Course Batch</label>
              <select
                name="batch_id"
                value={filters.batch_id}
                onChange={handleFilterChange}
              >
                <option value="">All Assigned Batches</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.course?.course_code
                      ? `${batch.course.course_code} - ${batch.batch_code} - ${batch.batch_name}`
                      : `${batch.batch_code} - ${batch.batch_name}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="report-actions">
            <button
              type="button"
              className="primary-btn"
              onClick={handleViewReport}
              disabled={loadingPreview}
            >
              {loadingPreview ? "Loading..." : "View Report"}
            </button>

            <button
              type="button"
              className="download-report-btn"
              onClick={handleDownload}
              disabled={loadingDownload}
            >
              {loadingDownload ? "Downloading..." : "Download CSV"}
            </button>
          </div>
        </div>

        <div className="report-preview-card">
          <div className="preview-header">
            <div>
              <h3>Report Preview</h3>
              <p>
                {reportData
                  ? `${reportData.total_records} record(s) found.`
                  : "Select filters and click View Report to preview data."}
              </p>
            </div>
          </div>

          {!reportData ? (
            <p className="table-message">No report loaded yet.</p>
          ) : reportData.rows.length === 0 ? (
            <p className="table-message">No records found for the selected filters.</p>
          ) : (
            <div className="table-responsive">
              <table className="report-table">
                <thead>
                  <tr>
                    {reportData.headers.map((header) => (
                      <th key={header}>{header}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {reportData.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td key={`${rowIndex}-${cellIndex}`}>
                          {cell === null || cell === undefined || cell === ""
                            ? "-"
                            : String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StaffReportsPage;