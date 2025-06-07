require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { generateScores, watchSpreadsheet } = require("./services/generateScores");

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'https://ivyfencing.com',
  'https://www.ivyfencing.com',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Serve static files for logos
app.use("/assets", express.static(path.join(__dirname, "assets")));

// Routes
const scoresRoute = require("./routes/scores");
app.use("/api/scores", scoresRoute);

// Webhook endpoint for Google Sheets notifications
app.post("/api/webhook", async (req, res) => {
  console.log("Received webhook notification from Google Sheets");
  try {
    await generateScores();
    res.status(200).send("Scores updated successfully");
  } catch (error) {
    console.error("Error updating scores:", error);
    res.status(500).send("Error updating scores");
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Run generateScores.js before starting the server
generateScores().catch((error) => {
  console.error("Error generating initial scores:", error);
});

// Set up Google Sheets watch
watchSpreadsheet().catch((error) => {
  console.error("Error setting up watch:", error);
});

// Schedule generateScores.js to run every 5 minutes as backup
setInterval(() => {
  generateScores().catch((error) => {
    console.error("Error in scheduled score update:", error);
  });
}, 300000); // 5 minutes in milliseconds

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Logos are served at /assets/logos/`);
});
