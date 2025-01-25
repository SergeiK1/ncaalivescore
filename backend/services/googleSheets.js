require("dotenv").config();
const { google } = require("googleapis");

const privateKey = process.env.GOOGLE_SHEETS_API_KEY;
const clientEmail = process.env.CLIENT_EMAIL;
const googleSheetId = '172wk5CjEiJAvnpMS9uv2i-EZtRrAh0BUHb5hmQED2-c';
const googleSheetPage = 'Sheet1';


const googleAuth = new google.auth.JWT(
  clientEmail,
  null,
  privateKey.replace(/\\n/g, "\n"),
  ["https://www.googleapis.com/auth/spreadsheets"]
);

const getSheetData = async (range) => {
  try {
    const sheets = google.sheets({ version: "v4", auth: googleAuth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: googleSheetId,
      range,
    });
    return response.data.values;
  } catch (err) {
    console.error("Error fetching data from Google Sheets:", err);
    throw err;
  }
};

module.exports = { getSheetData };
