import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  getLecturerSubmissions,
  getLecturerSubmissionById,
  createDraftGrade,
  updateDraftGrade,
  submitGradeForApproval,
} from "../../services/lecturerGradingService";
import "./LecturerSubmissionsPage.css";

const LecturerSubmissionsPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    assignment_id: "",
    batch_id: "",
  });

  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);

  const [gradeForm, setGradeForm] = useState({
    marks: "",
    feedback: "",
  });

  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [gradeLoading, setGradeLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getLecturerSubmissions(filters);
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadSubmissions();
  };

  const handleFilterChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const openDetailModal = async (submissionId) => {
    try {
      setDetailLoading(true);
      setError("");

      const data = await getLecturerSubmissionById(submissionId);
      setSelectedSubmission(data);
      setShowDetailModal(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load submission details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setSelectedSubmission(null);
    setShowDetailModal(false);
  };

  const openGradeModal = async (submission) => {
    try {
      setDetailLoading(true);
      setError("");
      setMessage("");

      const data = await getLecturerSubmissionById(submission.id);
      setSelectedSubmission(data);

      setGradeForm({
        marks: data.grade?.marks ?? "",
        feedback: data.grade?.feedback || "",
      });

      setShowGradeModal(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load submission.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeGradeModal = () => {
    setSelectedSubmission(null);
    setShowGradeModal(false);
    setGradeForm({
      marks: "",
      feedback: "",
    });
  };

  const handleGradeFormChange = (e) => {
    setGradeForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();

    try {
      setGradeLoading(true);
      setError("");
      setMessage("");

      const payload = {
        marks: Number(gradeForm.marks),
        feedback: gradeForm.feedback,
      };

      if (selectedSubmission.grade) {
        await updateDraftGrade(selectedSubmission.grade.id, payload);
        setMessage("Draft grade updated successfully.");
      } else {
        await createDraftGrade(selectedSubmission.id, payload);
        setMessage("Draft grade created successfully.");
      }

      closeGradeModal();
      loadSubmissions();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save draft grade.");
    } finally {
      setGradeLoading(false);
    }
  };

  const handleSubmitApproval = async (submission) => {
    if (!submission.grade) {
      setError("Create a draft grade before submitting for approval.");
      return;
    }

    if (!window.confirm("Submit this grade for coordinator/admin approval?")) return;

    try {
      setActionLoading(true);
      setError("");
      setMessage("");

      await submitGradeForApproval(submission.grade.id);

      setMessage("Grade submitted for approval successfully.");
      loadSubmissions();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to submit grade for approval.");
    } finally {
      setActionLoading(false);
    }
  };

  const getSubmissionStatusClass = (status) => {
    if (status === "Grade Published") return "status published";
    if (status === "Grade Pending Approval") return "status pending";
    if (status === "Graded Draft") return "status draft";
    return "status submitted";
  };

  const getGradeStatusClass = (status) => {
    if (status === "Published") return "status published";
    if (status === "Pending Approval") return "status pending";
    return "status draft";
  };

  return (
    <DashboardLayout>
      <div className="lecturer-submissions-page">
        <div className="page-header-row">
          <div>
            <h1>Submission Review & Grading</h1>
            <p>Review student submissions, create draft grades, and submit grades for approval.</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

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
            <span>Draft Grades</span>
            <strong>{submissions.filter((s) => s.grade?.status === "Draft").length}</strong>
          </div>

          <div className="summary-card">
            <span>Pending Approval</span>
            <strong>
              {submissions.filter((s) => s.grade?.status === "Pending Approval").length}
            </strong>
          </div>
        </div>

        <div className="filter-card">
          <form onSubmit={handleSearchSubmit} className="submission-filter-grid">
            <input
              name="search"
              type="text"
              placeholder="Search by assignment title or submission text..."
              value={filters.search}
              onChange={handleFilterChange}
            />

            <input
              name="assignment_id"
              type="number"
              placeholder="Assignment ID"
              value={filters.assignment_id}
              onChange={handleFilterChange}
            />

            <input
              name="batch_id"
              type="number"
              placeholder="Batch ID"
              value={filters.batch_id}
              onChange={handleFilterChange}
            />

            <button className="secondary-btn" type="submit">
              Search
            </button>
          </form>
        </div>

        <div className="table-card">
          {loading ? (
            <p className="table-message">Loading submissions...</p>
          ) : submissions.length === 0 ? (
            <p className="table-message">No submissions found.</p>
          ) : (
            <div className="table-responsive">
              <table className="submissions-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Assignment</th>
                    <th>Submitted</th>
                    <th>Submission Status</th>
                    <th>Grade</th>
                    <th>Grade Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {submissions.map((submission) => (
                    <tr key={submission.id}>
                      <td>
                        <div className="student-cell">
                          <div className="student-avatar">
                            {submission.student?.first_name?.charAt(0)}
                            {submission.student?.last_name?.charAt(0)}
                          </div>

                          <div>
                            <strong>
                              {submission.student?.first_name} {submission.student?.last_name}
                            </strong>
                            <span>{submission.student?.student_number}</span>
                            <span>{submission.student?.email}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <strong>{submission.assignment?.title}</strong>
                        <span className="sub-text">
                          {submission.assignment?.course_batch?.course?.course_code} -{" "}
                          {submission.assignment?.course_batch?.course?.course_name}
                        </span>
                        <span className="sub-text">
                          {submission.assignment?.course_batch?.batch_code}
                        </span>
                      </td>

                      <td>
                        {submission.submitted_at
                          ? new Date(submission.submitted_at).toLocaleString()
                          : "-"}
                      </td>

                      <td>
                        <span className={getSubmissionStatusClass(submission.status)}>
                          {submission.status}
                        </span>
                      </td>

                      <td>
                        {submission.grade ? (
                          <strong>
                            {submission.grade.marks} / {submission.assignment?.max_marks}
                          </strong>
                        ) : (
                          <span className="sub-text">Not graded</span>
                        )}
                      </td>

                      <td>
                        {submission.grade ? (
                          <span className={getGradeStatusClass(submission.grade.status)}>
                            {submission.grade.status}
                          </span>
                        ) : (
                          <span className="status submitted">Not Created</span>
                        )}
                      </td>

                      <td>
                        <div className="action-buttons">
                          <button
                            className="secondary-btn small-btn"
                            onClick={() => openDetailModal(submission.id)}
                          >
                            View
                          </button>

                          {(!submission.grade || submission.grade.status === "Draft") && (
                            <button
                              className="primary-btn small-btn"
                              onClick={() => openGradeModal(submission)}
                            >
                              {submission.grade ? "Edit Grade" : "Grade"}
                            </button>
                          )}

                          {submission.grade?.status === "Draft" && (
                            <button
                              className="success-btn small-btn"
                              onClick={() => handleSubmitApproval(submission)}
                              disabled={actionLoading}
                            >
                              Submit Approval
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showDetailModal && selectedSubmission && (
          <div className="modal-overlay">
            <div className="submission-modal large-modal">
              <div className="modal-header">
                <div>
                  <h2>Submission Details</h2>
                  <p>{selectedSubmission.assignment?.title}</p>
                </div>

                <button className="close-btn" onClick={closeDetailModal}>×</button>
              </div>

              {detailLoading ? (
                <p className="table-message">Loading details...</p>
              ) : (
                <>
                  <div className="detail-grid">
                    <div>
                      <span>Student</span>
                      <strong>
                        {selectedSubmission.student?.first_name}{" "}
                        {selectedSubmission.student?.last_name}
                      </strong>
                    </div>

                    <div>
                      <span>Student Number</span>
                      <strong>{selectedSubmission.student?.student_number}</strong>
                    </div>

                    <div>
                      <span>Submitted At</span>
                      <strong>
                        {selectedSubmission.submitted_at
                          ? new Date(selectedSubmission.submitted_at).toLocaleString()
                          : "-"}
                      </strong>
                    </div>

                    <div>
                      <span>File</span>
                      <strong>{selectedSubmission.file_name || "No file uploaded"}</strong>
                    </div>
                  </div>

                  <div className="description-box">
                    <h3>Submission Text</h3>
                    <p>{selectedSubmission.submission_text || "No text submitted."}</p>
                  </div>

                  {selectedSubmission.grade && (
                    <div className="description-box">
                      <h3>Grade</h3>
                      <p>
                        <strong>
                          {selectedSubmission.grade.marks} /{" "}
                          {selectedSubmission.assignment?.max_marks}
                        </strong>
                      </p>
                      <p>{selectedSubmission.grade.feedback || "No feedback provided."}</p>
                      <span className={getGradeStatusClass(selectedSubmission.grade.status)}>
                        {selectedSubmission.grade.status}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {showGradeModal && selectedSubmission && (
          <div className="modal-overlay">
            <div className="submission-modal">
              <div className="modal-header">
                <div>
                  <h2>{selectedSubmission.grade ? "Edit Draft Grade" : "Create Draft Grade"}</h2>
                  <p>{selectedSubmission.assignment?.title}</p>
                </div>

                <button className="close-btn" onClick={closeGradeModal}>×</button>
              </div>

              <form onSubmit={handleGradeSubmit}>
                <div className="grade-summary-box">
                  <p>
                    <strong>Student:</strong>{" "}
                    {selectedSubmission.student?.first_name}{" "}
                    {selectedSubmission.student?.last_name}
                  </p>
                  <p>
                    <strong>Max Marks:</strong> {selectedSubmission.assignment?.max_marks}
                  </p>
                </div>

                <div className="form-group">
                  <label>Marks</label>
                  <input
                    name="marks"
                    type="number"
                    min="0"
                    max={selectedSubmission.assignment?.max_marks}
                    step="0.01"
                    value={gradeForm.marks}
                    onChange={handleGradeFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Feedback</label>
                  <textarea
                    name="feedback"
                    value={gradeForm.feedback}
                    onChange={handleGradeFormChange}
                    placeholder="Write feedback for the student..."
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="secondary-btn" onClick={closeGradeModal}>
                    Cancel
                  </button>

                  <button type="submit" className="primary-btn" disabled={gradeLoading}>
                    {gradeLoading ? "Saving..." : "Save Draft Grade"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LecturerSubmissionsPage;