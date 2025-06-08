// sheets.js
require("dotenv").config();
const { google } = require("googleapis");
const fs        = require("fs");
const path      = require("path");

// your Sheets creds & ID
const privateKey    = process.env.GOOGLE_SHEETS_API_KEY;
const clientEmail   = process.env.CLIENT_EMAIL;
const spreadsheetId = "172wk5CjEiJAvnpMS9uv2i-EZtRrAh0BUHb5hmQED2-c";

// auth
const auth = new google.auth.JWT(
  clientEmail,
  null,
  privateKey.replace(/\\n/g, "\n"),
  [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
  ]
);

// which ranges hold the overall scores
const schoolTabs = {
  Princeton: "Princeton!A3:F8",
  Columbia : "Columbia!A3:F8",
  Harvard  : "Harvard!A3:F8",
  Yale     : "Yale!A3:F8",
  UPenn    : "UPenn!A3:F8",
  Cornell  : "Cornell!A3:C8", // women only
  Brown    : "Brown!A3:C8",   // women only
};

// simple helper to pull any A-whatever range
async function fetchSheetData(range) {
  const sheets = google.sheets({ version: "v4", auth });
  const res    = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range
  });
  return res.data.values || [];
}

/**
 * Dynamically scans the entire school sheet for the "<opponent> (Women)" or "(Men)" header,
 * then reads the next three rows as Epee, Foil, Saber.
 */
async function fetchMatchupBreakdown(school, gender, opponent) {
  const sheets = google.sheets({ version: "v4", auth });
  // build the exact header string we expect
  const genderLabel = gender === "women" ? "Women" : "Men";
  const headerText  = `${opponent} (${genderLabel})`;

  // grab a big chunk of the sheet (cols A–F, rows 1–200 should cover everything)
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${school}!A1:F200`
  });
  const rows = resp.data.values || [];

  // find the row where col A === headerText
  for (let i = 0; i < rows.length; i++) {
    const cell = rows[i][0];
    if (cell && cell.toString().trim() === headerText) {
      const eRow = rows[i + 1] || [];
      const fRow = rows[i + 2] || [];
      const sRow = rows[i + 3] || [];
      return {
        epee : { team1: parseInt(eRow[1], 10) || 0, team2: parseInt(eRow[2], 10) || 0 },
        foil : { team1: parseInt(fRow[1], 10) || 0, team2: parseInt(fRow[2], 10) || 0 },
        saber: { team1: parseInt(sRow[1], 10) || 0, team2: parseInt(sRow[2], 10) || 0 },
      };
    }
  }

  // if we never found it, return zeros
  return {
    epee : { team1: 0, team2: 0 },
    foil : { team1: 0, team2: 0 },
    saber: { team1: 0, team2: 0 },
  };
}

async function generateScores() {
  const raw = { men: [], women: [] };

  // 1) pull all overall matches
  for (const [school, range] of Object.entries(schoolTabs)) {
    const data = await fetchSheetData(range);
    data.forEach(row => {
      const [opp, wSelf, wOpp, mOpp, mSelf, mOppScore] = row;
      if (opp && wSelf != null && wOpp != null) {
        raw.women.push({
          reportingTeam: school,
          opponent: opp,
          selfScore: parseInt(wSelf, 10) || 0,
          opponentScore: parseInt(wOpp, 10) || 0,
        });
      }
      if (mOpp && mSelf != null && mOppScore != null) {
        raw.men.push({
          reportingTeam: school,
          opponent: mOpp,
          selfScore: parseInt(mSelf, 10) || 0,
          opponentScore: parseInt(mOppScore, 10) || 0,
        });
      }
    });
  }

  // 2) reconcile duplicates and attach breakdown
  const final = { men: [], women: [] };
  const seen  = new Set();

  for (const gender of ["women", "men"]) {
    for (const match of raw[gender]) {
      const key = [match.reportingTeam, match.opponent].sort().join("-");
      if (seen.has(gender + key)) continue;
      seen.add(gender + key);

      // find the reverse entry, if any
      const reverse = raw[gender].find(
        m => m.reportingTeam === match.opponent && m.opponent === match.reportingTeam
      );

      let out = {
        team1: match.reportingTeam,
        team2: match.opponent,
        score1: match.selfScore,
        score2: match.opponentScore,
        hasMismatch: false
      };

      if (reverse) {
        // check alignment
        if (
          match.selfScore !== reverse.opponentScore ||
          match.opponentScore !== reverse.selfScore
        ) {
          out.hasMismatch = true;
          // pick the lexicographically earlier team to be team1
          if (reverse.reportingTeam < match.reportingTeam) {
            out = {
              team1: reverse.reportingTeam,
              team2: reverse.opponent,
              score1: reverse.selfScore,
              score2: reverse.opponentScore,
              hasMismatch: true
            };
          }
        }
      }

      // 📌 dynamic breakdown
      out.breakdown = await fetchMatchupBreakdown(
        match.reportingTeam,
        gender,
        match.opponent
      );

      final[gender].push(out);
    }
  }

  // write out
  const outPath = path.join(__dirname, "../data/scores.json");
  fs.writeFileSync(outPath, JSON.stringify(final, null, 2), "utf8");
  console.log("✅ Scores + breakdown updated!");
  return final;
}

async function stopWatch() {
  if (!process.env.WEBHOOK_URL) return;
  // … your existing watch/stop code unchanged …
}

async function watchSpreadsheet() {
  if (!process.env.WEBHOOK_URL) return;
  // … your existing watch/stop code unchanged …
}

module.exports = {
  generateScores,
  watchSpreadsheet,
  stopWatch
};
