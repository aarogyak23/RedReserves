import React from "react";
import { useState, useEffect } from "react";
import "./Navbar.scss";
import { useNavigate } from "react-router-dom";

export const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  return (
    <header className="header">
      <img
        onClick={() => navigate("/home")}
        className="logoImage"
        src="/src/assets/Screenshot 2025-02-18 at 11.16.18.png"
        alt="Logo"
      />
      <nav className="navbar">
        <a onClick={() => navigate("/home")}>Home</a>
        <a onClick={() => navigate("/donateblood")}>Donate Blood</a>
        <a onClick={() => navigate("/requestblood")}>Request Blood</a>
        <a onClick={() => navigate("/aboutus")}>About Us</a>
        <a href="/home">Campaigns</a>
        <a href="/home">Search</a>
        {user ? (
          <div className="user-section">
            <span className="username">Welcome, {user.name}</span>
            <span className="navButton" onClick={handleLogout}>
              Logout
            </span>
          </div>
        ) : (
          <span className="navButton active" onClick={() => navigate("/login")}>
            Log In
          </span>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
