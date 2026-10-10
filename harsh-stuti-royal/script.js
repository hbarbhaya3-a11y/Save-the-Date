/* =========================================================
   Save the Date – Harsh & Stuti · Royal gold frame (~25 s)
   ========================================================= */

const $ = (id) => document.getElementById(id);
const stage = $("stage");
const REEL = location.hash === "#reel";
if (REEL) stage.classList.add("reel");

/* ---------------- scale to fit ---------------- */
function fit() {
  const vw = window.visualViewport ? window.visualViewport.width : innerWidth;
  const vh = window.visualViewport ? window.visualViewport.height : innerHeight;
  stage.style.setProperty("--scale", Math.min(vw / 540, vh / 960));
}
addEventListener("resize", fit);
if (window.visualViewport) visualViewport.addEventListener("resize", fit);
fit();

/* ---------------- mandala ---------------- */
function buildMandala() {
  const NS = "http://www.w3.org/2000/svg";
  const svg = $("mandala");
  const g = document.createElementNS(NS, "g");
  g.setAttribute("class", "spin");
  g.setAttribute("fill", "none");
  g.setAttribute("stroke", "url(#gold)");
  g.setAttribute("stroke-linecap", "round");
  const add = (tag, attrs) => {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    el.setAttribute("pathLength", "1");
    el.classList.add("draw");
    g.appendChild(el);
    return el;
  };
  [18, 40, 70, 94].forEach((r, i) => add("circle", { r, "stroke-width": i === 3 ? 0.9 : 0.7 }));
  // petal rings
  const ring = (n, r0, r1, w, sw) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 360;
      add("path", {
        d: `M0 ${-r0} C${w} ${-(r0 + r1) / 2} ${w} ${-(r0 + r1) / 2 - 4} 0 ${-r1} C${-w} ${-(r0 + r1) / 2 - 4} ${-w} ${-(r0 + r1) / 2} 0 ${-r0}Z`,
        transform: `rotate(${a})`, "stroke-width": sw,
      });
    }
  };
  ring(8, 4, 18, 6, 0.8);
  ring(12, 18, 40, 9, 0.8);
  ring(16, 40, 70, 9, 0.7);
  ring(24, 70, 92, 5, 0.6);
  // dots
  for (let i = 0; i < 24; i++) {
    const a = ((i + 0.5) / 24) * Math.PI * 2;
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", (97 * Math.sin(a)).toFixed(2));
    c.setAttribute("cy", (-97 * Math.cos(a)).toFixed(2));
    c.setAttribute("r", "1.4");
    c.setAttribute("fill", "url(#gold)");
    c.setAttribute("stroke", "none");
    g.appendChild(c);
  }
  svg.appendChild(g);
}

/* ---------------- gold dust ---------------- */
function buildDust() {
  const box = $("dust");
  for (let i = 0; i < 18; i++) {
    const d = document.createElement("i");
    d.style.left = `${Math.random() * 100}%`;
    d.style.setProperty("--dx", `${(Math.random() - 0.5) * 80}px`);
    d.style.animationDuration = `${10 + Math.random() * 10}s`;
    d.style.animationDelay = `${-Math.random() * 18}s`;
    const s = 2 + Math.random() * 3;
    d.style.width = d.style.height = `${s}px`;
    box.appendChild(d);
  }
}

/* ---------------- timeline ---------------- */
let timers = [];
let runId = 0;
const at = (sec, fn) => { const id = runId; timers.push(setTimeout(() => id === runId && fn(), sec * 1000)); };
const add = (el, cls, t) => at(t, () => el.classList.add(cls));

function reset() {
  timers.forEach(clearTimeout);
  timers = [];
  runId++;
  stage.querySelectorAll(".in, .on, .up, .away, .show, .shine").forEach((n) => n.classList.remove("in", "on", "up", "away", "show", "shine"));
}

function confettiBurst() {
  const box = $("confetti");
  box.innerHTML = "";
  const colors = ["#d4a84a", "#f0d89a", "#b8893d", "#fff3c4", "#c94b67"];
  for (let i = 0; i < 46; i++) {
    const c = document.createElement("i");
    const w = 4 + Math.random() * 5, h = w * (0.4 + Math.random() * 0.8);
    c.style.width = `${w}px`; c.style.height = `${h}px`;
    c.style.background = colors[i % colors.length];
    box.appendChild(c);
    const ang = Math.random() * Math.PI * 2, dist = 90 + Math.random() * 190;
    const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist * 0.7;
    c.animate([
      { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
      { transform: `translate(${dx}px, ${dy}px) rotate(${Math.random() * 540}deg)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx * 1.1}px, ${dy + 160}px) rotate(${Math.random() * 900}deg)`, opacity: 0 },
    ], { duration: 2200 + Math.random() * 900, easing: "cubic-bezier(.2,.7,.4,1)", fill: "forwards" });
  }
}

function play() {
  reset();
  $("confetti").innerHTML = "";
  ["kicker", "rule1", "tagline1", "amp"].forEach((id) => $(id).classList.add("fade"));
  $("arch").classList.remove("shrink");
  $("finale").classList.remove("on");

  /* 1 · frame, corners, mandala */
  add($("frame"), "in", 0.1);
  document.querySelectorAll(".corner").forEach((c, i) => add(c, "in", 1.2 + i * 0.15));
  add($("mandala"), "in", 0.4);

  /* 2 · save the date */
  add($("sNames"), "on", 2.6);
  add($("mandala"), "up", 3.0);
  add($("kicker"), "in", 3.6);
  add($("wedOf"), "in", 4.3);

  /* 3 · names */
  add($("nameA"), "in", 5.0);
  add($("nameA"), "shine", 5.2);
  add($("amp"), "in", 6.6);
  add($("nameB"), "in", 7.0);
  add($("nameB"), "shine", 7.2);

  /* 4 · date */
  add($("rule1"), "in", 9.4);
  add($("tagline1"), "in", 9.9);
  at(12.2, () => $("sNames").classList.remove("on"));
  add($("mandala"), "away", 12.2);

  /* 5 · painting in the gold arch */
  add($("sArch"), "on", 12.8);
  add($("arch"), "in", 12.9);

  /* 6 · finale: painting shrinks up, logo, #HarshgotStutified */
  add($("arch"), "shrink", 18.0);
  add($("finale"), "on", 18.6);
  add($("logoMain"), "in", 18.7);
  add($("tagGlow"), "in", 20.6);
  add($("htA"), "in", 20.8);
  add($("htB"), "in", 21.6);
  add($("htC"), "in", 22.1);
  at(22.25, confettiBurst);
  add($("tagDate"), "in", 23.2);

  at(26.0, () => {
    if (REEL) { $("sArch").classList.remove("on"); $("finale").classList.remove("on"); at(1.0, play); }
    else $("replayBtn").classList.add("show");
  });
}

/* ---------------- boot ---------------- */
$("replayBtn").addEventListener("click", (e) => { e.stopPropagation(); play(); });
stage.addEventListener("click", () => { if ($("replayBtn").classList.contains("show")) play(); });

buildMandala();
buildDust();
const imagesReady = Promise.all([...document.images].map((img) =>
  img.complete ? null : new Promise((r) => { img.addEventListener("load", r, { once: true }); img.addEventListener("error", r, { once: true }); })));
Promise.race([Promise.all([document.fonts ? document.fonts.ready : null, imagesReady]), new Promise((r) => setTimeout(r, 4000))])
  .then(() => { fit(); requestAnimationFrame(play); });
