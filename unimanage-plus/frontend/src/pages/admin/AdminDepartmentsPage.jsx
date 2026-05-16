import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  updateDepartmentStatus,
} from "../../services/adminDepartmentService";
import "./AdminDepartmentsPage.css";

const initialForm = {
  name: "",
  code: "",
  description: "",
};

const AdminDepartmentsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
  });

  const [form, setForm] = useState(initialForm);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadDepartments = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getDepartments(filters);
      setDepartments(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load departments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, [filters.status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadDepartments();
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
    setEditingDepartment(null);
    setForm(initialForm);
    setShowForm(true);
  };

  const openEditModal = (department) => {
    setEditingDepartment(department);
    setForm({
      name: department.name || "",
      code: department.code || "",
      description: department.description || "",
    });
    setShowForm(true);
  };

  const closeModal = () => {
    setShowForm(false);
    setEditingDepartment(null);
    setForm(initialForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setFormLoading(true);
      setError("");
      setMessage("");

      if (editingDepartment) {
        await updateDepartment(editingDepartment.id, form);
        setMessage("Department updated successfully.");
      } else {
        await createDepartment(form);
        setMessage("Department created successfully.");
      }

      closeModal();
      loadDepartments();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save department.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async (department) => {
    const confirmMessage = department.is_active
      ? "Are you sure you want to deactivate this department?"
      : "Are you sure you want to activate this department?";

    if (!window.confirm(confirmMessage)) return;

    try {
      setError("");
      setMessage("");

      await updateDepartmentStatus(department.id, !department.is_active);

      setMessage(
        department.is_active
          ? "Department deactivated successfully."
          : "Department activated successfully."
      );

      loadDepartments();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update department status.");
    }
  };

  return (
    <DashboardLayout>
      <div className="admin-departments-page">
        <div className="page-header-row">
          <div>
            <h1>Department Management</h1>
            <p>Manage academic departments used across users, courses, reports, and workflows.</p>
          </div>

          <button className="primary-btn" onClick={openCreateModal}>
            + Add Department
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <div className="department-summary-grid">
          <div className="summary-card">
            <span>Total Departments</span>
            <strong>{departments.length}</strong>
          </div>

          <div className="summary-card">
            <span>Active</span>
            <strong>{departments.filter((d) => d.is_active).length}</strong>
          </div>

          <div className="summary-card">
            <span>Inactive</span>
            <strong>{departments.filter((d) => !d.is_active).length}</strong>
          </div>
        </div>

        <div className="filter-card">
          <form onSubmit={handleSearchSubmit} className="department-filter-grid">
            <input
              name="search"
              type="text"
              placeholder="Search by department name, code, or description..."
              value={filters.search}
              onChange={handleFilterChange}
            />

            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button className="secondary-btn" type="submit">
              Search
            </button>
          </form>
        </div>

        <div className="table-card">
          {loading ? (
            <p className="table-message">Loading departments...</p>
          ) : departments.length === 0 ? (
            <p className="table-message">No departments found.</p>
          ) : (
            <div className="table-responsive">
              <table className="departments-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Code</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {departments.map((department) => (
                    <tr key={department.id}>
                      <td>
                        <div className="department-name-cell">
                          <div className="department-icon">
                            {department.code?.slice(0, 2)}
                          </div>

                          <div>
                            <strong>{department.name}</strong>
                            <span>ID: {department.id}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="code-badge">{department.code}</span>
                      </td>

                      <td className="description-cell">
                        {department.description || "-"}
                      </td>

                      <td>
                        <span className={department.is_active ? "status active" : "status inactive"}>
                          {department.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td>
                        {department.created_at
                          ? new Date(department.created_at).toLocaleDateString()
                          : "-"}
                      </td>

                      <td>
                        <div className="action-buttons">
                          <button
                            className="secondary-btn small-btn"
                            onClick={() => openEditModal(department)}
                          >
                            Edit
                          </button>

                          <button
                            className={department.is_active ? "danger-btn small-btn" : "success-btn small-btn"}
                            onClick={() => handleStatusChange(department)}
                          >
                            {department.is_active ? "Deactivate" : "Activate"}
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
            <div className="department-modal">
              <div className="modal-header">
                <div>
                  <h2>{editingDepartment ? "Edit Department" : "Create Department"}</h2>
                  <p>
                    {editingDepartment
                      ? "Update department information."
                      : "Add a new academic department to the system."}
                  </p>
                </div>

                <button className="close-btn" onClick={closeModal}>
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Department Name</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleFormChange}
                      placeholder="School of Computing"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Department Code</label>
                    <input
                      name="code"
                      value={form.code}
                      onChange={handleFormChange}
                      placeholder="SOC"
                      required
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleFormChange}
                      placeholder="Brief description of the department..."
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="secondary-btn" onClick={closeModal}>
                    Cancel
                  </button>

                  <button type="submit" className="primary-btn" disabled={formLoading}>
                    {formLoading
                      ? "Saving..."
                      : editingDepartment
                      ? "Update Department"
                      : "Create Department"}
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

export default AdminDepartmentsPage;