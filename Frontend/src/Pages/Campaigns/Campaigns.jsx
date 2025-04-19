import { useState, useEffect } from "react";
import axios from "axios";
import "./Campaigns.scss";
import Navbar from "../../Components/Navbar/Navbar";
import Footer from "../../Components/Footer/Footer";
import {
  FaCalendar,
  FaMapMarkerAlt,
  FaUsers,
  FaQuoteLeft,
  FaClock,
} from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Single inspiring quote
const INSPIRING_QUOTE = {
  text: "The blood you donate gives someone another chance at life. One day that someone may be a close relative, a friend, a loved one—or even you.",
  author: "Unknown",
};

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadingInterests, setLoadingInterests] = useState({});

  const fetchCampaigns = async (showLoader = false) => {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.get(`${API_URL}/api/campaigns`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.status) {
        const processedCampaigns = response.data.data.map((campaign) => ({
          ...campaign,
          interested_count: parseInt(campaign.interested_count) || 0,
          not_interested_count: parseInt(campaign.not_interested_count) || 0,
          user_interest: campaign.user_interest || null,
        }));
        setCampaigns(processedCampaigns);
      } else {
        setError("Failed to fetch campaigns. Please try again.");
      }
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch campaigns"
      );
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  // Effect for initial load
  useEffect(() => {
    // Initial fetch with loader
    fetchCampaigns(true);
  }, []);

  // Separate effect for polling
  useEffect(() => {
    // Set up polling without loader
    const interval = setInterval(() => {
      fetchCampaigns(false);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleInterestUpdate = async (campaignId, status) => {
    setLoadingInterests((prev) => ({ ...prev, [campaignId]: true }));

    try {
      const response = await axios.post(
        `${API_URL}/api/campaigns/${campaignId}/interest`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.status) {
        setCampaigns((prevCampaigns) =>
          prevCampaigns.map((campaign) =>
            campaign.id === campaignId
              ? {
                  ...campaign,
                  user_interest: status,
                  interested_count:
                    status === "interested"
                      ? campaign.user_interest === "interested"
                        ? campaign.interested_count
                        : campaign.interested_count + 1
                      : campaign.user_interest === "interested"
                      ? campaign.interested_count - 1
                      : campaign.interested_count,
                  not_interested_count:
                    status === "not_interested"
                      ? campaign.user_interest === "not_interested"
                        ? campaign.not_interested_count
                        : campaign.not_interested_count + 1
                      : campaign.user_interest === "not_interested"
                      ? campaign.not_interested_count - 1
                      : campaign.not_interested_count,
                }
              : campaign
          )
        );
      }
    } catch (error) {
      console.error("Error updating interest:", error);
    } finally {
      setLoadingInterests((prev) => ({ ...prev, [campaignId]: false }));
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchCampaigns();

    // Set up polling interval (every 5 seconds instead of 1 second)
    const interval = setInterval(fetchCampaigns, 5000);

    // Expose update function to window object
    window.adminCampaignsUpdate = (updatedCampaign) => {
      setCampaigns((prevCampaigns) => {
        const newCampaigns = prevCampaigns.map((campaign) => {
          if (campaign.id === updatedCampaign.id) {
            return {
              ...campaign,
              interested_count: parseInt(updatedCampaign.interested_count) || 0,
              not_interested_count:
                parseInt(updatedCampaign.not_interested_count) || 0,
              user_interest: campaign.user_interest, // Preserve the user's interest status
            };
          }
          return campaign;
        });
        return newCampaigns;
      });
    };

    return () => {
      clearInterval(interval);
      delete window.adminCampaignsUpdate;
    };
  }, []);

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "active":
        return "#27ae60";
      case "upcoming":
        return "#f39c12";
      case "completed":
        return "#7f8c8d";
      default:
        return "#95a5a6";
    }
  };

  const renderCampaignButtons = (campaign) => {
    const isInterested = campaign.user_interest === "interested";
    const isNotInterested = campaign.user_interest === "not_interested";

    return (
      <div className="campaign-actions">
        <button
          className={`action-btn interested-btn ${
            isInterested ? "active" : ""
          }`}
          onClick={() => handleInterestUpdate(campaign.id, "interested")}
          disabled={loadingInterests[campaign.id]}
        >
          {loadingInterests[campaign.id] ? (
            <span className="button-loader"></span>
          ) : isInterested ? (
            "Interested ✓"
          ) : (
            "I'm Interested"
          )}
        </button>
        <button
          className={`action-btn not-interested-btn ${
            isNotInterested ? "active" : ""
          }`}
          onClick={() => handleInterestUpdate(campaign.id, "not_interested")}
          disabled={loadingInterests[campaign.id]}
        >
          {loadingInterests[campaign.id] ? (
            <span className="button-loader"></span>
          ) : isNotInterested ? (
            "Not Interested ✓"
          ) : (
            "Not Interested"
          )}
        </button>
      </div>
    );
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
        <div className="campaigns-header">
          <h1>Blood Donation Campaigns</h1>
          <p className="subtitle">
            Join us in our mission to save lives through blood donation
          </p>

          <div className="quote-box">
            <FaQuoteLeft className="quote-icon" />
            <div className="quote-content">
              <p>{INSPIRING_QUOTE.text}</p>
              <span className="quote-author">- {INSPIRING_QUOTE.author}</span>
            </div>
          </div>

          <div className="campaign-stats">
            <div className="stat-item">
              <FaUsers className="stat-icon" />
              <div className="stat-info">
                <h3>{campaigns.length}</h3>
                <p>Active Campaigns</p>
              </div>
            </div>
          </div>
        </div>

        <div className="campaigns-grid">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="campaign-card">
              {campaign.image_path && (
                <div className="campaign-image">
                  <img
                    src={`${API_URL}/storage/${campaign.image_path}`}
                    alt={campaign.title}
                  />
                  <div
                    className="campaign-status"
                    style={{ backgroundColor: getStatusColor(campaign.status) }}
                  >
                    {campaign.status}
                  </div>
                </div>
              )}
              <div className="campaign-content">
                <h2>{campaign.title}</h2>
                <p className="description">{campaign.description}</p>

                <div className="campaign-details">
                  <div className="detail-item">
                    <FaMapMarkerAlt className="detail-icon" />
                    <span>{campaign.location}</span>
                  </div>
                  <div className="detail-item">
                    <FaCalendar className="detail-icon" />
                    <span>
                      {new Date(campaign.start_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="detail-item">
                    <FaClock className="detail-icon" />
                    <span>
                      {new Date(campaign.start_date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                {renderCampaignButtons(campaign)}
              </div>
            </div>
          ))}
        </div>
        <Footer />
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
