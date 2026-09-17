"use strict";

(function createMoonMenuBgm() {
    const audio = document.getElementById("menu-bgm");
    let embedded = false;

    try {
        embedded = window.self !== window.top;
    } catch (error) {
        embedded = true;
    }

    if (embedded) {
        const send = (action) => window.parent.postMessage({
            type: `moon-menu-bgm:${action}`
        }, "*");

        if (new URLSearchParams(location.search).get("return") === "game") {
            window.MoonMenuBgm = Object.freeze({
                start() {},
                startPreview() {},
                stop() {},
                setVolume() {}
            });
            return;
        }

        window.MoonMenuBgm = Object.freeze({
            start() {
                send("start");
            },
            startPreview() {
                send("startPreview");
            },
            stop() {
                send("stop");
            },
            setVolume() {
                send("setVolume");
            }
        });
        return;
    }

    if (window.self === window.top) {
        const path = location.pathname.replace(/\\/g, "/").toLowerCase();
        const route = path.endsWith("/main/index.html") ? "main"
            : path.endsWith("/settings/index.html") ? "settings"
                : path.endsWith("/about/index.html") ? "about"
                    : path.endsWith("/achievement/index.html") ? "achievements"
                        : path.endsWith("/save/index.html") ? "save"
                            : null;
        const settingsReturnToGame = new URLSearchParams(location.search).get("return") === "game";

        if (route && !settingsReturnToGame) {
            window.MoonMenuBgm = Object.freeze({
                start() {},
                startPreview() {},
                stop() {},
                setVolume() {}
            });
            location.replace(`../menu/index.html#/${route}`);
            return;
        }
    }

    if (!audio) {
        window.MoonMenuBgm = Object.freeze({
            start() {},
            stop() {},
            setVolume() {}
        });
        return;
    }

    const timeKey = "moon_without_return_menu_bgm_time";
    const previewOnly = new URLSearchParams(location.search).get("return") === "game";
    let lastSavedTime = 0;
    let pendingTime = 0;
    let stopped = false;
    let previewStarted = false;




    function restartWhenEnded() {
        if (stopped || (previewOnly && !previewStarted)) return;
        audio.currentTime = 0;
        audio.play().catch(() => {});
    }

    function getSettings() {
        if (window.MoonStorage?.loadSettings) {
            return MoonStorage.loadSettings();
        }

        return {masterVolume: 0.4, musicVolume: 1};
    }

    function setVolume() {
        const settings = getSettings();
        audio.volume = Math.max(0, Math.min(1, settings.masterVolume * settings.musicVolume));
    }

    function saveTime() {
        const time = Math.floor(audio.currentTime || 0);

        if (time === lastSavedTime) {
            return;
        }

        lastSavedTime = time;
        try {
            sessionStorage.setItem(timeKey, String(time));
        } catch (error) {
            console.warn("Unable to save menu music position.", error);
        }
    }

    function start() {
        if (stopped || (previewOnly && !previewStarted)) {
            return;
        }

        setVolume();

        if (audio.paused) {
            const savedTime = Number(sessionStorage.getItem(timeKey) || 0);

            if (Number.isFinite(savedTime) && savedTime > 0) {
                if (audio.readyState >= 1) {
                    audio.currentTime = savedTime;
                } else {
                    pendingTime = savedTime;
                    audio.addEventListener("loadedmetadata", () => {
                        if (pendingTime > 0) {
                            audio.currentTime = pendingTime;
                            pendingTime = 0;
                        }
                    }, {once: true});
                }
            }

            audio.play().catch(() => {});
        }
    }

    function resumeAfterReturn() {
        stopped = false;
        start();
    }

    function startPreview() {
        previewStarted = true;
        start();
    }

    function stop() {
        stopped = true;
        previewStarted = false;
        audio.pause();
        audio.currentTime = 0;
        lastSavedTime = 0;

        try {
            sessionStorage.setItem(timeKey, "0");
        } catch (error) {
            console.warn("Unable to reset menu music position.", error);
        }
    }

    audio.addEventListener("timeupdate", saveTime);
    audio.addEventListener("ended", restartWhenEnded);
    audio.addEventListener("pagehide", saveTime);
    window.addEventListener("pagehide", saveTime);
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            saveTime();
        }
    });
    document.addEventListener("pointerdown", () => start());
    document.addEventListener("keydown", () => start());
    window.addEventListener("focus", () => start());
    window.addEventListener("pageshow", () => resumeAfterReturn());
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            start();
        }
    });
    window.addEventListener("storage", (event) => {
        if (!window.MoonStorage || event.key === MoonStorage.SETTINGS_KEY) {
            setVolume();
        }
    });

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => start());
    } else {
        start();
    }

    window.MoonMenuBgm = Object.freeze({
        start,
        startPreview,
        stop,
        setVolume
    });
})();
