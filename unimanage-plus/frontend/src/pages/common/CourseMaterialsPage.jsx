import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { getMyEnrollments } from "../../services/studentEnrollmentService";
import { getMyLecturerCourses } from "../../services/lecturerCourseService";
import { getCourseApplications } from "../../services/adminCourseApplicationService";
import {
  getCourseMaterials,
  uploadCourseMaterial,
  updateCourseMaterial,
  updateCourseMaterialStatus,
  downloadCourseMaterial,
} from "../../services/courseMaterialService";
import "./CourseMaterialsPage.css";

const initialForm = {
  title: "",
  description: "",
  file: null,
};

const CourseMaterialsPage = () => {
  const { user } = useAuth();
  const role = user?.role;

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [materials, setMaterials] = useState([]);

  const [form, setForm] = useState(initialForm);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const canManage = role === "Lecturer" || role === "Admin";

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");
      setMaterials([]);

      let mappedCourses = [];

      if (role === "Student") {
        const enrollments = await getMyEnrollments();

        const uniqueCourses = new Map();

        enrollments.forEach((enrollment) => {
          const course = enrollment.batch?.course;
          const batch = enrollment.batch;

          if (course && !uniqueCourses.has(course.id)) {
            uniqueCourses.set(course.id, {
              id: course.id,
              course_code: course.course_code,
              course_name: course.course_name,
              source_label: batch?.batch_code,
            });
          }
        });

        mappedCourses = Array.from(uniqueCourses.values());
      }

      if (role === "Lecturer") {
        mappedCourses = await getMyLecturerCourses();
      }

      if (role === "Department Staff") {
        const applications = await getCourseApplications();

        const uniqueCourses = new Map();

        applications.forEach((application) => {
          const course = application.batch?.course;
          const batch = application.batch;

          if (course && !uniqueCourses.has(course.id)) {
            uniqueCourses.set(course.id, {
              id: course.id,
              course_code: course.course_code,
              course_name: course.course_name,
              source_label: batch?.batch_code,
            });
          }
        });

        mappedCourses = Array.from(uniqueCourses.values());
      }

      const validCourses = mappedCourses.filter((course) => course.id);
      setCourses(validCourses);

      if (validCourses.length > 0) {
        setSelectedCourseId(String(validCourses[0].id));
      } else {
        setSelectedCourseId("");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load courses.");
    } finally {
      setLoading(false);
    }
  };

  const loadMaterials = async (courseId) => {
    if (!courseId) return;

    try {
      setMaterialsLoading(true);
      setError("");

      const data = await getCourseMaterials(courseId);
      setMaterials(data);
    } catch (err) {
      setMaterials([]);
      setError(err?.response?.data?.message || "Failed to load course materials.");
    } finally {
      setMaterialsLoading(false);
    }
  };

  useEffect(() => {
    if (role) {
      loadCourses();
    }
  }, [role]);

  useEffect(() => {
    if (selectedCourseId) {
      loadMaterials(selectedCourseId);
    }
  }, [selectedCourseId]);

  const handleCourseChange = (e) => {
    setSelectedCourseId(e.target.value);
  };

  const openUploadModal = () => {
    setEditingMaterial(null);
    setForm(initialForm);
    setShowForm(true);
    setError("");
    setMessage("");
  };

  const openEditModal = (material) => {
    setEditingMaterial(material);
    setForm({
      title: material.title || "",
      description: material.description || "",
      file: null,
    });
    setShowForm(true);
  };

  const closeModal = () => {
    setShowForm(false);
    setEditingMaterial(null);
    setForm(initialForm);
  };

  const handleFormChange = (e) => {
    const { name, value, files } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setFormLoading(true);
      setError("");
      setMessage("");

      if (editingMaterial) {
        await updateCourseMaterial(editingMaterial.id, {
          title: form.title,
          description: form.description,
        });

        setMessage("Course material updated successfully.");
      } else {
        const formData = new FormData();
        formData.append("title", form.title);
        formData.append("description", form.description);

        if (form.file) {
          formData.append("file", form.file);
        }

        await uploadCourseMaterial(selectedCourseId, formData);
        setMessage("Course material uploaded successfully.");
      }

      closeModal();
      loadMaterials(selectedCourseId);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save course material.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async (material) => {
    const confirmMessage = material.is_active
      ? "Deactivate this material?"
      : "Activate this material?";

    if (!window.confirm(confirmMessage)) return;

    try {
      setError("");
      setMessage("");

      await updateCourseMaterialStatus(material.id, !material.is_active);

      setMessage(
        material.is_active
          ? "Course material deactivated successfully."
          : "Course material activated successfully."
      );

      loadMaterials(selectedCourseId);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update material status.");
    }
  };

  return (
    <DashboardLayout>
      <div className="course-materials-page">
        <div className="page-header-row">
          <div>
            <h1>Course Materials</h1>
            <p>Access learning resources for your permitted courses.</p>
          </div>

          {canManage && selectedCourseId && (
            <button className="primary-btn" onClick={openUploadModal}>
              + Upload Material
            </button>
          )}
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <div className="filter-card">
          <label>Select Course</label>
          <select value={selectedCourseId} onChange={handleCourseChange}>
            <option value="">Select Course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.course_code} - {course.course_name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="table-message">Loading courses...</p>
        ) : courses.length === 0 ? (
          <div className="empty-card">
            <h3>No courses found</h3>
            <p>No permitted courses are available for course materials.</p>
          </div>
        ) : materialsLoading ? (
          <p className="table-message">Loading materials...</p>
        ) : materials.length === 0 ? (
          <div className="empty-card">
            <h3>No materials found</h3>
            <p>Course materials will appear here after upload.</p>
          </div>
        ) : (
          <div className="materials-grid">
            {materials.map((material) => (
              <div className="material-card" key={material.id}>
                <div className="material-card-header">
                  <div className="file-badge">{material.file_type?.toUpperCase()}</div>

                  <span className={material.is_active ? "status active" : "status inactive"}>
                    {material.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <h3>{material.title}</h3>
                <p>{material.description || "No description provided."}</p>

                <div className="material-info-grid">
                  <div>
                    <span>File</span>
                    <strong>{material.file_name}</strong>
                  </div>

                  <div>
                    <span>Size</span>
                    <strong>{material.file_size_mb} MB</strong>
                  </div>

                  <div>
                    <span>Uploaded By</span>
                    <strong>
                      {material.uploader?.first_name} {material.uploader?.last_name}
                    </strong>
                  </div>

                  <div>
                    <span>Uploaded Date</span>
                    <strong>
                      {material.created_at
                        ? new Date(material.created_at).toLocaleDateString()
                        : "-"}
                    </strong>
                  </div>
                </div>

                <div className="action-buttons">
                  <button
                    className="secondary-btn"
                    onClick={() => downloadCourseMaterial(material.id, material.file_name)}
                  >
                    Download
                  </button>

                  {canManage && (
                    <>
                      <button
                        className="primary-light-btn"
                        onClick={() => openEditModal(material)}
                      >
                        Edit
                      </button>

                      <button
                        className={material.is_active ? "danger-btn" : "success-btn"}
                        onClick={() => handleStatusChange(material)}
                      >
                        {material.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <div className="modal-overlay">
            <div className="material-modal">
              <div className="modal-header">
                <div>
                  <h2>{editingMaterial ? "Edit Material" : "Upload Material"}</h2>
                  <p>
                    {editingMaterial
                      ? "Update material title and description."
                      : "Upload PDF, DOCX, PPTX, or ZIP materials."}
                  </p>
                </div>

                <button className="close-btn" onClick={closeModal}>
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Title</label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                  />
                </div>

                {!editingMaterial && (
                  <div className="form-group">
                    <label>Material File</label>
                    <input
                      name="file"
                      type="file"
                      accept=".pdf,.docx,.pptx,.zip"
                      onChange={handleFormChange}
                      required
                    />
                    <small>Allowed: PDF, DOCX, PPTX, ZIP. Max: 20MB.</small>
                  </div>
                )}

                <div className="modal-actions">
                  <button type="button" className="secondary-btn" onClick={closeModal}>
                    Cancel
                  </button>

                  <button type="submit" className="primary-btn" disabled={formLoading}>
                    {formLoading
                      ? "Saving..."
                      : editingMaterial
                      ? "Update Material"
                      : "Upload Material"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CourseMaterialsPage;