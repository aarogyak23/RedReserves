import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUser, FaLock, FaSignInAlt } from "react-icons/fa";
import "./AdminLogin.scss";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem("adminToken");
    const user = JSON.parse(localStorage.getItem("adminUser") || "{}");

    // Only redirect if we have both a token and a valid admin user
    if (token && user && user.is_admin) {
      navigate("/admin/dashboard");
    } else {
      // Clear any invalid tokens
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
    setError(""); // Clear general error when user types
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      console.log("Attempting admin login with:", formData);

      // Configure axios
      const axiosConfig = {
        baseURL: API_URL,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      };

      const response = await axios.post(
        "/api/admin/login",
        formData,
        axiosConfig
      );
      console.log("Login response:", response.data);

      if (response.data.status && response.data.token) {
        // Store token and user data
        localStorage.setItem("adminToken", response.data.token);
        localStorage.setItem("adminUser", JSON.stringify(response.data.user));

        // Configure axios defaults for future requests
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${response.data.token}`;
        axios.defaults.baseURL = API_URL;

        navigate("/admin/dashboard");
      } else {
        setError(response.data.message || "Login failed");
      }
    } catch (error) {
      console.error("Admin login error:", error);
      if (error.response?.status === 401) {
        setError("Invalid email or password");
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.message === "Network Error") {
        setError(
          "Unable to connect to the server. Please check your internet connection."
        );
      } else {
        setError("An error occurred during login. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="login-container">
        <div className="logo-section">
          <div className="logo-icon">
            <FaUser />
          </div>
          <h1>Admin Login</h1>
          <p>Welcome Admin! Login to your dashboard.</p>
        </div>

        {error && <div className="error-alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-group">
              <FaUser />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>
            {errors.email && (
              <div className="error-message">{errors.email}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-group">
              <FaLock />
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
            </div>
            {errors.password && (
              <div className="error-message">{errors.password}</div>
            )}
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            <FaSignInAlt />
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
