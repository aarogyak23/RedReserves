import React from "react";

import "./DonateBlood.scss";
import Navbar from "../../Components/Navbar/Navbar";
import Footer from "../../Components/Footer/Footer";

const DonateBlood = () => {
  return (
    <>
      <Navbar />
      <img className="bannerImage" src="/src/assets/image.png"></img>
      <div className="bannerText">
        Register with us today to Donate <span>Blood</span>
      </div>
      <div className="container">
        <div className="image-section">
          <img src="./src/assets/image copy.png" alt="Placeholder" />
        </div>

        {/* Form Section */}
        <div className="form-Section">
          <form>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  placeholder="Enter first name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" placeholder="Enter Your Email" />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone No.</label>
                <input
                  type="tel"
                  id="phone"
                  placeholder="Enter Your Phone No."
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
                />
              </div>
              <div className="form-group">
                <label htmlFor="dob">Date Of Birth</label>
                <input type="text" id="dob" placeholder="mm/dd/yyyy" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select id="gender">
                  <option value="">Select Your Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="bloodGroup">Blood Group</label>
                <input
                  type="text"
                  id="bloodGroup"
                  placeholder="Enter Your Blood Group"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  <input type="checkbox" /> I agree to the{" "}
                  <span>Terms of Use</span> and <span>Privacy Policy.</span>
                </label>
              </div>
            </div>

            <button className="submitButton" type="submit">
              Submit
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default DonateBlood;
