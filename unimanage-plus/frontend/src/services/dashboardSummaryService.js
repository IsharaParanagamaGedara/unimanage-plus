import api from "./api";

export const getAdminDashboardSummary = async () => {
  const response = await api.get("/admin/dashboard/summary");
  return response.data.data;
};

export const getLecturerDashboardSummary = async () => {
  const response = await api.get("/lecturer/dashboard/summary");
  return response.data.data;
};

export const getStudentDashboardSummary = async () => {
  const response = await api.get("/student/dashboard/summary");
  return response.data.data;
};

export const getStaffDashboardSummary = async () => {
  const response = await api.get("/staff/dashboard/summary");
  return response.data.data;
};