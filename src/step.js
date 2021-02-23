import { MODE } from "./constants";

const modeSpecificDefaults = {
  direction: 1,
  mimicStep: 0,
  transpose: 0,
  repeat: 1,
};

function Step(
  notes = [0],
  mode = MODE.DOWN,
  modeSpecific = modeSpecificDefaults
) {
  this.notes = notes;
  this.mode = mode;
  this.current = null;
  this.queued = null;
  this.index = -1;
  this.counter = 1; // for repeat
  this.modeSpecific = { ...modeSpecificDefaults, ...modeSpecific };

  this.reset = () => {
    this.index = -1;
    this.counter = 1;
    this.current = null;
  };

  this.setMode = (newMode) => {
    if (Object.values(MODE).includes(newMode)) {
      this.mode = newMode;
    }
  };

  this.setNote = (idx, note) => {
    this.notes[idx] = note === "" ? null : note;
  };

  this.setNotes = (newNotes = []) => {
    this.notes = [...newNotes];
  };

  this.queueNote = (idx) => {
    this.queued = idx;
  };

  this.addNote = () => {
    this.notes.push(0);
  };

  this.deleteNote = (delIdx) => {
    this.notes = this.notes.filter((_, idx) => idx !== delIdx);
  };

  this.next = () => {
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
          const direction = Math.floor(Math.random() * 3) - 1; // -1, 0 or 1
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

export default Step;
