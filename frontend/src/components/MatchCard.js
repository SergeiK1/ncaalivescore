import React from "react";
import "../css/MatchCard.css";

const MatchCard = ({ team1, score1, team2, score2 }) => {
  const logoBaseURL = "http://localhost:5000/assets/logos";

  // Construct URLs for team logos
  const logo1 = `${logoBaseURL}/${team1}.png`;
  const logo2 = `${logoBaseURL}/${team2}.png`;

  return (
    <div className="match-card">
      {/* Team 1 Section */}
      <div className="score-container">
        <div className="team">
          {team1 && (
            <img
              src={logo1}
              alt={`${team1} logo`}
              className="team-logo"
              onError={(e) => (e.target.style.display = "none")} // Hide image if it doesn't exist
            />
          )}
          <span className="team-name">{team1}</span>
        </div>
        <span className="team-score">{score1}</span>
      </div>

      {/* VS Section */}
      <div className="vs">
        <span>VS</span>
      </div>

      {/* Team 2 Section */}
      <div className="score-container">
        <span className="team-score">{score2}</span>
        <div className="team">
          {team2 && (
            <img
              src={logo2}
              alt={`${team2} logo`}
              className="team-logo"
              onError={(e) => (e.target.style.display = "none")} // Hide image if it doesn't exist
            />
          )}
          <span className="team-name">{team2}</span>
        </div>
      </div>
    </div>
  );
};

export default MatchCard;
