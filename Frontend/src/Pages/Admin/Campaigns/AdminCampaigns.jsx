import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./AdminCampaigns.scss";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const AdminCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
  }, []);

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
    if (name === "image") {
      const file = files[0];
      setNewCampaign((prev) => ({
        ...prev,
        image: file,
        image_preview: URL.createObjectURL(file),
      }));
    } else {
      setNewCampaign((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("adminToken");
      const formData = new FormData();
      formData.append("title", newCampaign.title);
      formData.append("description", newCampaign.description);
      formData.append("start_date", newCampaign.start_date);
      formData.append("end_date", newCampaign.end_date);
      formData.append("location", newCampaign.location);
      formData.append("status", newCampaign.status);
      if (newCampaign.image) {
        formData.append("image", newCampaign.image);
      }

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
      }
    } catch (error) {
      console.error("Error creating campaign:", error);
      setError(error.response?.data?.message || "Failed to create campaign");
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
          onClick={() => setShowCampaignForm(!showCampaignForm)}
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
              onChange={handleCampaignInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>End Date:</label>
            <input
              type="datetime-local"
              name="end_date"
              value={newCampaign.end_date}
              onChange={handleCampaignInputChange}
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
          <button type="submit" className="submit-btn">
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
