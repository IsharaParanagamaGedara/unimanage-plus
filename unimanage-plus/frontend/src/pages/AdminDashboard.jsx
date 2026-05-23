import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import StatCard from "../components/StatCard";
import DashboardActivityCard from "../components/DashboardActivityCard";
import DashboardQuickAction from "../components/DashboardQuickAction";
import { getAdminDashboardSummary } from "../services/dashboardSummaryService";
import { getAdminDashboardActivity } from "../services/dashboardActivityService";
import "./DashboardPages.css";

const AdminDashboard = () => {
  const [summary, setSummary] = useState({});
  const [activity, setActivity] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [summaryData, activityData] = await Promise.all([
          getAdminDashboardSummary(),
          getAdminDashboardActivity(),
        ]);

        setSummary(summaryData);
        setActivity(activityData);
      } catch (err) {
        setError("Failed to load dashboard data.");
      }
    };

    loadDashboardData();
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

      <div className="dashboard-section">
        <div className="dashboard-section-title">
          <h2>Quick Actions</h2>
          <p>Access the most important admin workflows quickly.</p>
        </div>

        <div className="quick-actions-grid">
          <DashboardQuickAction icon="👥" title="Manage Users" description="Create and manage students, lecturers, staff, and admins." path="/admin/users" />
          <DashboardQuickAction icon="📚" title="Manage Courses" description="Create courses, assign lecturers, and manage course status." path="/admin/courses" />
          <DashboardQuickAction icon="🗓️" title="Course Batches" description="Create batches and assign department staff coordinators." path="/admin/course-batches" />
          <DashboardQuickAction icon="📄" title="Reports" description="Preview and export academic and workflow reports." path="/admin/reports" />
        </div>
      </div>

      <div className="dashboard-section">
        <div className="dashboard-section-title">
          <h2>Recent Activity</h2>
          <p>Latest system records and workflow updates.</p>
        </div>

        <div className="activity-grid">
          <DashboardActivityCard
            title="Recent Users"
            items={activity.recent_users || []}
            emptyMessage="No recent users found."
            renderItem={(item) => (
              <>
                <strong>{item.name}</strong>
                <span>{item.role} | {item.email}</span>
                <span>{item.created_at ? new Date(item.created_at).toLocaleString() : "-"}</span>
              </>
            )}
          />

          <DashboardActivityCard
            title="Recent Applications"
            items={activity.recent_applications || []}
            emptyMessage="No recent applications found."
            renderItem={(item) => (
              <>
                <strong>{item.student_name}</strong>
                <span>{item.course_code} | {item.batch_code}</span>
                <span>Status: {item.status}</span>
              </>
            )}
          />

          <DashboardActivityCard
            title="Recent Service Requests"
            items={activity.recent_service_requests || []}
            emptyMessage="No recent service requests found."
            renderItem={(item) => (
              <>
                <strong>{item.subject}</strong>
                <span>{item.request_type} | Priority: {item.priority}</span>
                <span>Status: {item.status}</span>
              </>
            )}
          />

          <DashboardActivityCard
            title="Recent Assignments"
            items={activity.recent_assignments || []}
            emptyMessage="No recent assignments found."
            renderItem={(item) => (
              <>
                <strong>{item.title}</strong>
                <span>{item.course_code} | {item.batch_code}</span>
                <span>Status: {item.status}</span>
              </>
            )}
          />
        </div>
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