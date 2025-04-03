import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaTint,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUserPlus,
} from "react-icons/fa";

import Footer from "../../Components/Footer/Footer";
import "./BloodRequests.scss";
import Navbar from "../../Components/Navbar/Navbar";

const API_URL = import.meta.env.VITE_API_URL;

export const BloodRequests = () => {
  const navigate = useNavigate();
  const [bloodRequests, setBloodRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [donorInfo, setDonorInfo] = useState({
    name: "",
    phone: "",
    email: "",
    blood_group: "",
    message: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetchBloodRequests();
  }, [navigate]);

  const fetchBloodRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/api/blood-requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Blood requests API response:", response.data);

      // Get the requests data and ensure it's an array
      let requestsData = response.data.data || response.data || [];
      // If it's not an array, try to convert it
      if (!Array.isArray(requestsData)) {
        requestsData = Object.values(requestsData);
      }
      console.log("Raw requests data:", requestsData);

      // Get current user's ID from localStorage
      const userData = JSON.parse(localStorage.getItem("user"));
      const currentUserId = userData?.id;
      console.log("Current user ID:", currentUserId);

      // Filter requests:
      const availableRequests = requestsData.filter((request) => {
        console.log("Processing request:", request);

        // More flexible status check
        const status = request.status;
        const isApproved =
          status === "approved" ||
          status === 1 ||
          status === "1" ||
          status === true ||
          status === "true";
        console.log("Request status:", status, "Is approved?", isApproved);

        // Check if current user has already volunteered
        const donors = request.donors || [];
        const hasUserVolunteered = donors.some((donor) => {
          const donorUserId = donor.user_id;
          return donorUserId == currentUserId; // Using loose equality for number/string comparison
        });
        console.log("Has user volunteered?", hasUserVolunteered);

        // Check if it's user's own request - using loose equality for number/string comparison
        const isUsersOwnRequest = request.user_id == currentUserId;
        console.log("Is user's own request?", isUsersOwnRequest);

        // Show request if:
        // 1. It's approved AND
        // 2. User hasn't volunteered AND
        // 3. It's not user's own request
        const shouldShow =
          isApproved && !hasUserVolunteered && !isUsersOwnRequest;
        console.log("Should show this request?", shouldShow);

        return shouldShow;
      });

      console.log("Available requests after filtering:", availableRequests);

      if (availableRequests.length > 0) {
        setBloodRequests(availableRequests);
        setError(null);
      } else {
        console.log("No available blood requests found");
        setBloodRequests([]);
        setError("No blood requests available at this time");
      }
    } catch (error) {
      console.error("Error fetching blood requests:", error);
      if (error.response) {
        console.log("Error response data:", error.response.data);
        console.log("Error response status:", error.response.status);
      }
      setError("Failed to load blood requests");
    } finally {
      setLoading(false);
    }
  };

  const handleDonorSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      console.log("Submitting donor info:", donorInfo);
      console.log("Selected request:", selectedRequest);

      // First, submit the donor information
      const donorResponse = await axios.post(
        `${API_URL}/api/blood-requests/${selectedRequest.id}/donors`,
        donorInfo,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Donor submission response:", donorResponse.data);

      if (donorResponse.data.status) {
        // Send notification to the requester
        try {
          await axios.post(
            `${API_URL}/api/notifications`,
            {
              type: "donor_volunteered",
              request_id: selectedRequest.id,
              donor_name: donorInfo.name,
              blood_group: donorInfo.blood_group,
              message: `${donorInfo.name} has volunteered to donate ${donorInfo.blood_group} blood for your request.`,
              recipient_id: selectedRequest.user_id,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          console.log("Notification sent successfully");
        } catch (notificationError) {
          console.error("Error sending notification:", notificationError);
        }

        // Show success message
        alert("Thank you for volunteering to donate blood!");
        setIsModalOpen(false);
        setSelectedRequest(null);
        setDonorInfo({
          name: "",
          phone: "",
          email: "",
          blood_group: "",
          message: "",
        });
        // Refresh the blood requests list
        fetchBloodRequests();
      } else {
        console.error("Submission failed:", donorResponse.data);
        alert(
          donorResponse.data.message ||
            "Failed to submit donor information. Please try again."
        );
      }
    } catch (error) {
      console.error("Error submitting donor info:", error);
      if (error.response) {
        console.log("Error response data:", error.response.data);
        console.log("Error response status:", error.response.status);
        alert(
          error.response.data.message ||
            "Failed to submit donor information. Please try again."
        );
      } else {
        alert(
          "Failed to submit donor information. Please check your connection and try again."
        );
      }
    }
  };

  const filteredRequests = bloodRequests.filter((request) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      request.blood_group.toLowerCase().includes(searchLower) ||
      request.city?.toLowerCase().includes(searchLower) ||
      request.state?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <>
      <Navbar />
      <div className="blood-requests-page">
        <div className="header">
          <h1>Blood Donation Requests</h1>
          <p>Find blood donation requests near you and help save lives</p>
        </div>

        <div className="search-bar">
          <FaSearch />
          <input
            type="text"
            placeholder="Search by blood group or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading && <div className="loading">Loading blood requests...</div>}
        {error && <div className="error">{error}</div>}

        <div className="requests-grid">
          {filteredRequests.map((request) => (
            <div key={request.id} className="request-card">
              <div className="blood-group">
                <FaTint />
                <span>{request.blood_group}</span>
              </div>
              <div className="request-details">
                <h3>Urgent Blood Required</h3>
                <div className="detail">
                  <FaMapMarkerAlt />
                  <span>{request.address}</span>
                </div>
                <div className="detail">
                  <FaCalendarAlt />
                  <span>
                    {new Date(request.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="requester">
                  Requested by: {request.first_name} {request.last_name}
                </p>
                <button
                  className="donate-btn"
                  onClick={() => {
                    setSelectedRequest(request);
                    setIsModalOpen(true);
                  }}
                >
                  <FaUserPlus />
                  Volunteer to Donate
                </button>
              </div>
            </div>
          ))}
        </div>

        {isModalOpen && selectedRequest && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Volunteer to Donate Blood</h2>
              <div className="request-info">
                <p>
                  <strong>Blood Group Needed:</strong>{" "}
                  {selectedRequest.blood_group}
                </p>
                <p>
                  <strong>Location:</strong> {selectedRequest.city},{" "}
                  {selectedRequest.state}
                </p>
                <p>
                  <strong>Requested By:</strong> {selectedRequest.first_name}{" "}
                  {selectedRequest.last_name}
                </p>
              </div>
              <form onSubmit={handleDonorSubmit}>
                <div className="form-group">
                  <label>Your Name</label>
                  <input
                    type="text"
                    required
                    value={donorInfo.name}
                    onChange={(e) =>
                      setDonorInfo({ ...donorInfo, name: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={donorInfo.phone}
                    onChange={(e) =>
                      setDonorInfo({ ...donorInfo, phone: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    required
                    value={donorInfo.email}
                    onChange={(e) =>
                      setDonorInfo({ ...donorInfo, email: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Your Blood Group</label>
                  <select
                    required
                    value={donorInfo.blood_group}
                    onChange={(e) =>
                      setDonorInfo({
                        ...donorInfo,
                        blood_group: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Message (Optional)</label>
                  <textarea
                    value={donorInfo.message}
                    onChange={(e) =>
                      setDonorInfo({ ...donorInfo, message: e.target.value })
                    }
                    placeholder="Any additional information..."
                  />
                </div>
                <div className="modal-actions">
                  <button type="submit" className="submit-btn">
                    Submit
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setIsModalOpen(false);
                      setSelectedRequest(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default BloodRequests;
