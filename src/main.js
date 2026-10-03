// View / controller: renders the fretboard and wires up the controls.
import { CIRCLE, PC, SHARP, FLAT, INT, INTFULL, noteNames } from "./models/notes.js";
import { PATS, pentShapes } from "./models/scales.js";
import { CT, voicings, pickVoicings } from "./models/chords.js";
import { OPEN, NF, NUT, END, TOP, GAP, fx } from "./models/fretboard.js";

const state = { key: "C", pat: 0, chord: null, shape: 0, secHover: -1, secFocus: -1 };
let lastChipSig = null;

const circle = document.getElementById("circle");
const pat = document.getElementById("pat");
const cmp = document.getElementById("cmp");
const lab = document.getElementById("lab");

CIRCLE.forEach((k) => {
  const b = document.createElement("button");
  b.textContent = k;
  b.setAttribute("aria-pressed", "false");
  b.dataset.k = k;
  b.onclick = () => { state.key = k; state.shape = 0; state.secFocus = -1; draw(); };
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

cmp.onchange = () => { state.shape = 0; draw(); };
pat.onchange = () => { state.pat = +pat.value; state.shape = 0; draw(); };
lab.onchange = draw;

function el(t, a, txt) {
  const e = document.createElementNS("http://www.w3.org/2000/svg", t);
  for (const k in a) e.setAttribute(k, a[k]);
  if (txt != null) e.textContent = txt;
  return e;
}

function secFrets(notes) {
  const a = [];
  for (let s = 5; s >= 0; s--) {
    const fs = [];
    for (let f = 0; f <= NF; f++) if (notes[s + "|" + f]) fs.push(f);
    a.push(fs.length ? fs.join(" ") : "x");
  }
  return a.join("  ");
}

function draw() {
  const svg = document.getElementById("fb");
  svg.innerHTML = "";
  state.secFocus = -1;
  state.secHover = -1;
  const root = PC[state.key];
  const base = PATS[state.pat][1];
  const ci = +cmp.value;
  const oth = ci >= 0 ? PATS[ci][1] : null;
  const pc = oth ? base.concat(oth.filter((i) => base.indexOf(i) < 0)) : base;
  const names = noteNames(state.key);
  const labels = lab.value;
  const reg = [0, NF];
  const bottom = TOP + GAP * 5;

  Array.prototype.forEach.call(circle.children, (b) => {
    b.setAttribute("aria-pressed", b.dataset.k === state.key ? "true" : "false");
  });

  svg.appendChild(el("rect", { x: NUT, y: TOP - 14, width: END - NUT, height: bottom - TOP + 28, fill: "#4a2c1d", rx: 3 }));
  svg.appendChild(el("rect", { x: NUT - 6, y: TOP - 14, width: 6, height: bottom - TOP + 28, fill: "#e8dcc4" }));
  // inlays
  [3, 5, 7, 9, 15, 17, 19, 21].forEach((n) => svg.appendChild(el("circle", { cx: (fx(n - 1) + fx(n)) / 2, cy: (TOP + bottom) / 2, r: 7, fill: "#e8dcc4", opacity: 0.35 })));
  [-1, 1].forEach((s) => svg.appendChild(el("circle", { cx: (fx(11) + fx(12)) / 2, cy: (TOP + bottom) / 2 + s * GAP * 1.1, r: 6, fill: "#e8dcc4", opacity: 0.35 })));
  // frets
  for (let n = 1; n <= NF; n++) svg.appendChild(el("line", { x1: fx(n), x2: fx(n), y1: TOP - 14, y2: bottom + 14, stroke: "#b9b2a6", "stroke-width": 2 }));
  // strings
  for (let s = 0; s < 6; s++) svg.appendChild(el("line", { x1: NUT - 6, x2: END, y1: TOP + s * GAP, y2: TOP + s * GAP, stroke: "#d8d2c6", "stroke-width": 1 + s * 0.45 }));
  // fret numbers
  [3, 5, 7, 9, 12, 15, 17, 19, 21, 23].forEach((n) => svg.appendChild(el("text", { x: (fx(n - 1) + fx(n)) / 2, y: bottom + 34, "text-anchor": "middle", "font-size": 16, fill: "var(--mut)" }, n)));

  // chords built only from notes in the pattern
  const chips = document.getElementById("chips"), chh = document.getElementById("chh");
  let chosen = null, list = [];
  if (pc.length <= 8) {
    pc.slice().sort((a, b) => a - b).forEach((rv) => {
      CT.forEach((ct, ti) => {
        const tones = ct[1].map((x) => (rv + x) % 12);
        if (tones.every((t) => pc.indexOf(t) >= 0)) list.push({ id: rv + "|" + ti, name: names[(root + rv) % 12] + ct[0], rv, tones, nw: !!oth && tones.some((t) => base.indexOf(t) < 0) });
      });
    });
  }
  if (state.chord && !list.some((c) => c.id === state.chord)) state.chord = null;
  const active = state.chord;
  chh.textContent = pc.length > 8 ? "Chords (not shown for this many notes)" : "Chords made only from these notes" + (oth ? " (purple border = uses an added note)" : "") + " - tap one, then hover a shape on the fretboard to isolate it";
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
      b.onclick = () => { state.chord = state.chord === c.id ? null : c.id; state.shape = 0; state.secHover = -1; draw(); };
      chips.appendChild(b);
    } else b = chips.children[i];
    b.setAttribute("aria-pressed", c.id === active ? "true" : "false");
    chipEls[c.id] = b;
    if (c.id === active) chosen = c;
  });

  let vset = null, noteEls = {}, secEls = [];
  const shp = document.getElementById("shapes");
  shp.hidden = true;
  let secDefs = [];
  const stxt = document.getElementById("stxt");
  if (chosen) {
    const picked = pickVoicings(voicings(root, chosen.rv, chosen.tones));
    shp.hidden = false;
    if (!picked.length) stxt.textContent = "No shape of this chord fits within 4 frets";
    else {
      vset = {};
      picked.forEach((v) => {
        const notes = {};
        v.fr.forEach((f, si) => { if (f >= 0) { vset[si + "|" + f] = true; notes[si + "|" + f] = true; } });
        secDefs.push({ notes, minF: v.lo, maxF: v.hi, hasOpen: v.op, id: chosen.id });
      });
    }
  } else {
    const ptype = PATS[state.pat][2];
    if (ptype) { secDefs = pentShapes(root, ptype, 2); shp.hidden = false; }
  }

  const secText = [];
  secDefs.forEach((sec, n) => {
    let top = 99, bot = -1;
    for (const k in sec.notes) { const si = +k.split("|")[0]; if (si < top) top = si; if (si > bot) bot = si; }
    const x1 = sec.hasOpen ? NUT - 58 : fx(sec.minF - 1) + 3, x2 = fx(sec.maxF) - 3, y1 = TOP + top * GAP - 20, hh = (bot - top) * GAP + 40;
    const g = el("g", {});
    const fill = el("rect", { x: x1, y: y1, width: x2 - x1, height: hh, rx: 9, fill: n % 2 ? "#ffd27a" : "#ffffff", opacity: 0.05, "pointer-events": "none" });
    const line = el("rect", { x: x1, y: y1, width: x2 - x1, height: hh, rx: 9, fill: "none", stroke: n % 2 ? "#ffd27a" : "#fff", "stroke-width": 1.2, "stroke-dasharray": "6 4", opacity: 0.4, "pointer-events": "none" });
    const label = el("text", { x: (x1 + x2) / 2, y: y1 - 6, "text-anchor": "middle", "font-size": 13, fill: "var(--fg)", "pointer-events": "none" }, sec.label || (n + 1));
    const hit = el("rect", { x: x1, y: y1, width: x2 - x1, height: hh, rx: 9, fill: "transparent", "pointer-events": "all", cursor: "pointer" });
    g.appendChild(fill); g.appendChild(line); g.appendChild(label); g.appendChild(hit);
    svg.appendChild(g);
    const idx = secEls.length;
    secEls.push({ fill, line, label, notes: sec.notes, id: sec.id });
    hit.addEventListener("mouseenter", () => { state.secHover = idx; refreshSectionHighlight(); });
    hit.addEventListener("mouseleave", () => { state.secHover = -1; refreshSectionHighlight(); });
    hit.addEventListener("click", () => { state.secFocus = state.secFocus === idx ? -1 : idx; state.secHover = -1; refreshSectionHighlight(); });
    secText.push((sec.label || (n + 1)) + ") frets " + secFrets(sec.notes));
  });
  if (secDefs.length) {
    stxt.textContent = (chosen ? "overlapping outlines alternate white and yellow; each shape has one note per string: " : "5 pentatonic positions - hover a shape to isolate it" + (oth ? " (the compared scale stays visible)" : "") + ": ") + secText.join("   ");
  }

  // notes
  for (let s2 = 0; s2 < 6; s2++) {
    for (let f = 0; f <= NF; f++) {
      const p = (OPEN[s2] + f) % 12, iv = (p - root + 12) % 12;
      if (pc.indexOf(iv) < 0) continue;
      const x = f === 0 ? NUT - 30 : (fx(f - 1) + fx(f)) / 2, y = TOP + s2 * GAP, isRoot = iv === 0;
      const inCh = vset ? !!vset[s2 + "|" + f] : false;
      const g = el("g", { opacity: vset ? (inCh ? 1 : 0.2) : 1, "pointer-events": "none" });
      noteEls[s2 + "|" + f] = g;
      let st = "same";
      if (oth) { const inB = base.indexOf(iv) >= 0, inO = oth.indexOf(iv) >= 0; st = inB && inO ? "same" : inO ? "added" : "removed"; }
      const fill = isRoot ? "#e8a33d" : st === "added" ? "#8e5bd6" : st === "removed" ? "#4a2c1d" : "#2f7d79";
      let stk = isRoot ? "#7a4a0a" : st === "added" ? "#4b2a85" : st === "removed" ? "#e58a8a" : "#16403d";
      const dash = st === "removed" ? "4 3" : "none";
      let sw = 1.5;
      if (inCh) { stk = "#fff"; sw = 3.5; }
      if (labels === "both") g.appendChild(el("rect", { x: x - 23, y: y - 14, width: 46, height: 28, rx: 14, fill, stroke: stk, "stroke-width": sw, "stroke-dasharray": dash }));
      else g.appendChild(el("circle", { cx: x, cy: y, r: 15, fill, stroke: stk, "stroke-width": sw, "stroke-dasharray": dash }));
      const t = labels === "note" ? names[p] : labels === "int" ? INT[iv] : names[p] + "/" + INT[iv];
      if (labels !== "none") g.appendChild(el("text", { x, y: y + 4, "text-anchor": "middle", "font-size": labels === "both" ? 10 : labels === "int" ? 12 : 14, "font-weight": 600, fill: isRoot ? "#2a1a05" : "#fff" }, t));
      svg.appendChild(g);
    }
  }

  function refreshSectionHighlight() {
    let i = state.secHover >= 0 ? state.secHover : (state.secFocus >= 0 ? state.secFocus : -1);
    if (i >= secEls.length) i = -1;
    applySectionHighlight(i);
  }

  function applySectionHighlight(i) {
    for (const k in noteEls) {
      let vis;
      if (i < 0) {
        vis = vset ? (vset[k] ? 1 : 0.2) : 1;
      } else if (secEls[i].notes[k]) {
        vis = 1;
      } else if (!vset && oth) {
        // scales mode only: keep the compared scale visible while a position is isolated
        const pr = k.split("|"), s = +pr[0], f = +pr[1], iv = (OPEN[s] + f - root + 12) % 12;
        vis = oth.indexOf(iv) >= 0 ? 1 : 0.1;
      } else {
        vis = 0.1;
      }
      noteEls[k].setAttribute("opacity", vis);
    }
    secEls.forEach((s, j) => {
      const on = i < 0 ? null : j === i;
      s.fill.setAttribute("opacity", on === true ? 0.18 : on === false ? 0.03 : 0.05);
      s.line.setAttribute("opacity", on === true ? 1 : on === false ? 0.18 : 0.4);
      s.line.setAttribute("stroke-width", on === true ? 3 : 1.2);
      s.label.setAttribute("opacity", on === false ? 0.3 : 1);
    });
    let hi = state.chord;
    if (i >= 0 && secEls[i]) hi = secEls[i].id;
    for (const id in chipEls) chipEls[id].setAttribute("aria-pressed", id === hi ? "true" : "false");
  }

  refreshSectionHighlight();

  const nn = pc.map((i) => names[(root + i) % 12]).join("  ");
  const nxt = CIRCLE[(CIRCLE.indexOf(state.key) + 1) % 12];
  document.getElementById("info").innerHTML = "<b>" + state.key + " " + PATS[state.pat][0].toLowerCase() + "</b>: " + nn + ".<br>Intervals: " + pc.map((i) => INTFULL[i]).join(", ") + "." + (oth ? "<br>Compared with <b>" + PATS[ci][0].toLowerCase() + "</b>: <span style=\"color:#8e5bd6\"><b>added</b></span> " + (oth.filter((i) => base.indexOf(i) < 0).map((i) => INTFULL[i]).join(", ") || "nothing") + "; <span style=\"color:#d97a7a\"><b>removed</b></span> " + (base.filter((i) => oth.indexOf(i) < 0).map((i) => INTFULL[i]).join(", ") || "nothing") + ". Purple = only in the compared pattern, dashed outline = only in the first." : "") + "<br>Next key in the circle: <b>" + nxt + "</b>.";
}

draw();
