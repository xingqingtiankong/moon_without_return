"use strict";
(function () {
    const ASSET_ROOT = "./audio/endings/";
    const TRACKS = Object.freeze({
        farewell: "farewell-woman-bird.mp3",
        reiko: "reiko-amazing-grace.m4a",
        forRiver: "for-river.m4a",
        believe: "believe-me.m4a",
        toTheMoon: "to-the-moon-ending.m4a",
        everything: "everything-alright-reprise.m4a",
        faraway: "faraway.m4a",
        moonlight: "moonlight-late-night.m4a",
        growing: "growing-loneliness.m4a",
        revolving: "revolving-door.m4a",
        messenger: "messenger-from-zero.mp3"
    });

    const ENDING_TRACKS = Object.freeze({
        return_home: "farewell",
        home_question: "farewell",
        quiet_year: "farewell",
        dream_sleep: "farewell",
        eternal_home: "reiko",
        evacuation: "forRiver",
        nameless: "forRiver",
        extinction: "believe",
        joint_signature: "toTheMoon",
        borrowed_name: "faraway",
        unsigned: "faraway",
        visitor: "faraway",
        no_answer: "moonlight",
        false_stop: "moonlight",
        maintenance: "moonlight",
        zero_home: "growing",
        wrong_rescue: "growing",
        one_of_seventeen: "revolving",
        age_conflict: "messenger"
    });


    const ENDING_ENTRY_NODES = new Set(["V_END_ROUTE", "DREAM_END"]);

    const EARLY_RESOLVE = new Set(["dream_sleep"]);


    const GOODNIGHT_ENDINGS = new Set(["goodnight", "cold_goodbye"]);
    const GOODNIGHT_HOME_NODES = new Set([
        "V_LAST_HOME", "V_LAST_NIGHT", "V_EXIT_HOME",
        "V_STOP_AZHI", "V_STOP_CHILD", "V_STOP_BACKUP",
        "F_OXYGEN", "F_SUIT"
    ]);
    const GOODNIGHT_EXIT_NODES = new Set(["F_MOON_MID", "F_RESCUE", "V_END_ROUTE"]);
    let current = null;
    let lastEndingId = "";
    let startedForEnding = false;

    function settingsVolume() {
        try {
            const settings = MoonStorage.loadSettings();
            return Math.max(0, Math.min(1, (settings.masterVolume ?? .4) * (settings.musicVolume ?? 1)));
        } catch (error) {
            return .4;
        }
    }

    function applyVolume() {
        if (current?.audio) current.audio.volume = settingsVolume();
    }

    function stopOtherMusic() {
        try {
            MoonSound.stopHomeVoice();
            MoonSound.stopBaseMusic();
            MoonSound.stopEchoMusic();
            MoonSound.stopArchiveMusic();
            MoonSound.stopCloneMusic();
            MoonSound.stopChapterMusic?.();
        } catch (error) {
        }
    }

    function playTrack(key, options = {}) {
        const file = TRACKS[key];
        if (!file) return false;
        if (current?.key === key && !current.audio.paused && !options.restart) {
            applyVolume();
            return true;
        }
        if (current?.audio) {
            current.audio.pause();
            try {
                current.audio.currentTime = 0;
            } catch (error) {
            }
        }
        stopOtherMusic();
        globalThis.MoonEndingBgmHold = true;
        const audio = new Audio(ASSET_ROOT + file);
        audio.loop = true;
        audio.preload = "auto";
        audio.volume = settingsVolume();
        audio.addEventListener("error", () => {
            console.warn("Ending BGM failed to load:", ASSET_ROOT + file);
            if (current?.audio === audio) current = null;
        });
        current = {key, audio};
        audio.play().catch(() => {

        });
        return true;
    }

    function stopTrack() {
        if (!current?.audio) return;
        current.audio.pause();
        try {
            current.audio.currentTime = 0;
        } catch (error) {
        }
        current = null;
    }

    function retryCurrent() {
        if (!current?.audio || !current.audio.paused) return;
        current.audio.play().catch(() => {
        });
    }

    function resolvedEnding(state) {
        try {
            return MoonEndings.resolve(state)?.id || "";
        } catch (error) {
            return "";
        }
    }

    function shouldStartGeneric(state, id) {
        if (EARLY_RESOLVE.has(id)) return true;


        if (!(Number(state.chapter) >= 6)) return false;
        if (!(state.choices && state.choices.FINAL)) return false;


        if (ENDING_ENTRY_NODES.has(state.node || "")) return true;

        return state.flags?.game_complete === true || !!state.flags?.ending;
    }

    function startEndingTrack(id) {
        const track = ENDING_TRACKS[id];
        if (!track) return false;
        playTrack(track);
        startedForEnding = true;
        window.dispatchEvent(new CustomEvent("moon:ending-bgm-start", {detail: {ending: id, track}}));
        return true;
    }

    function onProgress(event) {
        const state = event.detail;
        if (!state) return;
        const id = resolvedEnding(state);
        if (!id) return;
        if (id !== lastEndingId) {
            lastEndingId = id;
            startedForEnding = false;
        }
        const node = state.node || "";
        if (GOODNIGHT_ENDINGS.has(id)) {


            if (GOODNIGHT_EXIT_NODES.has(node)) {
                playTrack("toTheMoon");
                startedForEnding = true;
            } else if (GOODNIGHT_HOME_NODES.has(node)) {
                playTrack("everything");
                startedForEnding = true;
            }
            return;
        }
        if (startedForEnding || !shouldStartGeneric(state, id)) return;
        startEndingTrack(id);
    }


    function syncFromRuntime() {
        try {
            const state = globalThis.MoonStoryRuntime?.state;
            if (state) onProgress({detail: state});
        } catch (error) {
        }
    }

    window.addEventListener("DOMContentLoaded", syncFromRuntime);
    window.addEventListener("load", syncFromRuntime);
    try {
        if (typeof document !== "undefined" && document.readyState === "complete") syncFromRuntime();
    } catch (error) {
    }

    window.addEventListener("moon:progress-changed", onProgress);
    window.addEventListener("pointerdown", retryCurrent, true);
    window.addEventListener("keydown", retryCurrent, true);
    window.addEventListener("moon:settings-changed", applyVolume);
    window.addEventListener("storage", event => {
        if (!globalThis.MoonStorage || event.key === MoonStorage.SETTINGS_KEY) applyVolume();
    });

    window.MoonEndingBgm = Object.freeze({
        play: playTrack,
        stop: stopTrack,
        ensureForAchievement() {
            if (current) return true;
            const track = ENDING_TRACKS[lastEndingId];
            return track ? playTrack(track) : false;
        }
    });

    window.MoonAchievementBgm = Object.freeze({
        start(id) {


            if (current) {
                window.MoonEndingBgm.ensureForAchievement();
                return;
            }
            const track = ENDING_TRACKS[id] || ENDING_TRACKS[lastEndingId];
            if (track) playTrack(track);
        },
        stop() {

        }
    });
})();