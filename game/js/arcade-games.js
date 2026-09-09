"use strict";
(function () {
    const shuffle = (a, r) => {
        a = [...a];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(r() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    };
    const words = 'ABOUT ABOVE ACTOR AFTER AGAIN AGENT ALARM ALIVE ALONE AMONG ANGER APPLE AUDIO AVOID AWAKE BASIC BEGIN BELOW BLACK BLIND BLOCK BOARD BRAIN BREAK BRICK BRING BUILD CABLE CARRY CHAIR CHECK CHILD CLEAN CLEAR CLOCK CLOSE CLOUD COLOR COUNT COVER CRANE CYCLE DAILY DANCE DEATH DELAY DEPTH DOUBT DRAFT DREAM DRINK DRIVE EARTH EIGHT EMPTY ENJOY ENTRY ERROR EVENT EVERY EXACT EXIST EXTRA FAITH FALSE FAULT FIELD FIFTH FINAL FIRST FIXED FLOOR FORCE FOUND FRAME FRESH FRONT FRUIT GIVEN GLASS GLOVE GRACE GRAND GRASS GREAT GREEN GROUP GUARD GUESS GUIDE HABIT HAPPY HEART HEAVY HONEY HORSE HOUSE HUMAN IMAGE INDEX INNER INPUT ISSUE JOINT KNIFE KNOWN LABEL LARGE LASER LATER LAUGH LAYER LEARN LEAVE LEVEL LIGHT LIMIT LIVES LOCAL LUNAR MAGIC MAJOR MATCH MAYBE METAL MIGHT MINOR MODEL MONEY MONTH MOTOR MOUNT MOUTH MUSIC NEVER NIGHT NOISE NORTH NOVEL NURSE OCEAN OFFER OLDER ORDER OTHER OUTER OWNER PANEL PAPER PARTY PAUSE PEACE PHASE PHONE PHOTO PIANO PIECE PILOT PITCH PLACE PLAIN PLANE PLANT PLATE POINT POWER PRESS PRICE PRIDE PRIME PRINT PROOF PROUD PULSE QUERY QUEUE QUICK QUIET RADIO RAISE RANGE REACH READY RELAY RESET RIGHT RIVER ROBOT ROUGH ROUND ROUTE ROYAL RURAL SCALE SCENE SCOPE SCREW SENSE SERVE SEVEN SHALL SHAPE SHARE SHEET SHELF SHIFT SHINE SHIRT SHOCK SHORT SHOWN SIGHT SINCE SIXTH SLEEP SLIDE SMALL SMART SMILE SMOKE SOLAR SOLID SOLVE SOUND SOUTH SPACE SPARE SPEAK SPEED SPELL SPENT SPLIT STAGE STAND START STATE STEAM STEEL STILL STOCK STONE STORE STORM STORY STUDY STYLE SUGAR SUPER TABLE TAKEN TEACH TEETH THEIR THERE THESE THICK THING THINK THIRD THOSE THREE THROW TIGHT TIMER TIRED TITLE TODAY TOKEN TOPIC TOTAL TOUCH TOWER TRACE TRACK TRADE TRAIN TREAT TREND TRIAL TRICK TRIED TROOP TRUCK TRULY TRUST TRUTH TWICE UNDER UNION UNTIL UPPER USUAL VALID VALUE VIDEO VISIT VITAL VOICE WASTE WATCH WATER WHEEL WHERE WHICH WHILE WHITE WHOLE WHOSE WOMAN WORLD WORRY WOULD WRITE WRONG YIELD YOUNG YOUTH'.split(' ');
    const shapes = [[[1, 1, 1, 1]], [[1, 1], [1, 1]], [[0, 1, 0], [1, 1, 1]], [[0, 1, 1], [1, 1, 0]], [[1, 1, 0], [0, 1, 1]], [[1, 0, 0], [1, 1, 1]], [[0, 0, 1], [1, 1, 1]]];

    function solveHuarong(g, limit = 100000) {
        const dims = g.pieces.map(p => [p.w, p.h]),
            signature = pos => pos[0] + '|' + pos[5] + '|' + pos.slice(1, 5).sort((a, b) => a - b).join(',') + '|' + pos.slice(6).sort((a, b) => a - b).join(','),
            start = g.pieces.map(p => p.y * 4 + p.x), queue = [{pos: start, parent: -1, move: null}],
            seen = new Set([signature(start)]);
        for (let k = 0; k < queue.length && k < limit; k++) {
            const v = queue[k];
            if (v.pos[0] === 13) {
                const path = [];
                let at = k;
                while (queue[at].parent >= 0) {
                    path.push(queue[at].move);
                    at = queue[at].parent;
                }
                return path.reverse();
            }
            const masks = v.pos.map((n, i) => {
                let mask = 0;
                for (let y = 0; y < dims[i][1]; y++) for (let x = 0; x < dims[i][0]; x++) mask |= 1 << (n + y * 4 + x);
                return mask;
            }), all = masks.reduce((a, b) => a | b, 0);
            for (let i = 0; i < v.pos.length; i++) for (let d = 0; d < 4; d++) {
                const [dx, dy] = [[0, -1], [1, 0], [0, 1], [-1, 0]][d], x = v.pos[i] % 4 + dx,
                    y = Math.floor(v.pos[i] / 4) + dy;
                if (x < 0 || y < 0 || x + dims[i][0] > 4 || y + dims[i][1] > 5) continue;
                let mask = 0;
                for (let yy = 0; yy < dims[i][1]; yy++) for (let xx = 0; xx < dims[i][0]; xx++) mask |= 1 << ((y + yy) * 4 + x + xx);
                if (mask & (all ^ masks[i])) continue;
                const pos = [...v.pos];
                pos[i] = y * 4 + x;
                const key = signature(pos);
                if (seen.has(key)) continue;
                seen.add(key);
                queue.push({pos, parent: k, move: [i, d]});
            }
        }
        return null;
    }

    let huarongPlan = null;

    function create(kind, {seed = 1, difficulty = 'normal'} = {}) {
        const r = MoonClassic.random(seed), t = Math.max(0, ['easy', 'normal', 'hard'].indexOf(difficulty));
        const g = {kind, seed, difficulty, rng: r, tier: t, selected: null, moves: 0, won: false, lost: false};
        if (kind === 'mines') {
            Object.assign(g, {
                w: [6, 8, 10][t],
                h: [6, 8, 10][t],
                mineCount: [5, 10, 18][t],
                armed: false,
                flagMode: false
            });
            g.cells = Array.from({length: g.w * g.h}, () => ({mine: false, open: false, flag: false, n: 0}));
        } else if (['wordle', 'number-wordle'].includes(kind)) {
            g.length = kind === 'wordle' ? 5 : [4, 5, 6][t];
            g.answer = kind === 'wordle' ? words[Math.floor(r() * words.length)] : Array.from({length: g.length}, () => Math.floor(r() * 10)).join('');
            g.max = [8, 6, 5][t];
            g.guesses = [];
            g.entry = '';
            g.keyboard = {};
        } else if (['memory', 'link'].includes(kind)) {
            g.w = [4, 6, 8][t];
            g.h = kind === 'memory' ? 4 : [4, 6, 6][t];
            g.cells = shuffle(Array.from({length: g.w * g.h}, (_, i) => Math.floor(i / 2) + 1), r);
            g.face = [];
            g.matched = [];
            g.wait = 0;
            g.remaining = g.cells.length;
            g.path = [];
            if (kind === 'link') buildLink(g);
        } else if (kind === 'match3') {
            g.w = 7;
            g.h = 7;
            g.colors = [4, 5, 6][t];
            g.target = [45, 75, 110][t];
            g.cleared = 0;
            g.turns = [30, 32, 35][t];
            do {
                g.cells = Array.from({length: 49}, () => 1 + Math.floor(r() * g.colors));
                for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
                    let i = y * 7 + x;
                    while ((x > 1 && g.cells[i] === g.cells[i - 1] && g.cells[i] === g.cells[i - 2]) || (y > 1 && g.cells[i] === g.cells[i - 7] && g.cells[i] === g.cells[i - 14])) g.cells[i] = 1 + Math.floor(r() * g.colors);
                }
            } while (!matchMove(g));
        } else if (kind === 'huarong') {
            g.w = 4;
            g.h = 5;
            g.pieces = [{x: 1, y: 0, w: 2, h: 2, name: '主舱'}, {x: 0, y: 0, w: 1, h: 2, name: '左上柜'}, {
                x: 3,
                y: 0,
                w: 1,
                h: 2,
                name: '右上柜'
            }, {x: 0, y: 2, w: 1, h: 2, name: '左下柜'}, {x: 3, y: 2, w: 1, h: 2, name: '右下柜'}, {
                x: 1,
                y: 2,
                w: 2,
                h: 1,
                name: '横柜'
            }, {x: 1, y: 3, w: 1, h: 1, name: '箱一'}, {x: 2, y: 3, w: 1, h: 1, name: '箱二'}, {
                x: 0,
                y: 4,
                w: 1,
                h: 1,
                name: '箱三'
            }, {x: 3, y: 4, w: 1, h: 1, name: '箱四'}];
            g.history = [];
            if (!huarongPlan) huarongPlan = solveHuarong(g);
            const advance = Math.max(0, (huarongPlan?.length || 0) - [18, 55, 999][t]);
            for (const [i, d] of (huarongPlan || []).slice(0, advance)) {
                g.selected = i;
                slide(g, d);
            }
            for (let k = 0; k < 6 + Math.floor(r() * 8); k++) {
                const choices = [];
                for (let i = 0; i < g.pieces.length; i++) for (let d = 0; d < 4; d++) {
                    const probe = {...g, pieces: g.pieces.map(v => ({...v})), selected: i, history: []};
                    if (slide(probe, d) && !probe.won) choices.push([i, d]);
                }
                const [i, d] = choices[Math.floor(r() * choices.length)];
                g.selected = i;
                slide(g, d);
            }
            g.selected = null;
            g.moves = 0;
            g.history = [];
            g.won = false;
        } else if (['solitaire', 'spider'].includes(kind)) {
            g.history = [];
            g.completed = 0;
            g.target = kind === 'spider' ? [1, 2, 3][t] : [8, 16, 24][t];
            g.foundation = [0, 0, 0, 0];
            g.waste = [];
            let deck = shuffle(Array.from({length: kind === 'spider' ? 104 : 52}, (_, i) => ({
                rank: i % 13 + 1,
                suit: kind === 'spider' ? 0 : Math.floor(i / 13),
                up: false
            })), r);
            g.cols = Array.from({length: kind === 'spider' ? 10 : 7}, (_, i) => {
                let c = deck.splice(0, kind === 'spider' ? (i < 4 ? 6 : 5) : i + 1);
                c.at(-1).up = true;
                return c;
            });
            g.stock = deck;
        } else if (kind === 'tetris') {
            Object.assign(g, {
                w: 10,
                h: 18,
                cells: Array(180).fill(0),
                bag: [],
                lines: 0,
                target: [4, 7, 10][t],
                fall: 0,
                interval: [.9, .65, .45][t]
            });
            spawnPiece(g);
        } else if (kind === 'jump') {
            Object.assign(g, {
                distance: 140 + r() * 170,
                width: [110, 90, 74][t],
                charge: 0,
                holding: false,
                progress: 0,
                target: [5, 8, 11][t],
                lives: [3, 2, 1][t],
                last: '按住跳跃蓄力，松开落到下一平台。'
            });
        } else if (kind === 'parkour') {
            Object.assign(g, {
                lane: 1,
                jump: 0,
                slide: 0,
                next: 1.2,
                obstacles: [],
                passed: 0,
                target: [12, 18, 24][t],
                lives: [3, 2, 1][t],
                speed: [.32, .4, .48][t],
                elapsed: 0
            });
        } else return null;
        return g;
    }

    function neighbors(g, i) {
        let out = [];
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            const x = i % g.w + dx, y = Math.floor(i / g.w) + dy;
            if ((dx || dy) && x >= 0 && y >= 0 && x < g.w && y < g.h) out.push(y * g.w + x);
        }
        return out;
    }

    function mineClick(g, i, flag = false) {
        const c = g.cells[i];
        if (g.won || g.lost || c.open) return false;
        if (flag) {
            c.flag = !c.flag;
            return true;
        }
        if (c.flag) return false;
        if (!g.armed) {
            const safe = new Set([i, ...neighbors(g, i)]);
            shuffle(g.cells.map((_, j) => j).filter(j => !safe.has(j)), g.rng).slice(0, g.mineCount).forEach(j => g.cells[j].mine = true);
            g.cells.forEach((v, j) => v.n = neighbors(g, j).filter(k => g.cells[k].mine).length);
            g.armed = true;
        }
        if (c.mine) {
            c.open = true;
            g.lost = true;
            return false;
        }
        const q = [i];
        for (let n = 0; n < q.length; n++) {
            const v = g.cells[q[n]];
            if (v.open || v.flag || v.mine) continue;
            v.open = true;
            if (!v.n) q.push(...neighbors(g, q[n]).filter(j => !g.cells[j].open));
        }
        g.won = g.cells.every(v => v.mine || v.open);
        return true;
    }

    function wordFeedback(answer, guess) {
        const mark = Array(answer.length).fill(0), count = {};
        for (let i = 0; i < answer.length; i++) if (answer[i] === guess[i]) mark[i] = 2; else count[answer[i]] = (count[answer[i]] || 0) + 1;
        for (let i = 0; i < answer.length; i++) if (!mark[i] && count[guess[i]]) {
            mark[i] = 1;
            count[guess[i]]--;
        }
        return mark;
    }

    function guess(g, text) {
        text = text.trim().toUpperCase();
        if (text.length !== g.length) return '请填满 ' + g.length + ' 位。';
        if (g.kind === 'wordle' && !words.includes(text)) return '词库中没有这个单词，可展开站内词库查看。';
        if (g.kind === 'number-wordle' && !/^\d+$/.test(text)) return '只接受数字。';
        const marks = wordFeedback(g.answer, text);
        g.guesses.push({text, marks});
        [...text].forEach((v, i) => g.keyboard[v] = Math.max(g.keyboard[v] || 0, marks[i] + 1));
        g.entry = '';
        g.won = text === g.answer;
        g.lost = !g.won && g.guesses.length >= g.max;
        return '';
    }

    function linkPath(g, a, b) {
        if (a === b || !g.cells[a] || g.cells[a] !== g.cells[b]) return null;
        const w = g.w + 2, h = g.h + 2, start = {x: a % g.w + 1, y: Math.floor(a / g.w) + 1},
            end = {x: b % g.w + 1, y: Math.floor(b / g.w) + 1}, q = [{...start, d: -1, turns: 0, path: [start]}],
            seen = new Map();
        for (let k = 0; k < q.length; k++) {
            const v = q[k];
            for (let d = 0; d < 4; d++) {
                const [dx, dy] = [[1, 0], [0, 1], [-1, 0], [0, -1]][d], x = v.x + dx, y = v.y + dy,
                    turns = v.turns + (v.d !== -1 && v.d !== d ? 1 : 0);
                if (x < 0 || y < 0 || x >= w || y >= h || turns > 2) continue;
                if (x === end.x && y === end.y) return [...v.path, {x, y}];
                if (x > 0 && x < w - 1 && y > 0 && y < h - 1 && g.cells[(y - 1) * g.w + x - 1]) continue;
                const key = x + ',' + y + ',' + d;
                if ((seen.get(key) ?? 9) <= turns) continue;
                seen.set(key, turns);
                q.push({x, y, d, turns, path: [...v.path, {x, y}]});
            }
        }
        return null;
    }

    function linkMove(g) {
        for (let i = 0; i < g.cells.length; i++) if (g.cells[i]) for (let j = i + 1; j < g.cells.length; j++) if (linkPath(g, i, j)) return [i, j];
        return null;
    }

    function buildLink(g) {
        const mask = Array(g.w * g.h).fill(1), result = Array(mask.length).fill(0);
        g.certificate = [];
        for (let pair = 1; pair <= mask.length / 2; pair++) {
            const open = shuffle(mask.flatMap((v, i) => v ? [i] : []), g.rng);
            let found;
            for (const a of open) {
                for (const b of open) {
                    if (a !== b && linkPath({...g, cells: mask}, a, b)) {
                        found = [a, b];
                        break;
                    }
                }
                if (found) break;
            }
            if (!found) throw new Error('Link construction failed');
            const [a, b] = found;
            mask[a] = mask[b] = 0;
            result[a] = result[b] = pair;
            g.certificate.push(found);
        }
        g.cells = result;
    }

    function ensureLink(g) {
        return !g.cells.some(Boolean) || !!linkMove(g);
    }

    function pairClick(g, i) {
        if (g.wait || g.matched.includes(i) || !g.cells[i] || g.face?.includes(i) || g.won || g.lost) return null;
        if (g.kind === 'memory') {
            g.face.push(i);
            g.flips = (g.flips || 0) + 1;
            if (g.face.length === 2) {
                g.attempts = (g.attempts || 0) + 1;
                g.pairMatched = g.cells[g.face[0]] === g.cells[i];
                g.wait = g.pairMatched ? .55 : 1.15;
                if (!g.pairMatched) g.mismatches = (g.mismatches || 0) + 1;
            }
        } else if (g.selected === null) g.selected = i; else {
            const path = linkPath(g, g.selected, i);
            g.path = path || [];
            if (path) {
                g.cells[g.selected] = g.cells[i] = 0;
                g.remaining -= 2;
                g.pathAge = 0;
                g.moves++;
            }
            g.selected = null;
            if (!path) return false;
        }
        g.won = g.remaining === 0;
        return true;
    }

    function matches(g) {
        const found = new Set();
        for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
            const i = y * g.w + x, v = g.cells[i];
            if (!v) continue;
            if (x + 2 < g.w && v === g.cells[i + 1] && v === g.cells[i + 2]) for (let k = x; k < g.w && g.cells[y * g.w + k] === v; k++) found.add(y * g.w + k);
            if (y + 2 < g.h && v === g.cells[i + g.w] && v === g.cells[i + 2 * g.w]) for (let k = y; k < g.h && g.cells[k * g.w + x] === v; k++) found.add(k * g.w + x);
        }
        return [...found];
    }

    function matchMove(g) {
        for (let i = 0; i < g.cells.length; i++) for (const j of [i % g.w < g.w - 1 ? i + 1 : -1, i + g.w < g.cells.length ? i + g.w : -1]) if (j >= 0) {
            [g.cells[i], g.cells[j]] = [g.cells[j], g.cells[i]];
            const valid = matches(g).length > 0;
            [g.cells[i], g.cells[j]] = [g.cells[j], g.cells[i]];
            if (valid) return [i, j];
        }
        return null;
    }

    function swapMatch(g, a, b) {
        if (g.animation || g.won || g.lost || a === b) return false;
        const ax = a % g.w, ay = Math.floor(a / g.w), bx = b % g.w, by = Math.floor(b / g.w);
        if (Math.abs(ax - bx) + Math.abs(ay - by) !== 1) return false;
        g.turns--;
        g.moves++;
        [g.cells[a], g.cells[b]] = [g.cells[b], g.cells[a]];
        const found = matches(g);
        if (!found.length) {
            g.turns++;
            g.moves--;
            [g.cells[a], g.cells[b]] = [g.cells[b], g.cells[a]];
            return false;
        }
        g.animation = {phase: 'swap', a, b, clock: 0};
        g.cascade = 0;
        return true;
    }

    function matchTick(g, dt) {
        if (!g.animation) return false;
        g.animation.clock += dt;
        if (g.animation.clock < .28) return false;
        const phase = g.animation.phase;
        if (phase === 'swap' || phase === 'fall') {
            const m = matches(g);
            if (m.length) {
                g.animation = {phase: 'clear', indices: m, clock: 0};
                g.cascade++;
                return true;
            }
            g.animation = null;
            g.won = g.cleared >= g.target;
            g.lost = !g.won && g.turns <= 0;
            if (!g.won && !g.lost && !matchMove(g)) {
                const fresh = create('match3', {seed: Math.floor(g.rng() * 1e9), difficulty: g.difficulty});
                g.cells = fresh.cells;
                g.reshuffled = (g.reshuffled || 0) + 1;
                g.animation = {phase: 'settle', clock: 0};
            }
            return true;
        }
        if (phase === 'clear') {
            const indices = g.animation.indices;
            g.cleared += indices.length;
            indices.forEach(i => g.cells[i] = 0);
            g.falls = [];
            for (let x = 0; x < g.w; x++) {
                const column = [];
                for (let y = g.h - 1; y >= 0; y--) if (g.cells[y * g.w + x]) column.push({
                    value: g.cells[y * g.w + x],
                    from: y
                });
                let fresh = -1;
                while (column.length < g.h) column.push({value: 1 + Math.floor(g.rng() * g.colors), from: fresh--});
                for (let y = g.h - 1, k = 0; y >= 0; y--, k++) {
                    g.cells[y * g.w + x] = column[k].value;
                    g.falls.push({i: y * g.w + x, dy: column[k].from - y});
                }
            }
            g.animation = {phase: 'fall', clock: 0};
            return true;
        }
        g.animation = null;
        return true;
    }

    function slide(g, d) {
        if (g.selected === null) return false;
        const v = g.pieces[g.selected], [dx, dy] = [[0, -1], [1, 0], [0, 1], [-1, 0]][d], x = v.x + dx, y = v.y + dy;
        if (x < 0 || y < 0 || x + v.w > 4 || y + v.h > 5 || g.pieces.some((p, i) => i !== g.selected && x < p.x + p.w && x + v.w > p.x && y < p.y + p.h && y + v.h > p.y)) return false;
        g.history.push(g.pieces.map(p => ({...p})));
        v.x = x;
        v.y = y;
        g.moves++;
        g.won = g.pieces[0].x === 1 && g.pieces[0].y === 3;
        return true;
    }

    function remember(g) {
        g.history.push(JSON.stringify({
            cols: g.cols,
            stock: g.stock,
            waste: g.waste,
            foundation: g.foundation,
            completed: g.completed,
            won: g.won
        }));
        if (g.history.length > 100) g.history.shift();
    }

    function cardUndo(g) {
        const v = g.history.pop();
        if (!v) return false;
        g.moves++;
        Object.assign(g, JSON.parse(v));
        g.selected = null;
        return true;
    }

    function cardSource(g) {
        if (!g.selected) return null;
        return g.selected.col === -1 ? g.waste : g.cols[g.selected.col];
    }

    function cardSelect(g, col, index) {
        const c = col === -1 ? g.waste : g.cols[col], run = c.slice(index);
        if (!run[0]?.up) return false;
        if (col === -1 && index !== c.length - 1) return false;
        for (let i = 1; i < run.length; i++) if (run[i - 1].rank !== run[i].rank + 1 || (g.kind === 'spider' ? run[i - 1].suit !== run[i].suit : run[i - 1].suit % 2 === run[i].suit % 2)) return false;
        g.selected = {col, index};
        return true;
    }

    function cardMove(g, dest) {
        const src = cardSource(g);
        if (!src || dest === g.selected.col) return false;
        const run = src.slice(g.selected.index), top = g.cols[dest].at(-1);
        if (top ? top.rank !== run[0].rank + 1 || (g.kind === 'solitaire' && top.suit % 2 === run[0].suit % 2) : g.kind === 'solitaire' && run[0].rank !== 13) return false;
        remember(g);
        g.cols[dest].push(...src.splice(g.selected.index));
        if (src.length) src.at(-1).up = true;
        g.selected = null;
        g.moves++;
        collectSpider(g);
        return true;
    }

    function foundation(g, suit) {
        const src = cardSource(g), c = src?.at(-1);
        if (!c || g.selected.index !== src.length - 1 || c.suit !== suit || c.rank !== g.foundation[suit] + 1) return false;
        remember(g);
        src.pop();
        if (src.length) src.at(-1).up = true;
        g.foundation[suit]++;
        g.selected = null;
        g.won = g.foundation.reduce((a, b) => a + b, 0) >= g.target;
        return true;
    }

    function collectSpider(g) {
        if (g.kind !== 'spider') return;
        g.cols.forEach(c => {
            const run = c.slice(-13);
            if (run.length === 13 && run.every((v, i) => v.up && v.rank === 13 - i && v.suit === run[0].suit)) {
                c.splice(-13);
                g.completed++;
                if (c.length) c.at(-1).up = true;
            }
        });
        g.won = g.completed >= g.target;
    }

    function deal(g) {
        if (g.kind === 'spider') {
            if (!g.stock.length || g.cols.some(c => !c.length)) return false;
            remember(g);
            g.cols.forEach(c => {
                const v = g.stock.pop();
                v.up = true;
                c.push(v);
            });
            collectSpider(g);
        } else {
            if (!g.stock.length && !g.waste.length) return false;
            remember(g);
            if (g.stock.length) {
                const c = g.stock.pop();
                c.up = true;
                g.waste.push(c);
            } else {
                g.stock = g.waste.reverse();
                g.stock.forEach(c => c.up = false);
                g.waste = [];
            }
        }
        g.selected = null;
        g.moves++;
        return true;
    }

    function pieceFits(g, p, x, y) {
        return p.every((row, j) => row.every((v, i) => !v || (x + i >= 0 && x + i < g.w && y + j >= 0 && y + j < g.h && !g.cells[(y + j) * g.w + x + i])));
    }

    function spawnPiece(g) {
        if (!g.bag.length) g.bag = shuffle([0, 1, 2, 3, 4, 5, 6], g.rng);
        g.type = g.bag.pop();
        g.piece = shapes[g.type].map(r => [...r]);
        g.x = 3;
        g.y = 0;
        if (!pieceFits(g, g.piece, g.x, g.y)) g.lost = true;
    }

    function lock(g) {
        g.piece.forEach((row, j) => row.forEach((v, i) => {
            if (v) g.cells[(g.y + j) * g.w + g.x + i] = g.type + 1;
        }));
        const rows = [];
        for (let y = 0; y < g.h; y++) {
            const row = g.cells.slice(y * g.w, (y + 1) * g.w);
            if (row.every(Boolean)) g.lines++; else rows.push(row);
        }
        while (rows.length < g.h) rows.unshift(Array(g.w).fill(0));
        g.cells = rows.flat();
        g.won = g.lines >= g.target;
        if (!g.won) spawnPiece(g);
    }

    function tetrisMove(g, action) {
        if (g.won || g.lost) return false;
        if (action === 'rotate') {
            const p = g.piece[0].map((_, i) => g.piece.map(row => row[i]).reverse());
            for (const dx of [0, -1, 1, -2, 2]) if (pieceFits(g, p, g.x + dx, g.y)) {
                g.piece = p;
                g.x += dx;
                return true;
            }
            return false;
        }
        if (action === 'drop') {
            while (pieceFits(g, g.piece, g.x, g.y + 1)) g.y++;
            lock(g);
            return true;
        }
        const dx = action === 'left' ? -1 : action === 'right' ? 1 : 0, dy = action === 'down' ? 1 : 0;
        if (pieceFits(g, g.piece, g.x + dx, g.y + dy)) {
            g.x += dx;
            g.y += dy;
            return true;
        }
        if (dy) lock(g);
        return false;
    }

    function jumpRelease(g) {
        if (!g.holding || g.flight || g.won || g.lost) return;
        g.holding = false;
        const distance = 100 + g.charge * 180, error = Math.abs(distance - g.distance);
        g.flight = {elapsed: 0, distance, platform: g.distance, width: g.width};
        g.last = '跃迁 ' + Math.round(distance) + ' / 平台 ' + Math.round(g.distance);
        g.flight.success = error <= g.width / 2;
        g.charge = 0;
    }

    function tick(g, dt) {
        if (g.won || g.lost) return false;
        if (g.kind === 'match3') return matchTick(g, dt);
        if (g.kind === 'link' && g.path?.length) {
            g.pathAge = (g.pathAge || 0) + dt;
            if (g.pathAge > .65) {
                g.path = [];
                return true;
            }
        }
        if (g.kind === 'memory' && g.wait) {
            g.wait = Math.max(0, g.wait - dt);
            if (!g.wait) {
                if (g.pairMatched) {
                    g.matched.push(...g.face);
                    g.remaining -= 2;
                }
                g.face = [];
                g.pairMatched = false;
                g.won = g.remaining === 0;
                g.lost = !g.won && (g.mismatches || 0) >= (g.maxMistakes || [14, 18, 22][g.tier]);
                return true;
            }
        }
        if (g.kind === 'tetris') {
            g.fall += dt;
            while (g.fall >= g.interval && !g.lost && !g.won) {
                g.fall -= g.interval;
                tetrisMove(g, 'down');
            }
            return true;
        }
        if (g.kind === 'jump' && g.flight) {
            g.flight.elapsed += dt;
            g.holding = false;
            if (g.flight.elapsed >= .65) {
                if (g.flight.success) {
                    g.progress++;
                    g.last += ' · 着陆';
                    g.won = g.progress >= g.target;
                    g.distance = 140 + g.rng() * 180;
                } else {
                    g.lives--;
                    g.last += ' · 偏离，保护装置复位';
                    g.lost = g.lives <= 0;
                }
                g.flight = null;
            }
            return true;
        }
        if (g.kind === 'jump' && g.holding) {
            g.charge = Math.min(1.5, g.charge + dt);
            return true;
        }
        if (g.kind === 'parkour') {
            g.elapsed += dt;
            g.jump = Math.max(0, g.jump - dt);
            g.slide = Math.max(0, g.slide - dt);
            g.next -= dt;
            if (g.next <= 0) {
                g.obstacles.push({lane: Math.floor(g.rng() * 3), kind: Math.floor(g.rng() * 3), z: 0, done: false});
                g.next = 1.25 + g.rng() * .4;
            }
            for (const o of g.obstacles) {
                o.z += dt * g.speed;
                if (o.z >= 1 && !o.done) {
                    o.done = true;
                    g.passed++;
                    if (o.lane === g.lane && !(o.kind === 0 && g.jump > 0) && !(o.kind === 1 && g.slide > 0)) g.lives--;
                }
            }
            g.obstacles = g.obstacles.filter(o => o.z < 1.15);
            g.won = g.passed >= g.target && g.lives > 0;
            g.lost = g.lives <= 0;
            return true;
        }
        return false;
    }

    globalThis.MoonArcade = Object.freeze({
        create,
        solveHuarong,
        words,
        shuffle,
        mineClick,
        wordFeedback,
        guess,
        linkPath,
        linkMove,
        ensureLink,
        pairClick,
        matches,
        matchMove,
        swapMatch,
        slide,
        cardSelect,
        cardMove,
        foundation,
        deal,
        cardUndo,
        pieceFits,
        tetrisMove,
        jumpRelease,
        tick
    });
})();