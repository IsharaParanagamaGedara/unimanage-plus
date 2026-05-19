import api from "./api";

export const createServiceRequest = async (data) => {
  const response = await api.post("/student/service-requests", data);
  return response.data.data;
};

export const getMyServiceRequests = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.status) params.append("status", filters.status);
  if (filters.request_type) params.append("request_type", filters.request_type);

  const response = await api.get(`/student/service-requests?${params.toString()}`);
  return response.data.data;
};

export const getServiceRequestDetail = async (id) => {
  const response = await api.get(`/student/service-requests/${id}`);
  return response.data.data;
};