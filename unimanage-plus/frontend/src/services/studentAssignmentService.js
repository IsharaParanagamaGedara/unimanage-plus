import api from "./api";

export const getStudentAssignments = async (search = "") => {
  const params = new URLSearchParams();

  if (search) params.append("search", search);

  const response = await api.get(`/student/assignments?${params.toString()}`);
  return response.data.data;
};

export const getStudentAssignmentById = async (id) => {
  const response = await api.get(`/student/assignments/${id}`);
  return response.data.data;
};

export const submitStudentAssignment = async (assignmentId, formData) => {
  const response = await api.post(
    `/student/assignments/${assignmentId}/submit`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  return response.data.data;
};

export const getMySubmissions = async () => {
  const response = await api.get("/student/submissions");
  return response.data.data;
};

export const downloadMySubmissionFile = async (submissionId, fileName) => {
  const response = await api.get(`/student/submissions/${submissionId}/download`, {
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