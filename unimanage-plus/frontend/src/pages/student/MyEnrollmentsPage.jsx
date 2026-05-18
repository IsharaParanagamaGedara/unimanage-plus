import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { getMyEnrollments } from "../../services/studentEnrollmentService";
import "./MyEnrollmentsPage.css";

const MyEnrollmentsPage = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadEnrollments = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMyEnrollments();
      setEnrollments(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load enrollments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnrollments();
  }, []);

  return (
    <DashboardLayout>
      <div className="student-enrollments-page">
        <div className="page-header-row">
          <div>
            <h1>My Enrollments</h1>
            <p>View your approved course batch enrollments and academic participation details.</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <p className="table-message">Loading enrollments...</p>
        ) : enrollments.length === 0 ? (
          <div className="empty-card">
            <h3>No enrollments found</h3>
            <p>Your approved course batch enrollments will appear here.</p>
          </div>
        ) : (
          <div className="enrollment-card-grid">
            {enrollments.map((enrollment) => (
              <div className="enrollment-card" key={enrollment.id}>
                <div className="enrollment-card-header">
                  <div className="course-badge">
                    {enrollment.batch?.course?.course_code}
                  </div>

                  <span className="status active">
                    {enrollment.enrollment_status}
                  </span>
                </div>

                <h3>{enrollment.batch?.course?.course_name}</h3>
                <p>
                  {enrollment.batch?.course?.description ||
                    "No course description available."}
                </p>

                <div className="enrollment-info-grid">
                  <div>
                    <span>Batch</span>
                    <strong>{enrollment.batch?.batch_name}</strong>
                  </div>

                  <div>
                    <span>Batch Code</span>
                    <strong>{enrollment.batch?.batch_code}</strong>
                  </div>

                  <div>
                    <span>Credits</span>
                    <strong>{enrollment.batch?.course?.credits}</strong>
                  </div>

                  <div>
                    <span>Enrolled Date</span>
                    <strong>
                      {enrollment.enrolled_at
                        ? new Date(enrollment.enrolled_at).toLocaleDateString()
                        : "-"}
                    </strong>
                  </div>

                  <div>
                    <span>Start Date</span>
                    <strong>{enrollment.batch?.start_date}</strong>
                  </div>

                  <div>
                    <span>End Date</span>
                    <strong>{enrollment.batch?.end_date}</strong>
                  </div>
                </div>

                <div className="coordinator-box">
                  <span>Course Coordinator</span>
                  <strong>
                    {enrollment.batch?.coordinator?.first_name}{" "}
                    {enrollment.batch?.coordinator?.last_name}
                  </strong>
                  <small>{enrollment.batch?.coordinator?.email}</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyEnrollmentsPage;