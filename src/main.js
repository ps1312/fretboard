// View / controller: renders the fretboard and wires up the controls.
import { CIRCLE, PC, SHARP, FLAT, INT, INTFULL, IVCOL, IVSTK, IVTXT, noteNames } from "./models/notes.js";
import { PATS, pentShapes, scaleShapes } from "./models/scales.js";
import { CT, voicings, pickVoicings } from "./models/chords.js";
import { OPEN, NF, NUT, END, TOP, GAP, fx } from "./models/fretboard.js";

const state = { key: "C", pat: 0, chords: [], prog: false, triads: false };
let lastChipSig = null;

const circle = document.getElementById("circle");
const pat = document.getElementById("pat");
const cmp = document.getElementById("cmp");
const lab = document.getElementById("lab");
const progBtn = document.getElementById("prog");
const triBtn = document.getElementById("tri");

CIRCLE.forEach((k) => {
  const b = document.createElement("button");
  b.textContent = k;
  b.setAttribute("aria-pressed", "false");
  b.dataset.k = k;
  b.onclick = () => { state.key = k; draw(); };
  circle.appendChild(b);
});

PATS.forEach((p, i) => {
  const o = document.createElement("option");
  o.value = i;
  o.textContent = p[0];
  pat.appendChild(o);
});
PATS.forEach((p, i) => {
  const o = document.createElement("option");
  o.value = i;
  o.textContent = p[0];
  cmp.appendChild(o);
});

pat.value = state.pat;
lab.value = "both";

cmp.onchange = draw;
pat.onchange = () => { state.pat = +pat.value; draw(); };
lab.onchange = draw;

progBtn.onclick = () => {
  state.prog = !state.prog;
  if (!state.prog) state.chords = state.chords.slice(0, 1);
  draw();
};

triBtn.onclick = () => {
  state.triads = !state.triads;
  draw();
};

function el(t, a, txt) {
  const e = document.createElementNS("http://www.w3.org/2000/svg", t);
  for (const k in a) e.setAttribute(k, a[k]);
  if (txt != null) e.textContent = txt;
  return e;
}

// One fretboard: frets/strings/notes and the highlighted section shapes,
// plus hover isolation. cfg = { root, names, labels, pc, base, oth, vset, secDefs }
function renderBoard(svg, cfg) {
  const { root, names, labels, pc, base, oth, vset, secDefs } = cfg;
  svg.innerHTML = "";
  let secHover = -1, secFocus = -1, noteIv = null, noteK = null;
  const bottom = TOP + GAP * 5;

  svg.appendChild(el("rect", { x: NUT, y: TOP - 10, width: END - NUT, height: bottom - TOP + 20, fill: "#4a2c1d", rx: 3 }));
  svg.appendChild(el("rect", { x: NUT - 6, y: TOP - 10, width: 6, height: bottom - TOP + 20, fill: "#e8dcc4" }));
  [3, 5, 7, 9, 15, 17, 19, 21].forEach((n) => svg.appendChild(el("circle", { cx: (fx(n - 1) + fx(n)) / 2, cy: (TOP + bottom) / 2, r: 7, fill: "#e8dcc4", opacity: 0.35 })));
  [-1, 1].forEach((s) => svg.appendChild(el("circle", { cx: (fx(11) + fx(12)) / 2, cy: (TOP + bottom) / 2 + s * GAP, r: 6, fill: "#e8dcc4", opacity: 0.35 })));
  for (let n = 1; n <= NF; n++) svg.appendChild(el("line", { x1: fx(n), x2: fx(n), y1: TOP - 10, y2: bottom + 10, stroke: "#b9b2a6", "stroke-width": 2 }));
  for (let s = 0; s < 6; s++) svg.appendChild(el("line", { x1: NUT - 6, x2: END, y1: TOP + s * GAP, y2: TOP + s * GAP, stroke: "#d8d2c6", "stroke-width": 1 + s * 0.45 }));
  [3, 5, 7, 9, 12, 15, 17, 19, 21, 23].forEach((n) => svg.appendChild(el("text", { x: (fx(n - 1) + fx(n)) / 2, y: bottom + 22, "text-anchor": "middle", "font-size": 14, fill: "var(--mut)" }, n)));

  const secEls = [];
  secDefs.forEach((sec, n) => {
    let top = 99, bot = -1;
    for (const k in sec.notes) { const si = +k.split("|")[0]; if (si < top) top = si; if (si > bot) bot = si; }
    const x1 = sec.hasOpen ? NUT - 58 : fx(sec.minF - 1) + 3, x2 = fx(sec.maxF) - 3, y1 = TOP + top * GAP - 14, hh = (bot - top) * GAP + 28;
    const g = el("g", {});
    const fill = el("rect", { x: x1, y: y1, width: x2 - x1, height: hh, rx: 9, fill: n % 2 ? "#ffd27a" : "#ffffff", opacity: 0.05, "pointer-events": "none" });
    const line = el("rect", { x: x1, y: y1, width: x2 - x1, height: hh, rx: 9, fill: "none", stroke: n % 2 ? "#ffd27a" : "#fff", "stroke-width": 1.2, "stroke-dasharray": "6 4", opacity: 0.4, "pointer-events": "none" });
    const label = el("text", { x: (x1 + x2) / 2, y: y1 - 6, "text-anchor": "middle", "font-size": 13, fill: "var(--fg)", "pointer-events": "none" }, sec.label || (n + 1));
    const hit = el("rect", { x: x1, y: y1, width: x2 - x1, height: hh, rx: 9, fill: "transparent", "pointer-events": "all", cursor: "pointer" });
    g.appendChild(fill); g.appendChild(line); g.appendChild(label); g.appendChild(hit);
    svg.appendChild(g);
    const idx = secEls.length;
    secEls.push({ fill, line, label, notes: sec.notes, id: sec.id });
    hit.addEventListener("mouseenter", () => { secHover = idx; refreshSectionHighlight(); });
    hit.addEventListener("mouseleave", () => { secHover = -1; refreshSectionHighlight(); });
    hit.addEventListener("click", () => { secFocus = secFocus === idx ? -1 : idx; secHover = -1; refreshSectionHighlight(); });
  });

  const noteEls = {};
  for (let s2 = 0; s2 < 6; s2++) {
    for (let f = 0; f <= NF; f++) {
      const p = (OPEN[s2] + f) % 12, iv = (p - root + 12) % 12;
      if (pc.indexOf(iv) < 0) continue;
      const x = f === 0 ? NUT - 30 : (fx(f - 1) + fx(f)) / 2, y = TOP + s2 * GAP, isRoot = iv === 0;
      const inCh = vset ? !!vset[s2 + "|" + f] : false;
      const g = el("g", { opacity: vset ? (inCh ? 1 : 0.2) : 1, "pointer-events": "all", cursor: "pointer" });
      noteEls[s2 + "|" + f] = g;
      g.addEventListener("mouseenter", () => { noteIv = iv; noteK = s2 + "|" + f; refreshSectionHighlight(); });
      g.addEventListener("mouseleave", () => { if (noteIv === iv) { noteIv = null; noteK = null; } refreshSectionHighlight(); });
      let st = "same";
      let stk = IVSTK[iv];
      if (oth) { const inB = base.indexOf(iv) >= 0, inO = oth.indexOf(iv) >= 0; st = inB && inO ? "same" : inO ? "added" : "removed"; }
      const fo = st === "removed" ? 0.25 : null, fill = IVCOL[iv];
      stk = st === "removed" ? IVCOL[iv] : st === "added" ? "#4b2a85" : IVSTK[iv];
      const dash = st === "removed" ? "4 3" : "none";
      let sw = 1.5;
      if (inCh) { stk = "#fff"; sw = 3.5; }
      const shp2 = { fill, stroke: stk, "stroke-width": sw, "stroke-dasharray": dash, ...(fo != null ? { "fill-opacity": fo } : {}) };
      if (labels === "both") g.appendChild(el("rect", { x: x - 23, y: y - 14, width: 46, height: 28, rx: 14, ...shp2 }));
      else g.appendChild(el("circle", { cx: x, cy: y, r: 15, ...shp2 }));
      const t = labels === "note" ? names[p] : labels === "int" ? INT[iv] : labels === "none" ? null : names[p] + "/" + INT[iv];
      if (t != null) g.appendChild(el("text", { x, y: y + 4, "text-anchor": "middle", "font-size": labels === "both" ? 10 : labels === "int" ? 12 : 14, "font-weight": 600, fill: st === "removed" ? "#f0e8dc" : IVTXT[iv] }, t));
      svg.appendChild(g);
    }
  }

  function refreshSectionHighlight() {
    let i = secHover >= 0 ? secHover : (secFocus >= 0 ? secFocus : -1);
    if (i >= secEls.length) i = -1;
    applySectionHighlight(i);
  }

  function applySectionHighlight(i) {
    if (noteIv != null) {
      let secIdx = null;
      for (let j = 0; j < secEls.length; j++) if (secEls[j].notes[noteK]) { secIdx = j; break; }
      for (const k in noteEls) {
        let vis;
        if (secIdx != null && !secEls[secIdx].notes[k]) {
          if (vset) vis = vset[k] ? 1 : 0.2;
          else if (oth) { const pr = k.split("|"), s = +pr[0], f = +pr[1], iv = (OPEN[s] + f - root + 12) % 12; vis = oth.indexOf(iv) >= 0 ? 0.3 : 0.1; }
          else vis = 0.1;
        } else {
          const pr = k.split("|"), s = +pr[0], f = +pr[1], iv = (OPEN[s] + f - root + 12) % 12;
          vis = iv === noteIv ? 1 : 0.3;
        }
        noteEls[k].setAttribute("opacity", vis);
      }
    } else {
      for (const k in noteEls) {
        let vis;
        if (i < 0) {
          vis = vset ? (vset[k] ? 1 : 0.2) : 1;
        } else if (secEls[i].notes[k]) {
          vis = vset ? (vset[k] ? 1 : 0.2) : 1;
        } else if (!vset && oth) {
          const pr = k.split("|"), s = +pr[0], f = +pr[1], iv = (OPEN[s] + f - root + 12) % 12;
          vis = oth.indexOf(iv) >= 0 ? 1 : 0.1;
        } else {
          vis = vset && vset[k] ? 0.3 : 0.1;
        }
        noteEls[k].setAttribute("opacity", vis);
      }
    }
    secEls.forEach((s, j) => {
      const on = i < 0 ? null : j === i;
      s.fill.setAttribute("opacity", on === true ? 0.18 : on === false ? 0.03 : 0.05);
      s.line.setAttribute("opacity", on === true ? 1 : on === false ? 0.18 : 0.4);
      s.line.setAttribute("stroke-width", on === true ? 3 : 1.2);
      s.label.setAttribute("opacity", on === false ? 0.3 : 1);
    });
  }

  refreshSectionHighlight();
}

function draw() {
  const root = PC[state.key];
  const base = PATS[state.pat][1];
  const ci = +cmp.value;
  const oth = ci >= 0 ? PATS[ci][1] : null;
  const pc = oth ? base.concat(oth.filter((i) => base.indexOf(i) < 0)) : base;
  const names = noteNames(state.key);
  const labels = lab.value;

  Array.prototype.forEach.call(circle.children, (b) => {
    b.setAttribute("aria-pressed", b.dataset.k === state.key ? "true" : "false");
  });
  progBtn.setAttribute("aria-pressed", state.prog ? "true" : "false");
  progBtn.textContent = "Progression: " + (state.prog ? "on" : "off");
  triBtn.setAttribute("aria-pressed", state.triads ? "true" : "false");
  triBtn.textContent = "Triads: " + (state.triads ? "on" : "off");

  const chips = document.getElementById("chips"), chh = document.getElementById("chh");
  let list = [];
  if (pc.length <= 8) {
    pc.slice().sort((a, b) => a - b).forEach((rv) => {
      CT.forEach((ct, ti) => {
        const tones = ct[1].map((x) => (rv + x) % 12);
        if (tones.every((t) => pc.indexOf(t) >= 0)) list.push({ id: rv + "|" + ti, name: names[(root + rv) % 12] + ct[0], rv, tones, nw: !!oth && tones.some((t) => base.indexOf(t) < 0) });
      });
    });
  }
  state.chords = state.chords.filter((id) => list.some((c) => c.id === id));
  chh.textContent = pc.length > 8 ? "Chords (not shown for this many notes)"
    : state.prog ? "Chords made only from these notes - tap chips to build a progression, one board per chord"
    : "Chords made only from these notes" + (oth ? " (purple border = uses an added note)" : "") + " - tap one to highlight it inside the scale boxes" + (state.triads ? " (triads: all inversions)" : "");
  const chipSig = state.key + "|" + state.pat + "|" + cmp.value + "|" + pc.join(",");
  const rebuild = chipSig !== lastChipSig;
  lastChipSig = chipSig;
  if (rebuild) chips.innerHTML = "";
  const chipEls = {};
  list.forEach((c, i) => {
    let b;
    if (rebuild) {
      b = document.createElement("button");
      b.className = "chip" + (c.nw ? " new" : "");
      b.innerHTML = c.name + "<small>" + INT[c.rv] + "</small>";
      b.onclick = () => {
        if (state.prog) {
          const j = state.chords.indexOf(c.id);
          if (j >= 0) state.chords.splice(j, 1); else state.chords.push(c.id);
        } else {
          state.chords = state.chords[0] === c.id ? [] : [c.id];
        }
        draw();
      };
      chips.appendChild(b);
    } else b = chips.children[i];
    b.setAttribute("aria-pressed", state.chords.indexOf(c.id) >= 0 ? "true" : "false");
    chipEls[c.id] = b;
  });
  const byId = {};
  list.forEach((c) => { byId[c.id] = c; });

  const board1 = document.getElementById("board1");
  const boards = document.getElementById("boards");
  board1.style.display = state.prog ? "none" : "block";
  boards.style.display = state.prog ? "block" : "none";

  // The boxes always come from the scale; a chord, when chosen, is shown as
  // highlighted notes inside those boxes, not as boxes of its own.
  function scaleSecDefs() {
    const [, intervals, ptype, anchor] = PATS[state.pat];
    return ptype ? pentShapes(root, ptype, 2) : scaleShapes(root, anchor, intervals, 2);
  }

  function chordVset(c) {
    const picked = pickVoicings(voicings(root, c.rv, c.tones, state.triads));
    const vset = {};
    picked.forEach((v) => {
      v.fr.forEach((f, si) => { if (f >= 0) vset[si + "|" + f] = true; });
    });
    return vset;
  }

  if (!state.prog) {
    const chosen = byId[state.chords[0]];
    const vset = chosen ? chordVset(chosen) : null;
    const secDefs = scaleSecDefs();
    renderBoard(document.getElementById("fb"), { root, names, labels, pc, base, oth, vset, secDefs });
  } else {
    boards.innerHTML = "";
    if (!state.chords.length) boards.innerHTML = "<p class=\"hint\">Select one or more chords above; each gets its own fretboard, in order.</p>";
    state.chords.forEach((id) => {
      const c = byId[id];
      const wrap = document.createElement("div");
      wrap.className = "board prog";
      const cap = document.createElement("div");
      cap.className = "cap";
      cap.innerHTML = "<b>" + c.name + "</b><small>" + INT[c.rv] + "</small>";
      const mini = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      mini.setAttribute("viewBox", "0 0 1400 220");
      mini.setAttribute("role", "img");
      wrap.appendChild(cap);
      wrap.appendChild(mini);
      boards.appendChild(wrap);
      const vset = chordVset(c);
      renderBoard(mini, { root, names, labels, pc, base, oth, vset, secDefs: scaleSecDefs() });
    });
  }

  const nn = pc.map((i) => names[(root + i) % 12]).join("  ");
  const nxt = CIRCLE[(CIRCLE.indexOf(state.key) + 1) % 12];
  const progtxt = state.prog && state.chords.length ? "<br>Progression: <b>" + state.chords.map((id) => byId[id].name + " (" + INT[byId[id].rv] + ")").join(" &rarr; ") + "</b>" : "";
  document.getElementById("info").innerHTML = "<b>" + state.key + " " + PATS[state.pat][0].toLowerCase() + "</b>: " + nn + ".<br>Intervals: " + pc.map((i) => "<span style=\"color:" + IVCOL[i] + "\"><b>" + INTFULL[i] + "</b></span>").join(", ") + "." + (oth ? "<br>Compared with <b>" + PATS[ci][0].toLowerCase() + "</b>: <span style=\"color:#8e5bd6\"><b>added</b></span> " + (oth.filter((i) => base.indexOf(i) < 0).map((i) => INTFULL[i]).join(", ") || "nothing") + "; <span style=\"color:#d97a7a\"><b>removed</b></span> " + (base.filter((i) => oth.indexOf(i) < 0).map((i) => INTFULL[i]).join(", ") || "nothing") + ". Purple border = only in the compared pattern, dashed outline = only in the first." : "") + progtxt + "<br>Next key in the circle: <b>" + nxt + "</b>.";
}

draw();
