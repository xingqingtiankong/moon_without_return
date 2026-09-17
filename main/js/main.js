"use strict";



const mainShell = document.getElementById("main-shell");
const menuButtons = [...document.querySelectorAll(".menu-item")];
const teamBrand = document.getElementById("team-brand");
const feedbackPrimary = document.getElementById("feedback-primary");
const feedbackSecondary = document.getElementById("feedback-secondary");
const menuFeedback = document.getElementById("menu-feedback");
const operatorName = document.getElementById("operator-name");



const menuItems = [
    "newGame",
    "loadGame",
    "achievements",
    "flowchart",
    "about",
    "settings"
];



let selectedMenuIndex = 0;
let feedbackTimer = 0;
let isInitializingMission = false;




function selectMenuItem(index, shouldFocus = false) {
    selectedMenuIndex = (index + menuButtons.length) % menuButtons.length;

    menuButtons.forEach((button, buttonIndex) => {
        const isSelected = buttonIndex === selectedMenuIndex;
        button.classList.toggle("is-selected", isSelected);

        if (isSelected) {
            button.setAttribute("aria-current", "true");
        } else {
            button.removeAttribute("aria-current");
        }
    });

    if (shouldFocus) {
        menuButtons[selectedMenuIndex].focus({preventScroll: true});
    }
}

function selectNextMenuItem() {
    selectMenuItem(selectedMenuIndex + 1, true);
    playMenuMoveSound();
}

function selectPreviousMenuItem() {
    selectMenuItem(selectedMenuIndex - 1, true);
    playMenuMoveSound();
}

function activateSelectedMenuItem() {
    activateMenuAction(menuItems[selectedMenuIndex]);
}



function handleMenuKeyboard(event) {
    const key = event.key.toLowerCase();

    if (key === "arrowdown" || key === "s") {
        event.preventDefault();
        selectNextMenuItem();
        return;
    }

    if (key === "arrowup" || key === "w") {
        event.preventDefault();
        selectPreviousMenuItem();
        return;
    }

    if (key === "enter") {
        if (event.target instanceof HTMLButtonElement
            && !event.target.classList.contains("menu-item")) {
            return;
        }

        event.preventDefault();
        activateSelectedMenuItem();
    }
}



function bindMenuPointerNavigation() {
    menuButtons.forEach((button, index) => {
        button.addEventListener("mouseenter", () => selectMenuItem(index));
        button.addEventListener("focus", () => selectMenuItem(index));
        button.addEventListener("click", () => activateMenuAction(button.dataset.action));
    });
}



function startNewGame() {
    if (isInitializingMission) {
        return;
    }

    isInitializingMission = true;
    playMenuConfirmSound();
    MoonMenuBgm.stop();
    showMenuFeedback("INITIALIZING NEW MISSION", "正在建立新的任务记录……", 1700);

    window.setTimeout(() => {
        isInitializingMission = false;
        MoonSystem.navigateTo("../game/index.html?new=1&entry=chapter1");
    }, 850);
}



function activateMenuAction(action) {
    switch (action) {
        case "newGame":
            startNewGame();
            break;
        case "loadGame":
            playMenuConfirmSound();
            MoonSystem.navigateTo("../save/index.html");
            break;
        case "flowchart":
            openFlowchart();
            break;
        case "achievements":
            playMenuConfirmSound();
            MoonSystem.navigateTo("../achievement/index.html");
            break;
        case "about":
            openTeamArchive();
            break;
        case "settings":
            openSettings();
            break;
        default:
            break;
    }
}

function pickFurthestSave() {
    const candidates = [{slot: "auto", data: MoonStorage.loadGame("auto")}, ...[1, 2, 3].map(id => ({slot: String(id), data: MoonStorage.loadGame(id)}))];
    const lineageCount = save => {
        const lineage = save && save.flags && save.flags.log_id;
        if (!lineage) return 0;
        try {
            const rows = JSON.parse(localStorage.getItem("moon_log_" + lineage) || "[]");
            return new Set(rows.map(row => row && row.node).filter(Boolean)).size;
        } catch (error) {
            return 0;
        }
    };
    const score = save => save ? (save.chapter || 0) * 100000 + (save.day || 0) * 100 + (save.playTime || 0) / 60 + (save.evidence || []).length * 5 + (save.completedTasks || []).length * 3 + lineageCount(save) * 8 : -Infinity;
    return candidates.reduce((best, current) => score(current.data) > score(best.data) ? current : best, {slot: "", data: null});
}
function openFlowchart() {
    playMenuConfirmSound();
    const best = pickFurthestSave();
    const params = new URLSearchParams({flowchart: "1", story: "0"});
    if (best && best.data) {
        params.set("load", best.slot);
        params.set("flowlineage", best.data.flags?.log_id || "pending");
    }
    MoonSystem.navigateTo("../game/index.html?" + params.toString());
}

function openSettings() {
    playMenuConfirmSound();
    MoonSystem.navigateTo("../settings/index.html");
}

function openTeamArchive() {
    playMenuConfirmSound();
    MoonSystem.navigateTo("../about/index.html");
}

function showMenuFeedback(primary, secondary, duration = 1800) {
    window.clearTimeout(feedbackTimer);
    feedbackPrimary.textContent = primary;
    feedbackSecondary.textContent = secondary;
    menuFeedback.classList.add("is-active");

    feedbackTimer = window.setTimeout(() => {
        feedbackPrimary.textContent = "MISSION INTERFACE READY";
        feedbackSecondary.textContent = "等待任务指令";
        menuFeedback.classList.remove("is-active");
    }, duration);
}



function initializeOperator() {
    operatorName.textContent = MoonSystem.getCurrentOperator();
}



function initializeEntryAnimation() {
    window.requestAnimationFrame(() => mainShell.classList.add("is-ready"));
}



function playMenuMoveSound() {

}

function playMenuConfirmSound() {

}

function playBackSound() {

}



function bindEventListeners() {
    document.addEventListener("keydown", handleMenuKeyboard);
    teamBrand.addEventListener("click", openTeamArchive);
    bindMenuPointerNavigation();
}



function initialize() {
    selectMenuItem(0);
    initializeOperator();
    MoonSystem.initializeSystemClock();
    initializeEntryAnimation();
    bindEventListeners();
    MoonMenuBgm.start();
}

initialize();
