"use strict";

const groups = document.getElementById("binding-groups");
const feedback = document.getElementById("binding-feedback");
const restoreButton = document.getElementById("restore-defaults");
const volumeControls = [...document.querySelectorAll("[data-volume-key]")].map(input => ({
    input,
    output: document.getElementById(`${input.id}-value`),
    key: input.dataset.volumeKey
}));
const returnToGame = new URLSearchParams(location.search).get("return") === "game";
const displayControls = [...document.querySelectorAll("[data-display-key]")];
let settings = MoonStorage.loadSettings();
let capturing = null;
let leavingSettings = false;

function returnFromSettings() {
    if (returnToGame && window.parent !== window.self) {

        window.parent.postMessage({type: "moon-settings-close"}, "*");
        try {
            window.parent.MoonSettingsBridge?.close();
        } catch {

        }
        return;
    }
    if (leavingSettings) return;
    leavingSettings = true;
    if (returnToGame) MoonMenuBgm.stop();
    const target = returnToGame ? "../game/index.html?resume=1" : "../main/index.html";
    MoonUiMotion.hide(document.querySelector(".settings-shell"), "page").then(() => MoonSystem.navigateTo(target));
}

const ORDER = {
    exploration: ["moveUp", "moveLeft", "moveDown", "moveRight", "interact", "map", "journal", "pause"],
    minigame: ["rhythmLane1", "rhythmLane2", "rhythmLane3", "rhythmLane4", "confirm", "pause", "pointer", "rotateLeft", "rotateRight"]
};

function renderBindings() {
    groups.replaceChildren();
    Object.entries(ORDER).forEach(([context, actions]) => {
        const section = document.createElement("section");
        const title = document.createElement("h3");
        title.textContent = context === "exploration" ? "基本操作" : "小游戏";
        section.append(title);
        actions.forEach((action) => {
            const row = document.createElement("div");
            const label = document.createElement("span");
            const button = document.createElement("button");
            label.textContent = MoonStorage.ACTION_LABELS[action];
            button.type = "button";
            button.dataset.context = context;
            button.dataset.action = action;
            button.textContent = capturing?.context === context && capturing?.action === action
                ? "等待输入…" : MoonStorage.keyLabel(settings.bindings[context][action]);
            button.setAttribute("aria-label", `${label.textContent}，当前 ${button.textContent}`);
            button.classList.toggle("is-capturing", capturing?.context === context && capturing?.action === action);
            button.addEventListener("click", () => beginCapture(context, action));
            row.append(label, button);
            section.append(row);
        });
        groups.append(section);
    });
}

function beginCapture(context, action) {
    capturing = {context, action};
    feedback.textContent = `正在重绑“${MoonStorage.ACTION_LABELS[action]}”；按 Esc 取消。`;
    renderBindings();
}

function handleCapture(event) {
    if (!capturing) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.code === "Escape") {
        feedback.textContent = "已取消重绑。";
        capturing = null;
        renderBindings();
        return;
    }
    const code = event.code;
    if(capturing.context==='minigame'&&code==='KeyR'){feedback.textContent='R 用于重新挑战小游戏，请选择其他按键。';return;}
    const conflict = MoonStorage.findConflict(settings.bindings, capturing.context, capturing.action, code);
    if (conflict) {
        feedback.textContent = `冲突：${MoonStorage.keyLabel(code)} 已用于“${MoonStorage.ACTION_LABELS[conflict]}”。未保存。`;
        return;
    }
    settings.bindings[capturing.context][capturing.action] = code;
    if (!MoonStorage.saveSettings(settings)) {
        settings = MoonStorage.loadSettings();
        feedback.textContent = "保存失败，请检查浏览器存储权限后重试。";
        capturing = null;
        renderBindings();
        return;
    }
    feedback.textContent = `已保存“${MoonStorage.ACTION_LABELS[capturing.action]}”为 ${MoonStorage.keyLabel(code)}。`;
    capturing = null;
    renderBindings();
}

function handlePointerCapture(event) {
    if (!capturing) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const code = `Mouse${event.button}`;
    const conflict = MoonStorage.findConflict(settings.bindings, capturing.context, capturing.action, code);
    if (conflict) {
        feedback.textContent = `冲突：该鼠标键已用于“${MoonStorage.ACTION_LABELS[conflict]}”。未保存。`;
        return;
    }
    settings.bindings[capturing.context][capturing.action] = code;
    if (!MoonStorage.saveSettings(settings)) {
        settings = MoonStorage.loadSettings();
        feedback.textContent = "保存失败，请检查浏览器存储权限后重试。";
        capturing = null;
        renderBindings();
        return;
    }
    feedback.textContent = `已保存“${MoonStorage.ACTION_LABELS[capturing.action]}”。`;
    capturing = null;
    renderBindings();
}

function restoreDefaults() {
    settings = MoonStorage.resetSettings();
    capturing = null;
    feedback.textContent = "已恢复全部默认设置。";
    renderBindings();
    renderVolumes();
    renderDisplay();
}

function renderVolumes() {
    volumeControls.forEach(({input, output, key}) => {
        const volume = Math.max(0, Math.min(1, Number(settings[key]) || 0));
        const percent = Math.round(volume * 100);
        input.value = percent;
        output.textContent = `${percent}%`;
    });
}

function renderDisplay() {
    displayControls.forEach(input => {
        const key = input.dataset.displayKey;
        if (input.type === "checkbox") input.checked = settings[key] === true;
        else {
            input.value = Math.round(Number(settings[key]) * 100);
            document.querySelector(`[data-display-output="${key}"]`).textContent = `${input.value}%`;
        }
    });
}

displayControls.forEach(input => input.addEventListener("input", () => {
    const key = input.dataset.displayKey;
    settings[key] = input.type === "checkbox" ? input.checked : Number(input.value) / 100;
    MoonStorage.saveSettings(settings);
    renderDisplay();
    if (returnToGame && window.parent !== window.self) window.parent.postMessage({type: "moon-settings-changed", detail: settings}, "*");
}));

volumeControls.forEach(({input, key}) => input.addEventListener("input", () => {
    settings[key] = Math.max(0, Math.min(1, Number(input.value) / 100));
    renderVolumes();
    if (returnToGame) {
        if (window.parent !== window.self) {
            window.parent.postMessage({type: "moon-settings-changed", detail: settings}, "*");
        } else {
            MoonMenuBgm.startPreview();
        }
    } else {
        MoonMenuBgm.start();
    }
    MoonMenuBgm.setVolume();
    if (!MoonStorage.saveSettings(settings)) {
        settings = MoonStorage.loadSettings();
        feedback.textContent = "音量未能保存，请检查浏览器存储权限。";
        renderVolumes();
    }
}));



function initialize() {
    document.body.dataset.settingsState = "ready";
    document.body.classList.toggle("is-embedded", window.parent !== window.self);
    renderBindings();
    MoonSystem.initializeSystemClock();
    MoonUiMotion.show(document.querySelector(".settings-shell"), "page");
    document.getElementById("back-button").addEventListener("click", returnFromSettings);
    document.addEventListener("keydown", handleCapture, true);
    document.addEventListener("pointerdown", handlePointerCapture, true);
    restoreButton.addEventListener("click", restoreDefaults);
    document.addEventListener("keydown", (event) => {
        if (!capturing && event.code === "Escape") {
            event.preventDefault();
            returnFromSettings();
        }
    });
}

function renderDifficulty(){document.querySelectorAll('[data-difficulty]').forEach(button=>button.setAttribute('aria-pressed',button.dataset.difficulty===settings.difficulty));}
document.querySelectorAll('[data-difficulty]').forEach(button=>button.addEventListener('click',()=>{settings.difficulty=button.dataset.difficulty;if(!MoonStorage.saveSettings(settings)){settings=MoonStorage.loadSettings();feedback.textContent='难度未能保存，请检查浏览器存储权限。';}renderDifficulty();}));
renderDifficulty();
renderVolumes();
renderDisplay();
initialize();
