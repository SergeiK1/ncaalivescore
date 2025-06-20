// sheets.js
require("dotenv").config();
const { google } = require("googleapis");
const fs        = require("fs");
const path      = require("path");

// ─── Google Sheets / Drive setup ───────────────────────────────────────────────
const privateKey    = process.env.GOOGLE_SHEETS_API_KEY;
const clientEmail   = process.env.CLIENT_EMAIL;
const spreadsheetId = "172wk5CjEiJAvnpMS9uv2i-EZtRrAh0BUHb5hmQED2-c";

const googleAuth = new google.auth.JWT(
  clientEmail,
  null,
  privateKey.replace(/\\n/g, "\n"),
  [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
  ]
);

// ─── Which sheet-tabs hold the overall scores ─────────────────────────────────
const schoolTabs = {
  Princeton: "Princeton!A3:F8",
  Columbia : "Columbia!A3:F8",
  Harvard  : "Harvard!A3:F8",
  Yale     : "Yale!A3:F8",
  UPenn    : "UPenn!A3:F8",
  // women only
  Cornell  : "Cornell!A3:C8",
  Brown    : "Brown!A3:C8",
};

// ─── Utility: grab any rectangular range from Sheets ────────────────────────────
async function fetchSheetData(range) {
  const sheets = google.sheets({ version: "v4", auth: googleAuth });
  const res    = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range
  });
  return res.data.values || [];
}

// ─── Dynamically grab the 3-row weapon breakdown for a match ───────────────────
async function fetchMatchupBreakdown(reportingTeam, gender, opponent) {
  const sheetsApi   = google.sheets({ version: "v4", auth: googleAuth });
  const genderLabel = gender === "women" ? "Women" : "Men";

  // scan ONE sheet for "<TeamName> (Women|Men)" -> then read the next 3 rows
  async function scanSheet(sheetName, headerTeam, flip = false) {
    const resp = await sheetsApi.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:F200`
    });
    const rows = resp.data.values || [];

    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === `${headerTeam} (${genderLabel})`) {
        const eRow = rows[i+1] || [];
        const fRow = rows[i+2] || [];
        const sRow = rows[i+3] || [];

        const vals = {
          epee : { team1: parseInt(eRow[1],10) || 0, team2: parseInt(eRow[2],10) || 0 },
          foil : { team1: parseInt(fRow[1],10) || 0, team2: parseInt(fRow[2],10) || 0 },
          saber: { team1: parseInt(sRow[1],10) || 0, team2: parseInt(sRow[2],10) || 0 },
        };

        if (flip) {
          // swap so team1 always refers to reportingTeam
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

  // 1) Look in reportingTeam’s tab
  let breakdown = await scanSheet(reportingTeam, opponent, false);
  if (breakdown) return breakdown;

  // 2) Otherwise look in opponent’s tab (flip sides)
  breakdown = await scanSheet(opponent, reportingTeam, true);
  if (breakdown) return breakdown;

  // 3) Fallback zeros
  return {
    epee : { team1: 0, team2: 0 },
    foil : { team1: 0, team2: 0 },
    saber: { team1: 0, team2: 0 },
  };
}

// ─── Generate + write JSON of all matches + breakdown ─────────────────────────
async function generateScores() {
  console.log("🔄 Updating scores from Google Sheets…");
  const rawMatches = { men: [], women: [] };

  // Step 1: pull all the overall scores
  for (const [school, range] of Object.entries(schoolTabs)) {
    const rows = await fetchSheetData(range);
    rows.forEach(row => {
      const [opp, wSelf, wOpp, mOpp, mSelf, mOppScore] = row;
      if (opp && wSelf != null && wOpp != null) {
        rawMatches.women.push({
          reportingTeam: school,
          opponent:      opp,
          selfScore:     parseInt(wSelf,   10) || 0,
          opponentScore: parseInt(wOpp,    10) || 0
        });
      }
      if (mOpp && mSelf != null && mOppScore != null) {
        rawMatches.men.push({
          reportingTeam: school,
          opponent:      mOpp,
          selfScore:     parseInt(mSelf,   10) || 0,
          opponentScore: parseInt(mOppScore,10) || 0
        });
      }
    });
  }

  // Step 2: reconcile duplicates + await breakdowns
  const final = { men: [], women: [] };
  const seen  = new Set();

  for (const gender of ["women","men"]) {
    for (const match of rawMatches[gender]) {
      const key = [match.reportingTeam, match.opponent].sort().join("-");
      if (seen.has(gender + key)) continue;
      seen.add(gender + key);

      // base object
      let out = {
        team1: match.reportingTeam,
        team2: match.opponent,
        score1: match.selfScore,
        score2: match.opponentScore,
        hasMismatch: false
      };

      // check reverse report for mismatches
      const reverse = rawMatches[gender].find(
        m => m.reportingTeam === match.opponent && m.opponent === match.reportingTeam
      );
      if (reverse) {
        if (
          match.selfScore     !== reverse.opponentScore ||
          match.opponentScore !== reverse.selfScore
        ) {
          out.hasMismatch = true;
          if (reverse.reportingTeam < match.reportingTeam) {
            // swap ordering if opponent < reportingTeam lexically
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

      // 📌 Await the dynamic breakdown
      const breakdown = await fetchMatchupBreakdown(
        out.team1, gender, out.team2
      );
      out.breakdown1 = {
        epee: breakdown.epee.team1,
        foil: breakdown.foil.team1,
        saber: breakdown.saber.team1
      };
      out.breakdown2 = {
        epee: breakdown.epee.team2,
        foil: breakdown.foil.team2,
        saber: breakdown.saber.team2
      };

      final[gender].push(out);
    }
  }

  // Step 3: write to disk
  const outPath = path.join(__dirname, "../data/scores.json");
  fs.writeFileSync(outPath, JSON.stringify(final, null, 2), "utf8");
  console.log(`✅ Wrote scores.json  (Men: ${final.men.length}, Women: ${final.women.length})`);
  return final;
}

// ─── Spreadsheet watch helpers (exactly as you had them) ────────────────────
let currentChannelId = null;
async function stopWatch() {
  if (currentChannelId) {
    try {
      const drive = google.drive({ version: 'v3', auth: googleAuth });
      await drive.channels.stop({
        requestBody: {
          id:          currentChannelId,
          resourceId:  spreadsheetId
        }
      });
      console.log(`Stopped watch channel: ${currentChannelId}`);
    } catch (err) {
      console.log(`Could not stop watch channel ${currentChannelId}:`, err.message);
    }
    currentChannelId = null;
  }
}

async function watchSpreadsheet() {
  try {
    const drive = google.drive({ version: 'v3', auth: googleAuth });
    if (!process.env.WEBHOOK_URL) {
      console.log('Webhook URL not set; skipping real-time watch');
      return;
    }
    await stopWatch();
    const channelId = `ncaa-scores-${Date.now()}`;
    const resp = await drive.files.watch({
      fileId: spreadsheetId,
      requestBody: {
        id:         channelId,
        type:       'web_hook',
        address:    process.env.WEBHOOK_URL,
        expiration: Date.now() + 7*24*3600*1000
      }
    });
    currentChannelId = channelId;
    console.log('✅ Webhook active:', resp.data);
    // renew before expiry
    setTimeout(watchSpreadsheet, 6*24*3600*1000);
  } catch (err) {
    console.error('❌ watchSpreadsheet error:', err.message);
    setTimeout(watchSpreadsheet, 5*60*1000);
  }
}

// ─── Exports ─────────────────────────────────────────────────────────────────
module.exports = {
  generateScores,
  stopWatch,
  watchSpreadsheet
};
