import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FaSearch, FaBuilding, FaPhone, FaMapMarkerAlt } from "react-icons/fa";
import Navbar from "../../Components/Navbar/Navbar";
import "./Search.scss";

const API_URL = import.meta.env.VITE_API_URL;

const Search = () => {
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
      const token = localStorage.getItem("token");

      const response = await axios.get(
        `${API_URL}/api/organizations/search?page=${currentPage}&per_page=${perPage}&search=${searchTerm}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      if (response.data.status) {
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

  return (
    <>
      <Navbar />
      <div className="search-container">
        <div className="search-header">
          <h1>Search Organizations</h1>
          <p>Find verified blood donation organizations in your area</p>
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
                <div key={org.id} className="organization-card">
                  <div className="organization-icon">
                    <FaBuilding />
                  </div>
                  <div className="organization-info">
                    <h3>{org.organization_name}</h3>
                    <div className="organization-details">
                      <p>
                        <FaPhone className="icon" />
                        {org.organization_phone || "No phone number provided"}
                      </p>
                      <p>
                        <FaMapMarkerAlt className="icon" />
                        {org.organization_address || "No address provided"}
                      </p>
                    </div>
                  </div>
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
