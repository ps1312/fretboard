import { test } from "vitest";
import assert from "node:assert/strict";
import { OPEN } from "../src/models/fretboard.js";
import { PATS, pentShapes, scaleShapes } from "../src/models/scales.js";

// The non-pentatonic patterns, with the pentatonic they anchor their boxes on.
const SCALES = PATS.filter((p) => !p[2]).map((p) => [p[0], p[3], p[1]]);

for (const [name, anchor, intervals] of SCALES) {
  for (let root = 0; root < 12; root++) {
    test(`${name}, root pc ${root}: five boxes of scale tones`, () => {
      const pcs = intervals.map((iv) => (root + iv) % 12);
      const boxes = scaleShapes(root, anchor, intervals, 1);
      assert.equal(boxes.length, 5, "expected five boxes");

      for (const b of boxes) {
        assert.ok(Object.keys(b.notes).length > 0, `box ${b.label} is empty`);
        for (const k in b.notes) {
          const [s, f] = k.split("|").map(Number);
          assert.ok(
            pcs.includes((OPEN[s] + f) % 12),
            `box ${b.label} has a non-scale note at string ${s} fret ${f}`
          );
        }
      }
    });

    test(`${name}, root pc ${root}: boxes include the whole scale`, () => {
      const boxes = scaleShapes(root, anchor, intervals, 1);
      // Every scale degree appears somewhere in the five boxes.
      const seen = new Set();
      for (const b of boxes) {
        for (const k in b.notes) {
          const [s, f] = k.split("|").map(Number);
          seen.add((OPEN[s] + f) % 12);
        }
      }
      for (const iv of intervals) {
        assert.ok(seen.has((root + iv) % 12), `missing scale degree ${iv}`);
      }
    });
  }
}

test("boxes repeat one octave higher with the same labels", () => {
  const intervals = PATS.find((p) => p[0] === "Major scale")[1];
  const boxes = scaleShapes(0, "major", intervals, 2);
  const low = boxes.filter((b) => b.base < 12);
  const high = boxes.filter((b) => b.base >= 12);
  assert.equal(low.length, 5);
  assert.equal(high.length, 5);
  for (let i = 0; i < low.length; i++) {
    assert.equal(high[i].label, low[i].label);
    assert.equal(high[i].base, low[i].base + 12);
  }
});

test("scale boxes extend the pentatonic boxes", () => {
  const intervals = PATS.find((p) => p[0] === "Natural minor scale")[1];
  const pent = pentShapes(9, "minor", 1);
  const full = scaleShapes(9, "minor", intervals, 1);
  assert.equal(full.length, pent.length);
  for (let i = 0; i < pent.length; i++) {
    // every pentatonic note is still present in the matching scale box
    for (const k in pent[i].notes) assert.ok(full[i].notes[k], `lost ${k}`);
    assert.ok(Object.keys(full[i].notes).length >= Object.keys(pent[i].notes).length);
  }
});

test("natural minor is the relative minor of its major", () => {
  const major = PATS.find((p) => p[0] === "Major scale")[1];
  const minor = PATS.find((p) => p[0] === "Natural minor scale")[1];
  const cmaj = major.map((iv) => (0 + iv) % 12).sort((a, b) => a - b);
  const amin = minor.map((iv) => (9 + iv) % 12).sort((a, b) => a - b);
  assert.deepEqual(amin, cmaj);
});
