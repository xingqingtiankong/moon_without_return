"use strict";
(function () {
    const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

    function capture(p) {
        return [...p.controls?.querySelectorAll('button,[data-note]') || []].map((el, i) => ({
            el,
            key: el.getAttribute('aria-label') || el.dataset.note || el.textContent.trim() + '#' + i,
            content: el.textContent + '|' + el.className,
            rect: el.getBoundingClientRect()
        }));
    }

    function motion() {
    }

    const button = MoonPuzzles.prototype.button;
    MoonPuzzles.prototype.button = function (text, fn, parent) {
        return button.call(this, text, () => {
            const phase = this.root.dataset.phase, before = capture(this);
            fn();
            if (phase === this.root.dataset.phase) motion(this, before);
        }, parent);
    };
    const key = MoonPuzzles.prototype.key;
    MoonPuzzles.prototype.key = function (code) {
        const before = capture(this);
        const out = key.call(this, code);
        motion(this, before);
        return out;
    };
    const wrong = MoonPuzzles.prototype.wrong;
    MoonPuzzles.prototype.wrong = function (message) {
        wrong.call(this, message);
        if (!reduced()) this.feedback.animate([{opacity: .3}, {opacity: 1}], {duration: 180});
    };
    document.addEventListener('pointerdown', e => {
        if (reduced() || !e.target.closest('.puzzle-controls') || e.target.closest('.expedition-canvas')) return;
        const spark = document.createElement('i');
        spark.className = 'operation-spark';
        spark.style.left = e.clientX - 8 + 'px';
        spark.style.top = e.clientY - 8 + 'px';
        document.body.append(spark);
        spark.animate([{transform: 'scale(.4)', opacity: 1}, {
            transform: 'scale(2.5)',
            opacity: 0
        }], {duration: 350}).finished.finally(() => spark.remove());
    });
    const result = MoonPuzzles.prototype.renderScoreResult;
    MoonPuzzles.prototype.renderScoreResult = function () {
        result.call(this);
        const state = globalThis.MoonStoryRuntime?.state;
        if (!state) return;
        const def = MoonCampaign.nodes[this.info.node], piano = this.info.game.startsWith('piano'),
            settled = state.flags['settled_' + this.info.node],
            delta = settled ? 0 : piano ? (this.result.success && !state.flags.piano_recovered ? 10 : 0) : this.result.success ? 0 : -(def?.penalty === 20 || def?.finalOxygen ? 20 : 10),
            text = document.createElement('p');
        text.className = 'mental-settlement';
        text.textContent = delta ? '继续剧情后精神 ' + (delta > 0 ? '+' : '') + delta + ' → ' + Math.max(0, Math.min(100, state.mental_value + delta)) + (state.mental_value + delta <= 0 ? ' · 将进入无梦休眠。' : '。') : '本次精神不变。';
        text.textContent += ' R 可重新挑战本题；确认继续后只结算一次。';
        this.controls.insertBefore(text, this.continueButton);
    };
})();