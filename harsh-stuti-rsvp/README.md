# Harsh & Stuti · Wedding RSVP

Live: https://hbarbhaya3-a11y.github.io/Save-the-Date/harsh-stuti-rsvp/

A one-page RSVP in the save-the-date's look (rose garland, bells, H & S monogram). Guests fill in:

1. About you: name, WhatsApp number, family or friend of Harsh or Stuti
2. Whether they'll join (accept or decline)
3. Guests: adults, children and their names
4. Which celebrations: Haldi, Sangeet, Varmala
5. Travel: whether you should arrange travel from Delhi, and if so arrival and return dates and times, pickup point, flight or train numbers
6. Stay: whether they need a room, and for which nights
7. Food: Jain, vegetarian or no onion and garlic, plus allergies or notes
8. A wish for the couple

After sending, the RSVP is saved to your Google Sheet and the guest sees a thank-you with a summary of their answers, an optional WhatsApp button, and an "add to calendar" file for the celebrations they chose. Their answers are remembered on their phone so they can edit them later.

## Settings (top of `script.js`)

```js
const CONFIG = {
  sheetUrl: "",         // Google Sheet web-app URL (below)
  whatsappNumber: "",   // optional, e.g. "919812345678"
  rsvpBy: "10th November 2026",
};
```

With a sheet set, the WhatsApp button only shows if you add a number.

## Saving RSVPs to a Google Sheet (same set-up as the engagement RSVP)

Each RSVP is sent to a Google Apps Script web app, which adds it as a row in a Google Sheet, just like the engagement page. The wedding form has more fields, so it needs its own sheet and script:

1. Create a new Google Sheet, for example "Wedding RSVPs". Go to **Extensions › Apps Script**, replace the code with the script below and save.
2. Click **Deploy › New deployment**, choose **Web app**, set *Execute as* to **Me** and *Who has access* to **Anyone**, then deploy and copy the web-app URL (it ends in `/exec`).
3. Paste that URL into `sheetUrl` at the top of `script.js`.

```js
const COLS = ["submittedAt","name","phone","side","attending","adults","children","guestNames","events",
  "travel","arriveMode","pickup","arrive","depart","travelRef","stay","nights","food","notes","wish"];
function doPost(e) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sh.getLastRow() === 0) sh.appendRow(COLS);
  const p = e.parameter;
  sh.appendRow(COLS.map((k) => p[k] || ""));
  return ContentService.createTextOutput("ok");
}
```

Until `sheetUrl` is set, guests send their RSVP through the WhatsApp button instead.
