import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { getMyApplications } from "../../services/studentCourseApplicationService";
import "./StudentApplications.css";

const MyApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMyApplications();
      setApplications(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const getStatusClass = (status) => {
    if (status === "Approved") return "status active";
    if (status === "Rejected") return "status inactive";
    return "status pending";
  };

  return (
    <DashboardLayout>
      <div className="student-app-page">
        <div className="page-header-row">
          <div>
            <h1>My Course Applications</h1>
            <p>Track your course batch application status and review feedback.</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="table-card">
          {loading ? (
            <p className="table-message">Loading applications...</p>
          ) : applications.length === 0 ? (
            <p className="table-message">No course applications submitted yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="applications-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Batch</th>
                    <th>Status</th>
                    <th>Applied At</th>
                    <th>Review Note</th>
                    <th>Reviewer</th>
                  </tr>
                </thead>

                <tbody>
                  {applications.map((application) => (
                    <tr key={application.id}>
                      <td>
                        <strong>{application.batch?.course?.course_code}</strong>
                        <span className="sub-text">
                          {application.batch?.course?.course_name}
                        </span>
                      </td>

                      <td>
                        <strong>{application.batch?.batch_name}</strong>
                        <span className="sub-text">
                          {application.batch?.batch_code}
                        </span>
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

                      <td>{application.review_note || "-"}</td>

                      <td>
                        {application.reviewer ? (
                          <>
                            <strong>
                              {application.reviewer.first_name}{" "}
                              {application.reviewer.last_name}
                            </strong>
                            <span className="sub-text">
                              {application.reviewer.email}
                            </span>
                          </>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MyApplicationsPage;