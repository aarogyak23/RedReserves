import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import axios from "axios";
import "./login.scss";
import Navbar from "../../Components/Navbar/Navbar";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
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
      // Configure axios
      axios.defaults.withCredentials = true;

      // First, get CSRF cookie
      await axios.get(`${API_URL}/sanctum/csrf-cookie`);

      // Then attempt login
      const response = await axios.post(`${API_URL}/api/login`, formData, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        withCredentials: true,
      });

      if (response.data.status) {
        // Show success message
        setError(null);
        const successDiv = document.createElement("div");
        successDiv.className = "success-message";
        successDiv.textContent = "Login successful! Redirecting to home...";
        document.querySelector(".error-message")?.remove();
        document
          .querySelector(".formSection h2")
          .insertAdjacentElement("afterend", successDiv);

        // Store user data and token
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        // Set default authorization header for future requests
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${response.data.token}`;

        // Wait for 1.5 seconds before redirecting
        setTimeout(() => {
          navigate("/home");
        }, 1500);
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err.response) {
        if (err.response.status === 401) {
          setError("Invalid email or password");
        } else {
          setError(
            err.response.data.message || "Login failed. Please try again."
          );
        }
      } else if (err.request) {
        setError("No response from server. Please try again.");
      } else {
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
        <h2>Log In</h2>
        {error && <div className="error-message">{error}</div>}
        <button className="google-button">
          <FcGoogle size={20} style={{ marginRight: "8px" }} />
          Log in with Google
        </button>
        <p className="or-divider">or</p>
        <form className="signupForm" onSubmit={handleSubmit}>
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
          <span className="helper-text">Forgot Password?</span>

          <button type="submit" className="signup-button" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Log in"}
          </button>
        </form>
        <p className="login-prompt">
          Don&apos;t have an account?{" "}
          <span className="link" onClick={() => navigate("/signup")}>
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
