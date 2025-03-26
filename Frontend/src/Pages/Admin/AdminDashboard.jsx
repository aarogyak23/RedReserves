import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaUsers,
  FaTint,
  FaSignOutAlt,
  FaSearch,
  FaFilter,
  FaSort,
} from "react-icons/fa";
import "./AdminDashboard.scss";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [bloodRequests, setBloodRequests] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login");
      return;
    }

    const fetchData = async () => {
      try {
        const [usersResponse, requestsResponse] = await Promise.all([
          axios.get("http://localhost:8000/api/admin/users", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:8000/api/admin/blood-requests", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setUsers(usersResponse.data);
        setBloodRequests(requestsResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      const token = localStorage.getItem("adminToken");
      await axios.put(
        `http://localhost:8000/api/admin/blood-requests/${requestId}/status`,
        {
          status: newStatus,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const response = await axios.get(
        "http://localhost:8000/api/admin/blood-requests",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setBloodRequests(response.data);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const filteredRequests = bloodRequests.filter((request) => {
    const matchesSearch =
      request.requester_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.blood_group.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || request.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.blood_group.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <div className="logo-section">
            <h1>Blood Bank Admin</h1>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Stats Cards */}
        <div className="cards-grid">
          {/* Users Card */}
          <div
            className={`card ${selectedCard === "users" ? "selected" : ""}`}
            onClick={() =>
              setSelectedCard(selectedCard === "users" ? null : "users")
            }
          >
            <div className="card-content">
              <div className="card-info">
                <div className="icon-wrapper">
                  <FaUsers />
                </div>
                <div className="text-content">
                  <h2>Registered Users</h2>
                  <p>{users.length}</p>
                </div>
              </div>
              <div className="arrow">
                {selectedCard === "users" ? "▼" : "▶"}
              </div>
            </div>
          </div>

          {/* Blood Requests Card */}
          <div
            className={`card ${selectedCard === "requests" ? "selected" : ""}`}
            onClick={() =>
              setSelectedCard(selectedCard === "requests" ? null : "requests")
            }
          >
            <div className="card-content">
              <div className="card-info">
                <div className="icon-wrapper">
                  <FaTint />
                </div>
                <div className="text-content">
                  <h2>Blood Requests</h2>
                  <p>{bloodRequests.length}</p>
                </div>
              </div>
              <div className="arrow">
                {selectedCard === "requests" ? "▼" : "▶"}
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="content-area">
          {/* Search and Filter Bar */}
          <div className="search-filter-bar">
            <div className="search-input">
              <FaSearch />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {selectedCard === "requests" && (
              <div className="filter-section">
                <FaFilter />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            )}
          </div>

          {/* Users Table */}
          {selectedCard === "users" && (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>
                      <div className="header-cell">
                        <span>Name</span>
                        <FaSort />
                      </div>
                    </th>
                    <th>
                      <div className="header-cell">
                        <span>Email</span>
                        <FaSort />
                      </div>
                    </th>
                    <th>
                      <div className="header-cell">
                        <span>Blood Group</span>
                        <FaSort />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.user_id}>
                      <td>
                        <div className="user-info">
                          <div className="avatar">
                            {user.name[0]}
                            {user.last_name[0]}
                          </div>
                          <div className="name">
                            {user.name} {user.last_name}
                          </div>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className="status-badge pending">
                          {user.blood_group}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Blood Requests Table */}
          {selectedCard === "requests" && (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>
                      <div className="header-cell">
                        <span>Requester</span>
                        <FaSort />
                      </div>
                    </th>
                    <th>
                      <div className="header-cell">
                        <span>Blood Group</span>
                        <FaSort />
                      </div>
                    </th>
                    <th>
                      <div className="header-cell">
                        <span>Status</span>
                        <FaSort />
                      </div>
                    </th>
                    <th>
                      <div className="header-cell">
                        <span>Date</span>
                        <FaSort />
                      </div>
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => (
                    <tr key={request.id}>
                      <td>
                        <div className="user-info">
                          <div className="avatar">
                            {request.requester_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div className="name">{request.requester_name}</div>
                        </div>
                      </td>
                      <td>
                        <span className="status-badge pending">
                          {request.blood_group}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            request.status === "approved"
                              ? "approved"
                              : request.status === "rejected"
                              ? "rejected"
                              : "pending"
                          }`}
                        >
                          {request.status}
                        </span>
                      </td>
                      <td>
                        {new Date(request.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        {request.status === "pending" && (
                          <div className="action-buttons">
                            <button
                              className="approve"
                              onClick={() =>
                                handleStatusUpdate(request.id, "approved")
                              }
                            >
                              Approve
                            </button>
                            <button
                              className="reject"
                              onClick={() =>
                                handleStatusUpdate(request.id, "rejected")
                              }
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
