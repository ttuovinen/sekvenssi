<script lang="ts">
  import Sequencer from "./Sequencer.svelte";
  import { MidiPlayer } from "./midiplayer";

  let isInitialized = false;
  let noMidiApi = false;

  const midi = new MidiPlayer();

  const initialize = async () => {
    try {
      isInitialized = await midi.initialize();
    } catch (err) {
      noMidiApi = true;
    }
  };

  initialize();
</script>

<main>
  <h1>SEKVENSSI²</h1>
  {#if isInitialized}
    MIDI OUT
    <!-- svelte-ignore a11y-no-onchange -->
    <select class="control-input" on:change={midi.changeOutput}>
      {#each midi.outputs as option, idx}
        <option value={idx}>
          {option.name}
        </option>
      {/each}
    </select>
    <Sequencer {midi} />
  {/if}

  {#if noMidiApi}
    <h3>
      Your browser does not support Web MIDI API yet :(<br />Try again with
      up-to-date Brave, Chromium/Chrome or Edge
    </h3>
  {/if}

  <footer class="app-footer">
    Experimental MIDI sequencer concept | Teemu T. Tuovinen 2021
  </footer>
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    margin: 0 auto;
  }

  h1 {
    color: #7de4e4;
    text-transform: uppercase;
    font-size: 3.5em;
    letter-spacing: 0.05em;
    font-weight: 200;
  }
  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }

  .control-input {
    margin: 0 16px 36px;
  }

  .app-footer {
    margin: 64px auto 32px;
    color: #aaa;
    padding: 0 16px;
    text-align: center;
    font-weight: normal;
  }
</style>
