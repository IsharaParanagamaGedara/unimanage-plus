import api from "./api";

const buildQueryString = (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.department_id) params.append("department_id", filters.department_id);
  if (filters.course_id) params.append("course_id", filters.course_id);
  if (filters.batch_id) params.append("batch_id", filters.batch_id);
  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);
  if (filters.month) params.append("month", filters.month);
  if (filters.year) params.append("year", filters.year);

  return params.toString();
};

export const getAdminAnalyticsOverview = async (filters = {}) => {
  const queryString = buildQueryString(filters);

  const url = queryString
    ? `/admin/analytics/overview?${queryString}`
    : "/admin/analytics/overview";

  const response = await api.get(url);
  return response.data.data;
};