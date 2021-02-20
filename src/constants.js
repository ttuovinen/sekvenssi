export const MODE = {
  DOWN: "DOWN",
  UP: "UP",
  BOTH: "BOTH",
  RANDOM: "RANDOM",
  DRUNK: "DRUNK",
  ONE: "ONE",
  MIMIC: "MIMIC",
  SKIP: "SKIP",
};

export const NOTE_LENGTHS = [1, 2, 3, 4, 6, 8, 16, 24, 32];

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const MIDI_NOTES = [...new Array(128)].map((_, idx) => {
  const note = NOTES[(idx + NOTES.length) % NOTES.length];
  const octave = Math.floor(idx / NOTES.length) - 1;
  return `${note}${octave}`;
});
