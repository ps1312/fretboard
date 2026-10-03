// Scale / pattern model: the selectable scales plus the movable pentatonic boxes.
import { OPEN, NF } from "./fretboard.js";

// [name, intervals from the root, pentatonic type (if any)]
export const PATS = [
  ["Minor pentatonic", [0, 3, 5, 7, 10], "minor"],
  ["Major scale", [0, 2, 4, 5, 7, 9, 11]],
  ["Natural minor scale", [0, 2, 3, 5, 7, 8, 10]],
  ["Blues scale", [0, 3, 5, 6, 7, 10]],
];

// Pentatonic intervals, keyed by the two pentatonic types.
export const SCALE = { major: [0, 2, 4, 7, 9], minor: [0, 3, 5, 7, 10] };

// The five movable pentatonic positions, per-string fret offsets relative
// to the low-E anchor. Strings are ordered low-E .. high-e (index 0 = low E).
export const PENTPAT = {
  A: [[0, 3], [0, 2], [0, 2], [0, 2], [0, 3], [0, 3]],
  B: [[0, 2], [-1, 2], [-1, 2], [-1, 1], [0, 2], [0, 2]],
  C: [[0, 2], [0, 2], [0, 2], [-1, 2], [0, 3], [0, 2]],
  D: [[0, 3], [0, 3], [0, 2], [0, 2], [1, 3], [0, 3]],
  E: [[0, 2], [0, 2], [-1, 2], [-1, 2], [0, 2], [0, 2]],
};

// Scale-degree -> shape, in root-anchored order (root = Box 1).
export const PENTSEQ = {
  minor: [[0, "A"], [3, "B"], [5, "C"], [7, "D"], [10, "E"]],
  major: [[0, "B"], [2, "C"], [4, "D"], [7, "E"], [9, "A"]],
};

// The movable pentatonic boxes, low to high fret.
// octaves = how many octave repeats to emit (1 = the low positions only).
export function pentShapes(root, type, octaves) {
  octaves = octaves || 1;
  const R = ((root - OPEN[5]) % 12 + 12) % 12, out = [];
  PENTSEQ[type].forEach((d, i) => {
    const pat = PENTPAT[d[1]];
    for (let oct = 0; oct < octaves; oct++) {
      const base = (R + d[0]) % 12 + 12 * oct, notes = {};
      let minF = 99, maxF = -1;
      pat.forEach((offs, pi) => {
        const s = 5 - pi;
        offs.forEach((o) => {
          const f = base + o;
          if (f >= 0 && f <= NF) { notes[s + "|" + f] = true; minF = Math.min(minF, f); maxF = Math.max(maxF, f); }
        });
      });
      if (maxF < 0) continue;
      out.push({ notes, minF, maxF, hasOpen: minF === 0, id: null, label: i + 1, shape: d[1], base });
    }
  });
  out.sort((a, b) => a.minF - b.minF || a.label - b.label);
  return out;
}
