import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import {
  getAssignments,
  createAssignment,
  updateAssignment,
  submitAssignmentForReview,
  publishAssignment,
  updateAssignmentStatus,
  getAssignmentBatches,
  downloadAssignmentAttachment,
} from "../../services/assignmentService";
import "./LecturerAssignmentsPage.css";

const initialForm = {
  course_batch_id: "",
  title: "",
  description: "",
  instructions: "",
  due_date: "",
  max_marks: "",
  attachment: null,
};

const LecturerAssignmentsPage = () => {
  const { user } = useAuth();

  const [assignments, setAssignments] = useState([]);
  const [batches, setBatches] = useState([]);

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    batch_id: "",
  });

  const [form, setForm] = useState(initialForm);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [reviewNote, setReviewNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const role = user?.role;

  const canCreateAssignment = role === "Lecturer" || role === "Admin";
  const canPublishAssignment = role === "Department Staff" || role === "Admin";

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAssignments(filters);
      setAssignments(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load assignments.");
    } finally {
      setLoading(false);
    }
  };

  const loadBatches = async () => {
    try {
      const data = await getAssignmentBatches();
      setBatches(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load course batches.");
    }
  };

  useEffect(() => {
    loadAssignments();
    loadBatches();
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [filters.status, filters.batch_id]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadAssignments();
  };

  const handleFilterChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleFormChange = (e) => {
    const { name, value, files } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleDownloadAttachment = async (assignment) => {
    try {
      setError("");

      await downloadAssignmentAttachment(
        assignment.id,
        assignment.attachment_name
      );
    } catch (err) {
      setError("Failed to download assignment attachment.");
    }
  };

  const openCreateModal = () => {
    setEditingAssignment(null);
    setForm(initialForm);
    setShowForm(true);
    setError("");
    setMessage("");
  };

  const openEditModal = (assignment) => {
    setEditingAssignment(assignment);

    setForm({
      course_batch_id: assignment.course_batch_id || "",
      title: assignment.title || "",
      description: assignment.description || "",
      instructions: assignment.instructions || "",
      due_date: assignment.due_date ? assignment.due_date.slice(0, 16) : "",
      max_marks: assignment.max_marks || "",
      attachment: null,
    });

    setShowForm(true);
  };

  const closeFormModal = () => {
    setShowForm(false);
    setEditingAssignment(null);
    setForm(initialForm);
  };

  const buildAssignmentFormData = () => {
    const formData = new FormData();

    formData.append("course_batch_id", form.course_batch_id);
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("instructions", form.instructions);
    formData.append("due_date", form.due_date);
    formData.append("max_marks", form.max_marks);

    if (form.attachment) {
      formData.append("attachment", form.attachment);
    }

    return formData;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setFormLoading(true);
      setError("");
      setMessage("");

      const formData = buildAssignmentFormData();

      if (editingAssignment) {
        await updateAssignment(editingAssignment.id, formData);
        setMessage("Assignment updated successfully.");
      } else {
        await createAssignment(formData);
        setMessage("Assignment created successfully as Draft.");
      }

      closeFormModal();
      loadAssignments();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save assignment.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmitReview = async (assignment) => {
    if (!window.confirm("Submit this assignment for coordinator review?")) return;

    try {
      setActionLoading(true);
      setError("");
      setMessage("");

      await submitAssignmentForReview(assignment.id);
      setMessage("Assignment submitted for review successfully.");
      loadAssignments();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to submit for review.");
    } finally {
      setActionLoading(false);
    }
  };

  const openPublishModal = (assignment) => {
    setSelectedAssignment(assignment);
    setReviewNote("");
    setShowPublishModal(true);
  };

  const closePublishModal = () => {
    setSelectedAssignment(null);
    setReviewNote("");
    setShowPublishModal(false);
  };

  const handlePublish = async (e) => {
    e.preventDefault();

    try {
      setActionLoading(true);
      setError("");
      setMessage("");

      await publishAssignment(selectedAssignment.id, {
        review_note: reviewNote,
      });

      setMessage("Assignment published successfully.");
      closePublishModal();
      loadAssignments();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to publish assignment.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseAssignment = async (assignment) => {
    if (!window.confirm("Are you sure you want to close this assignment?")) return;

    try {
      setActionLoading(true);
      setError("");
      setMessage("");

      await updateAssignmentStatus(assignment.id, {
        status: "Closed",
        review_note: "Assignment closed.",
      });

      setMessage("Assignment closed successfully.");
      loadAssignments();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to close assignment.");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusClass = (status) => {
    if (status === "Published") return "status published";
    if (status === "Pending Review") return "status pending";
    if (status === "Closed") return "status closed";
    if (status === "Archived") return "status archived";
    return "status draft";
  };

  return (
    <DashboardLayout>
      <div className="assignments-page">
        <div className="page-header-row">
          <div>
            <h1>Assignment Management</h1>
            <p>
              Create, review, publish, and monitor assignments through the academic approval workflow.
            </p>
          </div>

          {canCreateAssignment && (
            <button className="primary-btn" onClick={openCreateModal}>
              + Create Assignment
            </button>
          )}
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <div className="assignment-summary-grid">
          <div className="summary-card">
            <span>Total Assignments</span>
            <strong>{assignments.length}</strong>
          </div>

          <div className="summary-card">
            <span>Draft</span>
            <strong>{assignments.filter((a) => a.status === "Draft").length}</strong>
          </div>

          <div className="summary-card">
            <span>Pending Review</span>
            <strong>{assignments.filter((a) => a.status === "Pending Review").length}</strong>
          </div>

          <div className="summary-card">
            <span>Published</span>
            <strong>{assignments.filter((a) => a.status === "Published").length}</strong>
          </div>
        </div>

        <div className="filter-card">
          <form onSubmit={handleSearchSubmit} className="assignment-filter-grid">
            <input
              name="search"
              type="text"
              placeholder="Search assignments..."
              value={filters.search}
              onChange={handleFilterChange}
            />

            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Published">Published</option>
              <option value="Closed">Closed</option>
              <option value="Archived">Archived</option>
            </select>

            <select name="batch_id" value={filters.batch_id} onChange={handleFilterChange}>
              <option value="">All Batches</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.batch_code} - {batch.batch_name}
                </option>
              ))}
            </select>

            <button className="secondary-btn" type="submit">
              Search
            </button>
          </form>
        </div>

        <div className="table-card">
          {loading ? (
            <p className="table-message">Loading assignments...</p>
          ) : assignments.length === 0 ? (
            <p className="table-message">No assignments found.</p>
          ) : (
            <div className="table-responsive">
              <table className="assignments-table">
                <thead>
                  <tr>
                    <th>Assignment</th>
                    <th>Course / Batch</th>
                    <th>Due Date</th>
                    <th>Max Marks</th>
                    <th>Status</th>
                    <th>Published By</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {assignments.map((assignment) => (
                    <tr key={assignment.id}>
                      <td>
                        <strong>{assignment.title}</strong>
                        <span className="sub-text">
                          {assignment.description || "No description"}
                        </span>

                        {assignment.attachment_name && (
                          <button
                            type="button"
                            className="file-download-btn"
                            onClick={() => handleDownloadAttachment(assignment)}
                          >
                            Download: {assignment.attachment_name}
                          </button>
                        )}
                      </td>

                      <td>
                        <strong>
                          {assignment.course_batch?.course?.course_code} -{" "}
                          {assignment.course_batch?.course?.course_name}
                        </strong>
                        <span className="sub-text">
                          {assignment.course_batch?.batch_code} |{" "}
                          {assignment.course_batch?.batch_name}
                        </span>
                      </td>

                      <td>
                        {assignment.due_date
                          ? new Date(assignment.due_date).toLocaleString()
                          : "-"}
                      </td>

                      <td>{assignment.max_marks}</td>

                      <td>
                        <span className={getStatusClass(assignment.status)}>
                          {assignment.status}
                        </span>
                      </td>

                      <td>
                        {assignment.publisher ? (
                          <>
                            <strong>
                              {assignment.publisher.first_name}{" "}
                              {assignment.publisher.last_name}
                            </strong>
                            <span className="sub-text">
                              {assignment.published_at
                                ? new Date(assignment.published_at).toLocaleDateString()
                                : "-"}
                            </span>
                          </>
                        ) : (
                          <span className="sub-text">Not published</span>
                        )}
                      </td>

                      <td>
                        <div className="action-buttons">
                          {canCreateAssignment && assignment.status === "Draft" && (
                            <button
                              className="secondary-btn small-btn"
                              onClick={() => openEditModal(assignment)}
                            >
                              Edit
                            </button>
                          )}

                          {role === "Lecturer" && assignment.status === "Draft" && (
                            <button
                              className="primary-btn small-btn"
                              onClick={() => handleSubmitReview(assignment)}
                              disabled={actionLoading}
                            >
                              Submit Review
                            </button>
                          )}

                          {canPublishAssignment &&
                            ["Draft", "Pending Review"].includes(assignment.status) && (
                              <button
                                className="success-btn small-btn"
                                onClick={() => openPublishModal(assignment)}
                              >
                                Publish
                              </button>
                            )}

                          {["Published"].includes(assignment.status) && (
                            <button
                              className="danger-btn small-btn"
                              onClick={() => handleCloseAssignment(assignment)}
                            >
                              Close
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

        {showForm && (
          <div className="modal-overlay">
            <div className="assignment-modal">
              <div className="modal-header">
                <div>
                  <h2>{editingAssignment ? "Edit Assignment" : "Create Assignment"}</h2>
                  <p>
                    Assignments are created as Draft and must be reviewed before students can view them.
                  </p>
                </div>

                <button className="close-btn" onClick={closeFormModal}>
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Course Batch</label>
                    <select
                      name="course_batch_id"
                      value={form.course_batch_id}
                      onChange={handleFormChange}
                      required
                      disabled={!!editingAssignment}
                    >
                      <option value="">Select Batch</option>
                      {batches.map((batch) => (
                        <option key={batch.id} value={batch.id}>
                          {batch.batch_code} - {batch.batch_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Max Marks</label>
                    <input
                      name="max_marks"
                      type="number"
                      min="1"
                      value={form.max_marks}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Assignment Title</label>
                    <input
                      name="title"
                      value={form.title}
                      onChange={handleFormChange}
                      placeholder="Assignment 01 - System Design"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Due Date</label>
                    <input
                      name="due_date"
                      type="datetime-local"
                      value={form.due_date}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleFormChange}
                      placeholder="Short assignment description..."
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Instructions</label>
                    <textarea
                      name="instructions"
                      value={form.instructions}
                      onChange={handleFormChange}
                      placeholder="Write clear assignment instructions..."
                      required
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Attachment</label>
                    <input
                      name="attachment"
                      type="file"
                      accept=".pdf,.docx,.pptx,.zip"
                      onChange={handleFormChange}
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="secondary-btn" onClick={closeFormModal}>
                    Cancel
                  </button>

                  <button type="submit" className="primary-btn" disabled={formLoading}>
                    {formLoading
                      ? "Saving..."
                      : editingAssignment
                      ? "Update Assignment"
                      : "Create Draft"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showPublishModal && selectedAssignment && (
          <div className="modal-overlay">
            <div className="assignment-modal small-modal">
              <div className="modal-header">
                <div>
                  <h2>Publish Assignment</h2>
                  <p>{selectedAssignment.title}</p>
                </div>

                <button className="close-btn" onClick={closePublishModal}>
                  ×
                </button>
              </div>

              <form onSubmit={handlePublish}>
                <div className="form-group">
                  <label>Review Note</label>
                  <textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Instructions are clear and deadline is suitable."
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="secondary-btn" onClick={closePublishModal}>
                    Cancel
                  </button>

                  <button type="submit" className="success-btn" disabled={actionLoading}>
                    {actionLoading ? "Publishing..." : "Publish Assignment"}
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

export default LecturerAssignmentsPage;