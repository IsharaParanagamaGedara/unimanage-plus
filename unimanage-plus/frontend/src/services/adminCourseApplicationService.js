import api from "./api";

export const getCourseApplications = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.search) params.append("search", filters.search);
  if (filters.status) params.append("status", filters.status);
  if (filters.batch_id) params.append("batch_id", filters.batch_id);

  const response = await api.get(`/admin/course-applications?${params.toString()}`);
  return response.data.data;
};

export const reviewCourseApplication = async (applicationId, data) => {
  const response = await api.patch(
    `/admin/course-applications/${applicationId}/review`,
    data
  );

  return response.data.data;
};