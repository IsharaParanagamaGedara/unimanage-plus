import api from "./api";

const buildQueryString = (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.search) params.append("search", filters.search);
  if (filters.action) params.append("action", filters.action);
  if (filters.user_id) params.append("user_id", filters.user_id);
  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);
  if (filters.month) params.append("month", filters.month);
  if (filters.year) params.append("year", filters.year);

  return params.toString();
};

export const getAuditLogs = async (filters = {}) => {
  const queryString = buildQueryString(filters);
  const url = queryString
    ? `/admin/audit-logs?${queryString}`
    : "/admin/audit-logs";

  const response = await api.get(url);
  return response.data.data;
};

export const getAuditLogActions = async () => {
  const response = await api.get("/admin/audit-logs/actions");
  return response.data.data;
};

export const getAuditLogById = async (id) => {
  const response = await api.get(`/admin/audit-logs/${id}`);
  return response.data.data;
};