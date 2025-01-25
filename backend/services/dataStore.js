const schoolData = [
    {
      id: 1,
      name: "Princeton",
      logo: "/logos/Princeton.png",
    },
    {
      id: 2,
      name: "Columbia",
      logo: "/logos/Columbia.png",
    },
    {
      id: 3,
      name: "Harvard",
      logo: "/logos/Harvard.png",
    },
  ];
  
  let scores = [];
  
  const updateScores = (newScores) => {
    scores = newScores.map((row) => ({
      team1: row[0],
      score1: row[1],
      team2: row[2],
      score2: row[3],
    }));
  };
  
  const getScores = () => scores;
  
  module.exports = { schoolData, updateScores, getScores };
  