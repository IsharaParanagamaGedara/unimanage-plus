import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  getPendingGrades,
  publishGrade,
  returnGrade,
} from "../../services/gradeApprovalService";
import "./GradeApprovalPage.css";

const GradeApprovalPage = () => {
  const [grades, setGrades] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    batch_id: "",
  });

  const [selectedGrade, setSelectedGrade] = useState(null);
  const [actionType, setActionType] = useState("");
  const [approvalNote, setApprovalNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadGrades = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getPendingGrades(filters);
      setGrades(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load pending grades.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGrades();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadGrades();
  };

  const handleFilterChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const openActionModal = (grade, type) => {
    setSelectedGrade(grade);
    setActionType(type);
    setApprovalNote("");
    setError("");
    setMessage("");
  };

  const closeActionModal = () => {
    setSelectedGrade(null);
    setActionType("");
    setApprovalNote("");
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();

    try {
      setActionLoading(true);
      setError("");
      setMessage("");

      if (actionType === "publish") {
        await publishGrade(selectedGrade.id, {
          approval_note: approvalNote,
        });

        setMessage("Grade published successfully.");
      }

      if (actionType === "return") {
        await returnGrade(selectedGrade.id, {
          approval_note: approvalNote,
        });

        setMessage("Grade returned to draft successfully.");
      }

      closeActionModal();
      loadGrades();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to process grade approval.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="grade-approval-page">
        <div className="page-header-row">
          <div>
            <h1>Grade Approval</h1>
            <p>
              Review lecturer-submitted grades, publish approved results, or return grades for correction.
            </p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <div className="grade-summary-grid">
          <div className="summary-card">
            <span>Pending Grades</span>
            <strong>{grades.length}</strong>
          </div>

          <div className="summary-card">
            <span>Total Marks Awaiting Review</span>
            <strong>{grades.reduce((total, grade) => total + Number(grade.marks || 0), 0)}</strong>
          </div>

          <div className="summary-card">
            <span>Unique Assignments</span>
            <strong>{new Set(grades.map((grade) => grade.assignment?.id)).size}</strong>
          </div>

          <div className="summary-card">
            <span>Unique Batches</span>
            <strong>{new Set(grades.map((grade) => grade.course_batch?.id)).size}</strong>
          </div>
        </div>

        <div className="filter-card">
          <form onSubmit={handleSearchSubmit} className="grade-filter-grid">
            <input
              name="search"
              type="text"
              placeholder="Search by student name, student number, or assignment..."
              value={filters.search}
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
            <p className="table-message">Loading pending grades...</p>
          ) : grades.length === 0 ? (
            <p className="table-message">No grades pending approval.</p>
          ) : (
            <div className="table-responsive">
              <table className="grades-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Assignment</th>
                    <th>Course / Batch</th>
                    <th>Marks</th>
                    <th>Feedback</th>
                    <th>Graded By</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {grades.map((grade) => (
                    <tr key={grade.id}>
                      <td>
                        <div className="student-cell">
                          <div className="student-avatar">
                            {grade.student?.first_name?.charAt(0)}
                            {grade.student?.last_name?.charAt(0)}
                          </div>

                          <div>
                            <strong>
                              {grade.student?.first_name} {grade.student?.last_name}
                            </strong>
                            <span>{grade.student?.student_number}</span>
                            <span>{grade.student?.email}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <strong>{grade.assignment?.title}</strong>
                        <span className="sub-text">
                          Submitted:{" "}
                          {grade.submission?.submitted_at
                            ? new Date(grade.submission.submitted_at).toLocaleDateString()
                            : "-"}
                        </span>
                      </td>

                      <td>
                        <strong>
                          {grade.course?.course_code} - {grade.course?.course_name}
                        </strong>
                        <span className="sub-text">
                          {grade.course_batch?.batch_code} | {grade.course_batch?.batch_name}
                        </span>
                      </td>

                      <td>
                        <strong>
                          {grade.marks} / {grade.assignment?.max_marks}
                        </strong>
                      </td>

                      <td className="feedback-cell">
                        {grade.feedback || "No feedback provided."}
                      </td>

                      <td>
                        {grade.grader ? (
                          <>
                            <strong>
                              {grade.grader.first_name} {grade.grader.last_name}
                            </strong>
                            <span className="sub-text">
                              {grade.graded_at
                                ? new Date(grade.graded_at).toLocaleDateString()
                                : "-"}
                            </span>
                          </>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td>
                        <div className="action-buttons">
                          <button
                            className="success-btn small-btn"
                            onClick={() => openActionModal(grade, "publish")}
                          >
                            Publish
                          </button>

                          <button
                            className="danger-btn small-btn"
                            onClick={() => openActionModal(grade, "return")}
                          >
                            Return
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedGrade && (
          <div className="modal-overlay">
            <div className="approval-modal">
              <div className="modal-header">
                <div>
                  <h2>
                    {actionType === "publish" ? "Publish Grade" : "Return Grade"}
                  </h2>
                  <p>{selectedGrade.assignment?.title}</p>
                </div>

                <button className="close-btn" onClick={closeActionModal}>
                  ×
                </button>
              </div>

              <form onSubmit={handleActionSubmit}>
                <div className="approval-summary">
                  <p>
                    <strong>Student:</strong>{" "}
                    {selectedGrade.student?.first_name} {selectedGrade.student?.last_name}
                  </p>

                  <p>
                    <strong>Marks:</strong> {selectedGrade.marks} /{" "}
                    {selectedGrade.assignment?.max_marks}
                  </p>

                  <p>
                    <strong>Feedback:</strong>{" "}
                    {selectedGrade.feedback || "No feedback provided."}
                  </p>
                </div>

                <div className="form-group">
                  <label>
                    {actionType === "publish"
                      ? "Approval Note"
                      : "Return Note"}
                  </label>

                  <textarea
                    value={approvalNote}
                    onChange={(e) => setApprovalNote(e.target.value)}
                    placeholder={
                      actionType === "publish"
                        ? "Grade reviewed and approved for publication."
                        : "Please revise the feedback before publishing."
                    }
                    required={actionType === "return"}
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="secondary-btn" onClick={closeActionModal}>
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className={actionType === "publish" ? "success-btn" : "danger-btn"}
                    disabled={actionLoading}
                  >
                    {actionLoading
                      ? "Processing..."
                      : actionType === "publish"
                      ? "Publish Grade"
                      : "Return to Draft"}
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

export default GradeApprovalPage;