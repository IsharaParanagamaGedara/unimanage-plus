import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  getMySubmissions,
  downloadMySubmissionFile,
} from "../../services/studentAssignmentService";
import "./MySubmissionsPage.css";

const MySubmissionsPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMySubmissions();
      setSubmissions(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load submissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const handleDownload = async (submission) => {
    try {
      setError("");
      await downloadMySubmissionFile(submission.id, submission.file_name);
    } catch (err) {
      setError("Failed to download submitted file.");
    }
  };

  const filteredSubmissions = submissions.filter((submission) => {
    const keyword = search.toLowerCase();

    return (
      submission.assignment?.title?.toLowerCase().includes(keyword) ||
      submission.assignment?.course_batch?.course?.course_code?.toLowerCase().includes(keyword) ||
      submission.assignment?.course_batch?.course?.course_name?.toLowerCase().includes(keyword) ||
      submission.assignment?.course_batch?.batch_code?.toLowerCase().includes(keyword)
    );
  });

  const getStatusClass = (status) => {
    if (status === "Grade Published") return "status published";
    if (status === "Grade Pending Approval") return "status pending";
    if (status === "Graded Draft") return "status draft";
    return "status submitted";
  };

  return (
    <DashboardLayout>
      <div className="my-submissions-page">
        <div className="page-header-row">
          <div>
            <h1>My Submissions</h1>
            <p>Track submitted assignments, download submitted files, and view published grade outcomes.</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="submission-summary-grid">
          <div className="summary-card">
            <span>Total Submissions</span>
            <strong>{submissions.length}</strong>
          </div>

          <div className="summary-card">
            <span>Submitted</span>
            <strong>{submissions.filter((s) => s.status === "Submitted").length}</strong>
          </div>

          <div className="summary-card">
            <span>Pending Approval</span>
            <strong>
              {submissions.filter((s) => s.status === "Grade Pending Approval").length}
            </strong>
          </div>

          <div className="summary-card">
            <span>Published Grades</span>
            <strong>{submissions.filter((s) => s.grade).length}</strong>
          </div>
        </div>

        <div className="filter-card">
          <input
            type="text"
            placeholder="Search by assignment, course, or batch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="table-message">Loading submissions...</p>
        ) : filteredSubmissions.length === 0 ? (
          <div className="empty-card">
            <h3>No submissions found</h3>
            <p>Your submitted assignments will appear here.</p>
          </div>
        ) : (
          <div className="submission-card-grid">
            {filteredSubmissions.map((submission) => (
              <div className="submission-card" key={submission.id}>
                <div className="submission-card-header">
                  <div className="course-badge">
                    {submission.assignment?.course_batch?.course?.course_code}
                  </div>

                  <span className={getStatusClass(submission.status)}>
                    {submission.status}
                  </span>
                </div>

                <h3>{submission.assignment?.title}</h3>

                <p className="course-name">
                  {submission.assignment?.course_batch?.course?.course_name}
                </p>

                <div className="submission-info-grid">
                  <div>
                    <span>Batch</span>
                    <strong>{submission.assignment?.course_batch?.batch_name}</strong>
                  </div>

                  <div>
                    <span>Batch Code</span>
                    <strong>{submission.assignment?.course_batch?.batch_code}</strong>
                  </div>

                  <div>
                    <span>Submitted At</span>
                    <strong>
                      {submission.submitted_at
                        ? new Date(submission.submitted_at).toLocaleString()
                        : "-"}
                    </strong>
                  </div>

                  <div>
                    <span>Max Marks</span>
                    <strong>{submission.assignment?.max_marks}</strong>
                  </div>
                </div>

                {submission.submission_text && (
                  <div className="text-box">
                    <span>Submission Text</span>
                    <p>{submission.submission_text}</p>
                  </div>
                )}

                {submission.file_name && (
                  <div className="file-box">
                    <span>Submitted File</span>
                    <button
                      type="button"
                      className="file-download-btn"
                      onClick={() => handleDownload(submission)}
                    >
                      Download: {submission.file_name}
                    </button>
                    <small>{submission.file_size_mb} MB</small>
                  </div>
                )}

                {submission.grade ? (
                  <div className="grade-box">
                    <span>Published Grade</span>
                    <strong>
                      {submission.grade.marks} / {submission.assignment?.max_marks}
                    </strong>
                    <p>{submission.grade.feedback || "No feedback provided."}</p>
                  </div>
                ) : (
                  <div className="grade-box muted-box">
                    <span>Grade</span>
                    <strong>Not published yet</strong>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MySubmissionsPage;