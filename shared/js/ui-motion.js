"use strict";

window.MoonUiMotion = (() => {
    const running = new WeakMap();
    const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

    function transition(element, visible, kind = "window") {
        if (!element) return Promise.resolve(false);
        if (!visible && element.hidden) return Promise.resolve(true);
        const previous = running.get(element);
        const fresh = element.hidden || !previous;
        const opacity = previous ? getComputedStyle(element).opacity : (visible ? "0" : "1");
        const content = kind === "window" ? [...element.children].filter(child => child.matches(".panel-large,.pause-panel,.confirm-panel,.ending-panel,.dialogue-box,.choice-list,.choice-dialogue,.overview-content,#dialogue-portrait,#overview-image")) : [element];
        const offsets = content.map(child => previous ? getComputedStyle(child).translate : (visible ? "0 12px" : "0 0px"));
        previous?.animations.forEach(animation => animation.cancel());
        const state = {animations: []};
        running.set(element, state);
        element.hidden = false;
        element.inert = !visible;
        element.dataset.motion = visible ? "opening" : "closing";
        const finish = () => {
            if (running.get(element) !== state) return false;
            element.hidden = !visible;
            delete element.dataset.motion;
            state.animations.forEach(animation => animation.cancel());
            running.delete(element);
            return true;
        };
        if (reduced() || !element.animate) {
            finish();
            return Promise.resolve(true);
        }
        const duration = visible ? 220 : 160;
        const options = {duration, easing: visible ? "cubic-bezier(.18,.75,.25,1)" : "ease-in", fill: "both"};
        state.animations.push(element.animate([{opacity: fresh ? (visible ? 0 : 1) : opacity}, {opacity: visible ? 1 : 0}], options));
        content.forEach((child, index) => state.animations.push(child.animate([{translate: offsets[index]}, {translate: visible ? "0 0px" : kind === "hud" ? "0 -6px" : "0 8px"}], options)));
        return Promise.all(state.animations.map(animation => animation.finished.catch(() => null))).then(finish);
    }

    function statusHuds(elements) {
        let obscured = false;
        const entries = [...elements].map(element => ({
            element, value: element.textContent.trim(), version: 0, timer: 0, pending: false
        }));

        function pulse(entry) {
            clearTimeout(entry.timer);
            const version = ++entry.version;
            if (obscured) {
                entry.pending = true;
                return;
            }
            entry.pending = false;
            transition(entry.element, true, "hud").then(finished => {
                if (!finished || entry.version !== version || obscured) return;
                entry.timer = setTimeout(() => {
                    if (entry.version === version && !obscured) transition(entry.element, false, "hud");
                }, 3000);
            });
        }

        const observers = entries.map(entry => {
            const observer = new MutationObserver(() => {
                const value = entry.element.textContent.trim();
                if (value === entry.value) return;
                entry.value = value;
                pulse(entry);
            });
            observer.observe(entry.element, {subtree: true, childList: true, characterData: true});
            pulse(entry);
            return observer;
        });
        return {
            obscure(value) {
                if (obscured === value) return;
                obscured = value;
                entries.forEach(entry => {
                    if (value) {
                        clearTimeout(entry.timer);
                        entry.version++;
                        transition(entry.element, false, "hud");
                    } else if (entry.pending) pulse(entry);
                });
            }, dispose() {
                observers.forEach(observer => observer.disconnect());
                entries.forEach(entry => {
                    clearTimeout(entry.timer);
                    entry.version++;
                });
            }
        };
    }

    return Object.freeze({
        show: (element, kind) => transition(element, true, kind),
        hide: (element, kind) => transition(element, false, kind),
        statusHuds
    });
})();
