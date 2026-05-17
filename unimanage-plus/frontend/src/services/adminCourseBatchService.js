import api from "./api";

export const getCourseBatches = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.search) params.append("search", filters.search);
  if (filters.course_id) params.append("course_id", filters.course_id);
  if (filters.status) params.append("status", filters.status);

  const response = await api.get(`/admin/course-batches?${params.toString()}`);
  return response.data.data;
};

export const getCourseBatchById = async (id) => {
  const response = await api.get(`/admin/course-batches/${id}`);
  return response.data.data;
};

export const createCourseBatch = async (data) => {
  const response = await api.post("/admin/course-batches", data);
  return response.data.data;
};

export const updateCourseBatch = async (id, data) => {
  const response = await api.put(`/admin/course-batches/${id}`, data);
  return response.data.data;
};

export const updateCourseBatchStatus = async (id, isActive) => {
  const response = await api.patch(`/admin/course-batches/${id}/status`, {
    is_active: isActive,
  });

  return response.data.data;
};

export const getBatchCoordinators = async () => {
  const response = await api.get("/admin/course-batches/coordinators");
  return response.data.data;
};