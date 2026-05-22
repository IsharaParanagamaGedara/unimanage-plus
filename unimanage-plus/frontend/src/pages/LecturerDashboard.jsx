import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import StatCard from "../components/StatCard";
import { getLecturerDashboardSummary } from "../services/dashboardSummaryService";
import "./DashboardPages.css";

const LecturerDashboard = () => {
  const [summary, setSummary] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const data = await getLecturerDashboardSummary();
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
    </DashboardLayout>
  );
};

export default LecturerDashboard;