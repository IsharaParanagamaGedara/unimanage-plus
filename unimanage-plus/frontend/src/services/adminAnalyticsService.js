import api from "./api";

export const getAdminAnalyticsOverview = async () => {
  const response = await api.get("/admin/analytics/overview");
  return response.data.data;
};