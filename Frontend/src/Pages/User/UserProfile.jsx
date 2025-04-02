import { useState, useEffect } from "react";
import axios from "axios";
import {
  FaFileUpload,
  FaSpinner,
  FaCheckCircle,
  FaCamera,
} from "react-icons/fa";
import "./UserProfile.scss";
import Navbar from "../../Components/Navbar/Navbar";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
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
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchUserProfile = async () => {
      try {
        console.log("Fetching profile with API URL:", API_URL);
        const response = await axios.get(`${API_URL}/api/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        });

        // Log the received user data
        console.log("Received user data:", response.data);

        // Store user data
        setUser(response.data);

        // Initialize form data with user data, ensuring all required fields are set
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

        // Log the form data being set
        console.log("Setting initial form data:", initialFormData);

        setFormData(initialFormData);
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError(err.response?.data?.message || "Failed to fetch user data");
      } finally {
        setLoading(false);
      }
    };

    const fetchOrgStatus = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/organization/status`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        });
        setOrgStatus(response.data);

        // If the request is approved, refresh the user profile
        if (response.data?.request?.status === "approved") {
          fetchUserProfile();
        }
      } catch (err) {
        console.error("Error fetching organization status:", err);
      }
    };

    fetchUserProfile();
    fetchOrgStatus();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Input changed: ${name} = ${value}`); // Debug log
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

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const token = localStorage.getItem("token");

      // Create base data object with all existing user data
      const baseData = {
        name: user.name,
        last_name: user.last_name,
        email: user.email,
        blood_group: user.blood_group,
        phone_number: user.phone_number || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        country: user.country || "",
        postal_code: user.postal_code || "",
      };

      // Override with any modified form data
      Object.entries(formData).forEach(([key, value]) => {
        if (value && Object.prototype.hasOwnProperty.call(baseData, key)) {
          baseData[key] = value;
        }
      });

      // If there's a profile image, use FormData
      if (profileImage) {
        const formDataToSend = new FormData();

        // Append all base data
        Object.entries(baseData).forEach(([key, value]) => {
          formDataToSend.append(key, value);
        });

        // Handle password fields if provided
        if (formData.current_password?.trim()) {
          formDataToSend.append("current_password", formData.current_password);
          if (formData.new_password?.trim()) {
            formDataToSend.append("new_password", formData.new_password);
            formDataToSend.append(
              "new_password_confirmation",
              formData.new_password_confirmation
            );
          }
        }

        // Append the profile image
        formDataToSend.append("profile_image", profileImage);

        // Debug log the form data entries
        console.log("FormData entries being sent:");
        for (let pair of formDataToSend.entries()) {
          console.log(
            pair[0] + ": " + (pair[1] instanceof File ? "File" : pair[1])
          );
        }

        const response = await axios.put(
          `${API_URL}/api/profile`,
          formDataToSend,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
            withCredentials: true,
          }
        );
        handleSuccess(response);
      } else {
        // For non-image updates, send all data as JSON
        const dataToSend = { ...baseData };

        // Handle password fields if provided
        if (formData.current_password?.trim()) {
          dataToSend.current_password = formData.current_password;
          if (formData.new_password?.trim()) {
            dataToSend.new_password = formData.new_password;
            dataToSend.new_password_confirmation =
              formData.new_password_confirmation;
          }
        }

        console.log("Sending JSON data:", dataToSend);
        const response = await axios.put(`${API_URL}/api/profile`, dataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        });
        handleSuccess(response);
      }
    } catch (err) {
      handleError(err);
    }
  };

  const handleSuccess = (response) => {
    console.log("Server response:", response.data);
    setUser(response.data.user);
    setFormData((prevData) => ({
      ...prevData,
      current_password: "",
      new_password: "",
      new_password_confirmation: "",
    }));
    setSuccess("Profile updated successfully");
    setIsEditing(false);

    if (response.data.user.profile_image_url) {
      localStorage.setItem(
        "userProfileImage",
        response.data.user.profile_image_url
      );
    }
  };

  const handleError = (err) => {
    console.error("Error updating profile:", err);
    if (err.response) {
      console.error("Full error response:", err.response);
      console.error("Error response data:", err.response.data);
      console.error("Error response status:", err.response.status);
      console.error("Error response headers:", err.response.headers);
      console.error("Validation errors:", err.response.data.errors);

      if (err.response.status === 422 && err.response.data.errors) {
        const errorMessages = Object.entries(err.response.data.errors)
          .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
          .join("; ");
        setError(`Validation failed: ${errorMessages}`);
      } else {
        setError(
          err.response.data.message ||
            err.response.data.error ||
            "Failed to update profile"
        );
      }
    } else if (err.request) {
      console.error("Error request:", err.request);
      setError("No response received from server");
    } else {
      console.error("Error message:", err.message);
      setError("Error updating profile: " + err.message);
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

      await axios.post(`${API_URL}/api/organization/request`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });

      // Refresh organization status
      const response = await axios.get(`${API_URL}/api/organization/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
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
        <div className="profile-header">
          <div className="profile-image-container">
            {isEditing ? (
              <div className="profile-image-upload">
                <input
                  type="file"
                  id="profile-image"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                  className="profile-image-input"
                />
                <label htmlFor="profile-image" className="profile-image-label">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Profile preview"
                      className="profile-image-preview"
                    />
                  ) : (
                    <img
                      src={user?.profile_image_url || "/default-avatar.png"}
                      alt="Profile"
                      className="profile-image"
                    />
                  )}
                  <div className="profile-image-overlay">
                    <FaCamera className="camera-icon" />
                    <span>Change Photo</span>
                  </div>
                </label>
              </div>
            ) : (
              <div className="profile-image-display">
                <img
                  src={user?.profile_image_url || "/default-avatar.png"}
                  alt="Profile"
                  className="profile-image"
                />
              </div>
            )}
          </div>
          <h1>User Profile</h1>
        </div>

        {success && <div className="success-message">{success}</div>}
        {error && <div className="error-message">{error}</div>}

        <div className="profile-section">
          <h2>Personal Information</h2>
          {isEditing ? (
            <form onSubmit={handleProfileUpdate} className="profile-form">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
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
                  required
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
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsEditing(false)}
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
                <strong>Phone:</strong> {user?.phone_number || "Not provided"}
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
                  <strong>Organization Name:</strong> {user?.organization_name}
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
                  <FaFileUpload className="upload-icon" />
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
      </div>
    </>
  );
};

export default UserProfile;
