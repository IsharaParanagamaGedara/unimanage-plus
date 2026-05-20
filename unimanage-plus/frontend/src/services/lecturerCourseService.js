import api from "./api";

export const getMyLecturerCourses = async () => {
  const response = await api.get("/lecturer/my-courses");
  return response.data.data;
};

export const getLecturerCourseDetail = async (courseId) => {
  const response = await api.get(`/lecturer/my-courses/${courseId}`);
  return response.data.data;
};