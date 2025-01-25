import React from "react";
import { useParams } from "react-router-dom";
import { menMatches, womenMatches } from "../utils/data";
import "../css/MatchPage.css";

const MatchPage = () => {
  const { id } = useParams();
  const allMatches = [...menMatches, ...womenMatches];
  const match = allMatches.find((m) => m.id === parseInt(id));

  if (!match) {
    return <p>Match not found!</p>;
  }

  return (
    <div className="match-page">
      <h1 className="match-title">
        {match.team1} vs {match.team2}
      </h1>
      <p className="match-score">
        Score: {match.team1Score} - {match.team2Score}
      </p>
    </div>
  );
};

export default MatchPage;
