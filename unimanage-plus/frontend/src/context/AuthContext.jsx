import { createContext, useContext, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const storedUser = localStorage.getItem("user");

  const [user, setUser] = useState(
    storedUser ? JSON.parse(storedUser) : null
  );

  const login = async (email, password) => {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    const token = response.data.data.access_token;
    const userData = response.data.data.user;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));

    setUser(userData);

    return userData;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);