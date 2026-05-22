import { useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  downloadStudentReport,
  downloadEnrollmentReport,
  downloadCourseApplicationReport,
  downloadServiceRequestReport,
  downloadSubmissionReport,
  downloadGradeReport,
} from "../../services/adminReportService";
import "./AdminReportsPage.css";

const reports = [
  {
    title: "Student List Report",
    description: "Export student profile details, departments, programmes, and year of study.",
    icon: "🎓",
    action: downloadStudentReport,
  },
  {
    title: "Course Enrollment Report",
    description: "Export approved student enrollments by course, batch, and enrollment status.",
    icon: "✅",
    action: downloadEnrollmentReport,
  },
  {
    title: "Course Applications Report",
    description: "Export course batch applications, review statuses, and review notes.",
    icon: "📝",
    action: downloadCourseApplicationReport,
  },
  {
    title: "Service Request Report",
    description: "Export service request workflow data, priorities, statuses, assignments, and resolutions.",
    icon: "📩",
    action: downloadServiceRequestReport,
  },
  {
    title: "Assignment Submission Report",
    description: "Export submitted assignments with course, batch, student, status, and file details.",
    icon: "📤",
    action: downloadSubmissionReport,
  },
  {
    title: "Grade Report",
    description: "Export grades, marks, feedback, grade status, grading date, and publication date.",
    icon: "🎯",
    action: downloadGradeReport,
  },
];

const AdminReportsPage = () => {
  const [loadingReport, setLoadingReport] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleDownload = async (report) => {
    try {
      setLoadingReport(report.title);
      setError("");
      setMessage("");

      await report.action();

      setMessage(`${report.title} downloaded successfully.`);
    } catch (err) {
      setError("Failed to download report.");
    } finally {
      setLoadingReport("");
    }
  };

  return (
    <DashboardLayout>
      <div className="admin-reports-page">
        <div className="page-header-row">
          <div>
            <h1>Reports & Export</h1>
            <p>Download CSV reports for academic, workflow, submission, and grading data.</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <div className="reports-grid">
          {reports.map((report) => (
            <div className="report-card" key={report.title}>
              <div className="report-icon">{report.icon}</div>

              <div className="report-content">
                <h3>{report.title}</h3>
                <p>{report.description}</p>
              </div>

              <button
                className="download-report-btn"
                onClick={() => handleDownload(report)}
                disabled={loadingReport === report.title}
              >
                {loadingReport === report.title ? "Downloading..." : "Download CSV"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminReportsPage;