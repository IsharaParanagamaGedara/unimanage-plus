import DashboardLayout from "../layouts/DashboardLayout";
import StatCard from "../components/StatCard";
import "./DashboardPages.css";

const LecturerDashboard = () => {
  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Lecturer Dashboard</h1>
        <p>Manage assigned courses, assignments, submissions, and feedback.</p>
      </div>

      <div className="stats-grid">
        <StatCard title="My Courses" value="0" subtitle="Assigned courses" icon="📚" />
        <StatCard title="Assignments" value="0" subtitle="Created assignments" icon="📝" />
        <StatCard title="Submissions" value="0" subtitle="Student uploads" icon="📤" />
        <StatCard title="Pending Grades" value="0" subtitle="Need review" icon="⭐" />
      </div>
    </DashboardLayout>
  );
};

export default LecturerDashboard;