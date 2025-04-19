import React from "react";
import Navbar from "../../Components/Navbar/Navbar";
import Footer from "../../Components/Footer/Footer";
import {
  FaTint,
  FaHospital,
  FaUsers,
  FaHandHoldingHeart,
  FaCheckCircle,
  FaHeart,
  FaQuoteLeft,
  FaClock,
  FaMapMarkerAlt,
  FaPhoneAlt,
} from "react-icons/fa";
import "./Home.scss";

export const Home = () => {
  return (
    <div className="home-page">
      <Navbar />

      {/* Hero Section */}
      <img
        className="HomeImage"
        src="/src/assets/bLOOD.jpg"
        alt="Blood Donation Hero"
      />
      <div className="HomebannerText">
        Connecting Lives Through Blood Donation <span>Blood Donation</span>
        <p>
          Every drop counts. Your blood donation can save up to three lives.
          Join our mission to make blood available to everyone in need.
        </p>
        <button className="HomeButton" type="submit">
          Register Now
        </button>
      </div>

      {/* Emergency Contact */}
      <section className="emergency-section">
        <div className="emergency-container">
          <h2>Need Blood Urgently?</h2>
          <div className="emergency-info">
            <div className="info-item">
              <FaPhoneAlt className="info-icon" />
              <p>
                24/7 Emergency Hotline: <strong>014377158</strong>
              </p>
            </div>
            <div className="info-item">
              <FaClock className="info-icon" />
              <p>
                Response Time: <strong>Under 30 minutes</strong>
              </p>
            </div>
            <div className="info-item">
              <FaMapMarkerAlt className="info-icon" />
              <p>Available across all major cities</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="quote-section">
        <div className="quote-container">
          <FaQuoteLeft className="quote-icon" />
          <div className="quote-content">
            <p>
              &ldquo;The blood you donate gives someone another chance at life.
              One day that someone may be a close relative, a friend, a loved
              one—or even you.&rdquo;
            </p>
            <span className="quote-author">- World Health Organization</span>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="statistics-section">
        <h2>Our Impact on Lives</h2>
        <p className="section-subtitle">
          Together, we're making a difference in healthcare
        </p>
        <div className="stat-container">
          <div className="stat-item">
            <FaUsers className="stat-icon" />
            <h3>5000+</h3>
            <p>Registered Donors</p>
            <span className="stat-detail">
              Active blood donors ready to help
            </span>
          </div>
          <div className="stat-item">
            <FaTint className="stat-icon" />
            <h3>10000+</h3>
            <p>Successful Donations</p>
            <span className="stat-detail">Units of blood collected</span>
          </div>
          <div className="stat-item">
            <FaHospital className="stat-icon" />
            <h3>100+</h3>
            <p>Partner Hospitals</p>
            <span className="stat-detail">Healthcare facilities connected</span>
          </div>
          <div className="stat-item">
            <FaHeart className="stat-icon" />
            <h3>15000+</h3>
            <p>Lives Saved</p>
            <span className="stat-detail">Through timely donations</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2>Why Choose Red Reserve?</h2>
        <p className="section-subtitle">
          Your trusted platform for blood donation
        </p>
        <div className="features-container">
          <div className="feature-card">
            <FaHandHoldingHeart className="feature-icon" />
            <h3>Quick & Easy Process</h3>
            <p>
              Register in under 2 minutes. Find donors or request blood with
              just a few clicks. Our streamlined process ensures help reaches
              when needed most.
            </p>
          </div>
          <div className="feature-card">
            <FaTint className="feature-icon" />
            <h3>Emergency Support</h3>
            <p>
              24/7 emergency response team. Immediate access to our network of
              verified donors. Real-time blood availability tracking across
              locations.
            </p>
          </div>
          <div className="feature-card">
            <FaCheckCircle className="feature-icon" />
            <h3>Verified Donors</h3>
            <p>
              All donors undergo thorough screening. Medical history
              verification. Regular health check-ups ensured for safe donation.
            </p>
          </div>
        </div>
      </section>

      {/* Donation Process Section */}
      <section className="process-section">
        <h2>Your Journey to Saving Lives</h2>
        <p className="section-subtitle">Simple steps to make a difference</p>
        <div className="process-steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Register</h3>
            <p>Quick sign-up with basic health information</p>
            <ul className="step-details">
              <li>Simple verification process</li>
              <li>Secure data protection</li>
              <li>Medical history recording</li>
            </ul>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Find Donors</h3>
            <p>Locate nearby compatible donors</p>
            <ul className="step-details">
              <li>Smart matching system</li>
              <li>Real-time availability</li>
              <li>Location-based search</li>
            </ul>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Request Blood</h3>
            <p>Submit detailed requirements</p>
            <ul className="step-details">
              <li>Emergency prioritization</li>
              <li>Multiple blood group options</li>
              <li>Quantity specification</li>
            </ul>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Connect</h3>
            <p>Get instantly connected with donors</p>
            <ul className="step-details">
              <li>Direct communication</li>
              <li>Donation scheduling</li>
              <li>Follow-up support</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Blood Type Information */}
      <section className="blood-info-section">
        <h2>Understanding Blood Types</h2>
        <p className="section-subtitle">
          Know your blood type and who you can help
        </p>
        <div className="blood-type-grid">
          <div className="blood-type-card">
            <h3>Type O-</h3>
            <p className="type-label">Universal Donor</p>
            <p>Can donate to all blood types</p>
          </div>
          <div className="blood-type-card">
            <h3>Type O+</h3>
            <p className="type-label">Most Common</p>
            <p>Can donate to O+, A+, B+, AB+</p>
          </div>
          <div className="blood-type-card">
            <h3>Type AB+</h3>
            <p className="type-label">Universal Recipient</p>
            <p>Can receive from all blood types</p>
          </div>
          <div className="blood-type-card">
            <h3>Type AB-</h3>
            <p className="type-label">Rare Type</p>
            <p>Can receive from all negative types</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Save Lives?</h2>
          <p>
            Every 2 seconds, someone needs blood. Your donation can make the
            difference.
          </p>
          <div className="cta-buttons">
            <button className="donate-btn">Become a Donor</button>
            <button className="request-btn">Request Blood</button>
          </div>
          <p className="cta-note">* One donation can save up to three lives</p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
