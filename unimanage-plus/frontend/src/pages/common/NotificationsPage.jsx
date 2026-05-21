import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../../services/notificationService";
import "./NotificationsPage.css";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getNotifications(unreadOnly);
      setNotifications(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [unreadOnly]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      setActionLoading(true);
      setError("");
      setMessage("");

      await markNotificationAsRead(notificationId);

      setMessage("Notification marked as read.");
      loadNotifications();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update notification.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setActionLoading(true);
      setError("");
      setMessage("");

      await markAllNotificationsAsRead();

      setMessage("All notifications marked as read.");
      loadNotifications();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update notifications.");
    } finally {
      setActionLoading(false);
    }
  };

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  return (
    <DashboardLayout>
      <div className="notifications-page">
        <div className="page-header-row">
          <div>
            <h1>Notifications</h1>
            <p>View system alerts, workflow updates, and academic activity notifications.</p>
          </div>

          <button
            className="primary-btn"
            onClick={handleMarkAllAsRead}
            disabled={actionLoading || unreadCount === 0}
          >
            Mark All as Read
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <div className="notification-summary-grid">
          <div className="summary-card">
            <span>Total Notifications</span>
            <strong>{notifications.length}</strong>
          </div>

          <div className="summary-card">
            <span>Unread</span>
            <strong>{unreadCount}</strong>
          </div>
        </div>

        <div className="filter-card">
          <label className="checkbox-filter">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
            />
            Show unread only
          </label>
        </div>

        <div className="notification-list-card">
          {loading ? (
            <p className="table-message">Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <p className="table-message">No notifications found.</p>
          ) : (
            <div className="notification-list">
              {notifications.map((notification) => (
                <div
                  className={
                    notification.is_read
                      ? "notification-item read"
                      : "notification-item unread"
                  }
                  key={notification.id}
                >
                  <div className="notification-icon">
                    {notification.type?.charAt(0) || "N"}
                  </div>

                  <div className="notification-content">
                    <div className="notification-title-row">
                      <h3>{notification.title}</h3>
                      <span className="notification-type">{notification.type}</span>
                    </div>

                    <p>{notification.message}</p>

                    <span className="notification-date">
                      {notification.created_at
                        ? new Date(notification.created_at).toLocaleString()
                        : "-"}
                    </span>
                  </div>

                  {!notification.is_read && (
                    <button
                      className="secondary-btn small-btn"
                      onClick={() => handleMarkAsRead(notification.id)}
                      disabled={actionLoading}
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage;