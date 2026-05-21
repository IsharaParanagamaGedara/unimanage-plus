import api from "./api";

export const getCourseMaterials = async (courseId) => {
  const response = await api.get(`/courses/${courseId}/materials`);
  return response.data.data;
};

export const uploadCourseMaterial = async (courseId, formData) => {
  const response = await api.post(`/courses/${courseId}/materials`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data.data;
};

export const updateCourseMaterial = async (materialId, data) => {
  const response = await api.put(`/course-materials/${materialId}`, data);
  return response.data.data;
};

export const updateCourseMaterialStatus = async (materialId, isActive) => {
  const response = await api.patch(`/course-materials/${materialId}/status`, {
    is_active: isActive,
  });

  return response.data.data;
};

export const downloadCourseMaterial = async (materialId, fileName) => {
  const response = await api.get(`/course-materials/${materialId}/download`, {
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");

  link.href = url;
  link.setAttribute("download", fileName || "course-material");
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
};