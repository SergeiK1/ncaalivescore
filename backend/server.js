require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { generateScores, watchSpreadsheet } = require("./services/generateScores");
const fs = require("fs");

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

// Serve team logos
app.get('/api/logo/:team', (req, res) => {
  const { team } = req.params;
  const logoPath = path.join(__dirname, 'public', 'logos', `${team}.png`);
  
  // Check if logo file exists
  if (fs.existsSync(logoPath)) {
    res.sendFile(logoPath);
  } else {
    // Return a default/placeholder logo if specific logo doesn't exist
    const defaultLogoPath = path.join(__dirname, 'public', 'logos', 'default.png');
    if (fs.existsSync(defaultLogoPath)) {
      res.sendFile(defaultLogoPath);
    } else {
      res.status(404).json({ error: 'Logo not found' });
    }
  }
});

// Webhook endpoint for Google Sheets notifications
app.post("/api/webhook", async (req, res) => {
  console.log("🔔 Received webhook notification from Google Drive");
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  
  // Validate Google webhook
  const resourceState = req.headers['x-goog-resource-state'];
  const channelId = req.headers['x-goog-channel-id'];
  
  if (resourceState === 'sync') {
    console.log("📡 Webhook sync confirmation received");
    res.status(200).send("Webhook sync confirmed");
    return;
  }
  
  if (resourceState === 'update' || resourceState === 'exists') {
    console.log(`🔄 Google Sheets was updated! (State: ${resourceState})`);
    console.log(`📋 Channel ID: ${channelId}`);
    
    try {
      await generateScores();
      console.log("✅ Scores updated via webhook!");
      res.status(200).send("Scores updated successfully via webhook");
    } catch (error) {
      console.error("❌ Error updating scores via webhook:", error);
      res.status(500).send("Error updating scores");
    }
  } else {
    console.log(`ℹ️ Webhook received with state: ${resourceState}`);
    res.status(200).send("Webhook received");
  }
});

// Manual webhook trigger for testing
app.get("/api/webhook/test", async (req, res) => {
  console.log("🧪 Manual webhook test triggered");
  try {
    await generateScores();
    res.status(200).json({ 
      success: true, 
      message: "Manual update successful",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ Manual webhook test failed:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
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

// Schedule generateScores.js to run every 1 minute as backup
setInterval(() => {
  generateScores().catch((error) => {
    console.error("Error in scheduled score update:", error);
  });
}, 60000); // 1 minute in milliseconds

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Logos are served at /assets/logos/`);
});
