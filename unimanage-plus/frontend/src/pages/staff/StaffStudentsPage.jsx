import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  getStaffStudents,
  getStaffStudentById,
  getStaffStudentFilterOptions,
} from "../../services/staffStudentService";
import "./StaffStudentsPage.css";

const initialFilters = {
  search: "",
  programme: "",
  year_of_study: "",
};

const StaffStudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    programmes: [],
    years: [],
  });
  const [filters, setFilters] = useState(initialFilters);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  const loadStudents = async (selectedFilters = filters) => {
    try {
      setLoading(true);
      setError("");

      const data = await getStaffStudents(selectedFilters);
      setStudents(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load students.");
    } finally {
      setLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const data = await getStaffStudentFilterOptions();
      setFilterOptions(data);
    } catch (err) {
      setError("Failed to load student filter options.");
    }
  };

  useEffect(() => {
    loadFilterOptions();
    loadStudents(initialFilters);
  }, []);

  const handleFilterChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    loadStudents(filters);
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
    loadStudents(initialFilters);
  };

  const openStudentDetail = async (studentId) => {
    try {
      setDetailLoading(true);
      setError("");

      const data = await getStaffStudentById(studentId);
      setSelectedStudent(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load student detail.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedStudent(null);
  };

  return (
    <DashboardLayout>
      <div className="staff-students-page">
        <div className="page-header-row">
          <div>
            <h1>Students</h1>
            <p>View students related to your department. This page is read-only for Department Staff.</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="filter-card">
          <form onSubmit={handleApplyFilters}>
            <div className="student-filter-grid">
              <div className="form-group">
                <label>Search</label>
                <input
                  type="text"
                  name="search"
                  placeholder="Search name, email, student number..."
                  value={filters.search}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="form-group">
                <label>Programme</label>
                <select
                  name="programme"
                  value={filters.programme}
                  onChange={handleFilterChange}
                >
                  <option value="">All Programmes</option>
                  {filterOptions.programmes.map((programme) => (
                    <option key={programme} value={programme}>
                      {programme}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Year of Study</label>
                <select
                  name="year_of_study"
                  value={filters.year_of_study}
                  onChange={handleFilterChange}
                >
                  <option value="">All Years</option>
                  {filterOptions.years.map((year) => (
                    <option key={year} value={year}>
                      Year {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="filter-actions">
              <button className="primary-btn" type="submit" disabled={loading}>
                {loading ? "Loading..." : "Apply Filters"}
              </button>

              <button
                className="secondary-btn"
                type="button"
                onClick={handleClearFilters}
              >
                Clear Filters
              </button>
            </div>
          </form>
        </div>

        <div className="table-card">
          <div className="table-header-row">
            <div>
              <h3>Student List</h3>
              <p>{students.length} student(s) found.</p>
            </div>
          </div>

          {loading ? (
            <p className="table-message">Loading students...</p>
          ) : students.length === 0 ? (
            <p className="table-message">No students found.</p>
          ) : (
            <div className="table-responsive">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Student Number</th>
                    <th>Academic Email</th>
                    <th>Department</th>
                    <th>Programme</th>
                    <th>Year</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <strong>
                          {student.user?.first_name} {student.user?.last_name}
                        </strong>
                        <span className="sub-text">{student.user?.email}</span>
                      </td>

                      <td>{student.student_number}</td>
                      <td>{student.academic_email}</td>
                      <td>{student.department?.name || "-"}</td>
                      <td>{student.programme_name || "-"}</td>
                      <td>{student.year_of_study || "-"}</td>

                      <td>
                        <span
                          className={
                            student.user?.is_active
                              ? "status-pill active"
                              : "status-pill inactive"
                          }
                        >
                          {student.user?.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td>
                        <button
                          className="secondary-btn small-btn"
                          onClick={() => openStudentDetail(student.id)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedStudent && (
          <div className="modal-overlay">
            <div className="student-modal">
              <div className="modal-header">
                <div>
                  <h2>Student Detail</h2>
                  <p>{selectedStudent.student_number}</p>
                </div>

                <button className="close-btn" onClick={closeModal}>
                  ×
                </button>
              </div>

              {detailLoading ? (
                <p className="table-message">Loading detail...</p>
              ) : (
                <>
                  <div className="student-profile-summary">
                    <div className="student-avatar">
                      {selectedStudent.user?.first_name?.charAt(0)}
                      {selectedStudent.user?.last_name?.charAt(0)}
                    </div>

                    <div>
                      <h3>
                        {selectedStudent.user?.first_name}{" "}
                        {selectedStudent.user?.last_name}
                      </h3>
                      <p>{selectedStudent.user?.email}</p>
                      <span
                        className={
                          selectedStudent.user?.is_active
                            ? "status-pill active"
                            : "status-pill inactive"
                        }
                      >
                        {selectedStudent.user?.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  <div className="detail-grid">
                    <div>
                      <span>Student Number</span>
                      <strong>{selectedStudent.student_number}</strong>
                    </div>

                    <div>
                      <span>Academic Email</span>
                      <strong>{selectedStudent.academic_email}</strong>
                    </div>

                    <div>
                      <span>Phone</span>
                      <strong>{selectedStudent.phone || "-"}</strong>
                    </div>

                    <div>
                      <span>Department</span>
                      <strong>{selectedStudent.department?.name || "-"}</strong>
                    </div>

                    <div>
                      <span>Programme</span>
                      <strong>{selectedStudent.programme_name || "-"}</strong>
                    </div>

                    <div>
                      <span>Year of Study</span>
                      <strong>{selectedStudent.year_of_study || "-"}</strong>
                    </div>

                    <div>
                      <span>Gender</span>
                      <strong>{selectedStudent.gender || "-"}</strong>
                    </div>

                    <div>
                      <span>Date of Birth</span>
                      <strong>{selectedStudent.date_of_birth || "-"}</strong>
                    </div>

                    <div>
                      <span>Enrollment Date</span>
                      <strong>{selectedStudent.enrollment_date || "-"}</strong>
                    </div>
                  </div>

                  <div className="address-box">
                    <h3>Address</h3>
                    <p>{selectedStudent.address || "No address available."}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StaffStudentsPage;