import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  createServiceRequest,
  getMyServiceRequests,
  getServiceRequestDetail,
} from "../../services/studentServiceRequestService";
import "./StudentServiceRequestsPage.css";

const requestTypes = [
  "Transcript Request",
  "Academic Letter Request",
  "Course Change Request",
  "Exam Issue Request",
  "Technical Support Request",
  "Other",
];

const priorities = ["Low", "Normal", "High", "Urgent"];

const initialForm = {
  request_type: "",
  subject: "",
  description: "",
  priority: "Normal",
};

const StudentServiceRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    request_type: "",
  });

  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMyServiceRequests(filters);
      setRequests(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load service requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [filters.status, filters.request_type]);

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
    setForm(initialForm);
    setShowForm(true);
    setError("");
    setMessage("");
  };

  const closeCreateModal = () => {
    setShowForm(false);
    setForm(initialForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setFormLoading(true);
      setError("");
      setMessage("");

      await createServiceRequest(form);

      setMessage("Service request submitted successfully.");
      closeCreateModal();
      loadRequests();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to submit request.");
    } finally {
      setFormLoading(false);
    }
  };

  const openDetailModal = async (requestId) => {
    try {
      setDetailLoading(true);
      setError("");

      const data = await getServiceRequestDetail(requestId);
      setSelectedRequest(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load request details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setSelectedRequest(null);
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

  return (
    <DashboardLayout>
      <div className="student-service-page">
        <div className="page-header-row">
          <div>
            <h1>Service Requests</h1>
            <p>Submit and track university service requests such as transcripts and support issues.</p>
          </div>

          <button className="primary-btn" onClick={openCreateModal}>
            + New Request
          </button>
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
          <div className="service-filter-grid">
            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <select
              name="request_type"
              value={filters.request_type}
              onChange={handleFilterChange}
            >
              <option value="">All Request Types</option>
              {requestTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-card">
          {loading ? (
            <p className="table-message">Loading service requests...</p>
          ) : requests.length === 0 ? (
            <p className="table-message">No service requests found.</p>
          ) : (
            <div className="table-responsive">
              <table className="service-table">
                <thead>
                  <tr>
                    <th>Request</th>
                    <th>Type</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Assigned To</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {requests.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.subject}</strong>
                        <span className="sub-text">#{item.id}</span>
                      </td>

                      <td>{item.request_type}</td>

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
                        <button
                          className="secondary-btn small-btn"
                          onClick={() => openDetailModal(item.id)}
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

        {showForm && (
          <div className="modal-overlay">
            <div className="service-modal">
              <div className="modal-header">
                <div>
                  <h2>Submit Service Request</h2>
                  <p>Provide request details for administrative review.</p>
                </div>

                <button className="close-btn" onClick={closeCreateModal}>×</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Request Type</label>
                    <select
                      name="request_type"
                      value={form.request_type}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Select Request Type</option>
                      {requestTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Priority</label>
                    <select
                      name="priority"
                      value={form.priority}
                      onChange={handleFormChange}
                      required
                    >
                      {priorities.map((priority) => (
                        <option key={priority} value={priority}>{priority}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label>Subject</label>
                    <input
                      name="subject"
                      value={form.subject}
                      onChange={handleFormChange}
                      placeholder="Request for academic transcript"
                      required
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleFormChange}
                      placeholder="Explain your request clearly..."
                      required
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="secondary-btn" onClick={closeCreateModal}>
                    Cancel
                  </button>

                  <button type="submit" className="primary-btn" disabled={formLoading}>
                    {formLoading ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {selectedRequest && (
          <div className="modal-overlay">
            <div className="service-modal large-modal">
              <div className="modal-header">
                <div>
                  <h2>Request Details</h2>
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
                      <span>Submitted</span>
                      <strong>
                        {selectedRequest.submitted_at
                          ? new Date(selectedRequest.submitted_at).toLocaleString()
                          : "-"}
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
      </div>
    </DashboardLayout>
  );
};

export default StudentServiceRequestsPage;