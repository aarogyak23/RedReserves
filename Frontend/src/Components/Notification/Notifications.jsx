import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

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

      if (action.method === "POST" || action.method === "PUT") {
        const endpoint = `${API_URL}/api${action.url}`;
        console.log("Making request to:", endpoint);

        if (action.method === "PUT") {
          await axios.put(endpoint, action.data, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        } else {
          await axios.post(endpoint, action.data, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        }

        // Refresh notifications after action
        fetchNotifications();
      }

      // Mark notification as read
      await markAsRead(notification.id);

      // Navigate if needed
      if (action.url && action.method === "GET") {
        navigate(action.url);
      }

      setIsOpen(false);
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

  const formatNotificationMessage = (notification) => {
    const data = notification.data;

    switch (notification.type) {
      case "App\\Notifications\\NewDonorNotification":
        return {
          title: data.title || "New Donor Available",
          message: data.message,
          actions: data.actions || [],
          url: data.url || "/blood-requests",
          icon: "donor",
        };
      case "App\\Notifications\\BloodRequestApproved":
        return {
          title: "Blood Request Approved",
          message: data.message,
          url: data.url || "/blood-requests",
          icon: "approved",
        };
      default:
        return {
          title: "Notification",
          message: data.message,
          url: data.url || "/",
          icon: "default",
        };
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      console.log("Clicking notification:", notification);

      // Mark notification as read
      await markAsRead(notification.id);

      // Get formatted notification data
      const formattedNotification = formatNotificationMessage(notification);
      console.log("Formatted notification:", formattedNotification);

      // If it's a donor notification with actions, don't navigate automatically
      if (
        notification.type === "App\\Notifications\\NewDonorNotification" &&
        notification.data.actions?.length > 0
      ) {
        return;
      }

      // Navigate to the URL if present
      if (formattedNotification.url) {
        navigate(formattedNotification.url);
        setIsOpen(false);
      }
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
