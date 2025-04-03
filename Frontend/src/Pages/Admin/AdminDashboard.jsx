import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaUsers,
  FaTint,
  FaSignOutAlt,
  FaSearch,
  FaFilter,
  FaSort,
  FaBuilding,
  FaHandHoldingHeart,
} from "react-icons/fa";
import "./AdminDashboard.scss";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [bloodRequests, setBloodRequests] = useState([]);
  const [orgRequests, setOrgRequests] = useState([]);
  const [donorSubmissions, setDonorSubmissions] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedOrgRequest, setSelectedOrgRequest] = useState(null);
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("adminToken");
      const user = JSON.parse(localStorage.getItem("adminUser") || "{}");

      if (!token || !user.is_admin) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
        return false;
      }

      // Configure axios defaults
      axios.defaults.baseURL = API_URL;
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      axios.defaults.headers.common["Accept"] = "application/json";
      axios.defaults.headers.common["Content-Type"] = "application/json";
      axios.defaults.withCredentials = false;

      return true;
    };

    const initializeData = async () => {
      if (checkAuth()) {
        await fetchData();
      }
    };

    initializeData();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      // Create an axios instance with specific configuration
      const axiosInstance = axios.create({
        baseURL: API_URL,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        withCredentials: false,
      });

      console.log(
        "Fetching data with token:",
        localStorage.getItem("adminToken")
      );

      const [usersRes, bloodReqRes, orgReqRes, donorSubmissionsRes] =
        await Promise.all([
          axiosInstance.get("/api/admin/users"),
          axiosInstance.get("/api/admin/blood-requests"),
          axiosInstance.get("/api/admin/organization-requests"),
          axiosInstance.get("/api/admin/donor-submissions"),
        ]);

      console.log("Users response:", usersRes.data);
      console.log("Blood requests response:", bloodReqRes.data);
      console.log("Organization requests response:", orgReqRes.data);
      console.log("Donor submissions response:", donorSubmissionsRes.data);

      if (usersRes.data?.status) {
        setUsers(usersRes.data.data || []);
      }
      if (bloodReqRes.data?.status) {
        setBloodRequests(bloodReqRes.data.data || []);
      }
      if (orgReqRes.data?.status) {
        setOrgRequests(orgReqRes.data.data || []);
      }
      if (donorSubmissionsRes.data?.status) {
        setDonorSubmissions(donorSubmissionsRes.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error.response || error);

      if (error.response?.status === 401) {
        console.log("Unauthorized access, redirecting to login");
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
      } else {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "An error occurred while fetching data. Please try again.";
        console.error("Error details:", {
          status: error.response?.status,
          message: errorMessage,
          data: error.response?.data,
        });
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    delete axios.defaults.headers.common["Authorization"];
    navigate("/admin/login");
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      const response = await axios.put(
        `/api/admin/blood-requests/${requestId}/status`,
        { status: newStatus }
      );

      if (response.data.status) {
        setBloodRequests((prevRequests) =>
          prevRequests.map((request) =>
            request.id === requestId
              ? { ...request, status: newStatus }
              : request
          )
        );
      }
    } catch (error) {
      console.error("Error updating status:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
      } else {
        setError(
          error.response?.data?.message ||
            "An error occurred while updating status. Please try again."
        );
      }
    }
  };

  const handleOrgRequestStatus = async (requestId, status) => {
    try {
      const response = await axios.put(
        `/api/admin/organization-requests/${requestId}/status`,
        { status, rejection_reason: rejectionReason }
      );

      if (response.data.status) {
        setOrgRequests((prevRequests) =>
          prevRequests.map((request) =>
            request.id === requestId ? { ...request, status } : request
          )
        );
        setIsOrgModalOpen(false);
        setSelectedOrgRequest(null);
        setRejectionReason("");
      }
    } catch (error) {
      console.error("Error updating organization request status:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
      } else {
        setError(
          error.response?.data?.message ||
            "An error occurred while updating organization request. Please try again."
        );
      }
    }
  };

  const handleEditUser = (user) => {
    // TODO: Implement user editing functionality
    console.log("Edit user:", user);
  };

  const handleConvertToOrganization = (user) => {
    // TODO: Implement organization conversion functionality
    console.log("Convert to organization:", user);
  };

  const handleDonorStatusUpdate = async (
    requestId,
    submissionId,
    newStatus
  ) => {
    try {
      const response = await axios.put(
        `/api/admin/donor-submissions/${submissionId}/status`,
        { status: newStatus }
      );

      if (response.data.status) {
        setDonorSubmissions((prevSubmissions) =>
          prevSubmissions.map((submission) =>
            submission.id === submissionId
              ? { ...submission, status: newStatus }
              : submission
          )
        );
      }
    } catch (error) {
      console.error("Error updating donor submission status:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
      } else {
        setError(
          error.response?.data?.message ||
            "An error occurred while updating donor submission status. Please try again."
        );
      }
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchTermLower) ||
      user.last_name.toLowerCase().includes(searchTermLower) ||
      user.email.toLowerCase().includes(searchTermLower) ||
      user.blood_group.toLowerCase().includes(searchTermLower) ||
      (user.city && user.city.toLowerCase().includes(searchTermLower)) ||
      (user.state && user.state.toLowerCase().includes(searchTermLower)) ||
      (user.country && user.country.toLowerCase().includes(searchTermLower))
    );
  });

  const filteredRequests = bloodRequests.filter((request) => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch =
      request.first_name.toLowerCase().includes(searchTermLower) ||
      request.last_name.toLowerCase().includes(searchTermLower) ||
      request.email.toLowerCase().includes(searchTermLower) ||
      request.blood_group.toLowerCase().includes(searchTermLower);
    const matchesStatus =
      filterStatus === "all" || request.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={fetchData}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
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

      <div className="main-content">
        <div className="cards-grid">
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

          <div
            className={`card ${
              selectedCard === "org-requests" ? "selected" : ""
            }`}
            onClick={() =>
              setSelectedCard(
                selectedCard === "org-requests" ? null : "org-requests"
              )
            }
          >
            <div className="card-content">
              <div className="card-info">
                <div className="icon-wrapper">
                  <FaBuilding />
                </div>
                <div className="text-content">
                  <h2>Organization Requests</h2>
                  <p>
                    {
                      orgRequests.filter((req) => req.status === "pending")
                        .length
                    }
                  </p>
                </div>
              </div>
              <div className="arrow">
                {selectedCard === "org-requests" ? "▼" : "▶"}
              </div>
            </div>
          </div>

          <div
            className={`card ${selectedCard === "donors" ? "selected" : ""}`}
            onClick={() =>
              setSelectedCard(selectedCard === "donors" ? null : "donors")
            }
          >
            <div className="card-content">
              <div className="card-info">
                <div className="icon-wrapper">
                  <FaHandHoldingHeart />
                </div>
                <div className="text-content">
                  <h2>Donor Submissions</h2>
                  <p>{donorSubmissions.length}</p>
                </div>
              </div>
              <div className="arrow">
                {selectedCard === "donors" ? "▼" : "▶"}
              </div>
            </div>
          </div>
        </div>

        <div className="content-area">
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

          {selectedCard === "org-requests" && (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Organization Name</th>
                    <th>Applicant</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orgRequests.map((request) => (
                    <tr key={request.id}>
                      <td>{request.organization_name}</td>
                      <td>
                        <div className="user-info">
                          <div className="avatar">
                            {request.user.name[0]}
                            {request.user.last_name[0]}
                          </div>
                          <div className="name">
                            {request.user.name} {request.user.last_name}
                          </div>
                        </div>
                      </td>
                      <td>
                        <p>{request.organization_phone}</p>
                        <p>{request.organization_address}</p>
                      </td>
                      <td>
                        <span className={`status-badge ${request.status}`}>
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
                              onClick={() => {
                                setSelectedOrgRequest(request);
                                setIsOrgModalOpen(true);
                              }}
                            >
                              Review
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
                    <th>
                      <div className="header-cell">
                        <span>Location</span>
                        <FaSort />
                      </div>
                    </th>
                    <th>
                      <div className="header-cell">
                        <span>Type</span>
                        <FaSort />
                      </div>
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
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
                      <td>
                        {user.city}, {user.state}, {user.country}
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            user.is_organization ? "organization" : "individual"
                          }`}
                        >
                          {user.is_organization ? "Organization" : "Individual"}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="edit-btn"
                            onClick={() => handleEditUser(user)}
                          >
                            Edit
                          </button>
                          {!user.is_organization && (
                            <button
                              className="convert-btn"
                              onClick={() => handleConvertToOrganization(user)}
                            >
                              Convert to Organization
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

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
                            {request.first_name[0]}
                            {request.last_name[0]}
                          </div>
                          <div className="name">
                            {request.first_name} {request.last_name}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="status-badge pending">
                          {request.blood_group}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${request.status}`}>
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

          {selectedCard === "donors" && (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Donor Name</th>
                    <th>Blood Group</th>
                    <th>Blood Request</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {donorSubmissions.map((submission) => (
                    <tr key={submission.id}>
                      <td>
                        <div className="user-info">
                          <div className="avatar">
                            {submission.donor.name[0]}
                          </div>
                          <div className="name">{submission.donor.name}</div>
                        </div>
                      </td>
                      <td>
                        <span className="status-badge pending">
                          {submission.donor.blood_group}
                        </span>
                      </td>
                      <td>
                        <p>
                          <strong>Request ID:</strong>{" "}
                          {submission.blood_request.id}
                        </p>
                        <p>
                          <strong>Requester:</strong>{" "}
                          {submission.blood_request.requester_name}
                        </p>
                        <p>
                          <strong>Hospital:</strong>{" "}
                          {submission.blood_request.hospital_name}
                        </p>
                      </td>
                      <td>
                        <span className={`status-badge ${submission.status}`}>
                          {submission.status}
                        </span>
                      </td>
                      <td>
                        {new Date(submission.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        {submission.status === "pending" && (
                          <div className="action-buttons">
                            <button
                              className="approve"
                              onClick={() =>
                                handleDonorStatusUpdate(
                                  submission.blood_request_id,
                                  submission.id,
                                  "approved"
                                )
                              }
                            >
                              Approve
                            </button>
                            <button
                              className="reject"
                              onClick={() =>
                                handleDonorStatusUpdate(
                                  submission.blood_request_id,
                                  submission.id,
                                  "rejected"
                                )
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

      {isOrgModalOpen && selectedOrgRequest && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Review Organization Request</h2>
            <div className="org-request-details">
              <p>
                <strong>Organization:</strong>{" "}
                {selectedOrgRequest.organization_name}
              </p>
              <p>
                <strong>Applicant:</strong> {selectedOrgRequest.user.name}{" "}
                {selectedOrgRequest.user.last_name}
              </p>
              <p>
                <strong>Contact:</strong>{" "}
                {selectedOrgRequest.organization_phone}
              </p>
              <p>
                <strong>Address:</strong>{" "}
                {selectedOrgRequest.organization_address}
              </p>
              {selectedOrgRequest.pancard_image_path && (
                <div className="pancard-preview">
                  <img
                    src={`${API_URL}/storage/${selectedOrgRequest.pancard_image_path}`}
                    alt="PAN Card"
                  />
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Rejection Reason (if rejecting)</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
              />
            </div>
            <div className="modal-actions">
              <button
                className="approve"
                onClick={() =>
                  handleOrgRequestStatus(selectedOrgRequest.id, "approved")
                }
              >
                Approve
              </button>
              <button
                className="reject"
                onClick={() =>
                  handleOrgRequestStatus(selectedOrgRequest.id, "rejected")
                }
              >
                Reject
              </button>
              <button
                className="cancel-btn"
                onClick={() => {
                  setIsOrgModalOpen(false);
                  setSelectedOrgRequest(null);
                  setRejectionReason("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
