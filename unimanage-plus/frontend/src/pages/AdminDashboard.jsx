import DashboardLayout from "../layouts/DashboardLayout";
import StatCard from "../components/StatCard";
import "./DashboardPages.css";

const AdminDashboard = () => {
  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Monitor university operations, users, workflows, and system activity.</p>
      </div>

      <div className="stats-grid">
        <StatCard title="Total Students" value="0" subtitle="Registered students" icon="🎓" />
        <StatCard title="Total Lecturers" value="0" subtitle="Academic staff" icon="👨‍🏫" />
        <StatCard title="Active Courses" value="0" subtitle="Available courses" icon="📚" />
        <StatCard title="Pending Requests" value="0" subtitle="Awaiting review" icon="📝" />
      </div>

      <div className="content-card">
        <h2>System Overview</h2>
        <p>
          UniManage Plus provides centralized academic management, workflow automation,
          analytics, reporting, and secure role-based access.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;