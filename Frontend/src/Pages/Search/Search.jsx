import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosConfig";
import {
  FaSearch,
  FaBuilding,
  FaPhone,
  FaMapMarkerAlt,
  FaTint,
} from "react-icons/fa";
import Navbar from "../../Components/Navbar/Navbar";
import "./Search.scss";

const Search = () => {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(10);

  // Debounced fetch function
  const debouncedFetch = useCallback(
    (() => {
      let timeoutId;
      return () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          fetchOrganizations();
        }, 300);
      };
    })(),
    [currentPage, searchTerm]
  );

  useEffect(() => {
    debouncedFetch();
  }, [currentPage, searchTerm]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axiosInstance.get(
        `/api/organizations/search?page=${currentPage}&per_page=${perPage}&search=${searchTerm}`
      );

      if (response.data.status) {
        console.log("Organizations fetched:", response.data.data);
        setOrganizations(response.data.data || []);
        setTotalPages(response.data.last_page || 1);
        setError(null);
      } else {
        throw new Error(
          response.data.message || "Failed to fetch organizations"
        );
      }
    } catch (err) {
      console.error("Error fetching organizations:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch organizations. Please try again later."
      );
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleOrganizationClick = (orgId) => {
    console.log("Clicking organization:", orgId);
    const org = organizations.find((o) => o.id === orgId);
    console.log("Organization data:", org);
    // Ensure orgId is a clean number/string without any colons
    const cleanOrgId = String(orgId).split(":")[0];
    navigate(`/organizations/${cleanOrgId}`);
  };

  return (
    <>
      <Navbar />
      <div className="search-container">
        <div className="search-header">
          <h1>Search Organizations</h1>
          <p>
            Find verified blood donation organizations and check their blood
            stock levels
          </p>
        </div>

        <div className="search-form">
          <div className="search-input-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by organization name or address..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading organizations...</div>
        ) : (
          <>
            <div className="organizations-grid">
              {organizations.map((org) => (
                <div
                  key={org.id}
                  className="organization-card"
                  onClick={() => handleOrganizationClick(org.id)}
                >
                  <div className="organization-icon">
                    <FaBuilding />
                  </div>
                  <div className="organization-info">
                    <div className="organization-details">
                      <h3>{org.organization_name}</h3>
                      <p>
                        <FaPhone className="icon" />
                        {org.organization_phone || "No phone number provided"}
                      </p>
                      <p>
                        <FaMapMarkerAlt className="icon" />
                        {org.organization_address || "No address provided"}
                      </p>
                    </div>
                    {org.blood_stocks && org.blood_stocks.length > 0 && (
                      <div className="blood-stocks">
                        <h4>
                          <FaTint className="icon" /> Available Blood Stocks
                        </h4>
                        <div className="stock-grid">
                          {org.blood_stocks.map((stock) => (
                            <div key={stock.id} className="stock-item">
                              <span className="blood-group">
                                {stock.blood_group}
                              </span>
                              <span className="quantity">
                                {stock.quantity} units
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="view-more">View Details →</div>
                </div>
              ))}
            </div>

            {organizations.length === 0 && !loading && (
              <div className="no-results">
                No verified organizations found matching your search criteria.
              </div>
            )}

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="page-button"
                >
                  Previous
                </button>
                <span className="page-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="page-button"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default Search;
