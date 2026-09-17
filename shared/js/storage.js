"use strict";

(function createMoonStorage() {
    const PREFIX = "moon_without_return_";
    const SETTINGS_KEY = `${PREFIX}settings_v1`;
    const AUTOSAVE_KEY = `${PREFIX}autosave_v2`;
    const SLOT_KEY = (slot) => `${PREFIX}save_v2_slot_${slot}`;
    const SETTINGS_VERSION = 1;
    const SAVE_VERSION = 3;
    const DEFAULT_MASTER_VOLUME = 0.4;
    const DEFAULT_MUSIC_VOLUME = 1;
    const DEFAULT_SFX_VOLUME = 1;
    const DEFAULT_DISPLAY = Object.freeze({scale: 1, brightness: 1, scanlines: true, grain: true, reducedMotion: false});

    const DEFAULT_BINDINGS = Object.freeze({
        exploration: Object.freeze({
            moveUp: "KeyW", moveLeft: "KeyA", moveDown: "KeyS", moveRight: "KeyD",
            interact: "KeyF", map: "Tab", journal: "KeyQ", pause: "Escape"
        }),
        minigame: Object.freeze({
            rhythmLane1: "KeyD", rhythmLane2: "KeyF", rhythmLane3: "KeyJ", rhythmLane4: "KeyK",
            confirm: "Enter", pause: "Escape", pointer: "Mouse0", rotateLeft: "KeyQ", rotateRight: "KeyE"
        })
    });

    const ACTION_LABELS = Object.freeze({
        moveUp: "向上移动", moveLeft: "向左移动", moveDown: "向下移动", moveRight: "向右移动",
        interact: "交互 / 推进", map: "大地图", journal: "任务与证据", pause: "暂停 / 返回",
        rhythmLane1: "节奏轨道 1", rhythmLane2: "节奏轨道 2", rhythmLane3: "节奏轨道 3", rhythmLane4: "节奏轨道 4",
        confirm: "小游戏确认", pointer: "指针 / 拖拽", rotateLeft: "向左旋转", rotateRight: "向右旋转"
    });

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function safeParse(raw) {
        try {
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            return null;
        }
    }

    function isBindings(value) {
        return value && ["exploration", "minigame"].every((context) => {
            const expected = DEFAULT_BINDINGS[context];
            return value[context] && Object.keys(expected).every((action) => typeof value[context][action] === "string");
        });
    }

    function loadSettings() {
        const parsed = safeParse(localStorage.getItem(SETTINGS_KEY));
        if (!parsed || parsed.schemaVersion !== SETTINGS_VERSION || !isBindings(parsed.bindings)) {
            return {
                schemaVersion: SETTINGS_VERSION,
                bindings: clone(DEFAULT_BINDINGS),
                difficulty: "normal",
                masterVolume: DEFAULT_MASTER_VOLUME,
                musicVolume: DEFAULT_MUSIC_VOLUME,
                sfxVolume: DEFAULT_SFX_VOLUME, ...clone(DEFAULT_DISPLAY)
            };
        }
        const masterVolume = Number.isFinite(parsed.masterVolume) ? Math.max(0, Math.min(1, parsed.masterVolume)) : DEFAULT_MASTER_VOLUME;
        const musicVolume = Number.isFinite(parsed.musicVolume) ? Math.max(0, Math.min(1, parsed.musicVolume)) : DEFAULT_MUSIC_VOLUME;
        const sfxVolume = Number.isFinite(parsed.sfxVolume) ? Math.max(0, Math.min(1, parsed.sfxVolume)) : DEFAULT_SFX_VOLUME;
        return {schemaVersion: SETTINGS_VERSION, bindings: clone(parsed.bindings), difficulty: ["easy", "normal", "hard"].includes(parsed.difficulty) ? parsed.difficulty : "normal", masterVolume, musicVolume, sfxVolume, scale: Number.isFinite(parsed.scale) ? Math.max(.85, Math.min(1.15, parsed.scale)) : 1, brightness: Number.isFinite(parsed.brightness) ? Math.max(.7, Math.min(1.3, parsed.brightness)) : 1, scanlines: parsed.scanlines !== false, grain: parsed.grain !== false, reducedMotion: parsed.reducedMotion === true};
    }

    function saveSettings(settings) {
        if (!settings || !isBindings(settings.bindings)) return false;
        const clean = {
            schemaVersion: SETTINGS_VERSION,
            bindings: clone(settings.bindings),
            difficulty: ["easy", "normal", "hard"].includes(settings.difficulty) ? settings.difficulty : "normal",
            masterVolume: Number.isFinite(settings.masterVolume) ? Math.max(0, Math.min(1, settings.masterVolume)) : DEFAULT_MASTER_VOLUME,
            musicVolume: Number.isFinite(settings.musicVolume) ? Math.max(0, Math.min(1, settings.musicVolume)) : DEFAULT_MUSIC_VOLUME,
            sfxVolume: Number.isFinite(settings.sfxVolume) ? Math.max(0, Math.min(1, settings.sfxVolume)) : DEFAULT_SFX_VOLUME,
            scale: Number.isFinite(settings.scale) ? Math.max(.85, Math.min(1.15, settings.scale)) : 1,
            brightness: Number.isFinite(settings.brightness) ? Math.max(.7, Math.min(1.3, settings.brightness)) : 1,
            scanlines: settings.scanlines !== false, grain: settings.grain !== false, reducedMotion: settings.reducedMotion === true
        };
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(clean));
            window.dispatchEvent(new CustomEvent("moon:settings-changed", {detail: clean}));
            return true;
        } catch (error) {
            console.warn("Unable to save control settings.", error);
            return false;
        }
    }

    function resetSettings() {
        const settings = {schemaVersion: SETTINGS_VERSION, bindings: clone(DEFAULT_BINDINGS), difficulty: "normal", masterVolume: DEFAULT_MASTER_VOLUME, musicVolume: DEFAULT_MUSIC_VOLUME, sfxVolume: DEFAULT_SFX_VOLUME, ...clone(DEFAULT_DISPLAY)};
        settings.difficulty = loadSettings().difficulty;
        saveSettings(settings);
        return settings;
    }

    function findConflict(bindings, context, action, code) {
        return Object.entries(bindings[context]).find(([otherAction, otherCode]) => otherAction !== action && otherCode === code)?.[0] || null;
    }

    function keyLabel(code) {
        const labels = {Tab: "Tab", Escape: "Esc", Enter: "Enter", Space: "Space", Mouse0: "鼠标左键"};
        if (labels[code]) return labels[code];
        if (/^Key[A-Z]$/.test(code)) return code.slice(3);
        if (/^Digit[0-9]$/.test(code)) return code.slice(5);
        if (/^Arrow/.test(code)) return code.replace("Arrow", "方向");
        return code.replace(/^Numpad/, "小键盘 ");
    }

    function defaultGameState() {
        return {
            schemaVersion: SAVE_VERSION,
            checkpointId: "chapter1-start",
            oneShotEvents: [],
            configVersion: "legacy-unverified",
            chapter: 1,
            node: "H01",
            day: 1,
            mental_value: 100,
            family_state: "S0",
            piano_clear: false,
            minigameResults: {},
            evidence: [],
            choices: {},
            completedTasks: [],
            flags: {},
            currentMap: "F01",
            playerPosition: {x: 755.4, y: 743.7},
            playTime: 0,
            settingsVersion: SETTINGS_VERSION,
            chapterComplete: false,
            savedAt: null,
            snapshot: null,
            snapshotScene: null,
            storyTitle: "",
            storySummary: "",
            chapterTitle: ""
        };
    }

    function cleanSaveText(value, maxLength) {
        if (typeof value !== "string") return "";
        return value
            .replace(/[\u0000-\u001f\u007f]+/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, maxLength);
    }

    function normalizeSaveSnapshot(value) {
        if (typeof value !== "string") return null;
        const normalized = value.replace(/\s+/g, "");
        if (normalized.length < 64 || normalized.length > 240000) return null;
        return /^data:image\/(?:png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/i.test(normalized) ? normalized : null;
    }

    function normalizeSaveScene(value) {
        if (!value || typeof value !== "object" || Array.isArray(value)) return null;
        if (typeof value.mapId !== "string" || !/^[A-Za-z0-9_-]{2,32}$/.test(value.mapId)) return null;
        if (["__proto__", "constructor", "prototype"].includes(value.mapId)) return null;
        const x = Number.isFinite(value.x) ? Math.max(0, Math.min(1672, value.x)) : 755.4;
        const y = Number.isFinite(value.y) ? Math.max(0, Math.min(941, value.y)) : 743.7;
        const facingRow = Number.isFinite(value.facingRow) ? Math.max(0, Math.min(7, Math.floor(value.facingRow))) : 0;
        const sprite = ["idle", "walk", "spacesuit"].includes(value.sprite) ? value.sprite : "idle";
        return {mapId: value.mapId, x, y, facingRow, sprite};
    }

    function migrateSave(value) {
        if (!value || typeof value !== "object" || Array.isArray(value) || (value.schemaVersion !== undefined && ![2, 3].includes(value.schemaVersion))) return null;
        const base = defaultGameState();
        if ([0, 1, 2, 3, 4, 5, 6, 7].includes(value.chapter)) base.chapter = value.chapter;
        const id = v => typeof v === 'string' && /^[A-Za-z0-9_-]{1,96}$/.test(v) && !['__proto__', 'constructor', 'prototype'].includes(v);
        const number = (v, min, max, fallback) => Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : fallback;
        for (const key of ['node', 'checkpointId', 'configVersion']) if (id(value[key])) base[key] = value[key];
        if (value.schemaVersion !== 3) base.configVersion = 'legacy-unverified';
        base.storyTitle = cleanSaveText(value.storyTitle, 72);
        base.storySummary = cleanSaveText(value.storySummary, 160);
        base.chapterTitle = cleanSaveText(value.chapterTitle, 48);
        base.snapshot = normalizeSaveSnapshot(value.snapshot);
        base.snapshotScene = normalizeSaveScene(value.snapshotScene);
        if (typeof value.currentMap === 'string' && /^(F0[0-5]|R0[1-9]|B0[1-5]|A0[2-7])$/.test(value.currentMap)) base.currentMap = value.currentMap;
        base.day = Math.floor(number(value.day, 1, 365, 1));
        base.mental_value = number(value.mental_value, 0, 100, 100);
        base.playTime = number(value.playTime, 0, 315360000, 0);
        if (['S0', 'S1', 'S2', 'S3', 'closed'].includes(value.family_state)) base.family_state = value.family_state;
        for (const key of ['piano_clear', 'chapterComplete']) base[key] = value[key] === true;
        for (const key of ['evidence', 'completedTasks', 'oneShotEvents']) base[key] = Array.isArray(value[key]) ? [...new Set(value[key].filter(id))].slice(0, 1000) : [];
        for (const key of ['flags', 'choices']) {
            const obj = value[key];
            if (obj && typeof obj === 'object' && !Array.isArray(obj)) for (const [k, v] of Object.entries(obj).slice(0, 1000)) {
                if (id(k) && (typeof v === 'boolean' || (typeof v === 'string' && v.length <= 256) || (Number.isFinite(v) && Math.abs(v) <= 1e9))) base[key][k] = v;
            }
        }
        if (value.minigameResults && typeof value.minigameResults === 'object' && !Array.isArray(value.minigameResults)) for (const [key, r] of Object.entries(value.minigameResults).slice(0, 100)) {
            if (!id(key) || !r || typeof r !== 'object') continue;
            base.minigameResults[key] = {
                score: Math.floor(number(r.score, 0, 1000, 0)),
                maxScore: 1000,
                grade: ['S+', 'S', 'A+', 'A', 'B', 'C', '已协助'].includes(r.grade) ? r.grade : 'C',
                accuracy: Math.floor(number(r.accuracy, 0, 100, 0)),
                combo: Math.floor(number(r.combo, 0, 1000, 0)),
                errors: Math.floor(number(r.errors, 0, 10000, 0)),
                misses: Math.floor(number(r.misses, 0, 1000, 0)),
                assisted: r.assisted === true
            };
        }
        const p = value.playerPosition;
        if (p && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= 1672 && p.y >= 0 && p.y <= 941) base.playerPosition = {
            x: p.x,
            y: p.y
        };
        if (typeof value.savedAt === 'string' && Number.isFinite(Date.parse(value.savedAt))) base.savedAt = new Date(value.savedAt).toISOString();
        return base;
    }

    function readSaveKey(key) {
        return migrateSave(safeParse(localStorage.getItem(key)));
    }

    function saveGame(state, slot = "auto") {
        if (slot !== "auto" && ![1, 2, 3].includes(Number(slot))) return false;
        const value = migrateSave(state);
        if (!value) return false;
        value.savedAt = new Date().toISOString();
        const key = slot === "auto" ? AUTOSAVE_KEY : SLOT_KEY(Number(slot));
        try {
            localStorage.setItem(key, JSON.stringify(value));
            window.dispatchEvent(new CustomEvent("moon:game-saved", {detail: clone(value)}));
            return value;
        } catch (error) {
            if (value.snapshot) {
                const fallback = {...value, snapshot: null};
                try {
                    localStorage.setItem(key, JSON.stringify(fallback));
                    window.dispatchEvent(new CustomEvent("moon:game-saved", {detail: clone(fallback)}));
                    return fallback;
                } catch (fallbackError) {
                    console.warn("Unable to write save data without snapshot.", fallbackError);
                }
            }
            console.warn("Unable to write save data.", error);
            return false;
        }
    }

    function loadGame(slot = "auto") {
        if (slot !== "auto" && ![1, 2, 3].includes(Number(slot))) return null;
        return readSaveKey(slot === "auto" ? AUTOSAVE_KEY : SLOT_KEY(Number(slot)));
    }

    function deleteSave(slot) {
        if (![1, 2, 3].includes(Number(slot))) return false;
        localStorage.removeItem(SLOT_KEY(Number(slot)));
    }

    function listSlots() {
        return [1, 2, 3].map((id) => ({id, data: loadGame(id)}));
    }

    window.MoonStorage = Object.freeze({
        PREFIX, SETTINGS_KEY, AUTOSAVE_KEY, SETTINGS_VERSION, SAVE_VERSION,
        DEFAULT_BINDINGS, ACTION_LABELS, clone, loadSettings, saveSettings, resetSettings,
        findConflict, keyLabel, defaultGameState, migrateSave, saveGame, loadGame, deleteSave, listSlots
    });
}());
