const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// Serve the scores.json file with no-cache headers
router.get("/", (req, res) => {
  const filePath = path.join(__dirname, "../data/scores.json");

  try {
    // Add headers to prevent caching
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Last-Modified': new Date().toUTCString(),
      'ETag': Date.now().toString()
    });

    // Read and serve the JSON file
    const data = fs.readFileSync(filePath, "utf-8");
    const scores = JSON.parse(data);
    
    // Add timestamp to response for debugging
    const response = {
      ...scores,
      lastUpdated: new Date().toISOString(),
      serverTime: Date.now()
    };
    
    res.json(response);
  } catch (error) {
    console.error("Error reading scores.json:", error);
    res.status(500).json({ error: "Failed to fetch scores" });
  }
});

module.exports = router;
