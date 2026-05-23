import api from "./api";

const buildQueryString = (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.search) params.append("search", filters.search);
  if (filters.programme) params.append("programme", filters.programme);
  if (filters.year_of_study) params.append("year_of_study", filters.year_of_study);

  return params.toString();
};

export const getStaffStudents = async (filters = {}) => {
  const queryString = buildQueryString(filters);

  const url = queryString
    ? `/staff/students?${queryString}`
    : "/staff/students";

  const response = await api.get(url);
  return response.data.data;
};

export const getStaffStudentById = async (studentId) => {
  const response = await api.get(`/staff/students/${studentId}`);
  return response.data.data;
};

export const getStaffStudentFilterOptions = async () => {
  const response = await api.get("/staff/students/filter-options");
  return response.data.data;
};