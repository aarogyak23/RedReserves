import React from "react";
import Navbar from "../../Components/Navbar/Navbar";
import "./Home.scss";

export const Home = () => {
  return (
    <>
      <Navbar />
      <img className="HomeImage" src="/src/assets/bLOOD.jpg"></img>
      <div className="HomebannerText">
        Connecting Lives Through Blood Donation <span>Blood Donation</span>
        <p>
          Be the reason for someone smiles today.Donate or find blood a donor in
          just a few clicks
        </p>
        <button className="HomeButton" type="submit">
          Register Now
        </button>
      </div>
    </>
  );
};

export default Home;
