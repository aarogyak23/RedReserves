import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./AdminPanel.scss";

const AdminPanel = () => {
  const navigate = useNavigate();
  const [bloodRequests, setBloodRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("requests"); // "requests" or "users"

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login");
      return;
    }

    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const [requestsResponse, usersResponse] = await Promise.all([
        axios.get("/api/admin/blood-requests", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }),
        axios.get("/api/admin/users", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }),
      ]);

      setBloodRequests(requestsResponse.data.requests || []);
      setUsers(usersResponse.data.users || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch data");
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        navigate("/admin/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      const token = localStorage.getItem("adminToken");
      await axios.put(
        `/api/admin/blood-requests/${requestId}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      fetchData(); // Refresh data after update
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        navigate("/admin/login");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-tabs">
        <button
          className={`tab-button ${activeTab === "requests" ? "active" : ""}`}
          onClick={() => setActiveTab("requests")}
        >
          Blood Requests
        </button>
        <button
          className={`tab-button ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          Users
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === "requests" ? (
          <div className="requests-grid">
            {bloodRequests.map((request) => (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <h3>{request.patientName}</h3>
                  <span className={`status-badge ${request.status}`}>
                    {request.status}
                  </span>
                </div>
                <div className="request-details">
                  <p>
                    <strong>Blood Type:</strong> {request.bloodType}
                  </p>
                  <p>
                    <strong>Units Required:</strong> {request.units}
                  </p>
                  <p>
                    <strong>Hospital:</strong> {request.hospital}
                  </p>
                  <p>
                    <strong>Contact:</strong> {request.contactNumber}
                  </p>
                  <p>
                    <strong>Email:</strong> {request.email}
                  </p>
                  {request.notes && (
                    <p>
                      <strong>Notes:</strong> {request.notes}
                    </p>
                  )}
                </div>
                <div className="request-footer">
                  <span className="request-date">
                    {new Date(request.created_at).toLocaleDateString()}
                  </span>
                  <div className="request-actions">
                    <button
                      className="action-button approve"
                      onClick={() => handleStatusUpdate(request.id, "approved")}
                      disabled={request.status === "approved"}
                    >
                      Approve
                    </button>
                    <button
                      className="action-button reject"
                      onClick={() => handleStatusUpdate(request.id, "rejected")}
                      disabled={request.status === "rejected"}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="users-grid">
            {users.map((user) => (
              <div key={user.id} className="user-card">
                <div className="user-header">
                  <h3>{user.name}</h3>
                </div>
                <div className="user-details">
                  <p>
                    <strong>Email:</strong> {user.email}
                  </p>
                  <p>
                    <strong>Blood Type:</strong> {user.bloodType}
                  </p>
                  <p>
                    <strong>Phone:</strong> {user.phone}
                  </p>
                  <p>
                    <strong>Location:</strong> {user.location}
                  </p>
                </div>
                <div className="user-footer">
                  <span className="user-date">
                    Joined: {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
