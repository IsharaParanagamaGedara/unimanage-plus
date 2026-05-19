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

import AvailableBatchesPage from "./pages/student/AvailableBatchesPage";
import MyApplicationsPage from "./pages/student/MyApplicationsPage";
import MyEnrollmentsPage from "./pages/student/MyEnrollmentsPage";
import StudentServiceRequestsPage from "./pages/student/StudentServiceRequestsPage";

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

          {/* Lecturer Dashboard */}
          <Route
            path="/lecturer/dashboard"
            element={
              <ProtectedRoute allowedRoles={["Lecturer"]}>
                <LecturerDashboard />
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

          {/* Student Service Requests */}
          <Route
            path="/student/service-requests"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <StudentServiceRequestsPage />
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

          {/* Department Course Applications */}
          <Route
            path="/staff/course-applications"
            element={
              <ProtectedRoute allowedRoles={["Department Staff"]}>
                <AdminCourseApplicationsPage />
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