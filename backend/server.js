const express = require("express");
const cors = require("cors");
const path = require("path");
const { exec } = require("child_process"); // For running external scripts
const scoresRoute = require("./routes/scores");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files for logos
app.use("/assets", express.static(path.join(__dirname, "assets")));

// Function to run generateScores.js
const runGenerateScores = () => {
  console.log("Running generateScores.js...");
  exec("node ./services/generateScores.js", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error running generateScores.js: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(stdout); // Log output from generateScores.js
  });
};

// Run generateScores.js before starting the server
runGenerateScores();

// Schedule generateScores.js to run every minute
setInterval(() => {
  runGenerateScores();
}, 6000); // 60,000ms = 1 minute

// Routes
app.use("/api/scores", scoresRoute);

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log("Logos are served at http://localhost:5000/assets/logos/");
});
