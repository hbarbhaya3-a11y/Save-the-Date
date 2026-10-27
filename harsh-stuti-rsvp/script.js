/* ---------------- settings: edit these ---------------- */
const CONFIG = {
  // Google Apps Script web-app URL that saves each RSVP as a row in your Google Sheet
  // (same set-up as the engagement RSVP; see README).
  sheetUrl: "",
  // Optional WhatsApp number, country code first, digits only (e.g. "919812345678").
  // When set, guests also get a "send on WhatsApp" button. With no sheet, the button is always shown.
  whatsappNumber: "",
};

const $ = (id) => document.getElementById(id);
const form = $("rsvp");
const F = form.elements;
const STORE = "hs-wedding-rsvp";

/* ---------------- show / hide sections ---------------- */
function sync() {
  const att = F.attending.value;
  $("yesPart").hidden = att !== "yes";
  $("ownPart").hidden = !["On my own", "Not sure yet"].includes(F.travel.value);
  $("parkingPart").hidden = F.travel.value !== "On my own";
  $("delhiPart").hidden = F.travel.value !== "Arrange from Delhi";
  $("sangeetPart").hidden = !values("events").includes("Sangeet");
  $("performPart").hidden = !["Yes", "Maybe"].includes(F.perform.value);
  // number the visible sections in order
  let n = 0;
  form.querySelectorAll("fieldset").forEach((fs) => {
    if (!fs.closest("[hidden]")) fs.querySelector(".num").textContent = ++n;
  });
}
form.addEventListener("change", (e) => {
  if (e.target.name) clearBad(e.target);
  sync();
});
form.addEventListener("input", (e) => clearBad(e.target));

/* ---------------- guest steppers ---------------- */
const limits = { guests: [1, 20] };
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
    email: f.email.value.trim(),
    city: f.city.value.trim(),
    attending: yes ? "Yes" : f.attending.value === "no" ? "No" : "",
    wish: f.wish.value.trim(),
  };
  if (yes) {
    Object.assign(d, {
      guests: +f.guests.value,
      events: values("events").join(", "),
      travel: f.travel.value,
    });
    if (["On my own", "Not sure yet"].includes(f.travel.value)) {
      Object.assign(d, {
        ownArrive: [f.ownArriveDate.value, f.ownArriveTime.value].filter(Boolean).join(", "),
        ownDepart: [f.ownDepartDate.value, f.ownDepartTime.value].filter(Boolean).join(", "),
        parking: f.travel.value === "On my own" && f.parking.checked ? "Yes" : "",
      });
    }
    if (values("events").includes("Sangeet")) {
      Object.assign(d, {
        perform: f.perform.value,
        performWhat: ["Yes", "Maybe"].includes(f.perform.value) ? f.performWhat.value.trim() : "",
        song: f.song.value.trim(),
      });
    }
    if (f.travel.value === "Arrange from Delhi") {
      Object.assign(d, {
        arriveMode: f.arriveMode.value,
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
  ["name", "Name"], ["phone", "Phone"], ["email", "Email"], ["city", "Coming from"],
  ["attending", "Attending"], ["guests", "Guests"], ["events", "Celebrations"],
  ["travel", "Travel"], ["ownArrive", "Arriving at venue"], ["ownDepart", "Leaving venue"], ["parking", "Parking"],
  ["arriveMode", "Arriving by"], ["arrive", "Arrival in Delhi"],
  ["depart", "Return from Delhi"], ["travelRef", "Flight / train"],
  ["perform", "Performing"], ["performWhat", "Performance"], ["song", "Song request"],
  ["wish", "Wish"],
];
const rows = (d) => LABELS.filter(([k]) => d[k] !== undefined && d[k] !== "");

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
  const first = d.name.split(" ")[0], n = d.guests;
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
  $("guestsOut").textContent = F.guests.value;
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
