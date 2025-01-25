import React from "react";
import "../css/Navbar.css";

const Navbar = () => {
  const logoBaseURL = "http://localhost:5000/assets/logos";
  const logoURL = `${logoBaseURL}/MainLogo.png`;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <img src={logoURL} alt="Main Logo" className="navbar-logo" />
        <h1 className="navbar-title">NCAA LIVE SCORE</h1>
      </div>
    </nav>
  );
};

export default Navbar;
