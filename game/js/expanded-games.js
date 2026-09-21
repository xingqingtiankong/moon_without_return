"use strict";
(function () {
    const rand = MoonClassic.random, shuffle = (a, r) => {
        a = [...a];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(r() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    };

    function create(game, {seed = 1, difficulty = 'normal'} = {}) {
        game = ({lamp: 'akari', temperature: 'sudoku', interface: 'bridges'})[game] || game;
        const r = rand(seed), t = Math.max(0, ['easy', 'normal', 'hard'].indexOf(difficulty));
        let g = {game, seed, difficulty, moves: 0};
        if (game === 'merge2048') {
            Object.assign(g, {
                kind: 'merge',
                width: 4,
                cells: Array(16).fill(0),
                target: [64, 128, 256][t],
                merges: 0,
                rng: r
            });
            spawn(g);
            spawn(g);
        } else if (game === 'sudoku') {
            const w = [4, 6, 9][t], bh = [2, 2, 3][t], bw = w / bh,
                symbols = shuffle(Array.from({length: w}, (_, i) => i + 1), r),
                rows = shuffle(Array.from({length: w / bh}, (_, i) => i), r).flatMap(b => shuffle(Array.from({length: bh}, (_, i) => b * bh + i), r)),
                cols = shuffle(Array.from({length: w / bw}, (_, i) => i), r).flatMap(b => shuffle(Array.from({length: bw}, (_, i) => b * bw + i), r));
            const solution = rows.flatMap(y => cols.map(x => symbols[(y * bw + Math.floor(y / bh) + x) % w]));
            Object.assign(g, {kind: 'sudoku', width: w, bh, bw, solution, cells: [...solution], selected: -1});
            let removed = 0;
            for (const i of shuffle(solution.map((_, i) => i), r)) {
                const v = g.cells[i];
                g.cells[i] = 0;
                if (sudokuSolutions(g, 2) !== 1) g.cells[i] = v; else removed++;
                if (removed >= [7, 18, 44][t]) break;
            }
            g.givens = [...g.cells];
        } else if (game === 'loop') {
            const w = [3, 4, 5][t], edges = [];
            for (let y = 0; y <= w; y++) for (let x = 0; x < w; x++) edges.push({
                a: y * (w + 1) + x,
                b: y * (w + 1) + x + 1,
                x,
                y,
                h: true
            });
            for (let y = 0; y < w; y++) for (let x = 0; x <= w; x++) edges.push({
                a: y * (w + 1) + x,
                b: (y + 1) * (w + 1) + x,
                x,
                y,
                h: false
            });
            const heights = Array.from({length: w}, () => 1 + Math.floor(r() * w)),
                inside = (x, y) => x >= 0 && x < w && y >= 0 && y < w && y >= w - heights[x],
                solution = edges.map(e => Number(e.h ? inside(e.x, e.y - 1) !== inside(e.x, e.y) : inside(e.x - 1, e.y) !== inside(e.x, e.y))),
                cellEdges = Array.from({length: w * w}, (_, i) => edges.flatMap((e, j) => e.h ? (e.x === i % w && (e.y === Math.floor(i / w) || e.y === Math.floor(i / w) + 1) ? [j] : []) : (e.y === Math.floor(i / w) && (e.x === i % w || e.x === i % w + 1) ? [j] : [])));
            Object.assign(g, {
                kind: 'loop',
                width: w,
                edges,
                solution,
                cellEdges,
                clues: cellEdges.map(ids => ids.reduce((s, i) => s + solution[i], 0)),
                values: edges.map(() => 0)
            });
        } else if (game === 'bridges') {
            const w = [3, 3, 4][t], h = [2, 3, 4][t],
                nodes = Array.from({length: w * h}, (_, i) => ({x: i % w, y: Math.floor(i / w), need: 0})), edges = [];
            nodes.forEach((n, i) => {
                if (n.x < w - 1) edges.push({a: i, b: i + 1});
                if (n.y < h - 1) edges.push({a: i, b: i + w});
            });
            const reached = new Set([0]), solution = edges.map(() => 0);
            while (reached.size < nodes.length) {
                const choices = edges.map((e, i) => ({
                    e,
                    i
                })).filter(({e}) => reached.has(e.a) !== reached.has(e.b)), {e, i} = shuffle(choices, r)[0];
                solution[i] = r() < .45 ? 2 : 1;
                reached.add(e.a);
                reached.add(e.b);
            }
            edges.forEach((e, i) => {
                nodes[e.a].need += solution[i];
                nodes[e.b].need += solution[i];
            });
            Object.assign(g, {
                kind: 'bridges',
                width: w,
                height: h,
                nodes,
                edges,
                solution,
                values: edges.map(() => 0)
            });
        } else if (['flier', 'runner'].includes(game)) {
            Object.assign(g, {
                kind: game,
                rng: r,
                elapsed: 0,
                y: game === 'runner' ? 240 : 150,
                vy: 0,
                obstacles: [],
                next: 1,
                passed: 0,
                target: [6, 9, 12][t],
                lives: [3, 2, 1][t],
                speed: [95, 120, 145][t],
                gap: [140, 120, 100][t],
                invulnerable: 0,
                center: 150,
                ended: false
            });
        } else if (game === 'akari') {
            const w = [4, 5, 6][t], blocks = Array.from({length: w * w}, () => r() < .22),
                bulbs = Array(w * w).fill(false);
            Object.assign(g, {kind: 'akari', width: w, blocks, bulbs});
            for (const i of shuffle(bulbs.map((_, i) => i), r)) if (!blocks[i] && !illumination(g).lit.has(i)) bulbs[i] = true;
            g.solution = [...bulbs];
            g.clues = blocks.map((v, i) => v ? adjacent(i, w).filter(j => bulbs[j]).length : null);
            g.bulbs = bulbs.map(() => false);
        } else if (game === 'shikaku') {
            const w = [4, 5, 6][t], rects = [{x: 0, y: 0, w, h: w}], count = [4, 6, 9][t];
            while (rects.length < count) {
                const choices = rects.map((v, i) => ({
                        v,
                        i
                    })).filter(({v}) => v.w * v.h > 1).sort((a, b) => b.v.w * b.v.h - a.v.w * a.v.h), {v, i} = choices[0],
                    horizontal = v.w > 1 && (v.h === 1 || r() < .5),
                    cut = 1 + Math.floor(r() * ((horizontal ? v.w : v.h) - 1));
                rects.splice(i, 1, ...(horizontal ? [{...v, w: cut}, {...v, x: v.x + cut, w: v.w - cut}] : [{
                    ...v,
                    h: cut
                }, {...v, y: v.y + cut, h: v.h - cut}]));
            }
            const clues = Array(w * w).fill(0);
            rects.forEach(v => clues[(v.y + Math.floor(r() * v.h)) * w + v.x + Math.floor(r() * v.w)] = v.w * v.h);
            Object.assign(g, {kind: 'shikaku', width: w, clues, solution: rects, regions: [], start: null});
        } else if (game === 'clip-order') Object.assign(g, {
            kind: 'clips',
            items: shuffle(['确认走廊', '关闭灯光', '数墙板', '触摸第三块', '后退等待', '指向下缘'].map((text, id) => ({
                id,
                text
            })), r),
            answer: []
        });
        else if (game === 'body-match') Object.assign(g, {
            kind: 'bodymatch',
            items: shuffle([2, 4, 6, 9, 11, 12, 13, 16].slice(0, [4, 6, 8][t]), r),
            selected: null,
            matched: []
        });
        else if (game === 'anchors') Object.assign(g, {
            kind: 'anchors',
            elapsed: 0,
            target: 180,
            values: [85, 85, 85],
            fault: -1,
            next: 2,
            window: [4, 3, 2.3][t],
            decay: [.65, .9, 1.2][t],
            rng: r
        });
        else return null;
        return g;
    }

    function spawn(g) {
        const empty = g.cells.flatMap((v, i) => v ? [] : [i]);
        if (empty.length) {
            const i = empty[Math.floor(g.rng() * empty.length)];
            g.cells[i] = 2;
            g.lastSpawn = i;
        }
    }

    function merge(g, d) {
        const old = [...g.cells], motions = [];
        for (let a = 0; a < 4; a++) {
            const ids = Array.from({length: 4}, (_, b) => d === 0 ? b * 4 + a : d === 1 ? a * 4 + 3 - b : d === 2 ? (3 - b) * 4 + a : a * 4 + b),
                nums = ids.filter(i => g.cells[i]).map(i => ({value: g.cells[i], from: i})), out = [];
            for (let i = 0; i < nums.length; i++) {
                const target = ids[out.length], v = nums[i];
                if (nums[i + 1]?.value === v.value) {
                    out.push(v.value * 2);
                    g.merges += v.value * 2;
                    motions.push({from: v.from, to: target, value: v.value}, {
                        from: nums[i + 1].from,
                        to: target,
                        value: v.value
                    });
                    i++;
                } else {
                    out.push(v.value);
                    motions.push({from: v.from, to: target, value: v.value});
                }
            }
            ids.forEach((id, i) => g.cells[id] = out[i] || 0);
        }
        if (g.cells.every((v, i) => v === old[i])) return false;
        g.tileMotions = motions;
        spawn(g);
        g.moves++;
        return true;
    }

    function mergeStuck(g) {
        return !g.cells.includes(0) && g.cells.every((v, i) => (i % 4 === 3 || v !== g.cells[i + 1]) && (i >= 12 || v !== g.cells[i + 4]));
    }

    function candidates(g, i) {
        const w = g.width, x = i % w, y = Math.floor(i / w), used = new Set();
        for (let j = 0; j < w; j++) {
            used.add(g.cells[y * w + j]);
            used.add(g.cells[j * w + x]);
        }
        for (let yy = Math.floor(y / g.bh) * g.bh; yy < Math.floor(y / g.bh) * g.bh + g.bh; yy++) for (let xx = Math.floor(x / g.bw) * g.bw; xx < Math.floor(x / g.bw) * g.bw + g.bw; xx++) used.add(g.cells[yy * w + xx]);
        return Array.from({length: w}, (_, j) => j + 1).filter(n => !used.has(n));
    }

    function sudokuSolutions(g, limit = 2) {
        let count = 0;

        function scan() {
            if (count >= limit) return;
            let at = -1, options = [];
            for (let i = 0; i < g.cells.length; i++) if (!g.cells[i]) {
                const c = candidates(g, i);
                if (!c.length) return;
                if (at < 0 || c.length < options.length) {
                    at = i;
                    options = c;
                }
            }
            if (at < 0) {
                count++;
                return;
            }
            for (const n of options) {
                g.cells[at] = n;
                scan();
                g.cells[at] = 0;
                if (count >= limit) break;
            }
        }

        scan();
        return count;
    }

    function sudokuWin(g) {
        return g.cells.every((v, i) => {
            if (!v || g.givens[i] && g.givens[i] !== v) return false;
            g.cells[i] = 0;
            const valid = candidates(g, i).includes(v);
            g.cells[i] = v;
            return valid;
        });
    }

    function connected(nodes, edges) {
        if (!edges.length) return false;
        const seen = new Set([edges[0].a]);
        let changed = true;
        while (changed) {
            changed = false;
            for (const e of edges) if (seen.has(e.a) !== seen.has(e.b)) {
                seen.add(e.a);
                seen.add(e.b);
                changed = true;
            }
        }
        return nodes.every(n => seen.has(n));
    }

    function loopWin(g) {
        const edges = g.edges.filter((_, i) => g.values[i] === 1), degrees = {};
        edges.forEach(e => {
            degrees[e.a] = (degrees[e.a] || 0) + 1;
            degrees[e.b] = (degrees[e.b] || 0) + 1;
        });
        return g.clues.every((c, i) => g.cellEdges[i].filter(j => g.values[j] === 1).length === c) && Object.values(degrees).every(n => n === 2) && connected(Object.keys(degrees).map(Number), edges);
    }

    function bridgeWin(g) {
        const counts = g.nodes.map(() => 0), edges = g.edges.filter((e, i) => {
            const n = g.values[i];
            counts[e.a] += n;
            counts[e.b] += n;
            return n > 0;
        });
        return counts.every((n, i) => n === g.nodes[i].need) && connected(g.nodes.map((_, i) => i), edges);
    }

    function hop(g) {
        if (g.kind === 'flier') g.vy = -165; else if (g.y >= 240) g.vy = -380;
    }

    function arcadeTick(g, dt) {
        if (g.ended) return;
        for (let remaining = dt; remaining > 0; remaining -= 1 / 120) {
            const h = Math.min(remaining, 1 / 120);
            g.elapsed += h;
            g.invulnerable = Math.max(0, g.invulnerable - h);
            g.vy += (g.kind === 'flier' ? 360 : 690) * h;
            g.y += g.vy * h;
            if (g.kind === 'runner' && g.y >= 240) {
                g.y = 240;
                g.vy = 0;
            }
            g.next -= h;
            if (g.next <= 0) {
                g.center = Math.max(80, Math.min(220, g.center + (g.rng() - .5) * 60));
                g.obstacles.push({
                    x: 620,
                    center: g.center,
                    height: 28 + g.rng() * (g.difficulty === 'hard' ? 28 : 18),
                    passed: false
                });
                g.next = g.kind === 'runner' ? (g.difficulty === 'hard' ? 1.15 + g.rng() * .75 : 1.8 + g.rng()) : 2.2;
            }
            let collision = g.kind === 'flier' && (g.y < 12 || g.y > 288);
            for (const o of g.obstacles) {
                o.x -= g.speed * h;
                if (!o.passed && o.x + 34 < 75) {
                    o.passed = true;
                    g.passed++;
                }
                if (o.x < 106 && o.x + 34 > 78) collision ||= g.kind === 'flier' ? g.y - 11 < o.center - g.gap / 2 || g.y + 11 > o.center + g.gap / 2 : g.y + 18 > 258 - o.height && g.y - 13 < 258;
            }
            g.obstacles = g.obstacles.filter(o => o.x > -60);
            if (collision && g.invulnerable === 0) {
                g.lives--;
                g.invulnerable = 1.4;
                g.y = g.kind === 'flier' ? 150 : 240;
                g.vy = 0;
            }
            if (g.lives <= 0 || g.passed >= g.target) {
                g.ended = true;
                break;
            }
        }
    }

    function adjacent(i, w) {
        return [[-1, 0], [1, 0], [0, -1], [0, 1]].flatMap(([dx, dy]) => {
            const x = i % w + dx, y = Math.floor(i / w) + dy;
            return x >= 0 && y >= 0 && x < w && y < w ? [y * w + x] : [];
        });
    }

    function illumination(g) {
        const lit = new Set(), conflicts = new Set(), w = g.width;
        g.bulbs.forEach((on, i) => {
            if (!on || g.blocks[i]) return;
            lit.add(i);
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                let x = i % w + dx, y = Math.floor(i / w) + dy;
                while (x >= 0 && y >= 0 && x < w && y < w && !g.blocks[y * w + x]) {
                    const j = y * w + x;
                    lit.add(j);
                    if (g.bulbs[j]) {
                        conflicts.add(i);
                        conflicts.add(j);
                    }
                    x += dx;
                    y += dy;
                }
            }
        });
        return {lit, conflicts};
    }

    function akariWin(g) {
        const {lit, conflicts} = illumination(g);
        return !conflicts.size && g.blocks.every((block, i) => block ? adjacent(i, g.width).filter(j => g.bulbs[j]).length === g.clues[i] : lit.has(i));
    }

    function rectangle(g, a, b) {
        const x = Math.min(a % g.width, b % g.width), y = Math.min(Math.floor(a / g.width), Math.floor(b / g.width)),
            w = Math.abs(a % g.width - b % g.width) + 1,
            h = Math.abs(Math.floor(a / g.width) - Math.floor(b / g.width)) + 1;
        return {x, y, w, h};
    }

    function regionCells(g, v) {
        const cells = [];
        for (let y = v.y; y < v.y + v.h; y++) for (let x = v.x; x < v.x + v.w; x++) cells.push(y * g.width + x);
        return cells;
    }

    function placeRegion(g, v) {
        if (v.x < 0 || v.y < 0 || v.x + v.w > g.width || v.y + v.h > g.width) return false;
        const cells = regionCells(g, v), clues = cells.filter(i => g.clues[i]);
        if (clues.length !== 1 || g.clues[clues[0]] !== cells.length || g.regions.some(r => regionCells(g, r).some(i => cells.includes(i)))) return false;
        g.regions.push(v);
        return true;
    }

    function shikakuWin(g) {
        return g.regions.reduce((sum, v) => sum + v.w * v.h, 0) === g.width * g.width;
    }

    globalThis.MoonExpanded = Object.freeze({
        create,
        merge,
        mergeStuck,
        sudokuSolutions,
        sudokuWin,
        loopWin,
        bridgeWin,
        hop,
        arcadeTick,
        illumination,
        akariWin,
        rectangle,
        placeRegion,
        shikakuWin,
        regionCells
    });
})();