<script>
  import Sequencer from "./Sequencer.svelte";
  import MidiPlayer from "./midiplayer";

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
  <h1>SEKVENSSI!</h1>
  {#if isInitialized}
    <Sequencer {midi} />
  {/if}

  {#if noMidiApi}
    <h3>
      Your browser does not support Web MIDI API yet :(<br />Try again with
      up-to-date Brave, Chromium/Chrome or Edge
    </h3>
  {/if}

  <footer class="app-footer">
    Experimental monophonic midi sequencer | Teemu T. Tuovinen 2021
  </footer>
</main>

<style>
  :global(body) {
    color: #eee;
    background: #222;
  }
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  h1 {
    color: #ec00fb;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }

  .app-footer {
    margin: 64px auto 32px;
    color: #aaa;
    padding: 0 16px;
    text-align: center;
    font-weight: normal;
  }
</style>
