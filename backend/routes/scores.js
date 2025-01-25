const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// Serve the scores.json file
router.get("/", (req, res) => {
  const filePath = path.join(__dirname, "../data/scores.json");

  try {
    // Read and serve the JSON file
    const data = fs.readFileSync(filePath, "utf-8");
    const scores = JSON.parse(data);
    res.json(scores);
  } catch (error) {
    console.error("Error reading scores.json:", error);
    res.status(500).json({ error: "Failed to fetch scores" });
  }
});

module.exports = router;
