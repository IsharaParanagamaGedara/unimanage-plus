import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import StatCard from "../components/StatCard";
import DashboardActivityCard from "../components/DashboardActivityCard";
import DashboardQuickAction from "../components/DashboardQuickAction";
import { getStaffDashboardSummary } from "../services/dashboardSummaryService";
import { getStaffDashboardActivity } from "../services/dashboardActivityService";
import "./DashboardPages.css";

const StaffDashboard = () => {
  const [summary, setSummary] = useState({});
  const [activity, setActivity] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [summaryData, activityData] = await Promise.all([
          getStaffDashboardSummary(),
          getStaffDashboardActivity(),
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
        <h1>Department Staff Dashboard</h1>
        <p>Review applications, coordinate batches, approve grades, and manage assigned workflows.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="stats-grid">
        <StatCard title="Assigned Batches" value={summary.assigned_batches || 0} subtitle="Coordinated batches" icon="🗓️" />
        <StatCard title="Pending Applications" value={summary.pending_applications || 0} subtitle="Awaiting review" icon="📝" />
        <StatCard title="Active Enrollments" value={summary.active_enrollments || 0} subtitle="Approved students" icon="✅" />
        <StatCard title="Assignment Reviews" value={summary.pending_assignment_reviews || 0} subtitle="Awaiting publish" icon="📚" />
        <StatCard title="Grade Approvals" value={summary.pending_grade_approvals || 0} subtitle="Pending approval" icon="🎯" />
        <StatCard title="Service Requests" value={summary.assigned_service_requests || 0} subtitle="Assigned to you" icon="📩" />
      </div>

      <div className="dashboard-section">
        <div className="dashboard-section-title">
          <h2>Quick Actions</h2>
          <p>Access your coordinator workflows quickly.</p>
        </div>

        <div className="quick-actions-grid">
          <DashboardQuickAction icon="📝" title="Applications" description="Review student course applications." path="/staff/course-applications" />
          <DashboardQuickAction icon="📚" title="Assignments Review" description="Review and publish assignments." path="/staff/assignments" />
          <DashboardQuickAction icon="✅" title="Grade Approval" description="Approve or return lecturer grades." path="/staff/grade-approval" />
          <DashboardQuickAction icon="📄" title="Reports" description="Preview and export staff reports." path="/staff/reports" />
        </div>
      </div>

      <div className="dashboard-section">
        <div className="dashboard-section-title">
          <h2>Recent Activity</h2>
          <p>Latest applications, grade approvals, and service requests.</p>
        </div>

        <div className="activity-grid">
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
            title="Recent Grade Activity"
            items={activity.recent_grade_approvals || []}
            emptyMessage="No recent grade activity found."
            renderItem={(item) => (
              <>
                <strong>{item.student_name}</strong>
                <span>{item.assignment_title}</span>
                <span>Marks: {item.marks} | Status: {item.status}</span>
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
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StaffDashboard;