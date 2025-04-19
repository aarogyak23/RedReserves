import { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosConfig";
import "./BloodStock.scss";
import Navbar from "../../Components/Navbar/Navbar";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import Footer from "../../Components/Footer/Footer";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const BloodStock = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingStock, setEditingStock] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    blood_group: "",
    quantity: "",
  });

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const chartData = {
    labels: stocks.map((stock) => stock.blood_group),
    datasets: [
      {
        label: "Blood Stock Quantity",
        data: stocks.map((stock) => stock.quantity),
        fill: false,
        borderColor: "#ce2029",
        tension: 0.4,
        pointBackgroundColor: "#ce2029",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Blood Stock Levels",
        font: {
          size: 16,
          family: "'Poppins', sans-serif",
          weight: "600",
        },
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

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    try {
      // First get the user's profile to get their organization ID
      const userResponse = await axiosInstance.get("/api/profile");
      const organizationId = userResponse.data.id;

      // Then fetch the stocks for this organization
      const response = await axiosInstance.get(
        `/api/organizations/${organizationId}/stocks`
      );
      setStocks(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching blood stocks:", err);
      setError(err.response?.data?.message || "Failed to fetch blood stocks");
      setLoading(false);
    }
  };

  const handleEditStock = (stock) => {
    setEditingStock(stock);
    setFormData({
      blood_group: stock.blood_group,
      quantity: stock.quantity,
    });
  };

  const handleAddNewClick = () => {
    setShowAddForm(true);
    setFormData({
      blood_group: "",
      quantity: "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post("/api/stocks/update", formData);
      setEditingStock(null);
      setShowAddForm(false);
      setFormData({
        blood_group: "",
        quantity: "",
      });
      fetchStocks();
    } catch (err) {
      console.error("Error updating blood stock:", err);
      setError(err.response?.data?.message || "Failed to update blood stock");
    }
  };

  const handleCloseModal = () => {
    setEditingStock(null);
    setShowAddForm(false);
    setFormData({
      blood_group: "",
      quantity: "",
    });
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading">Loading blood stocks...</div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="error">{error}</div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="blood-stock-container">
        <div className="header-section">
          <h2>Blood Stock Management</h2>
          <button className="add-stock-btn" onClick={handleAddNewClick}>
            Add New Stock
          </button>
        </div>

        <div className="dashboard-content">
          <div className="stocks-section">
            <div className="stocks-grid">
              {stocks.map((stock) => (
                <div key={stock.id} className="stock-card">
                  <div className="blood-group">{stock.blood_group}</div>
                  <div className="quantity">{stock.quantity} units</div>
                  <button
                    className="edit-btn"
                    onClick={() => handleEditStock(stock)}
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-section">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {(editingStock || showAddForm) && (
          <div className="modal">
            <div className="modal-content">
              <h3>
                {editingStock ? "Edit Blood Stock" : "Add New Blood Stock"}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Blood Group</label>
                  {editingStock ? (
                    <input
                      type="text"
                      name="blood_group"
                      value={formData.blood_group}
                      readOnly
                    />
                  ) : (
                    <select
                      name="blood_group"
                      value={formData.blood_group}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Blood Group</option>
                      {bloodGroups.map((group) => (
                        <option key={group} value={group}>
                          {group}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    required
                    min="0"
                  />
                </div>
                <div className="modal-actions">
                  <button type="submit" className="save-btn">
                    {editingStock ? "Save Changes" : "Add Stock"}
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default BloodStock;
