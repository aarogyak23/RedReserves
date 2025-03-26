import React, { useState } from "react";

import Navbar from "../../Components/Navbar/Navbar";
import { Container, Row, Col } from "react-bootstrap";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "./Aboutus.scss";
import Footer from "../../Components/Footer/Footer";

const teamMembers = [
  {
    name: "Jimmy Miller",
    img: "./src/assets/person1.jpeg",
  },
  {
    name: "Sujan Thapa",
    img: "./src/assets/person2.jpeg",
  },
  {
    name: "Ankita Basnet",
    img: "./src/assets/person3.jpeg",
  },
  {
    name: "New Member",
    img: "./src/assets/person5.webp",
  },
  {
    name: "New Member",
    img: "./src/assets/person6.jpg",
  },
  {
    name: "New Member",
    img: "./src/assets/person7.jpeg",
  },
];
const galleryImages = [
  "./src/assets/donations.JPG",
  "./src/assets/lol.webp",
  "./src/assets/teammss.jpg",
];

export const Aboutus = () => {
  const [startIndex, setStartIndex] = useState(0);
  const visibleMembers = 3; // Show 3 members at a time

  const nextSlide = () => {
    setStartIndex((prev) => (prev + 1) % teamMembers.length);
  };

  const prevSlide = () => {
    setStartIndex((prev) => (prev === 0 ? teamMembers.length - 1 : prev - 1));
  };
  return (
    <div className="aboutus-container">
      <Navbar />
      <div className="leader-section">
        <h2 className="title">Our Leader</h2>
        <div className="content">
          <img
            src="./src/assets/Leader.png"
            alt="Leader"
            className="leader-image"
          />
          <div className="divider"></div>
          <div className="quote-container">
            <p className="quote">
              "I am proud of Red Reserve’s <em>unwavering dedication</em> to
              transforming and strengthening the blood donation network. Our
              committed team of staff and volunteers, in collaboration with
              hospitals and medical partners, works tirelessly to ensure a safe,
              reliable, and readily available blood supply. We strive to
              innovate and improve donation processes, creating a resilient
              system that meets patient needs while advancing lifesaving
              solutions. Together, we are building a future where no one has to
              wait for the gift of life."
            </p>
            <p className="leader-name">Dr. Samuel Bennett, President</p>
          </div>
        </div>
      </div>
      <div className="mission-section">
        <h1 className="mission-title">Red Reserve Mission</h1>
        <p className="mission-text">
          As a top charity brand with the trust of the American people, our
          mission is to fulfill the need for safe, reliable, and cost-effective
          blood products and services. We accomplish this mission through the
          hard work and commitment of staff and volunteers located throughout
          the country, along with numerous fixed and mobile collection sites,
          manufacturing locations, and the National & Biomedical Headquarters,
          which are based in Washington, D.C. The foundation of this mission
          lies with the extraordinary act of voluntary blood donation. Blood
          donors play an integral role in the delivery of modern healthcare and
          many life-saving medical treatments and procedures would not be
          possible without a safe and reliable blood supply.
        </p>
        <button className="mission-button">
          Learn more about our other areas of work
        </button>
      </div>
      <hr />
      {/* Team Members */}
      <Container className="team-container">
        <h1 className="Member-title">Meet Our Members</h1>
        <FaChevronLeft className="arrow left-arrow" onClick={prevSlide} />
        <Row className="justify-content-center">
          {teamMembers
            .slice(startIndex, startIndex + visibleMembers)
            .map((member, index) => (
              <Col key={index} md={4} sm={6} xs={12} className="team-member">
                <img src={member.img} alt={member.name} />
                <h3>{member.name}</h3>
                <p>{member.role}</p>
              </Col>
            ))}
        </Row>
        <FaChevronRight className="arrow right-arrow" onClick={nextSlide} />
      </Container>
      <section className="gallery-section">
        <h2>GALLERY</h2>
        <div className="underline"></div>
        <div className="gallery-container">
          {galleryImages.map((image, index) => (
            <div key={index} className="gallery-item">
              <img src={image} alt={`Gallery ${index + 1}`} />
            </div>
          ))}
        </div>
        <button className="all-photos-btn">ALL PHOTOS</button>
      </section>

      <Footer />
    </div>
  );
};

export default Aboutus;
