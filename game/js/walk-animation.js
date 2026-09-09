"use strict";

globalThis.MoonWalkAnimation = Object.freeze({
    image: "../img/wukang-walk-v2.png",
    idleImage: "../img/wukang-idle-v2.png",
    columns: 8, frameSize: 256, footY: 252,
    sequences: Object.freeze([
        Object.freeze([1, 2, 3, 5, 6, 7]),
        Object.freeze([0, 1, 2, 3, 4, 5, 6, 7]),
        Object.freeze([0, 1, 2, 3, 4, 5]),
        Object.freeze([0, 1, 2, 3, 4, 5, 6, 7]),
        Object.freeze([1, 2, 3, 5, 6, 7])
    ]),
    directions: Object.freeze([
        {row: 0, mirror: false}, {row: 1, mirror: false},
        {row: 2, mirror: false}, {row: 3, mirror: true},
        {row: 4, mirror: false}, {row: 3, mirror: false},
        {row: 2, mirror: true}, {row: 1, mirror: true}
    ]),
    advance(phase, distance, scale) {
        return (phase + distance / (144 * scale)) % 1;
    },
    frame(phase, facingRow = 0) {
        const sequence = this.sequences[this.directions[facingRow].row];
        return sequence[Math.min(sequence.length - 1, Math.floor(phase * sequence.length))];
    }
});
