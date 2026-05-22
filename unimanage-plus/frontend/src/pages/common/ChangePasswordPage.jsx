import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { changePassword } from "../../services/profileService";
import "./ChangePasswordPage.css";

const ChangePasswordPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const toggleShow = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      setMessage("");

      await changePassword(form);

      setMessage("Password changed successfully.");

      setTimeout(() => {
        navigate("/profile");
      }, 800);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="change-password-page">
        <div className="password-card">
          <div className="password-header">
            <h1>Change Password</h1>
            <p>
              Update your account password. Temporary passwords must be changed
              before continuing normal use.
            </p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Current Password</label>
              <div className="password-field">
                <input
                  type={showPassword.current ? "text" : "password"}
                  name="current_password"
                  value={form.current_password}
                  onChange={handleChange}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => toggleShow("current")}
                >
                  {showPassword.current ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>New Password</label>
              <div className="password-field">
                <input
                  type={showPassword.new ? "text" : "password"}
                  name="new_password"
                  value={form.new_password}
                  onChange={handleChange}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => toggleShow("new")}
                >
                  {showPassword.new ? "🙈" : "👁️"}
                </button>
              </div>
              <small>Minimum 8 characters.</small>
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <div className="password-field">
                <input
                  type={showPassword.confirm ? "text" : "password"}
                  name="confirm_password"
                  value={form.confirm_password}
                  onChange={handleChange}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => toggleShow("confirm")}
                >
                  {showPassword.confirm ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button className="primary-btn" type="submit" disabled={loading}>
              {loading ? "Changing..." : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChangePasswordPage;