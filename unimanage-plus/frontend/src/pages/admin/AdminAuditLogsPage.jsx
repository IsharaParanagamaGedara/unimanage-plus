import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  getAuditLogs,
  getAuditLogActions,
  getAuditLogById,
} from "../../services/adminAuditLogService";
import "./AdminAuditLogsPage.css";

const initialFilters = {
  search: "",
  action: "",
  user_id: "",
  start_date: "",
  end_date: "",
  month: "",
  year: "",
};

const AdminAuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [actions, setActions] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [selectedLog, setSelectedLog] = useState(null);

  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  const loadActions = async () => {
    try {
      const data = await getAuditLogActions();
      setActions(data);
    } catch (err) {
      setError("Failed to load audit actions.");
    }
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAuditLogs(filters);
      setLogs(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActions();
    loadLogs();
  }, []);

  const handleFilterChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadLogs();
  };

  const clearFilters = () => {
    setFilters(initialFilters);
  };

  const openDetailModal = async (logId) => {
    try {
      setDetailLoading(true);
      setError("");

      const data = await getAuditLogById(logId);
      setSelectedLog(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load audit log detail.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setSelectedLog(null);
  };

  return (
    <DashboardLayout>
      <div className="admin-audit-page">
        <div className="page-header-row">
          <div>
            <h1>Audit Logs</h1>
            <p>Review system actions, user activity, and workflow changes for accountability.</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="audit-summary-grid">
          <div className="summary-card">
            <span>Total Logs</span>
            <strong>{logs.length}</strong>
          </div>

          <div className="summary-card">
            <span>Unique Actions</span>
            <strong>{actions.length}</strong>
          </div>
        </div>

        <div className="filter-card">
          <form onSubmit={handleSearchSubmit}>
            <div className="audit-filter-grid">
              <div className="form-group">
                <label>Search</label>
                <input
                  name="search"
                  type="text"
                  placeholder="Search action, user, email, description..."
                  value={filters.search}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="form-group">
                <label>Action</label>
                <select
                  name="action"
                  value={filters.action}
                  onChange={handleFilterChange}
                >
                  <option value="">All Actions</option>
                  {actions.map((action) => (
                    <option key={action} value={action}>
                      {action}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>User ID</label>
                <input
                  name="user_id"
                  type="number"
                  placeholder="User ID"
                  value={filters.user_id}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="form-group">
                <label>Start Date</label>
                <input
                  name="start_date"
                  type="date"
                  value={filters.start_date}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="form-group">
                <label>End Date</label>
                <input
                  name="end_date"
                  type="date"
                  value={filters.end_date}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="form-group">
                <label>Month</label>
                <select
                  name="month"
                  value={filters.month}
                  onChange={handleFilterChange}
                >
                  <option value="">All Months</option>
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
              </div>

              <div className="form-group">
                <label>Year</label>
                <input
                  name="year"
                  type="number"
                  placeholder="2026"
                  value={filters.year}
                  onChange={handleFilterChange}
                />
              </div>
            </div>

            <div className="filter-actions">
              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? "Loading..." : "Apply Filters"}
              </button>

              <button type="button" className="secondary-btn" onClick={clearFilters}>
                Clear Filters
              </button>
            </div>
          </form>
        </div>

        <div className="table-card">
          {loading ? (
            <p className="table-message">Loading audit logs...</p>
          ) : logs.length === 0 ? (
            <p className="table-message">No audit logs found.</p>
          ) : (
            <div className="table-responsive">
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Action</th>
                    <th>Description</th>
                    <th>User</th>
                    <th>Role</th>
                    <th>Date/Time</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>#{log.id}</td>

                      <td>
                        <span className="action-pill">{log.action}</span>
                      </td>

                      <td className="description-cell">{log.description}</td>

                      <td>
                        {log.user ? (
                          <>
                            <strong>
                              {log.user.first_name} {log.user.last_name}
                            </strong>
                            <span className="sub-text">{log.user.email}</span>
                          </>
                        ) : (
                          <span className="sub-text">System / Unknown</span>
                        )}
                      </td>

                      <td>{log.user?.role || "-"}</td>

                      <td>
                        {log.created_at
                          ? new Date(log.created_at).toLocaleString()
                          : "-"}
                      </td>

                      <td>
                        <button
                          className="secondary-btn small-btn"
                          onClick={() => openDetailModal(log.id)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedLog && (
          <div className="modal-overlay">
            <div className="audit-modal">
              <div className="modal-header">
                <div>
                  <h2>Audit Log Detail</h2>
                  <p>Log #{selectedLog.id}</p>
                </div>

                <button className="close-btn" onClick={closeDetailModal}>
                  ×
                </button>
              </div>

              {detailLoading ? (
                <p className="table-message">Loading detail...</p>
              ) : (
                <>
                  <div className="detail-grid">
                    <div>
                      <span>Action</span>
                      <strong>{selectedLog.action}</strong>
                    </div>

                    <div>
                      <span>Date/Time</span>
                      <strong>
                        {selectedLog.created_at
                          ? new Date(selectedLog.created_at).toLocaleString()
                          : "-"}
                      </strong>
                    </div>

                    <div>
                      <span>User</span>
                      <strong>
                        {selectedLog.user
                          ? `${selectedLog.user.first_name} ${selectedLog.user.last_name}`
                          : "System / Unknown"}
                      </strong>
                    </div>

                    <div>
                      <span>Role</span>
                      <strong>{selectedLog.user?.role || "-"}</strong>
                    </div>

                    <div>
                      <span>Email</span>
                      <strong>{selectedLog.user?.email || "-"}</strong>
                    </div>

                    <div>
                      <span>User ID</span>
                      <strong>{selectedLog.user_id || "-"}</strong>
                    </div>
                  </div>

                  <div className="description-box">
                    <h3>Description</h3>
                    <p>{selectedLog.description}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminAuditLogsPage;