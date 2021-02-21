import { MODE } from "./constants";

const modeSpecificDefaults = {
  direction: 1,
  mimicStep: 0,
  transpose: 0,
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
  this.modeSpecific = {...modeSpecific};

  this.setMode = (newMode) => {
    if (Object.values(MODE).includes(newMode)) {
      this.mode = newMode;
    }
  };

  this.setNote = (idx, note) => {
    this.notes[idx] = note === "" ? null : note;
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

    if (this.queued !== null) {
      this.index = this.queued;
      this.current = this.notes[this.index];
      this.queued = null;
      return this.current;
    }
  
    const len = this.notes.length;
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
