import api from "./api";

export const getServiceRequests = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.search) params.append("search", filters.search);
  if (filters.status) params.append("status", filters.status);
  if (filters.request_type) params.append("request_type", filters.request_type);
  if (filters.priority) params.append("priority", filters.priority);

  const response = await api.get(`/admin/service-requests?${params.toString()}`);
  return response.data.data;
};

export const getServiceRequestDetail = async (id) => {
  const response = await api.get(`/admin/service-requests/${id}`);
  return response.data.data;
};

export const updateServiceRequestStatus = async (id, data) => {
  const response = await api.patch(`/admin/service-requests/${id}/status`, data);
  return response.data.data;
};

export const getAssignableUsers = async () => {
  const response = await api.get("/admin/service-requests/assignable-users");
  return response.data.data;
};