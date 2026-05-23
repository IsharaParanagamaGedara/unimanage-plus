import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import StatCard from "../components/StatCard";
import DashboardActivityCard from "../components/DashboardActivityCard";
import DashboardQuickAction from "../components/DashboardQuickAction";
import { getLecturerDashboardSummary } from "../services/dashboardSummaryService";
import { getLecturerDashboardActivity } from "../services/dashboardActivityService";
import "./DashboardPages.css";

const LecturerDashboard = () => {
  const [summary, setSummary] = useState({});
  const [activity, setActivity] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [summaryData, activityData] = await Promise.all([
          getLecturerDashboardSummary(),
          getLecturerDashboardActivity(),
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
        <h1>Lecturer Dashboard</h1>
        <p>Manage assignments, student submissions, draft grades, and feedback.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="stats-grid">
        <StatCard title="My Assignments" value={summary.my_assignments || 0} subtitle="Created assignments" icon="📝" />
        <StatCard title="Published Assignments" value={summary.published_assignments || 0} subtitle="Visible to students" icon="📢" />
        <StatCard title="Submissions" value={summary.total_submissions || 0} subtitle="Student uploads" icon="📤" />
        <StatCard title="Draft Grades" value={summary.draft_grades || 0} subtitle="Not submitted yet" icon="📝" />
        <StatCard title="Pending Approval" value={summary.pending_approval_grades || 0} subtitle="Awaiting coordinator review" icon="⏳" />
        <StatCard title="Published Grades" value={summary.published_grades || 0} subtitle="Visible to students" icon="🎯" />
      </div>

      <div className="dashboard-section">
        <div className="dashboard-section-title">
          <h2>Quick Actions</h2>
          <p>Access your teaching and grading workflows quickly.</p>
        </div>

        <div className="quick-actions-grid">
          <DashboardQuickAction icon="📚" title="My Courses" description="View your assigned courses and related academic content." path="/lecturer/courses" />
          <DashboardQuickAction icon="📁" title="Course Materials" description="Upload and manage course learning materials." path="/lecturer/materials" />
          <DashboardQuickAction icon="📝" title="Assignments" description="Create assignments and submit them for review." path="/lecturer/assignments" />
          <DashboardQuickAction icon="📤" title="Submissions" description="Review submissions and create draft grades." path="/lecturer/submissions" />
        </div>
      </div>

      <div className="dashboard-section">
        <div className="dashboard-section-title">
          <h2>Recent Activity</h2>
          <p>Latest submissions, draft grades, and assignments.</p>
        </div>

        <div className="activity-grid">
          <DashboardActivityCard
            title="Recent Submissions"
            items={activity.recent_submissions || []}
            emptyMessage="No recent submissions found."
            renderItem={(item) => (
              <>
                <strong>{item.student_name}</strong>
                <span>{item.assignment_title}</span>
                <span>Status: {item.status}</span>
              </>
            )}
          />

          <DashboardActivityCard
            title="Recent Draft Grades"
            items={activity.recent_draft_grades || []}
            emptyMessage="No recent draft grades found."
            renderItem={(item) => (
              <>
                <strong>{item.student_name}</strong>
                <span>{item.assignment_title}</span>
                <span>Marks: {item.marks} | Status: {item.status}</span>
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
    </DashboardLayout>
  );
};

export default LecturerDashboard;