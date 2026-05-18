import api from "./api";

export const getAvailableBatches = async (search = "") => {
  const params = new URLSearchParams();

  if (search) params.append("search", search);

  const response = await api.get(`/student/available-batches?${params.toString()}`);
  return response.data.data;
};

export const applyToBatch = async (data) => {
  const response = await api.post("/student/course-applications", data);
  return response.data.data;
};

export const getMyApplications = async () => {
  const response = await api.get("/student/course-applications");
  return response.data.data;
};