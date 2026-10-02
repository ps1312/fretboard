"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const P = require("../pentatonic.js");

const { OPEN, NF, SCALE, pentShapes } = P;

function inScale(root, type, p) {
  return SCALE[type].indexOf(((p - root) % 12 + 12) % 12) >= 0;
}

// The five standard movable positions, A minor, low->high fret.
// Box4(0), Box5(3), Box1(5), Box2(8), Box3(10) — anchor frets on the low E.
const A_MINOR_REFERENCE = [
  { label: 4, shape: "D", base: 0 },
  { label: 5, shape: "E", base: 3 },
  { label: 1, shape: "A", base: 5 },
  { label: 2, shape: "B", base: 8 },
  { label: 3, shape: "C", base: 10 },
];

for (const type of ["major", "minor"]) {
  for (let root = 0; root < 12; root++) {
    test(`${type} pentatonic, root pc ${root}: 5 closed boxes`, () => {
      const boxes = pentShapes(root, type);
      assert.equal(boxes.length, 5, "expected exactly 5 boxes");

      for (const b of boxes) {
        // 1. every note in the box is a scale tone
        for (const k in b.notes) {
          const [s, f] = k.split("|").map(Number);
          assert.ok(
            inScale(root, type, OPEN[s] + f),
            `box ${b.label} has a non-scale note at string ${s} fret ${f}`
          );
        }
        // 2. closure: every scale tone within [minF, maxF] on each string is present
        for (let s = 0; s < 6; s++) {
          for (let f = b.minF; f <= b.maxF; f++) {
            if (inScale(root, type, OPEN[s] + f)) {
              assert.ok(
                b.notes[`${s}|${f}`],
                `box ${b.label} is missing scale tone at string ${s} fret ${f} (span ${b.minF}-${b.maxF})`
              );
            }
          }
        }
      }
    });

    test(`${type} pentatonic, root pc ${root}: Box1 is the root position`, () => {
      const boxes = pentShapes(root, type);
      const box1 = boxes.find((b) => b.label === 1);
      assert.ok(box1, "Box1 must exist");
      // Box1's lowest note on the low E string is the root (anchor = root fret).
      const lowE = Object.keys(box1.notes)
        .filter((k) => k.startsWith("5|"))
        .map((k) => Number(k.split("|")[1]));
      const lowest = Math.min(...lowE);
      assert.equal((OPEN[5] + lowest) % 12, root, "Box1 low-E anchor is the root");
    });
  }
}

test("A minor pentatonic matches the standard movable positions", () => {
  const boxes = pentShapes(9, "minor").sort((a, b) => a.minF - b.minF);
  assert.deepEqual(
    boxes.map((b) => ({ label: b.label, shape: b.shape, base: b.base })),
    A_MINOR_REFERENCE
  );
});

test("C minor pentatonic Box3 is complete (regression for pattern C)", () => {
  // G minor Box3 / C minor Box3 previously rendered as a partial shape.
  const boxes = pentShapes(0, "minor");
  const box3 = boxes.find((b) => b.label === 3);
  assert.ok(box3, "Box3 must exist");
  // C minor pentatonic: C Eb F G Bb. Box3 = shape C at base 10 (D string anchor).
  // It must span 6 strings with 2 notes each (12 notes total).
  assert.equal(Object.keys(box3.notes).length, 12, "Box3 should have 12 notes (2 per string)");
  for (let s = 0; s < 6; s++) {
    const count = Object.keys(box3.notes).filter((k) => k.startsWith(`${s}|`)).length;
    assert.equal(count, 2, `Box3 string ${s} should have 2 notes`);
  }
});

test("C minor pentatonic Box5 is complete (regression for pattern E)", () => {
  // Box5 = shape E. It previously had only 10 notes (single note on D and G
  // strings), missing the note one fret below the anchor.
  const boxes = pentShapes(0, "minor");
  const box5 = boxes.find((b) => b.label === 5);
  assert.ok(box5, "Box5 must exist");
  assert.equal(box5.shape, "E", "Box5 is shape E");
  assert.equal(Object.keys(box5.notes).length, 12, "Box5 should have 12 notes (2 per string)");
  for (let s = 0; s < 6; s++) {
    const count = Object.keys(box5.notes).filter((k) => k.startsWith(`${s}|`)).length;
    assert.equal(count, 2, `Box5 string ${s} should have 2 notes`);
  }
});

test("every shape has 12 notes (2 per string)", () => {
  for (const [name, pat] of Object.entries(P.PENTPAT)) {
    const n = pat.reduce((a, o) => a + o.length, 0);
    assert.equal(n, 12, `shape ${name} should have 12 notes`);
  }
});
