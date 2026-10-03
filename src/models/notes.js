// Note / key model: pitch classes, note naming, intervals, circle of fourths.

export const CIRCLE = ["C", "F", "Bb", "Eb", "Ab", "Db", "Gb", "B", "E", "A", "D", "G"];

export const PC = { C: 0, F: 5, Bb: 10, Eb: 3, Ab: 8, Db: 1, Gb: 6, B: 11, E: 4, A: 9, D: 2, G: 7 };

export const FLATKEYS = ["F", "Bb", "Eb", "Ab", "Db", "Gb"];

export const SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

export const INT = ["1", "2m", "2M", "3m", "3M", "4", "5dim", "5", "6m", "6M", "7m", "7M"];
export const INTFULL = ["Root", "2 minor", "2 Major", "3 minor", "3 Major", "4 Perfect", "5 diminished", "5 Perfect", "6 minor", "6 Major", "7 minor", "7 Major"];

// Note-name spelling to use for a key (flats for flat keys, sharps otherwise).
export function noteNames(key) {
  return FLATKEYS.indexOf(key) >= 0 ? FLAT : SHARP;
}
