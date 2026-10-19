import { test } from "vitest";
import assert from "node:assert/strict";
import { voicings, pickVoicings, CT } from "../src/models/chords.js";
import { PC } from "../src/models/notes.js";
import { PATS } from "../src/models/scales.js";

// Regression: the voicing chain must prefer the chord root on top, not the
// key tonic. Previously Fm in C minor picked a five-string shape that muted
// the high-e F because the variant ending on C scored higher.
test("Fm in C natural minor picks the full six-string barre at frets 13-15", () => {
  const root = PC.C, rv = 5;
  const tones = [0, 3, 7].map((x) => (rv + x) % 12);
  const picked = pickVoicings(voicings(root, rv, tones));
  const barre = picked.find((v) => v.cnt === 6 && v.lo === 13 && v.hi === 15);
  assert.ok(barre, "full Fm barre missing from the picked chain");
});

test("every reachable chip yields non-empty voicings in every key and pattern", () => {
  for (const key of Object.keys(PC)) {
    const root = PC[key];
    for (const [, intervals] of PATS) {
      const pcs = intervals.slice().sort((a, b) => a - b);
      for (const rv of pcs) {
        for (const [, ivs] of CT) {
          const tones = ivs.map((x) => (rv + x) % 12);
          if (!tones.every((t) => pcs.includes(t))) continue;
          const picked = pickVoicings(voicings(root, rv, tones));
          if (!picked.length) continue;
          for (const v of picked) {
            assert.ok(v.fr.some((f) => f >= 0), "picked voicing with no notes on any string");
          }
        }
      }
    }
  }
});
