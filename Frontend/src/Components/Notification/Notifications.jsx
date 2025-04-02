import React from "react";
import { useState, useEffect } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import "./Notifications.scss";

export const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNotifications();
    // Set up polling for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      console.log("Fetching notifications...");
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No authentication token found");
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/notifications`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Notifications received:", response.data);
      setNotifications(response.data);
      const unread = response.data.filter((n) => !n.read_at).length;
      console.log("Unread count:", unread);
      setUnreadCount(unread);
      setError(null);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError(
        error.response?.data?.message || "Failed to fetch notifications"
      );
    }
  };

  const markAsRead = async (id) => {
    try {
      console.log("Marking notification as read:", id);
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No authentication token found");
        return;
      }

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/notifications/${id}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      await fetchNotifications(); // Refresh notifications after marking as read
    } catch (error) {
      console.error("Error marking notification as read:", error);
      setError("Failed to mark notification as read");
    }
  };

  return (
    <div className="notifications-container">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="notification-button"
      >
        <BellIcon className="notification-icon" />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            <button onClick={fetchNotifications} className="refresh-button">
              Refresh
            </button>
          </div>
          <div className="notification-list">
            {error ? (
              <div className="notification-error">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">No notifications</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${
                    !notification.read_at ? "unread" : ""
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <p className="notification-message">
                    {notification.data.message}
                  </p>
                  <p className="notification-time">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
