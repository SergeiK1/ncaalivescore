import React, { useEffect, useState } from "react";
import MatchCard from "../components/MatchCard";
import SectionTitle from "../components/SectionTitle";
import Navbar from "../components/Navbar";
import { fetchMatchups } from "../utils/api";
import "../css/HomePage.css";

const HomePage = () => {
  const [menMatches, setMenMatches] = useState([]);
  const [womenMatches, setWomenMatches] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [serverTime, setServerTime] = useState(null);

  const getMatchups = async () => {
    try {
      const data = await fetchMatchups();
      setMenMatches(data.men || []);
      setWomenMatches(data.women || []);
      setLastUpdated(new Date().toLocaleTimeString());
      setServerTime(data.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString() : null);
    } catch (error) {
      console.error("Error fetching matchups:", error);
    }
  };

  useEffect(() => {
    getMatchups();
    
    // Auto-refresh every 30 seconds to stay within API limits
    const interval = setInterval(getMatchups, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Navbar />
      <div className="homepage">
        <div className="refresh-section">
          <div className="time-info">
            {lastUpdated && (
              <div className="time-display">
                <span className="label">Frontend Updated:</span>
                <span className="time">{lastUpdated}</span>
              </div>
            )}
            {serverTime && (
              <div className="time-display">
                <span className="label">Server Data From:</span>
                <span className="time">{serverTime}</span>
              </div>
            )}
            <div className="auto-refresh-info">
              Auto-refresh every 30 seconds
            </div>
          </div>
        </div>
        
        <div className="columns-container">
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
      </div>
    </>
  );
};

export default HomePage;
