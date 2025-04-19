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
      let parsedNotifications = response.data.map((notification) => {
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

      // For donor notifications, check their current status
      const donorNotifications = parsedNotifications.filter(
        (n) => n.type === "App\\Notifications\\NewDonorNotification"
      );

      // Create a map to store donor statuses and their notifications
      const donorStatuses = new Map();
      const donorNotificationMap = new Map();

      // Track processed request IDs to avoid duplicate API calls
      const processedRequests = new Set();

      // First, group notifications by donor
      donorNotifications.forEach((notification) => {
        const data = notification.data;
        const donorId = data.donor_id || data.id;
        const requestId = data.request_id || data.blood_request_id;
        const key = `${requestId}-${donorId}`;

        if (!donorNotificationMap.has(key)) {
          donorNotificationMap.set(key, []);
        }
        donorNotificationMap.get(key).push(notification);
      });

      // Fetch current status for all donors
      for (const [key] of donorNotificationMap) {
        const [requestId, donorId] = key.split("-");

        if (!processedRequests.has(requestId)) {
          try {
            processedRequests.add(requestId);
            const donorResponse = await axios.get(
              `${API_URL}/api/blood-requests/${requestId}/donors`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            // Process all donors for this request
            if (Array.isArray(donorResponse.data)) {
              donorResponse.data.forEach((donor) => {
                const dId = donor.id || donor.donor_id;
                if (dId) {
                  donorStatuses.set(
                    `${requestId}-${dId}`,
                    donor.status || "pending"
                  );
                }
              });
            }
          } catch (error) {
            console.warn(`Could not fetch status for donor ${donorId}:`, error);
            // If we can't fetch the status, don't show any notifications for this donor
            donorStatuses.set(key, "error");
          }
        }
      }

      // Filter and update notifications
      parsedNotifications = parsedNotifications.filter((notification) => {
        if (notification.type === "App\\Notifications\\NewDonorNotification") {
          const data = notification.data;
          const donorId = data.donor_id || data.id;
          const requestId = data.request_id || data.blood_request_id;
          const key = `${requestId}-${donorId}`;
          const status = donorStatuses.get(key);

          // If we couldn't get the status or there was an error, remove the notification
          if (!status || status === "error") return false;

          // Get all notifications for this donor
          const donorNotifications = donorNotificationMap.get(key) || [];

          // Sort notifications by date, newest first
          donorNotifications.sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          );

          // If the donor has been accepted or rejected
          if (status === "accepted" || status === "rejected") {
            // Only keep the newest notification and update its content
            if (notification === donorNotifications[0]) {
              notification.data = {
                ...data,
                status: status,
                actionTaken: true,
                title:
                  status === "accepted"
                    ? "Donation Offer Approved"
                    : "Donation Offer Rejected",
                message:
                  status === "accepted"
                    ? `You have approved ${data.name}'s offer to donate blood.`
                    : `You have declined ${data.name}'s offer to donate blood.`,
                actions: [], // Remove all actions
              };
              return true;
            }
            return false;
          }

          // For pending status, only show if it's actually pending
          return status === "pending";
        }
        return true;
      });

      // Sort notifications by creation date, newest first
      parsedNotifications.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

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
      console.log("Full notification data:", notification);
      console.log("Notification type:", notification.type);
      console.log("Action data:", notification.data);

      if (action.method === "GET") {
        // For view details, construct the URL correctly
        const data = notification.data;
        const requestId = data.request_id || data.blood_request_id;
        const donorId = data.donor_id || data.id;
        console.log("Parsed IDs:", { requestId, donorId });

        const frontendUrl = `/blood-requests/${requestId}/donors/${donorId}`;
        console.log("Navigating to:", frontendUrl);
        navigate(frontendUrl);
        setIsOpen(false);
        return;
      }

      if (action.method === "PUT" || action.method === "POST") {
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

        // Update notifications immediately after action
        setNotifications((prevNotifications) =>
          prevNotifications
            .map((n) => {
              // Update the status for all notifications related to this donor
              if (
                n.type === "App\\Notifications\\NewDonorNotification" &&
                ((n.data.donor_id &&
                  n.data.donor_id === notification.data.donor_id) ||
                  (n.data.id && n.data.id === notification.data.id))
              ) {
                const updatedData = {
                  ...n.data,
                  status: action.data.status,
                  actionTaken: true,
                  title:
                    action.data.status === "accepted"
                      ? "Donation Offer Approved"
                      : "Donation Offer Rejected",
                  message:
                    action.data.status === "accepted"
                      ? `You have approved ${n.data.name}'s offer to donate blood.`
                      : `You have declined ${n.data.name}'s offer to donate blood.`,
                  actions: [], // Remove all actions
                };
                return {
                  ...n,
                  data: updatedData,
                  read_at: null, // Mark as unread so the user sees the status change
                };
              }
              return n;
            })
            .filter((n) => {
              // Remove duplicate "New Donor Available" notifications for this donor
              if (n.type === "App\\Notifications\\NewDonorNotification") {
                const donorId = n.data.donor_id || n.data.id;
                const notificationDonorId =
                  notification.data.donor_id || notification.data.id;
                const isPendingNotification =
                  !n.data.actionTaken && n.data.status === "pending";
                const isSameDonor = donorId === notificationDonorId;

                // Keep the notification if:
                // 1. It's not for the same donor, OR
                // 2. It's for the same donor but it's the status update notification
                return !isSameDonor || !isPendingNotification;
              }
              return true;
            })
        );

        // Fetch updated notifications to ensure we have the latest state
        await fetchNotifications();

        // Show success message
        alert(
          response.data.message ||
            `Donor has been ${action.data.status} successfully`
        );
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

  const handleNotificationClick = async (notification) => {
    try {
      console.log("Clicking notification:", notification);
      const data = notification.data;
      const currentUser = JSON.parse(localStorage.getItem("user"));
      const isRequester = data.requester_id === currentUser.id;

      // Mark notification as read
      await markAsRead(notification.id);

      // For donor notifications
      if (notification.type === "App\\Notifications\\NewDonorNotification") {
        const status = data.status;

        // If the notification is for accepted/rejected status, just mark as read and return
        if (status === "accepted" || status === "rejected") {
          console.log(`${status} notification clicked - marking as read only`);
          setIsOpen(false);
          return;
        }

        // Only navigate for pending donor notifications for requesters
        if (isRequester && !data.actionTaken && status === "pending") {
          const requestId = data.request_id || data.blood_request_id;
          const donorId = data.donor_id || data.id;

          if (requestId && donorId) {
            const frontendUrl = `/blood-requests/${requestId}/donors/${donorId}`;
            console.log(
              "Requester viewing pending donor - navigating to:",
              frontendUrl
            );
            navigate(frontendUrl);
            setIsOpen(false);
            return;
          }
        }
      }

      // For other notifications that should navigate
      const formattedNotification = formatNotificationMessage(notification);
      if (
        formattedNotification.url &&
        (!notification.data.status || notification.data.status === "pending")
      ) {
        const frontendUrl = formattedNotification.url.replace("/api/", "/");
        console.log("Navigating to:", frontendUrl);
        navigate(frontendUrl);
      }
      setIsOpen(false);
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
  };

  const formatNotificationMessage = (notification) => {
    const data = notification.data;
    console.log("Formatting notification data:", data);
    let requestId, donorId, title, message;
    const currentUser = JSON.parse(localStorage.getItem("user"));
    const isRequester = data.requester_id === currentUser.id;
    const isDonor =
      data.donor_id === currentUser.id || data.id === currentUser.id;
    const isPending = data.status === "pending" || !data.status;

    switch (notification.type) {
      case "App\\Notifications\\NewDonorNotification":
        requestId = data.request_id || data.blood_request_id;
        donorId = data.donor_id || data.id;

        // Format the title based on the status and user role
        if (data.status === "accepted") {
          title = isDonor
            ? "Donation Offer Approved"
            : "Donation Offer Approved";
          message = isDonor
            ? `Your donation offer has been approved! Thank you for your generosity.`
            : `You have approved ${data.name}'s offer to donate blood.`;
        } else if (data.status === "rejected") {
          title = isDonor
            ? "Donation Offer Rejected"
            : "Donation Offer Rejected";
          message = isDonor
            ? `Your donation offer has been declined.`
            : `You have declined ${data.name}'s offer to donate blood.`;
        } else {
          title = "New Donor Available";
          message = isRequester
            ? `${data.name} has volunteered to donate ${data.blood_group} blood for your request`
            : `You have volunteered to donate ${data.blood_group} blood for request #${requestId}`;
        }

        return {
          title: title,
          message: message,
          status: data.status,
          actionTaken: data.actionTaken,
          // Only include URL for pending notifications to requesters
          url:
            isPending && isRequester
              ? `/blood-requests/${requestId}/donors/${donorId}`
              : null,
          // Only include actions for pending notifications to requesters
          actions:
            isPending && isRequester
              ? [
                  {
                    label: "View Details",
                    method: "GET",
                    url: `/blood-requests/${requestId}/donors/${donorId}`,
                  },
                  {
                    label: "Accept Donor",
                    method: "PUT",
                    url: `/blood-requests/${requestId}/donors/${donorId}/accept`,
                    data: { status: "accepted" },
                  },
                  {
                    label: "Decline Donor",
                    method: "PUT",
                    url: `/blood-requests/${requestId}/donors/${donorId}/reject`,
                    data: { status: "rejected" },
                  },
                ]
              : [],
          icon: "donor",
        };
      case "App\\Notifications\\BloodRequestApproved":
        return {
          title: "Blood Request Approved",
          message: data.message,
          url: "/blood-requests",
          icon: "approved",
        };
      case "App\\Notifications\\NewCampaignNotification":
        return {
          title: data.title || "New Campaign",
          message: data.message,
          url: "/campaigns",
          icon: "campaign",
        };
      default:
        return {
          title: "Notification",
          message: data.message,
          url: data.url ? data.url.replace("/api/", "/") : "/",
          icon: "default",
        };
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
                  } ${notification.data.actionTaken ? "action-taken" : ""}`}
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
                      {notification.data.actionTaken && (
                        <span className="action-status">
                          {" "}
                          (
                          {notification.data.status === "accepted"
                            ? "Accepted"
                            : "Declined"}
                          )
                        </span>
                      )}
                    </p>
                    <span className="notification-time">
                      {formatDate(notification.created_at)}
                    </span>
                  </div>
                  {notification.type ===
                    "App\\Notifications\\NewDonorNotification" &&
                    notification.data.actions?.length > 0 &&
                    !notification.data.actionTaken && (
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
                            disabled={notification.data.actionTaken}
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
