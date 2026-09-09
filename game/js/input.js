"use strict";

(function createMoonInputManager() {
    class InputManager {
        constructor(bindings) {
            this.bindings = bindings;
            this.context = "exploration";
            this.pressed = new Set();
            this.justPressed = new Set();
            this.enabled = true;
            this.onKeyDown = this.onKeyDown.bind(this);
            this.onKeyUp = this.onKeyUp.bind(this);
            window.addEventListener("keydown", this.onKeyDown);
            window.addEventListener("keyup", this.onKeyUp);
            window.addEventListener("blur", () => this.clear());
            window.addEventListener("moon:settings-changed", (event) => {
                this.bindings = event.detail.bindings;
                this.clear();
            });
        }

        onKeyDown(event) {
            if (!this.enabled || this.isEditable(event.target)) return;
            if (event.repeat) return;
            const modalAllowsTab = event.code === "Tab" && document.body.classList.contains("has-modal");
            if (!modalAllowsTab && ["Tab", "Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) event.preventDefault();
            if (!this.pressed.has(event.code)) this.justPressed.add(event.code);
            this.pressed.add(event.code);
        }

        onKeyUp(event) {
            this.pressed.delete(event.code);
        }

        isEditable(target) {
            return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable;
        }

        action(action) {
            return this.pressed.has(this.bindings[this.context][action]);
        }

        consume(action) {
            const code = this.bindings[this.context][action];
            if (!this.justPressed.has(code)) return false;
            this.justPressed.delete(code);
            return true;
        }

        code(action, context = this.context) {
            return this.bindings[context][action];
        }

        setContext(context) {
            this.context = context;
            this.clear();
        }

        endFrame() {
            this.justPressed.clear();
        }

        clear() {
            this.pressed.clear();
            this.justPressed.clear();
        }
    }

    globalThis.MoonInputManager = InputManager;
})();
