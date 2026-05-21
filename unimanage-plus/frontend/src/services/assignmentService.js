import api from "./api";

export const getAssignments = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.status) params.append("status", filters.status);
  if (filters.batch_id) params.append("batch_id", filters.batch_id);
  if (filters.search) params.append("search", filters.search);

  const response = await api.get(`/assignments?${params.toString()}`);
  return response.data.data;
};

export const getAssignmentBatches = async () => {
  const response = await api.get("/assignments/batches");
  return response.data.data;
};

export const createAssignment = async (formData) => {
  const response = await api.post("/assignments", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data.data;
};

export const updateAssignment = async (id, formData) => {
  const response = await api.put(`/assignments/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data.data;
};

export const submitAssignmentForReview = async (id) => {
  const response = await api.patch(`/assignments/${id}/submit-review`);
  return response.data.data;
};

export const publishAssignment = async (id, data) => {
  const response = await api.patch(`/assignments/${id}/publish`, data);
  return response.data.data;
};

export const updateAssignmentStatus = async (id, data) => {
  const response = await api.patch(`/assignments/${id}/status`, data);
  return response.data.data;
};

export const downloadAssignmentAttachment = async (assignmentId, fileName) => {
  const response = await api.get(`/assignments/${assignmentId}/download`, {
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");

  link.href = url;
  link.setAttribute("download", fileName || "assignment-attachment");
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
};