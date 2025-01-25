import React, { useEffect, useState } from "react";
import MatchCard from "../components/MatchCard";
import SectionTitle from "../components/SectionTitle";
import Navbar from "../components/Navbar";
import { fetchMatchups } from "../utils/api";
import "../css/HomePage.css";

const HomePage = () => {
  const [menMatches, setMenMatches] = useState([]);
  const [womenMatches, setWomenMatches] = useState([]);

  useEffect(() => {
    const getMatchups = async () => {
      const data = await fetchMatchups();
      setMenMatches(data.men || []);
      setWomenMatches(data.women || []);
    };

    getMatchups();
  }, []);

  return (
    <>
      <Navbar />
      <div className="homepage">
        <div className="column">
          <SectionTitle title="Men" />
          {menMatches.map((match, index) => (
            <MatchCard
              key={index}
              team1={match.team1}
              score1={match.score1}
              team2={match.team2}
              score2={match.score2}
              logo1={`/assets/logos/${match.team1}.png`}
              logo2={`/assets/logos/${match.team2}.png`}
            />
          ))}
        </div>
        <div className="column">
          <SectionTitle title="Women" />
          {womenMatches.map((match, index) => (
            <MatchCard
              key={index}
              team1={match.team1}
              score1={match.score1}
              team2={match.team2}
              score2={match.score2}
              logo1={`/assets/logos/${match.team1}.png`}
              logo2={`/assets/logos/${match.team2}.png`}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default HomePage;
