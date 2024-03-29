<script lang="ts">
  import {
    MODE,
    REPEAT_MODES,
    MIDI_NOTES,
    DIVIDENTS,
    DENOMINATORS,
    SCALES,
    EXAMPLE_PATTERN,
  } from "./constants";
  import type { MidiPlayer } from "./midiplayer";
  import { Step } from "./step";

  const modeOptions = Object.values(MODE);

  // props
  export let midi: MidiPlayer;

  // state
  let steps = [];
  let stepState = []; // copy parts of steps inner state here for reactive UI
  let cursor = -1; // index of the current step
  let isPlaying = false;
  let importString = "";
  let settings = {
    bpm: 120,
    gate: 30, // % of speed
    base: 52, // E3
    divident: 1,
    denominator: 16,
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
    steps = EXAMPLE_PATTERN.map((item) => new Step(...item));
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

  const handleAddNote = (step: Step) => {
    step.addNote();
    refreshStepState();
  };

  const handleSetNote = (
    evt: Event & { currentTarget: EventTarget & HTMLInputElement },
    step: Step,
    nIdx: number
  ) => {
    const note = evt.currentTarget.value;
    step.setNote(nIdx, note !== "" ? Number(note) : null);
  };

  const handleSetNotes = (
    evt: Event & { currentTarget: EventTarget & HTMLSelectElement },
    step: Step
  ) => {
    const notes = SCALES[evt.currentTarget.value];
    step.setNotes(notes);
    // reset all fill action dropdowns
    [...document.getElementsByClassName("fill-selector")].forEach(
      (item: HTMLSelectElement) => {
        item.selectedIndex = 0;
      }
    );
    refreshStepState();
  };

  const handleSetModeSpecific = (
    evt: Event & {
      currentTarget: EventTarget & (HTMLInputElement | HTMLSelectElement);
    },
    step: { modeSpecific: ModeSpecific },
    key: string
  ) => {
    const value =
      key === "wrap"
        ? (evt.currentTarget as HTMLInputElement).checked
        : Number(evt.currentTarget.value);
    step.modeSpecific[key] = value;
    refreshStepState();
  };

  const handleDeleteNote = (step: Step, nIdx: number) => {
    step.deleteNote(nIdx);
    refreshStepState();
  };

  const handleQueueNote = (step: Step, nIdx: number) => {
    step.queueNote(nIdx);
    refreshStepState();
  };

  const handleChangeMode = (
    evt: Event & { currentTarget: EventTarget & HTMLSelectElement },
    step: Step
  ) => {
    step.setMode(evt.currentTarget.value);
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
  };

  const addStep = () => {
    steps.push(new Step());
    refreshStepState();
  };

  const deleteStep = (delIdx: number) => {
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
      steps = (input.steps as StepArray).map((item) => new Step(...item));
      refreshStepState();
    } catch (err) {
      console.log(err);
      alert("Import failed ;_; Check the data");
    }
  };

  const handleKeydown = (evt: KeyboardEvent) => {
    // Play/pause with space bar
    if (evt.key === " ") {
      evt.preventDefault();
      play();
    }
    if (evt.key === "Shift") {
      evt.preventDefault();
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
<button on:click={clearAll}>CLEAR PATTERN</button>

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
        on:change={(evt) => handleChangeMode(evt, step)}
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
            aria-label="step {idx + 1} note {nIdx + 1}"
            disabled={stepState[idx].mode === MODE.MIMIC}
            value={step.mode === MODE.MIMIC
              ? stepState[step.modeSpecific.mimicStep].notes[nIdx] +
                step.modeSpecific.transpose
              : stepState[idx].notes[nIdx]}
            min="-24"
            max="24"
            on:change={(evt) => handleSetNote(evt, step, nIdx)}
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
          <label>
            Repeat
            <input
              type="number"
              value={stepState[idx].modeSpecific.repeat}
              on:change={(evt) => handleSetModeSpecific(evt, step, "repeat")}
              min="1"
              max="32"
            />
          </label>
          {#if stepState[idx].mode === MODE.DRUNK}
            <label>
              <input
                type="checkbox"
                checked={stepState[idx].modeSpecific.wrap}
                on:change={(evt) => handleSetModeSpecific(evt, step, "wrap")}
              />
              Wrap
            </label>
          {/if}
        </div>
      {/if}
      {#if stepState[idx].mode === MODE.MIMIC}
        <div class="mode-specific-settings">
          <label>
            Mimic step
            <!-- svelte-ignore a11y-no-onchange -->
            <select
              class="select-mimic"
              value={stepState[idx].modeSpecific.mimicStep}
              on:change={(evt) => handleSetModeSpecific(evt, step, "mimicStep")}
            >
              {#each new Array(idx) as _, option}
                <option value={option}>
                  {option + 1}
                </option>
              {/each}
            </select>
          </label>
          <label>
            Transpose
            <input
              type="number"
              value={stepState[idx].modeSpecific.transpose}
              on:change={(evt) => handleSetModeSpecific(evt, step, "transpose")}
              min="-24"
              max="24"
            />
          </label>
        </div>
      {/if}
      {#if stepState[idx].mode !== MODE.MIMIC}
        <!-- svelte-ignore a11y-no-onchange -->
        <select
          class="fill-selector"
          value={null}
          aria-label="Fill step with a scale"
          on:change={(evt) => handleSetNotes(evt, step)}
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
  <h2 class="sub-title">Import / export pattern</h2>
  <input
    bind:value={importString}
    aria-label="Import string"
    placeholder="paste import here..."
  />
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
    transform: scale(0.8);
  }
  .note--active {
    border-color: orange;
    background: yellow;
  }
  .note:disabled {
    color: black;
  }
  .note:disabled:not(.note--active) {
    background: #999;
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
    margin-top: 92px;
  }
  .sub-title {
    margin: 0 0 24px;
    font-weight: normal;
    font-size: 1.2rem;
  }
</style>
