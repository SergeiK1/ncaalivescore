import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { fetchMatchups } from "../utils/api";
import "../css/MatchResults.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const MatchResults = () => {
  const { gender, team1, team2 } = useParams();
  const navigate = useNavigate();
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [serverTime, setServerTime] = useState(null);

  // School colors for backgrounds
  const schoolColors = {
    Princeton: { primary: '#FF8F00', secondary: '#000000', bg: 'rgba(255, 143, 0, 0.15)', glow: '#FF8F00' },
    Harvard: { primary: '#A51C30', secondary: '#FFFFFF', bg: 'rgba(165, 28, 48, 0.15)', glow: '#A51C30' },
    Yale: { primary: '#00356B', secondary: '#FFFFFF', bg: 'rgba(0, 53, 107, 0.15)', glow: '#00356B' },
    Columbia: { primary: '#B9D9EB', secondary: '#002B7F', bg: 'rgba(0, 43, 127, 0.15)', glow: '#002B7F' },
    UPenn: { primary: '#011F5B', secondary: '#990000', bg: 'rgba(1, 31, 91, 0.15)', glow: '#011F5B' },
    Cornell: { primary: '#B31B1B', secondary: '#FFFFFF', bg: 'rgba(179, 27, 27, 0.15)', glow: '#B31B1B' },
    Brown: { primary: '#8B4513', secondary: '#FFFFFF', bg: 'rgba(139, 69, 19, 0.15)', glow: '#8B4513' }
  };

  const getMatchData = useCallback(async () => {
    const findMatchData = (data) => {
      const matches = gender === "men" ? data.men : data.women;
      
      let match = matches.find(
        (m) => 
          (m.team1 === team1 && m.team2 === team2) ||
          (m.team1 === team2 && m.team2 === team1)
      );

      if (match) {
        if (match.team1 === team2 && match.team2 === team1) {
          match = {
            ...match,
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
      
      // Add simulated breakdown data (can be replaced with real data later)
      if (match) {
        match.breakdown1 = {
          epee: Math.floor(match.score1 * 0.33),
          foil: Math.floor(match.score1 * 0.33),
          saber: match.score1 - Math.floor(match.score1 * 0.66)
        };
        match.breakdown2 = {
          epee: Math.floor(match.score2 * 0.33),
          foil: Math.floor(match.score2 * 0.33),
          saber: match.score2 - Math.floor(match.score2 * 0.66)
        };
      }
      
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
    const interval = setInterval(getMatchData, 30000);
    return () => clearInterval(interval);
  }, [getMatchData]);

  const handleBackToSelection = () => {
    navigate("/");
  };

  const getProgressPercentage = (score) => {
    return Math.min((score / 14) * 100, 100);
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

  const hasActualWinner = () => {
    if (!matchData) return { team1: false, team2: false };
    return {
      team1: matchData.score1 >= 14,
      team2: matchData.score2 >= 14
    };
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="grand-match-display">
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
        <Header />
        <div className="grand-match-display">
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

  const winnerStatus = getWinnerStatus();
  const actualWinners = hasActualWinner();
  const team1Colors = schoolColors[matchData.team1] || schoolColors.Princeton;
  const team2Colors = schoolColors[matchData.team2] || schoolColors.Princeton;

  return (
    <>
      <Header />
      <div className="grand-match-display">
        <button onClick={handleBackToSelection} className="floating-back-button">
          ← Back
        </button>

        <div className="unified-match-layout">
          <div className="match-header">
            <div className="match-title">
              {gender.charAt(0).toUpperCase() + gender.slice(1)}'s Fencing Championship
            </div>
            {matchData.hasMismatch && (
              <div className="mismatch-warning">
                Score Discrepancy Detected
              </div>
            )}
          </div>

          <div className="teams-comparison">
            {/* Team 1 */}
            <div 
              className={`team-display ${winnerStatus === "team1" ? "winner-glow" : ""}`}
              style={{ 
                backgroundColor: team1Colors.bg,
                '--glow-color': team1Colors.glow
              }}
            >
              <div className="team-info">
                <img 
                  src={`${API_URL}/assets/logos/${matchData.team1}.png`} 
                  alt={`${matchData.team1} logo`}
                  className="team-logo"
                />
                <h1 className="team-name">{matchData.team1}</h1>
              </div>
              
              <div className="score-display">
                <div className="score-container">
                  <div className="main-score">{matchData.score1}</div>
                  {actualWinners.team1 && (
                    <div className="winner-badge">WINS!</div>
                  )}
                </div>
                <div className="progress-container">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${getProgressPercentage(matchData.score1)}%`,
                        backgroundColor: team1Colors.primary
                      }}
                    ></div>
                  </div>
                  <div className="progress-text">{Math.min(matchData.score1, 14)}/14</div>
                </div>
              </div>

              <div className="weapon-breakdown">
                <div className="breakdown-title">Score Breakdown</div>
                <div className="weapon-scores">
                  <div className="weapon-row">
                    <span className="weapon">Epee</span>
                    <span className="points">{matchData.breakdown1?.epee || 0}</span>
                  </div>
                  <div className="weapon-row">
                    <span className="weapon">Foil</span>
                    <span className="points">{matchData.breakdown1?.foil || 0}</span>
                  </div>
                  <div className="weapon-row">
                    <span className="weapon">Saber</span>
                    <span className="points">{matchData.breakdown1?.saber || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="vs-section">
              <div className="vs-text">VS</div>
              {winnerStatus === "tie" && (
                <div className="tie-announcement">TIE GAME</div>
              )}
            </div>

            {/* Team 2 */}
            <div 
              className={`team-display ${winnerStatus === "team2" ? "winner-glow" : ""}`}
              style={{ 
                backgroundColor: team2Colors.bg,
                '--glow-color': team2Colors.glow
              }}
            >
              <div className="team-info">
                <img 
                  src={`${API_URL}/assets/logos/${matchData.team2}.png`} 
                  alt={`${matchData.team2} logo`}
                  className="team-logo"
                />
                <h1 className="team-name">{matchData.team2}</h1>
              </div>
              
              <div className="score-display">
                <div className="score-container">
                  <div className="main-score">{matchData.score2}</div>
                  {actualWinners.team2 && (
                    <div className="winner-badge">WINS!</div>
                  )}
                </div>
                <div className="progress-container">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${getProgressPercentage(matchData.score2)}%`,
                        backgroundColor: team2Colors.primary
                      }}
                    ></div>
                  </div>
                  <div className="progress-text">{Math.min(matchData.score2, 14)}/14</div>
                </div>
              </div>

              <div className="weapon-breakdown">
                <div className="breakdown-title">Score Breakdown</div>
                <div className="weapon-scores">
                  <div className="weapon-row">
                    <span className="weapon">Epee</span>
                    <span className="points">{matchData.breakdown2?.epee || 0}</span>
                  </div>
                  <div className="weapon-row">
                    <span className="weapon">Foil</span>
                    <span className="points">{matchData.breakdown2?.foil || 0}</span>
                  </div>
                  <div className="weapon-row">
                    <span className="weapon">Saber</span>
                    <span className="points">{matchData.breakdown2?.saber || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="match-footer">
          <div className="update-info">
            {lastUpdated && (
              <span>Last Updated: {lastUpdated}</span>
            )}
            {serverTime && (
              <span> | Server: {serverTime}</span>
            )}
            <span> | Auto-refresh: 30s</span>
          </div>
        </footer>
      </div>
    </>
  );
};

export default MatchResults; 