"use strict";

class MoonDialogueReveal {
    constructor(element, {reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches} = {}) {
        this.element = element;
        this.reduced = reduced;
        this.characters = [];
        this.index = 0;
        this.elapsed = 0;
        this.delay = .035;
        element.setAttribute('aria-live', 'off');
    }

    start(text) {
        this.characters = typeof Intl.Segmenter === 'function' ? [...new Intl.Segmenter('zh', {granularity: 'grapheme'}).segment(text)].map(s => s.segment) : Array.from(text);
        this.index = 0;
        this.elapsed = 0;
        this.delay = .035;
        this.element.textContent = '';
        if (this.reduced()) this.finish();
    }

    get complete() {
        return this.index >= this.characters.length;
    }

    finish() {
        if (this.complete) return false;
        this.index = this.characters.length;
        this.element.textContent = this.characters.join('');
        return true;
    }

    tick(dt) {
        if (this.complete || !Number.isFinite(dt) || dt < 0) return;
        if (this.reduced()) {
            this.finish();
            return;
        }
        this.elapsed += dt;
        while (!this.complete && this.elapsed >= this.delay) {
            this.elapsed -= this.delay;
            const char = this.characters[this.index++];
            this.delay = /[，。！？、；：…]/.test(char) ? .16 : .035;
        }
        this.element.textContent = this.characters.slice(0, this.index).join('');
    }
}

globalThis.MoonDialogueReveal = MoonDialogueReveal;