/* Delhi Metro Saathi — route engine + UI (vanilla JS) */

/* ---------- geometry: place stations along each line's polyline ---------- */
const COORD = {}; // "lineId|station" -> {x,y}
function buildCoords() {
  LINES.forEach((line) => {
    const pts = line.anchors;
    const segs = [];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      segs.push(d); total += d;
    }
    const n = line.stations.length;
    line.stations.forEach((st, idx) => {
      const target = (idx / (n - 1)) * total;
      let acc = 0, k = 0;
      while (k < segs.length - 1 && acc + segs[k] < target) { acc += segs[k]; k++; }
      const t = segs[k] === 0 ? 0 : (target - acc) / segs[k];
      COORD[line.id + "|" + st] = {
        x: pts[k][0] + (pts[k + 1][0] - pts[k][0]) * t,
        y: pts[k][1] + (pts[k + 1][1] - pts[k][1]) * t
      };
    });
  });
}
buildCoords();

/* ---------- graph ---------- */
const STATION_LINES = {}; // station -> [lineId]
const GRAPH = {};         // node -> [{to, w, type}]
const TIME_PER_STOP = 2.4;
const INTERCHANGE_TIME = 5;
const KM_PER_STOP = 1.15;

function addEdge(a, b, w, type) {
  (GRAPH[a] = GRAPH[a] || []).push({ to: b, w, type });
  (GRAPH[b] = GRAPH[b] || []).push({ to: a, w, type });
}
LINES.forEach((line) => {
  line.stations.forEach((st, i) => {
    (STATION_LINES[st] = STATION_LINES[st] || []).push(line.id);
    GRAPH[line.id + "|" + st] = GRAPH[line.id + "|" + st] || [];
    if (i > 0) addEdge(line.id + "|" + line.stations[i - 1], line.id + "|" + st, TIME_PER_STOP, "ride");
  });
});
Object.keys(STATION_LINES).forEach((st) => {
  const ls = STATION_LINES[st];
  for (let i = 0; i < ls.length; i++)
    for (let j = i + 1; j < ls.length; j++)
      addEdge(ls[i] + "|" + st, ls[j] + "|" + st, INTERCHANGE_TIME, "change");
});
WALK_LINKS.forEach(([a, b, w]) => {
  if (a === b || !STATION_LINES[a] || !STATION_LINES[b]) return;
  STATION_LINES[a].forEach((la) =>
    STATION_LINES[b].forEach((lb) => addEdge(la + "|" + a, lb + "|" + b, w + INTERCHANGE_TIME, "walk"))
  );
});

const ALL_STATIONS = Object.keys(STATION_LINES).sort();
const lineById = (id) => LINES.find((l) => l.id === id);

/* ---------- dijkstra ---------- */
function findRoute(from, to) {
  if (!STATION_LINES[from] || !STATION_LINES[to] || from === to) return null;
  const dist = {}, prev = {}, visited = {};
  const starts = STATION_LINES[from].map((l) => l + "|" + from);
  starts.forEach((s) => (dist[s] = 0));
  const queue = new Set(Object.keys(GRAPH));
  while (queue.size) {
    let u = null, best = Infinity;
    queue.forEach((n) => { const d = dist[n]; if (d !== undefined && d < best) { best = d; u = n; } });
    if (u === null) break;
    queue.delete(u); visited[u] = true;
    if (u.split("|")[1] === to) break;
    (GRAPH[u] || []).forEach((e) => {
      if (visited[e.to]) return;
      const nd = best + e.w;
      if (dist[e.to] === undefined || nd < dist[e.to]) { dist[e.to] = nd; prev[e.to] = { node: u, type: e.type }; }
    });
  }
  let end = null, bestEnd = Infinity;
  STATION_LINES[to].forEach((l) => {
    const n = l + "|" + to;
    if (dist[n] !== undefined && dist[n] < bestEnd) { bestEnd = dist[n]; end = n; }
  });
  if (!end) return null;
  const path = [];
  let cur = end;
  while (cur) { path.unshift(cur); cur = prev[cur] ? prev[cur].node : null; }
  return buildLegs(path);
}

function buildLegs(path) {
  const legs = [];
  let stops = 0;
  path.forEach((node, i) => {
    const [lid, st] = splitNode(node);
    const last = legs[legs.length - 1];
    if (last && last.line === lid) { last.stations.push(st); stops++; }
    else if (last && last.stations[last.stations.length - 1] !== st) {
      legs.push({ line: lid, stations: [st], changeFrom: last });
    } else if (last) {
      legs.push({ line: lid, stations: [st], changeFrom: last });
    } else legs.push({ line: lid, stations: [st] });
  });
  const real = legs.filter((l) => l.stations.length > 1 || legs.length === 1);
  const interchanges = Math.max(0, real.length - 1);
  const time = Math.round(stops * TIME_PER_STOP + interchanges * INTERCHANGE_TIME);
  const km = +(stops * KM_PER_STOP).toFixed(1);
  return { legs: real, stops, interchanges, time, km, fare: fareFor(km), nodes: path };
}
function splitNode(n) { const i = n.indexOf("|"); return [n.slice(0, i), n.slice(i + 1)]; }

function fareFor(km) {
  if (km <= 2) return 10;
  if (km <= 5) return 20;
  if (km <= 12) return 30;
  if (km <= 21) return 40;
  if (km <= 32) return 50;
  return 60;
}
function fmtTime(m) {
  const h = Math.floor(m / 60), mm = m % 60;
  return h ? `${h} hr ${mm} mins` : `${mm} mins`;
}

/* ---------- autocomplete ---------- */
function setupAuto(inputId, listId) {
  const input = document.getElementById(inputId);
  const list = document.getElementById(listId);
  let items = [], active = -1;
  const close = () => { list.innerHTML = ""; list.classList.remove("open"); active = -1; };
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    if (!q) return close();
    const lm = Object.keys(LANDMARKS).filter((l) => l.toLowerCase().includes(q)).slice(0, 4)
      .map((l) => ({ name: LANDMARKS[l], sub: "Landmark · " + l }));
    const st = ALL_STATIONS.filter((s) => s.toLowerCase().includes(q)).slice(0, 8)
      .map((s) => ({ name: s, sub: STATION_LINES[s].map((id) => lineById(id).name).join(" · ") }));
    items = [...lm, ...st];
    list.innerHTML = items.map((it, i) => `
      <li data-i="${i}"><span class="ac-name">${it.name}</span><span class="ac-sub">${it.sub}</span>
        <span class="ac-dots">${(STATION_LINES[it.name] || []).map((id) => `<i style="background:${lineById(id).color}"></i>`).join("")}</span>
      </li>`).join("");
    list.classList.toggle("open", items.length > 0);
  });
  list.addEventListener("mousedown", (e) => {
    const li = e.target.closest("li"); if (!li) return;
    input.value = items[+li.dataset.i].name; close();
  });
  input.addEventListener("keydown", (e) => {
    const lis = [...list.querySelectorAll("li")];
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      active = (active + (e.key === "ArrowDown" ? 1 : -1) + lis.length) % Math.max(lis.length, 1);
      lis.forEach((l, i) => l.classList.toggle("active", i === active));
    } else if (e.key === "Enter") {
      if (active >= 0 && items[active]) { input.value = items[active].name; close(); e.preventDefault(); }
    } else if (e.key === "Escape") close();
  });
  input.addEventListener("blur", () => setTimeout(close, 120));
}

/* ---------- map ---------- */
const svgNS = "http://www.w3.org/2000/svg";
let viewBox = { x: 0, y: 0, w: 1000, h: 1000 };
function el(tag, attrs) {
  const n = document.createElementNS(svgNS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
}
function renderMap(route) {
  const svg = document.getElementById("map");
  svg.innerHTML = "";
  const routeSet = new Set(route ? route.nodes : []);
  const gLines = el("g", {}), gDots = el("g", {}), gLabels = el("g", {});

  LINES.forEach((line) => {
    const pts = line.stations.map((s) => COORD[line.id + "|" + s]);
    const d = pts.map((p, i) => (i ? "L" : "M") + p.x.toFixed(1) + " " + p.y.toFixed(1)).join(" ");
    const dim = route ? 0.18 : 1;
    gLines.appendChild(el("path", { d, fill: "none", stroke: line.color, "stroke-width": 5.5,
      "stroke-linecap": "round", "stroke-linejoin": "round", opacity: dim, class: "ln" }));
    
    // Check if this is the Blue Line or other dense lines requiring 60-degree top-right diagonal labels
    const isDenseLine = line.id === "blue" || line.id === "green" || line.id === "violet";

    line.stations.forEach((s, i) => {
      const p = pts[i], key = line.id + "|" + s;
      const on = routeSet.has(key);
      const inter = STATION_LINES[s].length > 1;
      const c = el("circle", { cx: p.x, cy: p.y, r: inter ? 4.6 : 3,
        fill: inter ? "#fff" : "#fff", stroke: line.color, "stroke-width": inter ? 2.4 : 1.8,
        opacity: route ? (on ? 1 : 0.2) : 1, class: "st" });
      c.addEventListener("click", () => pickStation(s));
      const t = el("title", {}); t.textContent = s + " — " + line.name; c.appendChild(t);
      gDots.appendChild(c);
      if (inter || on) {
        let labAttrs = { x: p.x + 7, y: p.y + 3, class: on ? "lbl on" : "lbl", opacity: route ? (on ? 1 : 0.25) : 0.85 };
        
        // Apply 60-degree diagonal rotation pointing towards the top-right corner
        if (isDenseLine) {
          labAttrs = {
            transform: `translate(${p.x}, ${p.y}) rotate(-60)`,
            x: 6,
            y: 3,
            class: on ? "lbl on" : "lbl",
            opacity: route ? (on ? 1 : 0.25) : 0.85,
            "text-anchor": "start"
          };
        }

        const lab = el("text", labAttrs);
        lab.textContent = s.length > 22 ? s.slice(0, 21) + "…" : s;
        gLabels.appendChild(lab);
      }
    });
  });

  if (route) {
    route.legs.forEach((leg) => {
      const line = lineById(leg.line);
      const pts = leg.stations.map((s) => COORD[leg.line + "|" + s]).filter(Boolean);
      const d = pts.map((p, i) => (i ? "L" : "M") + p.x.toFixed(1) + " " + p.y.toFixed(1)).join(" ");
      gLines.appendChild(el("path", { d, fill: "none", stroke: line.color, "stroke-width": 8,
        "stroke-linecap": "round", "stroke-linejoin": "round", class: "route-glow" }));
    });
    const first = route.legs[0], last = route.legs[route.legs.length - 1];
    marker(gLabels, COORD[first.line + "|" + first.stations[0]], first.stations[0], "A");
    marker(gLabels, COORD[last.line + "|" + last.stations[last.stations.length - 1]],
      last.stations[last.stations.length - 1], "B");
  }
  svg.appendChild(gLines); svg.appendChild(gDots); svg.appendChild(gLabels);
  applyView();
}
function marker(g, p, name, letter) {
  if (!p) return;
  g.appendChild(el("circle", { cx: p.x, cy: p.y, r: 9, fill: "#12203a", stroke: "#fff", "stroke-width": 2.5 }));
  const t = el("text", { x: p.x, y: p.y + 3.6, class: "pin" }); t.textContent = letter; g.appendChild(t);
  const l = el("text", { x: p.x + 13, y: p.y + 4, class: "lbl pinlbl" }); l.textContent = name; g.appendChild(l);
}
function applyView() {
  document.getElementById("map").setAttribute("viewBox",
    `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
}
function zoom(f, cx, cy) {
  const nw = Math.min(1400, Math.max(160, viewBox.w * f));
  const nh = nw;
  const px = cx === undefined ? viewBox.x + viewBox.w / 2 : cx;
  const py = cy === undefined ? viewBox.y + viewBox.h / 2 : cy;
  viewBox.x = px - (px - viewBox.x) * (nw / viewBox.w);
  viewBox.y = py - (py - viewBox.y) * (nh / viewBox.h);
  viewBox.w = nw; viewBox.h = nh; applyView();
}

/* ---------- UI ---------- */
let currentRoute = null;
function pickStation(name) {
  const f = document.getElementById("from"), t = document.getElementById("to");
  if (!f.value) f.value = name; else t.value = name;
  if (f.value && t.value) plan();
}

function plan() {
  const from = resolve(document.getElementById("from").value.trim());
  const to = resolve(document.getElementById("to").value.trim());
  const details = document.getElementById("details");
  if (!from || !to) {
    details.innerHTML = `<p class="hint">Enter a valid station or landmark for both fields.</p>`;
    return;
  }
  if (from === to) {
    details.innerHTML = `<p class="hint">Source and destination are the same station.</p>`;
    return;
  }
  const r = findRoute(from, to);
  currentRoute = r;
  if (!r) { details.innerHTML = `<p class="hint">No route found.</p>`; return; }
  document.getElementById("fare").textContent = "₹" + r.fare;
  document.getElementById("time").textContent = fmtTime(r.time);
  document.getElementById("changes").textContent = r.interchanges;
  document.getElementById("stats").classList.add("show");
  document.getElementById("routeTitle").textContent = from + "  →  " + to;

  const platform = (s) => 1 + (s.length % 4);
  let html = "";
  r.legs.forEach((leg, i) => {
    const line = lineById(leg.line);
    const a = leg.stations[0], b = leg.stations[leg.stations.length - 1];
    html += `
      <div class="leg" style="--lc:${line.color}">
        <div class="leg-head">
          <span class="chip" style="background:${line.color}">${line.name}</span>
          <span class="leg-num">${line.num}</span>
          <span class="leg-count">${leg.stations.length - 1} stops</span>
        </div>
        <div class="leg-body">
          <div class="row"><b>${i === 0 ? "Board at" : "Board at"}</b> ${a}
            <span class="pf">Platform ${platform(a)}</span></div>
          <details><summary>${leg.stations.length} stations on this leg</summary>
            <ol class="stops">${leg.stations.map((s) => `<li>${s}</li>`).join("")}</ol>
          </details>
          <div class="row"><b>Get off at</b> ${b}</div>
        </div>
      </div>`;
    if (i < r.legs.length - 1) {
      const nl = lineById(r.legs[i + 1].line);
      html += `<div class="change">⇄ Change at <b>${b}</b> — walk to
        <span class="chip sm" style="background:${nl.color}">${nl.name}</span> (~${INTERCHANGE_TIME} mins)</div>`;
    }
  });
  html += `<div class="arrive">&#10003; Arrive at <b>${to}</b> · ${r.stops} stops · ~${r.km} km · Fare ₹${r.fare} (Adult, Token)</div>`;
  details.innerHTML = html;
  renderMap(r);
  if (window.innerWidth < 900) document.getElementById("details").scrollIntoView({ behavior: "smooth" });
}

function resolve(v) {
  if (!v) return null;
  if (STATION_LINES[v]) return v;
  if (LANDMARKS[v]) return LANDMARKS[v];
  const lower = v.toLowerCase();
  const lm = Object.keys(LANDMARKS).find((k) => k.toLowerCase() === lower);
  if (lm) return LANDMARKS[lm];
  const exact = ALL_STATIONS.find((s) => s.toLowerCase() === lower);
  if (exact) return exact;
  const partial = ALL_STATIONS.find((s) => s.toLowerCase().includes(lower));
  return partial || null;
}

/* stations tab */
function renderStations(filter = "") {
  const q = filter.toLowerCase();
  const wrap = document.getElementById("stationList");
  wrap.innerHTML = LINES.map((line) => {
    const sts = line.stations.filter((s) => s.toLowerCase().includes(q));
    if (!sts.length) return "";
    return `<div class="sline">
      <h4><i style="background:${line.color}"></i>${line.name} <small>${line.num} · ${line.stations.length} stations</small></h4>
      <div class="sgrid">${sts.map((s) => `<button class="spill" data-st="${s}">${s}${STATION_LINES[s].length > 1 ? ' <em>⇄</em>' : ""}</button>`).join("")}</div>
    </div>`;
  }).join("") || `<p class="hint">No station matches “${filter}”.</p>`;
}

/* ---------- boot ---------- */
document.addEventListener("DOMContentLoaded", () => {
  setupAuto("from", "fromList");
  setupAuto("to", "toList");
  renderMap(null);
  renderStations();

  document.getElementById("planBtn").addEventListener("click", plan);
  document.getElementById("swap").addEventListener("click", () => {
    const f = document.getElementById("from"), t = document.getElementById("to");
    [f.value, t.value] = [t.value, f.value];
    if (f.value && t.value) plan();
  });
  document.getElementById("zin").addEventListener("click", () => zoom(0.75));
  document.getElementById("zout").addEventListener("click", () => zoom(1.35));
  document.getElementById("reset").addEventListener("click", () => {
    viewBox = { x: 0, y: 0, w: 1000, h: 1000 }; applyView();
  });
  document.getElementById("stationSearch").addEventListener("input", (e) => renderStations(e.target.value.trim()));
  document.getElementById("stationList").addEventListener("click", (e) => {
    const b = e.target.closest(".spill"); if (b) { pickStation(b.dataset.st); switchTab("planner"); }
  });
  document.querySelectorAll(".nav button").forEach((b) =>
    b.addEventListener("click", () => switchTab(b.dataset.tab)));
  document.getElementById("date").textContent = new Date().toLocaleDateString("en-IN",
    { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  // pan + wheel zoom
  const svg = document.getElementById("map");
  let drag = null;
  svg.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY, vx: viewBox.x, vy: viewBox.y }; svg.setPointerCapture(e.pointerId); });
  svg.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const r = svg.getBoundingClientRect();
    viewBox.x = drag.vx - (e.clientX - drag.x) * (viewBox.w / r.width);
    viewBox.y = drag.vy - (e.clientY - drag.y) * (viewBox.h / r.height);
    applyView();
  });
  svg.addEventListener("pointerup", () => (drag = null));
  svg.addEventListener("pointerleave", () => (drag = null));
  svg.addEventListener("wheel", (e) => {
    e.preventDefault();
    const r = svg.getBoundingClientRect();
    const cx = viewBox.x + ((e.clientX - r.left) / r.width) * viewBox.w;
    const cy = viewBox.y + ((e.clientY - r.top) / r.height) * viewBox.h;
    zoom(e.deltaY > 0 ? 1.12 : 0.89, cx, cy);
  }, { passive: false });
});

function switchTab(tab) {
  document.querySelectorAll(".nav button").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("show", p.dataset.panel === tab));
}