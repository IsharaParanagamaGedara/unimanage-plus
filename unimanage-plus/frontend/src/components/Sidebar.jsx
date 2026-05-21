import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";
import "./Sidebar.css";

const linksByRole = {
  Admin: [
    { label: "Dashboard", path: "/admin/dashboard", icon: "🏠" },
    { label: "User Management", path: "/admin/users", icon: "👥" },
    { label: "Departments", path: "/admin/departments", icon: "🏢" },
    { label: "Courses", path: "/admin/courses", icon: "📚" },
    { label: "Course Batches", path: "/admin/course-batches", icon: "🗓️" },
    { label: "Applications", path: "/admin/course-applications", icon: "📝" },
    { label: "Service Requests", path: "/admin/service-requests", icon: "📩" },
    { label: "Assignments", path: "/admin/assignments", icon: "📝" },
    { label: "Submissions", path: "/admin/submissions", icon: "📤" },
    { label: "Grade Approval", path: "/admin/grade-approval", icon: "✅" },
    { label: "Analytics", path: "/admin/analytics", icon: "📊" },
    { label: "Reports", path: "/admin/reports", icon: "📄" },
    { label: "Audit Logs", path: "/admin/audit-logs", icon: "🛡️" },
  ],
  Lecturer: [
    { label: "Dashboard", path: "/lecturer/dashboard", icon: "🏠" },
    { label: "My Courses", path: "/lecturer/courses", icon: "📚" },
    { label: "Course Materials", path: "/lecturer/materials", icon: "📁" },
    { label: "Assignments", path: "/lecturer/assignments", icon: "📝" },
    { label: "Submissions", path: "/lecturer/submissions", icon: "📤" },
  ],
  Student: [
    { label: "Dashboard", path: "/student/dashboard", icon: "🏠" },
    { label: "Available Batches", path: "/student/available-batches", icon: "📚" },
    { label: "My Applications", path: "/student/applications", icon: "📝" },
    { label: "My Enrollments", path: "/student/enrollments", icon: "✅" },
    { label: "Course Materials", path: "/student/materials", icon: "📁" },
    { label: "Assignments", path: "/student/assignments", icon: "📝" },
    { label: "My Grades", path: "/student/grades", icon: "🎯" },
    { label: "Service Requests", path: "/student/service-requests", icon: "📩" },,
  ],
  "Department Staff": [
    { label: "Dashboard", path: "/staff/dashboard", icon: "🏠" },
    { label: "Applications", path: "/staff/course-applications", icon: "📝" },
    { label: "Course Materials", path: "/staff/materials", icon: "📁" },
    { label: "Service Requests", path: "/staff/service-requests", icon: "📩" },
    { label: "Assignments Review", path: "/staff/assignments", icon: "📝" },
    { label: "Grade Approval", path: "/staff/grade-approval", icon: "✅" },
    { label: "Students", path: "/staff/students", icon: "🎓" },
    { label: "Reports", path: "/staff/reports", icon: "📄" },
  ],
};

const Sidebar = () => {
  const { user } = useAuth();
  const links = linksByRole[user?.role] || [];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src={logo} alt="UniManage Plus Logo" className="sidebar-logo" />

        <div className="brand-text">
          <h2>UniManage</h2>
          <p>Plus</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            title={link.label}
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <span className="sidebar-icon">{link.icon}</span>
            <span className="sidebar-label">{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;