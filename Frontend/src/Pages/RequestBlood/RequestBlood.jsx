import React, { useState, useEffect } from "react";
import Navbar from "../../Components/Navbar/Navbar";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./RequestBlood.scss";
import Footer from "../../Components/Footer/Footer";

export const RequestBlood = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    date_of_birth: "",
    gender: "",
    blood_group: "",
    requisition_form: null,
  });
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { id, value, type, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === "file" ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreeToTerms) {
      setError("Please agree to the Terms of Use and Privacy Policy");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in to submit a blood request");
      navigate("/login");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create form data for file upload
      const submitData = new FormData();
      Object.keys(formData).forEach((key) => {
        submitData.append(key, formData[key]);
      });

      // Configure axios
      axios.defaults.withCredentials = true;

      // Get CSRF cookie
      await axios.get("http://localhost:8000/sanctum/csrf-cookie");

      // Submit request with auth token
      const response = await axios.post(
        "http://localhost:8000/api/blood-requests",
        submitData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      setSuccess(true);
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        address: "",
        date_of_birth: "",
        gender: "",
        blood_group: "",
        requisition_form: null,
      });
      setAgreeToTerms(false);

      // Reset file input
      const fileInput = document.getElementById("requisition_form");
      if (fileInput) fileInput.value = "";
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
        navigate("/login");
        return;
      }
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "An error occurred while submitting your request"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <img
        className="Banner"
        src="src/assets/donate.png"
        alt="Blood Donation Banner"
      />
      <div className="BannerText">
        Are you in need of <span>Blood?</span>
        <p>Please fill the form below to complete the Blood Request.</p>
      </div>
      <div className="container">
        <div className="image-section">
          <img src="/src/assets/BloodPacket.png" alt="Blood Packet" />
        </div>
        <div className="form-Section">
          {error && <div className="error-message">{error}</div>}
          {success && (
            <div className="success-message">
              Blood request submitted successfully!
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="first_name">First Name</label>
                <input
                  type="text"
                  id="first_name"
                  placeholder="Enter first name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="last_name">Last Name</label>
                <input
                  type="text"
                  id="last_name"
                  placeholder="Enter last name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  placeholder="Enter Your Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone No.</label>
                <input
                  type="tel"
                  id="phone"
                  placeholder="Enter Your Phone No."
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input
                  type="text"
                  id="address"
                  placeholder="Enter Your Address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="date_of_birth">Date Of Birth</label>
                <input
                  type="date"
                  id="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Your Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="blood_group">Blood Group</label>
                <select
                  id="blood_group"
                  value={formData.blood_group}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="requisition_form">Requisition Form</label>
              <input
                type="file"
                id="requisition_form"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleChange}
                required
              />
              <small>Accepted formats: PDF, JPG, JPEG, PNG (max 2MB)</small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="terms">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                  />{" "}
                  I agree to the <span>Terms of Use</span> and{" "}
                  <span>Privacy Policy.</span>
                </label>
              </div>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit"}
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default RequestBlood;
