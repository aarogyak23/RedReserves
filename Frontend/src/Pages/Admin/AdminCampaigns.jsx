import { useState, useEffect } from "react";
import axios from "axios";
import "./AdminCampaigns.scss";

const API_URL = import.meta.env.VITE_API_URL;

const AdminCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    location: "",
    image: null,
  });

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

      // Check if response.data has a data property (common API structure)
      const campaignsData = response.data.data || response.data;

      // Ensure we have an array
      if (Array.isArray(campaignsData)) {
        setCampaigns(campaignsData);
      } else {
        console.error("Invalid campaigns data format:", campaignsData);
        setError("Invalid data format received from server");
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
      setError("Failed to fetch campaigns");
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      image: e.target.files[0],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("adminToken");
      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null) {
          formDataToSend.append(key, formData[key]);
        }
      });

      await axios.post(`${API_URL}/api/admin/campaigns`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setShowForm(false);
      setFormData({
        title: "",
        description: "",
        start_date: "",
        end_date: "",
        location: "",
        image: null,
      });
      fetchCampaigns();
    } catch (error) {
      console.error("Failed to create campaign:", error);
    }
  };

  const handleDelete = async (campaignId) => {
    if (window.confirm("Are you sure you want to delete this campaign?")) {
      try {
        const token = localStorage.getItem("adminToken");
        await axios.delete(`${API_URL}/api/admin/campaigns/${campaignId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        fetchCampaigns();
      } catch (error) {
        console.error("Failed to delete campaign:", error);
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading campaigns...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="admin-campaigns-container">
      <div className="header">
        <h1>Manage Campaigns</h1>
        <button className="create-btn" onClick={() => setShowForm(true)}>
          Create New Campaign
        </button>
      </div>

      {showForm && (
        <div className="campaign-form">
          <h2>Create New Campaign</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="datetime-local"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input
                type="datetime-local"
                name="end_date"
                value={formData.end_date}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Image</label>
              <input
                type="file"
                name="image"
                onChange={handleImageChange}
                accept="image/*"
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="submit-btn">
                Create Campaign
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="campaigns-grid">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="campaign-card">
            {campaign.image_path && (
              <img
                src={`${API_URL}/storage/${campaign.image_path}`}
                alt={campaign.title}
                className="campaign-image"
              />
            )}
            <div className="campaign-content">
              <h2>{campaign.title}</h2>
              <p className="campaign-description">{campaign.description}</p>
              <div className="campaign-details">
                <p>
                  <strong>Location:</strong> {campaign.location}
                </p>
                <p>
                  <strong>Start Date:</strong>{" "}
                  {new Date(campaign.start_date).toLocaleDateString()}
                </p>
                <p>
                  <strong>End Date:</strong>{" "}
                  {new Date(campaign.end_date).toLocaleDateString()}
                </p>
              </div>
              <button
                className="delete-btn"
                onClick={() => handleDelete(campaign.id)}
              >
                Delete Campaign
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCampaigns;
