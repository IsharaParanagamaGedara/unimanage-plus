import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./TopNavbar.css";

const TopNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="top-navbar">
      <div>
        <h3>Dashboard</h3>
        <p>{user?.role}</p>
      </div>

      <div className="top-actions">
        <button className="notification-btn">🔔</button>

        <div className="user-box">
          <div className="avatar">
            {user?.first_name?.charAt(0)}
            {user?.last_name?.charAt(0)}
          </div>

          <div className="user-info">
            <strong>
              {user?.first_name} {user?.last_name}
            </strong>
            <span>{user?.email}</span>
          </div>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default TopNavbar;