<script>
  import {
    MODE,
    MIDI_NOTES,
    DIVIDENTS,
    DENOMINATORS,
    SCALES,
  } from "./constants";
  import Step from "./step";

  const modeOptions = Object.values(MODE);

  // props
  export let midi;

  // state
  let steps = [];
  let stepState = []; // copy parts of steps inner state here for reactive UI
  let cursor = -1; // index of the current step
  let isPlaying = false;
  let importString = "";
  let settings = {
    bpm: 120,
    gate: 80, // % of speed
    base: 40, // E2
    divident: 1,
    denominator: 8,
  };

  $: speed =
    (Math.round(60000 / settings.bpm) * 4 * settings.divident) /
    settings.denominator;

  const refreshStepState = () => {
    stepState = steps.map(({ index, notes, mode, queued, modeSpecific }) => ({
      index,
      notes,
      mode,
      queued,
      modeSpecific,
    }));
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

  const handleSetNote = (step, nIdx, note) => {
    step.setNote(nIdx, note !== "" ? Number(note) : null);
  };

  const handleSetNotes = (step, notes) => {
    step.setNotes(notes);
    // reset all fill action dropdowns
    [...document.getElementsByClassName("fill-selector")].forEach((item) => {
      item.selectedIndex = 0;
    });
    refreshStepState();
  };

  const handleSetModeSpecific = (step, key, value) => {
    step.modeSpecific[key] = value;
    refreshStepState();
  };

  const handleDeleteNote = (step, nIdx) => {
    step.deleteNote(nIdx);
    refreshStepState();
  };

  const handleQueueNote = (step, nIdx) => {
    step.queueNote(nIdx);
    refreshStepState();
  };

  const handleChangeMode = (step, newMode) => {
    step.setMode(newMode);
    refreshStepState();
  };

  const tick = () => {
    if (isPlaying) {
      nextStep();
      const step = steps[cursor];
      const note =
        step.mode === MODE.MIMIC
          ? steps[step.modeSpecific.mimicStep].current +
            step.modeSpecific.transpose
          : step.next();
      if (note !== null && step.mode !== MODE.MUTE) {
        midi.play(settings.base + note, speed, settings.gate);
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
    // update mimicSteps
    steps.forEach((step) => {
      if (step.modeSpecific.mimicStep > delIdx) {
        step.modeSpecific.mimicStep -= 1;
      }
    });
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
    try {
      const output = JSON.stringify({
        steps: steps.map(({ notes, mode, modeSpecific }) => [
          notes,
          mode,
          modeSpecific,
        ]),
        settings,
      });
      navigator.clipboard.writeText(output);
      setTimeout(
        () => alert("Exported to clipboard! Paste somehere safe."),
        100
      );
    } catch (err) {
      alert("Export failed :(");
    }
  };

  const importAll = () => {
    try {
      stop();
      const input = JSON.parse(importString);
      settings = input.settings;
      steps = input.steps.map((item) => new Step(...item));
      refreshStepState();
    } catch (err) {
      console.log(err);
      alert("Import failed ;_; Check the data");
    }
  };

  initialize();
</script>

<!-- Controls  -->
<label class="control-item"
  >Speed
  <input
    class="control-input"
    type="number"
    bind:value={settings.bpm}
    min="30"
    max="320"
  />
  bpm
</label>
<label class="control-item">
  Base note
  <input
    class="control-input"
    type="number"
    bind:value={settings.base}
    min="0"
    max="115"
  />
  {MIDI_NOTES[settings.base]}
</label>
<label class="control-item">
  Note length:
  <select class="control-input" bind:value={settings.divident}>
    {#each DIVIDENTS as option}
      <option value={option}>
        {option}
      </option>
    {/each}
  </select>
  /
  <select class="control-input" bind:value={settings.denominator}>
    {#each DENOMINATORS as option}
      <option value={option}>
        {option}
      </option>
    {/each}
  </select>
</label>
<label class="control-item"
  >Gate
  <input
    class="control-input"
    type="range"
    bind:value={settings.gate}
    min="1"
    max="99"
  />
  {settings.gate} %
</label>
<button on:click={play}>PLAY</button>
<button on:click={stop}>STOP</button>
<button on:click={clearAll}>CLEAR</button>

<!-- Steps  -->
<div class="steps">
  {#each steps as step, idx}
    <div
      class="step step--{stepState[idx].mode.toLowerCase()}"
      class:step--active={cursor === idx}
    >
      <button class="step-xp" on:click={() => deleteStep(idx)}>x</button>
      <div class="step__label">STEP {idx + 1}</div>
      <!-- svelte-ignore a11y-no-onchange -->
      <select
        class="select-mode"
        value={stepState[idx].mode}
        on:change={(e) => handleChangeMode(step, e.target.value)}
      >
        {#each modeOptions as option}
          <option value={option} disabled={idx === 0 && option === MODE.MIMIC}>
            {option}
          </option>
        {/each}
      </select>

      <!-- Notes -->
      {#each stepState[stepState[idx].mode === MODE.MIMIC ? stepState[idx].modeSpecific.mimicStep : idx].notes || [] as _, nIdx}
        <div class="note-wrapper">
          {#if stepState[idx].mode !== MODE.MIMIC}
            <button
              class="queue-note"
              class:queue-note--active={stepState[idx].queued === nIdx}
              on:click={() => handleQueueNote(step, nIdx)}
              aria-label="queue note"
            />
          {/if}
          <input
            class="note"
            class:note--active={stepState[
              step.mode === MODE.MIMIC
                ? stepState[idx].modeSpecific.mimicStep
                : idx
            ].index === nIdx}
            type="number"
            value={step.mode === MODE.MIMIC
              ? stepState[step.modeSpecific.mimicStep].notes[nIdx] +
                step.modeSpecific.transpose
              : stepState[idx].notes[nIdx]}
            min="-24"
            max="24"
            on:change={(e) => handleSetNote(step, nIdx, e.target.value)}
          />
          {#if step.mode !== MODE.MIMIC}
            <button on:click={() => handleDeleteNote(step, nIdx)}>x</button>
          {/if}
        </div>
      {/each}
      {#if step.mode !== MODE.MIMIC}
        <button on:click={() => handleAddNote(step)}>+</button>
        <!-- svelte-ignore a11y-no-onchange -->
        <select
          class="fill-selector"
          value={null}
          on:change={(e) => handleSetNotes(step, SCALES[e.target.value])}
        >
          <option value={null} disabled> Fill with... </option>
          {#each Object.keys(SCALES) as scale}
            <option value={scale}>
              {scale}
            </option>
          {/each}
        </select>
      {/if}
      <!-- Mode specific settings -->
      <!-- svelte-ignore a11y-no-onchange -->
      {#if step.mode === MODE.MIMIC}
        <div class="mimic-settings">
          Mimic step
          <select
            class="select-mimic"
            value={stepState[idx].modeSpecific.mimicStep}
            on:change={(e) =>
              handleSetModeSpecific(step, "mimicStep", e.target.value)}
          >
            {#each new Array(idx) as _, option}
              <option value={option}>
                {option + 1}
              </option>
            {/each}
          </select>
          Transpose
          <input
            type="number"
            value={stepState[idx].modeSpecific.transpose}
            on:change={(e) =>
              handleSetModeSpecific(step, "transpose", Number(e.target.value))}
            min="-24"
            max="24"
          />
        </div>
      {/if}
    </div>
  {/each}
  <div class="step step--side">
    <button class="step-xp" on:click={addStep}>+</button>
  </div>
</div>

<div class="import-export">
  <input bind:value={importString} placeholder="paste import here..." />
  <button on:click={importAll} disabled={!importString.length}>IMPORT</button>
  <button on:click={exportAll}>EXPORT</button>
</div>

<!-- Steps  -->
<style>
  .control-item {
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .control-input {
    margin: 0 16px;
  }
  .step__label {
    margin-bottom: 8px;
  }
  .step--active .step__label {
    color: yellow;
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
    margin: 12px;
  }
  .note-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .queue-note {
    background: none;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 6px;
  }
  .queue-note--active {
    background: orange;
  }
  .step--skip .select-mode,
  .step--skip .note {
    background: #333;
    color: #999;
  }
  .step--mimic .note {
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
  .step--mute .note--active {
    background: #888;
  }
  .step--mute.step--active .note--active {
    background: #666;
  }
  .fill-selector {
    margin-top: 16px;
    max-width: 105px;
    background: none;
    color: #aaa;
    border: none;
    border-bottom: 1px solid #666;
  }
  .mimic-settings {
    display: flex;
    flex-direction: column;
    align-items: center;
    border: 1px solid #666;
    padding: 8px;
    border-radius: 16px;
  }
  .import-export {
    margin-top: 64px;
  }
</style>
