import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import StatCard from "../components/StatCard";
import { getStudentDashboardSummary } from "../services/dashboardSummaryService";
import "./DashboardPages.css";

const StudentDashboard = () => {
  const [summary, setSummary] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const data = await getStudentDashboardSummary();
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
    </DashboardLayout>
  );
};

export default StudentDashboard;