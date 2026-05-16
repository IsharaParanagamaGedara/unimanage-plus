import api from "./api";

export const getUsers = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.search) params.append("search", filters.search);
  if (filters.role_id) params.append("role_id", filters.role_id);
  if (filters.status) params.append("status", filters.status);

  const response = await api.get(`/admin/users?${params.toString()}`);
  return response.data.data;
};

export const getUserById = async (id) => {
  const response = await api.get(`/admin/users/${id}`);
  return response.data.data;
};

export const createUser = async (data) => {
  const response = await api.post("/admin/users", data);
  return response.data.data;
};

export const updateUser = async (id, data) => {
  const response = await api.put(`/admin/users/${id}`, data);
  return response.data.data;
};

export const updateUserStatus = async (id, isActive) => {
  const response = await api.patch(`/admin/users/${id}/status`, {
    is_active: isActive,
  });

  return response.data.data;
};

export const getRoles = async () => {
  const response = await api.get("/admin/roles");
  return response.data.data;
};

export const getDepartments = async () => {
  const response = await api.get("/admin/departments");
  return response.data.data;
};