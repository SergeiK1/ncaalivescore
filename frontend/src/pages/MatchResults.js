import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import MatchCard from "../components/MatchCard";
import { fetchMatchups } from "../utils/api";
import "../css/MatchResults.css";

const MatchResults = () => {
  const { gender, team1, team2 } = useParams();
  const navigate = useNavigate();
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [serverTime, setServerTime] = useState(null);

  const getMatchData = useCallback(async () => {
    const findMatchData = (data) => {
      const matches = gender === "men" ? data.men : data.women;
      
      // Look for the match in both directions (team1 vs team2 or team2 vs team1)
      let match = matches.find(
        (m) => 
          (m.team1 === team1 && m.team2 === team2) ||
          (m.team1 === team2 && m.team2 === team1)
      );

      if (match) {
        // Ensure the match is in the correct order (team1 vs team2)
        if (match.team1 === team2 && match.team2 === team1) {
          match = {
            team1: match.team2,
            team2: match.team1,
            score1: match.score2,
            score2: match.score1
          };
        }
      }

      return match;
    };

    try {
      const data = await fetchMatchups();
      const match = findMatchData(data);
      setMatchData(match);
      setLastUpdated(new Date().toLocaleTimeString());
      setServerTime(data.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString() : null);
    } catch (error) {
      console.error("Error fetching match data:", error);
    } finally {
      setLoading(false);
    }
  }, [gender, team1, team2]);

  useEffect(() => {
    getMatchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(getMatchData, 30000);
    
    return () => clearInterval(interval);
  }, [getMatchData]);

  const handleBackToSelection = () => {
    navigate("/");
  };

  const getWinnerStatus = () => {
    if (!matchData || (matchData.score1 === 0 && matchData.score2 === 0)) {
      return "upcoming";
    }
    if (matchData.score1 > matchData.score2) {
      return "team1";
    } else if (matchData.score2 > matchData.score1) {
      return "team2";
    }
    return "tie";
  };

  const winnerStatus = getWinnerStatus();

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="match-results">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading match data...</p>
          </div>
        </div>
      </>
    );
  }

  if (!matchData) {
    return (
      <>
        <Navbar />
        <div className="match-results">
          <div className="error-container">
            <h2>Match Not Found</h2>
            <p>No data found for {team1} vs {team2} in {gender}'s fencing.</p>
            <button onClick={handleBackToSelection} className="back-button">
              ← Select Different Teams
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="match-results">
        <div className="results-container">
          <div className="header-section">
            <button onClick={handleBackToSelection} className="back-button">
              ← Select Different Teams
            </button>
            <h1 className="match-title">
              {gender.charAt(0).toUpperCase() + gender.slice(1)}'s Fencing
            </h1>
          </div>

          <div className="match-display">
            <div className="match-card-container">
              <MatchCard
                team1={matchData.team1}
                score1={matchData.score1}
                team2={matchData.team2}
                score2={matchData.score2}
                logo1={`/assets/logos/${matchData.team1}.png`}
                logo2={`/assets/logos/${matchData.team2}.png`}
              />
            </div>

            {winnerStatus !== "upcoming" && (
              <div className="match-status">
                {winnerStatus === "tie" ? (
                  <div className="status-badge tie">
                    <span className="status-icon">🤝</span>
                    <span>It's a Tie!</span>
                  </div>
                ) : (
                  <div className="status-badge winner">
                    <span className="status-icon">🏆</span>
                    <span>
                      {winnerStatus === "team1" ? matchData.team1 : matchData.team2} Wins!
                    </span>
                  </div>
                )}
              </div>
            )}

            {winnerStatus === "upcoming" && (
              <div className="match-status">
                <div className="status-badge upcoming">
                  <span className="status-icon">⏳</span>
                  <span>Match Not Yet Played</span>
                </div>
              </div>
            )}
          </div>

          <div className="update-info">
            <div className="time-info">
              {lastUpdated && (
                <div className="time-display">
                  <span className="label">Last Updated:</span>
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
        </div>
      </div>
    </>
  );
};

export default MatchResults; 