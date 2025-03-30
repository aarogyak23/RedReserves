import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import axios from "axios";
import "./signup.scss";
import Navbar from "../../Components/Navbar/Navbar";

export const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    last_name: "",
    blood_group: "A+",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:8000/api/register",
        formData,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          withCredentials: true,
        }
      );

      if (response.data.status) {
        // Registration successful
        setError(null);
        const successMessage =
          "Registration successful! Redirecting to login...";
        // Show success message in green
        const successDiv = document.createElement("div");
        successDiv.className = "success-message";
        successDiv.textContent = successMessage;
        document.querySelector(".error-message")?.remove();
        document
          .querySelector(".formSection h2")
          .insertAdjacentElement("afterend", successDiv);

        // Wait for 2 seconds before redirecting
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        // Registration failed with a known error
        setError(
          response.data.message || "Registration failed. Please try again."
        );
      }
    } catch (err) {
      console.error("Registration error:", err);
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Error response:", err.response.data);
        if (err.response.status === 422) {
          // Validation errors
          const errors = err.response.data.errors;
          if (errors) {
            const errorMessages = Object.values(errors).flat();
            setError(errorMessages.join(", "));
          } else {
            setError(
              err.response.data.message ||
                "Validation failed. Please check your inputs."
            );
          }
        } else {
          setError(
            err.response.data.message ||
              "Registration failed. Please try again."
          );
        }
      } else if (err.request) {
        // The request was made but no response was received
        console.error("No response received:", err.request);
        setError("No response from server. Please try again.");
      } else {
        // Something happened in setting up the request
        console.error("Request setup error:", err.message);
        setError("An error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="Container">
      <Navbar />
      <div className="backgroundSection"></div>
      <div className="formSection">
        <div className="logo">
          Red<span>Reserve</span>
        </div>
        <h2>Sign Up</h2>
        {error && <div className="error-message">{error}</div>}
        <button className="google-button">
          <FcGoogle size={20} style={{ marginRight: "8px" }} />
          Sign Up with Google
        </button>
        <p className="or-divider">or</p>
        <form className="signupForm" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Enter first name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="last_name"
            placeholder="Enter last name"
            value={formData.last_name}
            onChange={handleChange}
            required
          />
          <select
            name="blood_group"
            value={formData.blood_group}
            onChange={handleChange}
            required
          >
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
          <input
            type="email"
            name="email"
            placeholder="Enter an email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Enter a password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="confirm_password"
            placeholder="Re-type the password"
            value={formData.confirm_password}
            onChange={handleChange}
            required
          />
          <div className="terms">
            <input type="checkbox" id="terms" required />
            <label htmlFor="terms">
              I agree to the <span className="link">Terms of Use</span> and{" "}
              <span className="link">Privacy Policy</span>.
            </label>
          </div>
          <button type="submit" className="signupButton" disabled={isLoading}>
            {isLoading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>
        <p className="login-prompt">
          Already have an account?{" "}
          <span className="link" onClick={() => navigate("/login")}>
            Log in
          </span>
        </p>
      </div>
    </div>
  );
};

export default Signup;
