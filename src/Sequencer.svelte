<script>
  import { MODE, MIDI_NOTES } from "./constants";
  import Step from "./step";

  const modeOptions = Object.values(MODE);

  // props
  export let midi;

  // state
  let steps = [];
  let stepState = []; // copy parts of steps inner state for reactive UI
  let cursor = -1;
  let isPlaying = false;
  let bpm = 120; // bpm
  let gate = 80; // % of speed
  let base = 40; // E2
  let importString = "";

  $: speed = Math.round(60000 / bpm) / 2;

  const refreshStepState = () => {
    stepState = steps.map(({ index, notes, mode }) => ({ index, notes, mode }));
    console.log(bpm, speed);
  };

  const initialize = async () => {
    const step1 = new Step([0, 3, 7, -5, -4], MODE.BOTH);
    const step2 = new Step([12, 10, 8], MODE.LINEAR);
    steps = [step1, step2];
    refreshStepState();
  };

  const nextStep = () => {
    cursor += 1;
    if (cursor >= steps.length) {
      cursor = 0;
    }
    if (steps[cursor].mode === MODE.SKIP) {
      nextStep();
    }
  };

  const handleAddNote = (step) => {
    step.addNote(0);
    refreshStepState();
  };

  const handleDeleteNote = (step, nIdx) => {
    step.deleteNote(nIdx);
    refreshStepState();
  };

  const handleChangeMode = (step, newMode) => {
    step.setMode(newMode);
    refreshStepState();
  };

  const tick = () => {
    if (isPlaying) {
      nextStep();
      const note =
        steps[cursor].mode === MODE.MIMIC
          ? steps[0].current
          : steps[cursor].next();
      if (note !== null) {
        midi.play(base + note, speed, gate);
      }
      setTimeout(tick, speed);
      refreshStepState();
    }
  };

  const play = () => {
    if (!isPlaying) {
      isPlaying = true;
      tick();
    } else {
      isPlaying = false;
    }
  };

  const stop = () => {
    isPlaying = false;
    steps.forEach((item) => (item.index = -1));
    cursor = -1;
    refreshStepState();
  };

  const addStep = () => {
    steps.push(new Step());
    refreshStepState();
  };

  const deleteStep = (delIdx) => {
    steps = steps.filter((_, idx) => idx !== delIdx);
    refreshStepState();
  };

  const clearAll = () => {
    isPlaying = false;
    cursor = -1;
    steps = [new Step()];
    refreshStepState();
  };

  const exportAll = () => {
    const output = JSON.stringify({
      steps: stepState.map(({ notes, mode }) => ({ notes, mode })),
      bpm,
      gate,
    });
    navigator.clipboard.writeText(output);
  };

  const importAll = () => {
    try {
      stop();
      const settings = JSON.parse(importString);
      bpm = settings.bpm;
      gate = settings.gate;
      steps = settings.steps.map((item) => new Step(item.notes, item.mode));
      refreshStepState();
    } catch (err) {
      console.log(err);
      alert("Import failed ;_; Check the data");
    }
  };

  initialize();
</script>

<!-- Controls  -->
<label class="control-slider"
  >Speed
  <input
    type="range"
    value={bpm}
    min="30"
    max="320"
    on:change={(e) => (bpm = e.target.value)}
  />
  {bpm} bpm
</label>
<label class="control-slider"
  >Gate
  <input
    type="range"
    value={gate}
    min="1"
    max="99"
    on:change={(e) => (gate = e.target.value)}
  />
  {gate} %
</label>
<div class="control-slider">
  Base note
  <input class="base" type="number" bind:value={base} min="24" max="100" />
  {MIDI_NOTES[base]}
</div>
<button on:click={play}>PLAY</button>
<button on:click={stop}>STOP</button>
<button on:click={clearAll}>CLEAR</button>

<!-- Steps  -->
<div class="steps">
  {#each steps as step, idx}
    <div
      class="step step--{stepState[idx].mode}"
      class:step--active={cursor === idx}
    >
      <button class="step-xp" on:click={() => deleteStep(idx)}>x</button>
      <div class="step__label">{idx + 1}</div>
      <!-- svelte-ignore a11y-no-onchange -->
      <select
        value={step.mode}
        on:change={(e) => handleChangeMode(step, e.target.value)}
      >
        {#each modeOptions as option}
          <option value={option} disabled={idx === 0 && option === MODE.MIMIC}>
            {option}
          </option>
        {/each}
      </select>
      {#each stepState[step.mode === MODE.MIMIC ? 0 : idx].notes || [] as _, nIdx}
        <div>
          <input
            class="note"
            class:note--active={stepState[step.mode === MODE.MIMIC ? 0 : idx]
              .index === nIdx}
            type="number"
            value={stepState[step.mode === MODE.MIMIC ? 0 : idx].notes[nIdx]}
            min="-24"
            max="24"
            on:change={(e) => step.setNote(nIdx, e.target.value)}
          />
          <button on:click={() => handleDeleteNote(step, nIdx)}>x</button>
        </div>
      {/each}
      <button on:click={() => handleAddNote(step)}>+</button>
    </div>
  {/each}
  <div class="step step--side">
    <button class="step-xp" on:click={addStep}>+</button>
  </div>
</div>

<div>
  <input bind:value={importString} placeholder="paste import here..." />
  <button on:click={importAll} disabled={!importString.length}>IMPORT</button>
  <button on:click={exportAll}>EXPORT</button>
</div>

<!-- Steps  -->
<style>
  .control-slider {
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .control-slider input {
    margin: 0 16px;
  }
  .step--active .step__label {
    color: yellow;
    font-weight: bold;
    text-shadow: 0 0 2px 4px orange;
  }
  .steps {
    display: flex;
    width: min-content;
    margin: 32px auto;
  }
  :global(button) {
    cursor: pointer;
  }
  .step-xp {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    color: white;
    background: none;
  }
  .step-xp:hover {
    background: #555;
  }
  .step {
    margin: 8px;
  }
  .step--skip .note {
    background: #333;
    color: #999;
  }
  .step--MIMIC .note {
    opacity: 0.5;
    transform: scale(0.8);
  }
  .note--active {
    border-color: orange;
    background: yellow;
  }
  .step--active .note--active {
    background: orange;
    box-shadow: 0 0 2px 1px yellow;
  }
</style>
