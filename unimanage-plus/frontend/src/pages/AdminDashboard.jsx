import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import StatCard from "../components/StatCard";
import { getAdminDashboardSummary } from "../services/dashboardSummaryService";
import "./DashboardPages.css";

const AdminDashboard = () => {
  const [summary, setSummary] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const data = await getAdminDashboardSummary();
        setSummary(data);
      } catch (err) {
        setError("Failed to load dashboard summary.");
      }
    };

    loadSummary();
  }, []);

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Monitor university operations, users, workflows, and system activity.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="stats-grid">
        <StatCard title="Total Users" value={summary.total_users || 0} subtitle="All system users" icon="👥" />
        <StatCard title="Total Students" value={summary.total_students || 0} subtitle="Registered students" icon="🎓" />
        <StatCard title="Total Lecturers" value={summary.total_lecturers || 0} subtitle="Academic staff" icon="👨‍🏫" />
        <StatCard title="Total Courses" value={summary.total_courses || 0} subtitle="Created courses" icon="📚" />
        <StatCard title="Course Batches" value={summary.total_batches || 0} subtitle="Available batches" icon="🗓️" />
        <StatCard title="Pending Applications" value={summary.pending_applications || 0} subtitle="Awaiting review" icon="📝" />
        <StatCard title="Active Enrollments" value={summary.active_enrollments || 0} subtitle="Approved enrollments" icon="✅" />
        <StatCard title="Pending Requests" value={summary.pending_service_requests || 0} subtitle="Service requests" icon="📩" />
        <StatCard title="Submissions" value={summary.total_submissions || 0} subtitle="Assignment submissions" icon="📤" />
        <StatCard title="Published Grades" value={summary.published_grades || 0} subtitle="Visible to students" icon="🎯" />
      </div>

      <div className="content-card">
        <h2>System Overview</h2>
        <p>
          UniManage Plus provides centralized academic management, workflow automation,
          analytics, reporting, notifications, audit logging, and secure role-based access.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;