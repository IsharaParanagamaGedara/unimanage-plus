import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  getAvailableBatches,
  applyToBatch,
} from "../../services/studentCourseApplicationService";
import "./StudentApplications.css";

const AvailableBatchesPage = () => {
  const [batches, setBatches] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [applicationNote, setApplicationNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadBatches = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAvailableBatches(search);
      setBatches(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load available batches.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadBatches();
  };

  const openApplyModal = (batch) => {
    setSelectedBatch(batch);
    setApplicationNote("");
    setError("");
    setMessage("");
  };

  const closeApplyModal = () => {
    setSelectedBatch(null);
    setApplicationNote("");
  };

  const handleApply = async (e) => {
    e.preventDefault();

    try {
      setSubmitLoading(true);
      setError("");
      setMessage("");

      await applyToBatch({
        batch_id: selectedBatch.id,
        application_note: applicationNote,
      });

      setMessage("Course application submitted successfully.");
      closeApplyModal();
      loadBatches();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to submit application.");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="student-app-page">
        <div className="page-header-row">
          <div>
            <h1>Available Course Batches</h1>
            <p>Browse active course batches and submit applications for review.</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <div className="filter-card">
          <form onSubmit={handleSearchSubmit} className="student-search-grid">
            <input
              type="text"
              placeholder="Search by course code, course name, or batch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <button className="secondary-btn" type="submit">
              Search
            </button>
          </form>
        </div>

        {loading ? (
          <p className="table-message">Loading available batches...</p>
        ) : batches.length === 0 ? (
          <div className="empty-card">
            <h3>No available batches found</h3>
            <p>There are no active/open course batches available for application right now.</p>
          </div>
        ) : (
          <div className="batch-card-grid">
            {batches.map((batch) => (
              <div className="student-batch-card" key={batch.id}>
                <div className="batch-card-header">
                  <div className="course-badge">
                    {batch.course?.course_code}
                  </div>

                  <span className="status active">{batch.status}</span>
                </div>

                <h3>{batch.course?.course_name}</h3>
                <p>{batch.course?.description || "No course description available."}</p>

                <div className="batch-info-grid">
                  <div>
                    <span>Batch</span>
                    <strong>{batch.batch_name}</strong>
                  </div>

                  <div>
                    <span>Batch Code</span>
                    <strong>{batch.batch_code}</strong>
                  </div>

                  <div>
                    <span>Credits</span>
                    <strong>{batch.course?.credits}</strong>
                  </div>

                  <div>
                    <span>Available Seats</span>
                    <strong>{batch.available_seats}</strong>
                  </div>

                  <div>
                    <span>Start Date</span>
                    <strong>{batch.start_date}</strong>
                  </div>

                  <div>
                    <span>Deadline</span>
                    <strong>{batch.application_deadline}</strong>
                  </div>
                </div>

                <div className="coordinator-box">
                  <span>Coordinator</span>
                  <strong>
                    {batch.coordinator?.first_name} {batch.coordinator?.last_name}
                  </strong>
                </div>

                <button
                  className={`primary-btn ${batch.already_applied ? "disabled-btn" : ""}`}
                  disabled={batch.already_applied || batch.available_seats <= 0}
                  onClick={() => openApplyModal(batch)}
                >
                  {batch.already_applied
                    ? `Applied (${batch.application_status})`
                    : batch.available_seats <= 0
                    ? "Full"
                    : "Apply"}
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedBatch && (
          <div className="modal-overlay">
            <div className="student-application-modal">
              <div className="modal-header">
                <div>
                  <h2>Apply for Course Batch</h2>
                  <p>
                    {selectedBatch.course?.course_code} -{" "}
                    {selectedBatch.course?.course_name}
                  </p>
                </div>

                <button className="close-btn" onClick={closeApplyModal}>
                  ×
                </button>
              </div>

              <form onSubmit={handleApply}>
                <div className="application-summary">
                  <p>
                    <strong>Batch:</strong> {selectedBatch.batch_name}
                  </p>
                  <p>
                    <strong>Deadline:</strong> {selectedBatch.application_deadline}
                  </p>
                  <p>
                    <strong>Available Seats:</strong> {selectedBatch.available_seats}
                  </p>
                </div>

                <div className="form-group">
                  <label>Application Note</label>
                  <textarea
                    value={applicationNote}
                    onChange={(e) => setApplicationNote(e.target.value)}
                    placeholder="Write a short note for your application..."
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="secondary-btn" onClick={closeApplyModal}>
                    Cancel
                  </button>

                  <button type="submit" className="primary-btn" disabled={submitLoading}>
                    {submitLoading ? "Submitting..." : "Submit Application"}
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

export default AvailableBatchesPage;