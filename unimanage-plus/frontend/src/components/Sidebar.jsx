import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Sidebar.css";

const linksByRole = {
  Admin: [
    { label: "Dashboard", path: "/admin/dashboard" },
    { label: "User Management", path: "/admin/users" },
    { label: "Departments", path: "/admin/departments" },
    { label: "Courses", path: "/admin/courses" },
    { label: "Enrollments", path: "/admin/enrollments" },
    { label: "Service Requests", path: "/admin/service-requests" },
    { label: "Analytics", path: "/admin/analytics" },
    { label: "Reports", path: "/admin/reports" },
    { label: "Audit Logs", path: "/admin/audit-logs" },
  ],
  Lecturer: [
    { label: "Dashboard", path: "/lecturer/dashboard" },
    { label: "My Courses", path: "/lecturer/courses" },
    { label: "Assignments", path: "/lecturer/assignments" },
    { label: "Submissions", path: "/lecturer/submissions" },
  ],
  Student: [
    { label: "Dashboard", path: "/student/dashboard" },
    { label: "Browse Courses", path: "/student/courses" },
    { label: "My Enrollments", path: "/student/enrollments" },
    { label: "Assignments", path: "/student/assignments" },
    { label: "Service Requests", path: "/student/service-requests" },
  ],
  "Department Staff": [
    { label: "Dashboard", path: "/staff/dashboard" },
    { label: "Service Requests", path: "/staff/service-requests" },
    { label: "Students", path: "/staff/students" },
    { label: "Reports", path: "/staff/reports" },
  ],
};

const Sidebar = ({ isOpen, closeSidebar }) => {
  const { user } = useAuth();
  const links = linksByRole[user?.role] || [];

  return (
    <>
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">U+</div>
          <div>
            <h2>UniManage</h2>
            <p>Plus</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={closeSidebar}
              className={({ isActive }) =>
                isActive ? "sidebar-link active" : "sidebar-link"
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {isOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}
    </>
  );
};

export default Sidebar;