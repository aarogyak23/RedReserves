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
import DonorDetails from "./Pages/BloodRequests/DonorDetails";
import Campaigns from "./Pages/Campaigns/Campaigns";
import AdminCampaigns from "./Pages/Admin/AdminCampaigns";
import BloodStock from "./Pages/BloodStock/BloodStock";
import OrganizationDetails from "./Pages/Organization/OrganizationDetails";
import OrganizationStocks from "./Pages/Organization/OrganizationStocks";

// Protected route component for admin routes
const ProtectedAdminRoute = ({ children }) => {
  const token = localStorage.getItem("adminToken");
  const user = JSON.parse(localStorage.getItem("adminUser") || "{}");

  if (!token || !user.is_admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

// Protected route component for authenticated users
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

ProtectedAdminRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

ProtectedRoute.propTypes = {
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
          <Route path="/campaigns" element={<Campaigns />} />
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
          <Route
            path="/blood-requests"
            element={
              <ProtectedRoute>
                <BloodRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/blood-requests/:requestId/donors/:donorId"
            element={
              <ProtectedRoute>
                <DonorDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/blood-stock"
            element={
              <ProtectedRoute>
                <BloodStock />
              </ProtectedRoute>
            }
          />
          <Route path="/organizations" element={<OrganizationStocks />} />
          <Route path="/organizations/:id" element={<OrganizationDetails />} />
          <Route
            path="/admin/campaigns"
            element={
              <ProtectedAdminRoute>
                <AdminCampaigns />
              </ProtectedAdminRoute>
            }
          />
          <Route path="/" element={<Navigate to="/home" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
