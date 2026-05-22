import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  getReportPreview,
  downloadFilteredReport,
} from "../../services/adminReportService";
import { getDepartments } from "../../services/adminDepartmentService";
import { getCourses } from "../../services/adminCourseService";
import { getCourseBatches } from "../../services/adminCourseBatchService";
import "./AdminReportsPage.css";

const reportOptions = [
  {
    value: "students",
    label: "Student List Report",
    description: "Student profile details, departments, programmes, and year of study.",
  },
  {
    value: "enrollments",
    label: "Course Enrollment Report",
    description: "Approved student enrollments by course, batch, and enrollment status.",
  },
  {
    value: "course-applications",
    label: "Course Applications Report",
    description: "Course batch applications, review statuses, and review notes.",
  },
  {
    value: "service-requests",
    label: "Service Request Report",
    description: "Service request workflow data, priorities, statuses, assignments, and resolutions.",
  },
  {
    value: "submissions",
    label: "Assignment Submission Report",
    description: "Submitted assignments with course, batch, student, status, and file details.",
  },
  {
    value: "grades",
    label: "Grade Report",
    description: "Grades, marks, feedback, grade status, grading date, and publication date.",
  },
];

const initialFilters = {
  start_date: "",
  end_date: "",
  month: "",
  year: "",
  department_id: "",
  course_id: "",
  batch_id: "",
};

const AdminReportsPage = () => {
  const [selectedReport, setSelectedReport] = useState("students");
  const [filters, setFilters] = useState(initialFilters);
  const [reportData, setReportData] = useState(null);

  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);

  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingDownload, setLoadingDownload] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const currentReport = reportOptions.find(
    (report) => report.value === selectedReport
  );

  const loadFilterData = async () => {
    try {
      const [departmentData, courseData, batchData] = await Promise.all([
        getDepartments(),
        getCourses(),
        getCourseBatches(),
      ]);

      setDepartments(departmentData.filter((item) => item.is_active));
      setCourses(courseData.filter((item) => item.is_active));
      setBatches(batchData.filter((item) => item.is_active));
    } catch (err) {
      setError("Failed to load department, course, or batch filters.");
    }
  };

  useEffect(() => {
    loadFilterData();
  }, []);

  const filteredCourses = filters.department_id
    ? courses.filter(
        (course) => Number(course.department_id) === Number(filters.department_id)
      )
    : courses;

  const filteredBatches = filters.course_id
    ? batches.filter((batch) => Number(batch.course_id) === Number(filters.course_id))
    : batches;

  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    setFilters((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };

      if (name === "department_id") {
        updated.course_id = "";
        updated.batch_id = "";
      }

      if (name === "course_id") {
        updated.batch_id = "";
      }

      return updated;
    });
  };

  const clearFilters = () => {
    setFilters(initialFilters);
  };

  const handleViewReport = async () => {
    try {
      setLoadingPreview(true);
      setError("");
      setMessage("");

      const data = await getReportPreview(selectedReport, filters);
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

      await downloadFilteredReport(selectedReport, filters);

      setMessage("Filtered CSV report downloaded successfully.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to download report.");
    } finally {
      setLoadingDownload(false);
    }
  };

  const handleReportChange = (e) => {
    setSelectedReport(e.target.value);
    setReportData(null);
    setMessage("");
    setError("");
  };

  return (
    <DashboardLayout>
      <div className="admin-reports-page">
        <div className="page-header-row">
          <div>
            <h1>Reports & Export</h1>
            <p>
              Preview report data, apply date and academic filters, and download filtered CSV files.
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
              <label>Department</label>
              <select
                name="department_id"
                value={filters.department_id}
                onChange={handleFilterChange}
              >
                <option value="">All Departments</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Course</label>
              <select
                name="course_id"
                value={filters.course_id}
                onChange={handleFilterChange}
              >
                <option value="">All Courses</option>
                {filteredCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.course_code} - {course.course_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Course Batch</label>
              <select
                name="batch_id"
                value={filters.batch_id}
                onChange={handleFilterChange}
              >
                <option value="">All Batches</option>
                {filteredBatches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.batch_code} - {batch.batch_name}
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

export default AdminReportsPage;