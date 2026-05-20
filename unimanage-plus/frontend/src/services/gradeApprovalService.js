import api from "./api";

export const getPendingGrades = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.batch_id) params.append("batch_id", filters.batch_id);
  if (filters.search) params.append("search", filters.search);

  const response = await api.get(`/grades/pending-approval?${params.toString()}`);
  return response.data.data;
};

export const publishGrade = async (gradeId, data) => {
  const response = await api.patch(`/grades/${gradeId}/publish`, data);
  return response.data.data;
};

export const returnGrade = async (gradeId, data) => {
  const response = await api.patch(`/grades/${gradeId}/return`, data);
  return response.data.data;
};