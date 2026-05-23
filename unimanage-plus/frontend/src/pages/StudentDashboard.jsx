import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import StatCard from "../components/StatCard";
import DashboardActivityCard from "../components/DashboardActivityCard";
import DashboardQuickAction from "../components/DashboardQuickAction";
import { getStudentDashboardSummary } from "../services/dashboardSummaryService";
import { getStudentDashboardActivity } from "../services/dashboardActivityService";
import "./DashboardPages.css";

const StudentDashboard = () => {
  const [summary, setSummary] = useState({});
  const [activity, setActivity] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [summaryData, activityData] = await Promise.all([
          getStudentDashboardSummary(),
          getStudentDashboardActivity(),
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
        <h1>Student Dashboard</h1>
        <p>View applications, enrollments, assignments, submissions, grades, and service requests.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="stats-grid">
        <StatCard title="My Applications" value={summary.my_applications || 0} subtitle="Course applications" icon="📝" />
        <StatCard title="My Enrollments" value={summary.active_enrollments || 0} subtitle="Active batches" icon="✅" />
        <StatCard title="Assignments" value={summary.available_assignments || 0} subtitle="Available tasks" icon="📚" />
        <StatCard title="My Submissions" value={summary.my_submissions || 0} subtitle="Submitted work" icon="📤" />
        <StatCard title="Published Grades" value={summary.published_grades || 0} subtitle="Approved results" icon="🎯" />
        <StatCard title="Service Requests" value={summary.service_requests || 0} subtitle="Submitted requests" icon="📩" />
      </div>

      <div className="dashboard-section">
        <div className="dashboard-section-title">
          <h2>Quick Actions</h2>
          <p>Access your academic tasks quickly.</p>
        </div>

        <div className="quick-actions-grid">
          <DashboardQuickAction icon="📚" title="Available Batches" description="Browse active course batches and apply." path="/student/available-batches" />
          <DashboardQuickAction icon="📁" title="Course Materials" description="Access materials for enrolled courses." path="/student/materials" />
          <DashboardQuickAction icon="📝" title="Assignments" description="View and submit published assignments." path="/student/assignments" />
          <DashboardQuickAction icon="🎯" title="My Grades" description="View published marks and lecturer feedback." path="/student/grades" />
        </div>
      </div>

      <div className="dashboard-section">
        <div className="dashboard-section-title">
          <h2>Recent Activity</h2>
          <p>Latest assignments, grades, and notifications.</p>
        </div>

        <div className="activity-grid">
          <DashboardActivityCard
            title="Recent Assignments"
            items={activity.recent_assignments || []}
            emptyMessage="No recent assignments found."
            renderItem={(item) => (
              <>
                <strong>{item.title}</strong>
                <span>{item.course_code} | {item.batch_code}</span>
                <span>Due: {item.due_date ? new Date(item.due_date).toLocaleString() : "-"}</span>
              </>
            )}
          />

          <DashboardActivityCard
            title="Recent Grades"
            items={activity.recent_grades || []}
            emptyMessage="No recent grades found."
            renderItem={(item) => (
              <>
                <strong>{item.assignment_title}</strong>
                <span>Marks: {item.marks}</span>
                <span>Status: {item.status}</span>
              </>
            )}
          />

          <DashboardActivityCard
            title="Recent Notifications"
            items={activity.recent_notifications || []}
            emptyMessage="No recent notifications found."
            renderItem={(item) => (
              <>
                <strong>{item.title}</strong>
                <span>{item.message}</span>
                <span>{item.created_at ? new Date(item.created_at).toLocaleString() : "-"}</span>
              </>
            )}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;