
require("dotenv").config();


const { google } = require('googleapis');

const privateKey = process.env.GOOGLE_SHEETS_API_KEY;
const clientEmail = process.env.CLIENT_EMAIL;
const googleSheetId = '172wk5CjEiJAvnpMS9uv2i-EZtRrAh0BUHb5hmQED2-c';
const googleSheetPage = 'Sheet1';



// authenticate the service account
const googleAuth = new google.auth.JWT(
    clientEmail,
    null,
    privateKey.replace(/\\n/g, '\n'),
    'https://www.googleapis.com/auth/spreadsheets'
);


async function readSheet() {
    try {
      // google sheet instance
      console.log("Starting....")
      const sheetInstance = await google.sheets({ version: 'v4', auth: googleAuth});
      // read data in the range in a sheet
      const infoObjectFromSheet = await sheetInstance.spreadsheets.values.get({
          auth: googleAuth,
          spreadsheetId: googleSheetId,
          range: `${googleSheetPage}!A2:D6`,
      });
      
      const valuesFromSheet = infoObjectFromSheet.data.values;
      console.log(valuesFromSheet);
    }
    catch(err) {
      console.log("readSheet func() error", err);  
    }
  }
  
  readSheet();