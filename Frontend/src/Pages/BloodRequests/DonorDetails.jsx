import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../../Components/Navbar/Navbar";
import Footer from "../../Components/Footer/Footer";
import "./DonorDetails.scss";

const API_URL = import.meta.env.VITE_API_URL;

const DonorDetails = () => {
  const { requestId, donorId } = useParams();
  const navigate = useNavigate();
  const [donor, setDonor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bloodRequest, setBloodRequest] = useState(null);

  useEffect(() => {
    if (!requestId || !donorId) {
      setError("Invalid request or donor ID");
      setLoading(false);
      return;
    }
    fetchDonorDetails();
  }, [requestId, donorId]);

  const fetchDonorDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You must be logged in to view donor details");
        return;
      }

      console.log("Starting to fetch donor details with:", {
        API_URL,
        requestId,
        donorId,
        token: token ? "Present" : "Missing",
      });

      // First try to fetch the blood request donors
      try {
        console.log("Attempting to fetch blood request donors...");
        const donorsResponse = await axios.get(
          `${API_URL}/api/blood-requests/${requestId}/donors`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (donorsResponse.data) {
          console.log("Donors found:", donorsResponse.data);
          const donors = donorsResponse.data.data || donorsResponse.data;
          const donorData = donors.find(
            (d) => d.id.toString() === donorId.toString()
          );

          if (donorData) {
            console.log("Found donor in blood request:", donorData);
            setDonor(donorData);

            // Try to get the blood request details for context
            try {
              const requestResponse = await axios.get(
                `${API_URL}/api/blood-requests`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (requestResponse.data) {
                console.log("Blood requests found:", requestResponse.data);
                const requests =
                  requestResponse.data.data || requestResponse.data;
                const requestData = requests.find(
                  (r) => r.id.toString() === requestId.toString()
                );
                if (requestData) {
                  console.log("Found matching blood request:", requestData);
                  setBloodRequest(requestData);
                }
              }
            } catch (requestError) {
              console.warn("Could not fetch blood request:", requestError);
              // Don't set error since we have the donor data
            }

            setError(null);
            return;
          }
        }
      } catch (donorsError) {
        console.warn("Could not fetch blood request donors:", donorsError);
      }

      // If that fails, try to fetch from donation history
      try {
        console.log("Attempting to fetch from donation history...");
        const donationsResponse = await axios.get(
          `${API_URL}/api/donations/history`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (donationsResponse.data) {
          const donations =
            donationsResponse.data.data || donationsResponse.data;
          const donorData = donations.find(
            (d) =>
              d.id.toString() === donorId.toString() &&
              d.blood_request_id.toString() === requestId.toString()
          );

          if (donorData) {
            console.log("Found donor in donation history:", donorData);
            setDonor(donorData);
            setError(null);
            return;
          }
        }
      } catch (donationsError) {
        console.warn("Could not fetch from donation history:", donationsError);
      }

      // If all attempts fail, show appropriate error
      throw new Error("Could not find donor details");
    } catch (error) {
      console.error("Error fetching data:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
      });

      let errorMessage = "Failed to fetch donor details";

      if (error.response?.status === 404) {
        if (error.config?.url.includes("/donors")) {
          errorMessage = "Donor information not found";
        } else if (error.config?.url.includes("/blood-requests/")) {
          errorMessage = "Blood request not found";
        } else if (error.config?.url.includes("/donations/history")) {
          errorMessage = "No donation record found";
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You must be logged in to perform this action");
        return;
      }

      const endpoint = `${API_URL}/api/blood-requests/${requestId}/donors/${donorId}/status`;
      console.log("Sending action request to:", endpoint);

      const response = await axios.put(
        endpoint,
        { status: action === "accept" ? "accepted" : "rejected" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.status) {
        alert(
          response.data.message || `Donor has been ${action}ed successfully`
        );
        navigate("/blood-requests");
      }
    } catch (error) {
      console.error(`Error ${action}ing donor:`, error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
      });

      let errorMessage = `Failed to ${action} donor`;
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="donor-details-page">
          <div className="loading">Loading donor details...</div>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="donor-details-page">
          <div className="error">{error}</div>
          <button
            className="back-button"
            onClick={() => navigate("/blood-requests")}
          >
            Back to Blood Requests
          </button>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="donor-details-page">
        <div className="donor-details-card">
          <h2>Donor Details</h2>
          {donor && (
            <>
              <div className="detail-row">
                <label>Name:</label>
                <span>{donor.name}</span>
              </div>
              <div className="detail-row">
                <label>Blood Group:</label>
                <span>{donor.blood_group}</span>
              </div>
              <div className="detail-row">
                <label>Phone:</label>
                <span>{donor.phone}</span>
              </div>
              <div className="detail-row">
                <label>Email:</label>
                <span>{donor.email}</span>
              </div>
              {donor.message && (
                <div className="detail-row">
                  <label>Message:</label>
                  <span>{donor.message}</span>
                </div>
              )}
              <div className="detail-row">
                <label>Status:</label>
                <span className={`status ${donor.status}`}>{donor.status}</span>
              </div>

              {donor.status === "pending" &&
                bloodRequest?.user_id ===
                  JSON.parse(localStorage.getItem("user"))?.id && (
                  <div className="action-buttons">
                    <button
                      className="accept-btn"
                      onClick={() => handleAction("accept")}
                    >
                      Accept Donor
                    </button>
                    <button
                      className="reject-btn"
                      onClick={() => handleAction("reject")}
                    >
                      Reject Donor
                    </button>
                  </div>
                )}
            </>
          )}
          <button
            className="back-button"
            onClick={() => navigate("/blood-requests")}
          >
            Back to Blood Requests
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default DonorDetails;
