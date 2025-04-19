import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosConfig";
import "./OrganizationDetails.scss";
import Navbar from "../../Components/Navbar/Navbar";
import LoadingSpinner from "../../Components/LoadingSpinner/LoadingSpinner";
import {
  FaPhone,
  FaMapMarkerAlt,
  FaEnvelope,
  FaTint,
  FaArrowLeft,
  FaBuilding,
} from "react-icons/fa";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

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

  const renderBarGraph = () => {
    if (!organization?.blood_stocks) return null;

    const data = {
      labels: organization.blood_stocks.map((stock) => stock.blood_group),
      datasets: [
        {
          label: "Blood Units Available",
          data: organization.blood_stocks.map((stock) => stock.quantity),
          backgroundColor: "rgb(197, 22, 22)",
          borderColor: "rgba(231, 76, 60, 1)",
          borderWidth: 1,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
        },
        title: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Units",
          },
        },
      },
    };

    return <Bar data={data} options={options} />;
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
          <button onClick={handleBackToSearch} className="back-button">
            <FaArrowLeft /> Back to Search
          </button>
          <h1>{organization.organization_name}</h1>
          <div className="organization-status">
            <span className="status-badge verified">Verified Organization</span>
          </div>
        </div>

        <div className="info-grid">
          {/* Organization Details Box */}
          <div className="info-box">
            <div className="info-box-header">
              <FaBuilding className="icon" />
              <h2>Organization Details</h2>
            </div>
            <div className="info-content">
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

          {/* Blood Stock Box */}
          <div className="info-box">
            <div className="info-box-header">
              <FaTint className="icon" />
              <h2>Blood Stock Levels</h2>
            </div>
            <div className="info-content blood-grid">
              {organization.blood_stocks?.map((stock) => (
                <div key={stock.id} className="blood-stock-item">
                  <span className="blood-group">{stock.blood_group}</span>
                  <span className="quantity">{stock.quantity} units</span>
                  <span className="updated">
                    Updated: {new Date(stock.updated_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Blood Stock Graph Box */}
          <div className="info-box">
            <div className="info-box-header">
              <FaTint className="icon" />
              <h2>Stock Visualization</h2>
            </div>
            <div className="info-content graph-container">
              {renderBarGraph()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrganizationDetails;
