"use strict";
(function () {
    const levels = Object.freeze({
        easy: {
            label: '轻松',
            detail: '小棋盘、少量目标，留出观察时间',
            width: 3,
            pairs: 3,
            rounds: [2, 3, 4],
            beat: 1,
            time: 240
        },
        normal: {
            label: '标准',
            detail: '更多岔路与目标，需要规划顺序',
            width: 4,
            pairs: 4,
            rounds: [3, 4, 6],
            beat: .85,
            time: 210
        },
        hard: {
            label: '挑战',
            detail: '复杂布局、多目标与更长的记忆序列',
            width: 5,
            pairs: 6,
            rounds: [4, 6, 8],
            beat: .65,
            time: 180
        }
    });
    const steps = [[0, -1, 1, 4], [1, 0, 2, 8], [0, 1, 4, 1], [-1, 0, 8, 2]], rotate = m => ((m << 1) & 15) | (m >> 3);

    function random(seed) {
        let s = seed >>> 0;
        return () => {
            s += 0x6D2B79F5;
            let t = s;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    function shuffle(a, r) {
        a = [...a];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(r() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function neighbors(i, w, h = w) {
        return steps.map(([dx, dy], d) => ({
            i: i + dx + dy * w,
            d,
            x: i % w + dx,
            y: Math.floor(i / w) + dy
        })).filter(p => p.x >= 0 && p.x < w && p.y >= 0 && p.y < h);
    }

    function pipe(l, r) {
        const w = l.width, n = w * w, visited = new Set([0]), parents = {}, stack = [0];
        while (stack.length) {
            const i = stack.at(-1), options = shuffle(neighbors(i, w).filter(p => !visited.has(p.i)), r);
            if (!options.length) {
                stack.pop();
                continue;
            }
            const p = options[0];
            parents[p.i] = i;
            visited.add(p.i);
            stack.push(p.i);
        }
        const path = [n - 1];
        while (path.at(-1) !== 0) path.push(parents[path.at(-1)]);
        path.reverse();
        const solution = Array.from({length: n}, () => r() < .5 ? 10 : 3);
        path.forEach(i => solution[i] = 0);
        solution[0] |= 8;
        solution[n - 1] |= 2;
        for (let k = 1; k < path.length; k++) {
            const a = path[k - 1], b = path[k], d = neighbors(a, w).find(p => p.i === b).d;
            solution[a] |= steps[d][2];
            solution[b] |= steps[d][3];
        }
        const g = {
            kind: 'pipe', width: w, height: w, solution, path, cells: solution.map(v => {
                for (let k = Math.floor(r() * 4); k > 0; k--) v = rotate(v);
                return v;
            }), moves: 0
        };
        if (flow(g).win) g.cells[0] = rotate(g.cells[0]);
        return g;
    }

    function flow(g) {
        const seen = new Set(), last = g.cells.length - 1;
        let leak = false;
        if (!(g.cells[0] & 8)) return {seen, win: false};
        const q = [0];
        seen.add(0);
        for (let k = 0; k < q.length; k++) {
            const i = q[k], x = i % g.width, y = Math.floor(i / g.width);
            for (const [dx, dy, bit, opposite] of steps) {
                if (!(g.cells[i] & bit)) continue;
                const nx = x + dx, ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= g.width || ny >= g.height) {
                    if (!((i === 0 && bit === 8) || (i === last && bit === 2))) leak = true;
                    continue;
                }
                const j = ny * g.width + nx;
                if (!(g.cells[j] & opposite)) {
                    leak = true;
                    continue;
                }
                if (!seen.has(j)) {
                    seen.add(j);
                    q.push(j);
                }
            }
        }
        return {seen, win: !leak && seen.has(last) && Boolean(g.cells[last] & 2)};
    }

    function toggle(g, i) {
        for (const j of [i, ...neighbors(i, g.width, g.height).map(p => p.i)]) g.cells[j] ^= 1;
        g.moves++;
    }

    function lights(l, r) {
        const w = l.width, g = {kind: 'lights', width: w, height: w, cells: Array(w * w).fill(0), moves: 0};
        g.solution = shuffle(g.cells.map((_, i) => i), r).slice(0, Math.ceil(w * w * .55));
        g.solution.forEach(i => toggle(g, i));
        if (g.cells.every(v => !v)) {
            toggle(g, 0);
            g.solution = g.solution.includes(0) ? g.solution.filter(i => i !== 0) : [...g.solution, 0];
        }
        g.moves = 0;
        return g;
    }

    function won(g) {
        return g.boxes.every(i => g.goals.includes(i));
    }

    function push(g, d) {
        const next = neighbors(g.player, g.width).find(p => p.d === d)?.i;
        if (next === undefined || g.walls.includes(next)) return false;
        const index = g.boxes.indexOf(next);
        if (index >= 0) {
            const b = neighbors(next, g.width).find(p => p.d === d)?.i;
            if (b === undefined || g.walls.includes(b) || g.boxes.includes(b)) return false;
            g.boxes[index] = b;
        }
        g.player = next;
        g.moves++;
        return true;
    }

    function sokoban(l, r) {
        const tier = ['easy', 'normal', 'hard'].findIndex(k => levels[k] === l), w = 6 + tier, count = tier + 1;
        for (let attempt = 0; attempt < 40; attempt++) {
            const walls = [], inside = [];
            for (let i = 0; i < w * w; i++) ((i % w === 0 || i % w === w - 1 || i < w || i >= w * (w - 1)) ? walls : inside).push(i);
            const available = shuffle(inside, r);
            walls.push(...available.splice(0, tier + 1));
            const goals = available.splice(0, count), g = {
                kind: 'sokoban',
                width: w,
                height: w,
                walls,
                goals,
                boxes: [...goals],
                player: available[0],
                moves: 0
            }, reverse = [];
            for (let k = 0; k < 80 + 60 * tier; k++) {
                const options = neighbors(g.player, w).filter(p => !walls.includes(p.i) && !g.boxes.includes(p.i));
                if (!options.length) break;
                const pulls = options.filter(p => g.boxes.includes(g.player - (p.i - g.player))),
                    p = (pulls.length && r() < .8 ? shuffle(pulls, r) : shuffle(options, r))[0], old = g.player,
                    behind = old - (p.i - old), box = g.boxes.indexOf(behind);
                g.player = p.i;
                if (box >= 0) g.boxes[box] = old;
                reverse.push((p.d + 2) % 4);
            }
            if (g.boxes.filter(i => !g.goals.includes(i)).length === count) {
                g.solution = reverse.reverse();
                return g;
            }
        }
        const g = {
            kind: 'sokoban',
            width: w,
            height: w,
            walls: [],
            goals: Array.from({length: count}, (_, i) => (i + 1) * w + 3),
            boxes: Array.from({length: count}, (_, i) => (i + 1) * w + 2),
            player: w + 1,
            moves: 0,
            solution: Array.from({length: count}, (_, i) => i === count - 1 ? [1] : [1, 3, 2]).flat()
        };
        for (let i = 0; i < w * w; i++) if (i % w === 0 || i % w === w - 1 || i < w || i >= w * (w - 1)) g.walls.push(i);
        return g;
    }

    function slide(g, i) {
        const blank = g.cells.indexOf(0);
        if (!neighbors(blank, g.width).some(p => p.i === i)) return false;
        [g.cells[i], g.cells[blank]] = [g.cells[blank], g.cells[i]];
        g.moves++;
        return true;
    }

    function sliding(l, r) {
        const w = l === levels.hard ? 4 : 3, g = {
            kind: 'sliding',
            width: w,
            height: w,
            cells: Array.from({length: w * w}, (_, i) => (i + 1) % (w * w)),
            moves: 0
        }, reverse = [];
        let last = -1;
        for (let k = 0; k < (l === levels.easy ? 12 : l === levels.normal ? 40 : 100); k++) {
            const blank = g.cells.indexOf(0), choices = neighbors(blank, w).filter(p => p.i !== last),
                p = shuffle(choices, r)[0];
            slide(g, p.i);
            reverse.push(blank);
            last = blank;
        }
        g.solution = reverse.reverse();
        g.moves = 0;
        if (g.cells.every((v, i) => v === (i + 1) % (w * w))) {
            const blank = g.cells.indexOf(0), p = neighbors(blank, w)[0];
            slide(g, p.i);
            g.solution.unshift(blank);
        }
        return g;
    }

    function create(game, options = {}) {
        const difficulty = levels[options.difficulty] ? options.difficulty : 'normal', l = levels[difficulty],
            seed = options.seed ?? Math.floor(Math.random() * 4294967296), r = random(seed);
        let g;
        if (['oxygen', 'water', 'lamp'].includes(game)) g = pipe(l, r); else if (['temperature', 'interface'].includes(game)) g = lights(l, r); else if (game === 'drone') g = sokoban(l, r); else if (game === 'comms') g = {
            kind: 'simon',
            sequence: Array.from({length: l.rounds.at(-1)}, () => Math.floor(r() * 4)),
            round: l.rounds[0],
            rounds: l.rounds,
            beat: l.beat,
            phase: 'ready',
            clock: 0,
            input: [],
            lit: -1,
            moves: 0
        }; else if (game === 'soil-check') g = {
            kind: 'difference',
            found: [],
            moves: 0,
            mirror: r() < .5,
            extra: difficulty === 'easy' ? 0 : difficulty === 'normal' ? 1 : 2
        }; else if (game === 'cache-match') g = sliding(l, r); else if (game === 'archive-sort') {
            const count = difficulty === 'easy' ? 4 : difficulty === 'normal' ? 6 : 8,
                start = Math.floor(r() * 30) + 10;
            g = {
                kind: 'order',
                items: shuffle(Array.from({length: count}, (_, i) => ({
                    id: i,
                    number: start + i * 2 + Math.floor(r() * 2)
                })), r),
                answer: [],
                moves: 0
            };
        } else if (game === 'tools') {
            const count = difficulty === 'easy' ? 3 : difficulty === 'normal' ? 6 : 9;
            g = {
                kind: 'sort',
                items: shuffle(Array.from({length: count}, (_, i) => i), r),
                done: [],
                selected: null,
                moves: 0
            };
        } else return null;
        return Object.assign(g, {seed, difficulty, game});
    }

    globalThis.MoonClassic = Object.freeze({create, levels, random, rotate, flow, toggle, push, won, slide});
})();