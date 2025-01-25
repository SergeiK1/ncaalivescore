import React from "react";
import ScoreCard from "./ScoreCard";
import "../css/ResponsiveGrid.css";

const ResponsiveGrid = ({ title, matches }) => {
  return (
    <div className="grid">
      <h2>{title}</h2>
      <div className="cards">
        {matches.map((match) => (
          <ScoreCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
};

export default ResponsiveGrid;
