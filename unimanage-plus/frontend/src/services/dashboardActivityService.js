import api from "./api";

export const getAdminDashboardActivity = async () => {
  const response = await api.get("/admin/dashboard/activity");
  return response.data.data;
};

export const getLecturerDashboardActivity = async () => {
  const response = await api.get("/lecturer/dashboard/activity");
  return response.data.data;
};

export const getStudentDashboardActivity = async () => {
  const response = await api.get("/student/dashboard/activity");
  return response.data.data;
};

export const getStaffDashboardActivity = async () => {
  const response = await api.get("/staff/dashboard/activity");
  return response.data.data;
};