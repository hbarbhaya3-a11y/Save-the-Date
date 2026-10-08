/* =========================================================
   Save the Date – Harsh & Stuti · animation timeline (~31 s)
   Edit CONFIG to personalise.
   ========================================================= */

const CONFIG = {
  names: ["Harsh", "Stuti"],
  initials: ["H", "S"],
  year: 2026,
  month: 11,          // 1 = January … 12 = December
  day: 30,
  weekStartsOn: 0,    // 0 = Sunday, 1 = Monday
  loop: false,
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July",
  "August", "September", "October", "November", "December"];

const $ = (id) => document.getElementById(id);
const stage = $("stage");

/* ---------------- responsive scaling ---------------- */
const REEL = location.hash === "#reel";
if (REEL) { CONFIG.loop = true; stage.classList.add("reel"); }

function fit() {
  const vw = window.visualViewport ? window.visualViewport.width : window.innerWidth;
  const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  // fill the width on phones; letterbox on landscape / desktop
  let s = vw / 540;
  let h = vh / s;
  if (REEL || h < 880) { s = Math.min(vw / 540, vh / 960); h = 960; }
  h = Math.min(h, 1260);
  stage.style.setProperty("--scale", s);
  stage.style.setProperty("--stage-h", `${h}px`);
  stage.classList.toggle("is-full", Math.abs(vw - 540 * s) < 2);
}
window.addEventListener("resize", fit);
window.addEventListener("orientationchange", () => setTimeout(fit, 250));
if (window.visualViewport) window.visualViewport.addEventListener("resize", fit);
fit();

/* ---------------- content ---------------- */
const ordinal = (n) => (n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th");

function buildText() {
  const [a, b] = CONFIG.names;
  const mon = MONTHS[CONFIG.month - 1];
  $("nameA").textContent = a;
  $("nameB").textContent = `& ${b}`;
  document.querySelectorAll(".logo__H").forEach((t) => { t.textContent = CONFIG.initials[0]; });
  document.querySelectorAll(".logo__S").forEach((t) => { t.textContent = CONFIG.initials[1]; });
  document.querySelectorAll(".logo__names").forEach((t) => { t.textContent = `${a} & ${b}`; });
  $("calTitle").textContent = `${CONFIG.day} ${mon.slice(0, 3)} ${CONFIG.year}`;
  $("dateLine").innerHTML = `${CONFIG.day}<sup>${ordinal(CONFIG.day)}</sup> ${mon.slice(0, 3).toUpperCase()} ${CONFIG.year}`;
  $("finalDate").innerHTML = `${CONFIG.day}<sup>${ordinal(CONFIG.day)}</sup> ${mon} ${CONFIG.year}`;
  document.title = `Save the Date · ${a} & ${b}`;

  $("stdLine").innerHTML = "";
  [..."Save the Date"].forEach((c) => {
    const s = document.createElement("span");
    s.className = "ch";
    s.textContent = c;
    $("stdLine").appendChild(s);
  });
}

/* calendar */
let cells = {};
function buildCalendar() {
  const cal = $("calendar");
  cal.innerHTML = "";
  cells = {};
  const heads = CONFIG.weekStartsOn === 1 ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  heads.forEach((h) => {
    const d = document.createElement("div");
    d.className = "cell head";
    d.textContent = h;
    cal.appendChild(d);
  });
  const first = new Date(CONFIG.year, CONFIG.month - 1, 1).getDay();
  const offset = (first - CONFIG.weekStartsOn + 7) % 7;
  const days = new Date(CONFIG.year, CONFIG.month, 0).getDate();
  for (let i = 0; i < offset; i++) cal.appendChild(document.createElement("div"));
  for (let d = 1; d <= days; d++) {
    const c = document.createElement("div");
    c.className = "cell";
    c.textContent = d;
    c.dataset.row = Math.floor((offset + d - 1) / 7);
    c.dataset.col = (offset + d - 1) % 7;
    cal.appendChild(c);
    cells[d] = c;
  }
}

function centerOf(el) {
  const s = parseFloat(stage.style.getPropertyValue("--scale")) || 1;
  const sr = stage.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  return { x: (r.left + r.width / 2 - sr.left) / s, y: (r.top + r.height / 2 - sr.top) / s };
}

/* Heart route: starts above the 1st, then hops diagonally row by row
   towards the wedding date's column and lands on it. */
function heartRoute() {
  const grid = {};
  Object.values(cells).forEach((c) => { grid[`${c.dataset.row},${c.dataset.col}`] = c; });
  const target = cells[CONFIG.day];
  const tRow = +target.dataset.row, tCol = +target.dataset.col;
  let row = +cells[1].dataset.row, col = +cells[1].dataset.col;
  const p1 = centerOf(cells[1]);
  const pts = [{ x: p1.x, y: p1.y - 60 }, p1];
  while (row !== tRow || col !== tCol) {
    if (row < tRow) row += 1;
    if (col !== tCol) col += col < tCol ? 1 : -1;
    const el = grid[`${row},${col}`];
    if (el) pts.push(centerOf(el));
  }
  return pts;
}

/* ---------------- timeline ---------------- */
let timers = [];
let runId = 0;
const at = (sec, fn) => { const id = runId; timers.push(setTimeout(() => id === runId && fn(), sec * 1000)); };
const show = (id, t) => at(t, () => $(id).classList.add("on"));
const hide = (id, t) => at(t, () => { $(id).classList.add("off"); setTimeout(() => $(id).classList.remove("on", "off"), 800); });
const reveal = (el, t) => at(t, () => el.classList.add("in"));
const bgOn = (id, t) => at(t, () => $(id).classList.add("on"));
const bgOff = (id, t) => at(t, () => $(id).classList.remove("on"));

function reset() {
  timers.forEach(clearTimeout);
  timers = [];
  runId++;
  stage.querySelectorAll(".on, .off, .in, .show, .landed, .beat").forEach((n) => n.classList.remove("on", "off", "in", "show", "landed", "beat"));
  const heart = $("heart");
  heart.getAnimations().forEach((a) => a.cancel());
  heart.style.opacity = 0;
  buildCalendar();
}

function play() {
  reset();
  const music = $("music");
  if (music.dataset.ready) { try { music.currentTime = 0; } catch (e) {} }

  /* 0 · opening: H & S logo */
  show("sOpen", 0);
  reveal($("logoOpen"), 0.2);
  hide("sOpen", 3.9);

  /* 1 · couple (Roots Cafe behind) */
  bgOn("bgCafe", 4.0);
  show("sCouple", 4.2);
  reveal($("tagline"), 5.4);
  hide("sCouple", 8.9);

  /* 2 · calendar */
  show("sCal", 9.2);
  const heart = $("heart");
  let route;
  at(10.6, () => {
    route = heartRoute();
    const p = route[0];
    heart.animate([
      { opacity: 0, transform: `translate(${p.x}px, ${p.y}px) scale(0)` },
      { opacity: 1, transform: `translate(${p.x}px, ${p.y}px) scale(1.25)`, offset: .6 },
      { opacity: 1, transform: `translate(${p.x}px, ${p.y}px) scale(1)` },
    ], { duration: 600, easing: "ease-out", fill: "forwards" });
    heart.classList.add("beat");
  });
  at(11.5, () => {
    heart.classList.remove("beat");
    const n = route.length - 1;
    const frames = [];
    route.forEach((p, i) => {
      if (i > 0) {
        const q = route[i - 1];
        frames.push({ offset: (i - 0.5) / n, opacity: 1, transform: `translate(${(p.x + q.x) / 2}px, ${(p.y + q.y) / 2 - 16}px) scale(1.12, .94)`, easing: "ease-in" });
      }
      frames.push({ offset: i / n, opacity: 1, transform: `translate(${p.x}px, ${p.y}px) scale(1)`, easing: "ease-out" });
    });
    heart.getAnimations().forEach((a) => a.cancel());
    const anim = heart.animate(frames, { duration: Math.min(3400, n * 520), fill: "forwards" });
    anim.onfinish = () => {
      cells[CONFIG.day].classList.add("landed");
      heart.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: "forwards" });
    };
  });
  hide("sCal", 16.1);
  bgOff("bgCafe", 16.1);
  at(16.1, () => heart.animate([{ opacity: 0 }], { duration: 400, fill: "forwards" }));

  /* 3 · names */
  bgOn("bgTemple", 16.2);
  show("sNames", 16.4);
  reveal($("nameA"), 16.6);
  reveal($("nameB"), 17.6);
  [...$("stdLine").children].forEach((c, i) => reveal(c, 18.7 + i * 0.05));
  reveal($("namesDivider"), 19.4);
  reveal($("dateLine"), 19.7);
  hide("sNames", 20.9);
  bgOff("bgTemple", 20.9);

  /* 4 · venues */
  show("sPlace", 21.2);
  reveal(document.querySelector(".place__lead"), 21.3);
  reveal(document.querySelector(".print--a"), 21.7);
  reveal(document.querySelector(".print--b"), 22.6);
  reveal(document.querySelector(".print--c"), 23.5);
  hide("sPlace", 26.5);

  /* 5 · final card */
  bgOn("bgTemple", 26.6);
  show("sFinal", 26.8);
  reveal($("logoFinal"), 27.0);
  reveal(document.querySelector(".final__std"), 29.4);
  reveal($("finalDate"), 29.8);
  reveal(document.querySelector(".final__tag"), 30.3);

  at(33.4, () => {
    if (CONFIG.loop) { hide("sFinal", 0); bgOff("bgTemple", 0); at(0.9, play); }
    else $("replayBtn").classList.add("show");
  });
}

/* ---------------- petals ---------------- */
function buildPetals() {
  const box = $("petals");
  for (let i = 0; i < 12; i++) {
    const p = document.createElement("span");
    p.className = "petal";
    p.style.left = `${Math.random() * 100}%`;
    p.style.animationDuration = `${9 + Math.random() * 8}s`;
    p.style.animationDelay = `${-Math.random() * 16}s`;
    const k = 0.6 + Math.random() * 0.7;
    p.style.width = `${14 * k}px`;
    p.style.height = `${10 * k}px`;
    box.appendChild(p);
  }
}

/* ---------------- music (optional) ---------------- */
function setupMusic() {
  const music = $("music");
  const btn = $("soundBtn");
  const tryPlay = () => music.dataset.ready && music.play().then(() => btn.classList.remove("muted")).catch(() => btn.classList.add("muted"));
  music.addEventListener("canplaythrough", () => { music.dataset.ready = "1"; btn.hidden = false; tryPlay(); }, { once: true });
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (music.paused) tryPlay(); else { music.pause(); btn.classList.add("muted"); }
  });
  stage.addEventListener("pointerdown", () => { if (music.paused && !btn.classList.contains("muted")) tryPlay(); }, { once: true });
}

/* ---------------- boot ---------------- */
$("replayBtn").addEventListener("click", (e) => { e.stopPropagation(); play(); });
stage.addEventListener("click", () => { if ($("replayBtn").classList.contains("show")) play(); });

buildText();
buildPetals();
setupMusic();

const imagesReady = Promise.all([...document.images].map((img) =>
  img.complete ? null : new Promise((r) => { img.addEventListener("load", r, { once: true }); img.addEventListener("error", r, { once: true }); })));
const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
Promise.race([Promise.all([fontsReady, imagesReady]), new Promise((r) => setTimeout(r, 4000))])
  .then(() => { fit(); requestAnimationFrame(play); });
