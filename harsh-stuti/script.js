/* =========================================================
   Save the Date – animation timeline
   Edit CONFIG to personalise the invitation.
   ========================================================= */

const CONFIG = {
  bride: "Stuti",
  groom: "Harsh",
  initials: ["H", "S"],
  year: 2026,
  month: 11,          // 1 = January … 12 = December
  day: 30,
  weekStartsOn: 1,    // 1 = Monday (as in the original), 0 = Sunday
  loop: false,        // set true to replay automatically
};

const MONTHS = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY",
  "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
const DAY_HEADS_MON = ["M", "T", "W", "T", "F", "S", "S"];

const $ = (id) => document.getElementById(id);
const stage = $("stage");

/* ---------------- responsive scaling ---------------- */
const REEL = location.hash === "#reel";
if (REEL) { CONFIG.loop = true; stage.classList.add("reel"); }

function fit() {
  const vw = window.visualViewport ? window.visualViewport.width : window.innerWidth;
  const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  // fill the width; grow the stage taller on tall phones (up to ~9:21)
  let s = vw / 540;
  let h = vh / s;
  // slightly shorter screens (phone browsers with toolbars) still fill edge to edge;
  // anything shorter than 880 (landscape, desktop) is letterboxed instead
  if (REEL || h < 880) { s = Math.min(vw / 540, vh / 960); h = 960; }
  h = Math.min(h, 1260);
  stage.style.setProperty("--scale", s);
  stage.style.setProperty("--stage-h", `${h}px`);
  stage.style.setProperty("--shift", `${Math.round((h - 960) * (h < 960 ? 0.45 : 0.42))}px`);
  stage.classList.toggle("is-full", Math.abs(vw - 540 * s) < 2);
}
window.addEventListener("resize", fit);
window.addEventListener("orientationchange", () => setTimeout(fit, 250));
if (window.visualViewport) window.visualViewport.addEventListener("resize", fit);
fit();

/* ---------------- static content ---------------- */
function buildText() {
  $("monthName").textContent = MONTHS[CONFIG.month - 1];
  $("yearName").textContent = CONFIG.year;
  $("coupleNames").innerHTML = `${CONFIG.groom}<span class="amp">&amp;</span>${CONFIG.bride}`;
  document.querySelector(".logo__H").textContent = CONFIG.initials[0];
  document.querySelector(".logo__S").textContent = CONFIG.initials[1];
  document.querySelector(".logo__names").textContent = `${CONFIG.groom} & ${CONFIG.bride}`;
  document.title = `Save the Date · ${CONFIG.groom} & ${CONFIG.bride}`;
}

/* Letters of "Save the Date" laid out on an arc */
function buildArc() {
  const el = $("arcTitle");
  el.innerHTML = "";
  const text = "Save the Date";
  const cx = 270, cy = 300, r = 214;
  const fontSize = 50;
  const ctx = document.createElement("canvas").getContext("2d");
  ctx.font = `${fontSize}px "Gilda Display", serif`;
  const tracking = 7;
  const widths = [...text].map((c) => ctx.measureText(c).width + tracking);
  const total = widths.reduce((a, b) => a + b, 0) - tracking;
  const centerAngle = -90 + 4; // slight tilt to the right, as in the original
  let acc = -total / 2;
  [...text].forEach((c, i) => {
    const mid = acc + (widths[i] - tracking) / 2;
    acc += widths[i];
    const a = centerAngle + (mid / r) * (180 / Math.PI);
    const rad = (a * Math.PI) / 180;
    const x = cx + r * Math.cos(rad);
    const y = cy + r * Math.sin(rad);
    const span = document.createElement("span");
    span.className = "ch";
    span.textContent = c;
    span.style.left = `${x}px`;
    span.style.top = `${y}px`;
    span.style.transform = `translate(-50%, -100%) rotate(${a + 90}deg)`;
    el.appendChild(span);
  });
}

/* Calendar grid */
let cells = {};            // day -> element
let heads = [];
function buildCalendar() {
  const cal = $("calendar");
  cal.innerHTML = "";
  cells = {};
  const heads7 = CONFIG.weekStartsOn === 1 ? DAY_HEADS_MON : ["S", "M", "T", "W", "T", "F", "S"];
  heads = heads7.map((h) => {
    const d = document.createElement("div");
    d.className = "cell head";
    d.textContent = h;
    cal.appendChild(d);
    return d;
  });
  const first = new Date(CONFIG.year, CONFIG.month - 1, 1).getDay(); // 0 = Sun
  const offset = (first - CONFIG.weekStartsOn + 7) % 7;
  const days = new Date(CONFIG.year, CONFIG.month, 0).getDate();
  for (let i = 0; i < offset; i++) cal.appendChild(document.createElement("div"));
  for (let d = 1; d <= days; d++) {
    const c = document.createElement("div");
    c.className = "cell";
    c.textContent = d;
    c.dataset.day = d;
    c.dataset.col = (offset + d - 1) % 7;
    c.dataset.row = Math.floor((offset + d - 1) / 7);
    if (d === CONFIG.day) c.classList.add("target");
    cal.appendChild(c);
    cells[d] = c;
  }
  const rows = Math.ceil((offset + days) / 7);
  cal.classList.toggle("rows-6", rows > 5);
}

/* Centre of an element in stage coordinates */
function centerOf(el) {
  const s = parseFloat(getComputedStyle(stage).getPropertyValue("--scale")) || 1;
  const sr = stage.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  return { x: (r.left + r.width / 2 - sr.left) / s, y: (r.top + r.height / 2 - sr.top) / s };
}

/* Heart route: from below the last date, zig-zag up to the weekday row,
   glide across, then drop down the target's column onto the date. */
function heartRoute() {
  const days = Object.keys(cells).map(Number);
  const last = Math.max(...days);
  const target = cells[CONFIG.day];
  const tCol = +target.dataset.col, tRow = +target.dataset.row;
  const grid = {};               // "row,col" -> el
  days.forEach((d) => { grid[`${cells[d].dataset.row},${cells[d].dataset.col}`] = cells[d]; });
  const at = (row, col) => (row < 0 ? heads[col] : grid[`${row},${col}`]);

  const pts = [];
  const lastEl = cells[last];
  const lp = centerOf(lastEl);
  pts.push({ x: lp.x, y: lp.y + 70 });            // start: below the last date
  let row = +lastEl.dataset.row, col = +lastEl.dataset.col;
  pts.push(centerOf(lastEl));
  // climb diagonally (up-left, bouncing off the edge) to the weekday row
  let dir = col >= 2 ? -1 : 1;
  while (row > -1) {
    row -= 1;
    let next = col + dir;
    if (next < 0 || next > 6) { dir = -dir; next = col + dir; }
    // in the first row cells may be empty – keep column if so
    if (row >= 0 && !at(row, next)) next = col;
    col = next;
    const el = at(row, col);
    if (el) pts.push(centerOf(el));
  }
  // glide along the weekday heads towards the target column (overshoot by one)
  const over = tCol < 6 ? tCol + 1 : tCol - 1;
  const step = over > col ? 1 : -1;
  while (col !== over) { col += step; pts.push(centerOf(heads[col])); }
  // drop down between columns, then settle onto the target
  for (let r = 0; r < tRow; r++) {
    const a = at(r, over) || at(r, tCol);
    const b = at(r, tCol) || a;
    if (!a) continue;
    const pa = centerOf(a), pb = centerOf(b);
    pts.push({ x: (pa.x + pb.x) / 2, y: pa.y + 10 });
  }
  pts.push(centerOf(target));
  return pts;
}

/* ---------------- timeline ---------------- */
let timers = [];
let runId = 0;
const at = (sec, fn) => { const id = runId; timers.push(setTimeout(() => id === runId && fn(), sec * 1000)); };
const clearAll = () => { timers.forEach(clearTimeout); timers = []; };

function typeInto(el, text, perChar, startAt) {
  const tw = el.querySelector(".tw");
  const caret = el.querySelector(".caret");
  at(startAt, () => caret.classList.add("on"));
  [...text].forEach((c, i) => at(startAt + 0.1 + i * perChar, () => { tw.textContent = text.slice(0, i + 1); }));
  at(startAt + 0.1 + text.length * perChar + 0.4, () => caret.classList.remove("on"));
}

function reset() {
  clearAll();
  runId++;
  stage.querySelectorAll(".in, .out, .show, .landed, .beat").forEach((n) => n.classList.remove("in", "out", "show", "landed", "beat"));
  $("scene1").classList.add("is-active");
  $("scene2").classList.remove("is-active");
  const heart = $("heart");
  heart.getAnimations().forEach((a) => a.cancel());
  heart.style.opacity = 0;
  $("typeSTD").querySelector(".tw").textContent = "";
  $("typeDate").querySelector(".tw").textContent = "";
  buildArc();
  buildCalendar();
  $("weddingLabel").innerHTML = "";
  [..."FOR THE WEDDING OF"].forEach((c) => {
    const s = document.createElement("span");
    s.className = "ch";
    s.textContent = c;
    $("weddingLabel").appendChild(s);
  });
  ["monthName", "yearName", "calendar"].forEach((id) => $(id).classList.add("fx"));
}

function play() {
  reset();
  const music = $("music");
  if (!music.paused || music.dataset.ready) { try { music.currentTime = 0; } catch (e) {} }

  const arcChars = [...$("arcTitle").children];
  const monthEl = $("monthName"), yearEl = $("yearName"), cal = $("calendar");
  const heart = $("heart");
  const labelChars = [...$("weddingLabel").children];

  /* ---- Scene 1 ---- */
  at(0.05, () => document.querySelector(".ground--s1").classList.add("in"));
  arcChars.forEach((ch, i) => at(0.1 + i * 0.085, () => ch.classList.add("in")));
  at(0.85, () => monthEl.classList.add("in"));
  at(1.15, () => yearEl.classList.add("in"));
  at(1.5, () => cal.classList.add("in"));

  // heart appears below the calendar
  let route;
  at(3.9, () => {
    route = heartRoute();
    const p0 = route[0];
    heart.animate(
      [
        { opacity: 0, transform: `translate(${p0.x}px, ${p0.y}px) scale(0)` },
        { opacity: 1, transform: `translate(${p0.x}px, ${p0.y}px) scale(1.25)`, offset: .6 },
        { opacity: 1, transform: `translate(${p0.x}px, ${p0.y}px) scale(1)` },
      ],
      { duration: 600, easing: "ease-out", fill: "forwards" }
    );
    heart.classList.add("beat");
  });

  // heart hops across the dates (≈ 6.3s → 12s)
  at(6.3, () => {
    heart.classList.remove("beat");
    const pts = route;
    const hopDur = Math.min(620, 5600 / (pts.length - 1));
    const frames = [];
    const n = pts.length - 1;
    pts.forEach((p, i) => {
      if (i > 0) {
        const q = pts[i - 1];
        // lifted mid-point for a little "hop"
        frames.push({
          offset: (i - 0.5) / n,
          opacity: 1,
          transform: `translate(${(p.x + q.x) / 2}px, ${(p.y + q.y) / 2 - 14}px) scale(1.12, .94)`,
          easing: "ease-in",
        });
      }
      frames.push({ offset: i / n, opacity: 1, transform: `translate(${p.x}px, ${p.y}px) scale(1)`, easing: "ease-out" });
    });
    heart.getAnimations().forEach((a) => a.cancel());
    const anim = heart.animate(frames, { duration: hopDur * n, fill: "forwards" });
    anim.onfinish = () => {
      if (!anim.effect) return;
      cells[CONFIG.day].classList.add("landed");
      $("calendar").classList.add("landed");
      heart.classList.add("beat");
    };
  });

  // "FOR THE WEDDING OF" + names
  labelChars.forEach((ch, i) => at(12.6 + i * 0.055, () => ch.classList.add("in")));
  at(13.7, () => $("coupleNames").classList.add("in"));

  // scene 1 exit (reverse-ish stagger, like the original)
  at(16.2, () => arcChars.forEach((ch, i) => setTimeout(() => ch.classList.add("out"), i * 45)));
  at(16.35, () => { monthEl.classList.add("out"); yearEl.classList.add("out"); });
  at(16.6, () => { cal.classList.add("out"); heart.classList.add("out"); });
  at(16.6, () => { $("weddingLabel").classList.add("out"); $("coupleNames").classList.add("out"); });
  at(16.5, () => document.querySelector(".ground--s1").classList.add("out"));

  /* ---- Scene 2 ---- */
  at(17.3, () => {
    $("scene1").classList.remove("is-active");
    $("scene2").classList.add("is-active");
    heart.classList.remove("out");
    heart.getAnimations().forEach((a) => a.cancel());
    heart.style.opacity = 0;
  });
  at(17.35, () => { $("monogram").classList.add("in"); $("logoMain").classList.add("in"); document.querySelector(".ground--s2").classList.add("in"); });
  typeInto($("typeSTD"), "Save the Date", 0.11, 18.0);
  const dateStr = `${CONFIG.day} . ${MONTHS[CONFIG.month - 1].slice(0, 3)} . ${CONFIG.year}`;
  typeInto($("typeDate"), dateStr, 0.1, 19.55);

  // ending
  at(23.9, () => {
    $("monogram").classList.add("out");
    document.querySelector(".ground--s2").classList.add("out");
    $("typeSTD").classList.add("out");
    $("typeDate").classList.add("out");
  });
  at(24.7, () => {
    if (CONFIG.loop) play();
    else $("replayBtn").classList.add("show");
  });
}

/* ---------------- music (optional) ---------------- */
function setupMusic() {
  const music = $("music");
  const btn = $("soundBtn");
  music.addEventListener("canplaythrough", () => {
    music.dataset.ready = "1";
    btn.hidden = false;
  }, { once: true });
  const tryPlay = () => music.dataset.ready && music.play().then(() => btn.classList.remove("muted")).catch(() => btn.classList.add("muted"));
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (music.paused) tryPlay(); else { music.pause(); btn.classList.add("muted"); }
  });
  // browsers block autoplay with sound until the first interaction
  stage.addEventListener("pointerdown", () => { if (music.paused && !btn.classList.contains("muted")) tryPlay(); }, { once: true });
  music.addEventListener("canplaythrough", tryPlay, { once: true });
}

/* ---------------- painted artwork ---------------- */
function setupArt() {
  document.querySelectorAll("img.art").forEach((img) => {
    const show = () => img.naturalWidth && stage.classList.add(`has-${img.dataset.art}`);
    if (img.complete) show();
    else img.addEventListener("load", show, { once: true });
  });
}

/* ---------------- boot ---------------- */
$("replayBtn").addEventListener("click", (e) => { e.stopPropagation(); play(); });

buildText();
setupArt();
setupMusic();
// tap anywhere on the last frame to replay
stage.addEventListener("click", () => { if ($("replayBtn").classList.contains("show")) play(); });

// start once fonts and paintings are ready (or after 4s on a slow connection)
const imagesReady = Promise.all([...document.querySelectorAll("img.art")].map((img) =>
  img.complete ? null : new Promise((r) => { img.addEventListener("load", r, { once: true }); img.addEventListener("error", r, { once: true }); })));
const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
Promise.race([Promise.all([fontsReady, imagesReady]), new Promise((r) => setTimeout(r, 4000))])
  .then(() => { fit(); requestAnimationFrame(play); });
