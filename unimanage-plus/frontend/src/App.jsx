import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import LecturerDashboard from "./pages/LecturerDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import StaffDashboard from "./pages/StaffDashboard";

import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminDepartmentsPage from "./pages/admin/AdminDepartmentsPage";
import AdminCoursesPage from "./pages/admin/AdminCoursesPage";
import AdminCourseBatchesPage from "./pages/admin/AdminCourseBatchesPage";
import AdminCourseApplicationsPage from "./pages/admin/AdminCourseApplicationsPage";
import AdminServiceRequestsPage from "./pages/admin/AdminServiceRequestsPage";
import GradeApprovalPage from "./pages/admin/GradeApprovalPage";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";
import AdminReportsPage from "./pages/admin/AdminReportsPage";
import AdminAuditLogsPage from "./pages/admin/AdminAuditLogsPage";

import AvailableBatchesPage from "./pages/student/AvailableBatchesPage";
import MyApplicationsPage from "./pages/student/MyApplicationsPage";
import MyEnrollmentsPage from "./pages/student/MyEnrollmentsPage";
import StudentServiceRequestsPage from "./pages/student/StudentServiceRequestsPage";
import StudentAssignmentsPage from "./pages/student/StudentAssignmentsPage";
import MyGradesPage from "./pages/student/MyGradesPage";
import MySubmissionsPage from "./pages/student/MySubmissionsPage";

import LecturerAssignmentsPage from "./pages/lecturer/LecturerAssignmentsPage";
import LecturerSubmissionsPage from "./pages/lecturer/LecturerSubmissionsPage";
import LecturerCoursesPage from "./pages/lecturer/LecturerCoursesPage";

import StaffReportsPage from "./pages/staff/StaffReportsPage";
import StaffStudentsPage from "./pages/staff/StaffStudentsPage";

import CourseMaterialsPage from "./pages/common/CourseMaterialsPage";
import NotificationsPage from "./pages/common/NotificationsPage";
import ProfilePage from "./pages/common/ProfilePage";
import ChangePasswordPage from "./pages/common/ChangePasswordPage";

const Unauthorized = () => {
  return <h2>Unauthorized Access</h2>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Admin Dashboard */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin User Management */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Department Management */}
          <Route
            path="/admin/departments"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminDepartmentsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Courses Management */}
          <Route
            path="/admin/courses"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminCoursesPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Course Batches Management */}
          <Route
            path="/admin/course-batches"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminCourseBatchesPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Course Application Management */}
          <Route
            path="/admin/course-applications"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminCourseApplicationsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Assignments Management */}
          <Route
            path="/admin/assignments"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <LecturerAssignmentsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Service Requests Management */}
          <Route
            path="/admin/service-requests"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminServiceRequestsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Assignments submissions */}
          <Route
            path="/admin/submissions"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <LecturerSubmissionsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Grade Approval Management */}
          <Route
            path="/admin/grade-approval"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <GradeApprovalPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Analytics */}
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminAnalyticsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Reports */}
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminReportsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Audit Logs */}
          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminAuditLogsPage />
              </ProtectedRoute>
            }
          />

          {/* Lecturer Dashboard */}
          <Route
            path="/lecturer/dashboard"
            element={
              <ProtectedRoute allowedRoles={["Lecturer"]}>
                <LecturerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Lecturer My Courses */}
          <Route
            path="/lecturer/courses"
            element={
              <ProtectedRoute allowedRoles={["Lecturer"]}>
                <LecturerCoursesPage />
              </ProtectedRoute>
            }
          />

          {/* Lecturer My Course Materials */}
          <Route
            path="/lecturer/materials"
            element={
              <ProtectedRoute allowedRoles={["Lecturer"]}>
                <CourseMaterialsPage />
              </ProtectedRoute>
            }
          />

          {/* Lecturer Assignments Management */}
          <Route
            path="/lecturer/assignments"
            element={
              <ProtectedRoute allowedRoles={["Lecturer"]}>
                <LecturerAssignmentsPage />
              </ProtectedRoute>
            }
          />

          {/* Lecturer Assignments Submissions */}
          <Route
            path="/lecturer/submissions"
            element={
              <ProtectedRoute allowedRoles={["Lecturer"]}>
                <LecturerSubmissionsPage />
              </ProtectedRoute>
            }
          />

          {/* Student Dashboard */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          {/* Student Available Batches*/}
          <Route
            path="/student/available-batches"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <AvailableBatchesPage />
              </ProtectedRoute>
            }
          />

          {/* Student My Applications */}
          <Route
            path="/student/applications"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <MyApplicationsPage />
              </ProtectedRoute>
            }
          />

          {/* Student My Enrollments */}
          <Route
            path="/student/enrollments"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <MyEnrollmentsPage />
              </ProtectedRoute>
            }
          />

          {/* Student My Course Materials */}
          <Route
            path="/student/materials"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <CourseMaterialsPage />
              </ProtectedRoute>
            }
          />

          {/* Student Service Requests */}
          <Route
            path="/student/service-requests"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <StudentServiceRequestsPage />
              </ProtectedRoute>
            }
          />

          {/* Student Assignments */}
          <Route
            path="/student/assignments"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <StudentAssignmentsPage />
              </ProtectedRoute>
            }
          />

          {/* Student My Submissions */}
          <Route
            path="/student/submissions"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <MySubmissionsPage />
              </ProtectedRoute>
            }
          />

          {/* Student My Grades */}
          <Route
            path="/student/grades"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <MyGradesPage />
              </ProtectedRoute>
            }
          />

          {/* Department Staff Dashboard */}
          <Route
            path="/staff/dashboard"
            element={
              <ProtectedRoute allowedRoles={["Department Staff"]}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />

          {/* Department Staff Course Applications */}
          <Route
            path="/staff/course-applications"
            element={
              <ProtectedRoute allowedRoles={["Department Staff"]}>
                <AdminCourseApplicationsPage />
              </ProtectedRoute>
            }
          />

          {/* Department Staff Service Requests */}
          <Route
            path="/staff/service-requests"
            element={
              <ProtectedRoute allowedRoles={["Department Staff"]}>
                <AdminServiceRequestsPage />
              </ProtectedRoute>
            }
          />

          {/* Department Staff Course Materials */}
          <Route
            path="/staff/materials"
            element={
              <ProtectedRoute allowedRoles={["Department Staff"]}>
                <CourseMaterialsPage />
              </ProtectedRoute>
            }
          />

          {/* Department Staff Assignments Management */}
          <Route
            path="/staff/assignments"
            element={
              <ProtectedRoute allowedRoles={["Department Staff"]}>
                <LecturerAssignmentsPage />
              </ProtectedRoute>
            }
          />

          {/* Department Staff Grade Approval Management */}
          <Route
            path="/staff/grade-approval"
            element={
              <ProtectedRoute allowedRoles={["Department Staff"]}>
                <GradeApprovalPage />
              </ProtectedRoute>
            }
          />

          {/* Department Staff Reports */}
          <Route
            path="/staff/reports"
            element={
              <ProtectedRoute allowedRoles={["Department Staff"]}>
                <StaffReportsPage />
              </ProtectedRoute>
            }
          />

          {/* Department Staff Students */}
          <Route
            path="/staff/students"
             element={
              <ProtectedRoute allowedRoles={["Department Staff"]}>
                <StaffStudentsPage />
              </ProtectedRoute>
            }
          />

          {/* Notifications */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute 
                allowedRoles={["Admin", "Lecturer", "Student", "Department Staff"]}
              >
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          {/* Profile */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute 
                allowedRoles={["Admin", "Lecturer", "Student", "Department Staff"]}
              >
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Change Password */}
          <Route
            path="/change-password"
            element={
              <ProtectedRoute 
                allowedRoles={["Admin", "Lecturer", "Student", "Department Staff"]}
              >
                <ChangePasswordPage />
              </ProtectedRoute>
            }
          />

          <Route path="/unauthorized" element={<Unauthorized />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;