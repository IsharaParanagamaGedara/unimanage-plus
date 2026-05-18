import api from "./api";

export const getMyEnrollments = async () => {
  const response = await api.get("/student/enrollments");
  return response.data.data;
};