import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { getCourses } from "../../services/adminCourseService";
import {
  getCourseBatches,
  createCourseBatch,
  updateCourseBatch,
  updateCourseBatchStatus,
  getBatchCoordinators,
} from "../../services/adminCourseBatchService";
import "./AdminCourseBatchesPage.css";

const initialForm = {
  course_id: "",
  coordinator_id: "",
  batch_code: "",
  batch_name: "",
  start_date: "",
  end_date: "",
  application_deadline: "",
  capacity: "",
  status: "Open",
};

const AdminCourseBatchesPage = () => {
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [coordinators, setCoordinators] = useState([]);

  const [filters, setFilters] = useState({
    search: "",
    course_id: "",
    status: "",
  });

  const [form, setForm] = useState(initialForm);
  const [editingBatch, setEditingBatch] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError("");

      const [batchData, courseData, coordinatorData] = await Promise.all([
        getCourseBatches(filters),
        getCourses({ status: "active" }),
        getBatchCoordinators(),
      ]);

      setBatches(batchData);
      setCourses(courseData);
      setCoordinators(coordinatorData);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load batch data.");
    } finally {
      setLoading(false);
    }
  };

  const loadBatches = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getCourseBatches(filters);
      setBatches(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load batches.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadBatches();
  }, [filters.course_id, filters.status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadBatches();
  };

  const handleFilterChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleFormChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const openCreateModal = () => {
    setEditingBatch(null);
    setForm(initialForm);
    setShowForm(true);
  };

  const openEditModal = (batch) => {
    setEditingBatch(batch);

    setForm({
      course_id: batch.course_id || "",
      coordinator_id: batch.coordinator_id || "",
      batch_code: batch.batch_code || "",
      batch_name: batch.batch_name || "",
      start_date: batch.start_date || "",
      end_date: batch.end_date || "",
      application_deadline: batch.application_deadline || "",
      capacity: batch.capacity || "",
      status: batch.status || "Open",
    });

    setShowForm(true);
  };

  const closeModal = () => {
    setShowForm(false);
    setEditingBatch(null);
    setForm(initialForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setFormLoading(true);
      setError("");
      setMessage("");

      const payload = {
        ...form,
        course_id: Number(form.course_id),
        coordinator_id: Number(form.coordinator_id),
        capacity: Number(form.capacity),
      };

      if (editingBatch) {
        await updateCourseBatch(editingBatch.id, payload);
        setMessage("Course batch updated successfully.");
      } else {
        await createCourseBatch(payload);
        setMessage("Course batch created successfully.");
      }

      closeModal();
      loadBatches();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save course batch.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async (batch) => {
    const confirmMessage = batch.is_active
      ? "Are you sure you want to deactivate this course batch?"
      : "Are you sure you want to activate this course batch?";

    if (!window.confirm(confirmMessage)) return;

    try {
      setError("");
      setMessage("");

      await updateCourseBatchStatus(batch.id, !batch.is_active);

      setMessage(
        batch.is_active
          ? "Course batch deactivated successfully."
          : "Course batch activated successfully."
      );

      loadBatches();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update batch status.");
    }
  };

  return (
    <DashboardLayout>
      <div className="admin-batches-page">
        <div className="page-header-row">
          <div>
            <h1>Course Batch Management</h1>
            <p>
              Manage course intakes, capacity, application deadlines, and course coordinators.
            </p>
          </div>

          <button className="primary-btn" onClick={openCreateModal}>
            + Add Batch
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <div className="batch-summary-grid">
          <div className="summary-card">
            <span>Total Batches</span>
            <strong>{batches.length}</strong>
          </div>

          <div className="summary-card">
            <span>Open Batches</span>
            <strong>{batches.filter((batch) => batch.status === "Open").length}</strong>
          </div>

          <div className="summary-card">
            <span>Active Batches</span>
            <strong>{batches.filter((batch) => batch.is_active).length}</strong>
          </div>

          <div className="summary-card">
            <span>Total Capacity</span>
            <strong>
              {batches.reduce((total, batch) => total + Number(batch.capacity || 0), 0)}
            </strong>
          </div>
        </div>

        <div className="filter-card">
          <form onSubmit={handleSearchSubmit} className="batch-filter-grid">
            <input
              name="search"
              type="text"
              placeholder="Search by batch, course, or coordinator..."
              value={filters.search}
              onChange={handleFilterChange}
            />

            <select
              name="course_id"
              value={filters.course_id}
              onChange={handleFilterChange}
            >
              <option value="">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.course_code} - {course.course_name}
                </option>
              ))}
            </select>

            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">All Status</option>
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
              <option value="Completed">Completed</option>
            </select>

            <button className="secondary-btn" type="submit">
              Search
            </button>
          </form>
        </div>

        <div className="table-card">
          {loading ? (
            <p className="table-message">Loading course batches...</p>
          ) : batches.length === 0 ? (
            <p className="table-message">No course batches found.</p>
          ) : (
            <div className="table-responsive">
              <table className="batches-table">
                <thead>
                  <tr>
                    <th>Batch</th>
                    <th>Course</th>
                    <th>Coordinator</th>
                    <th>Dates</th>
                    <th>Deadline</th>
                    <th>Capacity</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {batches.map((batch) => (
                    <tr key={batch.id}>
                      <td>
                        <div className="batch-name-cell">
                          <div className="batch-icon">
                            {batch.batch_code?.slice(0, 2)}
                          </div>

                          <div>
                            <strong>{batch.batch_name}</strong>
                            <span>{batch.batch_code}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        {batch.course ? (
                          <div>
                            <strong>{batch.course.course_code}</strong>
                            <span className="sub-text">{batch.course.course_name}</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td>
                        {batch.coordinator ? (
                          <div>
                            <strong>
                              {batch.coordinator.first_name} {batch.coordinator.last_name}
                            </strong>
                            <span className="sub-text">{batch.coordinator.email}</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td>
                        <span className="date-text">{batch.start_date}</span>
                        <span className="sub-text">to {batch.end_date}</span>
                      </td>

                      <td>{batch.application_deadline}</td>
                      <td>{batch.capacity}</td>

                      <td>
                        <div className="status-stack">
                          <span className={`batch-status ${batch.status?.toLowerCase()}`}>
                            {batch.status}
                          </span>

                          <span className={batch.is_active ? "status active" : "status inactive"}>
                            {batch.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="action-buttons">
                          <button
                            className="secondary-btn small-btn"
                            onClick={() => openEditModal(batch)}
                          >
                            Edit
                          </button>

                          <button
                            className={batch.is_active ? "danger-btn small-btn" : "success-btn small-btn"}
                            onClick={() => handleStatusChange(batch)}
                          >
                            {batch.is_active ? "Deactivate" : "Activate"}
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

        {showForm && (
          <div className="modal-overlay">
            <div className="batch-modal">
              <div className="modal-header">
                <div>
                  <h2>{editingBatch ? "Edit Course Batch" : "Create Course Batch"}</h2>
                  <p>
                    {editingBatch
                      ? "Update batch information and coordinator details."
                      : "Create a new course intake batch for student applications."}
                  </p>
                </div>

                <button className="close-btn" onClick={closeModal}>
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Course</label>
                    <select
                      name="course_id"
                      value={form.course_id}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Select Course</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.course_code} - {course.course_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Course Coordinator</label>
                    <select
                      name="coordinator_id"
                      value={form.coordinator_id}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Select Department Staff</option>
                      {coordinators.map((coordinator) => (
                        <option key={coordinator.id} value={coordinator.id}>
                          {coordinator.first_name} {coordinator.last_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Batch Code</label>
                    <input
                      name="batch_code"
                      value={form.batch_code}
                      onChange={handleFormChange}
                      placeholder="SE401-2026-JAN"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Batch Name</label>
                    <input
                      name="batch_name"
                      value={form.batch_name}
                      onChange={handleFormChange}
                      placeholder="January 2026 Intake"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Start Date</label>
                    <input
                      name="start_date"
                      type="date"
                      value={form.start_date}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>End Date</label>
                    <input
                      name="end_date"
                      type="date"
                      value={form.end_date}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Application Deadline</label>
                    <input
                      name="application_deadline"
                      type="date"
                      value={form.application_deadline}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Capacity</label>
                    <input
                      name="capacity"
                      type="number"
                      min="1"
                      value={form.capacity}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select name="status" value={form.status} onChange={handleFormChange}>
                      <option value="Open">Open</option>
                      <option value="Closed">Closed</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="secondary-btn" onClick={closeModal}>
                    Cancel
                  </button>

                  <button type="submit" className="primary-btn" disabled={formLoading}>
                    {formLoading
                      ? "Saving..."
                      : editingBatch
                      ? "Update Batch"
                      : "Create Batch"}
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

export default AdminCourseBatchesPage;