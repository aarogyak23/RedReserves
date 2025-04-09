import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import Notifications from "../Notification/Notifications";
import "./Navbar.scss";

export const Navbar = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check authentication status when component mounts
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");
      setIsAuthenticated(!!token);
      if (userData) {
        setUser(JSON.parse(userData));
      }
    };

    // Initial check
    checkAuth();

    // Listen for auth state changes
    const handleAuthChange = (event) => {
      setIsAuthenticated(event.detail.isAuthenticated);
      if (event.detail.isAuthenticated) {
        const userData = localStorage.getItem("user");
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } else {
        setUser(null);
      }
    };

    window.addEventListener("authStateChanged", handleAuthChange);
    return () =>
      window.removeEventListener("authStateChanged", handleAuthChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUser(null);

    // Dispatch auth state change event
    const authEvent = new CustomEvent("authStateChanged", {
      detail: { isAuthenticated: false },
    });
    window.dispatchEvent(authEvent);

    navigate("/login");
  };

  return (
    <header className="header">
      <img
        className="logoImage"
        src="/src/assets/Screenshot 2025-02-18 at 11.16.18.png"
        alt="Logo"
      />
      <nav className="navbar">
        <Link to="/home">Home</Link>
        <Link to="/donateblood">Donate Blood</Link>
        <Link to="/requestblood">Request Blood</Link>
        <Link to="/campaigns">Campaigns</Link>
        <Link to="/aboutus">About</Link>
        <Link to="/search">Search</Link>
        {isAuthenticated ? (
          <>
            <div className="user-section">
              <Notifications />
              <Link to="/profile" className="profile-link" title={user?.name}>
                <FaUser className="profile-icon" />
              </Link>
            </div>
            <a onClick={handleLogout} className="logout-link">
              Logout
            </a>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
