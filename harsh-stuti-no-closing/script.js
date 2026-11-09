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
  $("coupleNames").innerHTML = `${CONFIG.bride}<span class="amp">&amp;</span>${CONFIG.groom}`;
  document.querySelector(".logo__H").textContent = CONFIG.initials[0];
  document.querySelector(".logo__S").textContent = CONFIG.initials[1];
  document.querySelector(".logo__names").textContent = `${CONFIG.bride} & ${CONFIG.groom}`;
  document.title = `Save the Date · ${CONFIG.bride} & ${CONFIG.groom}`;
}

/* Letters of "Save the Date" laid out on an arc */
function buildArc() {
  const el = $("arcTitle");
  el.innerHTML = "";
  const text = "Save the Date";
  const cx = 270, cy = 300, r = 214;
  const fontSize = 44;
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
  // start: between the couple in the temple painting, then hop up to the last date
  const img = document.querySelector(".ground--s1 .photo-ground--one img");
  if (img) {
    const s = parseFloat(getComputedStyle(stage).getPropertyValue("--scale")) || 1;
    const sr = stage.getBoundingClientRect(), r = img.getBoundingClientRect();
    pts.push({ x: (r.left - sr.left) / s + (r.width / s) * 0.69, y: (r.top - sr.top) / s + (r.height / s) * 0.58 });
    pts.push({ x: (pts[0].x + lp.x) / 2, y: (pts[0].y + lp.y) / 2 });
  } else {
    pts.push({ x: lp.x, y: lp.y + 70 });
  }
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

function setPos(n) {
  stage.classList.remove("pos-1", "pos-2", "pos-3", "pos-4", "pos-5", "pos-6");
  stage.classList.add(`pos-${n}`);
}


/* ---------------- Haldi page artwork (drawn once) ---------------- */
const MARIGOLD = ["#f28c28", "#f7c531", "#e8447a", "#ef6b1f", "#f9d548", "#d9343a"];
const SVGNS = "http://www.w3.org/2000/svg";
function svgEl(tag, attrs, parent) {
  const el = document.createElementNS(SVGNS, tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  if (parent) parent.appendChild(el);
  return el;
}
// a string of marigolds along a quadratic curve
function strand(parent, x1, y1, cx, cy, x2, y2, r, gap, shift) {
  const g = svgEl("g", {}, parent);
  const len = Math.hypot(x2 - x1, y2 - y1) + Math.abs(cy - (y1 + y2) / 2);
  const n = Math.max(2, Math.round(len / gap));
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    const x = u * u * x1 + 2 * u * t * cx + t * t * x2;
    const y = u * u * y1 + 2 * u * t * cy + t * t * y2;
    if (i % 2) svgEl("circle", { cx: x, cy: y, r: r * .35, fill: "#d9a441" }, g);
    else {
      const c = MARIGOLD[(i / 2 + shift) % MARIGOLD.length];
      svgEl("circle", { cx: x, cy: y, r, fill: c }, g);
      svgEl("circle", { cx: x - r * .25, cy: y - r * .25, r: r * .45, fill: "rgba(255,255,255,.28)" }, g);
    }
  }
  return g;
}
function buildHaldi() {
  const gl = $("hdGarland");
  if (gl.childElementCount) return;
  // two swags of four strands, one centre drop and side hangings
  [[16, 270], [270, 524]].forEach(([a, b], k) => {
    [34, 62, 92, 124].forEach((sag, i) => strand(gl, a, 6, (a + b) / 2, 6 + sag * 2, b, 6, 5.2, 6.4, i + k * 2));
  });
  strand(gl, 270, 4, 270, 120, 270, 236, 5.6, 6.6, 3);
  [["#f7c531", 270, 248], ["#e8447a", 262, 256], ["#5c9a3c", 278, 256]].forEach(([f, x, y]) => svgEl("circle", { cx: x, cy: y, r: 7, fill: f }, gl));
  [[22, 6, 22, 190], [44, 6, 44, 150], [518, 6, 518, 190], [496, 6, 496, 150]].forEach(([x1, y1, x2, y2], i) =>
    strand(gl, x1, y1, x1, (y1 + y2) / 2, x2, y2, 5, 6.2, i));

  // turmeric pots spilling marigold strands
  const pot = (id, body, band, spill) => {
    const p = $(id);
    const grad = svgEl("linearGradient", { id: id + "G", x1: "0", y1: "0", x2: "1", y2: "0" }, svgEl("defs", {}, p));
    [[0, body[0]], [.55, body[1]], [1, body[2]]].forEach(([o, c]) => svgEl("stop", { offset: o, "stop-color": c }, grad));
    svgEl("path", { d: "M44 60C10 82 4 150 30 190C48 216 122 216 140 190C166 150 160 82 126 60Z", fill: `url(#${id}G)` }, p);
    svgEl("ellipse", { cx: 85, cy: 58, rx: 50, ry: 16, fill: body[2] }, p);
    svgEl("ellipse", { cx: 85, cy: 56, rx: 40, ry: 11, fill: "#5b2a12", opacity: ".75" }, p);
    for (let i = 0; i < 14; i++) svgEl("circle", { cx: 28 + i * 8.4, cy: 110 + Math.sin(i / 13 * Math.PI) * 10, r: 2.2, fill: band }, p);
    spill.forEach(([x, y2], i) => strand(p, x, 52, x + (i % 2 ? 6 : -6), (52 + y2) / 2, x + (i % 2 ? 2 : -2), y2, 6.4, 7, i));
  };
  pot("hdPotL", ["#f6b43a", "#fbd36b", "#e48a1d"], "#fff3d6", [[64, 176], [86, 196], [108, 170]]);
  pot("hdPotR", ["#e23d8f", "#f37ab4", "#b81f6b"], "#fde6f1", [[62, 172], [84, 194], [106, 178]]);
  pot("hdPotLS", ["#e23d8f", "#f37ab4", "#b81f6b"], "#fde6f1", [[72, 150], [100, 164]]);
  pot("hdPotRS", ["#f6b43a", "#fbd36b", "#e48a1d"], "#fff3d6", [[70, 158], [98, 146]]);

  // festive umbrellas (chhatri)
  const umb = (id, main, alt) => {
    const u = $(id);
    svgEl("path", { d: "M60 20V146", stroke: "#a0692a", "stroke-width": 3, "stroke-linecap": "round" }, u);
    svgEl("path", { d: "M8 62C14 30 36 14 60 14C84 14 106 30 112 62Z", fill: main }, u);
    for (let i = 0; i < 6; i++) svgEl("path", { d: `M60 14L${16 + i * 18} 62`, stroke: alt, "stroke-width": 1.4, opacity: ".7" }, u);
    svgEl("path", { d: "M8 62H112", stroke: "#f3c74a", "stroke-width": 5 }, u);
    for (let i = 0; i < 11; i++) svgEl("path", { d: `M${12 + i * 9.6} 64v9`, stroke: alt, "stroke-width": 2.4, "stroke-linecap": "round" }, u);
    for (let i = 0; i < 5; i++) svgEl("circle", { cx: 22 + i * 19, cy: 46, r: 3.4, fill: "#f9e7a8" }, u);
    svgEl("circle", { cx: 60, cy: 11, r: 5, fill: "#f3c74a" }, u);
  };
  umb("hdUmbL", "#e2407f", "#f7a33a");
  umb("hdUmbR", "#f08a24", "#e2407f");

  // brass bowl of haldi with marigolds around it
  const bw = $("hdBowl");
  const bg = svgEl("linearGradient", { id: "hdBowlG", x1: "0", y1: "0", x2: "1", y2: "0" }, svgEl("defs", {}, bw));
  [[0, "#b77f26"], [.5, "#f1cd6c"], [1, "#a8711f"]].forEach(([o, c]) => svgEl("stop", { offset: o, "stop-color": c }, bg));
  svgEl("path", { d: "M28 40C34 70 64 82 100 82C136 82 166 70 172 40Z", fill: "url(#hdBowlG)" }, bw);
  svgEl("ellipse", { cx: 100, cy: 40, rx: 72, ry: 12, fill: "#c99436" }, bw);
  svgEl("ellipse", { cx: 100, cy: 39, rx: 62, ry: 8.5, fill: "#f2b51c" }, bw);
  svgEl("ellipse", { cx: 92, cy: 37, rx: 26, ry: 3.4, fill: "#ffd84d", opacity: ".8" }, bw);
  [[22, 46], [178, 46], [42, 30], [158, 30], [100, 28]].forEach(([x, y], i) => {
    svgEl("circle", { cx: x, cy: y, r: 9, fill: MARIGOLD[i % 4] }, bw);
    svgEl("circle", { cx: x - 2, cy: y - 2, r: 4, fill: "rgba(255,255,255,.3)" }, bw);
  });

  // marigold petals that drift down at the end
  const petals = $("hdPetals");
  for (let i = 0; i < 18; i++) {
    const d = document.createElement("i");
    d.style.left = (4 + (i * 53) % 92) + "%";
    d.style.background = MARIGOLD[i % MARIGOLD.length];
    d.style.animationDelay = (i * 0.37 % 4.2).toFixed(2) + "s";
    d.style.animationDuration = (6 + (i * 1.7) % 3.5).toFixed(2) + "s";
    petals.appendChild(d);
  }
}
const HALDI_IDS = ["hdGarland", "hdLotus", "hdTitle", "hdOf", "hdNames", "hdBless", "hdDate", "hdTime", "hdFlourish",
  "hdUmbL", "hdUmbR", "hdPotL", "hdPotR", "hdPotLS", "hdPotRS", "hdBowl", "hdPetals"];

function play() {
  reset();
  stage.classList.add("no-anim");
  setPos(1);
  void stage.offsetWidth;
  requestAnimationFrame(() => stage.classList.remove("no-anim"));
  $("scene1").classList.remove("leaving");
  $("sceneEv").classList.remove("is-active", "leaving");
  buildHaldi();
  $("sceneHaldi").classList.remove("is-active");
  HALDI_IDS.forEach((id) => $(id).classList.remove("in"));
  document.querySelectorAll(".hd-bell").forEach((b) => b.classList.remove("in"));
  ["evTitle", "ev1", "ev2", "ev3"].forEach((id) => $(id).classList.remove("in"));
  ["dtStd", "dtDates", "dtRule1", "dtVenueL", "dtVenue", "dtBless"].forEach((id) => $(id).classList.remove("in"));
  const music = $("music");
  if (!music.paused || music.dataset.ready) { try { music.currentTime = 0; } catch (e) {} }

  const arcChars = [...$("arcTitle").children];
  const monthEl = $("monthName"), yearEl = $("yearName"), cal = $("calendar");
  const heart = $("heart");
  const labelChars = [...$("weddingLabel").children];

  /* ---- Page 1: logo, Save the Date, for the wedding of Stuti & Harsh ---- */
  $("scene1").classList.remove("is-active");
  $("scene2").classList.add("is-active");
  ["p1WedOf", "p1Names"].forEach((id) => $(id).classList.remove("in", "out"));
  $("p1Bg").classList.add("in");
  at(0.6, () => $("sharedLogo").classList.add("in"));
  typeInto($("typeSTD"), "Save the Date", 0.1, 2.0);
  at(3.6, () => $("p1WedOf").classList.add("in"));
  at(4.0, () => $("sharedNames").classList.add("in"));
  at(7.8, () => ["typeSTD", "p1WedOf"].forEach((id) => $(id).classList.add("out")));
  at(8.3, () => setPos(2));
  at(8.5, () => { $("scene2").classList.remove("is-active"); $("scene1").classList.add("is-active"); });

  /* ---- Scene 1 ---- */
  at(9.4, () => document.querySelector(".ground--s1").classList.add("in"));
  arcChars.forEach((ch, i) => at(8.6 + i * 0.085, () => ch.classList.add("in")));
  at(11.35, () => monthEl.classList.add("in"));
  at(11.65, () => yearEl.classList.add("in"));
  at(12.0, () => cal.classList.add("in"));

  // heart appears below the calendar
  let route;
  at(14.4, () => {
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
  at(16.8, () => {
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
  labelChars.forEach((ch) => ch.classList.add("in"));

  // invite details + events on one page
  at(24.0, () => { $("scene1").classList.add("leaving"); setPos(5); });
  at(24.6, () => $("sceneEv").classList.add("is-active"));
  at(25.0, () => { $("scene1").classList.remove("is-active", "leaving"); });
  ["dtStd", "dtDates", "dtRule1", "dtVenueL", "dtVenue"].forEach((id, i) => at(25.0 + i * 0.35, () => $(id).classList.add("in")));
  ["evTitle", "ev1", "ev2", "ev3"].forEach((id, i) => at(26.9 + i * 0.6, () => $(id).classList.add("in")));
  at(29.4, () => $("dtBless").classList.add("in"));
  // Haldi page: everything arrives one piece at a time
  at(35.0, () => { $("sceneEv").classList.add("leaving"); setPos(6); });
  at(35.4, () => $("sceneHaldi").classList.add("is-active"));
  at(36.3, () => { $("sceneEv").classList.remove("is-active", "leaving"); });
  at(36.2, () => $("hdGarland").classList.add("in"));
  at(37.2, () => document.querySelectorAll(".hd-bell").forEach((b) => b.classList.add("in")));
  at(37.8, () => $("hdLotus").classList.add("in"));
  at(38.4, () => $("hdTitle").classList.add("in"));
  at(39.8, () => $("hdOf").classList.add("in"));
  at(40.3, () => $("hdNames").classList.add("in"));
  at(41.7, () => $("hdBless").classList.add("in"));
  at(42.5, () => $("hdDate").classList.add("in"));
  at(43.1, () => $("hdTime").classList.add("in"));
  at(43.6, () => $("hdFlourish").classList.add("in"));
  [["hdPotL", 44.0], ["hdPotR", 44.3], ["hdPotLS", 44.7], ["hdPotRS", 45.0], ["hdUmbL", 45.4], ["hdUmbR", 45.7], ["hdBowl", 46.1]]
    .forEach(([id, t]) => at(t, () => $(id).classList.add("in")));
  at(46.6, () => $("hdPetals").classList.add("in"));
  at(52.0, () => {
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
