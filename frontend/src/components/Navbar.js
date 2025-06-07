import React from "react";
import "../css/Navbar.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Navbar = () => {
  const logoBaseURL = `${API_URL}/assets/logos`;
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
