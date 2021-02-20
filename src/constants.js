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

const NOTES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

export const MIDI_NOTES = [...new Array(128)].map((_, idx) => {
  const note = NOTES[(idx + NOTES.length) % NOTES.length];
  const octave = Math.floor(idx / NOTES.length) - 1;
  return `${note}${octave}`;
});
