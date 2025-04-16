import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosConfig";
import "./OrganizationDetails.scss";
import Navbar from "../../Components/Navbar/Navbar";
import LoadingSpinner from "../../Components/LoadingSpinner/LoadingSpinner";
import { FaPhone, FaMapMarkerAlt, FaEnvelope, FaTint } from "react-icons/fa";

const OrganizationDetails = () => {
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrganizationDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Clean the ID by removing any text after colon
        const cleanId = id.split(":")[0];
        const response = await axiosInstance.get(
          `/api/organizations/${cleanId}`
        );

        if (response.data) {
          setOrganization(response.data);
        } else {
          throw new Error("Organization not found");
        }
      } catch (err) {
        console.error("Error fetching organization details:", err);
        if (err.response?.status === 404) {
          setError(
            "This organization could not be found. It may not be verified or may have been removed."
          );
        } else {
          setError(
            "Unable to load organization details. Please try again later."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrganizationDetails();
    }
  }, [id]);

  const handleBackToSearch = () => {
    navigate("/search");
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="organization-details-container">
          <LoadingSpinner />
        </div>
      </>
    );
  }

  if (error || !organization) {
    return (
      <>
        <Navbar />
        <div className="organization-details-container">
          <div className="error-section">
            <div className="error-message">
              {error || "Organization not found"}
            </div>
            <button onClick={handleBackToSearch} className="back-to-search">
              Back to Search
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="organization-details-container">
        <div className="organization-header">
          <h1>{organization.organization_name}</h1>
          <div className="organization-status">
            <span className="status-badge verified">Verified Organization</span>
          </div>
        </div>

        <div className="organization-content">
          <div className="contact-info">
            <h2>Contact Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <FaPhone className="icon" />
                <div>
                  <h3>Phone</h3>
                  <p>{organization.phone_number || "Not provided"}</p>
                </div>
              </div>
              <div className="info-item">
                <FaEnvelope className="icon" />
                <div>
                  <h3>Email</h3>
                  <p>{organization.email || "Not provided"}</p>
                </div>
              </div>
              <div className="info-item">
                <FaMapMarkerAlt className="icon" />
                <div>
                  <h3>Address</h3>
                  <p>{organization.address || "Not provided"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="blood-stocks-section">
            <h2>
              <FaTint className="icon" /> Available Blood Stocks
            </h2>
            <div className="blood-stocks-grid">
              {organization.blood_stocks?.length > 0 ? (
                organization.blood_stocks.map((stock) => (
                  <div key={stock.id} className="blood-stock-card">
                    <div className="blood-group">{stock.blood_group}</div>
                    <div className="quantity">{stock.quantity} units</div>
                    <div className="updated-at">
                      Last updated:{" "}
                      {new Date(stock.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-stocks">No blood stocks available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrganizationDetails;
