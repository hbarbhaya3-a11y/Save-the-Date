/* ---------------- settings: edit these ---------------- */
const CONFIG = {
  // Google Apps Script web-app URL that saves each RSVP as a row in your Google Sheet
  // (same set-up as the engagement RSVP; see README).
  sheetUrl: "https://script.google.com/macros/s/AKfycbzZXDU5l-MeGdk7oNYMqITK2tpBz20ya2mNC77i2_qQ-Nf35XKeJoWxWLZTMrhEwYypoA/exec",
};

const $ = (id) => document.getElementById(id);
const form = $("rsvp");
const F = form.elements;
const STORE = "hs-wedding-rsvp";

/* ---------------- show / hide sections ---------------- */
function sync() {
  const att = F.attending.value;
  $("yesPart").hidden = att !== "yes";
  $("dressPart").hidden = att !== "yes";
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
    attending: yes ? "Yes" : f.attending.value === "no" ? "No" : "",
    wish: f.wish.value.trim(),
  };
  if (yes) {
    Object.assign(d, {
      guests: +f.guests.value,
      events: values("events").join(", "),
    });
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
  const first = d.name.split(" ")[0];
  $("thanksTitle").textContent = yes ? `Thank you, ${first}!` : `We'll miss you, ${first}`;
  $("thanksMsg").textContent = yes
    ? "We can't wait to celebrate with you."
    : "Thank you for letting us know. Your blessings will be with us on the day.";
  form.hidden = true;
  $("thanks").hidden = false;
  $("thanks").scrollIntoView({ behavior: "smooth", block: "start" });
  $("thanks").focus({ preventScroll: true });
}

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
