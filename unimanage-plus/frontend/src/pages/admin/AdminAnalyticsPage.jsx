import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import DashboardLayout from "../../layouts/DashboardLayout";
import { getAdminAnalyticsOverview } from "../../services/adminAnalyticsService";
import "./AdminAnalyticsPage.css";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2"];

const kpiLabels = {
  total_students: "Total Students",
  total_lecturers: "Total Lecturers",
  total_courses: "Total Courses",
  total_batches: "Total Batches",
  pending_applications: "Pending Applications",
  approved_enrollments: "Approved Enrollments",
  pending_service_requests: "Pending Service Requests",
  published_assignments: "Published Assignments",
  total_submissions: "Total Submissions",
  published_grades: "Published Grades",
};

const AdminAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminAnalyticsOverview();
      setAnalytics(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const formatStatusData = (items = []) =>
    items.map((item) => ({
      name: item.status,
      value: item.count,
    }));

  const formatCoursePopularity = (items = []) =>
    items.map((item) => ({
      name: item.course_code,
      enrollments: item.enrollment_count,
      course_name: item.course_name,
    }));

  return (
    <DashboardLayout>
      <div className="admin-analytics-page">
        <div className="page-header-row">
          <div>
            <h1>Analytics Dashboard</h1>
            <p>Monitor academic activity, service workflows, assignments, grades, and enrollments.</p>
          </div>

          <button className="primary-btn" onClick={loadAnalytics}>
            Refresh
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <p className="table-message">Loading analytics...</p>
        ) : analytics ? (
          <>
            <div className="analytics-kpi-grid">
              {Object.entries(analytics.kpis || {}).map(([key, value]) => (
                <div className="analytics-kpi-card" key={key}>
                  <span>{kpiLabels[key] || key}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>

            <div className="analytics-chart-grid">
              <div className="chart-card">
                <h3>Applications by Status</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={formatStatusData(analytics.charts?.applications_by_status)}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={90}
                      label
                    >
                      {formatStatusData(analytics.charts?.applications_by_status).map(
                        (_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        )
                      )}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h3>Service Requests by Status</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={formatStatusData(analytics.charts?.service_requests_by_status)}>
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h3>Assignments by Status</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={formatStatusData(analytics.charts?.assignments_by_status)}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={90}
                      label
                    >
                      {formatStatusData(analytics.charts?.assignments_by_status).map(
                        (_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        )
                      )}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h3>Grades by Status</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={formatStatusData(analytics.charts?.grades_by_status)}>
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#16a34a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card full-width-chart">
                <h3>Course Popularity by Enrollment Count</h3>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={formatCoursePopularity(analytics.charts?.course_popularity)}>
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip
                      formatter={(value, name, item) => [
                        value,
                        `${item.payload.course_name}`,
                      ]}
                    />
                    <Bar dataKey="enrollments" fill="#7c3aed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : (
          <p className="table-message">No analytics data found.</p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminAnalyticsPage;