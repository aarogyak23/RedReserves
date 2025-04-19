import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./OrganizationStocks.scss";
import Navbar from "../../Components/Navbar/Navbar";
import LoadingSpinner from "../../Components/LoadingSpinner/LoadingSpinner";
import Footer from "../../Components/Footer/Footer";

const OrganizationStocks = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBloodGroup, setSelectedBloodGroup] = useState("all");

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/organizations`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setOrganizations(response.data);
        setLoading(false);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to fetch organizations"
        );
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  const bloodGroups = ["all", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const filteredOrganizations = organizations.filter((org) => {
    const matchesSearch = org.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesBloodGroup =
      selectedBloodGroup === "all" ||
      org.blood_stocks?.some(
        (stock) => stock.blood_group === selectedBloodGroup
      );
    return matchesSearch && matchesBloodGroup;
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="error">{error}</div>;

  return (
    <>
      <Navbar />
      <div className="organization-stocks-container">
        <h1>Blood Stock Levels</h1>

        <div className="filters">
          <input
            type="text"
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />

          <select
            value={selectedBloodGroup}
            onChange={(e) => setSelectedBloodGroup(e.target.value)}
            className="blood-group-select"
          >
            {bloodGroups.map((group) => (
              <option key={group} value={group}>
                {group === "all" ? "All Blood Groups" : group}
              </option>
            ))}
          </select>
        </div>

        <div className="organizations-grid">
          {filteredOrganizations.map((org) => (
            <div key={org.id} className="organization-card">
              <h2>{org.name}</h2>
              <div className="blood-stocks">
                {org.blood_stocks?.length > 0 ? (
                  org.blood_stocks.map((stock) => (
                    <div
                      key={stock.id}
                      className={`stock-item ${
                        selectedBloodGroup === stock.blood_group
                          ? "highlighted"
                          : ""
                      }`}
                    >
                      <span className="blood-group">{stock.blood_group}</span>
                      <span className="quantity">{stock.quantity} units</span>
                      <span className="updated-at">
                        Updated:{" "}
                        {new Date(stock.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="no-stocks">No blood stocks available</p>
                )}
              </div>
              <Link to={`/organizations/${org.id}`} className="view-details">
                View Details
              </Link>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default OrganizationStocks;
