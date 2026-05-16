import DashboardLayout from "../layouts/DashboardLayout";
import StatCard from "../components/StatCard";
import "./DashboardPages.css";

const StudentDashboard = () => {
  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Student Dashboard</h1>
        <p>View courses, enrollments, assignments, grades, and service requests.</p>
      </div>

      <div className="stats-grid">
        <StatCard title="My Courses" value="0" subtitle="Current enrollments" icon="📚" />
        <StatCard title="Assignments" value="0" subtitle="Available tasks" icon="📝" />
        <StatCard title="Service Requests" value="0" subtitle="Submitted requests" icon="📩" />
        <StatCard title="Notifications" value="0" subtitle="Unread alerts" icon="🔔" />
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;