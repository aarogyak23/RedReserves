import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import Signup from "./Pages/Signup/signup";
import Login from "./Pages/Login/login";
import Home from "./Pages/Home/home";
import DonateBlood from "./Pages/DonateBlood/DonateBlood";
import ErrorBoundary from "./ErrorBoundary";
import RequestBlood from "./Pages/RequestBlood/RequestBlood";
import Aboutus from "./Pages/AboutUs/aboutus";
import AdminLogin from "./Pages/Admin/AdminLogin";
import AdminDashboard from "./Pages/Admin/AdminDashboard";
import Search from "./Pages/Search/Search";
import UserProfile from "./Pages/User/UserProfile";
import BloodRequests from "./Pages/BloodRequests/BloodRequests";

// Protected route component for admin routes
const ProtectedAdminRoute = ({ children }) => {
  const token = localStorage.getItem("adminToken");
  const user = JSON.parse(localStorage.getItem("adminUser") || "{}");

  if (!token || !user.is_admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

ProtectedAdminRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/donateblood" element={<DonateBlood />} />
          <Route path="/requestblood" element={<RequestBlood />} />
          <Route path="/aboutus" element={<Aboutus />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            }
          />
          <Route path="/search" element={<Search />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/blood-requests" element={<BloodRequests />} />
          <Route path="/" element={<Navigate to="/home" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
