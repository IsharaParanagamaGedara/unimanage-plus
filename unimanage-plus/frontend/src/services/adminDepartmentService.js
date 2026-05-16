import api from "./api";

export const getDepartments = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.search) params.append("search", filters.search);
  if (filters.status) params.append("status", filters.status);

  const response = await api.get(`/admin/departments/manage?${params.toString()}`);
  return response.data.data;
};

export const getDepartmentById = async (id) => {
  const response = await api.get(`/admin/departments/${id}`);
  return response.data.data;
};

export const createDepartment = async (data) => {
  const response = await api.post("/admin/departments", data);
  return response.data.data;
};

export const updateDepartment = async (id, data) => {
  const response = await api.put(`/admin/departments/${id}`, data);
  return response.data.data;
};

export const updateDepartmentStatus = async (id, isActive) => {
  const response = await api.patch(`/admin/departments/${id}/status`, {
    is_active: isActive,
  });

  return response.data.data;
};