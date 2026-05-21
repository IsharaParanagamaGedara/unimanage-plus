import api from "./api";

export const getLecturerSubmissions = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.assignment_id) params.append("assignment_id", filters.assignment_id);
  if (filters.batch_id) params.append("batch_id", filters.batch_id);
  if (filters.search) params.append("search", filters.search);

  const response = await api.get(`/lecturer/submissions?${params.toString()}`);
  return response.data.data;
};

export const getLecturerSubmissionById = async (id) => {
  const response = await api.get(`/lecturer/submissions/${id}`);
  return response.data.data;
};

export const createDraftGrade = async (submissionId, data) => {
  const response = await api.post(`/lecturer/submissions/${submissionId}/grade`, data);
  return response.data.data;
};

export const updateDraftGrade = async (gradeId, data) => {
  const response = await api.put(`/lecturer/grades/${gradeId}`, data);
  return response.data.data;
};

export const submitGradeForApproval = async (gradeId) => {
  const response = await api.patch(`/lecturer/grades/${gradeId}/submit-approval`);
  return response.data.data;
};

export const downloadSubmissionFile = async (submissionId, fileName) => {
  const response = await api.get(`/lecturer/submissions/${submissionId}/download`, {
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");

  link.href = url;
  link.setAttribute("download", fileName || "submission-file");
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
};