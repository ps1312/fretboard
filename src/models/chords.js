// Chord model: chord types and movable chord voicings.
import { OPEN, NF } from "./fretboard.js";

// [suffix, intervals from the chord root]
export const CT = [
  ["", [0, 4, 7]],
  ["m", [0, 3, 7]],
  ["dim", [0, 3, 6]],
  ["7", [0, 4, 7, 10]],
  ["maj7", [0, 4, 7, 11]],
  ["m7", [0, 3, 7, 10]],
  ["m7b5", [0, 3, 6, 10]],
];

// Playable shapes: one note per string, adjacent strings, root in the bass,
// fretted notes within 4 frets. Shapes with the root in the top voice are
// preferred, since that is how these chords are commonly voiced.
export function voicings(root, rv, tones) {
  const res = [];
  for (let a = 0; a < 6; a++) for (let b = a + 2; b < 6; b++) (function (a, b) {
    const cur = [];
    (function dfs(s, lo, hi) {
      if (s > b) {
        if (hi > 4 && cur.indexOf(0) >= 0) return;
        if (((OPEN[b] + cur[b - a]) % 12 - root + 12) % 12 !== rv) return;
        for (let i = 0; i < tones.length; i++) {
          let ok = false;
          for (let j = 0; j < cur.length; j++) if (((OPEN[a + j] + cur[j]) % 12 - root + 12) % 12 === tones[i]) ok = true;
          if (!ok) return;
        }
        const fr = [-1, -1, -1, -1, -1, -1];
        cur.forEach((f, j) => { fr[a + j] = f; });
        const op = cur.indexOf(0) >= 0, topRoot = ((OPEN[a] + cur[0]) % 12 - root + 12) % 12 === 0;
        res.push({ fr, cnt: cur.length, op, topRoot, lo: op ? 0 : (lo === 99 ? 0 : lo), hi: hi < 0 ? 0 : hi });
        return;
      }
      for (let f = 0; f <= NF; f++) {
        if (tones.indexOf(((OPEN[s] + f) % 12 - root + 12) % 12) < 0) continue;
        let nl = lo, nh = hi;
        if (f > 0) { nl = Math.min(lo, f); nh = Math.max(hi, f); if (nh - nl > 3) continue; }
        cur[s - a] = f;
        dfs(s + 1, nl, nh);
      }
      cur.length = s - a;
    })(a, 99, -1);
  })(a, b);
  res.sort((x, y) => x.lo - y.lo || y.cnt - x.cnt || (x.hi - x.lo) - (y.hi - y.lo));
  return res;
}

// Pick a chain of shapes up the neck: shapes may overlap a little, each one
// favours more strings, a tighter span, and the root in the top voice.
export function pickVoicings(list) {
  let best = 0;
  list.forEach((v) => { if (v.cnt > best) best = v.cnt; });
  const minc = Math.min(4, best);
  const cs = list.filter((v) => v.cnt >= minc).sort((x, y) => x.lo - y.lo || x.hi - y.hi);
  const sc = [], pr = [];
  cs.forEach((v, i) => {
    let bj = -1, bs = 0;
    for (let j = 0; j < i; j++) if (v.lo >= cs[j].lo + 2 && v.hi > cs[j].hi && sc[j] > bs) { bs = sc[j]; bj = j; }
    sc[i] = v.cnt * 4 - (v.hi - v.lo) + (v.topRoot ? 6 : 0) + bs;
    pr[i] = bj;
  });
  let bi = -1, bm = -1;
  sc.forEach((x, i) => { if (x > bm) { bm = x; bi = i; } });
  const picked = [];
  while (bi >= 0) { picked.unshift(cs[bi]); bi = pr[bi]; }
  return picked;
}
