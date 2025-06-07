import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../css/SchoolSelector.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const schools = [
  { name: "Princeton", logo: `${API_URL}/assets/logos/Princeton.png` },
  { name: "Columbia", logo: `${API_URL}/assets/logos/Columbia.png` },
  { name: "Harvard", logo: `${API_URL}/assets/logos/Harvard.png` },
  { name: "Yale", logo: `${API_URL}/assets/logos/Yale.png` },
  { name: "UPenn", logo: `${API_URL}/assets/logos/UPenn.png` },
  { name: "Cornell", logo: `${API_URL}/assets/logos/Cornell.png` },
  { name: "Brown", logo: `${API_URL}/assets/logos/Brown.png` },
];

const SchoolSelector = () => {
  const [selectedGender, setSelectedGender] = useState("women");
  const [team1, setTeam1] = useState(null);
  const [team2, setTeam2] = useState(null);
  const navigate = useNavigate();

  // Filter schools based on gender (Cornell and Brown are women-only)
  const availableSchools = selectedGender === "men" 
    ? schools.filter(school => !["Cornell", "Brown"].includes(school.name))
    : schools;

  const isSchoolDisabled = (school) => {
    if (selectedGender === "men" && ["Cornell", "Brown"].includes(school.name)) {
      return true;
    }
    return false;
  };

  const isSchoolSelected = (school) => {
    return team1?.name === school.name || team2?.name === school.name;
  };

  const handleSchoolSelect = (school, side) => {
    if (isSchoolDisabled(school) || isSchoolSelected(school)) return;
    
    if (side === "team1") {
      setTeam1(school);
    } else {
      setTeam2(school);
    }
  };

  const handleGo = () => {
    if (team1 && team2) {
      navigate(`/match/${selectedGender}/${team1.name}/${team2.name}`);
    }
  };

  const resetSelection = () => {
    setTeam1(null);
    setTeam2(null);
  };

  return (
    <>
      <Navbar />
      <div className="school-selector">
        <div className="selector-container">
          <h1 className="title">Select Teams</h1>
          
          {/* Team Selection */}
          <div className="team-selection">
            <div className="team-column">
              <div className="column-header">
                <h3 className="column-title">First Team</h3>
              </div>
              <div className="selected-team">
                {team1 ? (
                  <div className="team-card selected">
                    <img src={team1.logo} alt={team1.name} className="team-logo" />
                    <span className="team-name">{team1.name}</span>
                  </div>
                ) : (
                  <div className="empty-selection">
                    <span>Select first team</span>
                  </div>
                )}
              </div>
              <div className="school-grid">
                {availableSchools.map((school) => (
                  <div
                    key={`team1-${school.name}`}
                    className={`school-card ${
                      isSchoolDisabled(school) ? "disabled" : ""
                    } ${isSchoolSelected(school) ? "unavailable" : ""} ${
                      team1?.name === school.name ? "selected" : ""
                    }`}
                    onClick={() => handleSchoolSelect(school, "team1")}
                  >
                    <img src={school.logo} alt={school.name} className="school-logo" />
                    <span className="school-name">{school.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="center-section">
              {/* Gender Toggle */}
              <div className="gender-toggle">
                <button
                  className={`toggle-btn ${selectedGender === "men" ? "active" : ""}`}
                  onClick={() => {
                    setSelectedGender("men");
                    resetSelection();
                  }}
                >
                  Men's
                </button>
                <button
                  className={`toggle-btn ${selectedGender === "women" ? "active" : ""}`}
                  onClick={() => {
                    setSelectedGender("women");
                    resetSelection();
                  }}
                >
                  Women's
                </button>
              </div>
              
              <div className="vs-divider">
                <span className="vs-text">VS</span>
              </div>
            </div>

            <div className="team-column">
              <div className="column-header">
                <h3 className="column-title">Second Team</h3>
              </div>
              <div className="selected-team">
                {team2 ? (
                  <div className="team-card selected">
                    <img src={team2.logo} alt={team2.name} className="team-logo" />
                    <span className="team-name">{team2.name}</span>
                  </div>
                ) : (
                  <div className="empty-selection">
                    <span>Select second team</span>
                  </div>
                )}
              </div>
              <div className="school-grid">
                {availableSchools.map((school) => (
                  <div
                    key={`team2-${school.name}`}
                    className={`school-card ${
                      isSchoolDisabled(school) ? "disabled" : ""
                    } ${isSchoolSelected(school) ? "unavailable" : ""} ${
                      team2?.name === school.name ? "selected" : ""
                    }`}
                    onClick={() => handleSchoolSelect(school, "team2")}
                  >
                    <img src={school.logo} alt={school.name} className="school-logo" />
                    <span className="school-name">{school.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-section">
            {team1 && team2 && (
              <button className="go-button primary" onClick={handleGo}>
                View Match Results
              </button>
            )}
            <button 
              className="view-all-button secondary" 
              onClick={() => navigate("/all-matches")}
            >
              View All Matches
            </button>
            {(team1 || team2) && (
              <button className="reset-button" onClick={resetSelection}>
                Reset Selection
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SchoolSelector; 