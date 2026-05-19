import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  getServiceRequests,
  getServiceRequestDetail,
  updateServiceRequestStatus,
  getAssignableUsers,
} from "../../services/adminServiceRequestService";
import "./AdminServiceRequestsPage.css";

const requestTypes = [
  "Transcript Request",
  "Academic Letter Request",
  "Course Change Request",
  "Exam Issue Request",
  "Technical Support Request",
  "Other",
];

const priorities = ["Low", "Normal", "High", "Urgent"];

const statuses = [
  "Pending",
  "In Progress",
  "Approved",
  "Rejected",
  "Completed",
  "Cancelled",
];

const AdminServiceRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [assignableUsers, setAssignableUsers] = useState([]);

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    request_type: "",
    priority: "",
  });

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const [statusForm, setStatusForm] = useState({
    status: "",
    note: "",
    assigned_to: "",
  });

  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getServiceRequests(filters);
      setRequests(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load service requests.");
    } finally {
      setLoading(false);
    }
  };

  const loadAssignableUsers = async () => {
    try {
      const data = await getAssignableUsers();
      setAssignableUsers(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load assignable users.");
    }
  };

  useEffect(() => {
    loadRequests();
    loadAssignableUsers();
  }, []);

  useEffect(() => {
    loadRequests();
  }, [filters.status, filters.request_type, filters.priority]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadRequests();
  };

  const handleFilterChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const openDetailModal = async (requestId) => {
    try {
      setDetailLoading(true);
      setError("");

      const data = await getServiceRequestDetail(requestId);
      setSelectedRequest(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load request detail.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setSelectedRequest(null);
  };

  const openStatusModal = async (requestItem) => {
    try {
      setDetailLoading(true);
      setError("");
      setMessage("");

      const data = await getServiceRequestDetail(requestItem.id);
      setSelectedRequest(data);

      setStatusForm({
        status: "",
        note: "",
        assigned_to: data.assigned_to || "",
      });

      setShowStatusModal(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load request detail.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setStatusForm({
      status: "",
      note: "",
      assigned_to: "",
    });
  };

  const handleStatusFormChange = (e) => {
    setStatusForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();

    try {
      setStatusLoading(true);
      setError("");
      setMessage("");

      const payload = {
        status: statusForm.status,
        note: statusForm.note,
        assigned_to: statusForm.assigned_to
          ? Number(statusForm.assigned_to)
          : null,
      };

      await updateServiceRequestStatus(selectedRequest.id, payload);

      setMessage("Service request status updated successfully.");
      closeStatusModal();
      setSelectedRequest(null);
      loadRequests();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update request status.");
    } finally {
      setStatusLoading(false);
    }
  };

  const getStatusClass = (status) => {
    if (status === "Completed" || status === "Approved") return "status success";
    if (status === "Rejected" || status === "Cancelled") return "status danger";
    if (status === "In Progress") return "status progress";
    return "status pending";
  };

  const getPriorityClass = (priority) => {
    if (priority === "Urgent") return "priority urgent";
    if (priority === "High") return "priority high";
    if (priority === "Low") return "priority low";
    return "priority normal";
  };

  const isFinalized = (status) => {
    return ["Completed", "Rejected", "Cancelled"].includes(status);
  };

  return (
    <DashboardLayout>
      <div className="admin-service-page">
        <div className="page-header-row">
          <div>
            <h1>Service Request Management</h1>
            <p>
              Review, assign, and update student service requests with full status tracking.
            </p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <div className="service-summary-grid">
          <div className="summary-card">
            <span>Total Requests</span>
            <strong>{requests.length}</strong>
          </div>

          <div className="summary-card">
            <span>Pending</span>
            <strong>{requests.filter((r) => r.status === "Pending").length}</strong>
          </div>

          <div className="summary-card">
            <span>In Progress</span>
            <strong>{requests.filter((r) => r.status === "In Progress").length}</strong>
          </div>

          <div className="summary-card">
            <span>Completed</span>
            <strong>{requests.filter((r) => r.status === "Completed").length}</strong>
          </div>
        </div>

        <div className="filter-card">
          <form onSubmit={handleSearchSubmit} className="admin-service-filter-grid">
            <input
              name="search"
              type="text"
              placeholder="Search by subject, description, or request type..."
              value={filters.search}
              onChange={handleFilterChange}
            />

            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">All Status</option>
              {statuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            <select
              name="request_type"
              value={filters.request_type}
              onChange={handleFilterChange}
            >
              <option value="">All Types</option>
              {requestTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <select name="priority" value={filters.priority} onChange={handleFilterChange}>
              <option value="">All Priority</option>
              {priorities.map((priority) => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>

            <button className="secondary-btn" type="submit">
              Search
            </button>
          </form>
        </div>

        <div className="table-card">
          {loading ? (
            <p className="table-message">Loading service requests...</p>
          ) : requests.length === 0 ? (
            <p className="table-message">No service requests found.</p>
          ) : (
            <div className="table-responsive">
              <table className="admin-service-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Request</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Assigned To</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {requests.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="student-cell">
                          <div className="student-avatar">
                            {item.student?.first_name?.charAt(0)}
                            {item.student?.last_name?.charAt(0)}
                          </div>

                          <div>
                            <strong>
                              {item.student?.first_name} {item.student?.last_name}
                            </strong>
                            <span>{item.student?.student_number}</span>
                            <span>{item.student?.email}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <strong>{item.subject}</strong>
                        <span className="sub-text">{item.request_type}</span>
                        <span className="sub-text">#{item.id}</span>
                      </td>

                      <td>
                        <span className={getPriorityClass(item.priority)}>
                          {item.priority}
                        </span>
                      </td>

                      <td>
                        <span className={getStatusClass(item.status)}>
                          {item.status}
                        </span>
                      </td>

                      <td>
                        {item.submitted_at
                          ? new Date(item.submitted_at).toLocaleDateString()
                          : "-"}
                      </td>

                      <td>
                        {item.assigned_user ? (
                          <>
                            <strong>
                              {item.assigned_user.first_name} {item.assigned_user.last_name}
                            </strong>
                            <span className="sub-text">{item.assigned_user.role}</span>
                          </>
                        ) : (
                          <span className="sub-text">Not assigned</span>
                        )}
                      </td>

                      <td>
                        <div className="action-buttons">
                          <button
                            className="secondary-btn small-btn"
                            onClick={() => openDetailModal(item.id)}
                          >
                            View
                          </button>

                          <button
                            className={`primary-btn small-btn ${
                              isFinalized(item.status) ? "disabled-btn" : ""
                            }`}
                            disabled={isFinalized(item.status)}
                            onClick={() => openStatusModal(item)}
                            title={
                              isFinalized(item.status)
                                ? "Finalized requests cannot be updated"
                                : "Update request status"
                            }
                          >
                            Update
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

        {selectedRequest && !showStatusModal && (
          <div className="modal-overlay">
            <div className="service-modal large-modal">
              <div className="modal-header">
                <div>
                  <h2>Service Request Details</h2>
                  <p>{selectedRequest.subject}</p>
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
                        {selectedRequest.student?.first_name}{" "}
                        {selectedRequest.student?.last_name}
                      </strong>
                    </div>

                    <div>
                      <span>Student Number</span>
                      <strong>{selectedRequest.student?.student_number}</strong>
                    </div>

                    <div>
                      <span>Request Type</span>
                      <strong>{selectedRequest.request_type}</strong>
                    </div>

                    <div>
                      <span>Status</span>
                      <strong>{selectedRequest.status}</strong>
                    </div>

                    <div>
                      <span>Priority</span>
                      <strong>{selectedRequest.priority}</strong>
                    </div>

                    <div>
                      <span>Assigned To</span>
                      <strong>
                        {selectedRequest.assigned_user
                          ? `${selectedRequest.assigned_user.first_name} ${selectedRequest.assigned_user.last_name}`
                          : "Not assigned"}
                      </strong>
                    </div>
                  </div>

                  <div className="description-box">
                    <h3>Description</h3>
                    <p>{selectedRequest.description}</p>
                  </div>

                  {selectedRequest.resolution_note && (
                    <div className="description-box">
                      <h3>Resolution Note</h3>
                      <p>{selectedRequest.resolution_note}</p>
                    </div>
                  )}

                  <div className="status-log-section">
                    <h3>Status History</h3>

                    {selectedRequest.status_logs?.length === 0 ? (
                      <p className="table-message">No status logs found.</p>
                    ) : (
                      <div className="timeline">
                        {selectedRequest.status_logs?.map((log) => (
                          <div className="timeline-item" key={log.id}>
                            <div className="timeline-dot"></div>

                            <div className="timeline-content">
                              <strong>
                                {log.old_status || "Created"} → {log.new_status}
                              </strong>
                              <p>{log.note || "No note provided."}</p>
                              <span>
                                {log.changed_by?.first_name} {log.changed_by?.last_name} ·{" "}
                                {log.created_at
                                  ? new Date(log.created_at).toLocaleString()
                                  : "-"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {showStatusModal && selectedRequest && (
          <div className="modal-overlay">
            <div className="service-modal">
              <div className="modal-header">
                <div>
                  <h2>Update Request Status</h2>
                  <p>{selectedRequest.subject}</p>
                </div>

                <button className="close-btn" onClick={closeStatusModal}>×</button>
              </div>

              <form onSubmit={handleStatusSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>New Status</label>
                    <select
                      name="status"
                      value={statusForm.status}
                      onChange={handleStatusFormChange}
                      required
                    >
                      <option value="">Select Status</option>
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Assign To</label>
                    <select
                      name="assigned_to"
                      value={statusForm.assigned_to}
                      onChange={handleStatusFormChange}
                    >
                      <option value="">Not Assigned</option>
                      {assignableUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.first_name} {user.last_name} ({user.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label>Status Note</label>
                    <textarea
                      name="note"
                      value={statusForm.note}
                      onChange={handleStatusFormChange}
                      placeholder="Write a note explaining this status update..."
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={closeStatusModal}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-btn"
                    disabled={statusLoading}
                  >
                    {statusLoading ? "Saving..." : "Update Status"}
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

export default AdminServiceRequestsPage;