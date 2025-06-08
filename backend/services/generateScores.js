// sheets.js
require("dotenv").config();
const { google } = require("googleapis");
const fs        = require("fs");
const path      = require("path");

// your service-account creds + the spreadsheet ID
const privateKey    = process.env.GOOGLE_SHEETS_API_KEY;
const clientEmail   = process.env.CLIENT_EMAIL;
const spreadsheetId = "172wk5CjEiJAvnpMS9uv2i-EZtRrAh0BUHb5hmQED2-c";

const auth = new google.auth.JWT(
  clientEmail,
  null,
  privateKey.replace(/\\n/g, "\n"),
  [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
  ]
);

const schoolTabs = {
  Princeton: "Princeton!A3:F8",
  Columbia : "Columbia!A3:F8",
  Harvard  : "Harvard!A3:F8",
  Yale     : "Yale!A3:F8",
  UPenn    : "UPenn!A3:F8",
  // women-only sheets
  Cornell  : "Cornell!A3:C8",
  Brown    : "Brown!A3:C8",
};

async function fetchSheetData(range) {
  const sheets = google.sheets({ version: "v4", auth });
  const res    = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range
  });
  return res.data.values || [];
}

/**
 * Dynamically finds the weapon breakdown for a given match.
 *
 * 1) Try to find "<opponent> (Women|Men)" in the reporting team's sheet.
 * 2) If not found, try to find "<reportingTeam> (Women|Men)" in the opponent's sheet.
 * 3) Always return { epee, foil, saber } with team1===reportingTeam's points.
 */
async function fetchMatchupBreakdown(reportingTeam, gender, opponent) {
  const sheetsApi   = google.sheets({ version: "v4", auth });
  const genderLabel = gender === "women" ? "Women" : "Men";

  // helper scans one sheet for a header, flipping if needed
  async function trySheet(sheetName, headerTeam, flip = false) {
    const fullRange = `${sheetName}!A1:F200`;  // big enough to cover all blocks
    const resp      = await sheetsApi.spreadsheets.values.get({
      spreadsheetId,
      range: fullRange
    });
    const rows = resp.data.values || [];

    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === `${headerTeam} (${genderLabel})`) {
        const eRow = rows[i+1] || [];
        const fRow = rows[i+2] || [];
        const sRow = rows[i+3] || [];

        const vals = {
          epee : { team1: parseInt(eRow[1], 10) || 0, team2: parseInt(eRow[2], 10) || 0 },
          foil : { team1: parseInt(fRow[1], 10) || 0, team2: parseInt(fRow[2], 10) || 0 },
          saber: { team1: parseInt(sRow[1], 10) || 0, team2: parseInt(sRow[2], 10) || 0 },
        };

        if (flip) {
          // swap so team1 is always reportingTeam
          return {
            epee : { team1: vals.epee.team2, team2: vals.epee.team1 },
            foil : { team1: vals.foil.team2, team2: vals.foil.team1 },
            saber: { team1: vals.saber.team2, team2: vals.saber.team1 },
          };
        }

        return vals;
      }
    }
    return null;
  }

  // 1) look in reportingTeam’s sheet for "opponent (Women|Men)"
  let breakdown = await trySheet(reportingTeam, opponent, false);
  if (breakdown) return breakdown;

  // 2) not there — look in opponent’s sheet for "reportingTeam (Women|Men)" and flip
  breakdown = await trySheet(opponent, reportingTeam, true);
  if (breakdown) return breakdown;

  // 3) fallback zeros
  return {
    epee : { team1: 0, team2: 0 },
    foil : { team1: 0, team2: 0 },
    saber: { team1: 0, team2: 0 },
  };
}

async function generateScores() {
  const raw = { men: [], women: [] };

  // 1) pull all the overall scores
  for (const [school, range] of Object.entries(schoolTabs)) {
    const data = await fetchSheetData(range);
    data.forEach(row => {
      const [opp, wSelf, wOpp, mOpp, mSelf, mOppScore] = row;

      if (opp && wSelf != null && wOpp != null) {
        raw.women.push({
          reportingTeam: school,
          opponent:      opp,
          selfScore:     parseInt(wSelf, 10)   || 0,
          opponentScore: parseInt(wOpp,  10)   || 0
        });
      }
      if (mOpp && mSelf != null && mOppScore != null) {
        raw.men.push({
          reportingTeam: school,
          opponent:      mOpp,
          selfScore:     parseInt(mSelf, 10)    || 0,
          opponentScore: parseInt(mOppScore,10) || 0
        });
      }
    });
  }

  // 2) reconcile duplicates + attach breakdown
  const final = { men: [], women: [] };
  const seen  = new Set();

  for (const gender of ["women","men"]) {
    for (const match of raw[gender]) {
      const key = [match.reportingTeam, match.opponent].sort().join("-");
      if (seen.has(gender + key)) continue;
      seen.add(gender + key);

      // find the reverse report, if any
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
          match.selfScore     !== reverse.opponentScore ||
          match.opponentScore !== reverse.selfScore
        ) {
          out.hasMismatch = true;
          // pick alphabetical first as team1 if mismatch
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

      // 📌 HERE'S THE MAGIC: dynamic, cross-tab weapon breakdown
      out.breakdown = await fetchMatchupBreakdown(
        match.reportingTeam,
        gender,
        match.opponent
      );

      final[gender].push(out);
    }
  }

  // write it out
  fs.writeFileSync(
    path.join(__dirname, "../data/scores.json"),
    JSON.stringify(final, null, 2),
    "utf8"
  );
  console.log("✅ Scores + breakdown updated!");
  return final;
}

// (your existing watch/stop code stays untouched)
async function stopWatch() { /* … */ }
async function watchSpreadsheet() { /* … */ }

module.exports = {
  generateScores,
  watchSpreadsheet,
  stopWatch
};
