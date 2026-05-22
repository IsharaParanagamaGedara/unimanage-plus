import api from "./api";

const buildQueryString = (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);
  if (filters.month) params.append("month", filters.month);
  if (filters.year) params.append("year", filters.year);
  if (filters.department_id) params.append("department_id", filters.department_id);
  if (filters.course_id) params.append("course_id", filters.course_id);
  if (filters.batch_id) params.append("batch_id", filters.batch_id);

  return params.toString();
};

const downloadCsv = async (url, fileName) => {
  const response = await api.get(url, {
    responseType: "blob",
  });

  const blob = new Blob([response.data], { type: "text/csv" });
  const downloadUrl = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = downloadUrl;
  link.setAttribute("download", fileName);

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(downloadUrl);
};

export const getReportPreview = async (reportType, filters = {}) => {
  const queryString = buildQueryString(filters);
  const url = queryString
    ? `/admin/reports/${reportType}?${queryString}`
    : `/admin/reports/${reportType}`;

  const response = await api.get(url);
  return response.data.data;
};

export const downloadFilteredReport = async (reportType, filters = {}) => {
  const queryString = buildQueryString(filters);
  const url = queryString
    ? `/admin/reports/${reportType}/export?${queryString}`
    : `/admin/reports/${reportType}/export`;

  const fileName = `${reportType.replaceAll("-", "_")}_report.csv`;

  await downloadCsv(url, fileName);
};