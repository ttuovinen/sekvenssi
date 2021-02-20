import { MODE } from "./constants";

function Step(notes = [0], mode = MODE.DOWN) {
  this.notes = notes;
  this.mode = mode;
  this.current = null;
  this.index = -1;
  this.direction = 1;

  this.setMode = (newMode) => {
    if (Object.values(MODE).includes(newMode)) {
      this.mode = newMode;

    }
  };

  this.setNote = (idx, note) => {
    this.notes[idx] = note === '' ? null : parseInt(note, 10);
  };

  this.addNote = () => {
    this.notes.push(0);
  };

  this.deleteNote = (delIdx) => {
    this.notes = this.notes.filter((_, idx) => idx !== delIdx)
  };

  this.next = () => {
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
        this.index = this.index + this.direction;
        if (this.index >= len) {
          this.direction = -1;
          this.index = len-2;
        }
        if (this.index < 0) {
          this.direction = 1;
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
          const direction = Math.floor(Math.random()*3)-1 // -1, 0 or 1
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
