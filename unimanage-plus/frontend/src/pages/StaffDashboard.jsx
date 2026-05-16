import DashboardLayout from "../layouts/DashboardLayout";
import StatCard from "../components/StatCard";
import "./DashboardPages.css";

const StaffDashboard = () => {
  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Department Staff Dashboard</h1>
        <p>Review student service requests and support academic operations.</p>
      </div>

      <div className="stats-grid">
        <StatCard title="Pending Requests" value="0" subtitle="Awaiting review" icon="📝" />
        <StatCard title="In Progress" value="0" subtitle="Currently handled" icon="⏳" />
        <StatCard title="Completed" value="0" subtitle="Resolved requests" icon="✅" />
        <StatCard title="Reports" value="0" subtitle="Available summaries" icon="📊" />
      </div>
    </DashboardLayout>
  );
};

export default StaffDashboard;