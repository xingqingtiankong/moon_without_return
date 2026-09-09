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
}

initialize();
