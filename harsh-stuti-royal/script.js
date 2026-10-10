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

function play() {
  reset();
  const fades = ["kicker", "rule1", "date1", "note1", "amp", "archCap", "archDate", "kicker2", "date2"];
  fades.forEach((id) => $(id).classList.add("fade"));

  /* frame, corners, mandala */
  add($("frame"), "in", 0.1);
  document.querySelectorAll(".corner").forEach((c, i) => add(c, "in", 1.4 + i * 0.15));
  add($("mandala"), "in", 0.4);

  /* scene A – names */
  add($("sNames"), "on", 1.8);
  add($("kicker"), "in", 2.0);
  add($("mandala"), "up", 2.8);
  add($("nameA"), "in", 3.4);
  add($("nameA"), "shine", 3.6);
  add($("amp"), "in", 5.0);
  add($("nameB"), "in", 5.4);
  add($("nameB"), "shine", 5.6);
  add($("rule1"), "in", 7.4);
  add($("date1"), "in", 7.8);
  add($("note1"), "in", 8.4);
  at(10.6, () => $("sNames").classList.remove("on"));

  /* scene B – painting in the gold arch */
  add($("sArch"), "on", 11.3);
  add($("arch"), "in", 11.4);
  add($("archCap"), "in", 13.2);
  add($("archCap"), "shine", 13.3);
  add($("archDate"), "in", 13.9);
  at(18.0, () => $("sArch").classList.remove("on"));

  /* scene C – logo, date, cafe */
  add($("mandala"), "away", 10.4);
  add($("sFinal"), "on", 18.7);
  add($("logoMain"), "in", 18.8);
  add($("kicker2"), "in", 20.4);
  add($("date2"), "in", 20.8);
  add($("miniArch"), "in", 21.2);

  at(25.6, () => {
    if (REEL) { $("sFinal").classList.remove("on"); at(1.0, play); }
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
