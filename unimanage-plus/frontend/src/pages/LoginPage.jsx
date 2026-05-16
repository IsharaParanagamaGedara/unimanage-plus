import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const redirectByRole = (role) => {
    if (role === "Admin") navigate("/admin/dashboard");
    else if (role === "Lecturer") navigate("/lecturer/dashboard");
    else if (role === "Student") navigate("/student/dashboard");
    else if (role === "Department Staff") navigate("/staff/dashboard");
    else navigate("/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");
      const user = await login(form.email, form.password);
      redirectByRole(user.role);
    } catch (err) {
      setError(
        err?.response?.data?.message || "Login failed. Please try again."
      );
    }
  };

  return (
    <div style={{ maxWidth: "420px", margin: "80px auto" }}>
      <h2>UniManage Plus Login</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Password</label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit">Login</button>
      </form>

      <p>
        Default Admin: <strong>admin@unimanage.com</strong>
      </p>
      <p>
        Password: <strong>Admin@123</strong>
      </p>
    </div>
  );
};

export default LoginPage;