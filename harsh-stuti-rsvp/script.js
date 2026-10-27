/* ---------------- settings: edit these ---------------- */
const CONFIG = {
  // Google Apps Script web-app URL that saves each RSVP as a row in your Google Sheet
  // (same set-up as the engagement RSVP; see README).
  sheetUrl: "",
  // Optional WhatsApp number, country code first, digits only (e.g. "919812345678").
  // When set, guests also get a "send on WhatsApp" button. With no sheet, the button is always shown.
  whatsappNumber: "",
  rsvpBy: "10th November 2026",
};

const $ = (id) => document.getElementById(id);
const form = $("rsvp");
const F = form.elements;
const STORE = "hs-wedding-rsvp";

$("rsvpBy").textContent = CONFIG.rsvpBy;

/* ---------------- show / hide sections ---------------- */
function sync() {
  const att = F.attending.value;
  $("yesPart").hidden = att !== "yes";
  $("wishNum").textContent = att === "yes" ? "8" : "3";
  $("delhiPart").hidden = F.travel.value !== "Arrange from Delhi";
  $("stayPart").hidden = F.stay.value !== "Yes";
}
form.addEventListener("change", (e) => {
  if (e.target.name) clearBad(e.target);
  sync();
});
form.addEventListener("input", (e) => clearBad(e.target));

/* ---------------- guest steppers ---------------- */
const limits = { adults: [1, 12], children: [0, 12] };
document.querySelectorAll("[data-step]").forEach((b) => b.addEventListener("click", () => {
  const key = b.dataset.step, [min, max] = limits[key];
  const v = Math.min(max, Math.max(min, +form[key].value + +b.dataset.d));
  form[key].value = v;
  $(key + "Out").textContent = v;
}));

/* ---------------- collect + validate ---------------- */
function values(name) { return [...form.querySelectorAll(`[name="${name}"]:checked`)].map((i) => i.value); }

function collect() {
  const f = form.elements, yes = f.attending.value === "yes";
  const d = {
    name: f.name.value.trim(),
    phone: f.phone.value.trim(),
    side: f.side.value,
    attending: yes ? "Yes" : f.attending.value === "no" ? "No" : "",
    wish: f.wish.value.trim(),
  };
  if (yes) {
    Object.assign(d, {
      adults: +f.adults.value,
      children: +f.children.value,
      guestNames: f.guestNames.value.trim(),
      events: values("events").join(", "),
      travel: f.travel.value,
      food: f.food.value,
      notes: f.notes.value.trim(),
      stay: f.stay.value,
      nights: f.stay.value === "Yes" ? values("nights").join(", ") : "",
    });
    if (f.travel.value === "Arrange from Delhi") {
      Object.assign(d, {
        arriveMode: f.arriveMode.value, pickup: f.pickup.value,
        arrive: [f.arriveDate.value, f.arriveTime.value].filter(Boolean).join(", "),
        depart: [f.returnDate.value, f.returnTime.value].filter(Boolean).join(", "),
        travelRef: f.travelRef.value.trim(),
      });
    }
  }
  return d;
}

function clearBad(el) {
  el.classList && el.classList.remove("bad");
  const g = el.closest && el.closest(".bad-group");
  if (g) g.classList.remove("bad-group");
  $("err").hidden = true;
}

function validate(d) {
  const problems = [];
  if (!d.name) { F.name.classList.add("bad"); problems.push(F.name); }
  if (d.phone.replace(/\D/g, "").length < 8) { F.phone.classList.add("bad"); problems.push(F.phone); }
  if (!d.attending) { const g = form.querySelector(".choice"); g.classList.add("bad-group"); problems.push(g); }
  else if (d.attending === "Yes" && !d.events) { const g = form.querySelector(".checks"); g.classList.add("bad-group"); problems.push(g); }
  if (problems.length) {
    $("err").textContent = !d.name || d.phone.replace(/\D/g, "").length < 8
      ? "Please add your name and phone number."
      : !d.attending ? "Please let us know if you can join us." : "Please choose at least one celebration.";
    $("err").hidden = false;
    problems[0].scrollIntoView({ behavior: "smooth", block: "center" });
    if (problems[0].focus) problems[0].focus({ preventScroll: true });
    return false;
  }
  return true;
}

/* ---------------- labels for the summary and WhatsApp ---------------- */
const LABELS = [
  ["name", "Name"], ["phone", "Phone"], ["side", "Joining as"], ["attending", "Attending"],
  ["adults", "Adults"], ["children", "Children"], ["guestNames", "Guests"], ["events", "Celebrations"],
  ["travel", "Travel"], ["arriveMode", "Arriving by"], ["pickup", "Pickup"], ["arrive", "Arrival"],
  ["depart", "Return"], ["travelRef", "Flight / train"], ["stay", "Room needed"], ["nights", "Nights"],
  ["food", "Food"], ["notes", "Notes"], ["wish", "Wish"],
];
const rows = (d) => LABELS.filter(([k]) => d[k] !== undefined && d[k] !== "" && !(k === "children" && !d[k]));

function waText(d) {
  const lines = ["*RSVP · Harsh & Stuti's wedding* 💍", ""];
  rows(d).forEach(([k, l]) => lines.push(`*${l}:* ${d[k]}`));
  return lines.join("\n");
}

/* ---------------- submit ---------------- */
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const d = collect();
  if (!validate(d)) return;
  const btn = form.querySelector(".submit");
  btn.disabled = true; btn.textContent = "Sending…";
  d.submittedAt = new Date().toISOString();
  if (CONFIG.sheetUrl) {
    try {
      const payload = new URLSearchParams(Object.entries(d).map(([k, v]) => [k, String(v)]));
      await fetch(CONFIG.sheetUrl, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: payload.toString() });
    } catch (err) {}
  }
  try { localStorage.setItem(STORE, JSON.stringify(saveState())); } catch (err) {}
  btn.disabled = false; btn.textContent = "Send RSVP";
  showThanks(d);
});

function showThanks(d) {
  const yes = d.attending === "Yes";
  const first = d.name.split(" ")[0], n = d.adults + (d.children || 0);
  $("thanksTitle").textContent = yes ? `Thank you, ${first}!` : `We'll miss you, ${first}`;
  $("thanksMsg").textContent = yes
    ? `We've saved a spot for ${n} ${n === 1 ? "guest" : "guests"}. Can't wait to celebrate with you.`
    : "Thank you for letting us know. Your blessings will be with us on the day.";
  $("summary").innerHTML = "";
  rows(d).forEach(([k, l]) => {
    const r = document.createElement("div"), dt = document.createElement("dt"), dd = document.createElement("dd");
    dt.textContent = l; dd.textContent = d[k]; r.append(dt, dd); $("summary").append(r);
  });
  $("waBtn").href = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(waText(d))}`;
  $("waBtn").textContent = CONFIG.sheetUrl ? "Also send on WhatsApp" : "Send my RSVP on WhatsApp";
  $("waBtn").hidden = !!CONFIG.sheetUrl && !CONFIG.whatsappNumber;
  $("calBtn").hidden = !yes;
  form.hidden = true;
  $("thanks").hidden = false;
  $("thanks").scrollIntoView({ behavior: "smooth", block: "start" });
  $("thanks").focus({ preventScroll: true });
}

$("editBtn").addEventListener("click", () => {
  $("thanks").hidden = true; form.hidden = false;
  form.scrollIntoView({ behavior: "smooth", block: "start" });
});

/* ---------------- remember a draft on this device ---------------- */
function saveState() {
  const s = {};
  [...form.elements].forEach((el) => {
    if (!el.name) return;
    if (el.type === "radio") { if (el.checked) s[el.name] = el.value; }
    else if (el.type === "checkbox") { (s[el.name] = s[el.name] || []); if (el.checked) s[el.name].push(el.value); }
    else s[el.name] = el.value;
  });
  return s;
}
function loadState() {
  let s;
  try { s = JSON.parse(localStorage.getItem(STORE) || "null"); } catch (err) {}
  if (!s) return;
  [...form.elements].forEach((el) => {
    if (!el.name || !(el.name in s)) return;
    if (el.type === "radio") el.checked = s[el.name] === el.value;
    else if (el.type === "checkbox") el.checked = s[el.name].includes(el.value);
    else el.value = s[el.name];
  });
  $("adultsOut").textContent = F.adults.value;
  $("childrenOut").textContent = F.children.value;
}
loadState();
sync();

/* ---------------- add to calendar (.ics) ---------------- */
const EVENTS = [
  ["Haldi", "20261129T043000Z", "20261129T073000Z"],
  ["Sangeet", "20261129T133000Z", "20261129T173000Z"],
  ["Varmala", "20261130T053000Z", "20261130T093000Z"],
];
$("calBtn").addEventListener("click", () => {
  const chosen = collect().events || "";
  const stamp = new Date().toISOString().replace(/[-:]|\.\d+/g, "");
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Harsh & Stuti//Wedding//EN", "CALSCALE:GREGORIAN"];
  EVENTS.filter(([n]) => chosen.includes(n)).forEach(([n, s, e]) => ics.push(
    "BEGIN:VEVENT", `UID:${n.toLowerCase()}-harsh-stuti-2026@save-the-date`, `DTSTAMP:${stamp}`,
    `DTSTART:${s}`, `DTEND:${e}`, `SUMMARY:${n} · Harsh & Stuti's wedding`,
    "LOCATION:Moolchand Resort\\, Muzaffarnagar", "DESCRIPTION:https://maps.google.com/?q=Moolchand+Resort+Muzaffarnagar", "END:VEVENT"));
  ics.push("END:VCALENDAR");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics.join("\r\n")], { type: "text/calendar" }));
  a.download = "Harsh-Stuti-wedding.ics";
  document.body.append(a); a.click(); a.remove();
});
