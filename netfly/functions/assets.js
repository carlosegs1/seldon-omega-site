const { google } = require("googleapis");

function toNumber(x) {
  if (x === undefined || x === null) return 0;
  const s = String(x).replace(/\$/g, "").replace(/,/g, "").trim();
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

exports.handler = async function () {
  try {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Trae todo DIARIO_RAW para quedarnos con la última fila de cada ticker
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: "DIARIO_RAW!A2:K",
    });

    const rows = resp.data.values || [];

    const lastByTicker = {};
    for (const r of rows) {
      const ticker = r[6]; // Columna G: Ticker
      if (!ticker) continue;
      lastByTicker[ticker] = r; // la última vez que aparezca, queda guardada
    }

    const assets = Object.entries(lastByTicker).map(([ticker, r]) => {
      const precio = toNumber(r[7]);
      const plDiario = toNumber(r[8]);
      const gpTotal = toNumber(r[9]);
      const valorNeto = toNumber(r[10]);

      const light = plDiario > 0 ? "green" : plDiario < 0 ? "red" : "yellow";

      const phrase =
        gpTotal >= 0
          ? `Vas ganando ${gpTotal.toFixed(2)} USD total; hoy aporta ${plDiario.toFixed(2)}.`
          : `Vas perdiendo ${Math.abs(gpTotal).toFixed(2)} USD total; hoy resta ${plDiario.toFixed(2)}.`;

      return { ticker, precio, plDiario, gpTotal, valorNeto, light, phrase };
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, assets }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: error.message }),
    };
  }
};