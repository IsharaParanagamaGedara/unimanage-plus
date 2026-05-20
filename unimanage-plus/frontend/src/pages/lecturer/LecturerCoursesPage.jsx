import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  getMyLecturerCourses,
  getLecturerCourseDetail,
} from "../../services/lecturerCourseService";
import "./LecturerCoursesPage.css";

const LecturerCoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMyLecturerCourses();
      setCourses(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load assigned courses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const filteredCourses = courses.filter((course) => {
    const keyword = search.toLowerCase();

    return (
      course.course_code?.toLowerCase().includes(keyword) ||
      course.course_name?.toLowerCase().includes(keyword) ||
      course.department?.name?.toLowerCase().includes(keyword) ||
      course.department?.code?.toLowerCase().includes(keyword)
    );
  });

  const openCourseDetail = async (courseId) => {
    try {
      setDetailLoading(true);
      setError("");

      const data = await getLecturerCourseDetail(courseId);
      setSelectedCourse(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load course details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeCourseDetail = () => {
    setSelectedCourse(null);
  };

  return (
    <DashboardLayout>
      <div className="lecturer-courses-page">
        <div className="page-header-row">
          <div>
            <h1>My Courses</h1>
            <p>View courses assigned to you, including batches, materials, assignments, and submissions.</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="lecturer-course-summary-grid">
          <div className="summary-card">
            <span>Assigned Courses</span>
            <strong>{courses.length}</strong>
          </div>

          <div className="summary-card">
            <span>Active Courses</span>
            <strong>{courses.filter((course) => course.is_active).length}</strong>
          </div>

          <div className="summary-card">
            <span>Total Batches</span>
            <strong>
              {courses.reduce(
                (total, course) => total + Number(course.summary?.total_batches || 0),
                0
              )}
            </strong>
          </div>

          <div className="summary-card">
            <span>Total Submissions</span>
            <strong>
              {courses.reduce(
                (total, course) => total + Number(course.summary?.total_submissions || 0),
                0
              )}
            </strong>
          </div>
        </div>

        <div className="filter-card">
          <input
            type="text"
            placeholder="Search by course code, course name, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="table-message">Loading assigned courses...</p>
        ) : filteredCourses.length === 0 ? (
          <div className="empty-card">
            <h3>No assigned courses found</h3>
            <p>Your assigned courses will appear here after Admin assigns you to a course.</p>
          </div>
        ) : (
          <div className="lecturer-course-grid">
            {filteredCourses.map((course) => (
              <div className="lecturer-course-card" key={course.id}>
                <div className="course-card-header">
                  <div className="course-badge">{course.course_code}</div>

                  <span className={course.is_active ? "status active" : "status inactive"}>
                    {course.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <h3>{course.course_name}</h3>
                <p>{course.description || "No course description provided."}</p>

                <div className="course-info-grid">
                  <div>
                    <span>Department</span>
                    <strong>
                      {course.department?.code} - {course.department?.name}
                    </strong>
                  </div>

                  <div>
                    <span>Credits</span>
                    <strong>{course.credits}</strong>
                  </div>

                  <div>
                    <span>Batches</span>
                    <strong>{course.summary?.total_batches || 0}</strong>
                  </div>

                  <div>
                    <span>Assignments</span>
                    <strong>{course.summary?.total_assignments || 0}</strong>
                  </div>

                  <div>
                    <span>Submissions</span>
                    <strong>{course.summary?.total_submissions || 0}</strong>
                  </div>

                  <div>
                    <span>Active Batches</span>
                    <strong>{course.summary?.active_batches || 0}</strong>
                  </div>
                </div>

                <button
                  className="primary-btn"
                  onClick={() => openCourseDetail(course.id)}
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedCourse && (
          <div className="modal-overlay">
            <div className="course-detail-modal">
              <div className="modal-header">
                <div>
                  <h2>{selectedCourse.course_name}</h2>
                  <p>
                    {selectedCourse.course_code} · {selectedCourse.department?.name}
                  </p>
                </div>

                <button className="close-btn" onClick={closeCourseDetail}>
                  ×
                </button>
              </div>

              {detailLoading ? (
                <p className="table-message">Loading course details...</p>
              ) : (
                <>
                  <div className="detail-summary-grid">
                    <div>
                      <span>Total Batches</span>
                      <strong>{selectedCourse.summary?.total_batches || 0}</strong>
                    </div>

                    <div>
                      <span>Active Batches</span>
                      <strong>{selectedCourse.summary?.active_batches || 0}</strong>
                    </div>

                    <div>
                      <span>Assignments</span>
                      <strong>{selectedCourse.summary?.total_assignments || 0}</strong>
                    </div>

                    <div>
                      <span>Submissions</span>
                      <strong>{selectedCourse.summary?.total_submissions || 0}</strong>
                    </div>
                  </div>

                  <section className="detail-section">
                    <h3>Course Batches</h3>

                    {selectedCourse.batches?.length === 0 ? (
                      <p className="section-empty">No batches found for this course.</p>
                    ) : (
                      <div className="detail-card-list">
                        {selectedCourse.batches?.map((batch) => (
                          <div className="detail-card" key={batch.id}>
                            <div>
                              <strong>{batch.batch_name}</strong>
                              <span>{batch.batch_code}</span>
                            </div>

                            <div>
                              <span>Status</span>
                              <strong>{batch.status}</strong>
                            </div>

                            <div>
                              <span>Capacity</span>
                              <strong>{batch.capacity}</strong>
                            </div>

                            <div>
                              <span>Coordinator</span>
                              <strong>
                                {batch.coordinator
                                  ? `${batch.coordinator.first_name} ${batch.coordinator.last_name}`
                                  : "Not assigned"}
                              </strong>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="detail-section">
                    <h3>Course Materials</h3>

                    {selectedCourse.materials?.length === 0 ? (
                      <p className="section-empty">No course materials uploaded yet.</p>
                    ) : (
                      <div className="detail-card-list">
                        {selectedCourse.materials?.map((material) => (
                          <div className="detail-card" key={material.id}>
                            <div>
                              <strong>{material.title}</strong>
                              <span>{material.description || "No description"}</span>
                            </div>

                            <div>
                              <span>File</span>
                              <strong>{material.file_name}</strong>
                            </div>

                            <div>
                              <span>Type</span>
                              <strong>{material.file_type?.toUpperCase()}</strong>
                            </div>

                            <div>
                              <span>Status</span>
                              <strong>{material.is_active ? "Active" : "Inactive"}</strong>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="detail-section">
                    <h3>Assignments</h3>

                    {selectedCourse.assignments?.length === 0 ? (
                      <p className="section-empty">No assignments created yet.</p>
                    ) : (
                      <div className="detail-card-list">
                        {selectedCourse.assignments?.map((assignment) => (
                          <div className="detail-card" key={assignment.id}>
                            <div>
                              <strong>{assignment.title}</strong>
                              <span>
                                {assignment.course_batch?.batch_code} ·{" "}
                                {assignment.course_batch?.batch_name}
                              </span>
                            </div>

                            <div>
                              <span>Status</span>
                              <strong>{assignment.status}</strong>
                            </div>

                            <div>
                              <span>Max Marks</span>
                              <strong>{assignment.max_marks}</strong>
                            </div>

                            <div>
                              <span>Submissions</span>
                              <strong>{assignment.submission_count}</strong>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LecturerCoursesPage;