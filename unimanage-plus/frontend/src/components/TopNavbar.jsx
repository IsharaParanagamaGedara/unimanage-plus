import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
} from "../services/notificationService";
import "./TopNavbar.css";

const TopNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notificationCount, setNotificationCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const loadNotificationData = async () => {
    try {
      const [count, notifications] = await Promise.all([
        getUnreadNotificationCount(),
        getNotifications(true),
      ]);

      setNotificationCount(count);
      setRecentNotifications(notifications.slice(0, 5));
    } catch (err) {
      console.error("Failed to load notification data", err);
    }
  };

  useEffect(() => {
    loadNotificationData();

    const interval = setInterval(() => {
      loadNotificationData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (notification) => {
    try {
      await markNotificationAsRead(notification.id);
      await loadNotificationData();
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const goToNotifications = () => {
    setShowNotifications(false);
    navigate("/notifications");
  };

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
        <div className="notification-wrapper">
          <button
            type="button"
            className="notification-btn"
            onClick={() => setShowNotifications((prev) => !prev)}
          >
            🔔
            {notificationCount > 0 && (
              <span className="notification-badge">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-dropdown-header">
                <h4>Notifications</h4>
                <button type="button" onClick={goToNotifications}>
                  View All
                </button>
              </div>

              {recentNotifications.length === 0 ? (
                <p className="notification-empty">No unread notifications.</p>
              ) : (
                <div className="notification-preview-list">
                  {recentNotifications.map((notification) => (
                    <button
                      type="button"
                      className="notification-preview-item"
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <strong>{notification.title}</strong>
                      <span>{notification.message}</span>
                      <small>
                        {notification.created_at
                          ? new Date(notification.created_at).toLocaleString()
                          : "-"}
                      </small>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

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