<script>
  import {
    MODE,
    REPEAT_MODES,
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
    gate: 60, // % of speed
    base: 52, // E3
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
    steps = [
      new Step([0, 3, 7, -5, -4], MODE.BOTH),
      new Step([12, 10, 8, 8], MODE.DOWN, { repeat: 4 }),
    ];
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
    steps.forEach((item) => {
      item.reset();
    });
    cursor = -1;
    refreshStepState();
  };

  const restart = async () => {
    steps.forEach((item) => {
      item.reset();
    });
    cursor = -1;
    refreshStepState();
  }

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

  const handleKeydown = (event) => {
    // Play/pause with space bar
    if (event.key === " ") {
      event.preventDefault();
      play();
    }
    if (event.key === "Shift") {
      event.preventDefault();
      restart();
    }
  };

  initialize();
</script>

<svelte:window on:keydown={handleKeydown} />

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
  Note length
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
<button on:click={restart}>RESTART</button>
<button on:click={clearAll}>CLEAR</button>

<!-- Steps  -->
<div class="steps">
  {#each steps as step, idx}
    <div
      class="step step--{stepState[idx].mode.toLowerCase()}"
      class:step--active={cursor === idx}
    >
      <button class="xp xp--x step-xp" on:click={() => deleteStep(idx)}
        >x</button
      >
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
            <button
              class="xp xp--x note-xp"
              on:click={() => handleDeleteNote(step, nIdx)}>x</button
            >
          {/if}
        </div>
      {/each}
      {#if stepState[idx].mode !== MODE.MIMIC}
        <div class="note-add-wrapper">
          <button class="xp xp--p note-xp" on:click={() => handleAddNote(step)}
            >+</button
          >
        </div>
      {/if}
      <!-- Mode specific settings -->
      <!-- svelte-ignore a11y-no-onchange -->
      {#if REPEAT_MODES.includes(stepState[idx].mode)}
        <div class="mode-specific-settings">
          Repeat
          <input
            type="number"
            value={stepState[idx].modeSpecific.repeat}
            on:change={(e) =>
              handleSetModeSpecific(step, "repeat", Number(e.target.value))}
            min="1"
            max="32"
          />
        </div>
      {/if}
      {#if stepState[idx].mode === MODE.MIMIC}
        <div class="mode-specific-settings">
          Mimic step
          <!-- svelte-ignore a11y-no-onchange -->
          <select
            class="select-mimic"
            value={stepState[idx].modeSpecific.mimicStep}
            on:change={(e) =>
              handleSetModeSpecific(step, "mimicStep", Number(e.target.value))}
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
      {#if stepState[idx].mode !== MODE.MIMIC}
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
    </div>
  {/each}
  <div class="step step--side">
    <button class="xp xp--p step-xp" on:click={addStep}>+</button>
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
  .xp {
    font-family: "Roboto Mono", monospace;
    margin: 0;
    padding: 0;
    line-height: 0;
    border-radius: 50%;
  }
  .xp--x:hover {
    background: #f005;
  }
  .xp--p:hover {
    background: #0f05;
  }
  .step-xp {
    width: 32px;
    height: 32px;
    color: white;
    background: none;
    margin-bottom: 16px;
    font-size: 18px;
  }
  .step {
    margin: 12px;
  }
  .note-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
  }
  .note-add-wrapper {
    margin: 12px;
  }
  .queue-note {
    background: none;
    width: 16px;
    height: 16px;
    border: 1px solid #888;
    background: #fff1;
    border-radius: 50%;
    box-shadow: 0 0 1px 4px #0003;
    margin: 4px;
    padding: 0;
  }
  .queue-note--active {
    background: orange;
  }
  .note {
    margin: 0 6px;
  }
  .note-xp {
    width: 24px;
    height: 24px;
    font-size: 14px;
    color: white;
    background: none;
  }
  .step--skip .select-mode,
  .step--skip .note,
  .step--one .note:not(.note--active) {
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
    border-radius: 0;
    border-bottom: 1px solid #fff2;
  }
  .mode-specific-settings {
    display: flex;
    flex-direction: column;
    align-items: center;
    border: 1px solid #666;
    padding: 8px;
    border-radius: 16px;
  }
  .mode-specific-settings input,
  .mode-specific-settings select {
    margin: 8px 0;
  }
  .import-export {
    margin-top: 64px;
  }
</style>
