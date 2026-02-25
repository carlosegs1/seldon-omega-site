const { google } = require("googleapis");

exports.handler = async function (event, context) {
  try {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: "CONFIG!A2:B4",
    });

    const rows = response.data.values;

    const config = {};
    rows.forEach((row) => {
      config[row[0]] = row[1];
    });

    return {
      statusCode: 200,
      body: JSON.stringify(config),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
