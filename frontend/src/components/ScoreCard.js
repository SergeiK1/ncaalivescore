import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/ScoreCard.css";

const ScoreCard = ({ match }) => {
  const navigate = useNavigate();

  return (
    <div className="score-card" onClick={() => navigate(`/match/${match.id}`)}>
      <div className="team">
        <img src={match.team1Logo} alt={match.team1} />
        <p>{match.team1}</p>
      </div>
      <p className="vs">VS</p>
      <div className="team">
        <img src={match.team2Logo} alt={match.team2} />
        <p>{match.team2}</p>
      </div>
      <p className="score">
        {match.team1Score} - {match.team2Score}
      </p>
    </div>
  );
};

export default ScoreCard;
