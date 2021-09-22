import { MODE } from "./constants";

const modeSpecificDefaults: ModeSpecific = {
  direction: 1,
  mimicStep: 0,
  transpose: 0,
  repeat: 1,
  wrap: true,
};

export class Step {
  notes: number[];
  mode: string;
  current: number;
  queued: number;
  index: number;
  counter: number;
  modeSpecific: ModeSpecific;

  constructor(
    notes: number[] = [0],
    mode = MODE.DOWN,
    modeSpecific: ModeSpecific = modeSpecificDefaults
  ) {
    this.notes = notes;
    this.mode = mode;
    this.current = null;
    this.queued = null;
    this.index = -1;
    this.counter = 1; // for repeat
    this.modeSpecific = { ...modeSpecificDefaults, ...modeSpecific };
  }

  reset = () => {
    this.index = -1;
    this.counter = 1;
    this.current = null;
  };

  setMode = (newMode: string) => {
    if (Object.values(MODE).includes(newMode)) {
      this.mode = newMode;
    }
  };

  setNote = (idx: number, note: number) => {
    this.notes[idx] = note;
  };

  setNotes = (newNotes: number[] = []) => {
    this.notes = [...newNotes];
  };

  queueNote = (idx: number) => {
    this.queued = idx;
  };

  addNote = () => {
    this.notes.push(0);
  };

  deleteNote = (delIdx: number) => {
    this.notes = this.notes.filter((_: number, idx: number) => idx !== delIdx);
  };

  next = () => {
    const len = this.notes.length;

    if (this.queued !== null) {
      this.index = this.queued < len ? this.queued : len - 1;
      this.current = this.notes[this.index];
      this.queued = null;
      this.counter += 1;
      return this.current;
    }

    if (this.counter < this.modeSpecific.repeat) {
      this.counter += 1;
      if (this.index >= 0) {
        return this.current;
      }
    }
    this.counter = 1;

    switch (this.mode) {
      case MODE.DOWN:
        this.index = (this.index + 1 + len) % len;
        break;

      case MODE.UP:
        if (this.index < 0) {
          this.index = len - 1;
        } else {
          this.index = (this.index - 1 + len) % len;
        }
        break;

      case MODE.BOTH:
        if (len === 1) {
          this.index = 0;
          break;
        }
        this.index = this.index + this.modeSpecific.direction;
        if (this.index >= len) {
          this.modeSpecific.direction = -1;
          this.index = len - 2;
        }
        if (this.index < 0) {
          this.modeSpecific.direction = 1;
          this.index = 1;
        }
        break;

      case MODE.RANDOM:
        if (this.index < 0) {
          this.index = 0;
        }
        this.index = Math.floor(Math.random() * len);
        break;

      case MODE.DRUNK:
        if (this.index < 0) {
          this.index = 0;
        } else {
          let direction = Math.floor(Math.random() * 3) - 1; // -1, 0 or 1
          if (
            !this.modeSpecific.wrap &&
            (this.index + direction < 0 || this.index + direction >= len)
          ) {
            direction *= -1;
          }
          this.index = (this.index + direction + len) % len;
        }
        break;

      case MODE.ONE:
      default:
        if (this.index < 0) {
          this.index = 0;
        }
        break;
    }

    this.current = this.notes[this.index];
    return this.current;
  };
}
