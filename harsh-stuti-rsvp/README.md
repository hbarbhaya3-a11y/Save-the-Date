# Harsh & Stuti · Wedding RSVP

Live: https://hbarbhaya3-a11y.github.io/Save-the-Date/harsh-stuti-rsvp/

A one-page RSVP in the save-the-date's look (rose garland, bells, H & S monogram), with a dress-code card for each celebration. Guests fill in:

1. About you: name and WhatsApp number
2. Whether they'll join (accept or decline)
3. Number of guests
4. Which celebrations: Haldi, Sangeet, Varmala
5. A wish for the couple

After sending, the RSVP is saved to the Google Sheet and the guest sees a short thank-you.

## Settings (top of `script.js`)

```js
const CONFIG = {
  sheetUrl: "",         // Google Sheet web-app URL (below)
};
```


## Saving RSVPs to a Google Sheet (same set-up as the engagement RSVP)

Each RSVP is sent to a Google Apps Script web app, which adds it as a row in a Google Sheet, just like the engagement page. The wedding form has more fields, so it needs its own sheet and script:

1. Create a new Google Sheet, for example "Wedding RSVPs". Go to **Extensions › Apps Script**, replace the code with the script below and save.
2. Click **Deploy › New deployment**, choose **Web app**, set *Execute as* to **Me** and *Who has access* to **Anyone**, then deploy and copy the web-app URL (it ends in `/exec`).
3. Paste that URL into `sheetUrl` at the top of `script.js`.

```js
const COLS = ["submittedAt","name","phone","attending","guests","events","wish"];
function doPost(e) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sh.getLastRow() === 0) sh.appendRow(COLS);
  const p = e.parameter;
  sh.appendRow(COLS.map((k) => p[k] || ""));
  return ContentService.createTextOutput("ok");
}
```

