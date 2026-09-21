"use strict";

class MoonPuzzleScore {
    constructor(piano = false) {
        this.piano = piano;
        this.points = 0;
        this.errors = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.perfect = 0;
        this.good = 0;
        this.misses = 0;
        this.awards = new Set();
        this.closed = false;
    }

    award(id, points) {
        if (this.closed || this.awards.has(id)) return;
        this.awards.add(id);
        this.points += points;
    }

    hit(delta) {
        if (this.closed) return;
        const perfect = delta <= .12;
        this[perfect ? 'perfect' : 'good']++;
        this.points += perfect ? 62.5 : 43.75;
        this.combo++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        return perfect ? '精准' : '良好';
    }

    mistake(miss = false) {
        if (this.closed) return;
        if (miss) this.misses++; else this.errors++;
        this.combo = 0;
    }

    get score() {
        return Math.min(1000, Math.max(0, Math.round(this.points - this.errors * (this.piano ? 15 : 30))));
    }

    finish(success, remaining = 0, total = 1) {
        if (this.closed) return this.result;
        this.points += !this.piano && success ? Math.round(100 * Math.max(0, Math.min(1, remaining / total))) : 0;
        const score = this.score,
            attempts = this.piano ? this.perfect + this.good + this.misses + this.errors : this.awards.size + this.errors;
        this.closed = true;
        return this.result = {
            success,
            score,
            maxScore: 1000,
            grade: !success && !this.piano ? '已协助' : score >= 900 ? 'S' : score >= 750 ? 'A' : score >= 500 ? 'B' : 'C',
            accuracy: attempts ? Math.round(100 * (this.piano ? this.perfect + this.good : this.awards.size) / attempts) : 0,
            combo: this.maxCombo,
            errors: this.errors,
            misses: this.misses,
            perfect: this.perfect,
            good: this.good,
            assisted: !success && !this.piano
        };
    }
}

globalThis.MoonPuzzleScore = MoonPuzzleScore;
