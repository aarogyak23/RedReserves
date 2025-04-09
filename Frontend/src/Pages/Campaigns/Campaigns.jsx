import { useState, useEffect } from "react";
import axios from "axios";
import "./Campaigns.scss";
import Navbar from "../../Components/Navbar/Navbar";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/api/campaigns`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.data.status) {
        setCampaigns(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      setError("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  const handleInterestUpdate = async (campaignId, status) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/api/campaigns/${campaignId}/interest`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Refresh campaigns to update the status
      fetchCampaigns();
    } catch (error) {
      console.error("Failed to update interest status:", error);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading campaigns...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-container">
          <p>{error}</p>
          <button onClick={fetchCampaigns}>Try Again</button>
        </div>
      );
    }

    return (
      <div className="campaigns-page">
        <h1>Blood Donation Campaigns</h1>
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
                    className="interested-btn"
                    onClick={() =>
                      handleInterestUpdate(campaign.id, "interested")
                    }
                  >
                    Interested
                  </button>
                  <button
                    className="not-interested-btn"
                    onClick={() =>
                      handleInterestUpdate(campaign.id, "not_interested")
                    }
                  >
                    Not Interested
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <Navbar />
      {renderContent()}
    </>
  );
};

export default Campaigns;
