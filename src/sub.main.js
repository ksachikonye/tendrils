/**
 * Entry point.
 * @main Index
 */

import tendrilsDemo from './demo.main';

const { PI: pi } = Math;

const dev = location.hostname.search(/.webflow.io$/gi) < 0;

const stopEffect = (e) => e.preventDefault();
const stopBubble = (e) => e.stopPropagation();

function stopEvent(e) {
  stopEffect(e);
  stopBubble(e);
}

const readyStates = ['loading', 'interactive', 'complete'];

const triggerTimes = {
  spawnForm: [2e2, 3e2],
  spawnFlow: [2e2, 3e2],
  spawnFastest: [2e2, 3e2],
  def: [2e2]
};

// Load in stages.
let readyCallbacks = {
  loading: () => document.addEventListener('readystatechange', updateState),
  interactive() {
    const canvas = document.querySelector('canvas');
    let preset = 'S:Intro';
    // let preset = 'S:Awe';
    // let preset = 'S:Wonder';
    // let preset = 'S:Euphoria';
    // let preset = 'S:Inspiration';
    // let preset = 'S:Transcendence';
    // let preset = 'S:Basking';
    // let preset = 'S:Subscribe';

    const tendrils = tendrilsDemo(canvas, {
      use_media: false, use_mic: false, edit: false, keyboard: false, preset
    });

    const { appSettings, track, geometrySpawner, controls, presets } = tendrils;
    const { toggleTrack, toggleMedia, getMedia, restartAudio } = tendrils;

    canvas.classList.add('epok-dark');

    document.body.appendChild(track);
    track.querySelector('source').type = 'audio/mpeg';
    track.loop = true;
    track.controls = true;

    const { radii, obtuse, arcs } = geometrySpawner.shuffles;

    radii[0] = 0.2;
    radii[1] = 0.4;
    arcs[0] = 0.1;
    arcs[1] = 0.03;
    obtuse.rate = 0;

    const rootClass = document.documentElement.classList;

    function updateRootAudio(on = !track.paused) {
      rootClass.toggle('tendrils-audio-on', on);
      rootClass.toggle('tendrils-audio-off', !on);
    }

    function updateRootVideo(on = appSettings.useMedia) {
      rootClass.toggle('tendrils-video-on', on);
      rootClass.toggle('tendrils-video-off', !on);
    }

    updateRootAudio();
    updateRootVideo();

    /** @see [Intersection-based infinite scroll example](https://googlechrome.github.io/samples/intersectionobserver/) */
    const intersector = new IntersectionObserver((all) => {
        const to = all.reduce((e0, e1) => {
            const { isIntersecting, intersectionRatio: r1, time, target } = e1;

            if(!isIntersecting) { return e0; }

            const { tendrilsTrigger, tendrilsPreset } = target.dataset;
            const f = tendrilsTrigger && controls[tendrilsTrigger];

            f && console.log(tendrilsTrigger,
              (triggerTimes[tendrilsTrigger] || triggerTimes.def)
                .forEach((t) => setTimeout(f, t)));

            if(!tendrilsPreset) { return e0; }
            else if(!e0) { return e1; }

            const { intersectionRatio: r0, time: t0 } = e0;

            return (((r1 > r0) || ((r1 === r0) && (time > t0)))? e1 : e0);
          },
          null);

        if(!to) { return; }

        const p = to.target.dataset.tendrilsPreset;
        const f = p && (preset !== p) && presets[preset = p];

        f && f();
      },
      { threshold: 0, root: null, rootMargin: '-49% 0%' });

    document.querySelectorAll('[data-tendrils-preset], [data-tendrils-trigger]')
      .forEach((e) => intersector.observe(e));

    document.querySelectorAll('.tendrils-audio').forEach(($e) =>
      $e.addEventListener('click', (e) => {
        Promise.resolve(toggleTrack())
          .catch((e) => ((dev)? console.log : alert)(e))
          .finally(() => updateRootAudio());

        restartAudio();
        stopEvent(e);
      }));

    document.querySelectorAll('.tendrils-video').forEach(($e) =>
      $e.addEventListener('click', (e) => {
        toggleMedia();
        updateRootVideo();
        restartAudio();
        stopEvent(e);
      }));

    document.querySelectorAll('.activate-cam').forEach(($e) =>
      $e.addEventListener('click', () => {
        if(!appSettings.useMedia) {
          getMedia();
          updateRootVideo();
        }
      }));

    document.removeEventListener('readystatechange', updateState);
  }
};

let last = 0;

function updateState() {
  for(let s = readyStates.indexOf(document.readyState); last <= s; ++last) {
    let callback = readyCallbacks[readyStates[last]];

    if(callback) {
      try { callback(); }
      catch(e) { console.error(e); }
    }
  }
}

updateState();
