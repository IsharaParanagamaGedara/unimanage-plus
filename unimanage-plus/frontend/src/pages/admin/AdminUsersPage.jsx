import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  getUsers,
  getRoles,
  getDepartments,
  createUser,
  updateUserStatus,
} from "../../services/adminUserService";
import "./AdminUsersPage.css";

const initialForm = {
  first_name: "",
  last_name: "",
  role_id: "",
  department_id: "",
  phone: "",
  gender: "",
  address: "",
  programme_name: "",
  year_of_study: "",
  qualification: "",
  specialization: "",
  job_title: "",
  office_location: "",
};

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [filters, setFilters] = useState({
    search: "",
    role_id: "",
    status: "",
  });

  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [credentials, setCredentials] = useState(null);

  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selectedRole = roles.find((role) => String(role.id) === String(form.role_id));

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError("");

      const [userData, roleData, departmentData] = await Promise.all([
        getUsers(filters),
        getRoles(),
        getDepartments(),
      ]);

      setUsers(userData);
      setRoles(roleData);
      setDepartments(departmentData);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const userData = await getUsers(filters);
      setUsers(userData);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [filters.role_id, filters.status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadUsers();
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

  const resetForm = () => {
    setForm(initialForm);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    try {
      setFormLoading(true);
      setError("");
      setMessage("");
      setCredentials(null);

      const payload = {
        ...form,
        role_id: Number(form.role_id),
        department_id: form.department_id ? Number(form.department_id) : null,
        year_of_study: form.year_of_study ? Number(form.year_of_study) : null,
      };

      const result = await createUser(payload);

      setCredentials(result.credentials);
      setMessage("User account created successfully.");
      setShowForm(false);
      resetForm();
      loadUsers();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create user.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async (user) => {
    const confirmMessage = user.is_active
      ? "Are you sure you want to deactivate this user?"
      : "Are you sure you want to activate this user?";

    if (!window.confirm(confirmMessage)) return;

    try {
      setError("");
      setMessage("");

      await updateUserStatus(user.id, !user.is_active);

      setMessage(
        user.is_active
          ? "User deactivated successfully."
          : "User activated successfully."
      );

      loadUsers();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update user status.");
    }
  };

  return (
    <DashboardLayout>
      <div className="admin-users-page">
        <div className="page-header-row">
          <div>
            <h1>User Management</h1>
            <p>Create, view, search, filter, activate, and deactivate system users.</p>
          </div>

          <button className="primary-btn" onClick={() => setShowForm(true)}>
            + Add User
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        {credentials && (
          <div className="credentials-card">
            <div>
              <h3>User Created Successfully</h3>
              <p>Share these credentials with the user. This password is shown only once.</p>
            </div>

            <div className="credentials-grid">
              <div>
                <span>Academic Email</span>
                <strong>{credentials.academic_email}</strong>
              </div>

              <div>
                <span>Temporary Password</span>
                <strong>{credentials.temporary_password}</strong>
              </div>
            </div>

            <button className="secondary-btn" onClick={() => setCredentials(null)}>
              Hide Credentials
            </button>
          </div>
        )}

        <div className="filter-card">
          <form onSubmit={handleSearchSubmit} className="filter-grid">
            <input
              name="search"
              type="text"
              placeholder="Search by name, email, or role..."
              value={filters.search}
              onChange={handleFilterChange}
            />

            <select name="role_id" value={filters.role_id} onChange={handleFilterChange}>
              <option value="">All Roles</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>

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
            <p className="table-message">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="table-message">No users found.</p>
          ) : (
            <div className="table-responsive">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar">
                            {user.first_name?.charAt(0)}
                            {user.last_name?.charAt(0)}
                          </div>

                          <div>
                            <strong>
                              {user.first_name} {user.last_name}
                            </strong>
                            <span>ID: {user.id}</span>
                          </div>
                        </div>
                      </td>

                      <td>{user.email}</td>
                      <td>{user.role?.name}</td>

                      <td>
                        <span className={user.is_active ? "status active" : "status inactive"}>
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td>
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString()
                          : "-"}
                      </td>

                      <td>
                        <button
                          className={user.is_active ? "danger-btn" : "success-btn"}
                          onClick={() => handleStatusChange(user)}
                        >
                          {user.is_active ? "Deactivate" : "Activate"}
                        </button>
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
            <div className="user-modal">
              <div className="modal-header">
                <div>
                  <h2>Create New User</h2>
                  <p>System will generate academic email and temporary password.</p>
                </div>

                <button className="close-btn" onClick={() => setShowForm(false)}>
                  ×
                </button>
              </div>

              <form onSubmit={handleCreateUser}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      name="first_name"
                      value={form.first_name}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      name="last_name"
                      value={form.last_name}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Role</label>
                    <select
                      name="role_id"
                      value={form.role_id}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Select Role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Department</label>
                    <select
                      name="department_id"
                      value={form.department_id}
                      onChange={handleFormChange}
                    >
                      <option value="">Select Department</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleFormChange}
                    />
                  </div>

                  {selectedRole?.name === "Student" && (
                    <>
                      <div className="form-group">
                        <label>Gender</label>
                        <select name="gender" value={form.gender} onChange={handleFormChange}>
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Programme Name</label>
                        <input
                          name="programme_name"
                          value={form.programme_name}
                          onChange={handleFormChange}
                        />
                      </div>

                      <div className="form-group">
                        <label>Year of Study</label>
                        <input
                          name="year_of_study"
                          type="number"
                          min="1"
                          max="6"
                          value={form.year_of_study}
                          onChange={handleFormChange}
                        />
                      </div>

                      <div className="form-group full-width">
                        <label>Address</label>
                        <textarea
                          name="address"
                          value={form.address}
                          onChange={handleFormChange}
                        />
                      </div>
                    </>
                  )}

                  {selectedRole?.name === "Lecturer" && (
                    <>
                      <div className="form-group">
                        <label>Qualification</label>
                        <input
                          name="qualification"
                          value={form.qualification}
                          onChange={handleFormChange}
                        />
                      </div>

                      <div className="form-group">
                        <label>Specialization</label>
                        <input
                          name="specialization"
                          value={form.specialization}
                          onChange={handleFormChange}
                        />
                      </div>

                      <div className="form-group">
                        <label>Office Location</label>
                        <input
                          name="office_location"
                          value={form.office_location}
                          onChange={handleFormChange}
                        />
                      </div>
                    </>
                  )}

                  {selectedRole?.name === "Department Staff" && (
                    <>
                      <div className="form-group">
                        <label>Job Title</label>
                        <input
                          name="job_title"
                          value={form.job_title}
                          onChange={handleFormChange}
                        />
                      </div>

                      <div className="form-group">
                        <label>Office Location</label>
                        <input
                          name="office_location"
                          value={form.office_location}
                          onChange={handleFormChange}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>

                  <button type="submit" className="primary-btn" disabled={formLoading}>
                    {formLoading ? "Creating..." : "Create User"}
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

export default AdminUsersPage;