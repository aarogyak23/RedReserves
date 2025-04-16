import { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosConfig";
import { FaSpinner, FaCheckCircle } from "react-icons/fa";
import { FaDroplet } from "react-icons/fa6";
import "./UserProfile.scss";
import Navbar from "../../Components/Navbar/Navbar";
import { useNavigate } from "react-router-dom";

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    last_name: "",
    email: "",
    phone_number: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
    blood_group: "",
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });
  const [orgFormData, setOrgFormData] = useState({
    organization_name: "",
    organization_address: "",
    organization_phone: "",
    pancard_image: null,
  });
  const [orgStatus, setOrgStatus] = useState(null);
  const [donationHistory, setDonationHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const response = await axiosInstance.get("/api/profile");
        console.log("Received user data:", response.data);

        if (
          !response.data ||
          !response.data.name ||
          !response.data.last_name ||
          !response.data.email ||
          !response.data.blood_group
        ) {
          console.error("Incomplete user data received:", response.data);
          setError("Incomplete user data received from server");
          return;
        }

        setUser(response.data);

        const initialFormData = {
          name: response.data.name || "",
          last_name: response.data.last_name || "",
          email: response.data.email || "",
          phone_number: response.data.phone_number || "",
          address: response.data.address || "",
          city: response.data.city || "",
          state: response.data.state || "",
          country: response.data.country || "",
          postal_code: response.data.postal_code || "",
          blood_group: response.data.blood_group || "",
          current_password: "",
          new_password: "",
          new_password_confirmation: "",
        };

        console.log("Setting initial form data:", initialFormData);
        setFormData(initialFormData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError(err.response?.data?.message || "Failed to fetch user data");
        setLoading(false);
      }
    };

    const fetchOrgStatus = async () => {
      try {
        const response = await axiosInstance.get("/api/organization/status");
        setOrgStatus(response.data);
        if (response.data?.request?.status === "approved") {
          await fetchUserProfile();
        }
      } catch (err) {
        console.error("Error fetching organization status:", err);
        setError(
          err.response?.data?.message || "Failed to fetch organization status"
        );
      }
    };

    const fetchDonationHistory = async () => {
      try {
        const response = await axiosInstance.get("/api/donations/history");
        setDonationHistory(response.data);
      } catch (err) {
        console.error("Error fetching donation history:", err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchUserProfile();
    fetchOrgStatus();
    fetchDonationHistory();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Input changed: ${name} = ${value}`);
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleOrgInputChange = (e) => {
    setOrgFormData({
      ...orgFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    setOrgFormData({
      ...orgFormData,
      pancard_image: e.target.files[0],
    });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const formDataToSend = new FormData();

      Object.keys(formData).forEach((key) => {
        if (formData[key] !== undefined && formData[key] !== null) {
          formDataToSend.append(key, formData[key]);
          console.log(`Appending ${key}:`, formData[key]);
        }
      });

      const response = await axiosInstance.put("/api/profile", formDataToSend);

      console.log("Server response:", response.data);

      if (response.data.user) {
        setUser(response.data.user);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        setFormData((prev) => ({
          ...prev,
          ...response.data.user,
          current_password: "",
          new_password: "",
          new_password_confirmation: "",
        }));

        setSuccess("Profile updated successfully");
        setIsEditing(false);

        try {
          const refreshResponse = await axiosInstance.get("/api/profile");
          console.log("Refresh response:", refreshResponse.data);
          setUser(refreshResponse.data);
        } catch (refreshErr) {
          console.error("Error refreshing profile:", refreshErr);
        }
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      if (err.response?.data?.errors) {
        const errorMessages = Object.entries(err.response.data.errors)
          .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
          .join("\n");
        setError(`Validation errors:\n${errorMessages}`);
      } else {
        setError(err.response?.data?.message || "Failed to update profile");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleOrgRequest = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const formDataToSend = new FormData();
      Object.keys(orgFormData).forEach((key) => {
        formDataToSend.append(key, orgFormData[key]);
      });

      await axiosInstance.post("/api/organization/request", formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });

      // Refresh organization status
      const response = await axiosInstance.get("/api/organization/status");
      setOrgStatus(response.data);
      setOrgFormData({
        organization_name: "",
        organization_address: "",
        organization_phone: "",
        pancard_image: null,
      });
      setSuccess("Organization request submitted successfully");
    } catch (err) {
      console.error("Error submitting organization request:", err);
      setError(
        err.response?.data?.message || "Failed to submit organization request"
      );
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading-container">
          <FaSpinner className="spinner" />
          <p>Loading profile...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="profile-container">
          <div className="error">{error}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="user-profile">
        <div className="profile-content">
          <div className="profile-main">
            <h1>User Profile</h1>

            {success && <div className="success-message">{success}</div>}
            {error && <div className="error-message">{error}</div>}

            <div className="profile-section">
              <h2>Personal Information</h2>

              {isEditing ? (
                <form onSubmit={handleProfileUpdate} className="profile-form">
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Country</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Postal Code</label>
                    <input
                      type="text"
                      name="postal_code"
                      value={formData.postal_code}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Blood Group</label>
                    <input
                      type="text"
                      name="blood_group"
                      value={formData.blood_group}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      name="current_password"
                      value={formData.current_password}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      name="new_password"
                      value={formData.new_password}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      name="new_password_confirmation"
                      value={formData.new_password_confirmation}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-actions">
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <FaSpinner className="spinner" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setIsEditing(false)}
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="profile-info">
                  <p>
                    <strong>Name:</strong> {user?.name} {user?.last_name}
                    {user?.is_organization && (
                      <FaCheckCircle
                        className="organization-badge"
                        title="Verified Organization"
                      />
                    )}
                  </p>
                  <p>
                    <strong>Email:</strong> {user?.email}
                  </p>
                  <p>
                    <strong>Phone:</strong>{" "}
                    {user?.phone_number || "Not provided"}
                  </p>
                  <p>
                    <strong>Address:</strong> {user?.address || "Not provided"}
                  </p>
                  <p>
                    <strong>Location:</strong>{" "}
                    {user?.city && user?.state && user?.country
                      ? `${user.city}, ${user.state}, ${user.country}`
                      : "Not provided"}
                  </p>
                  <p>
                    <strong>Blood Group:</strong> {user?.blood_group}
                  </p>
                  {user?.is_organization && (
                    <p>
                      <strong>Organization Name:</strong>{" "}
                      {user?.organization_name}
                    </p>
                  )}
                  <button
                    className="btn-primary"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </button>
                </div>
              )}
            </div>

            {!user?.is_organization && (
              <div className="organization-section">
                <h2>Organization Enrollment</h2>
                <p>
                  Register as an organization to manage blood requests and
                  donations.
                </p>
                <form onSubmit={handleOrgRequest} className="organization-form">
                  <div className="form-group">
                    <label>Organization Name</label>
                    <input
                      type="text"
                      name="organization_name"
                      value={orgFormData.organization_name}
                      onChange={handleOrgInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Organization Address</label>
                    <textarea
                      name="organization_address"
                      value={orgFormData.organization_address}
                      onChange={handleOrgInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Organization Phone</label>
                    <input
                      type="tel"
                      name="organization_phone"
                      value={orgFormData.organization_phone}
                      onChange={handleOrgInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>PAN Card Image</label>
                    <div className="file-upload">
                      <input
                        type="file"
                        name="pancard_image"
                        accept="image/*"
                        onChange={handleImageChange}
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary">
                    Submit Organization Request
                  </button>
                </form>
              </div>
            )}

            {orgStatus?.request && (
              <div className="organization-status">
                <h2>Organization Request Status</h2>
                <div className={`status-badge ${orgStatus.request.status}`}>
                  {orgStatus.request.status.charAt(0).toUpperCase() +
                    orgStatus.request.status.slice(1)}
                </div>
                {orgStatus.request.status === "rejected" && (
                  <p className="rejection-reason">
                    {orgStatus.request.rejection_reason}
                  </p>
                )}
              </div>
            )}

            {user?.is_organization && (
              <div className="organization-section">
                <h3>Organization Information</h3>
                <div className="organization-details">
                  <p>
                    <strong>Organization Name:</strong> {user.organization_name}
                  </p>
                  <p>
                    <strong>Organization Address:</strong>{" "}
                    {user.organization_address}
                  </p>
                  <p>
                    <strong>Organization Phone:</strong>{" "}
                    {user.organization_phone}
                  </p>
                </div>
                <button
                  className="manage-stock-btn"
                  onClick={() => navigate("/blood-stock")}
                >
                  Manage Blood Stock
                </button>
              </div>
            )}
          </div>

          <div className="profile-sidebar">
            <div className="donation-history-section">
              <h2>
                <FaDroplet className="history-icon" />
                Donation History
              </h2>
              {loadingHistory ? (
                <div className="loading-history">
                  <FaSpinner className="spinner" />
                  <p>Loading donation history...</p>
                </div>
              ) : donationHistory.length > 0 ? (
                <div className="donation-list">
                  {donationHistory.map((donation) => (
                    <div key={donation.id} className="donation-card">
                      <div className="donation-date">
                        {new Date(donation.donation_date).toLocaleDateString()}
                      </div>
                      <div className="donation-details">
                        <p className="recipient-name">
                          Donated to: {donation.recipient_name}
                        </p>
                        <p className="blood-info">
                          Blood Group: {donation.blood_group}
                        </p>
                        <p className="hospital-info">
                          Hospital: {donation.hospital_name}
                        </p>
                      </div>
                      <div className="donation-status">
                        <span
                          className={`status ${donation.status.toLowerCase()}`}
                        >
                          {donation.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-donations">
                  <p>No donation history found.</p>
                  <p>Start donating blood to save lives!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserProfile;
