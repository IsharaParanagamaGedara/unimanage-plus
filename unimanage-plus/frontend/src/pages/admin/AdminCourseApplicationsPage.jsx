import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  getCourseApplications,
  reviewCourseApplication,
} from "../../services/adminCourseApplicationService";
import "./AdminCourseApplicationsPage.css";

const AdminCourseApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
  });

  const [selectedApplication, setSelectedApplication] = useState(null);
  const [decision, setDecision] = useState("");
  const [reviewNote, setReviewNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getCourseApplications(filters);
      setApplications(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [filters.status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadApplications();
  };

  const handleFilterChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const openReviewModal = (application, selectedDecision) => {
    setSelectedApplication(application);
    setDecision(selectedDecision);
    setReviewNote("");
    setError("");
    setMessage("");
  };

  const closeReviewModal = () => {
    setSelectedApplication(null);
    setDecision("");
    setReviewNote("");
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    try {
      setReviewLoading(true);
      setError("");
      setMessage("");

      await reviewCourseApplication(selectedApplication.id, {
        decision,
        review_note: reviewNote,
      });

      setMessage(`Application ${decision.toLowerCase()} successfully.`);
      closeReviewModal();
      loadApplications();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to review application.");
    } finally {
      setReviewLoading(false);
    }
  };

  const getStatusClass = (status) => {
    if (status === "Approved") return "status approved";
    if (status === "Rejected") return "status rejected";
    return "status pending";
  };

  return (
    <DashboardLayout>
      <div className="admin-applications-page">
        <div className="page-header-row">
          <div>
            <h1>Course Applications</h1>
            <p>
              Review student course batch applications and approve or reject them.
            </p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <div className="application-summary-grid">
          <div className="summary-card">
            <span>Total Applications</span>
            <strong>{applications.length}</strong>
          </div>

          <div className="summary-card">
            <span>Pending</span>
            <strong>
              {applications.filter((item) => item.status === "Pending").length}
            </strong>
          </div>

          <div className="summary-card">
            <span>Approved</span>
            <strong>
              {applications.filter((item) => item.status === "Approved").length}
            </strong>
          </div>

          <div className="summary-card">
            <span>Rejected</span>
            <strong>
              {applications.filter((item) => item.status === "Rejected").length}
            </strong>
          </div>
        </div>

        <div className="filter-card">
          <form onSubmit={handleSearchSubmit} className="application-filter-grid">
            <input
              name="search"
              type="text"
              placeholder="Search by batch code or batch name..."
              value={filters.search}
              onChange={handleFilterChange}
            />

            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>

            <button className="secondary-btn" type="submit">
              Search
            </button>
          </form>
        </div>

        <div className="table-card">
          {loading ? (
            <p className="table-message">Loading applications...</p>
          ) : applications.length === 0 ? (
            <p className="table-message">No course applications found.</p>
          ) : (
            <div className="table-responsive">
              <table className="applications-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Course / Batch</th>
                    <th>Application Note</th>
                    <th>Status</th>
                    <th>Applied At</th>
                    <th>Review Details</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {applications.map((application) => (
                    <tr key={application.id}>
                      <td>
                        <div className="student-cell">
                          <div className="student-avatar">
                            {application.student?.first_name?.charAt(0)}
                            {application.student?.last_name?.charAt(0)}
                          </div>

                          <div>
                            <strong>
                              {application.student?.first_name}{" "}
                              {application.student?.last_name}
                            </strong>
                            <span>{application.student?.student_number}</span>
                            <span>{application.student?.email}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <strong>
                          {application.batch?.course?.course_code} -{" "}
                          {application.batch?.course?.course_name}
                        </strong>
                        <span className="sub-text">
                          {application.batch?.batch_code} |{" "}
                          {application.batch?.batch_name}
                        </span>
                      </td>

                      <td className="note-cell">
                        {application.application_note || "-"}
                      </td>

                      <td>
                        <span className={getStatusClass(application.status)}>
                          {application.status}
                        </span>
                      </td>

                      <td>
                        {application.applied_at
                          ? new Date(application.applied_at).toLocaleDateString()
                          : "-"}
                      </td>

                      <td>
                        {application.reviewer ? (
                          <>
                            <strong>
                              {application.reviewer.first_name}{" "}
                              {application.reviewer.last_name}
                            </strong>
                            <span className="sub-text">
                              {application.review_note || "No review note"}
                            </span>
                            <span className="sub-text">
                              {application.reviewed_at
                                ? new Date(
                                    application.reviewed_at
                                  ).toLocaleDateString()
                                : "-"}
                            </span>
                          </>
                        ) : (
                          <span className="sub-text">Not reviewed yet</span>
                        )}
                      </td>

                      <td>
                        {application.status === "Pending" ? (
                          <div className="action-buttons">
                            <button
                              className="success-btn small-btn"
                              onClick={() =>
                                openReviewModal(application, "Approved")
                              }
                            >
                              Approve
                            </button>

                            <button
                              className="danger-btn small-btn"
                              onClick={() =>
                                openReviewModal(application, "Rejected")
                              }
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="sub-text">Reviewed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedApplication && (
          <div className="modal-overlay">
            <div className="review-modal">
              <div className="modal-header">
                <div>
                  <h2>{decision} Application</h2>
                  <p>
                    {selectedApplication.batch?.course?.course_code} -{" "}
                    {selectedApplication.batch?.batch_name}
                  </p>
                </div>

                <button className="close-btn" onClick={closeReviewModal}>
                  ×
                </button>
              </div>

              <form onSubmit={handleReviewSubmit}>
                <div className="review-summary">
                  <p>
                    <strong>Student:</strong>{" "}
                    {selectedApplication.student?.first_name}{" "}
                    {selectedApplication.student?.last_name}
                  </p>
                  <p>
                    <strong>Student No:</strong>{" "}
                    {selectedApplication.student?.student_number}
                  </p>
                  <p>
                    <strong>Application Note:</strong>{" "}
                    {selectedApplication.application_note || "-"}
                  </p>
                </div>

                <div className="form-group">
                  <label>Review Note</label>
                  <textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder={
                      decision === "Approved"
                        ? "Application approved. Student meets the batch requirements."
                        : "Application rejected due to eligibility or capacity limitations."
                    }
                    required
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={closeReviewModal}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className={
                      decision === "Approved" ? "success-btn" : "danger-btn"
                    }
                    disabled={reviewLoading}
                  >
                    {reviewLoading ? "Saving..." : decision}
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

export default AdminCourseApplicationsPage;