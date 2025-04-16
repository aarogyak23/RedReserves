import { useState, useEffect } from "react";
import axios from "axios";
import "./Campaigns.scss";
import Navbar from "../../Components/Navbar/Navbar";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadingInterests, setLoadingInterests] = useState({});

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const sortCampaignsByDate = (campaigns) => {
    return [...campaigns].sort((a, b) => {
      const dateA = new Date(a.start_date);
      const dateB = new Date(b.start_date);
      return dateB - dateA; // Sort in descending order (latest first)
    });
  };

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
        const sortedCampaigns = sortCampaignsByDate(response.data.data);
        setCampaigns(sortedCampaigns);
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
      setLoadingInterests((prev) => ({ ...prev, [campaignId]: true }));
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

      // Update the local campaign state to reflect the new interest status
      setCampaigns((prevCampaigns) =>
        prevCampaigns.map((campaign) =>
          campaign.id === campaignId
            ? { ...campaign, user_interest: status }
            : campaign
        )
      );
    } catch (error) {
      console.error("Failed to update interest status:", error);
      setError("Failed to update interest status. Please try again.");
    } finally {
      setLoadingInterests((prev) => ({ ...prev, [campaignId]: false }));
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
                    className={`interested-btn ${
                      campaign.user_interest === "interested" ? "active" : ""
                    }`}
                    onClick={() =>
                      handleInterestUpdate(campaign.id, "interested")
                    }
                    disabled={
                      loadingInterests[campaign.id] ||
                      campaign.user_interest === "interested"
                    }
                  >
                    {loadingInterests[campaign.id] ? (
                      <span className="button-loader"></span>
                    ) : (
                      "Interested"
                    )}
                  </button>
                  <button
                    className={`not-interested-btn ${
                      campaign.user_interest === "not_interested"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      handleInterestUpdate(campaign.id, "not_interested")
                    }
                    disabled={
                      loadingInterests[campaign.id] ||
                      campaign.user_interest === "not_interested"
                    }
                  >
                    {loadingInterests[campaign.id] ? (
                      <span className="button-loader"></span>
                    ) : (
                      "Not Interested"
                    )}
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
