require("dotenv").config();
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const privateKey     = process.env.GOOGLE_SHEETS_API_KEY;
const clientEmail    = process.env.CLIENT_EMAIL;
const googleSheetId  = "172wk5CjEiJAvnpMS9uv2i-EZtRrAh0BUHb5hmQED2-c";

// Authenticate the service account
const googleAuth = new google.auth.JWT(
  clientEmail,
  null,
  privateKey.replace(/\\n/g, "\n"),
  [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
  ]
);

// Define tabs and their ranges
const schoolTabs = {
  Princeton: "Princeton!A3:F8",
  Columbia : "Columbia!A3:F8",
  Harvard  : "Harvard!A3:F8",
  Yale     : "Yale!A3:F8",
  UPenn    : "UPenn!A3:F8",
  // these only have women’s overall scores
  Cornell  : "Cornell!A3:C8",
  Brown    : "Brown!A3:C8",
};

// Define breakdown tabs for weapon-specific scores
// Make sure the row numbers point at the header row for each "X (Women)" block
const breakdownTabs = {
  Princeton: { women: "Princeton!A11:C13", men: "Princeton!E11:G13" },
  Columbia : { women: "Columbia!A16:C18", men: "Columbia!E16:G18" },
  Harvard  : { women: "Harvard!A21:C23", men: "Harvard!E21:G23" },
  Yale     : { women: "Yale!A26:C28", men: "Yale!E26:G28" },
  UPenn    : { women: "UPenn!A31:C33", men: "UPenn!E31:G33" },
  // Cornell & Brown only have women’s blocks; adjust to the *first* block rows!
  Cornell  : { women: "Cornell!A10:C13", men: null },
  Brown    : { women: "Brown!A37:C39", men: null },
};

// Store the current watch channel ID
let currentChannelId = null;

async function fetchSheetData(sheetTab) {
  const sheets   = google.sheets({ version: "v4", auth: googleAuth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: googleSheetId,
    range: sheetTab,
  });
  return response.data.values || [];
}

// Revised fetchMatchupBreakdown with correct range parsing
async function fetchMatchupBreakdown(school, gender, opponent) {
  const breakdownRange = breakdownTabs[school]?.[gender];
  if (!breakdownRange) {
    return { epee: 0, foil: 0, saber: 0 };
  }

  // breakdownRange e.g. "Yale!A26:C28"
  const [sheetName, sheetRange] = breakdownRange.split("!");
  const [startCell, endCell]    = sheetRange.split(":");

  // Extract startCol ("A"), startRow (26), endCol ("C")
  const startCol = startCell.match(/[A-Za-z]+/)[0];
  const startRow = parseInt(startCell.match(/\d+/)[0], 10);
  const endCol   = endCell.match(/[A-Za-z]+/)[0];

  // Expand to cover ~6 blocks (4 rows each) below the header
  const fullRange = `${sheetName}!${startCol}${startRow}:${endCol}${startRow + 24}`;
  // e.g. "Yale!A26:C50"

  const data = await fetchSheetData(fullRange);

  // Find the header row "Opponent (Women)" or "Opponent (Men)"
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;
    if (row[0].toLowerCase().includes(opponent.toLowerCase())) {
      // Next three rows are the weapons
      const epee  = data[i + 1] || [];
      const foil  = data[i + 2] || [];
      const saber = data[i + 3] || [];
      return {
        epee : { team1: parseInt(epee[1]) || 0, team2: parseInt(epee[2]) || 0 },
        foil : { team1: parseInt(foil[1]) || 0, team2: parseInt(foil[2]) || 0 },
        saber: { team1: parseInt(saber[1]) || 0, team2: parseInt(saber[2]) || 0 },
      };
    }
  }

  // Fallback: zero out if nothing found
  return { epee: 0, foil: 0, saber: 0 };
}

// … the rest of your file remains exactly the same …
async function fetchBreakdownData(school, gender, opponent) {
  // legacy (unused after fetchMatchupBreakdown rewrite)
}

async function stopWatch() {
  if (currentChannelId) {
    try {
      const drive = google.drive({ version: "v3", auth: googleAuth });
      await drive.channels.stop({
        requestBody: { id: currentChannelId, resourceId: googleSheetId }
      });
      console.log(`Stopped watch channel: ${currentChannelId}`);
    } catch (error) {
      console.log(`Could not stop watch channel ${currentChannelId}:`, error.message);
    }
    currentChannelId = null;
  }
}

async function watchSpreadsheet() {
  // … unchanged …
}

async function generateScores() {
  // … unchanged, except it now uses fetchMatchupBreakdown …
}

module.exports = {
  generateScores,
  watchSpreadsheet,
  stopWatch,
};
