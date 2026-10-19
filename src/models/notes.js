// Note / key model: pitch classes, note naming, intervals, circle of fourths.

export const CIRCLE = ["C", "F", "Bb", "Eb", "Ab", "Db", "Gb", "B", "E", "A", "D", "G"];

export const PC = { C: 0, F: 5, Bb: 10, Eb: 3, Ab: 8, Db: 1, Gb: 6, B: 11, E: 4, A: 9, D: 2, G: 7 };

export const FLATKEYS = ["F", "Bb", "Eb", "Ab", "Db", "Gb"];

export const SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

export const INT = ["1", "2m", "2M", "3m", "3M", "4", "5dim", "5", "6m", "6M", "7m", "7M"];
export const INTFULL = ["Root", "2 minor", "2 Major", "3 minor", "3 Major", "4 Perfect", "5 diminished", "5 Perfect", "6 minor", "6 Major", "7 minor", "7 Major"];

// One fixed color per interval (index = semitones from the root),
// plus a darker stroke shade and a readable text color for each fill.
export const IVCOL = ["#e8a33d", "#c34f8e", "#d94f3d", "#8e5bd6", "#4f74d6", "#2f9e8f", "#8a8d92", "#4d9e57", "#6f8f2f", "#d9c53f", "#946b4a", "#2aa7bf"];
export const IVSTK = ["#7a4a0a", "#6e2454", "#6e1f16", "#4b2a85", "#233f8a", "#14524c", "#3f4247", "#1f5423", "#3c4f13", "#8a7711", "#4a2f1a", "#0f5a68"];
export const IVTXT = ["#2a1a05", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#2a2505", "#ffffff", "#06333a"];

// Note-name spelling to use for a key (flats for flat keys, sharps otherwise).
export function noteNames(key) {
  return FLATKEYS.indexOf(key) >= 0 ? FLAT : SHARP;
}
