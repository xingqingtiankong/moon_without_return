"use strict";
globalThis.MoonSound = (() => {
    let context = null, clock = 0, lastDish = 0, lastStep = 0;

    function unlock() {
        if (!context) {
            const Audio = window.AudioContext || window.webkitAudioContext;
            if (Audio) context = new Audio();
        }
        context?.resume().catch(() => {
        });
    }

    function tone(frequency, duration = .12, volume = .025, type = 'sine') {
        if (!context || context.state !== 'running') return;
        const o = context.createOscillator(), g = context.createGain(), t = context.currentTime;
        o.type = type;
        o.frequency.value = frequency;
        g.gain.setValueAtTime(volume, t);
        g.gain.exponentialRampToValueAtTime(.0001, t + duration);
        o.connect(g).connect(context.destination);
        o.start();
        o.stop(t + duration);
    }

    function noise(duration = .25, volume = .018) {
        if (!context || context.state !== 'running') return;
        const b = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate),
            a = b.getChannelData(0);
        for (let i = 0; i < a.length; i++) a[i] = (Math.random() * 2 - 1) * (1 - i / a.length);
        const n = context.createBufferSource(), g = context.createGain();
        n.buffer = b;
        g.gain.value = volume;
        n.connect(g).connect(context.destination);
        n.start();
    }

    function tick(dt, map, state, moving) {
        clock += dt;
        if (map.startsWith('F') && !state.flags.dishes_silent && clock - lastDish > 5) {
            lastDish = clock;
            if (state.family_state !== 'S1' || Math.sin(clock) > .3) {
                tone(1300, .12, .008);
                tone(1900, .08, .005);
            }
        }
        if (moving && !state.flags.archive_missing && clock - lastStep > .38) {
            lastStep = clock;
            noise(.07, .006);
        }
        if (state.flags.carrying_cache && map === 'R02' && clock - lastDish > 1.1) {
            lastDish = clock;
            noise(.12, .012);
        }
    }

    function note(lane) {
        tone([261.63, 293.66, 329.63, 392][lane], .55, .045, 'triangle');
    }

    return Object.freeze({unlock, tone, noise, note, tick});
})();