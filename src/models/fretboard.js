// Fretboard model: standard tuning, fret count, and fret geometry.
// Strings are ordered high e (index 0) to low E (index 5) unless noted.

export const OPEN = [64, 59, 55, 50, 45, 40];
export const NF = 23;

// SVG geometry: x of the nut, x of the last fret, y of the top string, gap between strings.
export const NUT = 76;
export const END = 1380;
export const TOP = 34;
export const GAP = 34;

// x of fret wire n, uniform spacing.
export function fx(n) {
  return NUT + (END - NUT) * n / NF;
}
