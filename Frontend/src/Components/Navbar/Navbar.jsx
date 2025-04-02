import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import Notifications from "../Notification/Notifications";
import "./Navbar.scss";

const Navbar = () => {
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
        <a onClick={() => navigate("/home")}>Home</a>
        <a onClick={() => navigate("/donateblood")}>Donate Blood</a>
        <a onClick={() => navigate("/requestblood")}>Request Blood</a>
        <a onClick={() => navigate("/aboutus")}>About</a>
        <a onClick={() => navigate("/search")}>Search</a>
        {isAuthenticated ? (
          <>
            <div className="user-section">
              <Notifications />
              <a
                onClick={() => navigate("/profile")}
                className="profile-link"
                title={user?.name}
              >
                <FaUser className="profile-icon" />
              </a>
            </div>
            <a onClick={handleLogout} className="logout-link">
              Logout
            </a>
          </>
        ) : (
          <>
            <a onClick={() => navigate("/login")}>Login</a>
            <a onClick={() => navigate("/register")}>Register</a>
          </>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
