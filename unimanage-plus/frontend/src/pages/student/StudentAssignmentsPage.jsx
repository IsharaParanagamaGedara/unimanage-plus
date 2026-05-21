import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  getStudentAssignments,
  getStudentAssignmentById,
  submitStudentAssignment,
  getMySubmissions,
  downloadMySubmissionFile,
} from "../../services/studentAssignmentService";
import "./StudentAssignmentsPage.css";

const StudentAssignmentsPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [search, setSearch] = useState("");

  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const [submissionForm, setSubmissionForm] = useState({
    submission_text: "",
    file: null,
  });

  const [loading, setLoading] = useState(false);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getStudentAssignments(search);
      setAssignments(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load assignments.");
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async () => {
    try {
      const data = await getMySubmissions();
      setSubmissions(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load submissions.");
    }
  };

  useEffect(() => {
    loadAssignments();
    loadSubmissions();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadAssignments();
  };

  const handleDownloadSubmission = async (submission) => {
    try {
      setError("");

      await downloadMySubmissionFile(
        submission.id,
        submission.file_name
      );
    } catch (err) {
      setError("Failed to download submitted file.");
    }
  };

  const openSubmitModal = async (assignmentId) => {
    try {
      setDetailLoading(true);
      setError("");
      setMessage("");

      const data = await getStudentAssignmentById(assignmentId);
      setSelectedAssignment(data);

      setSubmissionForm({
        submission_text: "",
        file: null,
      });

      setShowSubmitModal(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load assignment details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeSubmitModal = () => {
    setSelectedAssignment(null);
    setShowSubmitModal(false);
    setSubmissionForm({
      submission_text: "",
      file: null,
    });
  };

  const handleSubmissionChange = (e) => {
    const { name, value, files } = e.target;

    setSubmissionForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();

    try {
      setSubmissionLoading(true);
      setError("");
      setMessage("");

      const formData = new FormData();
      formData.append("submission_text", submissionForm.submission_text);

      if (submissionForm.file) {
        formData.append("file", submissionForm.file);
      }

      await submitStudentAssignment(selectedAssignment.id, formData);

      setMessage("Assignment submitted successfully.");
      closeSubmitModal();
      loadAssignments();
      loadSubmissions();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to submit assignment.");
    } finally {
      setSubmissionLoading(false);
    }
  };

  const findSubmissionForAssignment = (assignmentId) => {
    return submissions.find((item) => item.assignment_id === assignmentId);
  };

  const getSubmissionStatus = (assignment) => {
    const submission = findSubmissionForAssignment(assignment.id);

    if (submission) return submission.status;
    if (assignment.is_overdue) return "Overdue";
    return "Not Submitted";
  };

  const getStatusClass = (status) => {
    if (status === "Submitted") return "status submitted";
    if (status === "Graded Draft" || status === "Grade Pending Approval") return "status pending";
    if (status === "Grade Published") return "status published";
    if (status === "Overdue") return "status overdue";
    return "status not-submitted";
  };

  return (
    <DashboardLayout>
      <div className="student-assignments-page">
        <div className="page-header-row">
          <div>
            <h1>My Assignments</h1>
            <p>View published assignments for your enrolled course batches and submit your work.</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <div className="assignment-summary-grid">
          <div className="summary-card">
            <span>Total Assignments</span>
            <strong>{assignments.length}</strong>
          </div>

          <div className="summary-card">
            <span>Submitted</span>
            <strong>
              {
                assignments.filter((assignment) =>
                  Boolean(findSubmissionForAssignment(assignment.id))
                ).length
              }
            </strong>
          </div>

          <div className="summary-card">
            <span>Pending Submission</span>
            <strong>
              {
                assignments.filter(
                  (assignment) =>
                    !findSubmissionForAssignment(assignment.id) &&
                    !assignment.is_overdue
                ).length
              }
            </strong>
          </div>

          <div className="summary-card">
            <span>Overdue</span>
            <strong>{assignments.filter((assignment) => assignment.is_overdue).length}</strong>
          </div>
        </div>

        <div className="filter-card">
          <form onSubmit={handleSearchSubmit} className="student-assignment-search">
            <input
              type="text"
              placeholder="Search assignments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <button type="submit" className="secondary-btn">
              Search
            </button>
          </form>
        </div>

        {loading ? (
          <p className="table-message">Loading assignments...</p>
        ) : assignments.length === 0 ? (
          <div className="empty-card">
            <h3>No assignments found</h3>
            <p>Published assignments for your enrolled batches will appear here.</p>
          </div>
        ) : (
          <div className="assignment-card-grid">
            {assignments.map((assignment) => {
              const submissionStatus = getSubmissionStatus(assignment);
              const submission = findSubmissionForAssignment(assignment.id);

              return (
                <div className="student-assignment-card" key={assignment.id}>
                  <div className="assignment-card-header">
                    <div className="course-badge">
                      {assignment.course_batch?.course?.course_code}
                    </div>

                    <span className={getStatusClass(submissionStatus)}>
                      {submissionStatus}
                    </span>
                  </div>

                  <h3>{assignment.title}</h3>
                  <p>{assignment.description || "No description provided."}</p>

                  <div className="assignment-info-grid">
                    <div>
                      <span>Batch</span>
                      <strong>{assignment.course_batch?.batch_name}</strong>
                    </div>

                    <div>
                      <span>Batch Code</span>
                      <strong>{assignment.course_batch?.batch_code}</strong>
                    </div>

                    <div>
                      <span>Due Date</span>
                      <strong>
                        {assignment.due_date
                          ? new Date(assignment.due_date).toLocaleString()
                          : "-"}
                      </strong>
                    </div>

                    <div>
                      <span>Max Marks</span>
                      <strong>{assignment.max_marks}</strong>
                    </div>
                  </div>

                  {assignment.attachment_name && (
                    <div className="attachment-box">
                      <span>Attachment</span>
                      <strong>{assignment.attachment_name}</strong>
                      <small>{assignment.attachment_size_mb} MB</small>
                    </div>
                  )}

                  {submission && (
                    <div className="submitted-box">
                      <span>Submitted At</span>
                      <strong>
                        {submission.submitted_at
                          ? new Date(submission.submitted_at).toLocaleString()
                          : "-"}
                      </strong>

                      {submission.file_name && (
                        <button
                          type="button"
                          className="file-download-btn"
                          onClick={() => handleDownloadSubmission(submission)}
                        >
                          Download: {submission.file_name}
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    className={`primary-btn ${
                      assignment.already_submitted || assignment.is_overdue
                        ? "disabled-btn"
                        : ""
                    }`}
                    disabled={assignment.already_submitted || assignment.is_overdue}
                    onClick={() => openSubmitModal(assignment.id)}
                  >
                    {assignment.already_submitted
                      ? "Submitted"
                      : assignment.is_overdue
                      ? "Overdue"
                      : "Submit Assignment"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {showSubmitModal && selectedAssignment && (
          <div className="modal-overlay">
            <div className="student-submit-modal">
              <div className="modal-header">
                <div>
                  <h2>Submit Assignment</h2>
                  <p>{selectedAssignment.title}</p>
                </div>

                <button className="close-btn" onClick={closeSubmitModal}>
                  ×
                </button>
              </div>

              {detailLoading ? (
                <p className="table-message">Loading assignment...</p>
              ) : (
                <form onSubmit={handleSubmitAssignment}>
                  <div className="assignment-detail-box">
                    <h3>Instructions</h3>
                    <p>{selectedAssignment.instructions}</p>

                    <div className="detail-row">
                      <span>Due Date</span>
                      <strong>
                        {selectedAssignment.due_date
                          ? new Date(selectedAssignment.due_date).toLocaleString()
                          : "-"}
                      </strong>
                    </div>

                    <div className="detail-row">
                      <span>Max Marks</span>
                      <strong>{selectedAssignment.max_marks}</strong>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Submission Text</label>
                    <textarea
                      name="submission_text"
                      value={submissionForm.submission_text}
                      onChange={handleSubmissionChange}
                      placeholder="Write your submission note or answer here..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Upload File</label>
                    <input
                      name="file"
                      type="file"
                      accept=".pdf,.docx,.zip"
                      onChange={handleSubmissionChange}
                    />
                    <small>Allowed: PDF, DOCX, ZIP. Max: 20MB.</small>
                  </div>

                  <div className="modal-actions">
                    <button type="button" className="secondary-btn" onClick={closeSubmitModal}>
                      Cancel
                    </button>

                    <button type="submit" className="primary-btn" disabled={submissionLoading}>
                      {submissionLoading ? "Submitting..." : "Submit"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentAssignmentsPage;