import api from "./api";

export const getMyProfile = async () => {
  const response = await api.get("/profile/me");
  return response.data.data;
};

export const updateMyProfile = async (formData) => {
  const response = await api.put("/profile/me", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data.data;
};

export const changePassword = async (data) => {
  const response = await api.patch("/profile/change-password", data);
  return response.data.data;
};