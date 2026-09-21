"use strict";


(function () {
    const NORM = {KeyA: 'ArrowLeft', KeyD: 'ArrowRight', KeyW: 'ArrowUp', KeyS: 'ArrowDown'},
        ARROWS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'],
        SLOTS = ['Digit1', 'Digit2', 'Digit3', 'KeyJ', 'KeyK', 'KeyL'];
    const USED = {
        'leak-hunt': [...ARROWS, 'Space'],
        'surge-bank': ['ArrowLeft', 'ArrowRight', 'Space'],
        'credential-sort': SLOTS,
        'stream-merge': ['Space'],
        'probe-steady': ['Space'],
        'energy-catch': ['ArrowLeft', 'ArrowRight'],
        'noise-filter': SLOTS,
        'wave-align': ARROWS,
        'purge': [...ARROWS, 'Space'],
        'scan-sweep': ARROWS,
        'packet-run': ARROWS,
        'parkour-run': [...ARROWS, 'Space']
    };

    function clamp(v, a, b) {
        return v < a ? a : v > b ? b : v;
    }

    function scatter(rng, n, x0, x1, y0, y1, cx, cy, minC, mutual) {
        const pts = [];
        for (let k = 0; k < n; k++) {
            let x = 0, y = 0;
            for (let a = 0; a < 400; a++) {
                x = x0 + rng() * (x1 - x0);
                y = y0 + rng() * (y1 - y0);
                if (Math.hypot(x - cx, y - cy) >= minC && !pts.some(q => Math.hypot(x - q.x, y - q.y) < mutual)) break;
            }
            pts.push({x, y});
        }
        return pts;
    }

    function create(game, {seed = 1, difficulty = 'normal'} = {}) {
        const idx = ['easy', 'normal', 'hard'].indexOf(difficulty), t = idx < 0 ? 1 : idx,
            rng = MoonClassic.random(seed);
        const base = {
            game,
            seed,
            difficulty,
            tier: t,
            rng,
            elapsed: 0,
            won: false,
            lost: false,
            calm: false,
            assistText: '',
            keys: {},
            pointer: {x: 300, y: 150},
            flash: 0,
            shake: 0
        };
        let g = null;
        if (game === 'leak-hunt') {
            g = Object.assign({}, base, {
                kind: 'leak-hunt',
                player: {x: 300, y: 150},
                leaks: [],
                pulses: [],
                shots: [],
                cd: 0,
                hold: 0,
                sealed: 0,
                pressure: 0,
                shield: [5, 4, 3][t],
                iT: 0,
                hits: 0
            });
            for (const p of scatter(rng, [4, 5, 6][t], 40, 560, 40, 260, 300, 150, 120, 90)) g.leaks.push({
                x: p.x,
                y: p.y,
                found: false,
                sealed: false,
                timer: 2.4 + rng() * 1.8,
                seed: rng() * 6.283,
                pattern: rng() < 0.5 ? 0 : 1
            });
        } else if (game === 'surge-bank') {
            g = Object.assign({}, base, {
                kind: 'surge-bank',
                cart: 1,
                packets: [],
                next: [1.1, 0.85, 0.65][t],
                meter: 0,
                banked: 0,
                overload: 0
            });
        } else if (game === 'credential-sort') {

            g = Object.assign({}, base, {
                kind: 'credential-sort',
                cards: [],
                next: [1.4, 1.05, 0.8][t],
                routed: 0,
                mistakes: 0,
                names: ['17号生物个体', '原武康签注', '公共家庭记录', '见证声明'],
                routes: [1, 3, 2, 2]
            });
        } else if (game === 'stream-merge') {

            g = Object.assign({}, base, {
                kind: 'stream-merge',
                pairs: [],
                next: [1.6, 1.3, 1.05][t],
                merges: 0,
                mistakes: 0,
                tears: 0
            });
        } else if (game === 'probe-steady') {
            g = Object.assign({}, base, {
                kind: 'probe-steady',
                probe: {x: 300, y: 150},
                driftX: 0,
                driftY: 0,
                driftT: [1.0, 0.8, 0.6][t],
                progress: 0,
                samples: 0,
                hits: 0,
                heat: 0,
                heatT: [4, 3.2, 2.6][t]
            });
        } else if (game === 'energy-catch') {
            g = Object.assign({}, base, {
                kind: 'energy-catch',
                orbs: [],
                next: [1.1, 0.9, 0.7][t],
                sled: {lane: 1, color: 0},
                colorT: [6, 5, 4][t],
                charge: 0,
                leaks: 0,
                autoColor: false
            });
        } else if (game === 'noise-filter') {
            g = Object.assign({}, base, {
                kind: 'noise-filter',
                packets: [],
                next: [0.75, 0.62, 0.5][t],
                cleaned: 0,
                static: 0
            });
        } else if (game === 'wave-align') {
            g = Object.assign({}, base, {
                kind: 'wave-align',
                freq: 1.5,
                amp: 0.6,
                lockProgress: 0,
                locks: 0,
                driftT: 1.5,
                drift: [0.04, 0.07, 0.10][t] * (rng() < 0.5 ? -1 : 1),
                targetF: 0.8 + rng() * 1.8,
                targetA: 0.3 + rng() * 0.6
            });
        } else if (game === 'purge') {
            g = Object.assign({}, base, {
                kind: 'purge',
                player: {x: 300, y: 230},
                vx: 0,
                vy: 0,
                core: {x: 300, y: 150, hp: 100},
                blobs: [],
                shots: [],
                ebullets: [],
                sparks: [],
                next: [2.2, 1.8, 1.4][t],
                cd: 0,
                muzzle: 0,
                kills: 0,
                hits: 0,
                hp: [6, 5, 4][t],
                hpMax: [6, 5, 4][t],
                chargeT: 0,
                iT: 0
            });
        } else if (game === 'packet-run') {

            g = Object.assign({}, base, {
                kind: 'packet-run',
                player: {x: 80, y: 150},
                vx: 0,
                vy: 0,
                shards: [],
                noises: [],
                sparks: [],
                next: 1.2,
                integrity: 100,
                locked: 0,
                order: 0,
                portOpen: false,
                port: {x: 560, y: 150},
                iT: 0,
                hits: 0
            });
            const labels = ['坐标', '人数', '时间', '校验'];
            for (let k = 0; k < 4; k++) {
                const pt = scatter(rng, 1, 150, 480, 40, 260, 0, 0, 0, 0)[0];
                g.shards.push({
                    x: pt.x,
                    y: pt.y,
                    vx: (rng() - .5) * 36,
                    vy: (rng() - .5) * 36,
                    label: labels[k],
                    locked: false
                });
            }
        } else if (game === 'scan-sweep') {
            const r = [55, 46, 38][t];
            g = Object.assign({}, base, {kind: 'scan-sweep', scan: {x: 300, y: 150}, scanV: 0, zones: [], found: 0});
            for (const p of scatter(rng, [3, 4, 5][t], 40, 560, 40, 260, 0, 0, 0, 2.2 * r)) g.zones.push({
                x: p.x,
                y: p.y,
                r,
                progress: 0,
                found: false,
                hint: false
            });
        } else if (game === 'parkour-run') {

            g = Object.assign({}, base, {
                kind: 'parkour-run',
                player: {x: 60, y: 520, vx: 0, vy: 0},
                face: 1,
                onGround: true,
                jumps: 0,
                coyote: 0,
                jumpBuf: 0,
                dropT: 0,
                spin: 0,
                squash: 0,
                groundM: null,
                iT: 0,
                integrity: [7, 6, 5][t],
                hpMax: [7, 6, 5][t],
                cells: 0,
                hits: 0,
                falls: 0,
                cam: {x: 0, y: 0},
                checkpoint: {x: 60, y: 520},
                msg: '',
                msgT: 0,
                hinted: false,
                sparks: [],
                plats: [],
                movers: [],
                drones: [],
                vents: [],
                orbs: [],
                posts: [],
                pads: [],
                goal: {x: 3560, y: 300}
            });
            const P = (x, y, w, h, one) => g.plats.push({x, y, w, h, one: !!one});

            P(0, 520, 470, 120);
            P(390, 458, 130, 14, 1);
            P(520, 492, 110, 14, 1);
            P(700, 462, 110, 14, 1);
            P(880, 520, 220, 120);
            P(1150, 458, 110, 14, 1);
            P(1300, 396, 110, 14, 1);
            P(1450, 334, 110, 14, 1);
            P(1600, 300, 180, 16, 1);
            P(1900, 282, 90, 14, 1);
            P(2130, 330, 170, 16, 1);
            P(2380, 380, 150, 14, 1);
            P(2620, 450, 150, 14, 1);
            P(2860, 520, 420, 120);
            P(3220, 392, 100, 14, 1);
            P(3350, 480, 110, 14, 1);
            P(3520, 300, 100, 16);
            g.movers = [
                {
                    x: 1774,
                    y: 288,
                    w: 76,
                    h: 14,
                    cx: 1830,
                    cy: 288,
                    range: 56,
                    speed: 50,
                    ph: 0,
                    axis: 'x',
                    px: 0,
                    py: 0
                },
                {
                    x: 2002,
                    y: 210,
                    w: 84,
                    h: 14,
                    cx: 2002,
                    cy: 284,
                    range: 74,
                    speed: 40,
                    ph: 1.6,
                    axis: 'y',
                    px: 0,
                    py: 0
                }
            ];
            g.drones = [
                {x: 1440, y: 300, x0: 1440, x1: 1440, y0: 300, y1: 470, sp: 60, dir: 1, axis: 'y'},
                {x: 1700, y: 206, x0: 1660, x1: 2060, y0: 206, y1: 206, sp: 56, dir: 1, axis: 'x'},
                {x: 2320, y: 340, x0: 2280, x1: 2600, y0: 340, y1: 340, sp: 62, dir: 1, axis: 'x'},
                {x: 2900, y: 486, x0: 2880, x1: 3230, y0: 486, y1: 486, sp: 72, dir: 1, axis: 'x'}
            ];
            const cyc = [3.0, 2.6, 2.2][t];
            g.vents = [
                {x: 2455, y: 380, cycle: cyc, ph: 0.4, warn: false, fire: false},
                {x: 2695, y: 450, cycle: cyc, ph: 1.5, warn: false, fire: false},
                {x: 2985, y: 520, cycle: [2.8, 2.4, 2.0][t], ph: 0.9, warn: false, fire: false},
                {x: 3165, y: 520, cycle: [2.8, 2.4, 2.0][t], ph: 2.0, warn: false, fire: false}
            ];
            g.pads = [{x: 3400, y: 480, t: 0}];
            g.posts = [{x: 555, y: 492, active: false}, {x: 940, y: 520, active: false}, {
                x: 1680,
                y: 300,
                active: false
            }, {x: 2200, y: 330, active: false}, {x: 2930, y: 520, active: false}];
            const ORBS = [[200, 470], [330, 455], [455, 420], [575, 452], [750, 415], [960, 470], [1060, 480], [1205, 415], [1505, 290], [1560, 240], [1690, 255], [1860, 240], [1955, 235], [2060, 230], [2185, 290], [2410, 330], [2560, 320], [2660, 400], [2830, 470], [3050, 470], [3270, 350], [3400, 430], [3470, 255], [3560, 250]];
            for (const [ox, oy] of ORBS) g.orbs.push({x: ox, y: oy, taken: false});
        }
        return g;
    }

    function leakStep(g, h) {
        const p = g.player;
        let dx = (g.keys.ArrowRight ? 1 : 0) - (g.keys.ArrowLeft ? 1 : 0),
            dy = (g.keys.ArrowDown ? 1 : 0) - (g.keys.ArrowUp ? 1 : 0);
        if (dx && dy) {
            dx *= Math.SQRT1_2;
            dy *= Math.SQRT1_2;
        }
        p.x = clamp(p.x + dx * 150 * h, 14, 586);
        p.y = clamp(p.y + dy * 150 * h, 14, 286);
        g.cd = Math.max(0, g.cd - h);
        g.iT = Math.max(0, (g.iT || 0) - h);
        for (let i = g.pulses.length - 1; i >= 0; i--) {
            const u = g.pulses[i];
            u.r += 140 * h;
            u.age += h;
            if (u.age >= 1.4) g.pulses.splice(i, 1);
        }
        for (const le of g.leaks) if (!le.found) for (const u of g.pulses) if (Math.hypot(le.x - u.x, le.y - u.y) <= u.r) {
            le.found = true;
            break;
        }

        const target = g.leaks.find(le => le.found && !le.sealed && Math.hypot(le.x - p.x, le.y - p.y) <= 26);
        if (target && g.keys.Space) {
            g.hold += h;
            if (g.hold >= 1.0) {
                target.sealed = true;
                g.sealed++;
                g.hold = 0;

                for (let i = g.shots.length - 1; i >= 0; i--) if (Math.hypot(g.shots[i].x - target.x, g.shots[i].y - target.y) < 85) g.shots.splice(i, 1);
            }
        } else g.hold *= 0.9;


        for (const le of g.leaks) {
            if (!le.found || le.sealed) continue;
            if (Math.hypot(le.x - p.x, le.y - p.y) < 45) {
                le.timer = Math.max(le.timer, 0.35);
                le.lockAim = undefined;
                continue;
            }
            if (le.timer <= 0.5 && le.lockAim === undefined) le.lockAim = Math.atan2(p.y - le.y, p.x - le.x);
            le.timer -= h;

            if (le.timer <= 0 && g.shots.length < 12) {
                const aim = le.lockAim !== undefined ? le.lockAim : Math.atan2(p.y - le.y, p.x - le.x),
                    S = [85, 106, 132][g.tier] * (g.calm ? 0.7 : 1);

                const pool = [[0, 1], [0, 1, 3, 5], [0, 1, 2, 3, 4, 5]][g.tier];
                const pat = pool[Math.floor(g.rng() * pool.length)];
                if (pat === 0) for (let k = -1; k <= 1; k++) g.shots.push({
                    x: le.x,
                    y: le.y,
                    vx: Math.cos(aim + k * 0.44) * S,
                    vy: Math.sin(aim + k * 0.44) * S
                });
                else if (pat === 1) for (let k = 0; k < 8; k++) {
                    const a = le.seed + k * 0.7854;
                    g.shots.push({x: le.x, y: le.y, vx: Math.cos(a) * S * 0.78, vy: Math.sin(a) * S * 0.78});
                }
                else if (pat === 2) g.shots.push({
                    x: le.x,
                    y: le.y,
                    vx: Math.cos(aim) * S * 1.6,
                    vy: Math.sin(aim) * S * 1.6
                });
                else if (pat === 3) for (let k = 0; k < 5; k++) {
                    const a = aim + (k - 2) * 0.3;
                    g.shots.push({x: le.x, y: le.y, vx: Math.cos(a) * S * 1.1, vy: Math.sin(a) * S * 1.1});
                }
                else if (pat === 5) for (let k = -1; k <= 1; k++) g.shots.push({
                    x: le.x,
                    y: le.y,
                    vx: Math.cos(aim + k * 0.09) * S * 2.1,
                    vy: Math.sin(aim + k * 0.09) * S * 2.1
                });
                else for (let k = 0; k < 4; k++) {
                        const a = le.seed + k * 1.5708 + aim;
                        g.shots.push({x: le.x, y: le.y, vx: Math.cos(a) * S * 0.95, vy: Math.sin(a) * S * 0.95});
                    }
                le.lockAim = undefined;

                le.timer = (pat === 5 ? [7.5, 6.5, 5.5] : [3.9, 3.2, 2.5])[g.tier] * (g.calm ? 1.8 : 1);
            }
            if (le.timer <= 0) le.timer = 0.2;
        }
        for (let i = g.shots.length - 1; i >= 0; i--) {
            const b = g.shots[i];
            b.x += b.vx * h;
            b.y += b.vy * h;
            b.age = (b.age || 0) + h;
            if (b.age > 3.2 || b.x < -24 || b.x > 624 || b.y < -24 || b.y > 324) {
                g.shots.splice(i, 1);
                continue;
            }
            if (!(g.iT > 0) && Math.hypot(b.x - p.x, b.y - p.y) < 17) {
                g.shots.splice(i, 1);
                g.hits++;
                g.shield--;
                g.iT = 1.3;
                g.shake = 0.35;
                g.flash = 0.2;
                if (g.shield <= 0) {
                    g.shield = 0;
                    g.lost = true;
                }
            }
        }
        let open = 0;
        for (const le of g.leaks) if (!le.sealed) open++;

        g.pressure = Math.min(100, g.pressure + [0.5, 0.62, 0.75][g.tier] * open * (g.calm ? 0.5 : 1) * h);
        if (g.pressure >= 100) g.lost = true;
        if (!g.lost && g.sealed >= g.leaks.length) g.won = true;
    }

    function surgeStep(g, h) {
        g.next -= h;
        if (g.next <= 0) {
            g.packets.push({lane: Math.floor(g.rng() * 4), y: -20, v: [70, 95, 120][g.tier] * (g.calm ? 0.5 : 1)});
            g.next = [1.1, 0.85, 0.65][g.tier] * (g.calm ? 2 : 1);
        }
        for (let i = g.packets.length - 1; i >= 0; i--) {
            const p = g.packets[i];
            p.y += p.v * h;
            if (p.y >= 250) {
                g.packets.splice(i, 1);

                if (p.lane === g.cart) {
                    g.meter += 34;
                    if (g.meter > 100) {
                        g.overload++;
                        g.meter = 34;
                    }
                }
            }
        }
        if (g.overload >= 3) g.lost = true;
        if (!g.lost && g.banked >= [6, 8, 10][g.tier]) g.won = true;
    }

    function sortStep(g, h) {
        g.next -= h;
        if (g.next <= 0) {
            g.cards.push({x: -40, type: Math.floor(g.rng() * 4), routed: false});
            g.next = [1.4, 1.05, 0.8][g.tier] * (g.calm ? 2 : 1);
        }
        const v = [70, 95, 120][g.tier] * (g.calm ? 0.5 : 1);
        for (let i = g.cards.length - 1; i >= 0; i--) {
            const c = g.cards[i];
            c.x += v * h;
            if (c.x > 640) {
                if (!c.routed) g.mistakes++;
                g.cards.splice(i, 1);
            }
        }
        if (g.mistakes >= 3) g.lost = true;
        if (!g.lost && g.routed >= [8, 10, 12][g.tier]) g.won = true;
    }

    function mergeStep(g, h) {
        g.next -= h;
        if (g.next <= 0) {
            g.pairs.push({x: -40, color: Math.floor(g.rng() * 4), merged: false});
            g.next = [1.6, 1.3, 1.05][g.tier] * (g.calm ? 2 : 1);
        }
        const v = [95, 120, 150][g.tier] * (g.calm ? 0.5 : 1);
        for (let i = g.pairs.length - 1; i >= 0; i--) {
            const p = g.pairs[i];
            p.x += v * h;
            if (p.x > 640) {
                if (!p.merged) g.tears++;
                g.pairs.splice(i, 1);
            }
        }
        if (g.tears >= 3) g.lost = true;
        if (!g.lost && g.merges >= [7, 9, 11][g.tier]) g.won = true;
    }

    function probeStep(g, h) {
        const t = g.tier, p = g.probe, k = Math.min(1, 6 * h);
        g.driftT -= h;
        if (g.driftT <= 0) {
            const a = g.rng() * Math.PI * 2, m = [26, 40, 56][t];
            g.driftX = Math.cos(a) * m;
            g.driftY = Math.sin(a) * m;
            g.driftT = [1.0, 0.8, 0.6][t];
        }
        p.x += (g.pointer.x - p.x) * k + g.driftX * h;
        p.y += (g.pointer.y - p.y) * k + g.driftY * h;
        const cy = 150 + Math.sin(g.elapsed * 0.7) * 24 + Math.sin(g.elapsed * 1.13 + 2) * 12, gap = [26, 20, 15][t];
        g.iT = Math.max(0, (g.iT || 0) - h);
        if (Math.abs(p.y - cy) >= gap && !g.iT) {

            g.hits++;
            g.flash = 0.2;
            g.shake = 0.3;
            g.progress = Math.max(0, g.progress - 15);
            p.y = cy;
            g.iT = 0.8;
            if (g.hits >= 3) g.lost = true;
        } else if (p.x >= 60 && p.x <= 540) g.progress += 22 * h;
        if (!g.lost && g.progress >= 100) {
            g.progress = 0;
            g.samples++;
            if (g.samples >= 3) g.won = true;
        }
        if (!g.calm) {

            if (g.heat > 0) {
                g.heat -= h;
                if (g.heat <= 0) {
                    g.heat = 0;
                    g.progress = Math.max(0, g.progress - 10);
                }
            }
            g.heatT -= h;
            if (g.heatT <= 0) {
                g.heat = 1;
                g.heatT = [4, 3.2, 2.6][t];
            }
        }
    }

    function catchStep(g, h) {
        const t = g.tier;
        if (g.autoColor) {
            let low = null;
            for (const o of g.orbs) if (o.lane === g.sled.lane && (low === null || o.y > low.y)) low = o;
            if (low) g.sled.color = low.color;
        } else {
            g.colorT -= h;
            if (g.colorT <= 0) {
                g.sled.color = (g.sled.color + 1) % 3;
                g.colorT = [6, 5, 4][t];
            }
        }
        g.next -= h;
        if (g.next <= 0) {
            g.orbs.push({lane: Math.floor(g.rng() * 3), y: -20, color: Math.floor(g.rng() * 3), v: [110, 140, 175][t]});
            g.next = [1.1, 0.9, 0.7][t];
        }
        for (let i = g.orbs.length - 1; i >= 0; i--) {
            const o = g.orbs[i];
            o.y += o.v * h;
            if (o.y >= 260) {
                g.orbs.splice(i, 1);
                if (o.lane === g.sled.lane) {
                    if (o.color === g.sled.color) g.charge += 14;
                    else {
                        g.leaks++;
                        g.charge = Math.max(0, g.charge - 6);
                        g.flash = 0.2;
                        g.shake = 0.25;
                    }
                } else if (o.color === g.sled.color) g.charge = Math.max(0, g.charge - 4);
            }
        }
        if (g.leaks >= 3) g.lost = true;
        if (!g.lost && g.charge >= [70, 90, 110][t]) g.won = true;
    }

    function noiseStep(g, h) {
        g.next -= h;
        if (g.next <= 0) {
            g.packets.push({
                x: 640,
                lane: Math.floor(g.rng() * 3),
                type: g.rng() < 0.85 ? 'noise' : 'voice',
                v: [130, 160, 190][g.tier]
            });
            g.next = [0.75, 0.62, 0.5][g.tier] * (g.calm ? 2 : 1);
        }
        for (let i = g.packets.length - 1; i >= 0; i--) {
            const p = g.packets[i];
            p.x -= p.v * h;
            if (p.x < 420) {
                if (p.type === 'noise') g.static += 12;
                g.packets.splice(i, 1);
            }
        }
        if (g.static >= 100) g.lost = true;
        if (!g.lost && g.cleaned >= [10, 13, 16][g.tier]) g.won = true;
    }

    function waveStep(g, h) {
        const t = g.tier;
        g.driftT -= h;
        if (g.driftT <= 0) {
            g.drift = [0.04, 0.07, 0.10][t] * (g.rng() < 0.5 ? -1 : 1);
            g.driftT = 1.5;
        }
        if (g.keys.ArrowLeft) g.freq -= [0.22, 0.3, 0.4][t] * h;
        if (g.keys.ArrowRight) g.freq += [0.22, 0.3, 0.4][t] * h;
        if (g.keys.ArrowUp) g.amp += 0.15 * h;
        if (g.keys.ArrowDown) g.amp -= 0.15 * h;
        g.freq = clamp(g.freq + g.drift * h, 0.05, 3.5);
        g.amp = clamp(g.amp, 0.05, 1);
        const overlap = 1 - Math.min(1, Math.abs(g.freq - g.targetF) / 1.4 + Math.abs(g.amp - g.targetA) / 0.9);
        if (overlap >= 0.9) g.lockProgress += 34 * h;
        else if (overlap < 0.85) g.lockProgress = Math.max(0, g.lockProgress - 20 * h);
        if (g.lockProgress >= 100) {
            g.locks++;
            g.lockProgress = 0;
            g.targetF = 0.8 + g.rng() * 1.8;
            g.targetA = 0.3 + g.rng() * 0.6;
            g.flash = 0.2;
            if (g.locks >= 3) g.won = true;
        }
    }

    function purgeStep(g, h) {
        const t = g.tier, p = g.player;
        let ax = (g.keys.ArrowRight ? 1 : 0) - (g.keys.ArrowLeft ? 1 : 0),
            ay = (g.keys.ArrowDown ? 1 : 0) - (g.keys.ArrowUp ? 1 : 0);
        if (ax && ay) {
            ax *= Math.SQRT1_2;
            ay *= Math.SQRT1_2;
        }

        g.vx = (g.vx + ax * 1600 * h) * 0.95;
        g.vy = (g.vy + ay * 1600 * h) * 0.95;
        p.x = clamp(p.x + g.vx * h, 14, 586);
        p.y = clamp(p.y + g.vy * h, 14, 286);
        g.cd = Math.max(0, g.cd - h);
        g.iT = Math.max(0, (g.iT || 0) - h);
        g.muzzle = Math.max(0, (g.muzzle || 0) - h);

        if (g.hp < g.hpMax && Math.hypot(p.x - 300, p.y - 150) < 64 && !ax && !ay) {
            g.chargeT += h;
            if (g.chargeT >= 2.2) {
                g.hp = g.hpMax;
                g.chargeT = 0;
                g.flash = 0.2;
                for (let k = 0; k < 6; k++) g.sparks.push({
                    x: p.x,
                    y: p.y,
                    vx: (g.rng() - .5) * 180,
                    vy: (g.rng() - .5) * 180,
                    age: 0,
                    life: .4,
                    col: '#8db2a6'
                });
            }
        } else g.chargeT = Math.max(0, g.chargeT - h * 2);

        const lowP = g.hp <= g.hpMax / 2;
        if (g.keys.Space && g.cd <= 0 && g.blobs.length) {
            let best = null, bd = 1e9;
            for (const b of g.blobs) {
                const d = Math.hypot(b.x - p.x, b.y - p.y);
                if (d < bd) {
                    bd = d;
                    best = b;
                }
            }
            if (best && bd <= 268) {
                let tx2 = best.x, ty2 = best.y;
                if (best.vx !== undefined) {
                    const tt = bd / 470;
                    tx2 += best.vx * tt;
                    ty2 += best.vy * tt;
                }
                const d = Math.hypot(tx2 - p.x, ty2 - p.y) || 1;
                g.shots.push({
                    x: p.x,
                    y: p.y,
                    vx: (tx2 - p.x) / d * 470,
                    vy: (ty2 - p.y) / d * 470,
                    age: 0,
                    life: 0.55
                });
                g.cd = [0.36, 0.3, 0.24][t] * (lowP ? 1.8 : 1);
                g.muzzle = 0.06;
            }
        }
        g.next -= h;
        if (g.next <= 0) {


            const roll = g.rng(), side = Math.floor(g.rng() * 4);
            const wSp5 = [0.16, 0.19, 0.22], wT4 = [0.12, 0.15, 0.18], wSh1 = [0.24, 0.3, 0.34];
            let type = 0;
            if (roll < wSp5[t]) type = 5;
            else if (roll < wSp5[t] + wT4[t]) type = 4;
            else if (roll < wSp5[t] + wT4[t] + wSh1[t]) type = 1;
            else if (t === 2 && roll < wSp5[t] + wT4[t] + wSh1[t] + 0.15) type = 3;
            const b = {
                x: 0,
                y: 0,
                r: 13,
                hp: 1,
                wob: g.rng() * 6.283,
                touch: 0,
                type,
                fire: 1.6 + g.rng() * 1.2,
                charge: 0,
                vx: 0,
                vy: 0,
                px: 0,
                py: 0,
                flash: 0,
                blink: 0
            };
            if (type === 1) {
                b.r = 14;
                b.hp = 2;
                b.fire = 1.2 + g.rng() * 1.2;
            } else if (type === 3) {
                b.r = 16;
                b.hp = 2;
            } else if (type === 4) {
                b.r = 20;
                b.hp = [4, 5, 6][t];
                b.fire = 999;
            } else if (type === 5) {
                b.r = 9;
                b.hp = 1;
                b.fire = 999;
            }
            if (side === 0) {
                b.x = -20;
                b.y = g.rng() * 300;
            } else if (side === 1) {
                b.x = 620;
                b.y = g.rng() * 300;
            } else if (side === 2) {
                b.x = g.rng() * 600;
                b.y = -20;
            } else {
                b.x = g.rng() * 600;
                b.y = 320;
            }
            b.px = b.x;
            b.py = b.y;
            g.blobs.push(b);
            g.next = [1.8, 1.5, 1.15][t] * (g.calm ? 2 : 1);
        }
        for (let i = g.blobs.length - 1; i >= 0; i--) {
            const b = g.blobs[i];
            b.touch = Math.max(0, b.touch - h);
            b.flash = Math.max(0, (b.flash || 0) - h);
            b.blink = Math.max(0, (b.blink || 0) - h);
            b.px = b.x;
            b.py = b.y;
            if (b.type === 1) {

                const dp = Math.atan2(p.y - b.y, p.x - b.x), dist = Math.hypot(p.x - b.x, p.y - b.y),
                    want = dist < 140 ? -1 : dist > 185 ? 1 : 0, sp = 34 + 10 * t;
                b.x += Math.cos(dp) * want * sp * h + Math.cos(g.elapsed * 1.7 + b.wob) * 22 * h;
                b.y += Math.sin(dp) * want * sp * h + Math.sin(g.elapsed * 1.7 + b.wob) * 22 * h;
                b.x = clamp(b.x, -16, 616);
                b.y = clamp(b.y, -16, 316);
                if (b.charge > 0) {
                    b.charge -= h;
                    if (b.charge <= 0) {
                        const a = Math.atan2(p.y - b.y, p.x - b.x), S = [105, 130, 155][t] * (g.calm ? 0.7 : 1);
                        for (let k = -1; k <= 1; k++) g.ebullets.push({
                            x: b.x,
                            y: b.y,
                            vx: Math.cos(a + k * 0.24) * S,
                            vy: Math.sin(a + k * 0.24) * S,
                            age: 0
                        });
                        b.fire = [3.0, 2.5, 2.1][t] * (g.calm ? 1.8 : 1);
                    }
                } else {
                    b.fire -= h;
                    if (b.fire <= 0) b.charge = 0.55;
                }
            } else {
                const fac = {0: 1, 2: 1.6, 3: 1, 4: 0.55, 5: 2.2}[b.type] || 1;
                const sp = fac * (40 + 15 * t),
                    a = Math.atan2(150 - b.y, 300 - b.x) + Math.sin(g.elapsed * (b.type === 5 ? 4.2 : 2) + b.wob) * (b.type === 5 ? 1.1 : 0.6);
                b.x += Math.cos(a) * sp * h;
                b.y += Math.sin(a) * sp * h;

                if (b.type === 0 || b.type === 3) {
                    b.fire -= h;
                    if (b.fire <= 0.4) b.blink = 0.4;
                    if (b.fire <= 0) {
                        const aa = Math.atan2(p.y - b.y, p.x - b.x), S = [95, 118, 140][t] * (g.calm ? 0.7 : 1);
                        g.ebullets.push({x: b.x, y: b.y, vx: Math.cos(aa) * S, vy: Math.sin(aa) * S, age: 0});
                        b.fire = [4.5, 3.6, 3.0][t] * (g.calm ? 1.8 : 1);
                    }
                }
            }
            b.vx = (b.x - b.px) / h;
            b.vy = (b.y - b.py) / h;
            if (b.type !== 1 && Math.hypot(b.x - 300, b.y - 150) < b.r + 26) {
                g.blobs.splice(i, 1);
                g.core.hp -= (b.type === 4 ? 20 : 12);
                g.shake = 0.3;
                if (g.core.hp <= 0) {
                    g.core.hp = 0;
                    g.lost = true;
                }
                continue;
            }
            if (!(g.iT > 0) && b.touch <= 0 && Math.hypot(b.x - p.x, b.y - p.y) < b.r + 10) {

                const d = Math.hypot(p.x - b.x, p.y - b.y) || 1;
                p.x = clamp(p.x + (p.x - b.x) / d * 60, 14, 586);
                p.y = clamp(p.y + (p.y - b.y) / d * 60, 14, 286);
                g.hits++;
                g.hp--;
                g.iT = 1.2;
                b.touch = 0.9;
                g.shake = 0.3;
                for (let k = 0; k < 6; k++) g.sparks.push({
                    x: p.x,
                    y: p.y,
                    vx: (g.rng() - .5) * 260,
                    vy: (g.rng() - .5) * 260,
                    age: 0,
                    life: .4,
                    col: '#b0685c'
                });
                if (g.hp <= 0) {
                    g.hp = 0;
                    g.lost = true;
                }
            }
        }
        for (let i = g.ebullets.length - 1; i >= 0; i--) {
            const e = g.ebullets[i];
            e.x += e.vx * h;
            e.y += e.vy * h;
            e.age += h;
            if (e.age > 4 || e.x < -24 || e.x > 624 || e.y < -24 || e.y > 324) {
                g.ebullets.splice(i, 1);
                continue;
            }
            if (!(g.iT > 0) && Math.hypot(e.x - p.x, e.y - p.y) < 15) {
                g.ebullets.splice(i, 1);
                g.hits++;
                g.hp--;
                g.iT = 1.2;
                g.shake = 0.3;
                g.flash = 0.18;
                for (let k = 0; k < 6; k++) g.sparks.push({
                    x: p.x,
                    y: p.y,
                    vx: (g.rng() - .5) * 260,
                    vy: (g.rng() - .5) * 260,
                    age: 0,
                    life: .4,
                    col: '#b0685c'
                });
                if (g.hp <= 0) {
                    g.hp = 0;
                    g.lost = true;
                }
            }
        }
        for (let i = g.shots.length - 1; i >= 0; i--) {
            const s = g.shots[i];
            s.x += s.vx * h;
            s.y += s.vy * h;
            s.age += h;
            let dead = s.age > (s.life || 0.55);
            if (!dead) for (let j = g.blobs.length - 1; j >= 0; j--) {
                const b = g.blobs[j];
                if (Math.hypot(s.x - b.x, s.y - b.y) < b.r + 4) {
                    b.hp--;
                    b.flash = 0.12;
                    g.flash = 0.1;
                    dead = true;
                    for (let k = 0; k < 3; k++) g.sparks.push({
                        x: s.x,
                        y: s.y,
                        vx: (g.rng() - .5) * 200,
                        vy: (g.rng() - .5) * 200,
                        age: 0,
                        life: .3,
                        col: '#e0c48f'
                    });
                    if (b.hp <= 0) {
                        g.blobs.splice(j, 1);
                        g.kills += (b.type === 4 ? 2 : 1);
                        g.shake = Math.max(g.shake, 0.16);
                        for (let k = 0; k < 8; k++) g.sparks.push({
                            x: b.x,
                            y: b.y,
                            vx: (g.rng() - .5) * 340,
                            vy: (g.rng() - .5) * 340,
                            age: 0,
                            life: .5,
                            col: k % 2 ? '#c69777' : '#e0c48f'
                        });
                        if (b.type === 3) for (let k = -1; k <= 1; k += 2) g.blobs.push({
                            x: b.x + k * 12,
                            y: b.y,
                            r: 8,
                            hp: 1,
                            wob: g.rng() * 6.283,
                            touch: 0,
                            type: 2,
                            fire: 999,
                            charge: 0,
                            vx: 0,
                            vy: 0,
                            px: b.x,
                            py: b.y,
                            flash: 0,
                            blink: 0
                        });
                    }
                    break;
                }
            }
            if (dead) g.shots.splice(i, 1);
        }
        for (let i = g.sparks.length - 1; i >= 0; i--) {
            const s = g.sparks[i];
            s.x += s.vx * h;
            s.y += s.vy * h;
            s.vx *= 0.98;
            s.vy *= 0.98;
            s.age += h;
            if (s.age >= s.life) g.sparks.splice(i, 1);
        }
        if (g.sparks.length > 90) g.sparks.splice(0, g.sparks.length - 90);
        if (!g.lost && g.kills >= [12, 15, 18][t]) g.won = true;
    }

    function scanStep(g, h) {
        const k = Math.min(1, 8 * h), s = g.scan;

        let dx = (g.keys.ArrowRight ? 1 : 0) - (g.keys.ArrowLeft ? 1 : 0),
            dy = (g.keys.ArrowDown ? 1 : 0) - (g.keys.ArrowUp ? 1 : 0);
        if (dx && dy) {
            dx *= Math.SQRT1_2;
            dy *= Math.SQRT1_2;
        }
        if (dx || dy) {
            g.pointer.x = clamp(g.pointer.x + dx * 180 * h, 0, 600);
            g.pointer.y = clamp(g.pointer.y + dy * 180 * h, 0, 300);
        }
        const ox = s.x, oy = s.y;
        s.x += (g.pointer.x - s.x) * k;
        s.y += (g.pointer.y - s.y) * k;
        g.scanV = Math.hypot(s.x - ox, s.y - oy) / h;
        for (const z of g.zones) {
            if (z.found) continue;
            if (Math.hypot(s.x - z.x, s.y - z.y) < z.r && g.scanV < 230) {
                z.progress += 45 * h;
                if (z.progress >= 100) {
                    z.progress = 100;
                    z.found = true;
                    g.found++;
                    g.flash = 0.15;
                }
            }
        }
        if (g.found >= g.zones.length) g.won = true;
    }

    function sortRoute(g, slot) {
        let best = null, bd = 1e9;
        for (const c of g.cards) if (!c.routed && c.x >= 260 && c.x <= 340) {
            const d = Math.abs(c.x - 300);
            if (d < bd) {
                bd = d;
                best = c;
            }
        }
        if (best) {
            if (g.routes[best.type] === slot) {
                best.routed = true;
                g.routed++;
                g.flash = 0.15;
                if (g.routed >= [8, 10, 12][g.tier]) g.won = true;
            } else g.mistakes++;
        } else g.mistakes++;
        if (g.mistakes >= 3) g.lost = true;
    }

    function noiseFilter(g, lane) {
        let best = null, bd = 1e9;
        for (const p of g.packets) if (p.lane === lane && p.x >= 430 && p.x <= 500) {
            const d = Math.abs(p.x - 465);
            if (d < bd) {
                bd = d;
                best = p;
            }
        }
        if (best) {
            const i = g.packets.indexOf(best);
            if (best.type === 'noise') {
                g.packets.splice(i, 1);
                g.cleaned++;
                g.flash = 0.12;
                if (g.cleaned >= [10, 13, 16][g.tier]) g.won = true;
            } else {
                g.packets.splice(i, 1);
                g.static += 18;
                g.shake = 0.25;
            }
        } else g.static += 4;
        if (g.static >= 100) g.lost = true;
    }

    function packetStep(g, h) {
        const t = g.tier, p = g.player;
        let ax = (g.keys.ArrowRight ? 1 : 0) - (g.keys.ArrowLeft ? 1 : 0),
            ay = (g.keys.ArrowDown ? 1 : 0) - (g.keys.ArrowUp ? 1 : 0);
        if (ax && ay) {
            ax *= Math.SQRT1_2;
            ay *= Math.SQRT1_2;
        }
        g.vx = (g.vx + ax * 1600 * h) * 0.94;
        g.vy = (g.vy + ay * 1600 * h) * 0.94;
        p.x = clamp(p.x + g.vx * h, 14, 586);
        p.y = clamp(p.y + g.vy * h, 14, 286);
        g.iT = Math.max(0, g.iT - h);

        const cur = g.shards[g.order];
        if (cur && !cur.locked) {
            cur.x += cur.vx * h;
            cur.y += cur.vy * h;
            if (cur.x < 32 || cur.x > 500) {
                cur.vx *= -1;
                cur.x = clamp(cur.x, 32, 500);
            }
            if (cur.y < 30 || cur.y > 270) {
                cur.vy *= -1;
                cur.y = clamp(cur.y, 30, 270);
            }
            if (Math.hypot(cur.x - p.x, cur.y - p.y) < 24) {
                cur.locked = true;
                g.order++;
                g.locked++;
                g.flash = 0.2;

                const base = g.rng() * 6.283, RS = [70, 88, 106][t] * (g.calm ? 0.7 : 1);
                for (let k = 0; k < 6; k++) {
                    const bx = cur.x + Math.cos(base + k * 1.0472) * 20, by = cur.y + Math.sin(base + k * 1.0472) * 20;
                    if (Math.hypot(bx - p.x, by - p.y) < 58) continue;
                    g.noises.push({
                        x: bx,
                        y: by,
                        vx: Math.cos(base + k * 1.0472) * RS,
                        vy: Math.sin(base + k * 1.0472) * RS,
                        r: 10,
                        age: 0
                    });
                }
                const nx = g.shards[g.order];
                if (nx) {
                    let tries = 0;
                    do {
                        nx.x = 60 + g.rng() * 420;
                        nx.y = 50 + g.rng() * 210;
                        tries++;
                    }
                    while (Math.hypot(nx.x - p.x, nx.y - p.y) < 200 && tries < 60);
                    nx.vx = (g.rng() - .5) * 36;
                    nx.vy = (g.rng() - .5) * 36;
                }
                if (g.locked >= 4) g.portOpen = true;
            }
        }

        g.next -= h;
        if (g.next <= 0) {
            const roll = g.rng(), side = Math.floor(g.rng() * 4), S = [85, 105, 128][t] * (g.calm ? 0.7 : 1);
            const wallOK = g.elapsed > 6, ringOK = g.elapsed > 13;
            if (roll < 0.3 || !wallOK) {
                const b = {
                    x: side === 0 ? -20 : side === 1 ? 620 : g.rng() * 600,
                    y: side === 2 ? -20 : side === 3 ? 320 : g.rng() * 300,
                    vx: 0,
                    vy: 0,
                    r: 11,
                    age: 0
                };
                const a = Math.atan2(p.y - b.y, p.x - b.x);
                b.vx = Math.cos(a) * S;
                b.vy = Math.sin(a) * S;
                g.noises.push(b);
            } else if (roll < 0.6 || !ringOK) {
                const horizontal = g.rng() < 0.5, gapPos = 50 + g.rng() * 200,
                    WS = [64, 82, 100][t] * (g.calm ? 0.7 : 1);
                const skip1 = Math.floor(g.rng() * 4), skip2 = (skip1 + 2) % 4;
                for (let k = 0; k < 4; k++) {
                    const along = 36 + k * 64;
                    if (k === skip1 || k === skip2) continue;
                    g.noises.push(horizontal ? {x: -20, y: along, vx: WS, vy: 0, r: 11, age: 0} : {
                        x: along,
                        y: -20,
                        vx: 0,
                        vy: WS,
                        r: 11,
                        age: 0
                    });
                }
            } else if (t === 2 || roll < 0.85) {
                const base = g.rng() * 6.283, RS = [74, 92, 112][t] * (g.calm ? 0.7 : 1),
                    skip = Math.floor(g.rng() * 6), skip2 = (skip + 3) % 6;
                for (let k = 0; k < 6; k++) {
                    if (k === skip || k === skip2) continue;
                    const a = base + k * 1.047;
                    g.noises.push({
                        x: clamp(p.x + Math.cos(a) * 52, 8, 592),
                        y: clamp(p.y + Math.sin(a) * 52, 8, 292),
                        vx: Math.cos(a) * RS,
                        vy: Math.sin(a) * RS,
                        r: 10,
                        age: 0
                    });
                }
            } else {
                g.noises.push({
                    x: side === 0 ? -24 : side === 1 ? 624 : g.rng() * 600,
                    y: side === 2 ? -24 : side === 3 ? 324 : g.rng() * 300,
                    vx: (side === 1 ? -1 : side === 0 ? 1 : 0) * (45 + 10 * t),
                    vy: (side === 1 || side === 0 ? (g.rng() - .5) * 40 : (side === 3 ? -1 : 1) * (45 + 10 * t)),
                    r: 15,
                    age: 0
                });
            }

            const warm = g.elapsed < 6 ? 1.6 : g.elapsed < 13 ? 1.2 : 1;
            g.next = [2.1, 1.7, 1.35][t] * (g.calm ? 1.7 : 1) * warm * (1 - g.locked * 0.1);
        }
        for (let i = g.noises.length - 1; i >= 0; i--) {
            const b = g.noises[i];
            b.x += b.vx * h;
            b.y += b.vy * h;
            b.age += h;
            if (b.x < -40 || b.x > 640 || b.y < -40 || b.y > 340 || b.age > 7) {
                g.noises.splice(i, 1);
                continue;
            }
            if (b.age > 0.35 && !(g.iT > 0) && Math.hypot(b.x - p.x, b.y - p.y) < b.r + 10) {
                g.noises.splice(i, 1);
                g.integrity -= 25;
                g.iT = 1.2;
                g.shake = 0.32;
                g.flash = 0.2;
                g.hits++;
                for (let k = 0; k < 6; k++) g.sparks.push({
                    x: p.x,
                    y: p.y,
                    vx: (g.rng() - .5) * 260,
                    vy: (g.rng() - .5) * 260,
                    age: 0,
                    life: .4,
                    col: '#b0685c'
                });

                if (g.locked > 0 && t >= 1 && g.order > 0) {
                    g.order--;
                    g.locked--;
                    const s = g.shards[g.order];
                    s.locked = false;
                    g.portOpen = g.locked >= 4;
                    s.x = clamp(p.x + (g.rng() - .5) * 140, 40, 500);
                    s.y = clamp(p.y + (g.rng() - .5) * 110, 40, 260);
                    s.vx = (g.rng() - .5) * 36;
                    s.vy = (g.rng() - .5) * 36;
                }
                if (g.integrity <= 0) {
                    g.integrity = 0;
                    g.lost = true;
                }
            }
        }
        for (let i = g.sparks.length - 1; i >= 0; i--) {
            const s = g.sparks[i];
            s.x += s.vx * h;
            s.y += s.vy * h;
            s.vx *= 0.98;
            s.vy *= 0.98;
            s.age += h;
            if (s.age >= s.life) g.sparks.splice(i, 1);
        }
        if (!g.lost && g.portOpen && Math.hypot(p.x - g.port.x, p.y - g.port.y) < 30) g.won = true;
    }


    function pkHurt(g, kx, ky) {
        const p = g.player;
        g.integrity--;
        g.hits++;
        g.iT = 1.4;
        g.shake = 0.3;
        g.flash = 0.2;
        p.vx = kx;
        p.vy = ky;
        g.onGround = false;
        g.groundM = null;
        for (let k = 0; k < 7; k++) g.sparks.push({
            x: p.x,
            y: p.y - 13,
            vx: (g.rng() - .5) * 260,
            vy: (g.rng() - .5) * 260,
            age: 0,
            life: .4,
            col: '#b0685c'
        });
        if (g.integrity <= 0) {
            g.integrity = 0;
            g.lost = true;
        }
    }

    function parkourStep(g, h) {
        const t = g.tier, p = g.player, W = 3620, H = 640, duck = g.onGround && g.keys.ArrowDown;
        g.spin = Math.max(0, g.spin - h);
        g.squash = Math.max(0, g.squash - h);
        g.coyote = Math.max(0, g.coyote - h);
        g.jumpBuf = Math.max(0, g.jumpBuf - h);
        g.dropT = Math.max(0, g.dropT - h);
        g.iT = Math.max(0, g.iT - h);
        g.msgT = Math.max(0, g.msgT - h);

        for (const m of g.movers) {
            m.px = m.x;
            m.py = m.y;
            m.ph += h * m.speed / m.range;
            if (m.axis === 'x') m.x = m.cx + Math.sin(m.ph) * m.range; else m.y = m.cy + Math.sin(m.ph) * m.range;
            if (g.groundM === m) {
                p.x += m.x - m.px;
                p.y += m.y - m.py;
            }
        }

        const want = (g.keys.ArrowRight ? 1 : 0) - (g.keys.ArrowLeft ? 1 : 0), top = duck ? 140 : 250;
        if (want) {
            const acc = (g.onGround ? 2000 : 1150) * h;
            p.vx += clamp(want * top - p.vx, -acc, acc);
            p.face = want;
        } else {
            const f = (g.onGround ? 1500 : 120) * h;
            if (Math.abs(p.vx) <= f) p.vx = 0; else p.vx -= Math.sign(p.vx) * f;
        }

        let G = 1500;
        if (p.vy < 0 && !(g.keys.ArrowUp || g.keys.Space)) G += 2500;
        if (p.vy > 0 && g.keys.ArrowDown) G += 1100;
        p.vy = Math.min(640, p.vy + G * h);

        if (!g.onGround && g.coyote <= 0 && g.jumps === 0) g.jumps = 1;
        if (g.jumpBuf > 0) {
            if (g.onGround || g.coyote > 0) {
                p.vy = -540;
                g.jumps = 1;
                g.onGround = false;
                g.coyote = 0;
                g.groundM = null;
                g.jumpBuf = 0;
                for (let k = 0; k < 4; k++) g.sparks.push({
                    x: p.x,
                    y: p.y,
                    vx: (g.rng() - .5) * 120,
                    vy: 40 + g.rng() * 60,
                    age: 0,
                    life: .3,
                    col: '#8a9384'
                });
            } else if (g.jumps < 2) {
                p.vy = -545;
                g.jumps = 2;
                g.jumpBuf = 0;
                g.spin = 0.35;
                for (let k = 0; k < 5; k++) g.sparks.push({
                    x: p.x,
                    y: p.y - 6,
                    vx: (g.rng() - .5) * 130,
                    vy: 60 + g.rng() * 70,
                    age: 0,
                    life: .35,
                    col: '#8db2a6'
                });
            }
        }
        const box = () => ({l: p.x - 9, r: p.x + 9, t: p.y - (g.onGround && g.keys.ArrowDown ? 18 : 26), b: p.y});

        p.x = clamp(p.x + p.vx * h, 12, W - 12);
        let b = box();
        for (const s of g.plats) {
            if (s.one) continue;
            if (b.r > s.x && b.l < s.x + s.w && b.b > s.y && b.t < s.y + s.h) {
                const dl = b.r - s.x, dr = s.x + s.w - b.l;
                if (dl < dr) p.x -= dl; else p.x += dr;
                p.vx = 0;
                b = box();
            }
        }

        const pf = p.y, vyIn = p.vy, wasGround = g.onGround;
        g.onGround = false;
        p.y += p.vy * h;
        b = box();
        const land = (sy, m) => {
            if (vyIn > 260) g.squash = 0.16;
            p.y = sy;
            p.vy = 0;
            g.onGround = true;
            g.jumps = 0;
            g.coyote = 0;
            g.groundM = m || null;
        };
        for (const s of g.plats) {
            if (b.r <= s.x || b.l >= s.x + s.w) continue;
            if (!s.one) {
                if (b.b > s.y && b.t < s.y + s.h) {
                    if (p.vy >= 0 && pf <= s.y + 6) land(s.y);
                    else if (p.vy < 0 && pf >= s.y + s.h - 6) {
                        p.y = s.y + s.h + 26;
                        p.vy = 0;
                    }
                }
            } else if (p.vy >= 0 && g.dropT <= 0 && pf <= s.y + 4 && b.b >= s.y && b.b <= s.y + 22) {
                land(s.y);
            }
            b = box();
        }
        for (const m of g.movers) {
            if (b.r <= m.x || b.l >= m.x + m.w) continue;
            if (p.vy >= 0 && pf <= m.y + 4 && b.b >= m.y && b.b <= m.y + 22) land(m.y, m);
            b = box();
        }
        if (wasGround && !g.onGround && p.vy >= 0) g.coyote = 0.1;

        for (const pd of g.pads) {
            pd.t = Math.max(0, pd.t - h);
            if (p.vy >= -20 && Math.abs(p.x - pd.x) < 24 && p.y >= pd.y - 8 && p.y <= pd.y + 10) {
                p.vy = -860;
                pd.t = 0.3;
                g.jumps = 1;
                g.onGround = false;
                g.groundM = null;
                g.flash = 0.12;
                g.shake = Math.max(g.shake, 0.1);
                for (let k = 0; k < 8; k++) g.sparks.push({
                    x: pd.x,
                    y: pd.y,
                    vx: (g.rng() - .5) * 220,
                    vy: -g.rng() * 260,
                    age: 0,
                    life: .4,
                    col: '#e0c48f'
                });
            }
        }

        const ds = [0.8, 1, 1.15][t] * (g.calm ? 0.55 : 1);
        for (const d of g.drones) {
            if (d.axis === 'y') {
                d.y += d.dir * d.sp * ds * h;
                if (d.y < d.y0 || d.y > d.y1) {
                    d.y = clamp(d.y, d.y0, d.y1);
                    d.dir *= -1;
                }
            } else {
                d.x += d.dir * d.sp * ds * h;
                if (d.x < d.x0 || d.x > d.x1) {
                    d.x = clamp(d.x, d.x0, d.x1);
                    d.dir *= -1;
                }
            }
            if (g.iT <= 0 && Math.abs(d.x - p.x) < 19 && Math.abs(d.y - (p.y - (duck ? 9 : 13))) < 23) pkHurt(g, p.x >= d.x ? 240 : -240, -300);
        }

        for (const v of g.vents) {
            const u = (g.elapsed + v.ph) % v.cycle;
            v.fire = u >= v.cycle - 0.9;
            v.warn = !v.fire && u >= v.cycle - 1.6;
            if (v.fire && g.iT <= 0 && Math.abs(p.x - v.x) < 19 && p.y > v.y - 95 && p.y - 26 < v.y) pkHurt(g, p.x >= v.x ? 220 : -220, -340);
        }

        for (const o of g.orbs) {
            if (o.taken) continue;
            if (Math.hypot(o.x - p.x, o.y - (p.y - 13)) < 24) {
                o.taken = true;
                g.cells++;
                g.flash = 0.1;
                for (let k = 0; k < 5; k++) g.sparks.push({
                    x: o.x,
                    y: o.y,
                    vx: (g.rng() - .5) * 150,
                    vy: (g.rng() - .5) * 150,
                    age: 0,
                    life: .35,
                    col: '#e0c48f'
                });
            }
        }
        for (const q of g.posts) {
            if (!q.active && Math.hypot(q.x - p.x, q.y - p.y) < 30) {
                q.active = true;
                g.checkpoint = {x: q.x, y: q.y};
                g.msg = '信标同步 · 检查点已更新';
                g.msgT = 2.4;
                g.flash = 0.1;
            }
        }

        if (!g.hinted && g.elapsed > 0.5) {
            g.hinted = true;
            g.msg = 'A/D 移动 · W 跳跃 · 空中再按一次 = 二段跳';
            g.msgT = 3.5;
        }
        if (g.hinted !== 2 && p.x > 2870) {
            g.hinted = 2;
            g.msg = '外部走廊 · 按住 S 低头躲过无人机扫掠';
            g.msgT = 3;
        }
        if (p.y > H + 60) {
            g.falls++;
            g.integrity--;
            g.iT = 1.2;
            g.flash = 0.18;
            if (g.integrity <= 0) {
                g.integrity = 0;
                g.lost = true;
            } else {
                p.x = g.checkpoint.x;
                p.y = g.checkpoint.y;
                p.vx = 0;
                p.vy = 0;
                g.groundM = null;
                g.msg = '回到最近的信标';
                g.msgT = 2;
            }
        }
        if (!g.lost && Math.hypot(g.goal.x - p.x, g.goal.y - 30 - p.y + 30) < 36 && Math.abs(p.y - g.goal.y) < 40) g.won = true;

        for (let i = g.sparks.length - 1; i >= 0; i--) {
            const s = g.sparks[i];
            s.x += s.vx * h;
            s.y += s.vy * h;
            s.vx *= 0.98;
            s.vy += 500 * h;
            s.age += h;
            if (s.age >= s.life) g.sparks.splice(i, 1);
        }

        const cx = clamp(p.x - 300 + p.vx * 0.12, 0, W - 600), cy = clamp(p.y - 200, 0, H - 300),
            kk = Math.min(1, 10 * h);
        g.cam.x += (cx - g.cam.x) * kk;
        g.cam.y += (cy - g.cam.y) * kk;
    }

    const STEP = {
        'leak-hunt': leakStep,
        'surge-bank': surgeStep,
        'credential-sort': sortStep,
        'stream-merge': mergeStep,
        'probe-steady': probeStep,
        'energy-catch': catchStep,
        'noise-filter': noiseStep,
        'wave-align': waveStep,
        'purge': purgeStep,
        'scan-sweep': scanStep,
        'packet-run': packetStep,
        'parkour-run': parkourStep
    };

    function tick(g, dt) {
        if (g.won || g.lost) return false;
        g.elapsed += dt;
        if (g.flash > 0) g.flash = Math.max(0, g.flash - dt);
        if (g.shake > 0) g.shake = Math.max(0, g.shake - dt);
        for (let rest = dt; rest > 0;) {
            const h = Math.min(rest, 1 / 120);
            rest -= h;
            STEP[g.kind](g, h);
            if (g.won || g.lost) break;
        }
        return true;
    }

    function press(g, key) {
        key = NORM[key] || key;
        g.keys[key] = true;
        const K = g.kind;
        if (K === 'leak-hunt') {
            if (key === 'Space') {
                if (g.cd <= 0) {
                    g.pulses.push({x: g.player.x, y: g.player.y, r: 0, age: 0});
                    g.cd = [1.1, 0.9, 0.7][g.tier];
                }
                return true;
            }
            return ARROWS.includes(key);
        }
        if (K === 'surge-bank') {
            if (key === 'ArrowLeft') {
                if (g.cart > 0) g.cart--;
                return true;
            }
            if (key === 'ArrowRight') {
                if (g.cart < 3) g.cart++;
                return true;
            }
            if (key === 'Space') {
                if (g.meter >= 34) {
                    g.banked += Math.floor(g.meter / 34);
                    g.meter %= 34;
                    if (g.banked >= [6, 8, 10][g.tier]) g.won = true;
                }
                return true;
            }
            return false;
        }
        if (K === 'credential-sort' || K === 'noise-filter') {
            const v = {Digit1: 0, Digit2: 1, Digit3: 2, KeyJ: 0, KeyK: 1, KeyL: 2}[key];
            if (v === undefined) return false;
            if (K === 'credential-sort') sortRoute(g, v + 1); else noiseFilter(g, v);
            return true;
        }
        if (K === 'stream-merge') {
            if (key !== 'Space') return false;
            let best = null, bd = 1e9;
            for (const p of g.pairs) if (!p.merged && Math.abs(p.x - 300) <= 28) {
                const d = Math.abs(p.x - 300);
                if (d < bd) {
                    bd = d;
                    best = p;
                }
            }
            if (best) {
                best.merged = true;
                g.merges++;
                g.flash = 0.15;
                if (g.merges >= [7, 9, 11][g.tier]) g.won = true;
            } else g.mistakes++;
            return true;
        }
        if (K === 'probe-steady') {
            if (key !== 'Space') return false;
            if (g.heat > 0.3) {
                g.heat = 0;
                g.flash = 0.15;
            }
            return true;
        }
        if (K === 'energy-catch') {
            if (key === 'ArrowLeft') {
                if (g.sled.lane > 0) g.sled.lane--;
                return true;
            }
            if (key === 'ArrowRight') {
                if (g.sled.lane < 2) g.sled.lane++;
                return true;
            }
            return false;
        }
        if (K === 'wave-align' || K === 'scan-sweep') return ARROWS.includes(key);
        if (K === 'purge') return key === 'Space' || ARROWS.includes(key);
        if (K === 'packet-run') return ARROWS.includes(key);
        if (K === 'parkour-run') {
            if (key === 'ArrowUp' || key === 'Space') {
                g.jumpBuf = 0.12;
                return true;
            }
            if (key === 'ArrowDown') {
                g.dropT = 0.16;
                return true;
            }
            return ARROWS.includes(key);
        }
        return false;
    }

    function release(g, key) {
        key = NORM[key] || key;
        g.keys[key] = false;
        return USED[g.kind].includes(key);
    }

    function point(g, x, y) {
        g.pointer = {x: clamp(x, 0, 600), y: clamp(y, 0, 300)};
        return true;
    }

    function assist(g) {
        const K = g.kind;
        if (K === 'leak-hunt') {
            for (const le of g.leaks) le.found = true;
            g.pressure = Math.min(g.pressure, 30);
            g.assistText = '辅助扫描已标注全部泄漏点。靠近金色的泄漏点，长按空格完成密封。';
        } else if (K === 'surge-bank') {
            g.calm = true;
            g.banked = Math.max(g.banked, [6, 8, 10][g.tier] - 1);
            g.assistText = '辅助稳压器已接入：电涌放缓。再存入一组电涌，最高日志供电即恢复。';
        } else if (K === 'credential-sort') {
            g.calm = true;
            g.routed = [8, 10, 12][g.tier] - 1;
            g.assistText = '广寒子放慢了凭证流。按当前生效规则把剩余凭证送入对应槽位：17号→最高日志，旧签名→销毁口，公共与见证记录→公开档案。';
        } else if (K === 'stream-merge') {
            g.calm = true;
            g.merges = [7, 9, 11][g.tier] - 1;
            g.assistText = '辅助层已对齐两份记录的走带速度。金色闸门亮起时按空格，让新旧记录合流。';
        } else if (K === 'probe-steady') {
            g.calm = true;
            g.hits = 0;
            g.assistText = '辅助机械臂接管外壳补偿。用鼠标稳住探针，保持在通道内完成剩余采样。';
        } else if (K === 'energy-catch') {
            g.autoColor = true;
            g.leaks = 0;
            g.assistText = '合流闸门已自动匹配相位。移动滑板接住与它同色的能量珠，凑满目标电压。';
        } else if (K === 'noise-filter') {
            g.static = Math.min(g.static, 20);
            g.calm = true;
            g.assistText = '广寒子接管了低频噪声。剩余噪声段进入滤波窗口时按对应轨道键，不要碰到原始语音段。';
        } else if (K === 'wave-align') {
            g.freq = g.targetF;
            g.amp = g.targetA;
            g.assistText = '辅助回路已锁定基准频率。保持双波形重合，完成最后一段记录的读取。';
        } else if (K === 'purge') {
            g.core.hp = 100;
            g.calm = true;
            g.kills = Math.max(g.kills, [12, 15, 18][g.tier] - 1);
            g.assistText = '非必要进程已冻结，核心恢复稳定。清除最后几团异常数据体即可。';
        } else if (K === 'packet-run') {
            g.integrity = 100;
            g.locked = 4;
            for (const s of g.shards) s.locked = true;
            g.portOpen = true;
            g.calm = true;
            g.assistText = '辅助信道已校准，坐标、人数、时间与校验四项字段全部锁定。把数据包送入右侧的上行端口即可完成发送。';
        } else if (K === 'scan-sweep') {
            for (const z of g.zones) z.hint = true;
            g.assistText = '辅助层已标出大致采样区。放慢速度逐个划过即可确认。';
        } else if (K === 'parkour-run') {
            g.integrity = g.hpMax;
            g.calm = true;
            g.iT = 2;
            g.player.x = g.checkpoint.x;
            g.player.y = g.checkpoint.y;
            g.player.vx = 0;
            g.player.vy = 0;
            g.groundM = null;
            g.assistText = '广寒子已同步最近的信标并放慢巡逻。从信标出发：二段跳跨过高空移动平台，外部走廊低头躲过无人机，最后借弹跳板登上返回舱。';
        }
        return g.assistText;
    }

    globalThis.MoonAction = Object.freeze({create, tick, press, release, point, assist});
})();
