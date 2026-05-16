import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo1.png";
import "./LoginPage.css";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      setLoading(true);

      const user = await login(form.email, form.password);
      redirectByRole(user.role);
    } catch (err) {
      setError(
        err?.response?.data?.message || "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-background-shape shape-one"></div>
      <div className="login-background-shape shape-two"></div>

      <section className="login-left">
        <div className="brand-panel">
          <img src={logo} alt="UniManage Plus Logo" className="login-logo" />

          <h1>UniManage Plus</h1>
          <h3>Smart University Service Management Platform</h3>

          <p>
            A secure academic management system designed for role-based access,
            streamlined university workflows, service requests, analytics, and
            centralized administration.
          </p>

          <div className="brand-highlights">
            <span>Role-Based Access</span>
            <span>Academic Workflows</span>
            <span>Analytics Ready</span>
          </div>
        </div>
      </section>

      <section className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <h2>Welcome Back</h2>
            <p>Please sign in to continue to your dashboard.</p>
          </div>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                name="email"
                type="email"
                placeholder="Enter your academic email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>

              <div className="password-field">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <div className="demo-box">
            <p>Default Admin Access</p>
            <span>admin@unimanage.com</span>
            <span>Admin@123</span>
          </div>
        </div>

        <footer className="login-footer">
          © 2026 UniManage Plus. Smart academic service management system.
        </footer>
      </section>
    </div>
  );
};

export default LoginPage;