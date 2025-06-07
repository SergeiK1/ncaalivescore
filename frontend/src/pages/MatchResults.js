import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { fetchMatchups } from "../utils/api";
import "../css/MatchResults.css";

const MatchResults = () => {
  const { gender, team1, team2 } = useParams();
  const navigate = useNavigate();
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [serverTime, setServerTime] = useState(null);

  // School colors for backgrounds
  const schoolColors = {
    Princeton: { primary: '#FF8F00', secondary: '#000000', bg: 'rgba(255, 143, 0, 0.05)' },
    Harvard: { primary: '#A51C30', secondary: '#FFFFFF', bg: 'rgba(165, 28, 48, 0.05)' },
    Yale: { primary: '#00356B', secondary: '#FFFFFF', bg: 'rgba(0, 53, 107, 0.05)' },
    Columbia: { primary: '#B9D9EB', secondary: '#002B7F', bg: 'rgba(0, 43, 127, 0.05)' },
    UPenn: { primary: '#011F5B', secondary: '#990000', bg: 'rgba(1, 31, 91, 0.05)' },
    Cornell: { primary: '#B31B1B', secondary: '#FFFFFF', bg: 'rgba(179, 27, 27, 0.05)' },
    Brown: { primary: '#8B4513', secondary: '#FFFFFF', bg: 'rgba(139, 69, 19, 0.05)' }
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
  const team1Colors = schoolColors[matchData.team1] || schoolColors.Princeton;
  const team2Colors = schoolColors[matchData.team2] || schoolColors.Princeton;

  return (
    <>
      <Header />
      <div className="grand-match-display">
        <button onClick={handleBackToSelection} className="floating-back-button">
          ← Back
        </button>

        <div className="match-container">
          {/* Team 1 Section */}
          <div 
            className="team-section team-left"
            style={{ backgroundColor: team1Colors.bg }}
          >
            <div className="team-header">
              <img 
                src={`/assets/logos/${matchData.team1}.png`} 
                alt={`${matchData.team1} logo`}
                className="team-logo-large"
              />
              <h1 className="team-name-large">{matchData.team1}</h1>
            </div>
            
            <div className="score-section">
              <div className="aggregate-score">{matchData.score1}</div>
              
              <div className="progress-bar-container">
                <div className="progress-label">Progress to Victory</div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill team1-fill"
                    style={{ 
                      width: `${getProgressPercentage(matchData.score1)}%`,
                      backgroundColor: team1Colors.primary
                    }}
                  ></div>
                  <div className="progress-text">{Math.min(matchData.score1, 14)}/14</div>
                </div>
              </div>
              
              <div className="score-breakdown">
                <h3>Score Breakdown</h3>
                <div className="weapon-scores">
                  <div className="weapon-score">
                    <span className="weapon-name">⚔️ Epee</span>
                    <span className="weapon-points">{matchData.breakdown1?.epee || 0}</span>
                  </div>
                  <div className="weapon-score">
                    <span className="weapon-name">🗡️ Foil</span>
                    <span className="weapon-points">{matchData.breakdown1?.foil || 0}</span>
                  </div>
                  <div className="weapon-score">
                    <span className="weapon-name">⚔️ Saber</span>
                    <span className="weapon-points">{matchData.breakdown1?.saber || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* VS Section */}
          <div className="vs-section">
            <div className="vs-content">
              <div className="match-title">
                {gender.charAt(0).toUpperCase() + gender.slice(1)}'s Fencing
              </div>
              <div className="vs-text">VS</div>
              {winnerStatus !== "upcoming" && (
                <div className="winner-badge">
                  {winnerStatus === "tie" ? (
                    <span>🤝 Tie Game!</span>
                  ) : (
                    <span>🏆 {winnerStatus === "team1" ? matchData.team1 : matchData.team2} Wins!</span>
                  )}
                </div>
              )}
              {matchData.hasMismatch && (
                <div className="mismatch-badge">
                  ⚠️ Score Discrepancy
                </div>
              )}
            </div>
          </div>

          {/* Team 2 Section */}
          <div 
            className="team-section team-right"
            style={{ backgroundColor: team2Colors.bg }}
          >
            <div className="team-header">
              <img 
                src={`/assets/logos/${matchData.team2}.png`} 
                alt={`${matchData.team2} logo`}
                className="team-logo-large"
              />
              <h1 className="team-name-large">{matchData.team2}</h1>
            </div>
            
            <div className="score-section">
              <div className="aggregate-score">{matchData.score2}</div>
              
              <div className="progress-bar-container">
                <div className="progress-label">Progress to Victory</div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill team2-fill"
                    style={{ 
                      width: `${getProgressPercentage(matchData.score2)}%`,
                      backgroundColor: team2Colors.primary
                    }}
                  ></div>
                  <div className="progress-text">{Math.min(matchData.score2, 14)}/14</div>
                </div>
              </div>
              
              <div className="score-breakdown">
                <h3>Score Breakdown</h3>
                <div className="weapon-scores">
                  <div className="weapon-score">
                    <span className="weapon-name">⚔️ Epee</span>
                    <span className="weapon-points">{matchData.breakdown2?.epee || 0}</span>
                  </div>
                  <div className="weapon-score">
                    <span className="weapon-name">🗡️ Foil</span>
                    <span className="weapon-points">{matchData.breakdown2?.foil || 0}</span>
                  </div>
                  <div className="weapon-score">
                    <span className="weapon-name">⚔️ Saber</span>
                    <span className="weapon-points">{matchData.breakdown2?.saber || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="match-footer">
          <div className="update-info">
            {lastUpdated && (
              <span className="update-time">
                Last Updated: {lastUpdated}
              </span>
            )}
            {serverTime && (
              <span className="server-time">
                | Server Data: {serverTime}
              </span>
            )}
            <span className="auto-refresh">| Auto-refresh: 30s</span>
          </div>
        </footer>
      </div>
    </>
  );
};

export default MatchResults; 