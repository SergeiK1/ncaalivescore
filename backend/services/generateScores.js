require("dotenv").config();
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const privateKey = process.env.GOOGLE_SHEETS_API_KEY;
const clientEmail = process.env.CLIENT_EMAIL;
const googleSheetId = "172wk5CjEiJAvnpMS9uv2i-EZtRrAh0BUHb5hmQED2-c";

// Authenticate the service account
const googleAuth = new google.auth.JWT(
  clientEmail,
  null,
  privateKey.replace(/\\n/g, "\n"),
  ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"]
);

// Define tabs and their ranges
const schoolTabs = {
  Princeton: "Princeton!A3:F8",
  Columbia: "Columbia!A3:F8",
  Harvard: "Harvard!A3:F8",
  Yale: "Yale!A3:F8",
  UPenn: "UPenn!A3:F8",
  Cornell: "Cornell!A3:C8", // Women-only
  Brown: "Brown!A3:C8", // Women-only
};

// Store the current watch channel ID
let currentChannelId = null;

// Function to fetch data from a specific sheet tab
async function fetchSheetData(sheetTab) {
  const sheets = google.sheets({ version: "v4", auth: googleAuth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: googleSheetId,
    range: sheetTab,
  });
  return response.data.values || [];
}

// Function to stop existing watch
async function stopWatch() {
  if (currentChannelId) {
    try {
      const drive = google.drive({ version: 'v3', auth: googleAuth });
      await drive.channels.stop({
        requestBody: {
          id: currentChannelId,
          resourceId: googleSheetId
        }
      });
      console.log(`Stopped watch channel: ${currentChannelId}`);
    } catch (error) {
      console.log(`Could not stop watch channel ${currentChannelId}:`, error.message);
    }
    currentChannelId = null;
  }
}

// Function to watch for changes in the spreadsheet
async function watchSpreadsheet() {
  try {
    const drive = google.drive({ version: 'v3', auth: googleAuth });
    
    if (!process.env.WEBHOOK_URL) {
      console.log('Webhook URL not configured - skipping watch setup');
      console.log('Add WEBHOOK_URL environment variable for real-time updates');
      return;
    }

    // Stop existing watch if any
    await stopWatch();
    
    // Generate new channel ID
    const channelId = `ncaa-scores-${Date.now()}`;
    
    console.log(`Setting up webhook for: ${process.env.WEBHOOK_URL}`);
    console.log(`Channel ID: ${channelId}`);
    
    // Set up push notifications
    const response = await drive.files.watch({
      fileId: googleSheetId,
      requestBody: {
        id: channelId,
        type: 'web_hook',
        address: process.env.WEBHOOK_URL,
        expiration: Date.now() + 604800000, // 7 days from now
      },
    });

    currentChannelId = channelId;
    console.log('✅ Webhook setup successful!');
    console.log('📊 Real-time updates are now active');
    console.log('Watch response:', response.data);
    
    // Renew the watch request before it expires (every 6 days)
    setTimeout(watchSpreadsheet, 518400000); // 6 days in milliseconds
    
  } catch (error) {
    console.error('❌ Error setting up webhook:', error.message);
    
    if (error.message.includes('insufficient permissions')) {
      console.log('💡 Solution: Make sure your service account has "Editor" access to the Google Sheet');
    }
    
    if (error.message.includes('domain')) {
      console.log('💡 Solution: Add your domain to Google Cloud Console authorized domains');
    }
    
    console.log('⏰ Falling back to 1-minute polling only');
    // Retry after 5 minutes if failed
    setTimeout(watchSpreadsheet, 300000);
  }
}

// Function to generate scores
async function generateScores() {
  try {
    console.log('🔄 Updating scores from Google Sheets...');
    
    const scores = { men: [], women: [] };
    const matchups = new Map(); // Track processed matchups

    for (const [school, range] of Object.entries(schoolTabs)) {
      const sheetData = await fetchSheetData(range);

      sheetData.forEach((row) => {
        const [opponent, womenScoreSelf, womenScoreOpponent, menOpponent, menScoreSelf, menScoreOpponent] = row;

        // Women
        if (womenScoreSelf !== undefined && womenScoreOpponent !== undefined) {
          const matchupKey = `women:${school}-${opponent}`;
          const reverseMatchupKey = `women:${opponent}-${school}`;

          if (matchups.has(reverseMatchupKey)) {
            const existingMatchup = matchups.get(reverseMatchupKey);
            if (
              existingMatchup.score1 !== parseInt(womenScoreOpponent) ||
              existingMatchup.score2 !== parseInt(womenScoreSelf)
            ) {
              console.error(
                `Score mismatch for matchup ${school} vs ${opponent} in women: ${existingMatchup.score1}-${existingMatchup.score2} vs ${womenScoreSelf}-${womenScoreOpponent}`
              );
              return; // Skip this record
            }
          } else {
            matchups.set(matchupKey, {
              team1: school,
              team2: opponent,
              score1: parseInt(womenScoreSelf),
              score2: parseInt(womenScoreOpponent),
            });
            scores.women.push({
              team1: school,
              team2: opponent,
              score1: parseInt(womenScoreSelf),
              score2: parseInt(womenScoreOpponent),
            });
          }
        }

        // Men
        if (menScoreSelf !== undefined && menScoreOpponent !== undefined) {
          const matchupKey = `men:${school}-${menOpponent}`;
          const reverseMatchupKey = `men:${menOpponent}-${school}`;

          if (matchups.has(reverseMatchupKey)) {
            const existingMatchup = matchups.get(reverseMatchupKey);
            if (
              existingMatchup.score1 !== parseInt(menScoreOpponent) ||
              existingMatchup.score2 !== parseInt(menScoreSelf)
            ) {
              console.error(
                `Score mismatch for matchup ${school} vs ${menOpponent} in men: ${existingMatchup.score1}-${existingMatchup.score2} vs ${menScoreSelf}-${menScoreOpponent}`
              );
              return; // Skip this record
            }
          } else {
            matchups.set(matchupKey, {
              team1: school,
              team2: menOpponent,
              score1: parseInt(menScoreSelf),
              score2: parseInt(menScoreOpponent),
            });
            scores.men.push({
              team1: school,
              team2: menOpponent,
              score1: parseInt(menScoreSelf),
              score2: parseInt(menScoreOpponent),
            });
          }
        }
      });
    }

    // Save scores to a file
    const outputPath = path.join(__dirname, "../data/scores.json");
    fs.writeFileSync(outputPath, JSON.stringify(scores, null, 2), "utf-8");
    console.log("✅ Scores updated successfully!");
    console.log(`📈 Men's matches: ${scores.men.length}, Women's matches: ${scores.women.length}`);
    
    return scores;
  } catch (error) {
    console.error("❌ Error generating scores:", error.message);
    throw error;
  }
}

module.exports = {
  generateScores,
  watchSpreadsheet,
  stopWatch
};
