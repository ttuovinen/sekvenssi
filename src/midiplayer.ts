const NOTE_ON = 0x90;
const NOTE_OFF = 0x80;

export class MidiPlayer {
  access: WebMidi.MIDIAccess;
  outputs: WebMidi.MIDIOutput[];
  output: WebMidi.MIDIOutput;

  constructor() {
    this.access = null;
    this.outputs = [];
    this.output = null;
  }

  initialize = async () => {
    this.access = await navigator.requestMIDIAccess({ sysex: true });
    let promises = [];
    let outs = this.access.outputs.values();
    for (let out = outs.next(); out && !out.done; out = outs.next()) {
      promises.push(out.value.open());
    }
    this.outputs = await Promise.all(promises);
    this.output = this.outputs[0];
    return true;
  };

  keyUp = (note: number) => {
    this.output.send([NOTE_OFF, note, 0x7f]);
  };

  play = (note: number, speed: number, gate: number) => {
    if (note >= 0 && note <= 127) {
      this.output.send([NOTE_ON, note, 0x7f]);
      const length = Math.round((speed * gate) / 100);
      setTimeout(() => this.keyUp(note), length);
    }
  };

  changeOutput = (
    evt: Event & { currentTarget: EventTarget & HTMLSelectElement }
  ) => {
    const index = Number(evt.currentTarget.value);
    this.output = this.outputs[index];
  };
}
