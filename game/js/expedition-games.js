"use strict";
(function () {
    const levels = {easy: 0, normal: 1, hard: 2}, directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    const runs = a => {
        const out = [];
        let n = 0;
        for (const v of [...a, 0]) {
            if (v) n++; else if (n) {
                out.push(n);
                n = 0;
            }
        }
        return out.length ? out : [0];
    };

    function create(kind, {seed = 1, difficulty = 'normal'} = {}) {
        if (!['mouse-maze', 'maze', 'lights-out', 'nonogram', 'logic-grid', 'side-runner'].includes(kind)) return null;
        const r = MoonClassic.random(seed), t = levels[difficulty] ?? 1,
            g = {kind, seed, difficulty, tier: t, rng: r, moves: 0, won: false, lost: false};
        if (kind.includes('maze')) {
            g.w = g.h = [11, 17, 31][t];
            g.cells = Array(g.w * g.h).fill(1);
            const stack = [g.w + 1];
            g.cells[stack[0]] = 0;
            while (stack.length) {
                const i = stack.at(-1),
                    opts = MoonArcade.shuffle(directions, r).map(([x, y]) => [i + x * 2 + y * 2 * g.w, i + x + y * g.w]).filter(([j]) => j % g.w > 0 && j % g.w < g.w - 1 && Math.floor(j / g.w) > 0 && Math.floor(j / g.w) < g.h - 1 && g.cells[j]);
                if (!opts.length) stack.pop(); else {
                    const [j, m] = opts[0];
                    g.cells[j] = g.cells[m] = 0;
                    stack.push(j);
                }
            }
            g.pos = g.w + 1;
            g.start = g.pos;
            g.exit = g.w * g.h - g.w - 2;
            g.trail = [g.pos];
            g.lives = [6, 4, 3][t];
            g.dragging = false;
            g.route = mazeRoute(g);
        }
        if (kind === 'lights-out') {
            g.w = g.h = [3, 4, 5][t];
            g.cells = Array(g.w * g.h).fill(0);
            g.solution = [];
            for (let i = 0; i < g.cells.length; i++) if (r() < .5) {
                toggle(g, i);
                g.solution.push(i);
            }
            if (!g.cells.some(Boolean)) {
                toggle(g, 0);
                g.solution = [0];
            }
            g.won = false;
            g.moves = 0;
        }
        if (kind === 'nonogram') {
            g.w = g.h = [5, 7, 9][t];
            let count = 0;
            do {
                g.answer = Array.from({length: g.w * g.h}, () => r() < .52 ? 1 : 0);
                g.rows = Array.from({length: g.h}, (_, y) => runs(g.answer.slice(y * g.w, (y + 1) * g.w)));
                g.cols = Array.from({length: g.w}, (_, x) => runs(Array.from({length: g.h}, (_, y) => g.answer[y * g.w + x])));
            } while (nonogramSolutions(g, 2) !== 1 && ++count < 150);
            if (count >= 150) {
                g.answer = Array.from({length: g.w * g.h}, (_, i) => Math.floor(i / g.w) % 2 ? 0 : 1);
                g.rows = Array.from({length: g.h}, (_, y) => runs(g.answer.slice(y * g.w, (y + 1) * g.w)));
                g.cols = Array.from({length: g.w}, (_, x) => runs(Array.from({length: g.h}, (_, y) => g.answer[y * g.w + x])));
            }
            g.cells = Array(g.answer.length).fill(0);
            g.mark = false;
        }
        if (kind === 'logic-grid') {
            g.n = [3, 4, 5][t];
            g.people = ['02号', '05号', '08号', '11号', '16号'].slice(0, g.n);
            g.items = ['氧阀', '天线', '照明', '滤芯', '门锁'].slice(0, g.n);
            g.rooms = ['1号间', '2号间', '3号间', '4号间', '5号间'].slice(0, g.n);
            g.answer = [MoonArcade.shuffle(Array.from({length: g.n}, (_, i) => i), r), MoonArcade.shuffle(Array.from({length: g.n}, (_, i) => i), r)];
            g.clues = buildLogic(g, r);
            g.cells = [Array(g.n * g.n).fill(0), Array(g.n * g.n).fill(0)];
        }
        if (kind === 'side-runner') {
            Object.assign(g, {
                x: 95,
                y: 0,
                vy: 0,
                speed: [155, 195, 235][t],
                obstacles: [],
                next: 1.8,
                elapsed: 0,
                passed: 0,
                target: [10, 16, 22][t],
                lives: [4, 3, 2][t],
                slide: 0,
                invulnerable: 0
            });
        }
        return g;
    }

    function mazeRoute(g) {
        const q = [g.start], parents = new Map([[g.start, null]]);
        for (let k = 0; k < q.length; k++) {
            const i = q[k];
            if (i === g.exit) break;
            for (const [x, y] of directions) {
                const j = i + x + y * g.w;
                if (j >= 0 && j < g.cells.length && !g.cells[j] && !parents.has(j)) {
                    parents.set(j, i);
                    q.push(j);
                }
            }
        }
        let path = [], i = g.exit;
        while (i !== null && i !== undefined) {
            path.unshift(i);
            i = parents.get(i);
        }
        return path;
    }

    function mazeMove(g, i) {
        if (g.cells[i] || Math.abs(i % g.w - g.pos % g.w) + Math.abs(Math.floor(i / g.w) - Math.floor(g.pos / g.w)) !== 1) return false;
        g.pos = i;
        g.trail.push(i);
        g.moves++;
        g.won = i === g.exit;
        return true;
    }

    function toggle(g, i) {
        for (const [x, y] of [[0, 0], ...directions]) {
            const xx = i % g.w + x, yy = Math.floor(i / g.w) + y;
            if (xx >= 0 && xx < g.w && yy >= 0 && yy < g.h) g.cells[yy * g.w + xx] ^= 1;
        }
        g.moves++;
        g.won = g.cells.every(v => !v);
    }

    function patterns(n, clue) {
        const out = [];
        for (let mask = 0; mask < 2 ** n; mask++) {
            const a = Array.from({length: n}, (_, i) => (mask >> i) & 1);
            if (runs(a).join(',') === clue.join(',')) out.push(a);
        }
        return out;
    }

    function nonogramSolutions(g, limit = 2) {
        const rows = g.rows.map(c => patterns(g.w, c)), cols = g.cols.map(c => patterns(g.h, c));
        let count = 0;

        function visit(y, cs) {
            if (count >= limit) return;
            if (y === g.h) {
                count++;
                return;
            }
            for (const row of rows[y]) {
                const next = cs.map((a, x) => a.filter(v => v[y] === row[x]));
                if (next.every(a => a.length)) visit(y + 1, next);
            }
        }

        visit(0, cols);
        return count;
    }

    function mark(g, i) {
        g.cells[i] = g.mark ? (g.cells[i] === -1 ? 0 : -1) : (g.cells[i] === 1 ? 0 : 1);
        g.moves++;
        g.won = g.cells.every((v, i) => (v === 1 ? 1 : 0) === g.answer[i]);
    }

    function logicMark(g, cat, i) {
        g.cells[cat][i] = g.cells[cat][i] === 0 ? -1 : g.cells[cat][i] === -1 ? 1 : 0;
        g.moves++;
        g.won = g.cells.every((a, c) => a.every((v, j) => v === 1 ? g.answer[c][Math.floor(j / g.n)] === j % g.n : true) && g.answer[c].every((v, p) => a[p * g.n + v] === 1));
    }

    const permutationCache = {};

    function permutations(n) {
        if (permutationCache[n]) return permutationCache[n];
        const out = [];

        function visit(a, left) {
            if (!left.length) out.push(a); else left.forEach((v, i) => visit([...a, v], left.filter((_, j) => i !== j)));
        }

        visit([], Array.from({length: n}, (_, i) => i));
        return permutationCache[n] = out;
    }

    function fitsLogic(answer, c) {
        if (c.type === 'eq') return answer[c.cat][c.p] === c.v;
        if (c.type === 'ne') return answer[c.cat][c.p] !== c.v;
        if (c.type === 'link') return answer[1][answer[0].indexOf(c.item)] === c.room;
        if (c.type === 'adj') return Math.abs(answer[1][c.a] - answer[1][c.b]) === 1;
        if (c.type === 'left') return answer[1][c.a] < answer[1][c.b];
        return false;
    }

    function logicSolutions(g, limit = 2) {
        let n = 0;
        for (const a of permutations(g.n)) for (const b of permutations(g.n)) {
            if (g.clues.every(c => fitsLogic([a, b], c)) && ++n >= limit) return n;
        }
        return n;
    }

    function buildLogic(g, r) {
        const pool = [], labels = [g.items, g.rooms];
        for (let p = 0; p < g.n; p++) {
            for (let cat = 0; cat < 2; cat++) for (let v = 0; v < g.n; v++) pool.push({
                type: g.answer[cat][p] === v ? 'eq' : 'ne',
                p,
                cat,
                v,
                text: g.people[p] + (g.answer[cat][p] === v ? '对应' : '不对应') + labels[cat][v] + '。'
            });
            pool.push({
                type: 'link',
                item: g.answer[0][p],
                room: g.answer[1][p],
                text: '维修' + g.items[g.answer[0][p]] + '的人在' + g.rooms[g.answer[1][p]] + '。'
            });
            for (let b = p + 1; b < g.n; b++) {
                if (Math.abs(g.answer[1][p] - g.answer[1][b]) === 1) pool.push({
                    type: 'adj',
                    a: p,
                    b,
                    text: g.people[p] + '与' + g.people[b] + '所在房间紧邻。'
                });
                const [a, c] = g.answer[1][p] < g.answer[1][b] ? [p, b] : [b, p];
                pool.push({
                    type: 'left',
                    a,
                    b: c,
                    text: g.people[a] + '所在房间在' + g.people[c] + '左侧（不一定相邻）。'
                });
            }
        }
        let candidates = [];
        for (const a of permutations(g.n)) for (const b of permutations(g.n)) candidates.push([a, b]);
        const chosen = [];
        for (const clue of MoonArcade.shuffle(pool, r).sort((a, b) => (a.type === 'eq') - (b.type === 'eq'))) {
            const next = candidates.filter(v => fitsLogic(v, clue));
            if (next.length < candidates.length) {
                chosen.push(clue);
                candidates = next;
            }
            if (candidates.length === 1) break;
        }
        return chosen;
    }

    function tick(g, dt) {
        if (g.kind !== 'side-runner' || g.won || g.lost) return false;
        for (let rest = dt; rest > 0; rest -= 1 / 120) {
            const h = Math.min(rest, 1 / 120);
            g.elapsed += h;
            g.slide = Math.max(0, g.slide - h);
            g.invulnerable = Math.max(0, g.invulnerable - h);
            g.vy -= 900 * h;
            g.y = Math.max(0, g.y + g.vy * h);
            if (!g.y) g.vy = 0;
            g.next -= h;
            if (g.next <= 0) {
                g.obstacles.push({x: 680, kind: Math.floor(g.rng() * 3), hit: false});
                g.next = (g.tier === 2 ? 1.25 : 1.7) + g.rng() * .65;
            }
            for (const o of g.obstacles) {
                o.x -= g.speed * h;
                const left = g.x - 12, right = g.x + 14, top = 270 - g.y - (g.slide ? 26 : 75), bottom = 270 - g.y;
                const obstacleLeft = o.x - (o.kind === 1 ? 5 : 0),
                    obstacleRight = o.x + (o.kind === 2 ? 45 : o.kind === 1 ? 43 : 38);
                if (!o.hit && obstacleRight > left && obstacleLeft < right) {
                    let collision = o.kind === 1 ? bottom > 212 && top < 226 : o.kind === 0 ? bottom > 229 && top < 270 : bottom > 268;
                    if (collision && !g.invulnerable) {
                        g.lives--;
                        g.invulnerable = 1.1;
                        o.hit = true;
                    }
                }
                if (!o.counted && o.x + 38 < left) {
                    g.passed++;
                    o.counted = true;
                }
            }
            g.obstacles = g.obstacles.filter(o => o.x > -60);
            g.lost = g.lives <= 0;
            g.won = !g.lost && g.passed >= g.target;
            if (g.lost || g.won) break;
        }
        return true;
    }

    globalThis.MoonExpedition = {
        create,
        mazeRoute,
        mazeMove,
        toggle,
        mark,
        logicMark,
        nonogramSolutions,
        logicSolutions,
        tick
    };
})();
