import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./AdminCampaigns.scss";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const AdminCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    location: "",
    status: "active",
    image: null,
    image_preview: null,
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchCampaigns();
    const statusInterval = setInterval(updateCampaignStatuses, 60000);
    return () => clearInterval(statusInterval);
  }, []);

  const updateCampaignStatuses = () => {
    const now = new Date();
    setCampaigns((prevCampaigns) =>
      prevCampaigns.map((campaign) => {
        const endDate = new Date(campaign.end_date);
        const startDate = new Date(campaign.start_date);

        if (endDate < now) {
          return { ...campaign, status: "completed" };
        } else if (startDate > now) {
          return { ...campaign, status: "upcoming" };
        } else {
          return { ...campaign, status: "active" };
        }
      })
    );
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    // Ensure we're working with local time
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleDateInput = (e) => {
    const { name, value } = e.target;
    const selectedDate = new Date(value);
    const now = new Date();

    // Reset hours, minutes, seconds, and milliseconds for current date
    now.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < now) {
      setFormError("Cannot select a date in the past");
      return;
    }

    handleCampaignInputChange(e);
  };

  const validateDates = (startDate, endDate) => {
    if (!startDate || !endDate) return null;

    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Reset time components for date comparison
    now.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (start < now) {
      return "Campaign start date cannot be in the past";
    }

    if (end < start) {
      return "End date must be after start date";
    }

    return null;
  };

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.get(`${API_URL}/api/admin/campaigns`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.status) {
        setCampaigns(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      if (error.response?.status === 401) {
        navigate("/admin/login");
      } else {
        setError(
          error.response?.data?.message ||
            "An error occurred while fetching campaigns"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCampaignInputChange = (e) => {
    const { name, value, files } = e.target;
    setFormError("");

    if (name === "image") {
      const file = files[0];
      setNewCampaign((prev) => ({
        ...prev,
        image: file,
        image_preview: URL.createObjectURL(file),
      }));
    } else {
      const updatedCampaign = {
        ...newCampaign,
        [name]: value,
      };

      // Validate dates immediately when either date field changes
      if (name === "start_date" || name === "end_date") {
        const dateError = validateDates(
          updatedCampaign.start_date,
          updatedCampaign.end_date
        );
        if (dateError) {
          setFormError(dateError);
        }
      }

      setNewCampaign(updatedCampaign);
    }
  };

  const formatDateForServer = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 19).replace("T", " ");
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();

    const dateError = validateDates(
      newCampaign.start_date,
      newCampaign.end_date
    );
    if (dateError) {
      setFormError(dateError);
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const formData = new FormData();

      // Format dates for the server
      const formattedStartDate = formatDateForServer(newCampaign.start_date);
      const formattedEndDate = formatDateForServer(newCampaign.end_date);

      formData.append("title", newCampaign.title);
      formData.append("description", newCampaign.description);
      formData.append("start_date", formattedStartDate);
      formData.append("end_date", formattedEndDate);
      formData.append("location", newCampaign.location);

      const now = new Date();
      const startDate = new Date(newCampaign.start_date);
      const status = startDate > now ? "upcoming" : "active";
      formData.append("status", status);

      if (newCampaign.image) {
        formData.append("image", newCampaign.image);
      }

      // Debug log
      console.log("Sending campaign data:", {
        title: newCampaign.title,
        description: newCampaign.description,
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        location: newCampaign.location,
        status: status,
      });

      const response = await axios.post(
        `${API_URL}/api/admin/campaigns`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.status) {
        setCampaigns([response.data.data, ...campaigns]);
        setShowCampaignForm(false);
        setNewCampaign({
          title: "",
          description: "",
          start_date: "",
          end_date: "",
          location: "",
          status: "active",
          image: null,
          image_preview: null,
        });
        setFormError("");
      }
    } catch (error) {
      console.error("Error creating campaign:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      let errorMessage = "Failed to create campaign. ";
      if (error.response?.data?.message) {
        errorMessage += error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage += error.response.data.error;
      } else if (error.message) {
        errorMessage += error.message;
      }

      setError(errorMessage);
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.delete(
        `${API_URL}/api/admin/campaigns/${campaignId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.status) {
        setCampaigns((prevCampaigns) =>
          prevCampaigns.filter((campaign) => campaign.id !== campaignId)
        );
      }
    } catch (error) {
      console.error("Error deleting campaign:", error);
      setError(error.response?.data?.message || "Failed to delete campaign");
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading campaigns...</p>
      </div>
    );
  }

  return (
    <div className="admin-campaigns">
      <div className="header">
        <h1>Campaign Management</h1>
        <button
          className="create-campaign-btn"
          onClick={() => {
            setShowCampaignForm(!showCampaignForm);
            setFormError("");
          }}
        >
          {showCampaignForm ? "Cancel" : "Create New Campaign"}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError("")}>Dismiss</button>
        </div>
      )}

      {showCampaignForm && (
        <form onSubmit={handleCreateCampaign} className="campaign-form">
          {formError && (
            <div className="form-error-message">
              <p>{formError}</p>
            </div>
          )}
          <div className="form-group">
            <label>Title:</label>
            <input
              type="text"
              name="title"
              value={newCampaign.title}
              onChange={handleCampaignInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Description:</label>
            <textarea
              name="description"
              value={newCampaign.description}
              onChange={handleCampaignInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Start Date:</label>
            <input
              type="datetime-local"
              name="start_date"
              value={newCampaign.start_date}
              onChange={handleDateInput}
              min={getCurrentDateTime()}
              onKeyDown={(e) => e.preventDefault()}
              required
            />
          </div>
          <div className="form-group">
            <label>End Date:</label>
            <input
              type="datetime-local"
              name="end_date"
              value={newCampaign.end_date}
              onChange={handleDateInput}
              min={newCampaign.start_date || getCurrentDateTime()}
              onKeyDown={(e) => e.preventDefault()}
              required
            />
          </div>
          <div className="form-group">
            <label>Location:</label>
            <input
              type="text"
              name="location"
              value={newCampaign.location}
              onChange={handleCampaignInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Campaign Image:</label>
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleCampaignInputChange}
            />
            {newCampaign.image_preview && (
              <div className="image-preview">
                <img src={newCampaign.image_preview} alt="Campaign preview" />
              </div>
            )}
          </div>
          <button
            type="submit"
            className="submit-btn"
            disabled={
              !!formError || !newCampaign.start_date || !newCampaign.end_date
            }
          >
            Create Campaign
          </button>
        </form>
      )}

      <div className="campaigns-grid">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="campaign-card">
            {campaign.image_path && (
              <div className="campaign-image">
                <img
                  src={`${API_URL}/storage/${campaign.image_path}`}
                  alt={campaign.title}
                />
              </div>
            )}
            <div className="campaign-content">
              <h2>{campaign.title}</h2>
              <p className="description">{campaign.description}</p>
              <div className="campaign-details">
                <div className="detail">
                  <span className="label">Location:</span>
                  <span className="value">{campaign.location}</span>
                </div>
                <div className="detail">
                  <span className="label">Start Date:</span>
                  <span className="value">
                    {new Date(campaign.start_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="detail">
                  <span className="label">End Date:</span>
                  <span className="value">
                    {new Date(campaign.end_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="detail">
                  <span className={`status ${campaign.status}`}>
                    {campaign.status}
                  </span>
                </div>
              </div>
              <div className="campaign-actions">
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteCampaign(campaign.id)}
                >
                  Delete Campaign
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCampaigns;
