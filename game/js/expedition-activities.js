"use strict";
(function () {
    const a = MoonActivities,
        base = {reset: a.reset, render: a.render, key: a.expandedKey, tick: a.tick, reveal: a.reveal}, names = {
            'mouse-maze': '精密探针 · 鼠标迷宫',
            maze: '检修路线 · 普通迷宫',
            'lights-out': '断电矩阵 · 熄灯问题',
            nonogram: '传感器图像 · 数织',
            'logic-grid': '交叉核验 · 逻辑网格',
            'side-runner': '月面检修 · 横版跑酷'
        }, rules = {
            'mouse-maze': ['点击绿色入口抓住探针，再连续移动鼠标沿亮色通道前进。', '探针不能穿墙或跨格；撞墙消耗一次保护并回到入口。', '抵达金色出口完成。离开棋盘会松开探针，可从当前位置重新抓取。'],
            maze: ['用方向键或屏幕箭头移动，一次走一格。', '深色墙体不可穿越；浅色路线留下足迹，允许原路返回。', '从绿色入口抵达金色出口，不需要经过每条岔路。'],
            'lights-out': ['点击一个灯，会翻转它本身和上下左右四邻的亮灭状态。', '边角只影响棋盘内的灯；斜对角不会受到影响。', '把全部灯熄灭完成。每题由全灭状态反向打乱，保证存在解。'],
            nonogram: ['行、列数字表示按顺序连续填黑的格数。例如2 1表示两格、至少一格空白、再一格。', '点击填黑；切换“标空”或右键标记×。数字之间至少空一格，0表示整行空白。', '同时满足所有行列线索完成。每一题都通过唯一解检查。'],
            'logic-grid': ['每人只对应一件设备和一个房间，每个设备、房间也只属于一人。', '点击格子循环：空白→×排除→✓确认→空白。分别填写人—设备和人—房间两个表。', '房间按1—5号从左到右排列。把设备、房间和邻接线索交叉使用，所有人对应正确后完成；×是笔记，不会替你填答案。'],
            'side-runner': ['角色自动向右跑。空格或↑跳跃，↓滑行；也可使用下方按钮。', '跳过低栏与裂隙，在悬梁下滑行。障碍之间留有落地恢复时间。', '通过目标数量完成；保护用尽失败。观察前方图形，护栏、梁架、裂隙有不同轮廓。']
        };
    const own = g => g && names[g.kind], done = p => {
        if (p.classic.won) a.complete(p); else if (p.classic.lost) p.finish(false);
    };
    Object.entries(names).forEach(([k, v]) => a.descriptions[k] = v + '：' + rules[k].join(''));
    a.reset = function (p) {
        const g = MoonExpedition.create(p.info.game, {seed: p.seed, difficulty: p.difficulty});
        if (!g) return base.reset.call(this, p);
        p.classic = g;
        p.history = [];
    };

    function board(p, root, interactive = true) {
        const g = p.classic, b = (label, fn, parent = root) => {
            const el = p.button(label, interactive ? fn : () => {
            }, parent);
            if (!interactive) el.tabIndex = -1;
            return el;
        }, refresh = () => {
            p.render();
            done(p);
        };
        if (g.kind.includes('maze') || g.kind === 'side-runner') {
            const canvas = document.createElement('canvas');
            canvas.width = 680;
            canvas.height = g.kind === 'side-runner' ? 320 : 420;
            canvas.className = 'expedition-canvas';
            root.append(canvas);
            p.expeditionCanvas = canvas;
            draw(p);
            if (g.kind === 'mouse-maze' && interactive) {
                const cell = e => {
                    const r = canvas.getBoundingClientRect(), x = (e.clientX - r.left) * 680 / r.width,
                        y = (e.clientY - r.top) * 420 / r.height, sz = Math.min(620 / g.w, 390 / g.h),
                        ox = (680 - sz * g.w) / 2, oy = 15;
                    return {x: Math.floor((x - ox) / sz), y: Math.floor((y - oy) / sz), sz, px: x, py: y, ox, oy};
                };
                canvas.addEventListener('pointerdown', e => {
                    const c = cell(e);
                    if (c.y * g.w + c.x === g.pos) {
                        g.dragging = true;
                        g.pointer = {x: c.px, y: c.py};
                        draw(p);
                    }
                });
                canvas.addEventListener('pointermove', e => {
                    if (!g.dragging) return;
                    const v = cell(e), old = g.pointer;
                    const steps = Math.ceil(Math.hypot(v.px - old.x, v.py - old.y) / (v.sz / 4));
                    for (let k = 1; k <= steps; k++) {
                        const x = Math.floor((old.x + (v.px - old.x) * k / steps - v.ox) / v.sz),
                            y = Math.floor((old.y + (v.py - old.y) * k / steps - v.oy) / v.sz), i = y * g.w + x;
                        if (x < 0 || x >= g.w || y < 0 || y >= g.h || g.cells[i]) {
                            g.dragging = false;
                            g.lives--;
                            g.pos = g.start;
                            g.trail = [g.pos];
                            p.wrong('探针碰到墙壁，已返回入口。');
                            g.lost = g.lives <= 0;
                            draw(p);
                            done(p);
                            return;
                        }
                        if (i !== g.pos && !MoonExpedition.mazeMove(g, i)) {
                            g.dragging = false;
                            return;
                        }
                    }
                    g.pointer = {x: v.px, y: v.py};
                    draw(p);
                    done(p);
                });
                canvas.addEventListener('pointerleave', () => {
                    g.dragging = false;
                });
            }
            if (g.kind === 'maze') {
                const pad = document.createElement('div');
                pad.className = 'arcade-pad';
                root.append(pad);
                ['↑', '→', '↓', '←'].forEach((v, i) => b(v, () => a.expandedKey(p, ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'][i]), pad));
            }
            if (g.kind === 'side-runner') {
                b('↑ 跳跃', () => a.expandedKey(p, 'Space'));
                b('↓ 滑行', () => a.expandedKey(p, 'ArrowDown'));
            }
        }
        if (g.kind === 'lights-out') {
            root.classList.add('expedition-grid');
            root.style.setProperty('--cols', g.w);
            g.cells.forEach((v, i) => {
                const el = b(v ? '◉' : '○', () => {
                    MoonExpedition.toggle(g, i);
                    refresh();
                });
                el.className = 'light-tile ' + (v ? 'lit' : 'dark');
                el.dataset.index = i;
                el.setAttribute('aria-label', '灯 ' + (i + 1) + (v ? ' 亮' : ' 灭'));
            });
        }
        if (g.kind === 'nonogram') {
            const grid = document.createElement('div');
            grid.className = 'nonogram-grid';
            grid.style.setProperty('--cols', g.w);
            root.append(grid);
            grid.append(document.createElement('span'));
            g.cols.forEach(c => {
                const el = document.createElement('b');
                el.textContent = c.join('\n');
                grid.append(el);
            });
            for (let y = 0; y < g.h; y++) {
                const clue = document.createElement('b');
                clue.textContent = g.rows[y].join(' ');
                grid.append(clue);
                for (let x = 0; x < g.w; x++) {
                    const i = y * g.w + x, el = b(g.cells[i] === -1 ? '×' : '', () => {
                        MoonExpedition.mark(g, i);
                        refresh();
                    }, grid);
                    el.className = g.cells[i] === 1 ? 'filled' : '';
                    el.setAttribute('aria-label', '第' + (y + 1) + '行第' + (x + 1) + '列');
                    if (interactive) el.addEventListener('contextmenu', e => {
                        e.preventDefault();
                        const mode = g.mark;
                        g.mark = true;
                        MoonExpedition.mark(g, i);
                        g.mark = mode;
                        refresh();
                    });
                }
            }
            b(g.mark ? '标空 × · 切换填黑' : '填黑 ■ · 切换标空', () => {
                g.mark = !g.mark;
                p.render();
            });
        }
        if (g.kind === 'logic-grid') {
            const clues = document.createElement('ol');
            clues.className = 'logic-clues';
            g.clues.forEach(c => {
                const el = document.createElement('li');
                el.textContent = c.text;
                clues.append(el);
            });
            root.append(clues);
            const tables = document.createElement('div');
            tables.className = 'logic-tables';
            root.append(tables);
            [g.items, g.rooms].forEach((labels, cat) => {
                const table = document.createElement('table');
                table.innerHTML = '<caption>' + ['人 — 设备', '人 — 房间'][cat] + '</caption>';
                tables.append(table);
                const head = document.createElement('tr');
                head.innerHTML = '<th>人员</th>' + labels.map(v => '<th>' + v + '</th>').join('');
                table.append(head);
                g.people.forEach((name, y) => {
                    const tr = document.createElement('tr'), th = document.createElement('th');
                    th.textContent = name;
                    tr.append(th);
                    labels.forEach((label, x) => {
                        const i = y * g.n + x, td = document.createElement('td'),
                            el = b(['×', '', '✓'][g.cells[cat][i] + 1], () => {
                                MoonExpedition.logicMark(g, cat, i);
                                refresh();
                            }, td);
                        el.dataset.cat = cat;
                        el.dataset.index = i;
                        el.setAttribute('aria-label', name + ' ' + label);
                        el.className = g.cells[cat][i] === 1 ? 'confirmed' : '';
                        tr.append(td);
                    });
                    table.append(tr);
                });
            });
        }
    }

    a.render = function (p) {
        if (!own(p.classic)) return base.render.call(this, p);
        p.description.textContent = a.descriptions[p.classic.kind];
        const root = document.createElement('div');
        root.className = 'expedition-board expedition-' + p.classic.kind;
        p.controls.append(root);
        board(p, root);
    };

    function draw(p) {
        const g = p.classic, c = p.expeditionCanvas?.getContext('2d');
        if (!c) return;
        c.fillStyle = '#111e25';
        c.fillRect(0, 0, 680, c.canvas.height);
        if (g.kind.includes('maze')) {
            const sz = Math.min(620 / g.w, 390 / g.h), ox = (680 - sz * g.w) / 2;
            c.fillStyle = '#8a9384';
            for (let i = 0; i < g.cells.length; i++) {
                c.fillStyle = g.cells[i] ? '#1b303a' : '#a4ad97';
                c.fillRect(ox + i % g.w * sz, 15 + Math.floor(i / g.w) * sz, sz - 1, sz - 1);
            }
            g.trail.forEach(i => {
                c.fillStyle = '#728c88';
                c.fillRect(ox + i % g.w * sz + sz * .35, 15 + Math.floor(i / g.w) * sz + sz * .35, sz * .3, sz * .3);
            });
            for (const [i, color] of [[g.start, '#74c0a1'], [g.exit, '#efcb84'], [g.pos, '#fff5cf']]) {
                c.fillStyle = color;
                c.beginPath();
                c.arc(ox + i % g.w * sz + sz / 2, 15 + Math.floor(i / g.w) * sz + sz / 2, sz * .34, 0, Math.PI * 2);
                c.fill();
            }
            p.feedback.textContent = '已走 ' + g.moves + ' 格' + (g.kind === 'mouse-maze' ? ' · 探针保护 ' + g.lives + ' · ' + (g.dragging ? '正在牵引' : '点击当前位置开始牵引') : ' · 金色圆点为出口');
            return;
        }
        drawRunner(c, g);
        p.feedback.textContent = '通过 ' + g.passed + ' / ' + g.target + ' · 防护 ' + g.lives;
    }

    function drawRunner(c, g) {
        const grad = c.createLinearGradient(0, 0, 0, 320);
        grad.addColorStop(0, '#071723');
        grad.addColorStop(1, '#536778');
        c.fillStyle = grad;
        c.fillRect(0, 0, 680, 320);
        for (let i = 0; i < 52; i++) {
            c.fillStyle = i % 3 ? '#879aa6' : '#e4dcc1';
            c.fillRect((i * 149 % 680 - g.elapsed * 3 + 680) % 680, i * 47 % 155, 1.5, 1.5);
        }
        c.fillStyle = '#a1bbb6';
        c.beginPath();
        c.arc(560, 67, 27, 0, 7);
        c.fill();
        c.fillStyle = '#4d7882';
        c.beginPath();
        c.ellipse(554, 65, 13, 23, .7, 0, 7);
        c.fill();
        for (let layer = 0; layer < 3; layer++) {
            c.fillStyle = ['#253c4c', '#364d5b', '#53646a'][layer];
            c.beginPath();
            c.moveTo(0, 265);
            for (let x = -100; x <= 800; x += 45) c.lineTo(x, 210 - layer * 4 - Math.abs(Math.sin((x + g.elapsed * (layer + 1) * 12) / 110)) * 28);
            c.lineTo(680, 320);
            c.lineTo(0, 320);
            c.fill();
        }
        c.fillStyle = '#758084';
        c.fillRect(0, 270, 680, 50);
        for (let i = 0; i < 15; i++) {
            let x = (i * 67 - g.elapsed * g.speed) % 760;
            if (x < 0) x += 760;
            c.strokeStyle = '#525c61';
            c.beginPath();
            c.ellipse(x, 290 + i % 3 * 7, 12, 3, 0, 0, 7);
            c.stroke();
        }
        for (const o of g.obstacles) {
            c.save();
            c.translate(o.x, 270);
            if (o.kind === 2) {
                c.fillStyle = '#07141c';
                c.beginPath();
                c.moveTo(-8, 0);
                c.lineTo(8, 12);
                c.lineTo(18, 4);
                c.lineTo(32, 25);
                c.lineTo(45, 0);
                c.fill();
            } else {
                c.fillStyle = '#bd9d66';
                if (o.kind === 0) {
                    c.fillRect(0, -43, 8, 43);
                    c.fillRect(30, -43, 8, 43);
                    c.fillRect(0, -40, 38, 13);
                } else {
                    c.fillRect(0, -104, 8, 62);
                    c.fillRect(30, -104, 8, 62);
                    c.fillRect(-5, -58, 48, 14);
                }
                c.strokeStyle = '#293d43';
                for (let i = 0; i < 4; i++) {
                    c.beginPath();
                    c.moveTo(i * 10, -(o.kind ? 58 : 40));
                    c.lineTo(i * 10 + 8, -(o.kind ? 44 : 27));
                    c.stroke();
                }
            }
            c.restore();
        }
        c.save();
        c.translate(g.x, 268 - g.y);
        if (g.invulnerable && Math.floor(g.elapsed * 14) % 2) c.globalAlpha = .45;
        if (g.slide) {
            c.fillStyle = '#687c7c';
            c.beginPath();
            c.roundRect(-14, -26, 29, 22, 7);
            c.fill();
            c.fillStyle = '#cfccb2';
            c.beginPath();
            c.arc(9, -17, 9, 0, 7);
            c.fill();
            c.fillStyle = '#213e4b';
            c.fillRect(8, -22, 8, 6);
            c.strokeStyle = '#c0b7a0';
            c.lineWidth = 5;
            c.beginPath();
            c.moveTo(-10, -3);
            c.lineTo(13, -3);
            c.stroke();
            c.restore();
            return;
        }
        const stride = g.y ? 0 : Math.sin(g.elapsed * 16) * 12;
        c.lineWidth = 9;
        c.strokeStyle = '#c0b7a0';
        for (const d of [-1, 1]) {
            c.beginPath();
            c.moveTo(d * 5, -23);
            c.lineTo(d * stride, -5);
            c.stroke();
            c.fillStyle = '#27343c';
            c.fillRect(d * stride - 6, -7, 13, 7);
        }
        c.fillStyle = '#495e67';
        c.fillRect(-13, -51, 26, 29);
        c.fillStyle = '#c3bda7';
        c.fillRect(-19, -45, 8, 23);
        c.fillStyle = '#d6d1b8';
        c.beginPath();
        c.arc(0, -61, 16, 0, 7);
        c.fill();
        c.fillStyle = '#193a50';
        c.beginPath();
        c.ellipse(5, -61, 11, 9, 0, 0, 7);
        c.fill();
        c.fillStyle = '#c1dde0';
        c.fillRect(7, -65, 5, 2);
        c.restore();
    }

    a.expandedKey = function (p, code) {
        const g = p.classic;
        if (!own(g)) return base.key.call(this, p, code);
        if (!p.started || p.result) return false;
        if (g.kind === 'maze') {
            const d = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'].indexOf(code);
            if (d < 0) return false;
            MoonExpedition.mazeMove(g, g.pos + [-g.w, 1, g.w, -1][d]);
            draw(p);
            done(p);
            return true;
        }
        if (g.kind === 'side-runner') {
            if ((code === 'Space' || code === 'ArrowUp') && !g.y && !g.slide) g.vy = 390; else if (code === 'ArrowDown' && !g.y) g.slide = .72; else return false;
            draw(p);
            return true;
        }
        return false;
    };
    a.tick = function (p, dt) {
        if (!own(p.classic)) return base.tick.call(this, p, dt);
        if (MoonExpedition.tick(p.classic, dt)) {
            draw(p);
            done(p);
        }
    };
    a.reveal = function (p) {
        if (!own(p.classic)) return base.reveal.call(this, p);
        const g = p.classic, el = document.createElement('p');
        el.className = 'classic-solution';
        el.textContent = g.kind === 'lights-out' ? '可解按键组合（从初始局面）：' + g.solution.map(i => i + 1).join('、') : g.kind === 'logic-grid' ? g.people.map((v, i) => v + '：' + g.items[g.answer[0][i]] + ' / ' + g.rooms[g.answer[1][i]]).join('；') : g.kind === 'nonogram' ? '完整图像如下。注意连续黑格之间的空白。' : '保护程序接管，已显示可行路线。R 可重试本题。';
        p.controls.append(el);
        if (g.kind.includes('maze')) g.trail = g.route;
        if (g.kind === 'nonogram') g.cells = [...g.answer];
        const root = document.createElement('div');
        p.controls.append(root);
        board(p, root, false);
    };
    const tutorials = MoonTutorials;
    MoonTutorials = {
        ...tutorials, render(p) {
            if (!own(p.classic)) return tutorials.render(p);
            const root = document.createElement('section');
            root.className = 'workshop-guide';
            root.innerHTML = '<ol class="workshop-phases"><li>① 讲解规则</li><li>② 分步演示</li><li>③ 正式游戏</li></ol>';
            p.controls.append(root);
            if (p.introPhase === 'rules') {
                rules[p.classic.kind].forEach((v, i) => {
                    const el = document.createElement('p');
                    el.className = 'rule-row';
                    el.textContent = (i + 1) + '. ' + v;
                    root.append(el);
                });
                return;
            }
            const step = p.workshopStep || 0, g = MoonExpedition.create(p.classic.kind, {seed: 13, difficulty: 'easy'});
            let caption = '先确认绿色入口、线索或初始状态。';
            if (g.kind === 'lights-out') {
                g.cells.fill(0);
                MoonExpedition.toggle(g, 4);
                if (step >= 2) MoonExpedition.toggle(g, 4);
                caption = ['中心灯及四邻亮起。', '点击中心：它自己和四邻都会翻转。', '五盏灯同时熄灭。', '角落按钮只影响本格和两个邻格。', '同一格按两次会恢复原状态。', '目标是全灭；正式局不要只追着亮灯乱点。'][step];
            } else if (g.kind.includes('maze')) {
                for (const i of g.route.slice(1, Math.max(1, Math.ceil(g.route.length * step / 5)))) MoonExpedition.mazeMove(g, i);
                caption = ['找到绿色入口与金色出口。', '沿相邻通道走，不能跨越深色墙。', '进入岔路可以原路返回。', '浅色足迹标记已经经过的位置。', '沿通路靠近出口，鼠标不能跳过墙壁。', '到达出口完成，正式迷宫会随机变化。'][step];
            } else if (g.kind === 'nonogram') {
                g.cells = g.answer.map((v, i) => i < g.answer.length * step / 5 ? v : 0);
                caption = ['先看行列两边的数字。', '从较长的连续段推导必填格。', '再用相交的列数字检查。', '不同数字段之间至少留一格空白。', '用×记下已确定的空位。', '所有行列同时满足，图像完成。'][step];
            } else if (g.kind === 'logic-grid') {
                g.answer.forEach((row, cat) => row.forEach((v, i) => {
                    if (i < g.n * step / 5) g.cells[cat][i * g.n + v] = 1;
                }));
                caption = ['先读全部线索，不要靠人物编号猜。', '先从明确对应和“不对应”开始排除。', '在设备表中点两次写入✓。', '把设备—房间和左右相邻线索带入右表。', '同一行、同一列最多有一个✓，其余可标×。', '两个表均完成才通过，不只填一张。'][step];
            } else {
                g.elapsed = step * .3;
                g.obstacles = [{x: 220 - step * 22, kind: step < 3 ? 0 : 1}];
                g.y = step === 2 ? 70 : 0;
                g.slide = step === 4 ? .5 : 0;
                caption = ['先看地形和前方障碍。', '低栏接近，准备起跳。', '空格起跳，腿部离开护栏高度。', '悬梁接近，保持地面姿态。', '按↓滑行，从横梁下面通过。', '落地后观察下一障碍；正式跑道按安全间隔随机生成。'][step];
            }
            const demo = document.createElement('div');
            root.append(demo);
            const fake = {
                ...p, classic: g, button: (text, fn, parent) => {
                    const b = document.createElement('button');
                    b.textContent = text;
                    parent.append(b);
                    return b;
                }, feedback: document.createElement('p')
            };
            board(fake, demo, false);
            const note = document.createElement('p');
            note.className = 'demo-caption';
            note.textContent = (step + 1) + ' / 6 · ' + caption;
            root.append(note);
            const bar = document.createElement('div');
            bar.className = 'guide-toolbar';
            root.append(bar);
            for (const [label, next] of [['上一步', Math.max(0, step - 1)], ['下一步', Math.min(5, step + 1)], ['从头重播', 0]]) p.button(label, () => {
                p.workshopStep = next;
                p.render();
            }, bar);
            p.button(p.workshopAuto ? '暂停演示' : '自动演示', () => {
                p.workshopAuto = !p.workshopAuto;
                p.workshopElapsed = 0;
                p.render();
            }, bar);
        }, tick(p, dt) {
            if (!own(p.classic)) return tutorials.tick(p, dt);
            if (p.workshopAuto) {
                p.workshopElapsed = (p.workshopElapsed || 0) + dt;
                if (p.workshopElapsed >= 3) {
                    p.workshopElapsed = 0;
                    p.workshopStep = Math.min(5, (p.workshopStep || 0) + 1);
                    if (p.workshopStep === 5) p.workshopAuto = false;
                    p.render();
                }
            }
        }
    };
    globalThis.MoonExpeditionArt = {drawRunner, names, rules};
})();
