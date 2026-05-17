import api from "./api";

export const getCourses = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.search) params.append("search", filters.search);
  if (filters.department_id) params.append("department_id", filters.department_id);
  if (filters.status) params.append("status", filters.status);

  const response = await api.get(`/admin/courses?${params.toString()}`);
  return response.data.data;
};

export const getCourseById = async (id) => {
  const response = await api.get(`/admin/courses/${id}`);
  return response.data.data;
};

export const createCourse = async (data) => {
  const response = await api.post("/admin/courses", data);
  return response.data.data;
};

export const updateCourse = async (id, data) => {
  const response = await api.put(`/admin/courses/${id}`, data);
  return response.data.data;
};

export const updateCourseStatus = async (id, isActive) => {
  const response = await api.patch(`/admin/courses/${id}/status`, {
    is_active: isActive,
  });

  return response.data.data;
};

export const getActiveLecturers = async () => {
  const response = await api.get("/admin/courses/lecturers");
  return response.data.data;
};