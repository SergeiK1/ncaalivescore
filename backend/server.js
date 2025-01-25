const express = require("express");
const cors = require("cors");
const path = require("path");
const scoresRoute = require("./routes/scores");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files for logos
app.use("/assets", express.static(path.join(__dirname, "assets")));

// Routes
app.use("/api/scores", scoresRoute);

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log("Logos are served at http://localhost:5000/assets/logos/");
});
