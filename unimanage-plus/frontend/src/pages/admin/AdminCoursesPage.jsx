import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { getDepartments } from "../../services/adminDepartmentService";
import {
  getCourses,
  createCourse,
  updateCourse,
  updateCourseStatus,
  getActiveLecturers,
} from "../../services/adminCourseService";
import {
  getCourseMaterials,
  uploadCourseMaterial,
  updateCourseMaterial,
  updateCourseMaterialStatus,
  downloadCourseMaterial,
} from "../../services/courseMaterialService";
import "./AdminCoursesPage.css";

const initialForm = {
  department_id: "",
  lecturer_id: "",
  course_code: "",
  course_name: "",
  description: "",
  credits: "",
  capacity: "",
};

const initialMaterialForm = {
  title: "",
  description: "",
  file: null,
};

const AdminCoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [lecturers, setLecturers] = useState([]);

  const [filters, setFilters] = useState({
    search: "",
    department_id: "",
    status: "",
  });

  const [form, setForm] = useState(initialForm);
  const [editingCourse, setEditingCourse] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);
  const [materialLoading, setMaterialLoading] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [materialForm, setMaterialForm] = useState(initialMaterialForm);

  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError("");

      const [courseData, departmentData, lecturerData] = await Promise.all([
        getCourses(filters),
        getDepartments({ status: "active" }),
        getActiveLecturers(),
      ]);

      setCourses(courseData);
      setDepartments(departmentData);
      setLecturers(lecturerData);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load course data.");
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError("");

      const courseData = await getCourses(filters);
      setCourses(courseData);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load courses.");
    } finally {
      setLoading(false);
    }
  };

  const loadMaterials = async (courseId) => {
    try {
      setMaterialLoading(true);
      setError("");

      const data = await getCourseMaterials(courseId);
      setMaterials(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load course materials.");
    } finally {
      setMaterialLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadCourses();
  }, [filters.department_id, filters.status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadCourses();
  };

  const handleFilterChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleFormChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const openCreateModal = () => {
    setEditingCourse(null);
    setForm(initialForm);
    setShowForm(true);
  };

  const openEditModal = (course) => {
    setEditingCourse(course);

    setForm({
      department_id: course.department_id || "",
      lecturer_id: course.lecturer_id || "",
      course_code: course.course_code || "",
      course_name: course.course_name || "",
      description: course.description || "",
      credits: course.credits || "",
      capacity: course.capacity || "",
    });

    setShowForm(true);
  };

  const closeModal = () => {
    setShowForm(false);
    setEditingCourse(null);
    setForm(initialForm);
  };

  const openMaterialsModal = async (course) => {
    setSelectedCourse(course);
    setShowMaterialsModal(true);
    setEditingMaterial(null);
    setMaterialForm(initialMaterialForm);

    await loadMaterials(course.id);
  };

  const closeMaterialsModal = () => {
    setShowMaterialsModal(false);
    setSelectedCourse(null);
    setMaterials([]);
    setEditingMaterial(null);
    setMaterialForm(initialMaterialForm);
  };

  const handleMaterialFormChange = (e) => {
    const { name, value, files } = e.target;

    setMaterialForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleMaterialSubmit = async (e) => {
    e.preventDefault();

    try {
      setMaterialLoading(true);
      setError("");
      setMessage("");

      if (editingMaterial) {
        await updateCourseMaterial(editingMaterial.id, {
          title: materialForm.title,
          description: materialForm.description,
        });

        setMessage("Course material updated successfully.");
      } else {
        const formData = new FormData();
        formData.append("title", materialForm.title);
        formData.append("description", materialForm.description);
        formData.append("file", materialForm.file);

        await uploadCourseMaterial(selectedCourse.id, formData);

        setMessage("Course material uploaded successfully.");
      }

      setEditingMaterial(null);
      setMaterialForm(initialMaterialForm);

      await loadMaterials(selectedCourse.id);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save course material.");
    } finally {
      setMaterialLoading(false);
    }
  };

  const openEditMaterial = (material) => {
    setEditingMaterial(material);
    setMaterialForm({
      title: material.title || "",
      description: material.description || "",
      file: null,
    });
  };

  const cancelEditMaterial = () => {
    setEditingMaterial(null);
    setMaterialForm(initialMaterialForm);
  };

  const handleMaterialStatusChange = async (material) => {
    const confirmMessage = material.is_active
      ? "Are you sure you want to deactivate this material?"
      : "Are you sure you want to activate this material?";

    if (!window.confirm(confirmMessage)) return;

    try {
      setMaterialLoading(true);
      setError("");
      setMessage("");

      await updateCourseMaterialStatus(material.id, !material.is_active);

      setMessage(
        material.is_active
          ? "Course material deactivated successfully."
          : "Course material activated successfully."
      );

      await loadMaterials(selectedCourse.id);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update material status.");
    } finally {
      setMaterialLoading(false);
    }
  };

  const handleDownloadMaterial = async (material) => {
    try {
      await downloadCourseMaterial(material.id, material.file_name);
    } catch (err) {
      setError("Failed to download material.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setFormLoading(true);
      setError("");
      setMessage("");

      const payload = {
        ...form,
        department_id: Number(form.department_id),
        lecturer_id: form.lecturer_id ? Number(form.lecturer_id) : null,
        credits: Number(form.credits),
        capacity: Number(form.capacity),
      };

      if (editingCourse) {
        await updateCourse(editingCourse.id, payload);
        setMessage("Course updated successfully.");
      } else {
        await createCourse(payload);
        setMessage("Course created successfully.");
      }

      closeModal();
      loadCourses();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save course.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async (course) => {
    const confirmMessage = course.is_active
      ? "Are you sure you want to deactivate this course?"
      : "Are you sure you want to activate this course?";

    if (!window.confirm(confirmMessage)) return;

    try {
      setError("");
      setMessage("");

      await updateCourseStatus(course.id, !course.is_active);

      setMessage(
        course.is_active
          ? "Course deactivated successfully."
          : "Course activated successfully."
      );

      loadCourses();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update course status.");
    }
  };

  return (
    <DashboardLayout>
      <div className="admin-courses-page">
        <div className="page-header-row">
          <div>
            <h1>Course Management</h1>
            <p>
              Manage courses, academic departments, lecturer allocation, credits,
              and course capacity.
            </p>
          </div>

          <button className="primary-btn" onClick={openCreateModal}>
            + Add Course
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <div className="course-summary-grid">
          <div className="summary-card">
            <span>Total Courses</span>
            <strong>{courses.length}</strong>
          </div>

          <div className="summary-card">
            <span>Active Courses</span>
            <strong>{courses.filter((course) => course.is_active).length}</strong>
          </div>

          <div className="summary-card">
            <span>Inactive Courses</span>
            <strong>{courses.filter((course) => !course.is_active).length}</strong>
          </div>

          <div className="summary-card">
            <span>Total Capacity</span>
            <strong>
              {courses.reduce((total, course) => total + Number(course.capacity || 0), 0)}
            </strong>
          </div>
        </div>

        <div className="filter-card">
          <form onSubmit={handleSearchSubmit} className="course-filter-grid">
            <input
              name="search"
              type="text"
              placeholder="Search by course code, name, department, lecturer..."
              value={filters.search}
              onChange={handleFilterChange}
            />

            <select
              name="department_id"
              value={filters.department_id}
              onChange={handleFilterChange}
            >
              <option value="">All Departments</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>

            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button className="secondary-btn" type="submit">
              Search
            </button>
          </form>
        </div>

        <div className="table-card">
          {loading ? (
            <p className="table-message">Loading courses...</p>
          ) : courses.length === 0 ? (
            <p className="table-message">No courses found.</p>
          ) : (
            <div className="table-responsive">
              <table className="courses-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Department</th>
                    <th>Lecturer</th>
                    <th>Credits</th>
                    <th>Capacity</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {courses.map((course) => (
                    <tr key={course.id}>
                      <td>
                        <div className="course-name-cell">
                          <div className="course-icon">
                            {course.course_code?.slice(0, 2)}
                          </div>

                          <div>
                            <strong>{course.course_name}</strong>
                            <span>{course.course_code}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        {course.department ? (
                          <div>
                            <strong>{course.department.name}</strong>
                            <span className="sub-text">{course.department.code}</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td>
                        {course.lecturer ? (
                          <div>
                            <strong>
                              {course.lecturer.first_name} {course.lecturer.last_name}
                            </strong>
                            <span className="sub-text">{course.lecturer.email}</span>
                          </div>
                        ) : (
                          <span className="unassigned-text">Not assigned</span>
                        )}
                      </td>

                      <td>{course.credits}</td>
                      <td>{course.capacity}</td>

                      <td>
                        <span className={course.is_active ? "status active" : "status inactive"}>
                          {course.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td>
                        <div className="action-buttons">
                          <button
                            className="secondary-btn small-btn"
                            onClick={() => openMaterialsModal(course)}
                            disabled={!course.is_active}
                            title={!course.is_active ? "Inactive courses cannot manage materials" : ""}
                          >
                            Materials
                          </button>

                          <button
                            className="secondary-btn small-btn"
                            onClick={() => openEditModal(course)}
                            disabled={!course.is_active}
                            title={!course.is_active ? "Inactive courses cannot be edited" : ""}
                          >
                            Edit
                          </button>

                          <button
                            className={course.is_active ? "danger-btn small-btn" : "success-btn small-btn"}
                            onClick={() => handleStatusChange(course)}
                          >
                            {course.is_active ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showForm && (
          <div className="modal-overlay">
            <div className="course-modal">
              <div className="modal-header">
                <div>
                  <h2>{editingCourse ? "Edit Course" : "Create Course"}</h2>
                  <p>
                    {editingCourse
                      ? "Update course details and lecturer assignment."
                      : "Add a new academic course to the system."}
                  </p>
                </div>

                <button className="close-btn" onClick={closeModal}>
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Course Code</label>
                    <input
                      name="course_code"
                      value={form.course_code}
                      onChange={handleFormChange}
                      placeholder="SE401"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Course Name</label>
                    <input
                      name="course_name"
                      value={form.course_name}
                      onChange={handleFormChange}
                      placeholder="Advanced Software Engineering"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Department</label>
                    <select
                      name="department_id"
                      value={form.department_id}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Assign Lecturer</label>
                    <select
                      name="lecturer_id"
                      value={form.lecturer_id}
                      onChange={handleFormChange}
                    >
                      <option value="">Not Assigned</option>
                      {lecturers.map((lecturer) => (
                        <option key={lecturer.id} value={lecturer.id}>
                          {lecturer.first_name} {lecturer.last_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Credits</label>
                    <input
                      name="credits"
                      type="number"
                      min="1"
                      value={form.credits}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Capacity</label>
                    <input
                      name="capacity"
                      type="number"
                      min="1"
                      value={form.capacity}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleFormChange}
                      placeholder="Brief course description..."
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="secondary-btn" onClick={closeModal}>
                    Cancel
                  </button>

                  <button type="submit" className="primary-btn" disabled={formLoading}>
                    {formLoading
                      ? "Saving..."
                      : editingCourse
                      ? "Update Course"
                      : "Create Course"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showMaterialsModal && selectedCourse && (
          <div className="modal-overlay">
            <div className="materials-modal">
              <div className="modal-header">
                <div>
                  <h2>Course Materials</h2>
                  <p>
                    {selectedCourse.course_code} - {selectedCourse.course_name}
                  </p>
                </div>

                <button className="close-btn" onClick={closeMaterialsModal}>
                  ×
                </button>
              </div>

              <form onSubmit={handleMaterialSubmit} className="material-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Material Title</label>
                    <input
                      name="title"
                      value={materialForm.title}
                      onChange={handleMaterialFormChange}
                      placeholder="Week 01 Lecture Notes"
                      required
                    />
                  </div>

                  {!editingMaterial && (
                    <div className="form-group">
                      <label>File</label>
                      <input
                        name="file"
                        type="file"
                        accept=".pdf,.docx,.pptx,.zip"
                        onChange={handleMaterialFormChange}
                        required
                      />
                    </div>
                  )}

                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={materialForm.description}
                      onChange={handleMaterialFormChange}
                      placeholder="Brief description of the material..."
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  {editingMaterial && (
                    <button type="button" className="secondary-btn" onClick={cancelEditMaterial}>
                      Cancel Edit
                    </button>
                  )}

                  <button type="submit" className="primary-btn" disabled={materialLoading}>
                    {materialLoading
                      ? "Saving..."
                      : editingMaterial
                      ? "Update Material"
                      : "Upload Material"}
                  </button>
                </div>
              </form>

              <div className="materials-list">
                <h3>Uploaded Materials</h3>

                {materialLoading ? (
                  <p className="table-message">Loading materials...</p>
                ) : materials.length === 0 ? (
                  <p className="table-message">No materials uploaded yet.</p>
                ) : (
                  <div className="materials-grid">
                    {materials.map((material) => (
                      <div className="material-card" key={material.id}>
                        <div className="material-top">
                          <div className="file-icon">
                            {material.file_type?.toUpperCase()}
                          </div>

                          <div>
                            <h4>{material.title}</h4>
                            <p>{material.description || "No description provided."}</p>
                          </div>
                        </div>

                        <div className="material-meta">
                          <span>{material.file_name}</span>
                          <span>{material.file_size_mb} MB</span>
                          <span>
                            Uploaded by {material.uploader?.first_name}{" "}
                            {material.uploader?.last_name}
                          </span>
                        </div>

                        <div className="material-footer">
                          <span className={material.is_active ? "status active" : "status inactive"}>
                            {material.is_active ? "Active" : "Inactive"}
                          </span>

                          <div className="action-buttons">
                            <button
                              className="secondary-btn small-btn"
                              onClick={() => handleDownloadMaterial(material)}
                            >
                              Download
                            </button>

                            <button
                              className="secondary-btn small-btn"
                              onClick={() => openEditMaterial(material)}
                            >
                              Edit
                            </button>

                            <button
                              className={
                                material.is_active
                                  ? "danger-btn small-btn"
                                  : "success-btn small-btn"
                              }
                              onClick={() => handleMaterialStatusChange(material)}
                            >
                              {material.is_active ? "Deactivate" : "Activate"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminCoursesPage;