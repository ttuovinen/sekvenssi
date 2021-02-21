const NOTE_ON = 0x90;
const NOTE_OFF = 0x80;

function MidiPlayer() {
    this.access = null;
    this.output = null
    this.initialize = async () => {
        this.access = await navigator.requestMIDIAccess({sysex: true});
        this.output = this.access.outputs.values().next().value
        return true;
    }

    this.keyUp = (note) => {
        this.output.send([NOTE_OFF, note, 0x7f]);
    }

    this.play = (note, speed, gate) => {
        if (note >= 0 && note <= 127) {
            this.output.send([NOTE_ON, note, 0x7f]);
            const length = Math.round(speed*gate/100)
            setTimeout(() => this.keyUp(note), length);
        }
    }
}

export default MidiPlayer;