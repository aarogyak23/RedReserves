import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FaBell, FaSpinner } from "react-icons/fa";
import "./Notifications.scss";

const API_URL = import.meta.env.VITE_API_URL;

export const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    // Add click event listener to close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      console.log("Fetching notifications...");
      const token =
        localStorage.getItem("token") || localStorage.getItem("adminToken");
      const isAdmin = !!localStorage.getItem("adminToken");
      const endpoint = isAdmin
        ? `${API_URL}/api/admin/notifications`
        : `${API_URL}/api/notifications`;

      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Notifications received:", response.data);

      // Parse the data field for each notification
      const parsedNotifications = response.data.map((notification) => {
        let parsedData = notification.data;
        if (typeof notification.data === "string") {
          try {
            parsedData = JSON.parse(notification.data);
          } catch (e) {
            console.error("Error parsing notification data:", e);
            parsedData = notification.data;
          }
        }
        return {
          ...notification,
          data: parsedData,
        };
      });

      // Count unread notifications
      const unreadCount = parsedNotifications.filter((n) => !n.read_at).length;
      console.log("Unread count:", unreadCount);

      setNotifications(parsedNotifications);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError("Failed to load notifications");
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("adminToken");
      const isAdmin = !!localStorage.getItem("adminToken");
      const endpoint = isAdmin
        ? `${API_URL}/api/admin/notifications/${notificationId}/read`
        : `${API_URL}/api/notifications/${notificationId}/read`;

      await axios.post(
        endpoint,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update local state
      setNotifications((prevNotifications) =>
        prevNotifications.map((n) =>
          n.id === notificationId
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      );

      // Close the dropdown
      setIsOpen(false);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleDonorAction = async (action, notification) => {
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("adminToken");
      console.log("Handling donor action:", action);

      if (action.method === "PUT" || action.method === "POST") {
        // Remove /api prefix if present
        const url = action.url.startsWith("/api/")
          ? action.url.substring(4)
          : action.url;
        const endpoint = `${API_URL}/api${url}`;
        console.log(
          "Making request to:",
          endpoint,
          "with method:",
          action.method
        );

        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        let response;
        if (action.method === "PUT") {
          response = await axios.put(endpoint, action.data, config);
        } else if (action.method === "POST") {
          response = await axios.post(endpoint, action.data, config);
        }

        console.log("Action response:", response.data);

        // Mark notification as read
        await markAsRead(notification.id);

        // Remove this notification from the list
        setNotifications((prevNotifications) =>
          prevNotifications.filter((n) => n.id !== notification.id)
        );

        // Close the dropdown
        setIsOpen(false);
      }
    } catch (error) {
      console.error("Error handling donor action:", error);
      if (error.response) {
        console.error("Error response:", error.response.data);
        alert(
          error.response.data.message ||
            "Failed to process the action. Please try again."
        );
      } else {
        alert("Failed to process the action. Please try again.");
      }
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      console.log("Clicking notification:", notification);

      // Mark notification as read
      await markAsRead(notification.id);

      // Update local state to reflect the notification is read
      setNotifications((prevNotifications) =>
        prevNotifications.map((n) =>
          n.id === notification.id
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      );

      // Don't navigate, just close the notification panel
      setIsOpen(false);
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <div className="notifications-container" ref={dropdownRef}>
      <button
        className="notification-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle notifications"
      >
        <FaBell className="notification-icon" />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            <button onClick={fetchNotifications} className="refresh-button">
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="notification-loading">
              <FaSpinner className="spinner" />
              <span>Loading notifications...</span>
            </div>
          ) : error ? (
            <div className="notification-error">{error}</div>
          ) : notifications.length === 0 ? (
            <div className="notification-empty">
              No notifications to display
            </div>
          ) : (
            <div className="notification-list">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${
                    !notification.read_at ? "unread" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleNotificationClick(notification);
                    }
                  }}
                >
                  <div className="notification-content">
                    <h4>{notification.data.title}</h4>
                    <p className="notification-message">
                      {notification.data.message}
                    </p>
                    <span className="notification-time">
                      {formatDate(notification.created_at)}
                    </span>
                  </div>
                  {notification.type ===
                    "App\\Notifications\\NewDonorNotification" &&
                    notification.data.actions?.length > 0 && (
                      <div className="notification-actions">
                        {notification.data.actions.map((action, index) => (
                          <button
                            key={index}
                            className={`action-btn ${action.label
                              .toLowerCase()
                              .replace(" ", "-")}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDonorAction(action, notification);
                            }}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;
