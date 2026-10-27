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

After sending, the guest sees a summary, a button that sends the RSVP to you on WhatsApp, and an "add to calendar" file for the celebrations they chose. Their answers are remembered on their phone so they can edit them later.

## Settings (top of `script.js`)

```js
const CONFIG = {
  whatsappNumber: "",   // e.g. "919812345678": the number that receives RSVPs on WhatsApp
  sheetUrl: "",         // optional Google Sheet web-app URL (below)
  rsvpBy: "10th November 2026",
};
```

With `whatsappNumber` empty, the WhatsApp button lets the guest pick the chat to send it to.

## Collect every RSVP in a Google Sheet (optional)

1. Create a Google Sheet. Go to **Extensions › Apps Script**, replace the code with the script below and save.
2. Click **Deploy › New deployment**, choose **Web app**, set *Execute as* to **Me** and *Who has access* to **Anyone**, then deploy and copy the web-app URL.
3. Paste that URL into `sheetUrl` in `script.js`.

```js
const COLS = ["submittedAt","name","phone","side","attending","adults","children","guestNames","events",
  "travel","arriveMode","pickup","arrive","depart","travelRef","stay","nights","food","notes","wish"];
function doPost(e) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sh.getLastRow() === 0) sh.appendRow(COLS);
  const d = JSON.parse(e.postData.contents);
  sh.appendRow(COLS.map((k) => d[k] ?? ""));
  return ContentService.createTextOutput("ok");
}
```
