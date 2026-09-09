"use strict";

(function createMoonSystem() {
    function updateSystemClock(clockElement) {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");
        const value = `${hours}:${minutes}:${seconds}`;

        clockElement.textContent = value;
        clockElement.dateTime = value;
    }

    function initializeSystemClock(elementId = "system-time") {
        const clockElement = document.getElementById(elementId);

        if (!clockElement) {
            return;
        }

        updateSystemClock(clockElement);
        window.setInterval(() => updateSystemClock(clockElement), 1000);
    }

    function getCurrentOperator() {
        try {
            const currentUser = JSON.parse(
                localStorage.getItem("moon_without_return_current_user") || "null"
            );

            return currentUser && typeof currentUser.username === "string"
                ? currentUser.username
                : "UNASSIGNED";
        } catch (error) {
            console.warn("Unable to read the current operator record.", error);
            return "UNASSIGNED";
        }
    }

    function navigateTo(relativePath) {
        if (document.body.classList.contains("is-leaving")) {
            return;
        }

        document.body.classList.add("is-leaving");
        window.setTimeout(() => {
            window.location.href = relativePath;
        }, 300);
    }

    function returnToMainMenu() {
        playBackSound();
        navigateTo("../main/index.html");
    }

    function bindEscapeToMain() {
        document.addEventListener("keydown", (event) => {
            if (event.key !== "Escape") {
                return;
            }

            event.preventDefault();
            returnToMainMenu();
        });
    }

    function bindBackButton(buttonId = "back-button") {
        const backButton = document.getElementById(buttonId);

        if (backButton) {
            backButton.addEventListener("click", returnToMainMenu);
        }
    }

    function playBackSound() {
    }

    window.MoonSystem = Object.freeze({
        initializeSystemClock,
        getCurrentOperator,
        navigateTo,
        returnToMainMenu,
        bindEscapeToMain,
        bindBackButton
    });
}());
