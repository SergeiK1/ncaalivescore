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
    const rawMatches = { men: [], women: [] }; // Store all raw matches first
    
    // First pass: collect all matches from all schools
    for (const [school, range] of Object.entries(schoolTabs)) {
      const sheetData = await fetchSheetData(range);

      sheetData.forEach((row) => {
        const [opponent, womenScoreSelf, womenScoreOpponent, menOpponent, menScoreSelf, menScoreOpponent] = row;

        // Women's matches
        if (womenScoreSelf !== undefined && womenScoreOpponent !== undefined && opponent) {
          rawMatches.women.push({
            reportingTeam: school,
            opponent: opponent,
            selfScore: parseInt(womenScoreSelf) || 0,
            opponentScore: parseInt(womenScoreOpponent) || 0
          });
        }

        // Men's matches  
        if (menScoreSelf !== undefined && menScoreOpponent !== undefined && menOpponent) {
          rawMatches.men.push({
            reportingTeam: school,
            opponent: menOpponent,
            selfScore: parseInt(menScoreSelf) || 0,
            opponentScore: parseInt(menScoreOpponent) || 0
          });
        }
      });
    }

    // Second pass: validate matches and create final scores
    const processedMatches = new Set();

    ['men', 'women'].forEach(gender => {
      rawMatches[gender].forEach(match => {
        const matchKey = [match.reportingTeam, match.opponent].sort().join('-');
        
        if (processedMatches.has(`${gender}-${matchKey}`)) {
          return; // Already processed this matchup
        }

        // Find the corresponding match from the opponent's perspective
        const counterMatch = rawMatches[gender].find(m => 
          m.reportingTeam === match.opponent && m.opponent === match.reportingTeam
        );

        let finalMatch = {
          team1: match.reportingTeam,
          team2: match.opponent,
          score1: match.selfScore,
          score2: match.opponentScore,
          hasMismatch: false
        };

        if (counterMatch) {
          // Check if scores align (match.selfScore should equal counterMatch.opponentScore)
          const scoresAlign = (
            match.selfScore === counterMatch.opponentScore &&
            match.opponentScore === counterMatch.selfScore
          );

          if (!scoresAlign) {
            console.warn(
              `⚠️ Score mismatch in ${gender}: ${match.reportingTeam} reports ${match.selfScore}-${match.opponentScore} vs ${match.opponent}, but ${match.opponent} reports ${counterMatch.selfScore}-${counterMatch.opponentScore} vs ${match.reportingTeam}`
            );
            finalMatch.hasMismatch = true;
            
            // Use the match from alphabetically first team as primary source
            if (match.opponent < match.reportingTeam) {
              finalMatch = {
                team1: counterMatch.reportingTeam,
                team2: counterMatch.opponent,
                score1: counterMatch.selfScore,
                score2: counterMatch.opponentScore,
                hasMismatch: true
              };
            }
          }
        } else {
          // Only one team reported this match
          console.log(`ℹ️ Only ${match.reportingTeam} reported match vs ${match.opponent} in ${gender}`);
        }

        scores[gender].push(finalMatch);
        processedMatches.add(`${gender}-${matchKey}`);
      });
    });

    // Save scores to a file
    const outputPath = path.join(__dirname, "../data/scores.json");
    fs.writeFileSync(outputPath, JSON.stringify(scores, null, 2), "utf-8");
    console.log("✅ Scores updated successfully!");
    console.log(`📈 Men's matches: ${scores.men.length}, Women's matches: ${scores.women.length}`);
    
    // Log any mismatches found
    const menMismatches = scores.men.filter(m => m.hasMismatch).length;
    const womenMismatches = scores.women.filter(m => m.hasMismatch).length;
    if (menMismatches > 0 || womenMismatches > 0) {
      console.log(`⚠️ Mismatches detected - Men: ${menMismatches}, Women: ${womenMismatches}`);
    }
    
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
