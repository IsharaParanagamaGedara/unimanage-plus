import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import StatCard from "../components/StatCard";
import { getStaffDashboardSummary } from "../services/dashboardSummaryService";
import "./DashboardPages.css";

const StaffDashboard = () => {
  const [summary, setSummary] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const data = await getStaffDashboardSummary();
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
    </DashboardLayout>
  );
};

export default StaffDashboard;