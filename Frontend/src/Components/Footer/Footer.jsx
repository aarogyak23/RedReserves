import React from "react";
import { FaFacebook, FaTwitter, FaInstagram } from "react-icons/fa"; // Social icons

import "./Footer.scss"; // Ensure you have this CSS file

const Footer = () => {
  return (
    <footer className="footer">
      <div className="horizontal-line"></div>
      <div className="footer-container">
        <div className="footer-column">
          <img
            src="/src/assets/RR Logo.png"
            alt="Red Reserve Logo"
            className="footer-logo"
          />
          <p>Red Reserve - Your trusted blood donation network.</p>
        </div>

        <div className="footer-column">
          <h4>Quick Links</h4>
          <nav className="footer-nav">
            <a href="/">Home</a>
            <a href="/donate">Donate Blood</a>
            <a href="/request">Request Blood</a>
            <a href="/contact">Contact Us</a>
          </nav>
        </div>

        <div className="footer-column">
          <h4>Follow Us</h4>
          <div className="footer-social">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaFacebook />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaTwitter />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaInstagram />
            </a>
          </div>
        </div>
      </div>

      <div className="footer-copyright">
        &copy; {new Date().getFullYear()} Red Reserve. All Rights Reserved.
      </div>
    </footer>
  );
};

export default Footer;
