export const MODE = {
  DOWN: "DOWN",
  UP: "UP",
  BOTH: "BOTH",
  RANDOM: "RANDOM",
  DRUNK: "DRUNK",
  ONE: "ONE",
  MIMIC: "MIMIC",
  SKIP: "SKIP",
  MUTE: "MUTE",
};

export const REPEAT_MODES = [
  MODE.DOWN,
  MODE.UP,
  MODE.BOTH,
  MODE.RANDOM,
  MODE.DRUNK,
];

// Note lengths
export const DIVIDENTS = [1, 2, 3, 4, 6, 8, 10, 12];
export const DENOMINATORS = [1, 2, 4, 8, 16, 32];

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const MIDI_NOTES = [...new Array(128)].map((_, idx) => {
  const note = NOTES[(idx + NOTES.length) % NOTES.length];
  const octave = Math.floor(idx / NOTES.length) - 1;
  return `${note}${octave}`;
});

export const SCALES = {
  "Major penta": [0, 2, 4, 7, 9, 12],
  "Minor penta": [0, 3, 5, 7, 10, 12],
  Major: [0, 2, 4, 5, 7, 9, 11, 12],
  "Natural minor": [0, 2, 3, 5, 7, 8, 10, 12],
  "Harmonic minor": [0, 2, 3, 5, 7, 8, 11, 12],
  "Jazz minor": [0, 2, 3, 5, 7, 9, 11, 12],
  "Hungarian minor": [0, 2, 3, 6, 7, 8, 11, 12],
  Dorian: [0, 2, 3, 5, 7, 9, 10, 12],
  Phrygian: [0, 1, 3, 5, 7, 8, 10, 12],
  Lydian: [0, 2, 4, 6, 7, 9, 11, 12],
  Mixolydian: [0, 2, 4, 5, 7, 9, 10, 12],
  Locrian: [0, 1, 3, 5, 6, 8, 10, 12],
  "Major blues": [0, 2, 3, 4, 7, 9, 12],
  "Minor blues": [0, 3, 5, 6, 7, 10, 12],
};

export const ecamplePattern = [
  [[0, 3, 7, -5, -4], "BOTH"],
  [[12, 10, 8, 8], "DOWN", { repeat: 4 }],
  [[0], "MIMIC", { mimicStep: 0, transpose: 12 }],
  [[0], "MIMIC", { mimicStep: 1, transpose: -5 }],
];
